
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { mapCatalogItems } from '@/utils/catalogMapper';
import { ProductVariant } from '@/types/productMaster';

export async function fetchCatalogServerSide(): Promise<ProductVariant[]> {
    const supabase = await createClient();
    const cookieStore = await cookies();

    // 1. Resolve Location from Cookies
    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    let stateCode = 'MH'; // Default
    let userLat: number | null = null;
    let userLng: number | null = null;
    let userDistrict: string | null = null;

    if (locationCookie) {
        try {
            const data = JSON.parse(locationCookie);
            if (data.stateCode) stateCode = data.stateCode;
            else if (data.state) {
                const stateMap: Record<string, string> = {
                    MAHARASHTRA: 'MH',
                    KARNATAKA: 'KA',
                    DELHI: 'DL',
                    GUJARAT: 'GJ',
                    TAMIL_NADU: 'TN',
                    TELANGANA: 'TS',
                    UTTAR_PRADESH: 'UP',
                    WEST_BENGAL: 'WB',
                    RAJASTHAN: 'RJ',
                };
                stateCode = stateMap[data.state.toUpperCase()] || data.state.substring(0, 2).toUpperCase();
            }

            if (data.lat && data.lng) {
                userLat = data.lat;
                userLng = data.lng;
            }
            if (data.district) {
                // Ensure district is clean string
                userDistrict = data.district;
            }
        } catch (e) {
            console.error('Error parsing location cookie:', e);
        }
    }

    // 2. Fetch Catalog Data (Identical Query to useCatalog)
    const { data, error } = await supabase
        .from('cat_items')
        .select(`
            id, type, name, slug, specs, price_base, brand_id,
            brand:cat_brands(name, logo_svg),
            template:cat_templates!inner(name, code, category),
            children:cat_items!parent_id(
                id,
                type,
                name,
                slug,
                specs,
                price_base,
                parent:cat_items!parent_id(name, slug),
                position,
                skus:cat_items!parent_id(
                    id,
                    type,
                    price_base,
                    is_primary,
                    image_url,
                    gallery_urls,
                    video_url,
                    zoom_factor,
                    is_flipped,
                    offset_x,
                    offset_y,
                    specs,
                    assets:cat_assets(id, type, url, is_primary, zoom_factor, is_flipped, offset_x, offset_y, position),
                    prices:cat_prices(ex_showroom_price, state_code, district, latitude, longitude)
                )
            )
        `)
        .eq('type', 'FAMILY')
        .eq('status', 'ACTIVE')
        .not('template_id', 'is', null)
        .eq('template.category', 'VEHICLE');

    if (error) {
        console.error('Server Catalog Fetch Error:', error);
        return [];
    }

    // 3. Fetch Rules
    const { data: ruleData } = await supabase
        .from('cat_reg_rules')
        .select('*')
        .eq('state_code', stateCode)
        .eq('status', 'ACTIVE');

    const { data: insuranceRuleData } = await supabase
        .from('cat_ins_rules')
        .select('*')
        .eq('status', 'ACTIVE') // Fixed from ACTIVE to 'ACTIVE' (Wait, code says .eq('status', 'ACTIVE'))
        .eq('vehicle_type', 'TWO_WHEELER')
        .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
        .order('state_code', { ascending: false })
        .limit(1);

    // 4. Map Items
    if (data) {
        return mapCatalogItems(
            data as any[],
            ruleData || [],
            insuranceRuleData || [],
            { stateCode, userLat, userLng, userDistrict }
        );
    }

    return [];
}
