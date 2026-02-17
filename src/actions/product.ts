'use server';

import { ProductVariant } from '@/types/productMaster';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

export async function getAllProducts(
    stateCode: string = 'MH'
): Promise<{ products: ProductVariant[]; error?: string }> {
    try {
        const products = await fetchCatalogV2(stateCode);
        return { products };
    } catch (err) {
        console.error('Unexpected error fetching catalog:', err);
        return { products: [], error: 'An unexpected error occurred' };
    }
}
