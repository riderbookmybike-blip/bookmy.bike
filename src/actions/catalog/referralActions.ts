'use server';

import { withCache } from '@/lib/cache/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import type { ProductVariant } from '@/types/productMaster';

/**
 * Server Action to fetch hot picks for the referral landing page.
 * Wraps fetchCatalogV2 to ensure it runs strictly on the server.
 */
export async function getReferralHotPicks(
    stateCode: string = 'MH'
): Promise<{ success: boolean; data?: ProductVariant[]; error?: string }> {
    try {
        const variants = await withCache(() => fetchCatalogV2(stateCode), ['referral-hot-picks', stateCode], {
            revalidate: 300,
            tags: [CACHE_TAGS.catalog, CACHE_TAGS.catalog_global, CACHE_TAGS.referral_hot_picks],
        });
        return { success: true, data: variants };
    } catch (error) {
        console.error('getReferralHotPicks error:', error);
        return { success: false, error: 'Failed to fetch hot picks' };
    }
}
