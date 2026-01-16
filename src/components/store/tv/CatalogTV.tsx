'use client';

import React, { useMemo, useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/store/CatalogDesktop';
import { SmartFilterDrawer } from './SmartFilterDrawer';
import { MARKET_METRICS } from '@/config/market';

/**
 * Tier 5: TV / Ultra-Wide Catalog Platform
 * Enforces Rule of Three and extreme vertical compression for 540px viewports.
 */
export function CatalogTV() {
    const { items } = useCatalog();
    const [activeCategory, setActiveCategory] = useState<'ALL' | 'MOTORCYCLE' | 'SCOOTER' | 'MOPED'>('ALL');
    const [activeBrands, setActiveBrands] = useState<string[]>([]);
    const [activeEngines, setActiveEngines] = useState<string[]>([]);
    const [activeFuels, setActiveFuels] = useState<string[]>([]);
    const [activeDownpayment, setActiveDownpayment] = useState<number | null>(null);
    const [activeTenure, setActiveTenure] = useState<number | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    React.useEffect(() => {
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            // Autohide removed as per user request (transparent icons are unobtrusive)
            setIsVisible(true);

            lastScrollY = currentScrollY;
        };
        const handleShow = () => setIsVisible(true);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('showCatalogHeader', handleShow);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('showCatalogHeader', handleShow);
        };
    }, []);

    // Mock state for filters (logic kept simple for TV)
    const downpayment = activeDownpayment ?? 50000;
    const tenure = activeTenure ?? 36;

    // Helper to parse metrics like "765 mm" or "110 kg"
    const parseMetric = (val?: string) => {
        if (!val) return Infinity;
        const num = parseFloat(val.replace(/[^\d.]/g, ''));
        return isNaN(num) ? Infinity : num;
    };

    const results = useMemo(() => {
        let filtered = items;

        // 1. Filter by Category
        if (activeCategory !== 'ALL') {
            filtered = filtered.filter(item => item.bodyType === activeCategory);
        }

        // 2. Filter by Brands
        if (activeBrands.length > 0) {
            filtered = filtered.filter(item => activeBrands.includes(item.make.toLowerCase().replace(/\s+/g, '_')));
        }

        return filtered;
    }, [items, activeCategory, activeBrands]);

    const handleToggleBrand = (brandId: string) => {
        setActiveBrands(prev => (prev.includes(brandId) ? prev.filter(b => b !== brandId) : [...prev, brandId]));
    };

    const handleToggleEngine = (engineId: string) => {
        setActiveEngines(prev => (prev.includes(engineId) ? prev.filter(e => e !== engineId) : [...prev, engineId]));
    };

    const handleToggleFuel = (fuelId: string) => {
        setActiveFuels(prev => (prev.includes(fuelId) ? prev.filter(f => f !== fuelId) : [...prev, fuelId]));
    };

    const handleSelectDownpayment = (amount: number | null) => {
        setActiveDownpayment(amount);
    };

    const handleSelectTenure = (months: number | null) => {
        setActiveTenure(months);
    };

    const handleResetFilters = () => {
        setActiveBrands([]);
        setActiveEngines([]);
        setActiveFuels([]);
        setActiveDownpayment(null);
        setActiveTenure(null);
        setActiveCategory('ALL');
        setIsFilterOpen(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500 font-sans pt-24">
            {/* Top trigger zone for Catalog Header when hidden */}
            <div
                className="fixed top-0 left-0 right-0 h-4 z-[45]"
                onMouseEnter={() => window.dispatchEvent(new CustomEvent('showCatalogHeader'))}
            />

            {/* Ultra-Slim TV Header - Minimal Sticky with Smart Autohide */}
            <header
                className={`sticky top-0 z-40 bg-white/90 dark:bg-black/80 backdrop-blur-3xl border-b border-slate-100 dark:border-white/5 py-4 transition-transform duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
                onMouseEnter={() => setIsVisible(true)}
            >
                <div className="max-w-[1440px] mx-auto px-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-3 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                            <SlidersHorizontal size={14} strokeWidth={2.5} /> CUSTOMIZE
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

                        <div className="flex gap-2">
                            {(['MOTORCYCLE', 'SCOOTER', 'MOPED'] as const).map(option => (
                                <button
                                    key={option}
                                    onClick={() => setActiveCategory(activeCategory === option ? 'ALL' : option)}
                                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        activeCategory === option
                                            ? 'bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-105'
                                            : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 shadow-md shadow-slate-900/10 dark:shadow-white/5'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black italic text-slate-900 dark:text-white tracking-widest leading-none">
                            {results.length} VEHICLES
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-[1440px] px-20 py-6">
                <div className="grid grid-cols-3 gap-10 w-full">
                    {results.map(v => (
                        <div key={v.id} className="transform transition-transform active:scale-95">
                            <ProductCard v={v} viewMode="grid" downpayment={downpayment} tenure={tenure} isTv={true} />
                        </div>
                    ))}
                </div>
            </main>

            <SmartFilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                activeBrands={activeBrands}
                onToggleBrand={handleToggleBrand}
                activeEngines={activeEngines}
                onToggleEngine={handleToggleEngine}
                activeFuels={activeFuels}
                onToggleFuel={handleToggleFuel}
                activeDownpayment={activeDownpayment}
                onSelectDownpayment={handleSelectDownpayment}
                activeTenure={activeTenure}
                onSelectTenure={handleSelectTenure}
                onReset={handleResetFilters}
            />
        </div>
    );
}
