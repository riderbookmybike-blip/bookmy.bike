import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { IDV_DEPRECIATION_RATE } from '@/lib/constants/pricingConstants';
import { getDeliveryChargeByDistance } from '@/lib/pricing/deliveryCharge';
import { OfferMode, rankCandidates, type CandidateOffer } from '@/lib/marketplace/winnerEngine';
import { calculateDistance } from '@/utils/geoUtils';

interface UseDealerContextProps {
    product: any;
    initialAccessories: any[];
    hasTouchedAccessories?: boolean;
    initialLocation?: any;
    selectedColor?: string;
    overrideDealerId?: string | null;
    disabled?: boolean;
    prefetchedPricing?: ServerPricing | null;
    prefetchedLocation?: any;
    offerMode?: OfferMode;
    retrySignal?: number;
}

const DEALER_FETCH_TIMEOUT_MS = 3000;

class DealerFetchTimeoutError extends Error {
    code = 'DEALER_FETCH_TIMEOUT';
    constructor() {
        super('DEALER_FETCH_TIMEOUT');
        this.name = 'DealerFetchTimeoutError';
    }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new DealerFetchTimeoutError()), ms);
    });
    return Promise.race([promise, timeout]).finally(() => {
        if (timer) clearTimeout(timer);
    });
};

const DEFAULT_PRICING_DEALER_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_PRICING_DEALER_TENANT_ID || '';

const CLIENT_STATE_MAP: Record<string, string> = {
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

const normalizeClientStateCode = (value?: string | null) => {
    if (!value) return 'MH';
    const key = String(value).toUpperCase().trim();
    if (CLIENT_STATE_MAP[key]) return CLIENT_STATE_MAP[key];
    if (/^[A-Z]{2}$/.test(key)) return key;
    return 'MH';
};

type RankedOffer = {
    vehicle_color_id?: string | null;
    dealer_id: string;
    dealer_name: string;
    studio_id?: string | null;
    best_offer: number;
    bundle_ids?: string[];
    distance_km?: number | null;
    delivery_charge?: number;
    delivery_tat_days?: number | null;
    updated_at?: string | null;
};

type OtherOffer = {
    dealer_id: string;
    dealer_name: string;
    studio_id?: string | null;
    best_offer: number;
    distance_km?: number | null;
    delivery_tat_days?: number | null;
    delivery_charge: number;
};

const rankOffers = (offers: RankedOffer[]) => {
    return [...offers].sort((a, b) => Number(a.best_offer || 0) - Number(b.best_offer || 0));
};

// SSPP v2: Server-side calculated pricing structure (SOT JSON)
interface ServerPricing {
    success: boolean;
    ex_showroom: number;
    rto: {
        STATE: number;
        BH: number | null;
        COMPANY: number | null;
        default: string;
    };
    insurance: {
        od: number;
        tp: number;
        gst_rate: number;
        base_total: number;
        addons: { id: string; label: string; price: number; gst: number; total: number; default: boolean }[];
    };
    dealer: {
        offer: number;
        name: string | null;
        id: string | null;
        studio_id?: string | null;
        distance_km?: number | null;
        is_serviceable: boolean;
        tat_effective_hours?: number | null;
        delivery_tat_days?: number | null;
    };
    final_on_road: number;
    location: {
        district: string | null;
        state_code: string;
    };
    meta: {
        vehicle_color_id: string;
        engine_cc: number;
        idv: number;
        calculated_at: string;
    };
    // Legacy fallback (deprecated)
    rto_breakdown?: { label: string; amount: number }[];
    insurance_breakdown?: { label: string; amount: number }[];
    error?: string;
    message?: string;
}

export function useSystemDealerContext({
    product,
    initialAccessories = [],
    hasTouchedAccessories = false,
    initialLocation,
    selectedColor,
    overrideDealerId,
    disabled = false,
    prefetchedPricing,
    prefetchedLocation,
    offerMode,
    retrySignal = 0,
}: UseDealerContextProps) {
    // These states hold the "Hydrated" versions of data implies Dealer-specific overrides
    const [dealerColors, setDealerColors] = useState<any[]>(product.colors || []);
    const [dealerAccessories, setDealerAccessories] = useState<any[]>(initialAccessories);

    // The "Best Offer" object to be passed to UI (ProductCard)
    const [bestOffer, setBestOffer] = useState<
        | {
              price: number;
              dealer: string;
              dealerId?: string;
              isServiceable: boolean;
              dealerLocation?: string;
              studio_id?: string;
              distance_km?: number | null;
              bundleValue?: number;
              bundlePrice?: number;
              delivery_tat_days?: number | null;
              tat_effective_hours?: number | null;
          }
        | undefined
    >(() => {
        if (!prefetchedPricing?.dealer) return undefined;
        return {
            price: Number(prefetchedPricing.dealer.offer || 0),
            dealer: prefetchedPricing.dealer.name || 'Studio',
            dealerId: prefetchedPricing.dealer.id || undefined,
            isServiceable: true,
            dealerLocation: prefetchedPricing.location?.district || prefetchedLocation?.district || undefined,
            studio_id: prefetchedPricing.dealer?.studio_id || undefined,
            distance_km: Number.isFinite(Number((prefetchedPricing.dealer as any)?.distance_km))
                ? Number((prefetchedPricing.dealer as any)?.distance_km)
                : null,
            bundleValue: 0,
            bundlePrice: 0,
            delivery_tat_days: Number.isFinite(Number((prefetchedPricing.dealer as any)?.delivery_tat_days))
                ? Number((prefetchedPricing.dealer as any)?.delivery_tat_days)
                : null,
            tat_effective_hours: Number.isFinite(Number((prefetchedPricing.dealer as any)?.tat_effective_hours))
                ? Number((prefetchedPricing.dealer as any)?.tat_effective_hours)
                : null,
        };
    });

    const [resolvedLocation, setResolvedLocation] = useState<any>(prefetchedLocation || initialLocation);
    const [otherOffers, setOtherOffers] = useState<OtherOffer[]>([]);
    const [mode, setMode] = useState<OfferMode>(offerMode || 'BEST_OFFER');

    // SSPP v1: Server-Side Calculated Pricing (Single Source of Truth!)
    const [serverPricing, setServerPricing] = useState<ServerPricing | null>(prefetchedPricing || null);
    const [dealerFetchState, setDealerFetchState] = useState<'IDLE' | 'GATED' | 'READY' | 'TIMEOUT' | 'ERROR'>('IDLE');
    const [dealerFetchNotice, setDealerFetchNotice] = useState<string | null>(null);

    const [isHydrating, setIsHydrating] = useState(!disabled);

    useEffect(() => {
        if (offerMode && offerMode !== mode) {
            setMode(offerMode);
        }
    }, [offerMode]);

    useEffect(() => {
        const hydrate = async () => {
            if (disabled) {
                setDealerFetchState('GATED');
                setDealerFetchNotice(null);
                setIsHydrating(false);
                return;
            }
            if (typeof window === 'undefined') {
                setIsHydrating(false);
                return;
            }

            try {
                setDealerFetchState('READY');
                setDealerFetchNotice(null);
                // 1. Resolve Location (Prop > LocalStorage)
                let district = initialLocation?.district || initialLocation?.city;
                let stateCode = initialLocation?.stateCode;
                let pincode = initialLocation?.pincode;
                let userLat: number | null = null;
                let userLng: number | null = null;

                if (!district || !userLat) {
                    const cached = localStorage.getItem('bkmb_user_pincode');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        district = district || parsed?.district || parsed?.taluka || parsed?.city;
                        stateCode = stateCode || parsed?.stateCode;
                        pincode = pincode || parsed?.pincode;
                        // Read lat/lng stored by pincode lookup
                        if (parsed?.lat && parsed?.lng) {
                            userLat = Number(parsed.lat);
                            userLng = Number(parsed.lng);
                        }
                        // Fallback for State Code if missing in cache but state name exists
                        if (!stateCode && parsed?.state?.toUpperCase?.().includes('MAHARASHTRA')) {
                            stateCode = 'MH';
                        }
                    }
                }

                // Gate: need lat/lng to proceed
                if (!userLat || !userLng) {
                    if (!overrideDealerId) {
                        setDealerFetchState('GATED');
                        setIsHydrating(false);
                        return;
                    }
                }

                // Update Resolved Location for UI
                if (district) {
                    setResolvedLocation({
                        district,
                        stateCode,
                        pincode,
                    });
                }

                const supabase = createClient();

                // 2. SSPP v1: Call Server-Side Pricing RPC (Single Source of Truth!)
                // selectedColor might be color NAME (e.g. 'pearl-igneous-black') or color ID
                // We need the actual skuId (UUID) from product.colors array
                let activeSku: string | undefined;

                if (selectedColor) {
                    // Try to find the color by id or name and get its skuId
                    const matchedColor = product.colors?.find(
                        (c: any) => c.id === selectedColor || c.name === selectedColor || c.skuId === selectedColor
                    );
                    activeSku = matchedColor?.skuId || product.colors?.[0]?.skuId;
                } else {
                    activeSku = product.colors?.[0]?.skuId;
                }

                const applyPricing = (pricingData: any) => {
                    setServerPricing(pricingData as ServerPricing);
                    setOtherOffers([]);

                    const dealerOffer = Number(pricingData?.dealer?.offer || 0);
                    const dealerTatDays = Number.isFinite(Number(pricingData?.dealer?.delivery_tat_days))
                        ? Number(pricingData.dealer.delivery_tat_days)
                        : null;
                    setBestOffer({
                        price: dealerOffer,
                        dealer: pricingData.dealer?.name || 'Studio',
                        dealerId: pricingData.dealer?.id || undefined,
                        isServiceable: pricingData.dealer?.is_serviceable ?? true,
                        dealerLocation: pricingData.location?.district || undefined,
                        studio_id: pricingData.dealer?.studio_id || undefined,
                        bundleValue: 0,
                        bundlePrice: 0,
                        tat_effective_hours: null,
                        delivery_tat_days: dealerTatDays,
                    });

                    setDealerColors(prev =>
                        prev.map((c: any) => {
                            if (c.skuId === activeSku) {
                                return {
                                    ...c,
                                    pricingOverride: {
                                        ...c.pricingOverride,
                                        exShowroom: pricingData.ex_showroom,
                                    },
                                    dealerOffer: pricingData.dealer?.offer || 0,
                                };
                            }
                            return c;
                        })
                    );
                };

                if (activeSku) {
                    // SOT: Skip base pricing re-fetch if server already provided it
                    // (prefetchedPricing is authoritative — client only resolves dealer delta)
                    const prefetchCoversActiveSku =
                        prefetchedPricing &&
                        Number(prefetchedPricing.ex_showroom) > 0 &&
                        String(prefetchedPricing.meta?.vehicle_color_id || '') === String(activeSku);

                    if (!prefetchCoversActiveSku) {
                        const activeStateCode = normalizeClientStateCode(stateCode);
                        let { data: priceRow } = await supabase
                            .from('cat_price_state_mh')
                            .select(
                                `
                            sku_id,
                            ex_showroom,
                            on_road_price,
                            rto_default_type,
                            rto_total_state,
                            rto_total_bh,
                            rto_total_company,
                            ins_gst_rate,
                            ins_sum_mandatory_insurance,
                            ins_sum_mandatory_insurance_gst_amount,
                            ins_gross_premium,
                            ins_own_damage_premium_amount,
                            ins_liability_only_premium_amount
                            `
                            )
                            .eq('sku_id', activeSku)
                            .eq('state_code', activeStateCode)
                            .eq('publish_stage', 'PUBLISHED')
                            .maybeSingle();

                        if (!priceRow && activeStateCode !== 'MH') {
                            const { data: fallbackPriceRow } = await supabase
                                .from('cat_price_state_mh')
                                .select(
                                    `
                            sku_id,
                            ex_showroom,
                            on_road_price,
                            rto_default_type,
                            rto_total_state,
                            rto_total_bh,
                            rto_total_company,
                            ins_gst_rate,
                            ins_sum_mandatory_insurance,
                            ins_sum_mandatory_insurance_gst_amount,
                            ins_gross_premium,
                            ins_own_damage_premium_amount,
                            ins_liability_only_premium_amount
                            `
                                )
                                .eq('sku_id', activeSku)
                                .eq('state_code', 'MH')
                                .eq('publish_stage', 'PUBLISHED')
                                .maybeSingle();
                            priceRow = fallbackPriceRow;
                        }

                        if (priceRow && Number(priceRow.rto_total_state) > 0) {
                            const pricingSnap = {
                                success: true,
                                ex_showroom: Number(priceRow.ex_showroom),
                                rto: {
                                    STATE: Number(priceRow.rto_total_state || 0),
                                    BH: Number(priceRow.rto_total_bh || 0),
                                    COMPANY: Number(priceRow.rto_total_company || 0),
                                    default: priceRow.rto_default_type || 'STATE',
                                },
                                insurance: {
                                    od: Number(priceRow.ins_own_damage_premium_amount || 0),
                                    tp: Number(priceRow.ins_liability_only_premium_amount || 0),
                                    gst_rate: Number(priceRow.ins_gst_rate || 18),
                                    base_total:
                                        Number(priceRow.ins_sum_mandatory_insurance || 0) +
                                        Number(priceRow.ins_sum_mandatory_insurance_gst_amount || 0),
                                    addons: [],
                                },
                                dealer: {
                                    offer: 0,
                                    name: null,
                                    id: null,
                                    studio_id: null,
                                    is_serviceable: true,
                                },
                                final_on_road: Number(priceRow.on_road_price || priceRow.ex_showroom || 0),
                                location: {
                                    district: 'ALL',
                                    state_code: activeStateCode,
                                },
                                meta: {
                                    vehicle_color_id: activeSku,
                                    engine_cc: (product.specs as any)?.engine_cc || 110,
                                    idv: Math.round(Number(priceRow.ex_showroom || 0) * IDV_DEPRECIATION_RATE),
                                    calculated_at: new Date().toISOString(),
                                },
                                rto_breakdown: [],
                                insurance_breakdown: [],
                            };
                            applyPricing(pricingSnap);
                        }
                    }
                } // end: if (!prefetchCoversActiveSku)

                // 3. Resolve Market Best Offers OR Specific Dealer Offers
                let relevantOffers: any[] = [];
                const useCandidateRpc = process.env.NEXT_PUBLIC_USE_CANDIDATE_RPC === 'true';

                if (overrideDealerId) {
                    // DIRECT DEALER RESOLUTION (Quote Context)
                    // Skip market RPC, fetch rules specifically for this dealer
                    // We need to construct 'offer' objects compatible with the logic below
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    const skuIds = (product.colors || [])
                        .map((c: any) => c.skuId)
                        .filter((id: string) => id && uuidRegex.test(id));

                    // Always fetch dealer info for consistent context
                    const { data: dealerInfo } = await supabase
                        .from('id_tenants')
                        .select('id, name, studio_id')
                        .eq('id', overrideDealerId)
                        .single();
                    const { data: dealerLoc } = await supabase
                        .from('id_locations')
                        .select('lat, lng')
                        .eq('tenant_id', overrideDealerId)
                        .eq('is_active', true)
                        .limit(1)
                        .maybeSingle();

                    const overrideDistanceKm =
                        Number.isFinite(Number(userLat)) &&
                        Number.isFinite(Number(userLng)) &&
                        Number.isFinite(Number((dealerLoc as any)?.lat)) &&
                        Number.isFinite(Number((dealerLoc as any)?.lng))
                            ? calculateDistance(
                                  Number(userLat),
                                  Number(userLng),
                                  Number((dealerLoc as any).lat),
                                  Number((dealerLoc as any).lng)
                              )
                            : null;

                    if (skuIds.length > 0) {
                        const { data: dealerRules } = await supabase
                            .from('cat_price_dealer')
                            .select('vehicle_color_id, offer_amount, tat_days, tat_effective_hours')
                            .in('vehicle_color_id', skuIds)
                            .eq('tenant_id', overrideDealerId)
                            .eq('state_code', stateCode || 'MH')
                            .eq('is_active', true);

                        if (dealerRules && dealerRules.length > 0) {
                            relevantOffers = dealerRules.map((r: any) => ({
                                vehicle_color_id: r.vehicle_color_id,
                                dealer_id: overrideDealerId,
                                dealer_name: dealerInfo?.name || 'Assigned Dealer',
                                studio_id: dealerInfo?.studio_id || null,
                                best_offer: Number(r.offer_amount),
                                distance_km: overrideDistanceKm,
                                delivery_charge: getDeliveryChargeByDistance(overrideDistanceKm),
                                bundle_ids: [],
                                tat_effective_hours: r.tat_effective_hours ?? null,
                                delivery_tat_days: r.tat_days ?? null,
                            }));
                        } else {
                            // Valid SKUs but no rules -> Dummy offer to lock dealer
                            relevantOffers = [
                                {
                                    vehicle_color_id: skuIds[0],
                                    dealer_id: overrideDealerId,
                                    dealer_name: dealerInfo?.name || 'Assigned Dealer',
                                    studio_id: dealerInfo?.studio_id || null,
                                    best_offer: 0,
                                    distance_km: overrideDistanceKm,
                                    delivery_charge: getDeliveryChargeByDistance(overrideDistanceKm),
                                    bundle_ids: [],
                                },
                            ];
                        }
                    } else {
                        // No valid SKUs (e.g. missing/invalid color mapping) -> keep dealer lock without synthetic SKU.
                        const safeSku = activeSku && uuidRegex.test(activeSku) ? activeSku : null;
                        relevantOffers = [
                            {
                                vehicle_color_id: safeSku,
                                dealer_id: overrideDealerId,
                                dealer_name: dealerInfo?.name || 'Assigned Dealer',
                                studio_id: dealerInfo?.studio_id || null,
                                best_offer: 0,
                                distance_km: overrideDistanceKm,
                                delivery_charge: getDeliveryChargeByDistance(overrideDistanceKm),
                                bundle_ids: [],
                            },
                        ];
                    }
                } else {
                    // MARKET BEST RESOLUTION — lat/lng 200km radius, best offer
                    const activeStateCode2 = normalizeClientStateCode(stateCode);
                    if (userLat && userLng) {
                        const { data: offers } = (await withTimeout(
                            (supabase as any).rpc('get_market_best_offers', {
                                p_user_lat: userLat,
                                p_user_lng: userLng,
                                p_state_code: activeStateCode2,
                                p_radius_km: 200,
                            }),
                            DEALER_FETCH_TIMEOUT_MS
                        )) as { data: any[]; error: any };

                        if (offers && offers.length > 0) {
                            const skuIds = (product.colors || []).map((c: any) => c.skuId).filter(Boolean);
                            relevantOffers = offers
                                .filter((o: any) => skuIds.includes(o.vehicle_color_id))
                                .map((o: any) => ({
                                    ...o,
                                    distance_km: Number.isFinite(Number(o?.distance_km)) ? Number(o.distance_km) : null,
                                    delivery_charge: getDeliveryChargeByDistance(
                                        Number.isFinite(Number(o?.distance_km)) ? Number(o.distance_km) : null
                                    ),
                                }));
                        }
                    }
                }

                if (relevantOffers.length === 0) {
                    setIsHydrating(false);
                    return;
                }

                // 5. Identify Winning Dealer (final_effective -> distance -> tat -> updated_at)
                let rankedOffers: any[] = [];

                if (useCandidateRpc) {
                    const bp =
                        Number(serverPricing?.ex_showroom || 0) +
                        Number(serverPricing?.rto?.STATE || 0) +
                        Number(serverPricing?.insurance?.base_total || 0);
                    rankedOffers = rankCandidates(
                        relevantOffers as CandidateOffer[],
                        mode,
                        bp,
                        getDeliveryChargeByDistance
                    );
                } else {
                    rankedOffers = rankOffers(relevantOffers as RankedOffer[]);
                }
                const winningOffer = rankedOffers[0];
                const winningDealerId = winningOffer.dealer_id;
                const winningDealerName = winningOffer.dealer_name;
                const winningOfferAmount = useCandidateRpc
                    ? Number((winningOffer as any).offer_amount || 0)
                    : Number(winningOffer.best_offer || 0);

                // SSPP v1.6: Merge Winner Details back into SSPP state
                setServerPricing(prev =>
                    prev
                        ? {
                              ...prev,
                              dealer: {
                                  id: winningDealerId,
                                  name: winningDealerName,
                                  studio_id: winningOffer.studio_id,
                                  distance_km: Number.isFinite(Number((winningOffer as any).distance_km))
                                      ? Number((winningOffer as any).distance_km)
                                      : null,
                                  offer: winningOfferAmount,
                                  is_serviceable: true,
                                  tat_effective_hours: null,
                                  delivery_tat_days: Number.isFinite(Number((winningOffer as any).delivery_tat_days))
                                      ? Number((winningOffer as any).delivery_tat_days)
                                      : null,
                              },
                          }
                        : null
                );

                setBestOffer({
                    price: winningOfferAmount,
                    dealer: winningDealerName,
                    dealerId: winningDealerId,
                    isServiceable: true,
                    dealerLocation: serverPricing?.location?.district || undefined,
                    studio_id: winningOffer.studio_id || undefined,
                    distance_km: Number.isFinite(Number((winningOffer as any).distance_km))
                        ? Number((winningOffer as any).distance_km)
                        : null,
                    bundleValue: 0,
                    bundlePrice: 0,
                    delivery_tat_days: Number.isFinite(Number(winningOffer.delivery_tat_days))
                        ? Number(winningOffer.delivery_tat_days)
                        : null,
                    tat_effective_hours: null,
                });

                setOtherOffers(
                    rankedOffers.slice(1).map((offer: RankedOffer) => ({
                        dealer_id: offer.dealer_id,
                        dealer_name: offer.dealer_name,
                        studio_id: offer.studio_id || null,
                        best_offer: useCandidateRpc
                            ? Number((offer as any).offer_amount || 0)
                            : Number(offer.best_offer || 0),
                        distance_km: Number.isFinite(Number(offer.distance_km)) ? Number(offer.distance_km) : null,
                        delivery_tat_days: Number.isFinite(Number(offer.delivery_tat_days))
                            ? Number(offer.delivery_tat_days)
                            : null,
                        delivery_charge: Number(offer.delivery_charge || 0),
                    }))
                );

                setDealerColors(prev =>
                    prev.map((c: any) => {
                        if (c.skuId === activeSku) {
                            return {
                                ...c,
                                dealerOffer: winningOfferAmount,
                            };
                        }
                        return c;
                    })
                );

                // 6. Update Accessories with Dealer Pricing Rules
                if ((initialAccessories || []).length > 0 && winningDealerId) {
                    const accessoryIds = initialAccessories.map((a: any) => a.id);
                    const { data: rules } = await supabase
                        .from('cat_price_dealer')
                        .select('vehicle_color_id, offer_amount, is_active')
                        .in('vehicle_color_id', accessoryIds)
                        .eq('tenant_id', winningDealerId)
                        .eq('state_code', stateCode || 'MH');

                    const ruleMap = new Map<string, any>();
                    rules?.forEach((r: any) => ruleMap.set(r.vehicle_color_id, r));

                    const updatedAccessories = initialAccessories.map((a: any) => {
                        const rule = ruleMap.get(a.id);

                        // If dealer has explicitly disabled this accessory, hide it
                        if (rule && rule.is_active === false) {
                            return null;
                        }

                        const offer = rule ? Number(rule.offer_amount) : 0;
                        const discountPrice = Math.max(0, Number(a.price) + offer);
                        const isInclusive = discountPrice === 0;

                        return {
                            ...a,
                            inclusionType: isInclusive ? 'INCLUSIVE' : 'EXCLUSIVE',
                            isMandatory: isInclusive,
                            discountPrice,
                        };
                    });

                    setDealerAccessories(updatedAccessories.filter(Boolean));
                }
            } catch (err) {
                if (
                    (err as any)?.code === 'DEALER_FETCH_TIMEOUT' ||
                    String((err as any)?.message || '') === 'DEALER_FETCH_TIMEOUT'
                ) {
                    setDealerFetchState('TIMEOUT');
                    setDealerFetchNotice('Dealer price unavailable. Try again.');
                    setOtherOffers([]);
                    setIsHydrating(false);
                    return;
                }
                setDealerFetchState('ERROR');
                console.error('Failed to hydrate dealer context:', err);
            } finally {
                setIsHydrating(false);
            }
        };

        hydrate();
    }, [product.id, initialLocation?.district, selectedColor, disabled, mode, retrySignal]);

    return {
        dealerColors,
        dealerAccessories,
        bestOffer,
        otherOffers,
        isHydrating,
        resolvedLocation,
        serverPricing, // SSPP v1: Single Source of Truth pricing breakdown
        dealerFetchState,
        dealerFetchNotice,
        offerMode: mode,
        setOfferMode: setMode,
    };
}
