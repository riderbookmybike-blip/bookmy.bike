import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { mapCatalogItems } from '@/utils/catalogMapper';

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
    category?: string;
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
            status?: string;
            price_base: number;
            specs?: any;
            prices?: {
                ex_showroom_price: number;
                state_code: string;
                district?: string;
                latitude?: number;
                longitude?: number;
                is_active?: boolean;
                rto?: any;
                insurance?: any;
                rto_breakdown?: any;
                insurance_breakdown?: any;
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
    const [locationVersion, setLocationVersion] = useState(0);
    const disableOffersRef = useRef(false);
    const allowDebug = process.env.NEXT_PUBLIC_DEBUG_TOOLS === 'true';
    const updateDebug = (data: Record<string, any>) => {
        if (!allowDebug || typeof window === 'undefined') return;
        (window as any).__BMB_DEBUG__ = {
            ...(window as any).__BMB_DEBUG__,
            ...data,
        };
    };
    const isValidUuid = (value: unknown) =>
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const resolveLocationFromCache = () => {
        if (typeof window === 'undefined') {
            return { stateCode: null, district: null, lat: null, lng: null, pincode: null };
        }
        const cached = localStorage.getItem('bkmb_user_pincode');
        if (!cached) {
            return { stateCode: null, district: null, lat: null, lng: null, pincode: null };
        }
        try {
            const data = JSON.parse(cached) as {
                state?: string;
                stateCode?: string;
                district?: string;
                taluka?: string;
                lat?: number;
                lng?: number;
                pincode?: string;
            };

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
                // Construct Label: "District, Code" e.g. "Pune, MH"
                if (typeof window !== 'undefined') {
                    // Update global debug context
                    const supabase = createClient();
                    const distFinal = dist || data.district || 'MUMBAI_FALLBACK';

                    (async () => {
                        const {
                            data: { user },
                        } = await supabase.auth.getUser();

                        const debugData = {
                            pricingSource: leadId ? 'PRIMARY_LEAD_DISTRICT' : 'PRIMARY_DEALER',
                            district: distFinal,
                            stateCode: code,
                            leadId: leadId,
                            locSource: 'CACHE',
                            pincode: (data as any).pincode || 'UNKNOWN',
                            userId: user?.email || user?.id || 'GUEST',
                        };

                        updateDebug(debugData);
                    })();
                }
            }

            return {
                stateCode: code || null,
                district: dist || null,
                lat: typeof data.lat === 'number' ? data.lat : null,
                lng: typeof data.lng === 'number' ? data.lng : null,
                pincode: data.pincode || null,
            };
        } catch (e) {
            console.error('Error parsing stored location:', e);
            return { stateCode: null, district: null, lat: null, lng: null, pincode: null };
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleLocationChanged = () => setLocationVersion(prev => prev + 1);
        window.addEventListener('locationChanged', handleLocationChanged);
        return () => window.removeEventListener('locationChanged', handleLocationChanged);
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const supabase = createClient();
                const cachedLocation = resolveLocationFromCache();

                let resolvedStateCode = cachedLocation.stateCode || stateCode;
                let resolvedUserDistrict = cachedLocation.district || userDistrict;
                if (!resolvedStateCode) resolvedStateCode = 'MH';

                if (cachedLocation.stateCode && cachedLocation.stateCode !== stateCode) {
                    setStateCode(cachedLocation.stateCode);
                }
                if (cachedLocation.district && cachedLocation.district !== userDistrict) {
                    setUserDistrict(cachedLocation.district);
                }

                // ---------------------------------------------------------
                // 🚀 PERFORMANCE LAYER: Materialized Summary (Read Model)
                // ---------------------------------------------------------
                // Attempt to fetch pre-calculated market data first
                const { data: rawSummaryData } = await supabase
                    .from('mat_market_summary')
                    .select('*')
                    .eq('state_code', resolvedStateCode)
                    .order('lowest_price', { ascending: true });

                // Fetch brands for mapping (lightweight)
                const { data: rawBrandsData } = await supabase.from('cat_brands').select('id, name, logo_svg');

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
                            type: 'PRODUCT',
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
                            category: 'VEHICLE',
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
                                pricingSource: 'Starting From',
                            },
                            availableColors: [],
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
                        .select(
                            `
                            id, type, name, slug, specs, price_base, brand_id, category,
                            brand:cat_brands(name, logo_svg)
                        `
                        )
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
                                _summary_image: summary?.image_url,
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

                        updateDebug({
                            pricingSource: 'MAT_VIEW_FAST_LANE',
                            marketOffersCount: summaryData!.length,
                        });
                        return; // EXIT EARLY - SUCCESS
                    }
                }

                // ---------------------------------------------------------
                // 🐢 SLOW PATH: Fallback to RPC/Deep Query
                // ---------------------------------------------------------

                // Fetch Families + Children (Variants) + Grandchildren (SKUs)
                const { data, error: dbError } = await supabase
                    .from('cat_items')
                    .select(
                        `
                        id, type, name, slug, specs, price_base, brand_id, category,
                        brand:cat_brands(name, logo_svg),
                        children:cat_items!parent_id(
                            id,
                            type,
                            name,
                            slug,
                            specs,
                            price_base,
                            category,
                            parent:cat_items!parent_id(name, slug),
                            position,
                            colors:cat_items!parent_id(
                                id,
                                type,
                                name,
                                slug,
                                specs,
                                position,
                                skus:cat_items!parent_id(
                                    id,
                                    type,
                                    status,
                                    price_base,
                                    category,
                                    specs,
                                    is_primary,
                                    image_url,
                                    gallery_urls,
                                    video_url,
                                    zoom_factor,
                                    is_flipped,
                                    offset_x,
                                    offset_y,
                                    assets:cat_assets!item_id(id, type, url, is_primary, zoom_factor, is_flipped, offset_x, offset_y, position),
                                    prices:cat_price_state!vehicle_color_id(ex_showroom_price, state_code, district, latitude, longitude, is_active)
                                )
                            ),
                            skus:cat_items!parent_id(
                                id,
                                type,
                                status,
                                price_base,
                                category,
                                specs,
                                is_primary,
                                image_url,
                                gallery_urls,
                                video_url,
                                zoom_factor,
                                is_flipped,
                                offset_x,
                                offset_y,
                                assets:cat_assets!item_id(id, type, url, is_primary, zoom_factor, is_flipped, offset_x, offset_y, position),
                                prices:cat_price_state!vehicle_color_id(ex_showroom_price, state_code, district, latitude, longitude, is_active)
                            )
                        )
                    `
                    )
                    .eq('type', 'PRODUCT')
                    .eq('status', 'ACTIVE')
                    .eq('category', 'VEHICLE');

                if (dbError) {
                    console.error('Database error fetching catalog:', JSON.stringify(dbError, null, 2));
                    throw dbError;
                }

                const { data: ruleData } = await supabase
                    .from('cat_reg_rules')
                    .select('*')
                    .eq('state_code', resolvedStateCode)
                    .eq('status', 'ACTIVE');

                const { data: insuranceRuleData } = await supabase
                    .from('cat_ins_rules')
                    .select('*')
                    .eq('status', 'ACTIVE')
                    .eq('vehicle_type', 'TWO_WHEELER')
                    .or(`state_code.eq.${resolvedStateCode},state_code.eq.ALL`)
                    .order('state_code', { ascending: false })
                    .limit(1);

                // Fetch Offers (Primary Dealer Only)
                let offerData: any = null;
                let resolvedDealerId: string | null = null;

                // Removed TEAM session lock from marketplace to unify experience

                if (leadId) {
                    const { data: lead } = await supabase
                        .from('crm_leads')
                        .select('tenant_id, selected_dealer_tenant_id, customer_pincode')
                        .eq('id', leadId)
                        .maybeSingle();

                    if (lead) {
                        // Precedence: selected_dealer_tenant_id > tenant_id
                        const leadTenantId = lead.selected_dealer_tenant_id || lead.tenant_id;

                        if (leadTenantId) {
                            // Verify tenant exists/active (optional but good for consistency)
                            const { data: tenant } = await supabase
                                .from('id_tenants')
                                .select('id')
                                .eq('id', leadTenantId)
                                .maybeSingle();

                            if (tenant) {
                                resolvedDealerId = leadTenantId;
                            }
                        }

                        // Also resolve location from lead if district not resolved yet
                        if (lead.customer_pincode && lead.customer_pincode.length === 6) {
                            const { data: pincodeData } = await supabase
                                .from('loc_pincodes')
                                .select('district, state_code')
                                .eq('pincode', lead.customer_pincode)
                                .maybeSingle();

                            if (pincodeData) {
                                resolvedUserDistrict = pincodeData.district || resolvedUserDistrict;
                                resolvedStateCode = pincodeData.state_code || resolvedStateCode;
                                setUserDistrict(resolvedUserDistrict || '');
                                setStateCode(resolvedStateCode || '');

                                updateDebug({
                                    pricingSource: resolvedDealerId
                                        ? 'PRIMARY (Lead Tenant)'
                                        : 'PRIMARY (Lead District)',
                                    district: resolvedUserDistrict || '',
                                    stateCode: resolvedStateCode || '',
                                    locSource: 'LEAD_PINCODE',
                                    pincode: lead.customer_pincode || '',
                                });
                            }
                        }
                    }
                }

                if (!resolvedDealerId && resolvedUserDistrict) {
                    const { data: primary } = await supabase
                        .from('id_primary_dealer_districts')
                        .select('tenant_id')
                        .eq('state_code', resolvedStateCode)
                        .ilike('district', resolvedUserDistrict)
                        .eq('is_active', true)
                        .maybeSingle();

                    if (primary?.tenant_id) {
                        resolvedDealerId = primary.tenant_id;
                    }
                }

                const hasValidDealer = Boolean(resolvedDealerId && isValidUuid(resolvedDealerId));

                if (resolvedStateCode && hasValidDealer && !disableOffersRef.current) {
                    try {
                        const { data: dealerOffers, error: rpcError } = await (supabase.rpc as any)(
                            'get_dealer_offers',
                            {
                                p_tenant_id: resolvedDealerId,
                                p_state_code: resolvedStateCode,
                            }
                        );
                        if (rpcError) {
                            console.error('[CATALOG] RPC error:', rpcError.message, rpcError.details || null);
                            disableOffersRef.current = true;
                            offerData = [];
                        } else {
                            offerData = dealerOffers || [];
                        }
                    } catch (err: any) {
                        console.error('[CATALOG] RPC error:', err?.message || err);
                        disableOffersRef.current = true;
                        offerData = [];
                    }
                }

                if (offerData && Array.isArray(offerData) && offerData.length > 0) {
                    const dealerIds = Array.from(
                        new Set(offerData.map((o: any) => o?.dealer_id).filter((id: any) => isValidUuid(id)))
                    );
                    if (dealerIds.length > 0) {
                        const { data: dealers } = await supabase
                            .from('id_tenants')
                            .select('id, location, studio_id, name') // Added name for debug
                            .in('id', dealerIds);

                        const dealerMap = (dealers || []).reduce(
                            (acc: Record<string, { loc: string; code: string; name: string }>, dealer: any) => {
                                if (dealer?.id) {
                                    acc[dealer.id] = {
                                        loc: dealer.location,
                                        code: dealer.studio_id,
                                        name: dealer.name,
                                    };
                                }
                                return acc;
                            },
                            {}
                        );

                        // Update Debugger with Real Primary Dealer Context
                        if (resolvedDealerId && dealerMap[resolvedDealerId]) {
                            const activeDealer = dealerMap[resolvedDealerId];
                            updateDebug({
                                dealerId: resolvedDealerId,
                                studioName: activeDealer.code
                                    ? `${activeDealer.name} (${activeDealer.code})`
                                    : activeDealer.name,
                                marketOffersCount: offerData?.length || 0,
                                pricingSource: 'PRIMARY_DEALER_RESOLVED',
                            });
                        }

                        offerData = offerData.map((offer: any) => ({
                            ...offer,
                            dealer_location: dealerMap[offer.dealer_id]?.loc,
                            studio_code: dealerMap[offer.dealer_id]?.code,
                        }));
                    }
                }

                if (data) {
                    // Get User Location from LocalStorage for Client Side Distance Calc
                    const userLat: number | null = cachedLocation.lat;
                    const userLng: number | null = cachedLocation.lng;

                    const hasEligibility = Boolean(hasValidDealer && (offerData as any[])?.length > 0);

                    const mappedItems = mapCatalogItems(data as any[], ruleData || [], insuranceRuleData || [], {
                        stateCode: resolvedStateCode,
                        userLat,
                        userLng,
                        userDistrict: resolvedUserDistrict,
                        offers: offerData || [],
                        requireEligibility: hasEligibility,
                    });

                    let enrichedItems = mappedItems;

                    try {
                        const primarySkuIds = mappedItems
                            .map((item: any) => item.availableColors?.[0]?.id || item.skuIds?.[0])
                            .filter(Boolean) as string[];

                        if (primarySkuIds.length > 0) {
                            // Published SOT: Read directly from cat_price_state instead of RPC
                            const { data: pricingRows } = await supabase
                                .from('cat_price_state')
                                .select(
                                    'vehicle_color_id, ex_showroom_price, rto_total, insurance_total, on_road_price, district'
                                )
                                .eq('state_code', resolvedStateCode || 'MH')
                                .in(
                                    'district',
                                    ['ALL', resolvedUserDistrict?.toUpperCase()].filter(Boolean) as string[]
                                )
                                .eq('is_active', true)
                                .in('vehicle_color_id', primarySkuIds);

                            const pricingMap = new Map<string, any>();
                            (pricingRows || []).forEach((row: any) => {
                                if (row?.vehicle_color_id) {
                                    const existing = pricingMap.get(row.vehicle_color_id);
                                    // Prefer district match over 'ALL' fallback
                                    if (!existing || row.district !== 'ALL') {
                                        pricingMap.set(row.vehicle_color_id, {
                                            ex_showroom: row.ex_showroom_price,
                                            rto_total: row.rto_total,
                                            insurance_total: row.insurance_total,
                                            final_on_road: row.on_road_price || row.ex_showroom_price,
                                            location: { district: row.district, state_code: resolvedStateCode },
                                        });
                                    }
                                }
                            });

                            enrichedItems = mappedItems.map((item: any) => {
                                const skuId = item.availableColors?.[0]?.id || item.skuIds?.[0];
                                const pricing = skuId ? pricingMap.get(skuId) : null;
                                if (!pricing) return item;

                                const pricingSource = [pricing?.location?.district, pricing?.location?.state_code]
                                    .filter(Boolean)
                                    .join(', ');

                                // Find dealer offer from offerData
                                const dealerOffer = (offerData || []).find((o: any) => o?.vehicle_color_id === skuId);
                                const offerDelta = Number(dealerOffer?.best_offer || 0);

                                return {
                                    ...item,
                                    serverPricing: pricing,
                                    price: {
                                        ...item.price,
                                        exShowroom: pricing?.ex_showroom ?? item.price?.exShowroom,
                                        onRoad: pricing?.final_on_road ?? item.price?.onRoad,
                                        offerPrice: (pricing?.final_on_road ?? item.price?.offerPrice) + offerDelta,
                                        discount: -offerDelta, // Negative = surge, Positive = savings
                                        pricingSource: pricingSource || item.price?.pricingSource,
                                        isEstimate: false,
                                    },
                                    studioName: dealerOffer?.dealer_name ?? item.studioName,
                                    dealerId: dealerOffer?.dealer_id ?? item.dealerId,
                                    // Flattened Dealer Context for UI
                                    studioCode: dealerOffer?.studio_code,
                                    dealerLocation: dealerOffer?.dealer_location,
                                };
                            });
                        }
                    } catch (pricingErr) {
                        console.error('Catalog pricing fetch failed:', pricingErr);
                    }

                    setItems(enrichedItems);

                    updateDebug({
                        marketOffersCount: (offerData as any[])?.length || 0,
                    });

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
                        code: err.code,
                    });
                }
                setError(err instanceof Error ? err.message : 'Unknown error');
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, [leadId, locationVersion]);

    return { items, isLoading, error, skuCount };
}
