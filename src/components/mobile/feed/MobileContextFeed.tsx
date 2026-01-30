'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { FullPageDeal } from './FullPageDeal';
import { MobileFilterModal } from '@/components/mobile/shared/MobileFilterModal';
import { useCatalog } from '@/hooks/useCatalog';

export const MobileContextFeed = () => {
    const { items, isLoading } = useCatalog();
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

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <div className="text-white text-sm font-bold uppercase tracking-widest">Loading...</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black relative overscroll-none">

            {/* 1. Global Floating Header (Hamburger & Logo) */}
            <MobileHeader />

            {/* 2. Vertical Snap Scroll Feed */}
            <div
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
                onScroll={handleScroll}
            >
                {items.map((product, index) => (
                    <FullPageDeal
                        key={product.id}
                        product={product}
                        isActive={index === activeIndex}
                    />
                ))}

                {/* End of Feed Screen */}
                <div className="h-full bg-black flex flex-col items-center justify-center snap-start p-10 text-center">
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
            <MobileFilterModal isOpen={isFilterOpen} onClose={closeFilter} />

        </div>
    );
};
