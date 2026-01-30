import React from 'react';
import { fetchCatalogServerSide } from '@/lib/server/catalogFetcher';
import CatalogClient from './CatalogClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Catalog | BookMyBike',
    description: 'Browse the latest bikes and scooters with best market offers.',
};

export default async function CatalogPage(props: { searchParams: Promise<{ leadId?: string }> }) {
    const searchParams = await props.searchParams;
    const leadId = searchParams.leadId;

    // Server-side fetch (uses cookies for location logic automatically)
    // If leadId is present, the fetcher will resolve dealer context.
    const initialItems = await fetchCatalogServerSide(leadId);

    return <CatalogClient initialItems={initialItems} />;
}
