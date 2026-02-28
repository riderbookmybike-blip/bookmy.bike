import React from 'react';
import StoreHomeClient from './StoreHomeClient';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { isMobileDevice } from '@/lib/utils/device';

export default async function StorePage() {
    const initialItems = await fetchCatalogV2('MH');
    const isMobile = await isMobileDevice();
    const initialDevice = isMobile ? 'phone' : 'desktop';

    return <StoreHomeClient initialItems={initialItems} initialDevice={initialDevice} />;
}
