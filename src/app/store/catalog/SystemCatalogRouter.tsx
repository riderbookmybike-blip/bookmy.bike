'use client';

import React from 'react';
import { DesktopCatalog } from '@/components/store/DesktopCatalog';
import { MobileCatalog } from '@/components/store/mobile/MobileCatalog';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams } from 'next/navigation';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface SystemCatalogRouterProps {
    initialItems: ProductVariant[];
    basePath?: string;
    mode?: 'default' | 'smart';
}

function SmartCatalogRouter({ initialItems, basePath = '/store' }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const { items: clientItems, isLoading: isClientLoading } = useSystemCatalogLogic(leadId || undefined);
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

    if (isPhone) {
        return (
            <MobileCatalog
                filters={filters}
                leadId={leadId || undefined}
                basePath={basePath}
                items={currentItems}
                isLoading={loading}
                mode="smart"
            />
        );
    }

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
        resolvedStudioId,
        resolvedDealerName,
    } = useSystemCatalogLogic(leadId || undefined);
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

    if (isPhone) {
        return (
            <MobileCatalog
                filters={filters}
                leadId={leadId || undefined}
                basePath={basePath}
                items={currentItems}
                isLoading={loading}
                mode="default"
                needsLocation={needsLocation}
                resolvedStudioId={resolvedStudioId}
                resolvedDealerName={resolvedDealerName}
            />
        );
    }

    return (
        <DesktopCatalog
            filters={filters}
            leadId={leadId || undefined}
            basePath={basePath}
            items={currentItems}
            isLoading={loading}
            mode="default"
            needsLocation={needsLocation}
            resolvedStudioId={resolvedStudioId}
            resolvedDealerName={resolvedDealerName}
        />
    );
}

export default function SystemCatalogRouter(props: SystemCatalogRouterProps) {
    return (
        <FavoritesProvider>
            {props.mode === 'smart' ? <SmartCatalogRouter {...props} /> : <DefaultCatalogRouter {...props} />}
        </FavoritesProvider>
    );
}
