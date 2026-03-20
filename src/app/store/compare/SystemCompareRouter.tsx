'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { resolveCompareTab, type CompareTab } from '@/components/store/cards/vehicleModeConfig';
import { PincodeGateModal } from '@/components/store/Personalize/PincodeGateModal';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';

const DesktopCompare = dynamic(() => import('@/components/store/desktop/DesktopCompare'), {
    loading: () => (
        <div className="p-8 space-y-6 animate-pulse">
            <div className="h-14 bg-slate-100 rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-80 bg-slate-100 rounded-3xl" />
                ))}
            </div>
        </div>
    ),
});

const MobileCompare = dynamic(
    () => import('@/components/store/mobile/MobileCompare').then(m => ({ default: m.MobileCompare })),
    {
        loading: () => (
            <div className="p-4 space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
                    ))}
                </div>
            </div>
        ),
    }
);

const WishlistClient = dynamic(() =>
    import('@/components/store/WishlistClient').then(m => ({ default: m.WishlistClient }))
);

const CompareStudio = dynamic(() => import('./ComparePageClient').then(m => ({ default: m.ComparePageClient })));

export function SystemCompareRouter({ forcedTab }: { forcedTab?: CompareTab } = {}) {
    const searchParams = useSearchParams();
    const { favorites } = useFavorites();
    const { needsLocation } = useSystemCatalogLogic(undefined, { allowStateOnly: true });
    const tabParam = searchParams.get('tab');
    const hasModelContext = Boolean(searchParams.get('make') && searchParams.get('model'));
    const activeTab: CompareTab = forcedTab ?? resolveCompareTab(tabParam, favorites.length > 0);

    if (needsLocation) {
        return (
            <div className="min-h-screen bg-slate-50">
                <PincodeGateModal
                    isOpen
                    onResolved={() => {
                        window.dispatchEvent(new Event('locationChanged'));
                    }}
                />
            </div>
        );
    }

    return (
        <div className="pb-6">
            {activeTab === 'favorites' && <DesktopCompare isWishlist={true} />}

            {activeTab === 'studio' && <CompareStudio />}

            {activeTab === 'variants' && (
                <>
                    {!hasModelContext ? (
                        <div className="store-page-shell min-h-[40vh] flex flex-col items-center justify-center text-center">
                            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                                Choose a Model for Variants
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Open any model from catalog to compare variants.
                            </p>
                            <Link
                                href="/store/catalog"
                                className="mt-6 px-6 py-3 rounded-xl bg-[#F4B000] text-black text-[10px] font-black uppercase tracking-widest"
                            >
                                Go to Catalog
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="lg:hidden">
                                <MobileCompare />
                            </div>
                            <div className="hidden lg:block">
                                <DesktopCompare />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
