'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CatalogGridSkeleton } from '@/components/store/CatalogSkeleton';

const DesktopCatalog = dynamic(() => import('@/components/store/DesktopCatalog').then(m => m.DesktopCatalog), {
    loading: () => <CatalogGridSkeleton count={6} />,
});

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
    for (const item of items) {
        const key = `${String(item.make || '').toLowerCase()}::${String(item.model || '').toLowerCase()}`;
        const current = byModel.get(key);
        if (!current || getDisplayPrice(item) < getDisplayPrice(current)) {
            byModel.set(key, item);
        }
    }
    return Array.from(byModel.values());
}

function SmartCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const { items: clientItems, isLoading: isClientLoading } = useSystemCatalogLogic(leadId || undefined, {
        allowStateOnly: true,
    });
    const currentItems = selectLowestVariantPerModel(clientItems.length > 0 ? clientItems : initialItems);
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);

    return (
        <DesktopCatalog
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
    const currentItems = selectLowestVariantPerModel(clientItems.length > 0 ? clientItems : initialItems);
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
            needsLocation={needsLocation}
        />
    );
}

export default function SystemCatalogRouter(props: SystemCatalogRouterProps) {
    return props.mode === 'smart' ? <SmartCatalogRouter {...props} /> : <DefaultCatalogRouter {...props} />;
}
