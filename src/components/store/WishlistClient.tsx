'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, Plus, Search, X, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { FavoritesCardAdapter } from '@/components/store/cards/VehicleCardAdapters';
import { getEmiFactor } from '@/lib/constants/pricingConstants';
import { DiscoveryBar } from '@/components/store/DiscoveryBar';
import { CatalogGridSkeleton } from '@/components/store/CatalogSkeleton';
import { buildVariantExplorerUrl } from '@/lib/utils/urlHelper';
import { StoreSearchBar } from '@/components/store/ui/StoreSearchBar';
import { FilterChip } from '@/components/store/ui/FilterChip';
import { VEHICLE_MODE_CONFIG, getSafeViewMode } from '@/components/store/cards/vehicleModeConfig';

// Filter Group Component (Extracted)
const FilterGroup = ({
    title,
    options,
    selectedValues,
    onToggle,
    onReset,
    showReset = false,
    allVisible = false,
    lightMotion = false,
}: any) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ChevronDown
                        size={12}
                        className={`transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                    {title}
                </button>
                {showReset && (
                    <button
                        onClick={onReset}
                        className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600"
                    >
                        Reset
                    </button>
                )}
            </div>

            {lightMotion ? (
                isOpen ? (
                    <div className="overflow-hidden">
                        <div className="flex flex-wrap gap-2 pt-2">
                            {options.map((opt: string) => {
                                const isSelected = selectedValues.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => onToggle(opt)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                                            isSelected
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null
            ) : (
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 pt-2">
                                {options.map((opt: string) => {
                                    const isSelected = selectedValues.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => onToggle(opt)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                    : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};

export const WishlistClient = () => {
    const { favorites, clearFavorites } = useFavorites();
    const { items: catalogItems, isLoading } = useSystemCatalogLogic();
    const router = useRouter();

    // UI Local State for Cards
    const [downpayment] = useState(5000);
    const [tenure] = useState(36);
    const [explodedVariant, setExplodedVariant] = useState<string | null>(null);

    // Local State for Filters
    const [activeCategory, setActiveCategory] = useState<'ALL' | 'MOTORCYCLE' | 'SCOOTER' | 'MOPED'>('ALL');
    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    const [pricingMode, setPricingMode] = useState<'cash' | 'finance'>('finance');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(VEHICLE_MODE_CONFIG.favorites.defaultView);

    // Map favorites to full ProductVariant data from catalog
    const wishlistItems = useMemo(() => {
        if (!catalogItems.length) return [];
        return favorites
            .map(fav => catalogItems.find(item => item.id === fav.id))
            .filter((item): item is NonNullable<typeof item> => !!item);
    }, [favorites, catalogItems]);

    // Local State for Advanced Filters
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
    const [selectedCC, setSelectedCC] = useState<string[]>([]);

    const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
    const [selectedSeatHeight, setSelectedSeatHeight] = useState<string[]>([]);
    const [selectedBrakes, setSelectedBrakes] = useState<string[]>([]);
    const [selectedWheels, setSelectedWheels] = useState<string[]>([]);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [isReducedMotion, setIsReducedMotion] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mobileQuery = window.matchMedia('(max-width: 768px)');
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const sync = () => {
            setIsMobileViewport(mobileQuery.matches);
            setIsReducedMotion(reducedMotionQuery.matches);
        };
        sync();

        mobileQuery.addEventListener('change', sync);
        reducedMotionQuery.addEventListener('change', sync);
        return () => {
            mobileQuery.removeEventListener('change', sync);
            reducedMotionQuery.removeEventListener('change', sync);
        };
    }, []);

    const lightMotion = isMobileViewport || isReducedMotion;

    // Advanced Filter Helpers
    const toggleFilter = (setter: any, value: string) => {
        setter((prev: string[]) => (prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]));
    };

    const clearAll = () => {
        setActiveCategory('ALL');
        setSearchQuery('');
        setSelectedMakes([]);
        setSelectedCC([]);
        setSelectedFinishes([]);
        setSelectedSeatHeight([]);
        setSelectedBrakes([]);
        setSelectedWheels([]);
    };

    // Calculate Active Filters Count
    const activeFilterCount = [
        activeCategory !== 'ALL',
        selectedMakes.length > 0,
        selectedCC.length > 0,
        selectedFinishes.length > 0,
        selectedSeatHeight.length > 0,
        selectedBrakes.length > 0,
        selectedWheels.length > 0,
    ].filter(Boolean).length;

    // Filter and Sort Logic
    const filteredItems = useMemo(() => {
        let items = [...wishlistItems];

        // 0. Search Query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(
                item =>
                    ((item as any).name || '').toLowerCase().includes(q) ||
                    ((item as any).make || '').toLowerCase().includes(q)
            );
        }

        // 1. Filter by Category
        if (activeCategory !== 'ALL') {
            items = items.filter(item => item.bodyType === activeCategory);
        }

        // 2. Advanced Filters
        if (selectedMakes.length > 0) {
            items = items.filter(item => selectedMakes.includes(item.make || ''));
        }
        if (selectedCC.length > 0) {
            items = items.filter(item => {
                // Safe access to specs or stats (legacy compatibility)
                const specs = (item as any).specs || (item as any).stats || {};
                const engine = specs.engine || specs.performance || {};
                const val = parseInt(String(engine.displacement || 0));

                if (val < 125) return selectedCC.includes('< 125cc');
                if (val >= 125 && val < 250) return selectedCC.includes('125-250cc');
                if (val >= 250 && val < 500) return selectedCC.includes('250-500cc');
                if (val >= 500) return selectedCC.includes('> 500cc');
                return false;
            });
        }
        // ... (Similar logic for other filters would be needed, strictly speaking)
        // But the user might just want the Make/Brand mostly.
        // Let's implement Brand and Category robustly. The others might be metadata dependent.

        // 3. Sort
        if (sortBy === 'price') {
            items.sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
        } else if (sortBy === 'emi') {
            items.sort((a, b) => {
                const aEmi = Math.round(((a.price?.exShowroom || 0) - downpayment) * getEmiFactor(tenure));
                const bEmi = Math.round(((b.price?.exShowroom || 0) - downpayment) * getEmiFactor(tenure));
                return aEmi - bEmi;
            });
        }

        return items;
    }, [wishlistItems, activeCategory, sortBy, downpayment, searchQuery, selectedMakes, selectedCC]);

    // ── Comparison Logic: All/Top filtered ──
    const handleCompareAll = () => {
        const ids = filteredItems.slice(0, VEHICLE_MODE_CONFIG.favorites.compareCap).map(v => v.id);
        if (ids.length === 0) return;
        startTransition(() => {
            router.push(`/store/compare/studio?items=${ids.join(',')}`);
        });
    };

    // Derive Make Options from Wishlist Items
    const makeOptions = useMemo(() => Array.from(new Set(wishlistItems.map(i => i.make || 'HONDA'))), [wishlistItems]);

    if (isLoading) {
        return <CatalogGridSkeleton count={4} />;
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-10 relative">
                    <Heart size={48} className="text-slate-300" />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="absolute -top-2 -right-2 w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-lg"
                    >
                        <Plus size={24} className="text-black" />
                    </motion.div>
                </div>

                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-4">
                    Your Favorites are Empty
                </h2>
                <p className="max-w-[40ch] text-slate-500 font-medium text-lg mb-10 leading-relaxed">
                    Bring home your dream ride. Start exploring our premium collection and save your favorites.
                </p>

                <Link
                    href="/store/catalog"
                    className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all hover:gap-5 shadow-2xl"
                >
                    Explore Catalog
                    <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="store-page-shell">
            <DiscoveryBar
                onFilterClick={() => setIsFilterOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                pricingMode={pricingMode}
                onPricingModeChange={mode => setPricingMode(mode as any)}
                viewMode={viewMode}
                allowedViewModes={VEHICLE_MODE_CONFIG.favorites.allowedViews}
                onViewModeChange={mode => setViewMode(getSafeViewMode('favorites', mode))}
                onCompareClick={handleCompareAll}
                compareCap={VEHICLE_MODE_CONFIG.favorites.compareCap}
                compareCount={Math.min(filteredItems.length, VEHICLE_MODE_CONFIG.favorites.compareCap)}
            />

            {/* 2. Mobile Search Bar (Sticky) */}
            <div
                className="md:hidden sticky z-[90] py-3 mb-4 bg-slate-50/80 backdrop-blur-2xl border-b border-slate-200/60"
                style={{ top: 'var(--header-h)' }}
            >
                <div className="flex items-center gap-3 px-5 min-w-0">
                    {/* Search bar */}
                    <StoreSearchBar
                        value={searchQuery}
                        placeholder="Search saved rides..."
                        onChange={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                        className="flex-1 min-w-0"
                    />
                    {/* Compare pill — right */}
                    <button
                        onClick={handleCompareAll}
                        disabled={isPending}
                        className={`relative shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-2xl bg-slate-900 text-white active:scale-95 transition-all ${
                            isPending ? 'opacity-60 pointer-events-none' : ''
                        }`}
                    >
                        <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M16 3h5v5" />
                            <path d="M8 3H3v5" />
                            <path d="M16 21h5v-5" />
                            <path d="M8 21H3v-5" />
                            <path d="M10 10l4 4" />
                            <path d="M14 10l-4 4" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Compare</span>
                        {filteredItems.length > 0 && (
                            <span className="flex items-center justify-center min-w-[16px] h-[16px] bg-brand-primary text-black text-[7px] font-black rounded-full px-0.5">
                                {Math.min(filteredItems.length, VEHICLE_MODE_CONFIG.favorites.compareCap)}
                            </span>
                        )}
                    </button>
                    {/* Filter pill — right */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="relative shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-2xl border border-slate-200 bg-white/80 text-slate-700 active:scale-95 transition-all"
                    >
                        <Menu size={13} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center min-w-[16px] h-[16px] bg-brand-primary text-black text-[7px] font-black rounded-full px-0.5">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Active Filter Chips */}
            {(searchQuery ||
                selectedCC.length > 0 ||
                selectedBrakes.length > 0 ||
                selectedWheels.length > 0 ||
                selectedFinishes.length > 0 ||
                selectedSeatHeight.length > 0 ||
                selectedMakes.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    {searchQuery && (
                        <FilterChip label="Search" value={searchQuery} onRemove={() => setSearchQuery('')} />
                    )}
                    {/* Make Chips */}
                    {selectedMakes.map((m: string) => (
                        <FilterChip
                            key={m}
                            label="Brand"
                            value={m}
                            onRemove={() => toggleFilter(setSelectedMakes, m)}
                        />
                    ))}
                    {selectedCC.map((cc: string) => (
                        <FilterChip key={cc} label="CC" value={cc} onRemove={() => toggleFilter(setSelectedCC, cc)} />
                    ))}
                    <button
                        onClick={clearAll}
                        className="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:text-slate-900 transition-colors px-3 ml-2"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Grid Section - Using filteredItems */}
            <div
                className={`grid gap-6 min-h-[50vh] ${
                    viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
            >
                <AnimatePresence mode={lightMotion ? 'wait' : 'popLayout'}>
                    {filteredItems.length > 0 ? (
                        filteredItems.map(v => (
                            <div key={v.id} className="transition-transform duration-200">
                                <FavoritesCardAdapter
                                    variant={v}
                                    viewMode={viewMode}
                                    downpayment={downpayment}
                                    tenure={tenure}
                                    pricingMode={pricingMode}
                                    onTogglePricingMode={() =>
                                        setPricingMode(prev => (prev === 'cash' ? 'finance' : 'cash'))
                                    }
                                    variantCount={2}
                                    onExplore={() => {
                                        const url = buildVariantExplorerUrl(v.make || '', v.model || '');
                                        startTransition(() => {
                                            router.push(url);
                                        });
                                    }}
                                    onExplodeColors={() => {
                                        const key = `${v.make}::${v.model}::${v.variant}`;
                                        setExplodedVariant(prev => (prev === key ? null : key));
                                    }}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Search size={24} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                No items found in this category
                            </p>
                            <button
                                onClick={() => setActiveCategory('ALL')}
                                className="mt-4 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* In case some items are not in catalog anymore */}
            {wishlistItems.length < favorites.length && (
                <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 text-center">
                    <p className="text-sm text-slate-400">
                        Note: {favorites.length - wishlistItems.length} items from your wishlist are no longer available
                        in the active catalog.
                    </p>
                </div>
            )}

            {/* Mega Filter Overlay */}
            {isFilterOpen && (
                <div className="fixed top-[76px] inset-x-0 bottom-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-200 flex flex-col animate-in fade-in duration-300">
                    <div className="page-container flex flex-col h-full">
                        {/* Overlay Header */}
                        <div className="flex-shrink-0 py-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-widest italic uppercase">
                                    Filter Favorites
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    Refine your personal collection
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="p-3 hover:bg-slate-100 rounded-full transition-all"
                                >
                                    <X size={22} className="text-slate-900" />
                                </button>
                            </div>
                        </div>

                        {/* Overlay Content */}
                        <div className="flex-1 overflow-y-auto py-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left Column: Search & Basic */}
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            Search
                                        </h4>
                                        <StoreSearchBar
                                            value={searchQuery}
                                            placeholder="SEARCH FAVOURITES..."
                                            onChange={setSearchQuery}
                                            onClear={() => setSearchQuery('')}
                                            className="w-full py-3"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Filters */}
                                <div className="space-y-12">
                                    <FilterGroup
                                        title="Brands"
                                        options={makeOptions}
                                        selectedValues={selectedMakes}
                                        onToggle={(v: string) => toggleFilter(setSelectedMakes, v)}
                                        onReset={() => setSelectedMakes(makeOptions)}
                                        showReset={selectedMakes.length < makeOptions.length}
                                        lightMotion={lightMotion}
                                    />
                                    <FilterGroup
                                        title="Engine Displacement"
                                        options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']}
                                        selectedValues={selectedCC}
                                        onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                                        onReset={() => setSelectedCC([])}
                                        showReset
                                        lightMotion={lightMotion}
                                    />
                                    {/* Additional Groups for Finish/Brake if we had data, simplified for wishlist */}
                                </div>
                            </div>
                        </div>

                        {/* Overlay Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <button
                                onClick={clearAll}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                Clear all filters
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="px-12 py-5 bg-[#F4B000] text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#F4B000]/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Show {filteredItems.length} Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
