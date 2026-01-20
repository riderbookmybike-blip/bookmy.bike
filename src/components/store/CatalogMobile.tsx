'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { BRANDS as defaultBrands } from '@/config/market';
import { ProductCard } from '@/components/store/CatalogDesktop';

interface CatalogMobileProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters: any;
}

export function CatalogMobile({ filters }: CatalogMobileProps) {
    const {
        searchQuery,
        setSearchQuery,
        selectedMakes,
        setSelectedMakes,
        selectedCC,
        setSelectedCC,
        downpayment,
        setDownpayment,
        tenure,
        setTenure,
        filteredVehicles,
        toggleFilter,
    } = filters;

    const makeOptions = (filters.availableMakes && filters.availableMakes.length > 0)
        ? filters.availableMakes
        : defaultBrands;

    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FilterGroup = ({ title, options, selectedValues, onToggle }: any) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        return (
            <div className="space-y-4">
                <div
                    className="flex items-center justify-between py-2 cursor-pointer border-b border-slate-100 dark:border-white/5"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                        {title}
                    </h4>
                    <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => onToggle(opt)}
                                className={`px-4 py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${selectedValues.includes(opt) ? 'bg-brand-primary border-brand-primary text-black' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-5 bg-slate-50 dark:bg-[#0b0d10] px-6 py-4">
            {/* Mobile Header: Sticky Search */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b0d10]/80 backdrop-blur-3xl py-3 space-y-3">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="SEARCH MACHINES..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 h-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black tracking-widest outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="h-12 w-12 bg-slate-900 text-white dark:bg-white dark:text-black rounded-2xl flex items-center justify-center shadow-lg"
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                {/* Brand Horizontal Scroll for Mobile */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {makeOptions.map(brand => (
                        <button
                            key={brand}
                            onClick={() => toggleFilter(setSelectedMakes, brand.toUpperCase())}
                            className={`flex-shrink-0 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${selectedMakes.includes(brand.toUpperCase()) ? 'bg-brand-primary border-brand-primary text-black shadow-md' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Feed: 1 column for impact */}
            <div className="space-y-8">
                {filteredVehicles.map(
                    (
                        v: any // eslint-disable-line @typescript-eslint/no-explicit-any
                    ) => (
                        <ProductCard
                            key={v.id}
                            v={v}
                            viewMode="grid"
                            downpayment={downpayment}
                            tenure={tenure}
                            isTv={true}
                        />
                    )
                )}
            </div>

            {/* Mobile Filter Drawer (Bottom Sheet) */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-[200]">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileFiltersOpen(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 space-y-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 pb-4 border-b">
                            <h3 className="text-xl font-black uppercase italic tracking-widest">Filter Machines</h3>
                            <button
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="text-[10px] font-black uppercase text-slate-400"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    EMI Calculator
                                </h4>
                                <div className="p-6 bg-green-500/5 rounded-3xl space-y-6 border border-green-500/10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black text-slate-500">DOWNPAYMENT</span>
                                        <span className="text-sm font-black text-green-600">
                                            ₹{downpayment.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5000"
                                        max="75000"
                                        step="5000"
                                        value={downpayment}
                                        onChange={e => setDownpayment(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 appearance-none rounded-full accent-green-600"
                                    />
                                    <div className="grid grid-cols-4 gap-2">
                                        {[12, 24, 36, 48].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTenure(t)}
                                                className={`py-3 rounded-xl text-[10px] font-black ${tenure === t ? 'bg-green-600 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-400'}`}
                                            >
                                                {t}M
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <FilterGroup
                                title="CC Range"
                                options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']}
                                selectedValues={selectedCC}
                                onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                            />
                        </div>

                        <button
                            onClick={() => setIsMobileFiltersOpen(false)}
                            className="w-full py-5 bg-black text-white dark:bg-brand-primary dark:text-black rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
