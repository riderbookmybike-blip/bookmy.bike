import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { mapCatalogItems } from '@/utils/catalogMapper';
import { BMBDebug } from '@/types/debug';
import { Database } from '@/types/supabase';

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

// Interface for Materialized Summary
interface MarketSummary {
    id: string;
    state_code: string;
    family_id: string;
    brand_id: string;
    model_name: string;
    slug: string;
    lowest_price: number;
    sku_count: number;
    image_url: string | null;
    updated_at: string;
}

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

export function useSystemCatalogLogic(leadId?: string) {
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
                            stateCode: code,
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

                // ---------------------------------------------------------
                // 🚀 PERFORMANCE LAYER: Materialized Summary (Read Model)
                // ---------------------------------------------------------
                // Attempt to fetch pre-calculated market data first
                const { data: rawSummaryData, error: summaryError } = await supabase
                    .from('mat_market_summary')
                    .select('*')
                    .eq('state_code', stateCode)
                    .order('lowest_price', { ascending: true });

                // Fetch brands for mapping (lightweight)
                const { data: rawBrandsData } = await supabase
                    .from('cat_brands')
                    .select('id, name, logo_svg');

                const brandsData = rawBrandsData as { id: string; name: string; logo_svg: string | null }[] | null;

                const summaryData = rawSummaryData as unknown as MarketSummary[] | null;

                // Check if summary hits
                const hasSummary = summaryData && summaryData.length > 0;

                // NOTE: Fast Path disabled because mat_market_summary has incomplete data (only 5 items for MH).
                // Temporarily forcing full catalog load until the materialized view is fully populated.
                const disableFastPath = true;

                if (!disableFastPath && hasSummary && !leadId) {
                    // FAST PATH: Use pre-calculated data
                    // We need to map this simple structure to the ProductVariant type
                    // Note: Summary lacks full specs, but has critical Model/Price/Image info
                    // Ideally, we hydrate the full object, but for "Catalog View" this is often enough.

                    // However, existing UI components expect 'ProductVariant' with nested 'brand', etc.
                    // So we might need a lightweight mapping or just use this as a "Skeleton" and fetch details lazily?
                    // OR: We rely on the unified schema.

                    // STRATEGY: Hybrid.
                    // 1. Show Summary immediately.
                    // 2. Background fetch full data if needed? 
                    // Actually, let's stick to the Plan: If summary exists, use it.

                    // We need to match the type 'ProductVariant' approximately.
                    const fastItems: any[] = summaryData!.map(s => {
                        const brand = brandsData?.find(b => b.id === s.brand_id);
                        const makeName = brand?.name || 'Unknown';

                        return {
                            id: s.family_id,
                            type: 'FAMILY',
                            make: makeName,
                            model: s.model_name,
                            variant: s.model_name, // Summary represents the Family-as-Variant
                            displayName: `${makeName} ${s.model_name}`,
                            label: `${makeName} / ${s.model_name}`,
                            name: s.model_name,
                            slug: s.slug,
                            modelSlug: s.slug,
                            sku: `SKU-${s.slug}`.toUpperCase(),
                            status: 'ACTIVE',
                            // Standard Defaults for Summary
                            bodyType: 'MOTORCYCLE',
                            fuelType: 'PETROL',
                            price_base: s.lowest_price, // Pre-calculated lowest
                            brand_id: s.brand_id,
                            brand: { name: makeName, logo_svg: brand?.logo_svg },
                            // Construct a minimal structure for UI
                            specs: {},
                            template: { category: 'VEHICLE' },
                            children: [], // Details hidden in summary mode
                            // Custom field to indicate this is a summary
                            _isSummary: true,
                            image_url: s.image_url,
                            imageUrl: s.image_url,

                            // Pricing Object (Simulated for ModelCard compatibility)
                            price: {
                                exShowroom: s.lowest_price,
                                onRoad: Math.round(s.lowest_price * 1.12), // Rough estimate for UI feel before hydration
                                offerPrice: Math.round(s.lowest_price * 1.12),
                                discount: 0,
                                pricingSource: 'Starting From'
                            },
                            availableColors: []
                        };
                    });

                    // Fetch Brands to fill in the gaps (usually cached by SystemBrandsLogic anyway)
                    // But let's just do a quick enrichment if possible or leave it.
                    // Actually, let's execute the FULL FETCH for now to ensure we don't break UI,
                    // but verify the concept.

                    // WAIT. The prompt requirement is speed.
                    // If I return fastItems, I need to make sure UI handles it.

                    // Let's implement the FULL logic but use the Summary for *Optimization* if I can.
                    // Setting this aside: The standard "Solution" is to fetch items but use prices from summary?
                    // No, the goal is to avoid the heavy joins.

                    // Let's stick to the RPC for "correctness" in this step if I can't map 1:1, 
                    // OR execute the RPC but leverage the summary for sorting?

                    // CORRECT IMPLEMENTATION:
                    // The goal is to replace the main query.
                    // But 'mat_market_summary' doesn't have specs or brand logos (only IDs).
                    // So we still need `cat_items` for metadata.

                    // OPTIMIZED QUERY:
                    // 1. Get IDs from Summary (filtered/sorted).
                    // 2. Fetch only those IDs from `cat_items` (much faster than scanning all).

                    const familyIds = summaryData!.map(s => s.family_id);
                    const { data: rawFullData } = await supabase
                        .from('cat_items')
                        .select(`
                            id, type, name, slug, specs, price_base, brand_id,
                            brand:cat_brands(name, logo_svg),
                            template:cat_templates!inner(name, code, category)
                        `)
                        .in('id', familyIds);

                    const fullData = rawFullData as any[];

                    // Merge Summary Price into Full Data
                    if (fullData) {
                        const merged = fullData.map((item: any) => {
                            const summary = summaryData!.find(s => s.family_id === item.id);
                            return {
                                ...item,
                                children: [], // No need to fetch children! We have the price.
                                price_base: summary?.lowest_price || item.price_base,
                                _summary_image: summary?.image_url
                            };
                        });

                        // Sort by Summary Order (Price ASC)
                        merged.sort((a, b) => {
                            const pa = summaryData!.find(s => s.family_id === a.id)?.lowest_price || 0;
                            const pb = summaryData!.find(s => s.family_id === b.id)?.lowest_price || 0;
                            return pa - pb;
                        });

                        setItems(merged as any[]);
                        setIsLoading(false);

                        if (typeof window !== 'undefined') {
                            window.__BMB_DEBUG__ = {
                                ...window.__BMB_DEBUG__,
                                pricingSource: 'MAT_VIEW_FAST_LANE',
                                marketOffersCount: summaryData!.length
                            };
                        }
                        return; // EXIT EARLY - SUCCESS
                    }
                }

                // ---------------------------------------------------------
                // 🐢 SLOW PATH: Fallback to RPC/Deep Query
                // ---------------------------------------------------------

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
                                     prices:cat_prices!vehicle_color_id(ex_showroom_price, state_code, district, latitude, longitude, is_active)
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
                        .returns<{ owner_tenant_id: string | null; customer_pincode: string | null }[]>()
                        .single();

                    if (lead) {
                        // NEW LOGIC: Prefer Market Best price in the lead's district over the owner dealer's price
                        if (lead.customer_pincode && lead.customer_pincode.length === 6) {
                            const { data: pincodeData } = await supabase
                                .from('loc_pincodes')
                                .select('district, state_code')
                                .eq('pincode', lead.customer_pincode)
                                .returns<{ district: string | null; state_code: string | null }[]>()
                                .single();

                            if (pincodeData) {
                                // Update local state for consistency
                                setUserDistrict(pincodeData.district || '');
                                setStateCode(pincodeData.state_code || '');
                                // Force null resolvedDealerId to trigger market best logic
                                resolvedDealerId = null;

                                if (typeof window !== 'undefined') {
                                    window.__BMB_DEBUG__ = {
                                        ...window.__BMB_DEBUG__,
                                        pricingSource: 'MARKET_BEST (Lead District)',
                                        district: pincodeData.district || '',
                                        stateCode: pincodeData.state_code || '',
                                        locSource: 'LEAD_PINCODE',
                                        pincode: lead.customer_pincode || ''
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
                    const { data: dealerOffers } = await (supabase.rpc as any)('get_dealer_offers', {
                        p_tenant_id: resolvedDealerId,
                        p_state_code: stateCode
                    });
                    offerData = dealerOffers;
                } else {
                    const { data } = await (supabase.rpc as any)('get_market_best_offers', {
                        p_district: userDistrict || '',
                        p_state_code: stateCode
                    });
                    offerData = data;
                }

                if (offerData && Array.isArray(offerData) && offerData.length > 0) {
                    const dealerIds = Array.from(new Set(offerData.map((o: any) => o?.dealer_id).filter(Boolean)));
                    if (dealerIds.length > 0) {
                        const { data: dealers } = await supabase
                            .from('id_tenants')
                            .select('id, location')
                            .in('id', dealerIds);
                        const dealerLocationMap = (dealers || []).reduce((acc: Record<string, string>, dealer: any) => {
                            if (dealer?.id && dealer?.location) acc[dealer.id] = dealer.location;
                            return acc;
                        }, {});
                        offerData = offerData.map((offer: any) => ({
                            ...offer,
                            dealer_location: dealerLocationMap[offer.dealer_id]
                        }));
                    }
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

                    let enrichedItems = mappedItems;

                    try {
                        const primarySkuIds = mappedItems
                            .map((item: any) => item.availableColors?.[0]?.id || item.skuIds?.[0])
                            .filter(Boolean) as string[];

                        if (primarySkuIds.length > 0) {
                            const { data: pricingRows } = await (supabase.rpc as any)('get_catalog_prices_v1', {
                                p_vehicle_color_ids: primarySkuIds,
                                p_district_name: userDistrict || '',
                                p_state_code: stateCode || 'MH',
                                p_registration_type: 'STATE'
                            });

                            const pricingMap = new Map<string, any>();
                            (pricingRows || []).forEach((row: any) => {
                                if (row?.vehicle_color_id && row?.pricing) {
                                    pricingMap.set(row.vehicle_color_id, row.pricing);
                                }
                            });

                            enrichedItems = mappedItems.map((item: any) => {
                                const skuId = item.availableColors?.[0]?.id || item.skuIds?.[0];
                                const pricing = skuId ? pricingMap.get(skuId) : null;
                                if (!pricing) return item;

                                const pricingSource = [pricing?.location?.district, pricing?.location?.state_code]
                                    .filter(Boolean)
                                    .join(', ');

                                return {
                                    ...item,
                                    serverPricing: pricing,
                                    price: {
                                        ...item.price,
                                        exShowroom: pricing?.ex_showroom ?? item.price?.exShowroom,
                                        onRoad: pricing?.final_on_road ?? item.price?.onRoad,
                                        offerPrice: pricing?.final_on_road ?? item.price?.offerPrice,
                                        discount: pricing?.dealer?.offer ?? item.price?.discount,
                                        pricingSource: pricingSource || item.price?.pricingSource,
                                        isEstimate: false
                                    },
                                    studioName: pricing?.dealer?.name ?? item.studioName,
                                    dealerId: pricing?.dealer?.id ?? item.dealerId
                                };
                            });
                        }
                    } catch (pricingErr) {
                        console.error('Catalog pricing RPC failed:', pricingErr);
                    }

                    setItems(enrichedItems);

                    if (typeof window !== 'undefined') {
                        window.__BMB_DEBUG__ = {
                            ...window.__BMB_DEBUG__,
                            marketOffersCount: (offerData as any[])?.length || 0
                        };
                    }

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
