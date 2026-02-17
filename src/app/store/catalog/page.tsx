import React from 'react';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import SystemCatalogRouter from './SystemCatalogRouter';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Catalog | BookMyBike',
    description: 'Browse the latest bikes and scooters with best market offers.',
};

export default async function CatalogPage() {
    const initialItems = await fetchCatalogV2('MH');

    return <SystemCatalogRouter initialItems={initialItems} mode="smart" />;
}
