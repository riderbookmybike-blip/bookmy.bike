'use server';

import { revalidatePath } from 'next/cache';
import { syncMarketplaceAll, syncMarketplaceLanguage } from '@/lib/i18n/syncMarketplace';

export async function syncAllMarketplaceAction(formData: FormData) {
    const path = String(formData.get('path') || '');
    await syncMarketplaceAll();
    if (path) revalidatePath(path, 'page');
}

export async function syncMarketplaceLanguageAction(formData: FormData) {
    const languageCode = String(formData.get('languageCode') || '').trim();
    const path = String(formData.get('path') || '');

    if (!languageCode) return;

    await syncMarketplaceLanguage({ languageCode });
    if (path) revalidatePath(path, 'page');
}
