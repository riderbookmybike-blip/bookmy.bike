import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { mapCatalogItems } from '@/utils/catalogMapper';

// State code to full name mapping
const STATE_NAMES: Record<string, string> = {
    'MH': 'Maharashtra',
    'KA': 'Karnataka',
    'TN': 'Tamil Nadu',
    'DL': 'Delhi',
    'UP': 'Uttar Pradesh',
    'GJ': 'Gujarat',
    'RJ': 'Rajasthan',
    'WB': 'West Bengal',
    'AP': 'Andhra Pradesh',
    'TS': 'Telangana',
    'KL': 'Kerala',
    'PB': 'Punjab',
    'HR': 'Haryana',
    'MP': 'Madhya Pradesh',
    'BR': 'Bihar',
    'OR': 'Odisha',
    'AS': 'Assam',
    'JH': 'Jharkhand',
    'UK': 'Uttarakhand',
    'CG': 'Chhattisgarh',
    'HP': 'Himachal Pradesh',
    'GA': 'Goa',
    'ALL': 'India',
};

// New Unified Schema Types
interface CatalogItemDB {
    id: string;
    type: string;
    name: string;
    slug: string;
    specs: any;
    price_base: number;
    brand_id: string;
    brand: { name: string; logo_svg?: string };
    template: { name: string; code: string; category: string };
    children?: {
        id: string;
        type: string;
        name: string;
        slug: string;
        displayName?: string;
        modelSlug?: string;
        specs?: any;
        price_base?: number;
        position?: number;
        skus?: {
            id: string;
            type: string;
            price_base: number;
            specs?: any;
            prices?: {
                ex_showroom_price: number;
                state_code: string;
                district?: string;
                latitude?: number;
                longitude?: number;
            }[];
        }[];
    }[];
}

export function useCatalog(leadId?: string) {
    const [items, setItems] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [skuCount, setSkuCount] = useState<number>(0);
    const [stateCode, setStateCode] = useState('MH');
    const [userDistrict, setUserDistrict] = useState<string | null>(null);
    const [locationLabel, setLocationLabel] = useState('Mumbai, MH');

    useEffect(() => {
        const resolveLocation = () => {
            if (typeof window === 'undefined') return;
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (!cached) return;
            try {
                const data = JSON.parse(cached) as { state?: string; stateCode?: string; district?: string; taluka?: string };

                // prefer stateCode
                let code = data.stateCode;
                const dist = data.district; // Capture district

                // Fallback map if strict stateCode missing
                if (!code && data.state) {
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
                    code = stateMap[data.state.toUpperCase()] || data.state.substring(0, 2).toUpperCase();
                }

                if (code) {
                    setStateCode(code);
                    if (dist) setUserDistrict(dist);
                    // Construct Label: "District, Code" e.g. "Pune, MH"
                    const talukaPart = data.district || data.taluka || '';
                    const label = talukaPart ? `${talukaPart}, ${code}` : code;
                    setLocationLabel(label);

                    if (typeof window !== 'undefined') {
                        (window as any).__BMB_DEBUG__ = {
                            ...(window as any).__BMB_DEBUG__,
                            pricingSource: leadId ? 'DEALER_OFFERS_RPC' : 'MARKET_BEST_RPC',
                            district: data.district || 'MUMBAI_FALLBACK',
                            leadId: leadId,
                            locSource: 'CACHE',
                            pincode: (data as any).pincode || 'UNKNOWN'
                        };
                    }
                }
            } catch (e) {
                console.error('Error parsing stored location:', e);
            }
        };

        resolveLocation();
        window.addEventListener('locationChanged', resolveLocation);
        return () => window.removeEventListener('locationChanged', resolveLocation);
    }, [stateCode, userDistrict]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const supabase = createClient();

                // Fetch Families + Children (Variants) + Grandchildren (SKUs)
                const { data, error: dbError } = await supabase
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
                                    specs,
                                    is_primary,
                                    image_url,
                                    gallery_urls,
                                    video_url,
                                    zoom_factor,
                                    is_flipped,
                                    offset_x,
                                     assets:cat_assets!item_id(id, type, url, is_primary, zoom_factor, is_flipped, offset_x, offset_y, position),
                                     prices:vehicle_prices!vehicle_color_id(ex_showroom_price, state_code, offer_amount)
                                )
                        )
                    `)
                    .eq('type', 'FAMILY')
                    .eq('status', 'ACTIVE')
                    .not('template_id', 'is', null)
                    .eq('template.category', 'VEHICLE');

                if (dbError) {
                    console.error('Database error fetching catalog:', JSON.stringify(dbError, null, 2));
                    throw dbError;
                }

                const { data: ruleData } = await supabase
                    .from('cat_reg_rules')
                    .select('*')
                    .eq('state_code', stateCode)
                    .eq('status', 'ACTIVE');

                const { data: insuranceRuleData } = await supabase
                    .from('cat_ins_rules')
                    .select('*')
                    .eq('status', 'ACTIVE')
                    .eq('vehicle_type', 'TWO_WHEELER')
                    .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
                    .order('state_code', { ascending: false })
                    .limit(1);

                // Fetch Offers (Market Best or Specific Dealer)
                let offerData;
                let resolvedDealerId: string | null = null;

                if (leadId) {
                    const { data: lead } = await supabase
                        .from('crm_leads')
                        .select('owner_tenant_id, customer_pincode')
                        .eq('id', leadId)
                        .single();

                    if (lead) {
                        // NEW LOGIC: Prefer Market Best price in the lead's district over the owner dealer's price
                        if (lead.customer_pincode && lead.customer_pincode.length === 6) {
                            const { data: pincodeData } = await supabase
                                .from('loc_pincodes')
                                .select('district, state_code')
                                .eq('pincode', lead.customer_pincode)
                                .single();

                            if (pincodeData) {
                                // Update local state for consistency
                                setUserDistrict(pincodeData.district);
                                setStateCode(pincodeData.state_code);
                                // Force null resolvedDealerId to trigger market best logic
                                resolvedDealerId = null;

                                if (typeof window !== 'undefined') {
                                    (window as any).__BMB_DEBUG__ = {
                                        ...(window as any).__BMB_DEBUG__,
                                        pricingSource: 'MARKET_BEST (Lead District)',
                                        district: pincodeData.district,
                                        locSource: 'LEAD_PINCODE',
                                        pincode: lead.customer_pincode
                                    };
                                }
                            } else {
                                resolvedDealerId = lead.owner_tenant_id;
                            }
                        } else {
                            resolvedDealerId = lead.owner_tenant_id;
                        }
                    }
                }

                if (resolvedDealerId) {
                    const { data: dealerOffers } = await supabase.rpc('get_dealer_offers', {
                        p_tenant_id: resolvedDealerId,
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

                if (data) {
                    // Get User Location from LocalStorage for Client Side Distance Calc
                    let userLat: number | null = null;
                    let userLng: number | null = null;
                    const cached = localStorage.getItem('bkmb_user_pincode');
                    if (cached) {
                        try {
                            const uData = JSON.parse(cached);
                            if (uData.lat && uData.lng) {
                                userLat = uData.lat;
                                userLng = uData.lng;
                            }
                        } catch (e) { }
                    }

                    const mappedItems = mapCatalogItems(
                        data as any[],
                        ruleData || [],
                        insuranceRuleData || [],
                        { stateCode, userLat, userLng, userDistrict, offers: offerData || [] }
                    );

                    setItems(mappedItems);

                    const { count: skuTotal, error: skuError } = await supabase
                        .from('cat_items')
                        .select('id', { count: 'exact', head: true })
                        .eq('type', 'SKU')
                        .eq('status', 'ACTIVE');
                    if (skuError) {
                        console.error('Database error fetching sku count:', JSON.stringify(skuError, null, 2));
                    } else {
                        setSkuCount(skuTotal || 0);
                    }
                } else {
                    setItems([]);
                }
            } catch (err: any) {
                // Ignore AbortError - expected in React StrictMode double-render
                if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
                    return;
                }
                console.error('Error fetching catalog:', err);
                if (err.message && err.details) {
                    console.error('Supabase Error Details:', {
                        message: err.message,
                        details: err.details,
                        hint: err.hint,
                        code: err.code
                    });
                }
                setError(err instanceof Error ? err.message : 'Unknown error');
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, [stateCode, userDistrict, leadId]);

    return { items, isLoading, error, skuCount };
}
