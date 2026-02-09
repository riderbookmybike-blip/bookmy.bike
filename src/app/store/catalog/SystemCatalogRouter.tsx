'use client';

import React from 'react';
import { DesktopCatalog } from '@/components/store/DesktopCatalog';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams } from 'next/navigation';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';

interface SystemCatalogRouterProps {
    initialItems: ProductVariant[];
    basePath?: string;
}

export default function SystemCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');

    const { items: clientItems, isLoading: isClientLoading } = useSystemCatalogLogic(leadId || undefined);

    // Prefer client-resolved items when available
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;
    const loading = isClientLoading && currentItems.length === 0;

    const filters = useCatalogFilters(currentItems);

    return (
        <DesktopCatalog
            filters={filters}
            leadId={leadId || undefined}
            basePath={basePath}
            items={currentItems}
            isLoading={loading}
        />
    );
}
