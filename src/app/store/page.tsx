import React from 'react';
import StoreHomeClient from './StoreHomeClient';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

export default async function StorePage() {
    const initialItems = await fetchCatalogV2('MH');

    return <StoreHomeClient initialItems={initialItems} />;
}
