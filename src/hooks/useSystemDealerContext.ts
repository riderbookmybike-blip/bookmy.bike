import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';

interface UseDealerContextProps {
    product: any;
    initialAccessories: any[];
    hasTouchedAccessories?: boolean;
    initialLocation?: any;
    selectedColor?: string;
}

const DEFAULT_PRICING_DEALER_TENANT_ID =
    process.env.NEXT_PUBLIC_DEFAULT_PRICING_DEALER_TENANT_ID || '';

// SSPP v1: Server-side calculated pricing structure
interface ServerPricing {
    success: boolean;
    ex_showroom: number;
    rto: {
        total: number;
        type: string;
        breakdown: { label: string; amount: number }[];
    };
    insurance: {
        total: number;
        od: number;
        tp: number;
        gst_rate: number;
        breakdown: { label: string; amount: number }[];
    };
    dealer: {
        offer: number;
        name: string | null;
        id: string | null;
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
    error?: string;
    message?: string;
}

export function useSystemDealerContext({
    product,
    initialAccessories = [],
    hasTouchedAccessories = false,
    initialLocation,
    selectedColor
}: UseDealerContextProps) {
    // These states hold the "Hydrated" versions of data implies Dealer-specific overrides
    const [dealerColors, setDealerColors] = useState<any[]>(product.colors || []);
    const [dealerAccessories, setDealerAccessories] = useState<any[]>(initialAccessories);

    // The "Best Offer" object to be passed to UI (PhonePDPSticky / ProductCard)
    const [bestOffer, setBestOffer] = useState<{
        price: number;
        dealer: string;
        dealerId?: string;
        isServiceable: boolean;
        dealerLocation?: string;
        bundleValue?: number;
        bundlePrice?: number;
    } | undefined>(undefined);

    const [resolvedLocation, setResolvedLocation] = useState<any>(initialLocation);

    // SSPP v1: Server-Side Calculated Pricing (Single Source of Truth!)
    const [serverPricing, setServerPricing] = useState<ServerPricing | null>(null);

    const [isHydrating, setIsHydrating] = useState(true);

    useEffect(() => {
        const hydrate = async () => {
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

                if (!district) {
                    setIsHydrating(false);
                    return;
                }

                // Update Resolved Location for UI
                if (district) {
                    setResolvedLocation({
                        district,
                        stateCode,
                        pincode
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
                    stateCode
                });

                const applyPricing = (pricingData: any) => {
                    setServerPricing(pricingData as ServerPricing);

                    setBestOffer({
                        price: pricingData.ex_showroom,
                        dealer: pricingData.dealer?.name || 'Studio',
                        dealerId: pricingData.dealer?.id,
                        isServiceable: pricingData.dealer?.is_serviceable || false,
                        dealerLocation: pricingData.location?.district || undefined,
                        bundleValue: 0,
                        bundlePrice: 0
                    });

                    setDealerColors((prev) => prev.map((c: any) => {
                        if (c.skuId === activeSku) {
                            return {
                                ...c,
                                pricingOverride: {
                                    ...c.pricingOverride,
                                    exShowroom: pricingData.ex_showroom
                                },
                                dealerOffer: pricingData.dealer?.offer || 0
                            };
                        }
                        return c;
                    }));
                };

                const callPricingRpc = async (targetDistrict: string, targetState: string) => {
                    // @ts-ignore - Types might be outdated
                    const { data: pricingData, error: pricingError } = await supabase.rpc('get_variant_on_road_price_v1', {
                        p_vehicle_color_id: activeSku,
                        p_district_name: targetDistrict,
                        p_state_code: targetState,
                        p_registration_type: 'STATE' // Default to STATE, can be toggled by UI later
                    }) as { data: any, error: any };

                    if (pricingData && pricingData.success) {
                        applyPricing(pricingData);
                        return { ok: true };
                    }

                    if (pricingError) {
                        console.error('SSPP RPC Error:', pricingError, 'for activeSku:', activeSku);
                    } else if (pricingData && !pricingData.success) {
                        console.warn('SSPP RPC returned failure:', pricingData.error, pricingData.message);
                    }

                    return { ok: false };
                };

                if (activeSku) {
                    const primaryAttempt = await callPricingRpc(district, stateCode || 'MH');

                    if (!primaryAttempt.ok && DEFAULT_PRICING_DEALER_TENANT_ID) {
                        const { data: fallbackDealer } = await supabase
                            .from('id_tenants')
                            .select('id, name, slug, location, pincode')
                            .eq('id', DEFAULT_PRICING_DEALER_TENANT_ID)
                            .single();

                        const fallbackDistrict = fallbackDealer?.location || district;
                        const fallbackState = stateCode || 'MH';

                        if (fallbackDistrict) {
                            await callPricingRpc(fallbackDistrict, fallbackState);
                        }
                    }
                }

                // 3. Fetch Market Best Offers (Legacy - for accessories and bundle logic)
                // @ts-ignore - Types might be outdated for this RPC
                const { data: offers } = await supabase.rpc('get_market_best_offers', {
                    p_district_name: district,
                    p_state_code: stateCode || 'MH'
                }) as { data: any[], error: any };

                if (!offers || offers.length === 0) {
                    setIsHydrating(false);
                    return;
                }

                // 4. Filter Offers for Current Product
                const skuIds = (product.colors || []).map((c: any) => c.skuId).filter(Boolean);
                const relevantOffers = offers.filter((o: any) => skuIds.includes(o.vehicle_color_id));

                if (relevantOffers.length === 0) {
                    setIsHydrating(false);
                    return;
                }

                // 5. Identify Winning Dealer
                const winningDealerId = relevantOffers[0].dealer_id;
                const bundleIds = new Set(relevantOffers[0].bundle_ids || []);
                const winningDealerName = relevantOffers[0].dealer_name;

                // 6. Update Accessories with Dealer Pricing Rules
                if ((initialAccessories || []).length > 0 && winningDealerId) {
                    const accessoryIds = initialAccessories.map((a: any) => a.id);
                    const { data: rules } = await supabase
                        .from('id_dealer_pricing_rules')
                        .select('vehicle_color_id, offer_amount, inclusion_type')
                        .in('vehicle_color_id', accessoryIds)
                        .eq('tenant_id', winningDealerId)
                        .eq('state_code', stateCode || 'MH');

                    const ruleMap = new Map<string, any>();
                    rules?.forEach((r: any) => ruleMap.set(r.vehicle_color_id, r));

                    const updatedAccessories = initialAccessories.map((a: any) => {
                        const rule = ruleMap.get(a.id);
                        const offer = rule ? Number(rule.offer_amount) : 0;
                        const inclusionType = rule?.inclusion_type || (bundleIds.has(a.id) ? 'BUNDLE' : a.inclusionType || 'OPTIONAL');
                        const discountPrice = Math.max(0, Number(a.price) + offer);

                        return {
                            ...a,
                            inclusionType,
                            isMandatory: inclusionType === 'MANDATORY',
                            discountPrice
                        };
                    });

                    setDealerAccessories(updatedAccessories);
                }

            } catch (err) {
                console.error('Failed to hydrate dealer context:', err);
            } finally {
                setIsHydrating(false);
            }
        };

        hydrate();
    }, [
        product.id,
        initialLocation?.district,
        selectedColor
    ]);

    return {
        dealerColors,
        dealerAccessories,
        bestOffer,
        isHydrating,
        resolvedLocation,
        serverPricing // SSPP v1: Single Source of Truth pricing breakdown
    };
}
