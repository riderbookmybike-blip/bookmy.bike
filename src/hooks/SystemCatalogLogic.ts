import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { getAllProducts } from '@/actions/product';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

                let resolvedStateCode = cachedLocation.stateCode || stateCode;
                let resolvedUserDistrict = cachedLocation.district || userDistrict;
                if (!resolvedStateCode) {
                    setNeedsLocation(true);
                    setIsLoading(false);
                    return;
                }
                setNeedsLocation(false);

                if (cachedLocation.stateCode && cachedLocation.stateCode !== stateCode) {
                    setStateCode(cachedLocation.stateCode);
                }
                if (cachedLocation.district && cachedLocation.district !== userDistrict) {
                    setUserDistrict(cachedLocation.district);
                }

                // ---------------------------------------------------------
                // Canonical V2 catalog fetch
                const { products: catalogData, error: catalogError } = await getAllProducts(resolvedStateCode);
                if (catalogError) {
                    throw new Error(catalogError);
                }

                // Fetch Offers (Primary Dealer Only)
                let offerData: any = null;
                let resolvedDealerId: string | null = null;
                let resolvedDealerDistrict: string | null = null;

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

                // Fallback 1: Primary dealer for the state (district = ALL)
                if (!resolvedDealerId) {
                    const { data: primaryState } = await supabase
                        .from('id_primary_dealer_districts')
                        .select('tenant_id')
                        .eq('state_code', resolvedStateCode)
                        .eq('district', 'ALL')
                        .eq('is_active', true)
                        .maybeSingle();
                    if (primaryState?.tenant_id) {
                        resolvedDealerId = primaryState.tenant_id;
                    }
                }

                // Fallback 2: Primary dealer for the country (state = ALL, district = ALL)
                if (!resolvedDealerId) {
                    const { data: primaryCountry } = await supabase
                        .from('id_primary_dealer_districts')
                        .select('tenant_id')
                        .eq('state_code', 'ALL')
                        .eq('district', 'ALL')
                        .eq('is_active', true)
                        .maybeSingle();
                    if (primaryCountry?.tenant_id) {
                        resolvedDealerId = primaryCountry.tenant_id;
                    }
                }

                // Fetch dealer info (studio_id, name) + align state code
                if (resolvedDealerId) {
                    const { data: dealerInfo } = await supabase
                        .from('id_tenants')
                        .select('studio_id, name')
                        .eq('id', resolvedDealerId)
                        .single();
                    setResolvedDealerIdState(resolvedDealerId);
                    setResolvedStudioId(dealerInfo?.studio_id || null);
                    setResolvedDealerName(dealerInfo?.name || null);

                    // Align state code from dealer location
                    const { data: dealerLoc } = await supabase
                        .from('id_locations')
                        .select('state, district')
                        .eq('tenant_id', resolvedDealerId)
                        .eq('is_active', true)
                        .order('type', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (dealerLoc?.state) {
                        const stateName = dealerLoc.state.toUpperCase();
                        const stateMap: Record<string, string> = { MAHARASHTRA: 'MH', KARNATAKA: 'KA', DELHI: 'DL' };
                        const matchedCode = stateMap[stateName] || stateName.substring(0, 2);
                        if (matchedCode !== resolvedStateCode) {
                            resolvedStateCode = matchedCode;
                        }
                    }
                    if (dealerLoc?.district) {
                        resolvedDealerDistrict = dealerLoc.district;
                        if (!resolvedUserDistrict) {
                            resolvedUserDistrict = dealerLoc.district;
                        }
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
                        studioName: item.studioName || resolvedDealerName || undefined,
                        dealerId: item.dealerId || resolvedDealerId || undefined,
                        studioCode: item.studioCode || resolvedStudioId || undefined,
                        dealerLocation:
                            item.dealerLocation || resolvedUserDistrict || resolvedDealerDistrict || undefined,
                    }));

                    let enrichedItems = mappedItems;

                    try {
                        const primarySkuIds = mappedItems
                            .map((item: any) => item.availableColors?.[0]?.id || item.skuIds?.[0])
                            .filter(Boolean) as string[];

                        if (primarySkuIds.length > 0) {
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
