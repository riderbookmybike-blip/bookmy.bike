'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { PhoneHeader } from '@/components/phone/layout/PhoneHeader';
import { ModelCard } from './ModelCard';
import { PhoneFilterModal } from '@/components/phone/catalog/PhoneFilterModal';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel } from '@/utils/variantGrouping';

export const PhoneContextFeed = () => {
    const { items, isLoading } = useSystemCatalogLogic();

    // Group products by model for variant navigation
    const modelGroups = useMemo(() => groupProductsByModel(items), [items]);

    const [activeIndex, setActiveIndex] = useState(0);
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
            const index = modelGroups.findIndex(g =>
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
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <div className="text-white text-sm font-bold uppercase tracking-widest">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full bg-black relative overscroll-none" style={{ height: '100dvh', maxHeight: '100dvh' }}>

            {/* 1. Global Floating Header (Hamburger & Logo) */}
            <PhoneHeader />

            {/* 2. Vertical Snap Scroll Feed */}
            <div
                className="w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
                style={{ height: '100dvh', touchAction: 'pan-y' }}
                onScroll={handleScroll}
            >
                {modelGroups.map((modelGroup, index) => (
                    <div
                        key={`${modelGroup.make}-${modelGroup.model}`}
                        id={`model-${index}`}
                        className="snap-start shrink-0"
                        style={{ height: '100dvh' }}
                    >
                        <ModelCard
                            variants={modelGroup.variants}
                            isActive={index === activeIndex}
                        />
                    </div>
                ))}

                {/* End of Feed Screen */}
                <div className="bg-black flex flex-col items-center justify-center snap-start p-10 text-center" style={{ height: '100dvh' }}>
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                        <ChevronDown className="text-zinc-700 animate-bounce" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic">Fresh Inventory Loading</h2>
                    <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest mt-2">Come back in 1 hour for new deals</p>

                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="mt-10 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase text-white tracking-widest"
                    >
                        Back to Top
                    </button>
                </div>
            </div>

            {/* 3. Filter Modal */}
            <PhoneFilterModal isOpen={isFilterOpen} onClose={closeFilter} />

        </div>
    );
};
