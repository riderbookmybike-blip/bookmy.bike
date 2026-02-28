import React from 'react';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { TvCatalogClient } from '@/components/store/TvCatalogClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TV Catalog Mockup | BookMyBike',
    description: 'TV-optimized gallery view for BookMyBike catalog.',
};

export default async function TvCatalogPage() {
    // Fetch initial items (similar to the standard catalog)
    const initialItems = await fetchCatalogV2('MH');

    return (
        <div className="min-h-screen bg-black">
            <TvCatalogClient initialItems={initialItems} />
        </div>
    );
}
