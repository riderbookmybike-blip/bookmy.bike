'use client';

import React from 'react';
import { MasterCatalog } from '@/components/store/MasterCatalog';
import { useCatalog } from '@/hooks/useCatalog';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams } from 'next/navigation';

interface CatalogClientProps {
    initialItems: ProductVariant[];
    basePath?: string;
}

export default function CatalogClient({ initialItems, basePath = '/store' }: CatalogClientProps) {
    // We pass initialItems to useCatalog so it can use them as initial data
    // actually useCatalog refactor didn't explicitly take initialData yet, 
    // but MasterCatalog takes 'initialItems' prop.
    // 
    // AND useCatalogFilters needs items to filter.
    // If we use 'initialItems' to initialize filters, we get immediate results.

    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');

    const { items: clientItems } = useCatalog();
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;

    const filters = useCatalogFilters(currentItems);

    return (
        <MasterCatalog
            filters={filters}
            initialItems={initialItems}
            leadId={leadId || undefined}
            basePath={basePath}
        />
    );
}
