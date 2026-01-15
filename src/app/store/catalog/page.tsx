'use client';

import React, { Suspense } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { DeviceLayout } from '@/components/layout/DeviceLayout';
import { CatalogMobile } from '@/components/store/CatalogMobile';
import { CatalogTablet } from '@/components/store/CatalogTablet';
import { CatalogDesktop } from '@/components/store/CatalogDesktop';

import { useCatalog } from '@/hooks/useCatalog';

const CatalogSkeleton = () => (
    <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 pt-24 pb-20 space-y-8 bg-white dark:bg-[#020617] min-h-screen">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-white/10 sticky top-24 z-30 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl">
            <div className="space-y-2">
                <div className="h-3 w-16 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
                <div className="h-8 w-48 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="flex gap-4">
                <div className="h-10 w-32 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
                <div className="h-10 w-24 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
            </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[520px]"
                >
                    <div className="aspect-[16/10] bg-slate-50 dark:bg-white/5 animate-pulse relative border-b border-slate-100 dark:border-white/5">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-slate-200 dark:bg-white/5 rounded-full opacity-50" />
                        </div>
                    </div>
                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
                                    <div className="h-3 w-20 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
                                </div>
                                <div className="h-4 w-12 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-3 mt-2 border-t border-slate-100 dark:border-white/5 pt-4">
                                <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
                                <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
                                <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
                            </div>

                            <div className="flex gap-2">
                                {[1, 2, 3].map(d => (
                                    <div key={d} className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/5" />
                                ))}
                            </div>
                        </div>
                        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
                                <div className="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
                            </div>
                            <div className="h-12 w-full bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

import { CatalogTV } from '@/components/store/tv/CatalogTV';

function CatalogContent() {
    const { items, isLoading } = useCatalog();
    const filters = useCatalogFilters(items);

    if (isLoading) {
        return <CatalogSkeleton />;
    }

    return (
        <DeviceLayout
            mobile={<CatalogMobile filters={filters} />}
            tablet={<CatalogTablet filters={filters} />}
            desktop={<CatalogDesktop filters={filters} />}
            tv={<CatalogTV />}
        />
    );
}

export default function CatalogPage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <CatalogContent />
        </Suspense>
    );
}
