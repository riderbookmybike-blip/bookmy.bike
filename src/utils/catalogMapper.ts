/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductVariant } from '@/types/productMaster';

// State code to full name mapping
export const STATE_NAMES: Record<string, string> = {
    MH: 'Maharashtra',
    KA: 'Karnataka',
    TN: 'Tamil Nadu',
    DL: 'Delhi',
    UP: 'Uttar Pradesh',
    GJ: 'Gujarat',
    RJ: 'Rajasthan',
    WB: 'West Bengal',
    AP: 'Andhra Pradesh',
    TS: 'Telangana',
    KL: 'Kerala',
    PB: 'Punjab',
    HR: 'Haryana',
    MP: 'Madhya Pradesh',
    BR: 'Bihar',
    OR: 'Odisha',
    AS: 'Assam',
    JH: 'Jharkhand',
    UK: 'Uttarakhand',
    CG: 'Chhattisgarh',
    HP: 'Himachal Pradesh',
    GA: 'Goa',
    ALL: 'India',
};

export interface CatalogItemDB {
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
                rto_total?: number;
                insurance_total?: number;
                rto?: any; // New JSON SOT
                insurance?: any; // New JSON SOT
                rto_breakdown?: any;
                insurance_breakdown?: any;
                on_road_price?: number;
                published_at?: string;
                state_code: string;
                district?: string;
                latitude?: number;
                longitude?: number;
            }[];
        }[];
    }[];
}

interface MapOptions {
    stateCode: string;
    userLat?: number | null;
    userLng?: number | null;
    userDistrict?: string | null;
    offers?: any[];
}

export function mapCatalogItems(
    rawData: CatalogItemDB[],
    ruleData: any[],
    insuranceRuleData: any[],
    options: MapOptions
): ProductVariant[] {
    const { stateCode, userLat, userLng, userDistrict } = options;
    const offers = Array.isArray(options?.offers) ? options!.offers : [];

    const effectiveRule: any = ruleData?.[0] || {
        id: 'default',
        stateCode,
        components: [{ id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true }],
    };
    const insuranceRule: any = insuranceRuleData?.[0];

    return rawData.flatMap((family: CatalogItemDB) => {
        const templateName = family.template?.name?.toLowerCase() || '';
        let bodyType: any = 'MOTORCYCLE';
        if (templateName.includes('scooter')) bodyType = 'SCOOTER';
        if (templateName.includes('helmet')) bodyType = 'ACCESSORY';

        const familyChildren = family.children || [];
        const variantChildren = familyChildren.filter(c => c.type === 'VARIANT');
        let displayVariants =
            variantChildren.length > 0 ? variantChildren : familyChildren.length > 0 ? familyChildren : [family];

        displayVariants = displayVariants.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

        return (displayVariants as any[]).map(variantItem => {
            const makeName =
                family.brand?.name ||
                family.specs?.brand ||
                family.specs?.make ||
                family.specs?.brand_name ||
                'Unknown';

            const variantSkus = (variantItem as any).skus;
            const isSkuItem = (variantItem as any).type === 'SKU';
            const allSkus = (
                Array.isArray(variantSkus) && variantSkus.length > 0 ? variantSkus : isSkuItem ? [variantItem] : []
            ) as any[];

            if (allSkus.length === 0 && Array.isArray(familyChildren)) {
                allSkus.push(
                    ...familyChildren.flatMap(c =>
                        c.type === 'SKU' ? [{ ...c, price_base: c.price_base ?? 0 }] : c.skus || []
                    )
                );
            }

            // Extract dealer/studio info from best offer match
            let studioName: string | undefined = undefined;
            let dealerId: string | undefined = undefined;
            let studioId: string | undefined = undefined;
            let dealerDistrict: string | undefined = undefined;
            if (offers && Array.isArray(offers)) {
                const skuIds = allSkus.map((s: any) => s.id);
                const dealerMatch = offers
                    .filter((o: any) => skuIds.includes(o.vehicle_color_id))
                    .sort((a: any, b: any) => Number(a.best_offer) - Number(b.best_offer))[0];
                if (dealerMatch) {
                    studioName = dealerMatch.dealer_name || undefined;
                    dealerId = dealerMatch.dealer_id || undefined;
                    studioId = dealerMatch.studio_id || undefined;
                    dealerDistrict = dealerMatch.district || dealerMatch.dealer_location || undefined;
                }
            }

            return {
                id: variantItem.id,
                type: 'VEHICLE',
                make: makeName,
                model: family.name,
                variant: variantItem.name || family.name,
                displayName:
                    `${makeName} ${family.name} ${variantItem.name !== family.name ? variantItem.name : ''}`.trim(),
                price_base: variantItem.price_base ?? 0,
                label: `${makeName} / ${family.name}`,
                slug: variantItem.slug,
                modelSlug: family.slug,
                sku: `SKU-${variantItem.slug}`.toUpperCase(),
                status: 'ACTIVE',
                bodyType,
                fuelType: family.specs?.fuel_type || 'PETROL',
                displacement: family.specs?.engine_cc,
                powerUnit: 'CC',
                segment: 'COMMUTER',
                rating: 4.5,

                price: (() => {
                    const allSkuPrices = allSkus.flatMap((sku: any) => sku.prices || []);
                    const skuPrices = allSkuPrices.filter((p: any) => !p.district || p.district === 'ALL');
                    const effectivePrices = skuPrices.length > 0 ? skuPrices : allSkuPrices;
                    let activePriceObj = null;
                    let pricingSource = '';
                    let dealerLocation: string | undefined = undefined;
                    let dealerStudioId: string | undefined = studioId;
                    let isEstimate = false;

                    // 1. Find Best Offer from RPC results
                    let bestOfferAmount = 0;
                    let bundleValueAmount = 0;
                    let bundlePriceAmount = 0;
                    if (offers && Array.isArray(offers)) {
                        const skuIds = allSkus.map((s: any) => s.id);
                        const match = offers
                            .filter((o: any) => skuIds.includes(o.vehicle_color_id))
                            .sort((a: any, b: any) => Number(a.best_offer) - Number(b.best_offer))[0];

                        if (match) {
                            bestOfferAmount = Number(match.best_offer);
                            bundleValueAmount = Number(match.bundle_value || 0);
                            if (match.bundle_price !== undefined && match.bundle_price !== null) {
                                bundlePriceAmount = Number(match.bundle_price || 0);
                            } else {
                                bundlePriceAmount = bundleValueAmount;
                            }
                            dealerLocation = match.district || match.dealer_location || dealerDistrict || undefined;
                            dealerStudioId = match.studio_id || dealerStudioId;
                        }
                    }

                    if (dealerLocation && !pricingSource) {
                        pricingSource = dealerStudioId ? `${dealerLocation} • ${dealerStudioId}` : dealerLocation;
                    }

                    // 2. Find Location/Distance match from cat_price_state
                    if (effectivePrices.length > 0) {
                        // A. Exact District/Point Match
                        if (userLat && userLng) {
                            const withDistance = effectivePrices.map((p: any) => {
                                if (!p.latitude || !p.longitude) return { ...p, distance: 999999 };
                                const dist = Math.sqrt(
                                    Math.pow(p.latitude - userLat, 2) + Math.pow(p.longitude - userLng, 2)
                                );
                                return { ...p, distance: dist };
                            });
                            withDistance.sort((a: any, b: any) => a.distance - b.distance);
                            activePriceObj = withDistance[0];
                        }

                        // A.5 District Name Match
                        if (!activePriceObj && userDistrict) {
                            activePriceObj = effectivePrices.find(
                                (p: any) => p.district?.toLowerCase().trim() === userDistrict?.toLowerCase().trim()
                            );
                        }

                        // B. State Match (Fallback)
                        if (!activePriceObj) {
                            activePriceObj = effectivePrices.find((p: any) => p.state_code === stateCode);
                        }

                        // C. Lowest Price (Hard Fallback)
                        if (!activePriceObj) {
                            activePriceObj = effectivePrices.reduce((min: any, curr: any) => {
                                return curr.ex_showroom_price < min.ex_showroom_price ? curr : min;
                            }, effectivePrices[0]);
                            isEstimate = true;
                        }

                        if (activePriceObj && !pricingSource) {
                            const stateName = STATE_NAMES[activePriceObj.state_code] || activePriceObj.state_code;
                            const sourceParts = [];
                            if (activePriceObj.district) sourceParts.push(activePriceObj.district);
                            sourceParts.push(stateName);
                            pricingSource = sourceParts.join(', ');
                            if (isEstimate) pricingSource = `Best: ${pricingSource}`;
                            // If we have a best offer, we might want to override or supplement the pricing source
                            // but for now we keep it as the location description.
                        }
                    }

                    // 3. Calculate Final Prices with Improved Fallback
                    // Try: cat_price_state.on_road_price -> cat_price_state.ex_showroom -> Base Fallback
                    let baseExShowroom = 0;
                    let onRoadTotal = 0;

                    if (activePriceObj?.ex_showroom_price) {
                        baseExShowroom = activePriceObj.ex_showroom_price;
                        // Use Published On-Road if available, else Ex-Showroom (Legacy behavior)
                        onRoadTotal = activePriceObj.on_road_price || activePriceObj.ex_showroom_price;
                    } else {
                        // Fallback: Use price_base from SKU/Variant/Family hierarchy
                        const firstSku = allSkus.length > 0 ? allSkus[0] : null;
                        baseExShowroom =
                            firstSku?.price_base || (variantItem as any).price_base || family.price_base || 0;
                        onRoadTotal = baseExShowroom;

                        // Mark as estimate since we're using base price instead of location-specific
                        if (baseExShowroom > 0 && !pricingSource) {
                            const stateName = STATE_NAMES[stateCode] || stateCode;
                            pricingSource = `Base: ${stateName}`;
                            isEstimate = true;
                        }
                    }

                    // Dealer Offer Application (Delta-based)
                    // best_offer is a delta: +ve = surge (price increases), -ve = discount (price decreases).

                    const offerPrice = onRoadTotal + bestOfferAmount;
                    const bundleSavingsAmount = Math.max(0, Math.round(bundleValueAmount - bundlePriceAmount));

                    return {
                        exShowroom: baseExShowroom,
                        onRoad: Math.round(onRoadTotal),
                        offerPrice: Math.round(offerPrice),
                        discount: bestOfferAmount < 0 ? Math.abs(bestOfferAmount) : 0,
                        bundleValue: Math.round(bundleValueAmount),
                        bundlePrice: Math.round(bundlePriceAmount),
                        bundleSavings: bundleSavingsAmount,
                        totalSavings: (bestOfferAmount < 0 ? Math.abs(bestOfferAmount) : 0) + bundleSavingsAmount,
                        pricingSource,
                        isEstimate,
                        // NEW: Pass through granular JSON from DB (SOT)
                        rto: activePriceObj?.rto,
                        insurance: activePriceObj?.insurance,
                        rto_breakdown: activePriceObj?.rto_breakdown,
                        insurance_breakdown: activePriceObj?.insurance_breakdown,
                    };
                })(),

                skuIds: Array.from(new Set(allSkus.map((sku: any) => sku.id).filter(Boolean))),

                specifications: (() => {
                    const vs = variantItem.specs || {};
                    const fs = family.specs || {};

                    const getSpec = (keys: string[]) => {
                        for (const key of keys) {
                            if (vs[key]) return vs[key];
                            if (fs[key]) return fs[key];
                        }
                        return undefined;
                    };

                    return {
                        engine: {
                            displacement: getSpec(['engine_cc', 'engine_capacity']),
                            maxPower: getSpec(['max_power']),
                            maxTorque: getSpec(['max_torque']),
                        },
                        transmission: {
                            type: getSpec(['transmission_type']) || 'Manual',
                            gears: getSpec(['gears']),
                        },
                        battery: {
                            range: getSpec(['range_eco', 'range']),
                            chargingTime: getSpec(['charging_time']),
                        },
                        dimensions: {
                            seatHeight: (() => {
                                const val = getSpec(['seat_height', 'seat_height_mm', 'saddle_height']);
                                return val ? `${val} mm` : undefined;
                            })(),
                            kerbWeight: (() => {
                                const val = getSpec(['weight', 'kerb_weight', 'curb_weight', 'weight_kg']);
                                return val ? `${val} kg` : undefined;
                            })(),
                            curbWeight: (() => {
                                const val = getSpec(['weight', 'kerb_weight', 'curb_weight', 'weight_kg']);
                                return val ? `${val} kg` : undefined;
                            })(),
                            fuelCapacity: (() => {
                                const val = getSpec([
                                    'fuel_capacity',
                                    'fuel_tank_capacity',
                                    'tank_capacity',
                                    'fuel_tank',
                                ]);
                                return val ? `${val} L` : undefined;
                            })(),
                        },
                        features: {
                            bluetooth: getSpec(['bluetooth', 'connectivity', 'smart_connectivity']),
                        },
                        mileage: getSpec(['mileage', 'arai_mileage', 'arai']),
                    };
                })(),

                imageUrl: (() => {
                    const primarySku = allSkus.find((s: any) => s.is_primary);
                    const firstSku = allSkus[0];
                    const targetSku = primarySku || firstSku;

                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary);
                    const firstImageAsset = assets.find(a => a.type === 'IMAGE');

                    return (
                        primaryAsset?.url ||
                        firstImageAsset?.url ||
                        targetSku?.image_url ||
                        targetSku?.specs?.primary_image ||
                        targetSku?.specs?.gallery?.[0] ||
                        variantItem.specs?.image_url ||
                        family.specs?.image_url ||
                        undefined
                    );
                })(),

                availableColors: (() => {
                    const colorsMap = new Map();
                    allSkus.forEach((sku: any) => {
                        const hex = sku.specs?.hex_primary;
                        if (hex && !colorsMap.has(hex)) {
                            const assets = (sku.assets || []) as any[];
                            const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary);
                            const firstImageAsset = assets.find(a => a.type === 'IMAGE');

                            colorsMap.set(hex, {
                                hexCode: hex,
                                secondaryHexCode: sku.specs?.hex_secondary,
                                name: sku.specs?.Color || sku.name,
                                imageUrl:
                                    primaryAsset?.url ||
                                    firstImageAsset?.url ||
                                    sku.image_url ||
                                    sku.specs?.primary_image,
                                zoomFactor: Number(primaryAsset?.zoom_factor || sku.zoom_factor || 1.0),
                                isFlipped: Boolean(primaryAsset?.is_flipped || sku.is_flipped || false),
                                offsetX: Number(primaryAsset?.offset_x || sku.offset_x || 0),
                                offsetY: Number(primaryAsset?.offset_y || sku.offset_y || 0),
                            });
                        }
                    });
                    return Array.from(colorsMap.values());
                })(),

                // Zoom factor for image normalization (from primary SKU)
                zoomFactor: (() => {
                    const primarySku = allSkus.find((s: any) => s.is_primary);
                    const firstSku = allSkus[0];
                    const targetSku = primarySku || firstSku;

                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset =
                        assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Number(primaryAsset?.zoom_factor || targetSku?.zoom_factor || 1.0);
                })(),
                isFlipped: (() => {
                    const allSkus = (variantItem as any).skus || [];
                    const targetSku = allSkus.find((s: any) => s.is_primary) || allSkus[0];
                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset =
                        assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Boolean(primaryAsset?.is_flipped || targetSku?.is_flipped || false);
                })(),
                offsetX: (() => {
                    const allSkus = (variantItem as any).skus || [];
                    const targetSku = allSkus.find((s: any) => s.is_primary) || allSkus[0];
                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset =
                        assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Number(primaryAsset?.offset_x || targetSku?.offset_x || 0);
                })(),
                offsetY: (() => {
                    const allSkus = (variantItem as any).skus || [];
                    const targetSku = allSkus.find((s: any) => s.is_primary) || allSkus[0];
                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset =
                        assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Number(primaryAsset?.offset_y || targetSku?.offset_y || 0);
                })(),
                suitableFor: (() => {
                    const primarySku = allSkus.find((s: any) => s.is_primary);
                    const firstSku = allSkus[0];
                    const targetSku = primarySku || firstSku;
                    return (
                        targetSku?.specs?.suitable_for ||
                        variantItem.specs?.suitable_for ||
                        family.specs?.suitable_for ||
                        undefined
                    );
                })(),
                studioName,
                dealerId,
                serverPricing: (() => {
                    const skuPrices = allSkus.flatMap((sku: any) => sku.prices || []);
                    // Re-finding simplified for serverPricing population
                    let activeP = null;
                    if (userLat && userLng) {
                        activeP = skuPrices.sort((a: any, b: any) => {
                            const da =
                                a.latitude && a.longitude
                                    ? Math.sqrt(Math.pow(a.latitude - userLat, 2) + Math.pow(a.longitude - userLng, 2))
                                    : 999999;
                            const db =
                                b.latitude && b.longitude
                                    ? Math.sqrt(Math.pow(b.latitude - userLat, 2) + Math.pow(b.longitude - userLng, 2))
                                    : 999999;
                            return da - db;
                        })[0];
                    } else if (userDistrict) {
                        activeP = skuPrices.find((p: any) => p.district?.toLowerCase() === userDistrict?.toLowerCase());
                    }

                    if (!activeP) activeP = skuPrices.find((p: any) => p.state_code === stateCode);

                    if (activeP) {
                        // SOT Phase 3: Prefer new JSON columns, fallback to legacy breakdown
                        const hasRtoJson =
                            activeP.rto && typeof activeP.rto === 'object' && activeP.rto.STATE !== undefined;
                        const hasInsJson =
                            activeP.insurance &&
                            typeof activeP.insurance === 'object' &&
                            activeP.insurance.base_total !== undefined;

                        const rtoData = hasRtoJson
                            ? activeP.rto
                            : {
                                  STATE: activeP.rto_total || 0,
                                  BH: null,
                                  COMPANY: null,
                                  default: 'STATE',
                              };

                        const insData = hasInsJson
                            ? activeP.insurance
                            : {
                                  od: activeP.insurance_breakdown?.odPremium || 0,
                                  tp: activeP.insurance_breakdown?.tpPremium || 0,
                                  gst_rate: 18,
                                  base_total: activeP.insurance_total || 0,
                                  addons: [],
                              };

                        // Legacy breakdown for UI compatibility
                        const legacyRtoBreakdown = activeP.rto_breakdown
                            ? [
                                  { label: 'Road Tax', amount: activeP.rto_breakdown.roadTax || 0 },
                                  { label: 'Registration', amount: activeP.rto_breakdown.registrationCharges || 0 },
                                  ...(activeP.rto_breakdown.smartCardCharges
                                      ? [{ label: 'Smart Card', amount: activeP.rto_breakdown.smartCardCharges }]
                                      : []),
                                  ...(activeP.rto_breakdown.postalCharges
                                      ? [{ label: 'Postal Charges', amount: activeP.rto_breakdown.postalCharges }]
                                      : []),
                                  ...(activeP.rto_breakdown.hypothecationCharges
                                      ? [{ label: 'Hypothecation', amount: activeP.rto_breakdown.hypothecationCharges }]
                                      : []),
                              ]
                            : activeP.rto?.breakdown || [];

                        const legacyInsBreakdown = activeP.insurance_breakdown
                            ? [
                                  { label: 'OD Premium', amount: activeP.insurance_breakdown.odPremium || 0 },
                                  { label: 'TP Premium', amount: activeP.insurance_breakdown.tpPremium || 0 },
                                  ...(activeP.insurance_breakdown.addons?.zeroDep
                                      ? [{ label: 'Zero Dep', amount: activeP.insurance_breakdown.addons.zeroDep }]
                                      : []),
                                  { label: 'GST (18%)', amount: activeP.insurance_breakdown.gst || 0 },
                              ]
                            : activeP.insurance?.breakdown || [];

                        return {
                            final_on_road: activeP.on_road_price || activeP.ex_showroom_price,
                            ex_showroom: activeP.ex_showroom_price,
                            rto: rtoData,
                            insurance: insData,
                            location: {
                                district: activeP.district,
                                state_code: activeP.state_code,
                            },
                            // Legacy for backward compat
                            rto_breakdown: legacyRtoBreakdown,
                            insurance_breakdown: legacyInsBreakdown,
                        };
                    }
                    return undefined;
                })(),
            };
        });
    });
}
