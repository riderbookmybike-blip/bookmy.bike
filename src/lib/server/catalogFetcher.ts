
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { mapCatalogItems } from '@/utils/catalogMapper';
import { ProductVariant } from '@/types/productMaster';

export async function fetchCatalogServerSide(leadId?: string): Promise<ProductVariant[]> {
    const supabase = await createClient();
    const cookieStore = await cookies();

    // 1. Resolve Location from Cookies
    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    let stateCode = 'MH'; // Default
    let userLat: number | null = null;
    let userLng: number | null = null;
    let userDistrict: string | null = null;
    let dealerId: string | null = null;

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

    // 1.5 Resolve Dealer Context from Lead (if quoting)
    if (leadId) {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select('owner_tenant_id, customer_pincode')
            .eq('id', leadId)
            .single();

        if (lead) {
            // NEW LOGIC: Prefer Market Best price in the lead's district over the owner dealer's price
            if (lead.customer_pincode) {
                // We need to resolve district from pincode to get market best offers
                const { data: pincodeData } = await supabase
                    .from('loc_pincodes')
                    .select('district, state_code')
                    .eq('pincode', lead.customer_pincode)
                    .single();

                if (pincodeData) {
                    userDistrict = pincodeData.district;
                    stateCode = pincodeData.state_code;
                    // Intentionally NOT setting dealerId here to force 'get_market_best_offers' 
                    // in section 4 below.
                } else {
                    // Fallback to owner dealer if pincode unknown
                    dealerId = lead.owner_tenant_id;
                }
            } else {
                dealerId = lead.owner_tenant_id;
            }
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
                    assets:cat_assets!item_id(id, type, url, is_primary, zoom_factor, is_flipped, offset_x, offset_y, position),
                    prices:cat_prices!vehicle_color_id(ex_showroom_price, state_code, district, latitude, longitude)
                )
            )
        `)
        .eq('type', 'FAMILY')
        .eq('status', 'ACTIVE')
        .not('template_id', 'is', null)
        .eq('template.category', 'VEHICLE');

    if (error) {
        console.error('Server Catalog Fetch Error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
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

    // 4. Fetch Offers (Market Best or Specific Dealer)
    let offerData;
    if (dealerId) {
        const { data: dealerOffers } = await supabase.rpc('get_dealer_offers', {
            p_tenant_id: dealerId,
            p_state_code: stateCode
        });
        offerData = dealerOffers;
    } else {
        const { data } = await supabase.rpc('get_market_best_offers', {
            p_district_name: userDistrict || '',
            p_state_code: stateCode
        });
        offerData = data;
    }

    // 5. Map Items
    if (data) {
        return mapCatalogItems(
            data as any[],
            ruleData || [],
            insuranceRuleData || [],
            { stateCode, userLat, userLng, userDistrict, offers: offerData || [] }
        );
    }

    return [];
}
