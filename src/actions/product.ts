'use server';

import { createClient } from '@/lib/supabase/server';
import { ProductVariant, VehicleSpecifications } from '@/types/productMaster';

// Helper to format text as Title Case
function toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        // Handle special cases or generic title casing
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export async function getAllProducts(): Promise<{ products: ProductVariant[], error?: string }> {
    const supabase = await createClient();

    try {
        // Fetch Families + Children (Variants) + Grandchildren (SKUs)
        // Using the same query structure as useCatalog.ts to ensure data consistency
        const { data, error } = await supabase
            .from('catalog_items')
            .select(`
                id, type, name, slug, specs, price_base, brand_id,
                brand:brands(name),
                template:catalog_templates!inner(name, code, category),
                children:catalog_items!parent_id(
                    id, type, name, slug, specs, price_base, position,
                    skus:catalog_items!parent_id(
                        id, type, price_base, is_primary, image_url, specs,
                        prices:vehicle_prices(ex_showroom_price, state_code)
                    )
                )
            `)
            .eq('type', 'FAMILY')
            .eq('status', 'ACTIVE');

        if (error) {
            console.error('Error fetching catalog products:', error);
            // Return empty list instead of failing hard, or let caller handle
            return { products: [], error: 'Failed to fetch catalog' };
        }

        if (!data) {
            return { products: [] };
        }

        // Flatten the hierarchical structure into a linear list of ProductVariants
        // This makes it compatible with the QuoteProductSelector which expects a flat list
        const products: ProductVariant[] = (data as any[]).flatMap((family: any) => {
            const familyChildren = family.children || [];

            // We want to list "Variants" as the selectable items.
            // If a family has variants, list them.
            // If not (e.g. simple accessory), list the family itself or its specific SKUs.

            const variants = familyChildren.filter((c: any) => c.type === 'VARIANT');
            const displayNodes = variants.length > 0
                ? variants
                : (familyChildren.length > 0 ? familyChildren : [family]);

            return displayNodes.map((node: any) => {
                const isFamilyNode = node.id === family.id;

                // Normalizing Casing
                const rawMake = family.brand?.name || 'Unknown';
                const rawModel = family.name;
                const rawVariant = isFamilyNode ? family.name : node.name;

                const makeName = toTitleCase(rawMake);
                const modelName = toTitleCase(rawModel);
                const variantName = toTitleCase(rawVariant);

                const displayName = `${makeName} ${modelName} ${variantName !== modelName ? variantName : ''}`.trim();

                // Determine SKUs for this node to find price/image
                // If node is a variant, its SKUs are children.
                // If node is family (fallback), its SKUs might be direct children or deeper.
                const nodeSkus = node.skus || [];

                // Price logic: use lowest SKU price or node base price
                const prices = nodeSkus.flatMap((s: any) => s.prices?.map((p: any) => p.ex_showroom_price) || s.price_base).filter((p: any) => p > 0);
                const basePrice = prices.length > 0 ? Math.min(...prices) : (node.price_base || family.price_base || 0);

                // Image logic: Primary SKU > First SKU > Variant Spec > Family Spec
                const primarySku = nodeSkus.find((s: any) => s.is_primary) || nodeSkus[0];
                const imageUrl = primarySku?.image_url || primarySku?.specs?.image_url || node.specs?.image_url || family.specs?.image_url;

                // Specs merging
                const specs = { ...family.specs, ...node.specs };

                // Generate a robust SKU code string if one doesn't exist
                const slugPart = node.slug || family.slug || 'unknown';
                const skuCode = `SKU-${slugPart}`.toUpperCase();

                // Determine Product Type based on Template Category
                const templateCat = family.template?.category || 'VEHICLE';
                let type: 'VEHICLE' | 'ACCESSORY' | 'SERVICE' = 'VEHICLE';
                if (templateCat === 'ACCESSORY') type = 'ACCESSORY';
                if (templateCat === 'SERVICE') type = 'SERVICE';

                // Determine Category/BodyType
                const bodyType = specs.body_type || (templateCat === 'VEHICLE' ? 'MOTORCYCLE' : templateCat);

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
                    segment: 'COMMUTER', // Default or derive from specs
                    displayName: displayName,
                    slug: node.slug || family.slug,
                    modelSlug: family.slug,
                    label: `${makeName} / ${modelName} / ${variantName}`,
                    sku: skuCode,
                    status: 'ACTIVE',
                    price: {
                        exShowroom: basePrice,
                        onRoad: 0 // Client-side calculation would require RTO rules
                    },
                    imageUrl: imageUrl,
                    specifications: {
                        engine: {
                            displacement: specs.engine_cc ? `${specs.engine_cc} cc` : undefined,
                            maxPower: specs.max_power,
                            maxTorque: specs.max_torque
                        },
                        transmission: {
                            type: specs.transmission_type
                        }
                    } as VehicleSpecifications
                };
            });
        });

        return { products };
    } catch (err) {
        console.error('Unexpected error fetching catalog:', err);
        return { products: [], error: 'An unexpected error occurred' };
    }
}
