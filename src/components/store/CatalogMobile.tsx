'use client';

import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Zap, Search, SlidersHorizontal, Heart, Star, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';
import { brands } from '@/hooks/useCatalogFilters';

interface CatalogMobileProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters: any;
}

export function CatalogMobile({ filters }: CatalogMobileProps) {
    const {
        searchQuery, setSearchQuery,
        selectedMakes, setSelectedMakes,
        selectedCC, setSelectedCC,
        downpayment, setDownpayment,
        tenure, setTenure,
        filteredVehicles,
        toggleFilter
    } = filters;

    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
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
        <div className="flex flex-col space-y-6 bg-white dark:bg-[#020617] px-6 py-4">
            {/* Mobile Header: Sticky Search */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-3xl py-4 space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="SEARCH MACHINES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 h-14 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black tracking-widest outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="h-14 w-14 bg-slate-900 text-white dark:bg-white dark:text-black rounded-2xl flex items-center justify-center shadow-lg"
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                {/* Brand Horizontal Scroll for Mobile */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {brands.map(brand => (
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
                {filteredVehicles.map((v: any, idx: number) => {
                    const basePrice = (v.make === 'Royal Enfield' ? 2.15 : 0.85) * 100000;
                    const onRoadPrice = Math.round(basePrice * 1.15);
                    const offerPrice = Math.round(onRoadPrice * 0.94);
                    const emiValue = Math.round((offerPrice - downpayment) * 0.035);

                    return (
                        <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
                            <div className="aspect-video bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center p-8 relative">
                                <div className="absolute top-4 left-4">
                                    <div className="px-3 py-1 bg-green-500 text-white rounded-full text-[8px] font-black tracking-widest">EMI STARTING ₹{emiValue.toLocaleString('en-IN')}</div>
                                </div>
                                <span className="font-black text-xs uppercase tracking-[0.3em] opacity-30 italic text-center">{v.make} <br /> {v.model}</span>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{v.model}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{v.make} • {v.variant}</p>
                                    </div>
                                    <Heart size={20} className="text-slate-300" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase italic">On-Road</p>
                                        <p className="text-lg font-black tracking-tighter">₹{offerPrice.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10 space-y-1">
                                        <p className="text-[8px] font-black text-green-600 uppercase italic">Lowest EMI</p>
                                        <p className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">₹{emiValue.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <Link href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`} className="w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 shadow-xl">
                                    BOOK FOR ₹999 <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Filter Drawer (Bottom Sheet) */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-[200]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 space-y-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 pb-4 border-b">
                            <h3 className="text-xl font-black uppercase italic tracking-widest">Filter Machines</h3>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="text-[10px] font-black uppercase text-slate-400">Close</button>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">EMI Calculator</h4>
                                <div className="p-6 bg-green-500/5 rounded-3xl space-y-6 border border-green-500/10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black text-slate-500">DOWNPAYMENT</span>
                                        <span className="text-sm font-black text-green-600">₹{downpayment.toLocaleString('en-IN')}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5000" max="75000" step="5000"
                                        value={downpayment}
                                        onChange={(e) => setDownpayment(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 appearance-none rounded-full accent-green-600"
                                    />
                                    <div className="grid grid-cols-4 gap-2">
                                        {[12, 24, 36, 48].map(t => (
                                            <button key={t} onClick={() => setTenure(t)} className={`py-3 rounded-xl text-[10px] font-black ${tenure === t ? 'bg-green-600 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-400'}`}>{t}M</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <FilterGroup title="CC Range" options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']} selectedValues={selectedCC} onToggle={(v: string) => toggleFilter(setSelectedCC, v)} />
                        </div>

                        <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full py-5 bg-black text-white dark:bg-brand-primary dark:text-black rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Apply Filters</button>
                    </div>
                </div>
            )}
        </div>
    );
}
