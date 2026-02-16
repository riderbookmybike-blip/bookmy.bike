'use server';

import { createClient } from '@/lib/supabase/server';
import { ProductVariant, VehicleSpecifications } from '@/types/productMaster';
import { calculateParity, logCatalogDrift } from '@/lib/utils/driftLogger';

// Helper to format text as Title Case
function toTitleCase(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => {
            // Handle special cases or generic title casing
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

export async function getAllProducts(): Promise<{ products: ProductVariant[]; error?: string }> {
    const useLinear = process.env.NEXT_PUBLIC_USE_LINEAR_CATALOG === 'true';

    try {
        if (useLinear) {
            return await getAllProductsFromLinear();
        }

        const supabase = await createClient();
        // Fetch Families + Children (Variants) + Grandchildren (SKUs)
        const { data, error } = await supabase
            .from('cat_items')
            .select(
                `
                id, type, name, slug, specs, price_base, brand_id, category,
                brand:cat_brands(name),
                children:cat_items!parent_id(
                    id, type, name, slug, specs, price_base, position,
                    skus:cat_items!parent_id(
                        id, type, price_base, is_primary, image_url, specs,
                        prices:cat_price_state!vehicle_color_id(ex_showroom_price, state_code, district, is_active)
                    )
                )
            `
            )
            .eq('type', 'PRODUCT')
            .eq('status', 'ACTIVE');

        if (error) {
            console.error('Error fetching catalog products:', error);
            return { products: [], error: 'Failed to fetch catalog' };
        }

        if (!data) return { products: [] };

        const products: ProductVariant[] = (data as any[]).flatMap((family: any) => {
            const familyChildren = family.children || [];
            const variants = familyChildren.filter((c: any) => c.type === 'VARIANT');
            const displayNodes = variants.length > 0 ? variants : familyChildren.length > 0 ? familyChildren : [family];

            return displayNodes.map((node: any) => {
                const isFamilyNode = node.id === family.id;
                const rawMake = family.brand?.name || 'Unknown';
                const rawModel = family.name;
                const rawVariant = isFamilyNode ? family.name : node.name;

                const makeName = toTitleCase(rawMake);
                const modelName = toTitleCase(rawModel);
                const variantName = toTitleCase(rawVariant);
                const displayName = `${makeName} ${modelName} ${variantName !== modelName ? variantName : ''}`.trim();

                const nodeSkus = node.skus || [];
                const prices = nodeSkus
                    .flatMap((s: any) => s.prices?.map((p: any) => p.ex_showroom_price) || s.price_base)
                    .filter((p: any) => p > 0);
                const basePrice = prices.length > 0 ? Math.min(...prices) : node.price_base || family.price_base || 0;

                const primarySku = nodeSkus.find((s: any) => s.is_primary) || nodeSkus[0];
                const imageUrl =
                    primarySku?.image_url ||
                    primarySku?.specs?.image_url ||
                    node.specs?.image_url ||
                    family.specs?.image_url;

                const specs = { ...family.specs, ...node.specs };
                const slugPart = node.slug || family.slug || 'unknown';
                const skuCode = `SKU-${slugPart}`.toUpperCase();

                const itemCategory = family.category || 'VEHICLE';
                let type: 'VEHICLE' | 'ACCESSORY' | 'SERVICE' = 'VEHICLE';
                if (itemCategory === 'ACCESSORY') type = 'ACCESSORY';
                if (itemCategory === 'SERVICE') type = 'SERVICE';

                const bodyType = specs.body_type || (itemCategory === 'VEHICLE' ? 'MOTORCYCLE' : itemCategory);

                return {
                    id: node.id,
                    type: type,
                    make: makeName,
                    model: modelName,
                    variant: variantName,
                    bodyType: bodyType,
                    fuelType: specs.fuel_type || 'PETROL',
                    displacement: specs.engine_cc || 0,
                    powerUnit: 'CC',
                    segment: 'COMMUTER',
                    displayName: displayName,
                    slug: node.slug || family.slug,
                    modelSlug: family.slug,
                    label: `${makeName} / ${modelName} / ${variantName}`,
                    sku: skuCode,
                    status: 'ACTIVE',
                    price: {
                        exShowroom: basePrice,
                        onRoad: 0,
                    },
                    districtPrices: nodeSkus
                        .flatMap(
                            (s: any) =>
                                s.prices?.map((p: any) => ({
                                    district: p.district,
                                    exShowroom: parseFloat(p.ex_showroom_price),
                                })) || []
                        )
                        .filter((p: any) => p.exShowroom > 0),
                    availableColors: nodeSkus.map((s: any) => ({
                        id: s.id,
                        name: s.specs?.Color || s.specs?.Colour || s.name || 'Standard',
                        hexCode: s.specs?.hex_primary || '#CCCCCC',
                        imageUrl: s.image_url || s.specs?.primary_image || s.specs?.image_url,
                    })),
                    imageUrl: imageUrl,
                    specifications: {
                        engine: {
                            displacement: specs.engine_cc ? `${specs.engine_cc} cc` : undefined,
                            maxPower: specs.max_power,
                            maxTorque: specs.max_torque,
                        },
                        transmission: {
                            type: specs.transmission_type,
                        },
                    } as VehicleSpecifications,
                };
            });
        });

        return { products };
    } catch (err) {
        console.error('Unexpected error fetching catalog:', err);
        return { products: [], error: 'An unexpected error occurred' };
    }
}

/**
 * Phase 2: Shadow Fetch from Linear Catalog
 */
async function getAllProductsFromLinear(): Promise<{ products: ProductVariant[] }> {
    const supabase = await createClient();

    // Fetch all active SKUs. We don't join anything here.
    const { data: skus, error } = await supabase.from('cat_skus_linear').select('*').eq('status', 'ACTIVE');

    if (error || !skus) return { products: [] };

    // Group SKUs by (brand_id + product_name + variant_name) to reconstruct ProductVariant
    const groups = new Map<string, any[]>();
    for (const sku of skus) {
        const key = `${sku.brand_id}-${sku.product_name}-${sku.variant_name}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(sku);
    }

    const products: ProductVariant[] = Array.from(groups.values()).map(groupSkus => {
        const first = groupSkus[0];
        const brand = first.brand_json;
        const product = first.product_json;
        const variant = first.variant_json;

        // Use the same Title Case helper if needed, or assume pre-normalized
        const makeName = brand.name;
        const modelName = product.name;
        const variantName = variant.name;
        const displayName = `${makeName} ${modelName} ${variantName !== modelName ? variantName : ''}`.trim();

        const skuCode = `SKU-${first.variant_json.slug || first.product_json.slug || 'unknown'}`.toUpperCase();

        const prices = groupSkus
            .flatMap(s => s.unit_json.prices?.map((p: any) => p.ex_showroom_price) || [s.price_base])
            .filter(p => p > 0);
        const basePrice = prices.length > 0 ? Math.min(...prices) : first.price_base;

        return {
            id: variant.id, // We use Variant ID as the primary key for the selector
            type: (first.type_name === 'VEHICLE' ? 'VEHICLE' : first.type_name) as any,
            make: makeName,
            model: modelName,
            variant: variantName,
            bodyType: (
                product.specs?.body_type || (first.type_name === 'VEHICLE' ? 'MOTORCYCLE' : first.type_name)
            ).toUpperCase() as any,
            fuelType: (product.specs?.fuel_type || 'PETROL').toUpperCase() as any,
            displacement: parseFloat(product.specs?.engine_cc || '0'),
            powerUnit: 'CC',
            segment: 'COMMUTER',
            rating: 0,
            displayName,
            slug: variant.slug || product.slug,
            modelSlug: product.slug,
            label: `${makeName} / ${modelName} / ${variantName}`,
            sku: skuCode,
            status: 'ACTIVE',
            price: {
                exShowroom: basePrice,
                onRoad: 0,
            },
            districtPrices: groupSkus
                .flatMap(s =>
                    (s.unit_json.prices || []).map((p: any) => ({
                        district: p.district,
                        exShowroom: parseFloat(p.ex_showroom_price),
                    }))
                )
                .filter(p => p.exShowroom > 0),
            availableColors: groupSkus.map(s => ({
                id: s.id, // Using linear table ID/SKU node ID? Legacy uses SKU node ID.
                name: s.unit_json.specs?.Color || s.unit_json.specs?.Colour || s.unit_json.name || 'Standard',
                hexCode: s.unit_json.specs?.hex_primary || '#CCCCCC',
                imageUrl: s.image_url,
            })),
            imageUrl: first.image_url,
            specifications: {
                engine: {
                    displacement: product.specs?.engine_cc ? `${product.specs.engine_cc} cc` : undefined,
                    maxPower: product.specs?.max_power,
                    maxTorque: product.specs?.max_torque,
                },
                transmission: {
                    type: product.specs?.transmission_type,
                },
                dimensions: {
                    fuelCapacity: product.specs?.fuel_capacity || variant.specs?.fuel_capacity,
                },
                features: {},
            } as any,
        };
    });

    return { products };
}
