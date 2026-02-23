'use server';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { getErrorMessage } from '@/lib/utils/errorMessage';

export async function revalidateCatalog(): Promise<{ success: boolean; error?: string }> {
    try {
        revalidateTag(CACHE_TAGS.catalog_global, 'max');
        revalidateTag(CACHE_TAGS.catalog, 'max');
        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? getErrorMessage(err) : String(err);
        console.error('[revalidateCatalog] Failed:', err);
        return { success: false, error: message };
    }
}
