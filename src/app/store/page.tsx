import React from 'react';
import StoreHomeClient from './StoreHomeClient';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { getInitialDeviceType } from '@/lib/utils/device';
import { resolvePricingContext } from '@/lib/server/pricingContext';

export const revalidate = 300;

export default async function StorePage() {
    const context = await resolvePricingContext({});
    const initialItems = await fetchCatalogV2(context.stateCode);
    const initialDevice = await getInitialDeviceType();

    return <StoreHomeClient initialItems={initialItems} initialDevice={initialDevice} />;
}
