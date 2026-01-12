'use client';

import React, { useState } from 'react';
import { Filter, ChevronDown, Zap, Search, Heart, Star, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';
import { brands } from '@/hooks/useCatalogFilters';

interface CatalogTabletProps {
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
        <div className="max-w-4xl mx-auto px-12 py-8 space-y-8 bg-white dark:bg-[#020617] transition-colors duration-500">
            {/* Tablet Header HUD */}
            <div className="flex items-center justify-between gap-6 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="FIND MACHINE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50"
                    />
                </div>
                <button
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className={`h-14 px-8 rounded-2xl border flex items-center gap-3 transition-all ${isFiltersExpanded ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white'}`}
                >
                    <SlidersHorizontal size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </button>
            </div>

            {/* Collapsible Filters for Tablet */}
            {isFiltersExpanded && (
                <div className="p-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] grid grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">EMI Settings</h4>
                        <div className="space-y-4 p-6 bg-green-500/5 border border-green-500/10 rounded-2xl">
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
                                    className={`px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase italic transition-all ${selectedCC.includes(opt) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Grid: 2 columns for Tablet */}
            <div className="grid grid-cols-2 gap-10">
                {filteredVehicles.map((v: any, idx: number) => {
                    const basePrice = (v.make === 'Royal Enfield' ? 2.15 : 0.85) * 100000;
                    const onRoadPrice = Math.round(basePrice * 1.15);
                    const offerPrice = Math.round(onRoadPrice * 0.94);
                    const emiValue = Math.round((offerPrice - downpayment) * 0.035);

                    return (
                        <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                            <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center p-8 relative">
                                <div className="absolute top-4 left-4">
                                    <div className="px-3 py-1 bg-green-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Lowest EMI</div>
                                </div>
                                <span className="font-black text-[12px] uppercase tracking-[0.3em] opacity-30">{v.make} <br /> {v.model}</span>
                            </div>
                            <div className="p-8 space-y-6 flex-1 flex flex-col">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{v.model}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{v.make} • {v.variant}</p>
                                </div>
                                <div className="p-5 bg-green-500/5 border border-green-500/10 rounded-[1.5rem] flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-green-600 italic tracking-widest">EMI Starting at</p>
                                        <p className="text-2xl font-black tracking-tighter">₹{emiValue.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400">/mo</span></p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"><Zap size={18} fill="white" /></div>
                                </div>
                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-xl font-black tracking-tighter">₹{offerPrice.toLocaleString('en-IN')}</p>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">Final On-Road</p>
                                    </div>
                                    <Link href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-red-500/20">Book Now</Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
