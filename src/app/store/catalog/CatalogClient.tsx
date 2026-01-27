'use client';

import React from 'react';
import { MasterCatalog } from '@/components/store/MasterCatalog';
import { useCatalog } from '@/hooks/useCatalog';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { ProductVariant } from '@/types/productMaster';

interface CatalogClientProps {
    initialItems: ProductVariant[];
}

export default function CatalogClient({ initialItems }: CatalogClientProps) {
    // We pass initialItems to useCatalog so it can use them as initial data
    // actually useCatalog refactor didn't explicitly take initialData yet, 
    // but MasterCatalog takes 'initialItems' prop.
    // 
    // AND useCatalogFilters needs items to filter.
    // If we use 'initialItems' to initialize filters, we get immediate results.

    const { items: clientItems, isLoading } = useCatalog();

    // Use client items if available, otherwise server items
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;

    const filters = useCatalogFilters(currentItems);

    return (
        <MasterCatalog
            filters={filters}
            initialItems={initialItems}
        />
    );
}
