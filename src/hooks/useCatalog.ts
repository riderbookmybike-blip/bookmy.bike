import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';

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
            }[];
        }[];
    }[];
}

export function useCatalog() {
    const [items, setItems] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [skuCount, setSkuCount] = useState<number>(0);
    const [stateCode, setStateCode] = useState('MH');
    const [locationLabel, setLocationLabel] = useState('Mumbai, MH');

    useEffect(() => {
        const resolveLocation = () => {
            if (typeof window === 'undefined') return;
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (!cached) return;
            try {
                const data = JSON.parse(cached) as { state?: string; stateCode?: string; district?: string; taluka?: string };

                // prefer stateCode
                let code = data.stateCode;

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
                    setStateCode(code);
                    // Construct Label: "District, Code" e.g. "Pune, MH"
                    const talukaPart = data.district || data.taluka || '';
                    const label = talukaPart ? `${talukaPart}, ${code}` : code;
                    setLocationLabel(label);
                }
            } catch (e) {
                console.error('Error parsing stored location:', e);
            }
        };

        resolveLocation();
        window.addEventListener('locationChanged', resolveLocation);
        return () => window.removeEventListener('locationChanged', resolveLocation);
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const supabase = createClient();

                // Fetch Families + Children (Variants) + Grandchildren (SKUs)
                const { data, error: dbError } = await supabase
                    .from('cat_items')
                    .select(`
                        id, type, name, slug, specs, price_base, brand_id,
                        brand:cat_brands(name, logo_svg),
                        template:cat_templates!inner(name, code, category),
                        children:cat_items!parent_id(
                            id,
                            type,
                            name,
                            slug,
                            specs,
                            price_base,
                            parent:cat_items!parent_id(name, slug),
                            position,
                            skus:cat_items!parent_id(
                                id,
                                type,
                                price_base,
                                is_primary,
                                image_url,
                                gallery_urls,
                                video_url,
                                specs,
                                prices:cat_prices(ex_showroom_price, state_code, district, latitude, longitude)
                            )
                        )
                    `)
                    .eq('type', 'FAMILY')
                    .eq('status', 'ACTIVE')
                    .not('template_id', 'is', null)
                    .eq('template.category', 'VEHICLE');

                if (dbError) {
                    console.error('Database error fetching catalog:', JSON.stringify(dbError, null, 2));
                    throw dbError;
                }

                const { data: ruleData } = await supabase
                    .from('cat_reg_rules')
                    .select('*')
                    .eq('state_code', stateCode)
                    .eq('status', 'ACTIVE');

                const { data: insuranceRuleData } = await supabase
                    .from('cat_ins_rules')
                    .select('*')
                    .eq('status', 'ACTIVE')
                    .eq('vehicle_type', 'TWO_WHEELER')
                    .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
                    .order('state_code', { ascending: false })
                    .limit(1);

                const effectiveRule: any = ruleData?.[0] || {
                    id: 'default',
                    stateCode,
                    components: [{ id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true }]
                };
                const insuranceRule: any = insuranceRuleData?.[0];

                if (data) {
                    const mappedItems: ProductVariant[] = (data as any[]).flatMap((family: CatalogItemDB) => {
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

                        return displayVariants.map(variantItem => {
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
                                allSkus.push(...familyChildren.flatMap(c => (c.type === 'SKU' ? [c] : (c.skus || []))));
                            }

                            return {
                                id: variantItem.id,
                                type: 'VEHICLE',
                                make: makeName,
                                model: family.name,
                                variant: variantItem.name || family.name,
                                displayName: `${makeName} ${family.name} ${variantItem.name !== family.name ? variantItem.name : ''}`.trim(),
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

                                    // Get User Location from LocalStorage
                                    let userLat: number | null = null;
                                    let userLng: number | null = null;
                                    const cached = localStorage.getItem('bkmb_user_pincode');
                                    if (cached) {
                                        try {
                                            const uData = JSON.parse(cached);
                                            // Prefer explicit lat/lng if available (from browser geo), else rely on district match
                                            if (uData.lat && uData.lng) {
                                                userLat = uData.lat;
                                                userLng = uData.lng;
                                            } else {
                                                // Fallback: If we only have pincode/state, we default to "Maharashtra" center or similar? 
                                                // Actually, if we don't have lat/lng, we can try string matching, 
                                                // BUT for "Nearest", we need coordinates.
                                                // For now, let's skip distance calc if no user coords, and fallback to string match.
                                            }
                                        } catch (e) { }
                                    }

                                    let activePriceObj = null;
                                    let pricingSource = "";
                                    let isEstimate = false;

                                    if (skuPrices.length > 0) {
                                        // A. Exact District Match (Best Case)
                                        // We check current locationLabel logic or just string match if available
                                        // But "Nearest" is better.

                                        // 1. Calculate Distances if User has Lat/Lng
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

                                        // C. Hard Fallback (Any Price - e.g. Mumbai)
                                        if (!activePriceObj) {
                                            activePriceObj = skuPrices.find((p: any) => p.state_code === 'MH'); // Default Anchor
                                            isEstimate = true;
                                        }
                                    }

                                    if (activePriceObj) {
                                        pricingSource = activePriceObj.district
                                            ? `${activePriceObj.district}, ${activePriceObj.state_code}`
                                            : activePriceObj.state_code;

                                        // If we fell back to MH but user is not in MH, mark estimate
                                        if (!activePriceObj.district && activePriceObj.state_code === 'MH' && stateCode !== 'MH') {
                                            isEstimate = true;
                                        }
                                        // If "Nearest", we might want to mark estimate if distance is > X km? 
                                        // User asked to just show nearest.

                                        if (isEstimate) {
                                            pricingSource = `Nearest: ${pricingSource}`;
                                        }
                                    }

                                    // 3. Fallback to Base Price if nothing found
                                    const basePrice = activePriceObj?.ex_showroom_price
                                        || variantItem.price_base
                                        || family.price_base
                                        || 0;

                                    const engineCc = family.specs?.engine_cc || 110;
                                    const onRoadBreakdown = calculateOnRoad(Number(basePrice), engineCc, effectiveRule, insuranceRule);

                                    return {
                                        exShowroom: basePrice,
                                        onRoad: Math.round(onRoadBreakdown.onRoadTotal),
                                        offerPrice: Math.round(onRoadBreakdown.onRoadTotal), // Fallback to onroad as offer
                                        discount: 0, // Fallback
                                        pricingSource,
                                        isEstimate
                                    };
                                })(),

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

                                    return targetSku?.image_url ||
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
                                            colorsMap.set(hex, {
                                                hexCode: hex,
                                                secondaryHexCode: sku.specs?.hex_secondary,
                                                name: sku.specs?.Color || sku.name,
                                                imageUrl: sku.image_url || sku.specs?.primary_image
                                            });
                                        }
                                    });
                                    return Array.from(colorsMap.values());
                                })()
                            };
                        });
                    });
                    setItems(mappedItems);
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
                console.error('Error fetching catalog:', err);
                if (err.message && err.details) {
                    console.error('Supabase Error Details:', {
                        message: err.message,
                        details: err.details,
                        hint: err.hint,
                        code: err.code
                    });
                }
                setError(err instanceof Error ? err.message : 'Unknown error');
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, [stateCode]);

    return { items, isLoading, error, skuCount };
}
