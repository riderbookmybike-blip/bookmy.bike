'use server';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';

export async function revalidateCatalog(): Promise<{ success: boolean; error?: string }> {
    try {
        (revalidateTag as any)(CACHE_TAGS.catalog_global);
        (revalidateTag as any)(CACHE_TAGS.catalog);
        return { success: true };
    } catch (err: any) {
        console.error('[revalidateCatalog] Failed:', err);
        return { success: false, error: err.message };
    }
}
