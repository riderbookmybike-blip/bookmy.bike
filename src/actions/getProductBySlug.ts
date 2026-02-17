'use server';

import { ProductVariant } from '@/types/productMaster';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

/**
 * Fetch a single product variant by its URL slugs (make/model/variant).
 * Uses canonical V2 catalog read path.
 */
export async function getProductBySlug(
    makeSlug: string,
    modelSlug: string,
    variantSlug: string
): Promise<ProductVariant | null> {
    const decodedMake = decodeURIComponent(makeSlug).toLowerCase();
    const decodedModel = decodeURIComponent(modelSlug).toLowerCase();
    const decodedVariant = decodeURIComponent(variantSlug).toLowerCase();

    const possibleVariantSlugs = new Set([
        decodedVariant,
        `${decodedMake}-${decodedModel}-${decodedVariant}`,
        `${decodedModel}-${decodedVariant}`,
    ]);

    const items = await fetchCatalogV2('MH');
    if (!items || items.length === 0) return null;

    const direct = items.find(item => {
        const itemModel = String(item.modelSlug || '').toLowerCase();
        const itemVariant = String(item.slug || '').toLowerCase();
        return itemModel === decodedModel && possibleVariantSlugs.has(itemVariant);
    });
    if (direct) return direct;

    const modelFallback = items.find(item => String(item.modelSlug || '').toLowerCase() === decodedModel);
    return modelFallback || null;
}
