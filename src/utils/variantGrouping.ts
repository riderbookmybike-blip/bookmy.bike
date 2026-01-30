import { ProductVariant } from '@/types/productMaster';

/**
 * Group product variants by model
 * Allows: Left/Right swipe for variants, Up/Down scroll for models
 */
export interface ModelGroup {
    make: string;
    model: string;
    modelSlug: string;
    variants: ProductVariant[];
}

export function groupProductsByModel(products: ProductVariant[]): ModelGroup[] {
    const grouped = new Map<string, ModelGroup>();

    products.forEach(product => {
        const key = `${product.make}-${product.model}`;

        if (!grouped.has(key)) {
            grouped.set(key, {
                make: product.make,
                model: product.model,
                modelSlug: product.modelSlug,
                variants: []
            });
        }

        grouped.get(key)!.variants.push(product);
    });

    // Sort variants within each group (Drum → Disc → Premium)
    return Array.from(grouped.values()).map(group => ({
        ...group,
        variants: sortVariants(group.variants)
    }));
}

function sortVariants(variants: ProductVariant[]): ProductVariant[] {
    return [...variants].sort((a, b) => {
        const aVar = a.variant.toLowerCase();
        const bVar = b.variant.toLowerCase();

        // Drum before Disc
        if (aVar.includes('drum') && bVar.includes('disc')) return -1;
        if (aVar.includes('disc') && bVar.includes('drum')) return 1;

        // Standard before SmartXonnect/Premium
        if (aVar.includes('smartxonnect') || aVar.includes('premium')) return 1;
        if (bVar.includes('smartxonnect') || bVar.includes('premium')) return -1;

        return aVar.localeCompare(bVar);
    });
}
