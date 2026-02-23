import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';

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
}

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
        is_serviceable: boolean;
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
              bundleValue?: number;
              bundlePrice?: number;
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
            bundleValue: 0,
            bundlePrice: 0,
        };
    });

    const [resolvedLocation, setResolvedLocation] = useState<any>(prefetchedLocation || initialLocation);

    // SSPP v1: Server-Side Calculated Pricing (Single Source of Truth!)
    const [serverPricing, setServerPricing] = useState<ServerPricing | null>(prefetchedPricing || null);

    const [isHydrating, setIsHydrating] = useState(!disabled);

    useEffect(() => {
        const hydrate = async () => {
            if (disabled) {
                setIsHydrating(false);
                return;
            }
            if (typeof window === 'undefined') {
                setIsHydrating(false);
                return;
            }

            try {
                // 1. Resolve Location (Prop > LocalStorage)
                let district = initialLocation?.district || initialLocation?.city;
                let stateCode = initialLocation?.stateCode;
                let pincode = initialLocation?.pincode;

                if (!district) {
                    const cached = localStorage.getItem('bkmb_user_pincode');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        district = parsed?.district || parsed?.taluka || parsed?.city;
                        stateCode = parsed?.stateCode;
                        pincode = parsed?.pincode;

                        // Fallback for State Code if missing in cache but state name exists
                        if (!stateCode && parsed?.state?.toUpperCase?.().includes('MAHARASHTRA')) {
                            stateCode = 'MH';
                        }
                    }
                }

                if (!district && !overrideDealerId) {
                    setIsHydrating(false);
                    return;
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

                    const dealerOffer = Number(pricingData?.dealer?.offer || 0);
                    setBestOffer({
                        price: dealerOffer,
                        dealer: pricingData.dealer?.name || 'Studio',
                        dealerId: pricingData.dealer?.id || undefined,
                        isServiceable: pricingData.dealer?.is_serviceable ?? true,
                        dealerLocation: pricingData.location?.district || undefined,
                        studio_id: pricingData.dealer?.studio_id || undefined,
                        bundleValue: 0,
                        bundlePrice: 0,
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
                                    idv: Math.round(Number(priceRow.ex_showroom || 0) * 0.95),
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

                    if (skuIds.length > 0) {
                        const { data: dealerRules } = await supabase
                            .from('cat_price_dealer')
                            .select('vehicle_color_id, offer_amount, inclusion_type')
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
                                bundle_ids: [],
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
                                bundle_ids: [],
                            },
                        ];
                    }
                } else {
                    // MARKET BEST RESOLUTION (Default)
                    const { data: offers } = (await supabase.rpc('get_market_best_offers', {
                        p_district_name: district || 'ALL',
                        p_state_code: stateCode || 'MH',
                    })) as { data: any[]; error: any };

                    if (offers && offers.length > 0) {
                        const skuIds = (product.colors || []).map((c: any) => c.skuId).filter(Boolean);
                        relevantOffers = offers.filter((o: any) => skuIds.includes(o.vehicle_color_id));
                    }
                }

                if (relevantOffers.length === 0) {
                    setIsHydrating(false);
                    return;
                }

                // 5. Identify Winning Dealer
                // If overrideDealerId is set, it forces the winner.
                // Otherwise we take the first one from relevantOffers (Standard logic)
                const winningDealerId = relevantOffers[0].dealer_id;
                const bundleIds = new Set(relevantOffers[0].bundle_ids || []);
                const winningDealerName = relevantOffers[0].dealer_name;
                const winningOfferAmount = Number(relevantOffers[0].best_offer || 0);

                // SSPP v1.6: Merge Winner Details back into SSPP state
                setServerPricing(prev =>
                    prev
                        ? {
                              ...prev,
                              dealer: {
                                  id: winningDealerId,
                                  name: winningDealerName,
                                  studio_id: relevantOffers[0].studio_id,
                                  offer: winningOfferAmount,
                                  is_serviceable: true,
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
                    studio_id: relevantOffers[0].studio_id || undefined,
                    bundleValue: 0,
                    bundlePrice: 0,
                });

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
                        .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
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
                        const inclusionType =
                            rule?.inclusion_type || (bundleIds.has(a.id) ? 'BUNDLE' : a.inclusionType || 'OPTIONAL');
                        const discountPrice = Math.max(0, Number(a.price) + offer);

                        return {
                            ...a,
                            inclusionType,
                            isMandatory: inclusionType === 'MANDATORY',
                            discountPrice,
                        };
                    });

                    setDealerAccessories(updatedAccessories.filter(Boolean));
                }
            } catch (err) {
                console.error('Failed to hydrate dealer context:', err);
            } finally {
                setIsHydrating(false);
            }
        };

        hydrate();
    }, [product.id, initialLocation?.district, selectedColor, disabled]);

    return {
        dealerColors,
        dealerAccessories,
        bestOffer,
        isHydrating,
        resolvedLocation,
        serverPricing, // SSPP v1: Single Source of Truth pricing breakdown
    };
}
