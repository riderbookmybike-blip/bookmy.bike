import React from 'react';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import SystemCatalogRouter from './SystemCatalogRouter';
import { Metadata } from 'next';
import { getInitialDeviceType } from '@/lib/utils/device';

export const metadata: Metadata = {
    title: 'Catalog | BookMyBike',
    description: 'Browse the latest bikes and scooters with best market offers.',
};

export default async function CatalogPage() {
    const [initialItems, initialDevice] = await Promise.all([fetchCatalogV2('MH'), getInitialDeviceType()]);

    return <SystemCatalogRouter initialItems={initialItems} mode="smart" initialDevice={initialDevice} />;
}
