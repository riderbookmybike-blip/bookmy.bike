'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFavorites } from '@/lib/favorites/favoritesContext';

type CompareTab = 'wishlist' | 'variants' | 'studio';

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

export function SystemCompareRouter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { favorites } = useFavorites();
    const tabParam = searchParams.get('tab');
    const hasModelContext = Boolean(searchParams.get('make') && searchParams.get('model'));
    const activeTab: CompareTab =
        tabParam === 'wishlist' || tabParam === 'variants' || tabParam === 'studio'
            ? tabParam
            : favorites.length > 0
              ? 'wishlist'
              : 'studio';

    const setTab = (tab: CompareTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="pb-6">
            <div className="store-page-shell pt-4">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                    {(
                        [
                            { id: 'wishlist', label: 'Wishlist' },
                            { id: 'variants', label: 'Variants' },
                            { id: 'studio', label: 'Studio' },
                        ] as { id: CompareTab; label: string }[]
                    ).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                                activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'wishlist' && <WishlistClient />}

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
