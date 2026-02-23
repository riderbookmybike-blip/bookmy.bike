import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { getAllProducts } from '@/actions/product';
import { getDealerOfferDeltasAction, getResolvedPricingContextAction } from '@/actions/pricingActions';

export function useSystemCatalogLogic(leadId?: string) {
    const [items, setItems] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [skuCount, setSkuCount] = useState<number>(0);
    const [stateCode, setStateCode] = useState('MH');
    const [userDistrict, setUserDistrict] = useState<string | null>(null);
    const [locationVersion, setLocationVersion] = useState(0);
    const [needsLocation, setNeedsLocation] = useState(false);
    const [resolvedDealerIdState, setResolvedDealerIdState] = useState<string | null>(null);
    const [resolvedStudioId, setResolvedStudioId] = useState<string | null>(null);
    const [resolvedDealerName, setResolvedDealerName] = useState<string | null>(null);
    const disableOffersRef = useRef(false);
    const updateDebug = (_data: Record<string, any>) => {};
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

                let resolvedStateCode = cachedLocation.stateCode || stateCode || 'MH';
                let resolvedUserDistrict = cachedLocation.district || userDistrict;
                if (!resolvedUserDistrict && !leadId) {
                    setNeedsLocation(true);
                    setIsLoading(false);
                    return;
                }
                setNeedsLocation(false);

                const resolvedContext = await getResolvedPricingContextAction({
                    leadId: leadId || undefined,
                    district: resolvedUserDistrict || undefined,
                    state: resolvedStateCode || undefined,
                });
                resolvedStateCode = resolvedContext.stateCode || resolvedStateCode || 'MH';
                resolvedUserDistrict = resolvedContext.district || resolvedUserDistrict;

                if (resolvedStateCode !== stateCode) setStateCode(resolvedStateCode);
                if (resolvedUserDistrict && resolvedUserDistrict !== userDistrict) {
                    setUserDistrict(resolvedUserDistrict);
                }

                // ---------------------------------------------------------
                // Canonical V2 catalog fetch
                const { products: catalogData, error: catalogError } = await getAllProducts(resolvedStateCode);
                if (catalogError) {
                    throw new Error(catalogError);
                }

                // Resolve dealer metadata for catalog cards (same context path as PDP)
                let offerData: any[] = [];
                let resolvedDealerId: string | null = resolvedContext.dealerId || null;
                let resolvedDealerDistrict: string | null = null;
                let resolvedDealerNameLocal: string | null = null;
                let resolvedStudioIdLocal: string | null = null;

                // Removed TEAM session lock from marketplace to unify experience

                // Fetch dealer info (studio_id, name, district)
                if (resolvedDealerId) {
                    const { data: dealerInfo } = await supabase
                        .from('id_tenants')
                        .select('studio_id, name')
                        .eq('id', resolvedDealerId)
                        .single();
                    resolvedStudioIdLocal = dealerInfo?.studio_id || null;
                    resolvedDealerNameLocal = dealerInfo?.name || null;
                    setResolvedDealerIdState(resolvedDealerId);
                    setResolvedStudioId(resolvedStudioIdLocal);
                    setResolvedDealerName(resolvedDealerNameLocal);

                    const { data: dealerLoc } = await supabase
                        .from('id_locations')
                        .select('district')
                        .eq('tenant_id', resolvedDealerId)
                        .eq('is_active', true)
                        .order('type', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (dealerLoc?.district) {
                        resolvedDealerDistrict = dealerLoc.district;
                        if (!resolvedUserDistrict) {
                            resolvedUserDistrict = dealerLoc.district;
                        }
                    }
                } else {
                    setResolvedDealerIdState(null);
                    setResolvedStudioId(null);
                    setResolvedDealerName(null);
                }

                const hasValidDealer = Boolean(resolvedDealerId && isValidUuid(resolvedDealerId));

                if (catalogData && catalogData.length > 0) {
                    // Get User Location from LocalStorage for Client Side Distance Calc
                    const userLat: number | null = cachedLocation.lat;
                    const userLng: number | null = cachedLocation.lng;

                    // Do not gate catalog visibility by dealer-offer coverage.
                    // Offers affect pricing deltas, not whether a model card appears.
                    const hasEligibility = false;

                    const mappedItems = catalogData.map((item: any) => ({
                        ...item,
                        price: {
                            ...item.price,
                            pricingSource:
                                item.price?.pricingSource ||
                                `${resolvedUserDistrict || resolvedDealerDistrict || 'ALL'}, ${resolvedStateCode}`,
                            isEstimate: false,
                        },
                        studioName: item.studioName || resolvedDealerNameLocal || resolvedDealerName || undefined,
                        dealerId: item.dealerId || resolvedDealerId || undefined,
                        studioCode: item.studioCode || resolvedStudioIdLocal || resolvedStudioId || undefined,
                        dealerLocation:
                            item.dealerLocation || resolvedUserDistrict || resolvedDealerDistrict || undefined,
                    }));

                    let enrichedItems = mappedItems;

                    try {
                        const primarySkuIds = mappedItems
                            .map((item: any) => item.availableColors?.[0]?.id || item.skuIds?.[0])
                            .filter(Boolean) as string[];

                        if (primarySkuIds.length > 0) {
                            if (hasValidDealer && resolvedDealerId && !disableOffersRef.current) {
                                try {
                                    const dealerOffers = await getDealerOfferDeltasAction({
                                        dealerId: resolvedDealerId,
                                        stateCode: resolvedStateCode,
                                        skuIds: primarySkuIds,
                                    });
                                    offerData = (dealerOffers || []).map((offer: any) => ({
                                        ...offer,
                                        dealer_id: resolvedDealerId,
                                        dealer_name: resolvedDealerNameLocal || null,
                                        dealer_location: resolvedDealerDistrict || resolvedUserDistrict || null,
                                        studio_code: resolvedStudioIdLocal || null,
                                    }));
                                } catch (err: any) {
                                    console.error('[CATALOG] SOT offer fetch error:', err?.message || err);
                                    disableOffersRef.current = true;
                                    offerData = [];
                                }
                            }

                            // Published SOT: Read directly from state pricing table (canonical)
                            const { data: priceRows, error: priceError } = await supabase
                                .from('cat_price_state_mh')
                                .select(
                                    `
                                    sku_id,
                                    ex_showroom,
                                    on_road_price,
                                    rto_total_state,
                                    ins_gross_premium,
                                    publish_stage
                                    `
                                )
                                .in('sku_id', primarySkuIds)
                                .eq('state_code', resolvedStateCode)
                                .eq('publish_stage', 'PUBLISHED');

                            if (priceError) {
                                throw priceError;
                            }

                            const pricingMap = new Map<string, any>();
                            (priceRows || []).forEach((row: any) => {
                                const skuId = row?.sku_id;
                                if (skuId && primarySkuIds.includes(skuId)) {
                                    const exShowroom = Number(row.ex_showroom) || 0;
                                    const onRoad = Number(row.on_road_price) || exShowroom;
                                    pricingMap.set(skuId, {
                                        ex_showroom: exShowroom,
                                        rto_total: Number(row.rto_total_state) || 0,
                                        insurance_total: Number(row.ins_gross_premium) || 0,
                                        final_on_road: onRoad,
                                        location: {
                                            district: resolvedUserDistrict || resolvedDealerDistrict || 'ALL',
                                            state_code: resolvedStateCode,
                                        },
                                    });
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
                                    studioCode: dealerOffer?.studio_code ?? item.studioCode,
                                    dealerLocation: dealerOffer?.dealer_location ?? item.dealerLocation,
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
                        .from('cat_skus')
                        .select('id', { count: 'exact', head: true })
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

    return {
        items,
        isLoading,
        error,
        skuCount,
        needsLocation,
        resolvedDealerId: resolvedDealerIdState,
        resolvedStudioId,
        resolvedDealerName,
    };
}
