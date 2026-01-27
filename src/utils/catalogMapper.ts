/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductVariant } from '@/types/productMaster';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';

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
}

export function mapCatalogItems(
    rawData: CatalogItemDB[],
    ruleData: any[],
    insuranceRuleData: any[],
    options: MapOptions
): ProductVariant[] {
    const { stateCode, userLat, userLng } = options;

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
                    let isEstimate = false;

                    if (skuPrices.length > 0) {
                        // A. Exact District Match (Best Case) - Calculate Distances if User has Lat/Lng
                        if (userLat && userLng) {
                            const withDistance = skuPrices.map((p: any) => {
                                if (!p.latitude || !p.longitude) return { ...p, distance: 999999 };
                                const dist = Math.sqrt(
                                    Math.pow(p.latitude - userLat, 2) +
                                    Math.pow(p.longitude - userLng, 2)
                                );
                                return { ...p, distance: dist };
                            });
                            // Sort by nearest
                            withDistance.sort((a: any, b: any) => a.distance - b.distance);
                            activePriceObj = withDistance[0];
                        }

                        // B. Fallback to State Match if no coords or no result
                        if (!activePriceObj) {
                            activePriceObj = skuPrices.find((p: any) => p.state_code === stateCode);
                        }

                        // C. Hard Fallback (Any Price - e.g. Mumbai/Default Anchor)
                        if (!activePriceObj) {
                            activePriceObj = skuPrices.find((p: any) => p.state_code === 'MH');
                            isEstimate = true;
                        }
                    }

                    if (activePriceObj) {
                        const stateName = STATE_NAMES[activePriceObj.state_code] || activePriceObj.state_code;
                        pricingSource = stateName;

                        if (!activePriceObj.district && activePriceObj.state_code === 'MH' && stateCode !== 'MH') {
                            isEstimate = true;
                        }

                        if (isEstimate) {
                            pricingSource = `Est: ${pricingSource}`;
                        }
                    }

                    const basePrice = activePriceObj?.ex_showroom_price
                        || variantItem.price_base
                        || family.price_base
                        || 0;

                    const engineCc = family.specs?.engine_cc || 110;
                    const onRoadBreakdown = calculateOnRoad(Number(basePrice), engineCc, effectiveRule, insuranceRule);

                    return {
                        exShowroom: basePrice,
                        onRoad: Math.round(onRoadBreakdown.onRoadTotal),
                        offerPrice: Math.round(onRoadBreakdown.onRoadTotal),
                        discount: 0,
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
                })()
            };
        });
    });
}
