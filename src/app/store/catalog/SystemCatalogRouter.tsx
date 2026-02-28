'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DesktopCatalog = dynamic(() => import('@/components/store/DesktopCatalog').then(m => m.DesktopCatalog), {
    loading: () => (
        <div className="p-8 space-y-6 animate-pulse">
            <div className="h-14 bg-slate-100 rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-72 bg-slate-100 rounded-3xl" />
                ))}
            </div>
        </div>
    ),
});

const MobileCatalog = dynamic(() => import('@/components/store/mobile/MobileCatalog').then(m => m.MobileCatalog));

const TvCatalog = dynamic(() => import('@/components/store/tv/TvCatalog').then(m => m.TvCatalog), {
    loading: () => (
        <div className="min-h-screen bg-[#0b0d10] p-28 space-y-12 animate-pulse">
            <div className="h-20 bg-white/5 rounded-3xl w-1/3" />
            <div className="grid grid-cols-3 gap-24">
                {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-[3/4] bg-white/5 rounded-[3rem]" />
                ))}
            </div>
        </div>
    ),
});
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams } from 'next/navigation';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';

import { useBreakpoint } from '@/hooks/useBreakpoint';

interface SystemCatalogRouterProps {
    initialItems: ProductVariant[];
    basePath?: string;
    mode?: 'default' | 'smart';
    initialDevice?: 'phone' | 'desktop' | 'tv';
}

function SmartCatalogRouter({ initialItems, basePath = '/store', initialDevice }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const {
        items: clientItems,
        isLoading: isClientLoading,
        resolvedDealerId,
        resolvedStudioId,
        resolvedDealerName,
    } = useSystemCatalogLogic(leadId || undefined);
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);
    const { device } = useBreakpoint(initialDevice || 'desktop');
    const isPhone = device === 'phone';
    const isTv = device === 'tv';

    if (isTv) {
        return <TvCatalog items={currentItems} isLoading={loading} />;
    }

    if (isPhone) {
        return (
            <MobileCatalog
                filters={filters}
                leadId={leadId || undefined}
                basePath={basePath}
                items={currentItems}
                isLoading={loading}
                mode="smart"
                resolvedDealerId={resolvedDealerId}
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
            mode="smart"
            resolvedDealerId={resolvedDealerId}
            resolvedStudioId={resolvedStudioId}
            resolvedDealerName={resolvedDealerName}
        />
    );
}

function DefaultCatalogRouter({ initialItems, basePath = '/store', initialDevice }: SystemCatalogRouterProps) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const {
        items: clientItems,
        isLoading: isClientLoading,
        needsLocation,
        resolvedDealerId,
        resolvedStudioId,
        resolvedDealerName,
    } = useSystemCatalogLogic(leadId || undefined);
    const currentItems = clientItems.length > 0 ? clientItems : initialItems;
    const loading = isClientLoading && currentItems.length === 0;
    const filters = useCatalogFilters(currentItems);
    const { device } = useBreakpoint(initialDevice || 'desktop');
    const isPhone = device === 'phone';
    const isTv = device === 'tv';

    if (isTv) {
        return <TvCatalog items={currentItems} isLoading={loading} needsLocation={needsLocation} />;
    }

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
                resolvedDealerId={resolvedDealerId}
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
            resolvedDealerId={resolvedDealerId}
            resolvedStudioId={resolvedStudioId}
            resolvedDealerName={resolvedDealerName}
        />
    );
}

export default function SystemCatalogRouter(props: SystemCatalogRouterProps) {
    return props.mode === 'smart' ? <SmartCatalogRouter {...props} /> : <DefaultCatalogRouter {...props} />;
}
