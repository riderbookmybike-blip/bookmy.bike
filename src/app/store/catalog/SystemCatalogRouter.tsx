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
    mode?: 'default' | 'smart';
}

function SmartCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const filters = useCatalogFilters(initialItems);

    return (
        <DesktopCatalog
            filters={filters}
            leadId={leadId || undefined}
            basePath={basePath}
            items={initialItems}
            isLoading={false}
            mode="smart"
        />
    );
}

function DefaultCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const { items: clientItems, isLoading: isClientLoading } = useSystemCatalogLogic(leadId || undefined);
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
            mode="default"
        />
    );
}

export default function SystemCatalogRouter(props: SystemCatalogRouterProps) {
    return props.mode === 'smart' ? <SmartCatalogRouter {...props} /> : <DefaultCatalogRouter {...props} />;
}
