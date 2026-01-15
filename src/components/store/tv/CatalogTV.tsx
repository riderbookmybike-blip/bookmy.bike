'use client';

import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, MapPin, Zap, X, Filter } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/store/CatalogDesktop';

/**
 * Tier 5: TV / Ultra-Wide Catalog Platform
 * Enforces Rule of Three and extreme vertical compression for 540px viewports.
 */
export function CatalogTV() {
    const { items } = useCatalog();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Mock state for filters (logic kept simple for TV)
    const downpayment = 50000;
    const tenure = 36;
    const activeFilterCount = 0;

    const results = useMemo(() => {
        const vehicles = [...items];
        if (sortBy === 'price') vehicles.sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
        return vehicles;
    }, [items, sortBy]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500 font-sans">
            {/* Ultra-Slim TV Header */}
            <header className="sticky top-20 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-3xl border-b border-slate-100 dark:border-white/5 py-4">
                <div className="max-w-[1440px] mx-auto px-12 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className="text-4xl font-black italic text-slate-900 dark:text-white tracking-widest leading-none">
                            {results.length} BIKES
                        </h1>
                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                        <div className="flex gap-2">
                            {(['popular', 'price', 'emi'] as const).map(option => (
                                <button
                                    key={option}
                                    onClick={() => setSortBy(option)}
                                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                        sortBy === option
                                            ? 'bg-brand-primary border-brand-primary text-black'
                                            : 'border-slate-200 dark:border-white/10 text-slate-500'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                        >
                            {viewMode === 'grid' ? <List size={24} /> : <LayoutGrid size={24} />}
                        </button>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-3 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-black uppercase tracking-widest"
                        >
                            <Filter size={18} /> Filters
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-[1440px] px-12 py-8">
                {/* Result Grid with Enforced 3-Columns for TV */}
                <div className={`grid grid-cols-3 gap-10 w-full`}>
                    {results.map(v => (
                        <div key={v.id} className="transform transition-transform active:scale-95">
                            <ProductCard v={v} viewMode="grid" downpayment={downpayment} tenure={tenure} isTv={true} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
