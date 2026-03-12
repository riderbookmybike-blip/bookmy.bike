import React from 'react';
import StoreHomeClient from './StoreHomeClient';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { getInitialDeviceType } from '@/lib/utils/device';

export const revalidate = false; // Cache indefinitely — invalidated via revalidateTag() on price/catalog updates
const DEFAULT_CATALOG_STATE = 'MH';

export default async function StorePage() {
    const initialItems = await fetchCatalogV2(DEFAULT_CATALOG_STATE);
    const initialDevice = await getInitialDeviceType();

    return <StoreHomeClient initialItems={initialItems} initialDevice={initialDevice} />;
}
