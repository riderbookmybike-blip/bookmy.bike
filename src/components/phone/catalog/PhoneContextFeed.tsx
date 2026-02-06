'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { PhoneHeader } from '@/components/phone/layout/PhoneHeader';
import { ModelCard } from './ModelCard';
import { PhoneFilterModal } from '@/components/phone/catalog/PhoneFilterModal';
import { PhoneBottomNav } from '@/components/phone/layout/PhoneBottomNav';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel } from '@/utils/variantGrouping';
import { useI18n } from '@/components/providers/I18nProvider';
import { MobileFeedSkeleton } from '@/components/store/CatalogSkeleton';

export const PhoneContextFeed = () => {
    const { items, isLoading } = useSystemCatalogLogic();
    const { t } = useI18n();

    // Group products by model for variant navigation
    const modelGroups = useMemo(() => groupProductsByModel(items), [items]);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showGuide, setShowGuide] = useState(false);

    // TEMPORARY DEBUG GRID
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Global Filter State Integration
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (searchParams.get('filter') === 'true') {
            setIsFilterOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const seen = localStorage.getItem('phone_catalog_nav_hint_seen');
        if (!seen) {
            setShowGuide(true);
        }
    }, []);

    const closeFilter = () => {
        setIsFilterOpen(false);
        // Reset URL to allow re-triggering
        const params = new URLSearchParams(searchParams.toString());
        params.delete('filter');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const index = Math.round(e.currentTarget.scrollTop / window.innerHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    // Deep Linking Scroll Logic
    useEffect(() => {
        const modelSlug = searchParams.get('model');
        if (modelSlug && modelGroups.length > 0) {
            const index = modelGroups.findIndex(
                g =>
                    g.modelSlug?.toLowerCase() === modelSlug.toLowerCase() ||
                    g.model?.toLowerCase() === modelSlug.toLowerCase()
            );

            if (index !== -1) {
                // Scroll to element
                const element = document.getElementById(`model-${index}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'auto' }); // Instant scroll on load
                    setActiveIndex(index);
                }
            }
        }
    }, [searchParams, modelGroups]);

    if (isLoading) {
        return (
            <div
                className="w-full bg-slate-50 dark:bg-black relative overscroll-none"
                style={{ height: '100dvh', maxHeight: '100dvh' }}
            >
                <PhoneHeader />
                <div className="w-full h-[100dvh] overflow-y-auto pb-4 overscroll-y-contain no-scrollbar">
                    <MobileFeedSkeleton count={3} />
                </div>
                <PhoneBottomNav />
            </div>
        );
    }

    return (
        <div
            className="w-full bg-slate-50 dark:bg-black relative overscroll-none"
            style={{ height: '100dvh', maxHeight: '100dvh' }}
        >
            {/* 1. Global Floating Header (Hamburger & Logo) */}
            <PhoneHeader />

            {/* 2. Vertical Scroll Feed */}
            <div
                className="w-full h-[100dvh] overflow-y-auto pb-4 overscroll-y-contain no-scrollbar scroll-smooth"
                onScroll={handleScroll}
            >
                {showGuide && (
                    <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-40 w-[92%]">
                        <div className="bg-black/80 text-white rounded-2xl px-4 py-3 text-[11px] font-semibold flex items-center justify-between gap-3 shadow-xl">
                            <div>
                                <div className="font-black uppercase tracking-widest text-[10px] text-[#F4B000]">
                                    Quick Help
                                </div>
                                <div>Swipe left/right to change variants.</div>
                                <div>Scroll down for more models.</div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowGuide(false);
                                    localStorage.setItem('phone_catalog_nav_hint_seen', '1');
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-[#F4B000]"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-6 pt-[58px] px-5">
                    {modelGroups.map((modelGroup, index) => (
                        <div
                            key={`${modelGroup.make}-${modelGroup.model}`}
                            id={`model-${index}`}
                            className="w-full shrink-0"
                        >
                            <ModelCard variants={modelGroup.variants} isActive={index === activeIndex} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Filter Modal */}
            <PhoneFilterModal isOpen={isFilterOpen} onClose={closeFilter} />

            <PhoneBottomNav />
        </div>
    );
};
