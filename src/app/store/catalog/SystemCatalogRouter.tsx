'use client';

import React, { useMemo } from 'react';
import { UniversalCatalog } from '@/components/store/UniversalCatalog';
import { CatalogGridSkeleton } from '@/components/store/CatalogSkeleton';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams } from 'next/navigation';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';

interface SystemCatalogRouterProps {
    initialItems: ProductVariant[];
    basePath?: string;
    mode?: 'default' | 'smart';
    initialDevice?: 'phone' | 'desktop' | 'tv';
}

function getDisplayPrice(item: ProductVariant): number {
    const onRoad = Number(item.price?.onRoad);
    if (Number.isFinite(onRoad) && onRoad > 0) return onRoad;
    return Number.POSITIVE_INFINITY;
}

function selectLowestVariantPerModel(items: ProductVariant[]): ProductVariant[] {
    const byModel = new Map<string, ProductVariant>();
    const modelCounts = new Map<string, number>();
    for (const item of items) {
        const key = `${String(item.make || '').toLowerCase()}::${String(item.model || '').toLowerCase()}`;
        modelCounts.set(key, (modelCounts.get(key) || 0) + 1);
        const current = byModel.get(key);
        if (!current || getDisplayPrice(item) < getDisplayPrice(current)) {
            byModel.set(key, item);
        }
    }
    return Array.from(byModel.entries()).map(([key, item]) => ({
        ...item,
        modelVariantCount: modelCounts.get(key) || 1,
    }));
}

function SmartCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const { items: clientItems, isLoading: isClientLoading } = useSystemCatalogLogic(leadId || undefined, {
        allowStateOnly: true,
    });
    const currentItems = useMemo(
        () => selectLowestVariantPerModel(clientItems.length > 0 ? clientItems : initialItems),
        [clientItems, initialItems]
    );
    // Only show loading skeleton when client fetch is in flight AND there are no items
    // to show yet (neither from SSR initialItems nor from a previous client fetch).
    // When initialItems are present from SSR, skip the skeleton entirely — cards are
    // already in the HTML and visible before JS hydrates.
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);

    return (
        <UniversalCatalog
            filters={filters}
            leadId={leadId || undefined}
            basePath={basePath}
            items={currentItems}
            isLoading={loading}
            mode="smart"
        />
    );
}

function DefaultCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const {
        items: clientItems,
        isLoading: isClientLoading,
        needsLocation,
    } = useSystemCatalogLogic(leadId || undefined, { allowStateOnly: true });
    const currentItems = useMemo(
        () => selectLowestVariantPerModel(clientItems.length > 0 ? clientItems : initialItems),
        [clientItems, initialItems]
    );
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);

    return (
        <UniversalCatalog
            filters={filters}
            leadId={leadId || undefined}
            basePath={basePath}
            items={currentItems}
            isLoading={loading}
            mode="default"
            needsLocation={needsLocation}
        />
    );
}

export default function SystemCatalogRouter(props: SystemCatalogRouterProps) {
    return props.mode === 'smart' ? <SmartCatalogRouter {...props} /> : <DefaultCatalogRouter {...props} />;
}
