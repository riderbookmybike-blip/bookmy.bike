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

                // Debug: Log what we're sending to RPC
                console.log('[SSPP Debug] RPC Params:', {
                    activeSku,
                    selectedColor,
                    productFirstColorSkuId: product.colors?.[0]?.skuId,
                    district,
                    stateCode,
                });

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
                    // SSPP v1.5: PRIORITIZE cat_price_state (Published SOT)
                    const { data: publishedRecord } = await supabase
                        .from('cat_price_state')
                        .select('*')
                        .eq('vehicle_color_id', activeSku)
                        .eq('state_code', stateCode || 'MH')
                        .eq('district', 'ALL')
                        .eq('is_active', true)
                        .order('district', { ascending: false }) // Stable fetch (state-level SOT)
                        .limit(1)
                        .single();

                    if (publishedRecord && (publishedRecord as any).rto_total > 0) {
                        const rec = publishedRecord as any;

                        // SOT Phase 3: Prefer new JSON columns, fallback to legacy
                        const hasRtoJson = rec.rto && typeof rec.rto === 'object' && rec.rto.STATE !== undefined;
                        const hasInsJson =
                            rec.insurance &&
                            typeof rec.insurance === 'object' &&
                            rec.insurance.base_total !== undefined;

                        const rtoData = hasRtoJson
                            ? rec.rto
                            : {
                                  STATE: parseFloat(rec.rto_total),
                                  BH: null,
                                  COMPANY: null,
                                  default: 'STATE',
                              };

                        const insData = hasInsJson
                            ? rec.insurance
                            : {
                                  od: Number((rec.insurance_breakdown as any)?.odPremium || 0),
                                  tp: Number((rec.insurance_breakdown as any)?.tpPremium || 0),
                                  gst_rate: 18,
                                  base_total: parseFloat(rec.insurance_total),
                                  addons: [],
                              };

                        // Legacy breakdown for UI compatibility
                        const legacyRtoBreakdown =
                            typeof rec.rto_breakdown === 'object' && rec.rto_breakdown
                                ? Object.entries(rec.rto_breakdown).map(([label, amount]) => ({
                                      label,
                                      amount: Number(amount),
                                  }))
                                : [];

                        const legacyInsBreakdown =
                            typeof rec.insurance_breakdown === 'object' && rec.insurance_breakdown
                                ? [
                                      {
                                          label: 'OD Premium',
                                          amount: Number((rec.insurance_breakdown as any).odPremium || 0),
                                          componentId: 'od',
                                      },
                                      {
                                          label: 'TP Premium',
                                          amount: Number((rec.insurance_breakdown as any).tpPremium || 0),
                                          componentId: 'tp',
                                      },
                                      {
                                          label: 'Zero Depreciation',
                                          amount: Number(
                                              (rec.insurance_breakdown as any).addons?.zeroDep ||
                                                  (rec.insurance_breakdown as any).zeroDep ||
                                                  0
                                          ),
                                          componentId: 'zeroDep',
                                      },
                                      {
                                          label: 'GST',
                                          amount: Number((rec.insurance_breakdown as any).gst || 0),
                                          componentId: 'gst',
                                      },
                                  ].filter(i => i.amount > 0)
                                : [];

                        const pricingSnap = {
                            success: true,
                            ex_showroom: parseFloat(rec.ex_showroom_price),
                            rto: rtoData,
                            insurance: insData,
                            dealer: {
                                offer: 0,
                                name: null,
                                id: null,
                                studio_id: null,
                                is_serviceable: true,
                            },
                            final_on_road: parseFloat(rec.on_road_price),
                            location: {
                                district: rec.district,
                                state_code: rec.state_code,
                            },
                            meta: {
                                vehicle_color_id: activeSku,
                                engine_cc: (product.specs as any)?.engine_cc || 110,
                                idv: Math.round(parseFloat(rec.ex_showroom_price) * 0.95),
                                calculated_at: new Date().toISOString(),
                            },
                            rto_breakdown: legacyRtoBreakdown,
                            insurance_breakdown: legacyInsBreakdown,
                        };
                        applyPricing(pricingSnap);
                    }
                }

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
                        // No valid SKUs (e.g. only Default) -> Dummy offer to lock dealer
                        // Use activeSku if valid UUID, else 'default' (which won't match but locks dealer)
                        const safeSku = activeSku && uuidRegex.test(activeSku) ? activeSku : 'default';
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
                    // @ts-ignore - Types might be outdated for this RPC
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
