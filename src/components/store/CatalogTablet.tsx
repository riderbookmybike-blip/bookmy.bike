'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/store/CatalogDesktop';

interface CatalogTabletProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters: any;
}

export function CatalogTablet({ filters }: CatalogTabletProps) {
    const {
        searchQuery, setSearchQuery,
        selectedMakes, setSelectedMakes,
        selectedCC, setSelectedCC,
        downpayment, setDownpayment,
        tenure, setTenure,
        filteredVehicles,
        toggleFilter
    } = filters;

    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    return (
        <div className="max-w-4xl mx-auto px-12 py-6 space-y-6 bg-slate-50 dark:bg-[#0b0d10] transition-colors duration-500">
            {/* Tablet Header HUD */}
            <div className="flex items-center justify-between gap-6 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="FIND MACHINE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-primary/50"
                    />
                </div>
                <button
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className={`h-12 px-7 rounded-2xl border flex items-center gap-3 transition-all ${isFiltersExpanded ? 'bg-brand-primary border-brand-primary text-black' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white'}`}
                >
                    <SlidersHorizontal size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </button>
            </div>

            {/* Collapsible Filters for Tablet */}
            {isFiltersExpanded && (
                <div className="p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">EMI Settings</h4>
                        <div className="space-y-4 p-5 bg-green-500/5 border border-green-500/10 rounded-2xl">
                            <div className="flex justify-between items-end">
                                <span className="text-[8px] font-black uppercase text-slate-500">Downpayment</span>
                                <span className="text-xs font-black text-green-600">₹{downpayment.toLocaleString('en-IN')}</span>
                            </div>
                            <input
                                type="range"
                                min="5000" max="75000" step="5000"
                                value={downpayment}
                                onChange={(e) => setDownpayment(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-800 appearance-none rounded-full accent-green-600"
                            />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">CC Range</h4>
                        <div className="flex flex-wrap gap-2">
                            {['< 125cc', '125-250cc', '250-500cc', '> 500cc'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => toggleFilter(setSelectedCC, opt)}
                                    className={`px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase italic transition-all ${selectedCC.includes(opt) ? 'bg-brand-primary text-black border-brand-primary' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Grid: 2 columns for Tablet */}
            <div className="grid grid-cols-2 gap-8">
                {filteredVehicles.map((v: any) => (
                    <ProductCard
                        key={v.id}
                        v={v}
                        viewMode="grid"
                        downpayment={downpayment}
                        tenure={tenure}
                        isTv={false}
                    />
                ))}
            </div>
        </div>
    );
}
