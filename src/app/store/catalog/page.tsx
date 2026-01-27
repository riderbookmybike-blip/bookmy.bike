import React from 'react';
import { fetchCatalogServerSide } from '@/lib/server/catalogFetcher';
import CatalogClient from './CatalogClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Catalog | BookMyBike',
    description: 'Browse the latest bikes and scooters with best market offers.',
};

export default async function CatalogPage() {
    // Server-side fetch (uses cookies for location logic automatically)
    const initialItems = await fetchCatalogServerSide();

    return <CatalogClient initialItems={initialItems} />;
}
