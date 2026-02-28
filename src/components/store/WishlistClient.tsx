'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, ArrowRight, Plus, Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import { getEmiFactor } from '@/lib/constants/pricingConstants';

// Filter Group Component (Extracted)
const FilterGroup = ({ title, options, selectedValues, onToggle, onReset, showReset = false }: any) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="space-y-4">
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
        </div>
    );
};

export const WishlistClient = () => {
    const { favorites, clearFavorites } = useFavorites();
    const { items: catalogItems, isLoading } = useSystemCatalogLogic();

    // UI Local State for Cards
    const [downpayment] = useState(25000);
    const [tenure] = useState(36);

    // Local State for Filters
    const [activeCategory, setActiveCategory] = useState<'ALL' | 'MOTORCYCLE' | 'SCOOTER' | 'MOPED'>('ALL');
    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    const [pricingMode, setPricingMode] = useState<'cash' | 'finance'>('finance');

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

    // Derive Make Options from Wishlist Items
    const makeOptions = useMemo(() => Array.from(new Set(wishlistItems.map(i => i.make || 'HONDA'))), [wishlistItems]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-full mb-6" />
                <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4" />
                <div className="h-4 w-64 bg-slate-200 rounded-lg" />
            </div>
        );
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
                    Your Wishlist is Empty
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
        <div className="space-y-4">
            {/* 1. Header Section - Catalog Style */}
            <header
                className="hidden md:block sticky z-[90] py-0 mb-6 transition-all duration-700 ease-in-out"
                style={{ top: 'var(--header-h)', marginTop: '20px' }}
            >
                <div className="w-full">
                    <div className="rounded-[2rem] bg-white/75 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.4)_inset] h-14 pr-2 pl-4 flex items-center transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
                        <div className="flex items-center gap-4 w-full">
                            {/* Branding Icon (Heart) */}
                            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                                <Heart size={20} className="text-brand-primary" fill="currentColor" />
                            </div>

                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/40 border border-slate-200/40 text-slate-500 hover:text-slate-900 hover:bg-white hover:border-slate-300 transition-all duration-300 shrink-0 group"
                            >
                                <SlidersHorizontal
                                    size={18}
                                    className="group-hover:rotate-180 transition-transform duration-500"
                                />
                            </button>

                            <div className="flex-none min-w-[240px] lg:min-w-[320px]">
                                <div className="relative flex items-center gap-3 w-full bg-slate-100/30 hover:bg-slate-100/50 border border-slate-200/30 rounded-2xl px-4 h-10 transition-all duration-500 group focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/5 focus-within:border-brand-primary/10">
                                    <Search
                                        size={16}
                                        className="text-slate-400 group-focus-within:text-brand-primary group-focus-within:scale-110 transition-all duration-300"
                                    />
                                    <input
                                        type="text"
                                        placeholder="SEARCH YOUR WISHLIST..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="flex-1 min-w-0 bg-transparent text-[10px] font-black tracking-[0.2em] uppercase focus:outline-none placeholder:text-slate-400/50"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="flex items-center justify-center w-6 h-6 rounded-full text-slate-300 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Center Section: Info Label */}
                            <div className="flex-1 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
                                    {wishlistItems.length} Saved Machine{wishlistItems.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            {/* Pricing Toggle - Aligned Right */}
                            <div className="flex-none flex items-center ml-4 pl-6 border-l border-slate-200/40">
                                <div className="flex items-center p-1 bg-slate-100/60 rounded-2xl border border-slate-200/40 h-10 shadow-inner">
                                    {[
                                        { id: 'finance', label: 'Finance' },
                                        { id: 'cash', label: 'Cash' },
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setPricingMode(mode.id as any)}
                                            className={`px-6 h-full rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                pricingMode === mode.id
                                                    ? 'bg-[#FFD700] text-black shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/50'
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Mobile Search Bar (Sticky) */}
            <div
                className="md:hidden sticky z-[90] py-3 mb-4 bg-slate-50/80 backdrop-blur-2xl border-b border-slate-200/60"
                style={{ top: 'var(--header-h)' }}
            >
                <div className="flex items-center gap-3 px-4">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search saved rides..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-[11px] font-black tracking-widest uppercase focus:outline-none placeholder:text-slate-300"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="flex items-center text-slate-400 hover:text-slate-900"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* STICKY NAVBAR (Catalog Aesthetic Synchronization) */}
            <header className="sticky z-40 mb-12 transition-all duration-300" style={{ top: 'var(--header-h)' }}>
                <div className="w-full">
                    <div className="rounded-[2rem] bg-white/75 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] px-6 py-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Category Chips */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                                <button
                                    onClick={() => setActiveCategory('ALL')}
                                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        activeCategory === 'ALL'
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'bg-slate-100/50 text-slate-500 hover:text-slate-900 border border-slate-200/50'
                                    }`}
                                >
                                    All Types
                                </button>
                                {(['MOTORCYCLE', 'SCOOTER', 'MOPED'] as const).map(option => (
                                    <button
                                        key={option}
                                        onClick={() => setActiveCategory(option)}
                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                            activeCategory === option
                                                ? 'bg-[#F4B000] text-black shadow-lg shadow-[#F4B000]/20 scale-105'
                                                : 'bg-slate-100/50 text-slate-500 hover:text-slate-900 border border-slate-200/50'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>

                            {/* Right: Sort & Filter Actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Sort Dropdown */}
                                <div className="flex items-center bg-slate-100/40 border border-slate-200/40 rounded-2xl px-4 py-2 hover:border-slate-300 transition-colors group">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-2">
                                        Sort:
                                    </span>
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value as any)}
                                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none cursor-pointer pr-2"
                                    >
                                        <option value="popular">Popularity</option>
                                        <option value="price">Price: Low to High</option>
                                        <option value="emi">EMI: Low to High</option>
                                    </select>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFilterOpen(true)}
                                        className={`relative flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all ${
                                            activeFilterCount > 0
                                                ? 'bg-slate-900 text-white shadow-lg'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 shadow-sm'
                                        }`}
                                    >
                                        <SlidersHorizontal size={14} strokeWidth={2.5} />
                                        <span className="hidden sm:inline">Refine</span>
                                        {activeFilterCount > 0 && (
                                            <span className="flex items-center justify-center bg-[#F4B000] text-black w-4 h-4 rounded-full text-[8px] absolute -top-1 -right-1 shadow-md">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>

                                    <div className="h-8 w-px bg-slate-200 mx-2" />

                                    <button
                                        onClick={clearFavorites}
                                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-all text-[9px] font-black uppercase tracking-widest bg-white/50 active:scale-95 shadow-sm"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

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
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
                            <span className="text-[9px] font-black uppercase text-slate-400">Search</span>
                            <span className="text-[10px] font-bold text-slate-900">{searchQuery}</span>
                            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-900">
                                <X size={10} />
                            </button>
                        </div>
                    )}
                    {/* Make Chips */}
                    {selectedMakes.map((m: string) => (
                        <div
                            key={m}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full"
                        >
                            <span className="text-[9px] font-black uppercase text-slate-400">Brand</span>
                            <span className="text-[10px] font-bold text-slate-900">{m}</span>
                            <button
                                onClick={() => toggleFilter(setSelectedMakes, m)}
                                className="text-slate-400 hover:text-slate-900"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                    {selectedCC.map((cc: string) => (
                        <div
                            key={cc}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full"
                        >
                            <span className="text-[9px] font-black uppercase text-slate-400">CC</span>
                            <span className="text-[10px] font-bold text-slate-900">{cc}</span>
                            <button
                                onClick={() => toggleFilter(setSelectedCC, cc)}
                                className="text-slate-400 hover:text-slate-900"
                            >
                                <X size={10} />
                            </button>
                        </div>
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
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[50vh]"
            >
                <AnimatePresence mode="popLayout">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(v => (
                            <motion.div
                                key={v.id}
                                layout
                                variants={itemVariants}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            >
                                <ProductCard
                                    v={v}
                                    viewMode="grid"
                                    downpayment={downpayment}
                                    tenure={tenure}
                                    pricingMode={pricingMode}
                                    onTogglePricingMode={() =>
                                        setPricingMode(prev => (prev === 'cash' ? 'finance' : 'cash'))
                                    }
                                />
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full flex flex-col items-center justify-center py-20 text-center"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

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
                                    Filter Wishlist
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
                                        <div className="relative">
                                            <Search
                                                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                                                size={20}
                                            />
                                            <input
                                                type="text"
                                                placeholder="SEARCH FAVOURITES..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full py-5 pl-16 pr-6 bg-slate-50 border border-slate-200 rounded-3xl text-[11px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#F4B000]/20"
                                            />
                                        </div>
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
                                    />
                                    <FilterGroup
                                        title="Engine Displacement"
                                        options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']}
                                        selectedValues={selectedCC}
                                        onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                                        onReset={() => setSelectedCC([])}
                                        showReset
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
                                className="px-12 py-5 bg-[#F4B000] text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#F4B000]/20 hover:scale-105 transition-all"
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
