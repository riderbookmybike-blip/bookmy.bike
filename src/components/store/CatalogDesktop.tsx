'use client';

import React, { useState } from 'react';
import { Filter, ChevronDown, Zap, Search, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';
import { brands } from '@/hooks/useCatalogFilters';

interface CatalogDesktopProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters: any;
}

export function CatalogDesktop({ filters }: CatalogDesktopProps) {
    const {
        searchQuery,
        setSearchQuery,
        selectedMakes,
        setSelectedMakes,
        selectedCC,
        setSelectedCC,
        selectedBrakes,
        setSelectedBrakes,
        selectedWheels,
        setSelectedWheels,
        selectedConsole,
        setSelectedConsole,
        selectedSeatHeight,
        setSelectedSeatHeight,
        downpayment,
        setDownpayment,
        tenure,
        setTenure,
        filteredVehicles,
        toggleFilter,
    } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FilterGroup = ({ title, options, selectedValues, onToggle, showReset = false, onReset }: any) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);
        const visibleOptions = isExpanded ? options : options.slice(0, 3);

        return (
            <div className="space-y-6">
                <div
                    className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white flex items-center gap-2">
                        <div
                            className={`w-1 shadow-[0_0_8px_#FFD700] h-1 rounded-full transition-colors ${selectedValues.length > 0 ? 'bg-brand-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                        />
                        {title}
                    </h4>
                    <div className="flex items-center gap-3">
                        {showReset && selectedValues.length > 0 && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    onReset();
                                }}
                                className="text-[9px] font-black uppercase text-brand-primary dark:text-brand-primary hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Reset
                            </button>
                        )}
                        <ChevronDown
                            size={14}
                            className="text-slate-400 dark:text-slate-500 transition-transform duration-300 group-hover:text-brand-primary"
                        />
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 gap-2">
                            {visibleOptions.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${selectedValues.includes(opt) ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                                >
                                    <span
                                        className={`text-[9px] font-black uppercase tracking-widest italic transition-colors ${selectedValues.includes(opt) ? 'text-brand-primary dark:text-brand-primary' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'}`}
                                    >
                                        {opt}
                                    </span>
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${selectedValues.includes(opt) ? 'bg-brand-primary shadow-[0_0_8px_#FFD700]' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        {options.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary transition-colors w-full text-center py-1 border border-dashed border-slate-200 dark:border-white/5 rounded-md"
                            >
                                {isExpanded ? 'Show Less' : `+ Show ${options.length - 3} More`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 py-8 space-y-12 bg-white dark:bg-[#020617] transition-colors duration-500">
            {/* 1. Brand elimination Ribbon */}
            <div className="relative py-8 border-b border-slate-200 dark:border-white/5 overflow-hidden group">
                <div className="flex whitespace-nowrap animate-marquee gap-24">
                    {[...brands, ...brands].map((brand, i) => (
                        <button
                            key={i}
                            onClick={() => toggleFilter(setSelectedMakes, brand.toUpperCase())}
                            className={`text-4xl font-black italic tracking-tighter uppercase transition-all duration-500 ${selectedMakes.includes(brand.toUpperCase()) ? 'text-brand-primary dark:text-brand-primary scale-110' : 'text-slate-300 dark:text-slate-800 scale-90 opacity-40 hover:opacity-100'}`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-16">
                {/* 2. Advanced Sidebar HUD */}
                <aside className="space-y-10">
                    <div className="space-y-10 p-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative">
                        {/* EMI Calculator */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-brand-primary shadow-[0_0_8px_#F4B000]" />
                                EMI Calculator
                            </h4>
                            <div className="space-y-8 p-6 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                            Downpayment
                                        </span>
                                        <span className="text-sm font-black text-brand-primary italic">
                                            ₹{downpayment.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        width="100%"
                                        min="5000"
                                        max="75000"
                                        step="5000"
                                        value={downpayment}
                                        onChange={e => setDownpayment(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 appearance-none rounded-full accent-brand-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[12, 24, 36, 48].map((t: number) => (
                                        <button
                                            key={t}
                                            onClick={() => setTenure(t)}
                                            className={`py-2 rounded-lg text-[10px] font-black transition-all ${tenure === t ? 'bg-brand-primary text-black shadow-lg' : 'bg-slate-200 dark:bg-white/5 text-slate-500'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Search HUD */}
                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="FIND MACHINE..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-brand-primary/50 transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <FilterGroup
                            title="CC Range"
                            options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']}
                            selectedValues={selectedCC}
                            onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                            onReset={() => setSelectedCC([])}
                            showReset
                        />
                        <FilterGroup
                            title="Brake System"
                            options={['Drum', 'Disc (Front)', 'Disc (Rear)', 'Single ABS', 'Dual ABS', 'CBS']}
                            selectedValues={selectedBrakes}
                            onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)}
                            onReset={() => setSelectedBrakes([])}
                            showReset
                        />
                        <FilterGroup
                            title="Wheel Type"
                            options={['Alloy', 'Spoke', 'Cast Aluminum', 'Carbon Fiber']}
                            selectedValues={selectedWheels}
                            onToggle={(v: string) => toggleFilter(setSelectedWheels, v)}
                            onReset={() => setSelectedWheels([])}
                            showReset
                        />
                    </div>
                </aside>

                {/* 3. The Gallery Grid */}
                <div className="col-span-3">
                    <div className="grid grid-cols-3 gap-8">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {filteredVehicles.map((v: any, idx: number) => {
                            const basePrice = (v.make === 'Royal Enfield' ? 2.15 : 0.85) * 100000;
                            const onRoadPrice = Math.round(basePrice * 1.15);
                            const offerPrice = Math.round(onRoadPrice * 0.94);
                            const emiValue = Math.round((offerPrice - downpayment) * 0.035); // Simple mock emi

                            return (
                                <div
                                    key={v.id}
                                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm hover:shadow-2xl transition-all duration-500"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center relative p-6">
                                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-full shadow-lg">
                                                <Zap size={10} className="fill-brand-primary text-brand-primary" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    Best Seller
                                                </span>
                                            </div>
                                        </div>
                                        <button className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                            <Heart className="w-4 h-4" />
                                        </button>

                                        {/* Dynamic Image with Fallback */}
                                        <img
                                            src={`/images/categories/motorcycle_nobg.png`} // Placeholder for now as per user instruction "where is images"
                                            alt={v.model}
                                            className="absolute w-[80%] h-[80%] object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                                        />

                                        <div className="relative text-center opacity-10 group-hover:opacity-0 transition-opacity duration-700">
                                            <span className="font-black text-[6rem] uppercase tracking-tighter leading-none text-slate-900/5 dark:text-white/5 select-none">
                                                {v.make[0]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5 flex-1 flex flex-col">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary italic">
                                                {v.make}
                                            </p>
                                            <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none mt-1">
                                                {v.model}
                                                <span className="block text-[10px] font-bold text-slate-400 mt-1">
                                                    {v.variant}
                                                </span>
                                            </h3>
                                        </div>

                                        <div className="flex items-end justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    On-Road Price
                                                </p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                                        ₹{offerPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400 line-through decoration-red-500/50">
                                                        ₹{onRoadPrice.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    EMI / {tenure}mo
                                                </p>
                                                <p className="text-lg font-black text-brand-primary">
                                                    ₹{emiValue.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`}
                                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-brand-primary hover:text-black transition-colors"
                                        >
                                            GET QUOTE
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
