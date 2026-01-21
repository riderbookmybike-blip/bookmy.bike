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
    template: { name: string; code: string };
    children?: {
        id: string;
        type: string;
        name: string;
        slug: string;
        displayName?: string; // Added displayName
        modelSlug?: string; // Added modelSlug
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

    useEffect(() => {
        const resolveStateCode = () => {
            if (typeof window === 'undefined') return;
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (!cached) return;
            try {
                const data = JSON.parse(cached) as { state?: string | null; stateCode?: string | null };
                if (data.stateCode) {
                    setStateCode(data.stateCode.toUpperCase());
                    return;
                }
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
                const normalized = (data.state || '').toUpperCase();
                if (normalized && stateMap[normalized]) {
                    setStateCode(stateMap[normalized]);
                }
            } catch (e) {
                console.error('Error parsing stored location:', e);
            }
        };

        resolveStateCode();
        window.addEventListener('locationChanged', resolveStateCode);
        return () => window.removeEventListener('locationChanged', resolveStateCode);
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const supabase = createClient();

                // Fetch Families + Children (Variants) + Grandchildren (SKUs)
                const { data, error: dbError } = await supabase
                    .from('catalog_items')
                    .select(`
                        id, type, name, slug, specs, price_base, brand_id,
                        brand:brands(name, logo_svg),
                        template:catalog_templates!inner(name, code, category),
                        children:catalog_items!parent_id(
                            id,
                            type,
                            name,
                            slug,
                            specs,
                            price_base,
                            parent:catalog_items!parent_id(name, slug),
                            position,
                            skus:catalog_items!parent_id(
                                id,
                                type,
                                price_base,
                                is_primary,
                                image_url,
                                gallery_urls,
                                video_url,
                                specs,
                                prices:vehicle_prices(ex_showroom_price, state_code)
                            )
                        )
                    `)
                    .eq('type', 'FAMILY')
                    .eq('status', 'ACTIVE')
                    .not('template_id', 'is', null) // Ensure it has a template
                    .eq('template.category', 'VEHICLE');

                if (dbError) {
                    console.error('Database error fetching catalog:', JSON.stringify(dbError, null, 2));
                    throw dbError;
                }

                const { data: ruleData } = await supabase
                    .from('registration_rules')
                    .select('*')
                    .eq('state_code', stateCode)
                    .eq('status', 'ACTIVE');

                const { data: insuranceRuleData } = await supabase
                    .from('insurance_rules')
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

                        // For each child (Variant), we create a listing item.
                        // If there are no VARIANT nodes, fall back to any children or the family itself.
                        const familyChildren = family.children || [];
                        const variantChildren = familyChildren.filter(c => c.type === 'VARIANT');
                        let displayVariants = variantChildren.length > 0
                            ? variantChildren
                            : (familyChildren.length > 0 ? familyChildren : [family]);

                        // Sort variants by position
                        displayVariants = displayVariants.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

                        return displayVariants.map(variantItem => {
                            const makeName = family.brand?.name
                                || family.specs?.brand
                                || family.specs?.make
                                || family.specs?.brand_name
                                || 'Unknown';
                            const variantSpecs = (variantItem as any).specs || {};
                            const variantSkus = (variantItem as any).skus;
                            const isSkuItem = (variantItem as any).type === 'SKU';
                            const allSkus = ((Array.isArray(variantSkus) && variantSkus.length > 0)
                                ? variantSkus
                                : (isSkuItem
                                    ? [variantItem]
                                    : familyChildren.flatMap(c => (c.type === 'SKU' ? [c] : (c.skus || []))))) as any;

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

                                // Pricing - Find the "Starting At" price for this specific variant
                                price: (() => {
                                    const skuPrices = allSkus.map((sku: any) => {
                                        const statePrice = sku.prices?.find((p: any) => p.state_code === 'MH')?.ex_showroom_price;
                                        return statePrice || sku.price_base || variantItem.price_base || family.price_base || 0;
                                    }).filter((p: number) => p > 0);

                                    const basePrice = skuPrices.length > 0
                                        ? Math.min(...skuPrices)
                                        : (variantItem.price_base || family.price_base || 0);

                                    const engineCc = family.specs?.engine_cc || 110;
                                    const onRoadBreakdown = calculateOnRoad(Number(basePrice), engineCc, effectiveRule, insuranceRule);

                                    return {
                                        exShowroom: basePrice,
                                        onRoad: Math.round(onRoadBreakdown.onRoadTotal)
                                    };
                                })(),

                                // Specs - prioritize variant specs then fallback to family specs
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

                                // Images
                                // Images - Prioritize Primary SKU then any SKU, fallback to variant/family
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

                                // Colors - Extract unique colors from SKUs
                                availableColors: (() => {
                                    const colorsMap = new Map();
                                    allSkus.forEach((sku: any) => {
                                        const hex = sku.specs?.hex_primary;
                                        if (hex && !colorsMap.has(hex)) {
                                            colorsMap.set(hex, {
                                                hexCode: hex,
                                                secondaryHexCode: sku.specs?.hex_secondary,
                                                name: sku.specs?.Color || sku.name
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
                        .from('catalog_items')
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
                // Log detailed error if it's a Supabase error
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
