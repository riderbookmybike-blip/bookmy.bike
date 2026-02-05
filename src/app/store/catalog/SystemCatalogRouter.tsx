'use client';

import React, { useState, useEffect } from 'react';
import { DesktopCatalog } from '@/components/store/DesktopCatalog';
import { PhoneCatalog } from '@/components/phone/catalog/PhoneCatalog';
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

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return <PhoneCatalog />;
    }

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
