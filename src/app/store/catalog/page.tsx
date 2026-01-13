'use client';

import React, { Suspense } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { DeviceLayout } from '@/components/layout/DeviceLayout';
import { CatalogMobile } from '@/components/store/CatalogMobile';
import { CatalogTablet } from '@/components/store/CatalogTablet';
import { CatalogDesktop } from '@/components/store/CatalogDesktop';

import { useCatalog } from '@/hooks/useCatalog';

function CatalogContent() {
    const { items, isLoading } = useCatalog();
    const filters = useCatalogFilters(items);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white text-center pt-20">
                Loading Catalog Data...
            </div>
        );
    }

    return (
        <DeviceLayout
            mobile={<CatalogMobile filters={filters} />}
            tablet={<CatalogTablet filters={filters} />}
            desktop={<CatalogDesktop filters={filters} />}
        />
    );
}

export default function CatalogPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white text-center pt-20">
                    Loading Catalog...
                </div>
            }
        >
            <CatalogContent />
        </Suspense>
    );
}
