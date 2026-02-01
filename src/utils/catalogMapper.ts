/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductVariant } from '@/types/productMaster';

// State code to full name mapping
export const STATE_NAMES: Record<string, string> = {
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
        components: [{ id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true }]
    };
    const insuranceRule: any = insuranceRuleData?.[0];

    return rawData.flatMap((family: CatalogItemDB) => {
        const templateName = family.template?.name?.toLowerCase() || '';
        let bodyType: any = 'MOTORCYCLE';
        if (templateName.includes('scooter')) bodyType = 'SCOOTER';
        if (templateName.includes('helmet')) bodyType = 'ACCESSORY';

        const familyChildren = family.children || [];
        const variantChildren = familyChildren.filter(c => c.type === 'VARIANT');
        let displayVariants = variantChildren.length > 0
            ? variantChildren
            : (familyChildren.length > 0 ? familyChildren : [family]);

        displayVariants = displayVariants.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

        return (displayVariants as any[]).map(variantItem => {
            const makeName = family.brand?.name
                || family.specs?.brand
                || family.specs?.make
                || family.specs?.brand_name
                || 'Unknown';

            const variantSkus = (variantItem as any).skus;
            const isSkuItem = (variantItem as any).type === 'SKU';
            const allSkus = ((Array.isArray(variantSkus) && variantSkus.length > 0)
                ? variantSkus
                : (isSkuItem ? [variantItem] : [])) as any[];

            if (allSkus.length === 0 && Array.isArray(familyChildren)) {
                allSkus.push(...familyChildren.flatMap(c => (c.type === 'SKU' ? [{ ...c, price_base: c.price_base ?? 0 }] : (c.skus || []))));
            }

            // Extract dealer/studio info from best offer match
            let studioName: string | undefined = undefined;
            let dealerId: string | undefined = undefined;
            if (offers && Array.isArray(offers)) {
                const skuIds = allSkus.map((s: any) => s.id);
                const dealerMatch = offers
                    .filter((o: any) => skuIds.includes(o.vehicle_color_id))
                    .sort((a: any, b: any) => Number(a.best_offer) - Number(b.best_offer))[0];
                if (dealerMatch) {
                    studioName = dealerMatch.dealer_name || undefined;
                    dealerId = dealerMatch.dealer_id || undefined;
                }
            }

            return {
                id: variantItem.id,
                type: 'VEHICLE',
                make: makeName,
                model: family.name,
                variant: variantItem.name || family.name,
                displayName: `${makeName} ${family.name} ${variantItem.name !== family.name ? variantItem.name : ''}`.trim(),
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
                    const skuPrices = allSkus.flatMap((sku: any) => sku.prices || []);
                    let activePriceObj = null;
                    let pricingSource = "";
                    let dealerLocation: string | undefined = undefined;
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
                            dealerLocation = match.dealer_location || undefined;
                        }
                    }

                    if (dealerLocation && !pricingSource) {
                        pricingSource = dealerLocation;
                    }

                    // 2. Find Location/Distance match from cat_prices
                    if (skuPrices.length > 0) {
                        // A. Exact District/Point Match
                        if (userLat && userLng) {
                            const withDistance = skuPrices.map((p: any) => {
                                if (!p.latitude || !p.longitude) return { ...p, distance: 999999 };
                                const dist = Math.sqrt(
                                    Math.pow(p.latitude - userLat, 2) +
                                    Math.pow(p.longitude - userLng, 2)
                                );
                                return { ...p, distance: dist };
                            });
                            withDistance.sort((a: any, b: any) => a.distance - b.distance);
                            activePriceObj = withDistance[0];
                        }

                        // A.5 District Name Match
                        if (!activePriceObj && userDistrict) {
                            activePriceObj = skuPrices.find((p: any) =>
                                p.district?.toLowerCase().trim() === userDistrict?.toLowerCase().trim()
                            );
                        }

                        // B. State Match (Fallback)
                        if (!activePriceObj) {
                            activePriceObj = skuPrices.find((p: any) => p.state_code === stateCode);
                        }

                        // C. Lowest Price (Hard Fallback)
                        if (!activePriceObj) {
                            activePriceObj = skuPrices.reduce((min: any, curr: any) => {
                                return (curr.ex_showroom_price < min.ex_showroom_price) ? curr : min;
                            }, skuPrices[0]);
                            isEstimate = true;
                        }

                        if (activePriceObj && !pricingSource) {
                            const stateName = STATE_NAMES[activePriceObj.state_code] || activePriceObj.state_code;
                            let sourceParts = [];
                            if (activePriceObj.district) sourceParts.push(activePriceObj.district);
                            sourceParts.push(stateName);
                            pricingSource = sourceParts.join(', ');
                            if (isEstimate) pricingSource = `Best: ${pricingSource}`;
                            // If we have a best offer, we might want to override or supplement the pricing source
                            // but for now we keep it as the location description.
                        }
                    }

                    // 3. Calculate Final Prices with improved fallback
                    // IMPROVED FALLBACK CHAIN:
                    // Try: cat_prices.ex_showroom_price -> SKU.price_base -> Variant.price_base -> Family.price_base -> 0
                    let baseExShowroom = 0;
                    if (activePriceObj?.ex_showroom_price) {
                        // Best case: location-specific price from cat_prices
                        baseExShowroom = activePriceObj.ex_showroom_price;
                    } else {
                        // Fallback: Use price_base from SKU/Variant/Family hierarchy
                        // Try first SKU if available
                        const firstSku = allSkus.length > 0 ? allSkus[0] : null;
                        baseExShowroom = firstSku?.price_base
                            || (variantItem as any).price_base
                            || family.price_base
                            || 0;

                        // Mark as estimate since we're using base price instead of location-specific
                        if (baseExShowroom > 0 && !pricingSource) {
                            const stateName = STATE_NAMES[stateCode] || stateCode;
                            pricingSource = `Base: ${stateName}`;
                            isEstimate = true;
                        }
                    }

                    const onRoadTotal = Number(baseExShowroom || 0);
                    const offerPrice = onRoadTotal;
                    const bundleSavingsAmount = Math.max(0, Math.round(bundleValueAmount - bundlePriceAmount));

                    return {
                        exShowroom: baseExShowroom,
                        onRoad: Math.round(onRoadTotal),
                        offerPrice: Math.round(offerPrice),
                        discount: Math.abs(bestOfferAmount),
                        bundleValue: Math.round(bundleValueAmount),
                        bundlePrice: Math.round(bundlePriceAmount),
                        bundleSavings: bundleSavingsAmount,
                        totalSavings: Math.abs(bestOfferAmount) + bundleSavingsAmount,
                        pricingSource,
                        isEstimate
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
                            maxTorque: getSpec(['max_torque'])
                        },
                        transmission: {
                            type: getSpec(['transmission_type']) || 'Manual',
                            gears: getSpec(['gears'])
                        },
                        battery: {
                            range: getSpec(['range_eco', 'range']),
                            chargingTime: getSpec(['charging_time'])
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
                                const val = getSpec(['fuel_capacity', 'fuel_tank_capacity', 'tank_capacity', 'fuel_tank']);
                                return val ? `${val} L` : undefined;
                            })()
                        },
                        features: {
                            bluetooth: getSpec(['bluetooth', 'connectivity', 'smart_connectivity'])
                        },
                        mileage: getSpec(['mileage', 'arai_mileage', 'arai'])
                    };
                })(),

                imageUrl: (() => {
                    const primarySku = allSkus.find((s: any) => s.is_primary);
                    const firstSku = allSkus[0];
                    const targetSku = primarySku || firstSku;

                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary);
                    const firstImageAsset = assets.find(a => a.type === 'IMAGE');

                    return primaryAsset?.url ||
                        firstImageAsset?.url ||
                        targetSku?.image_url ||
                        targetSku?.specs?.primary_image ||
                        targetSku?.specs?.gallery?.[0] ||
                        variantItem.specs?.image_url ||
                        family.specs?.image_url ||
                        undefined;
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
                                imageUrl: primaryAsset?.url || firstImageAsset?.url || sku.image_url || sku.specs?.primary_image,
                                zoomFactor: Number(primaryAsset?.zoom_factor || sku.zoom_factor || 1.0),
                                isFlipped: Boolean(primaryAsset?.is_flipped || sku.is_flipped || false),
                                offsetX: Number(primaryAsset?.offset_x || sku.offset_x || 0),
                                offsetY: Number(primaryAsset?.offset_y || sku.offset_y || 0)
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
                    const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Number(primaryAsset?.zoom_factor || targetSku?.zoom_factor || 1.0);
                })(),
                isFlipped: (() => {
                    const allSkus = (variantItem as any).skus || [];
                    const targetSku = allSkus.find((s: any) => s.is_primary) || allSkus[0];
                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Boolean(primaryAsset?.is_flipped || targetSku?.is_flipped || false);
                })(),
                offsetX: (() => {
                    const allSkus = (variantItem as any).skus || [];
                    const targetSku = allSkus.find((s: any) => s.is_primary) || allSkus[0];
                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Number(primaryAsset?.offset_x || targetSku?.offset_x || 0);
                })(),
                offsetY: (() => {
                    const allSkus = (variantItem as any).skus || [];
                    const targetSku = allSkus.find((s: any) => s.is_primary) || allSkus[0];
                    const assets = (targetSku?.assets || []) as any[];
                    const primaryAsset = assets.find(a => a.type === 'IMAGE' && a.is_primary) || assets.find(a => a.type === 'IMAGE');

                    return Number(primaryAsset?.offset_y || targetSku?.offset_y || 0);
                })(),
                suitableFor: (() => {
                    const primarySku = allSkus.find((s: any) => s.is_primary);
                    const firstSku = allSkus[0];
                    const targetSku = primarySku || firstSku;
                    return targetSku?.specs?.suitable_for || variantItem.specs?.suitable_for || family.specs?.suitable_for || undefined;
                })(),
                studioName,
                dealerId
            };
        });
    });
}
