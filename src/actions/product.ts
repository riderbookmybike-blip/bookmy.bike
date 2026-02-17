'use server';

import { ProductVariant } from '@/types/productMaster';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

export async function getAllProducts(): Promise<{ products: ProductVariant[]; error?: string }> {
    try {
        const products = await fetchCatalogV2('MH');
        return { products };
    } catch (err) {
        console.error('Unexpected error fetching catalog:', err);
        return { products: [], error: 'An unexpected error occurred' };
    }
}
