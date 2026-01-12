'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, X, Plus, Zap, Star, ArrowRight } from 'lucide-react';
import { useCompare } from '@/hooks/useCompare';
import { useCatalog } from '@/hooks/useCatalog';
import { slugify } from '@/utils/slugs';
import { PageFrame } from '@/components/layout/PageFrame';

export default function ComparePage() {
    const { compareList, removeFromCompare, clearCompare, addToCompare } = useCompare();
    const { items: allVehicles } = useCatalog();
    const [isAddingMode, setIsAddingMode] = React.useState(false);

    // Grouping specs for presentation
    const specGroups = [
        {
            label: 'Core Specs',
            rows: [
                { label: 'Category', getValue: (v: any) => v.bodyType },
                { label: 'Fuel Type', getValue: (v: any) => v.fuelType },
                { label: 'Segment', getValue: (v: any) => v.segment },
                { label: 'Displacement', getValue: (v: any) => v.displacement ? `${v.displacement} ${v.powerUnit || 'CC'}` : '-' }
            ]
        },
        {
            label: 'Performance',
            rows: [
                { label: 'Max Power', getValue: (v: any) => getNestedSpec(v.specifications, 'maxPower') },
                { label: 'Max Torque', getValue: (v: any) => getNestedSpec(v.specifications, 'maxTorque') },
                { label: 'Cooling', getValue: (v: any) => getNestedSpec(v.specifications, 'cooling') }
            ]
        },
        {
            label: 'Dimensions',
            rows: [
                { label: 'Kerb Weight', getValue: (v: any) => getNestedSpec(v.specifications, 'kerbWeight') },
                { label: 'Seat Height', getValue: (v: any) => getNestedSpec(v.specifications, 'seatHeight') },
                { label: 'Fuel Capacity', getValue: (v: any) => getNestedSpec(v.specifications, 'fuelCapacity') },
                { label: 'Ground Clearance', getValue: (v: any) => getNestedSpec(v.specifications, 'groundClearance') }
            ]
        }
    ];

    const getNestedSpec = (specifications: any, key: string) => {
        if (!specifications) return '-';
        // Search through the nested objects (engine, transmission, etc.)
        for (const category in specifications) {
            if (specifications[category] && specifications[category][key]) {
                return specifications[category][key];
            }
        }
        return specifications[key] || '-';
    };

    if (compareList.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 bg-white dark:bg-slate-950">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <Zap size={40} className="text-slate-300 dark:text-slate-700" />
                </div>
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Nothing to Compare</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Add up to 4 machines to see the technical duel.</p>
                </div>
                <Link href="/store/catalog" className="px-10 py-4 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest italic hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                    Explore Collection
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 transition-colors duration-500">
            <PageFrame variant="wide" className="min-h-screen space-y-12">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 dark:border-white/10 pb-8">
                    <div className="space-y-4">
                        <Link href="/store/catalog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                            <ChevronLeft size={14} /> Back to Catalog
                        </Link>
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">
                            The Technical <br /> <span className="text-blue-600 italic">Duel.</span>
                        </h1>
                    </div>
                    <button
                        onClick={clearCompare}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 pb-2"
                    >
                        Reset Comparison <X size={14} />
                    </button>
                </div>

                {/* Comparison Grid */}
                <div className="relative">
                    {/* Horizontal scroll support for many items */}
                    <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 md:-mx-0 md:px-0">
                        <div className="min-w-[1000px] space-y-24">
                            {/* 1. Vehicle Headers */}
                            <div className="grid grid-cols-4 gap-8">
                                {compareList.map((v) => (
                                    <div key={v.id} className="relative group">
                                        <button
                                            onClick={() => removeFromCompare(v.id)}
                                            className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="aspect-[4/3] bg-slate-50 dark:bg-white/5 rounded-[3rem] p-8 flex items-center justify-center relative overflow-hidden mb-8 border border-slate-200 dark:border-white/5">
                                            <img
                                                src={`/images/categories/${v.bodyType?.toLowerCase() || 'motorcycle'}_nobg.png`}
                                                alt={v.model}
                                                className="w-[85%] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-100 dark:from-black/20 to-transparent" />
                                        </div>
                                        <div className="space-y-2 px-4 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 italic">{v.make}</p>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">{v.model}</h3>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{v.variant}</p>

                                            <div className="pt-6 flex flex-col items-center gap-4">
                                                <Link
                                                    href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`}
                                                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl"
                                                >
                                                    View Details
                                                </Link>
                                                <button className="text-[10px] font-black uppercase tracking-widest text-red-600/60 hover:text-red-600 transition-colors italic">Book Now</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {compareList.length < 4 && (
                                    <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group cursor-pointer" onClick={() => setIsAddingMode(true)}>
                                        <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform shadow-xl">
                                            <Plus size={24} />
                                        </div>
                                        <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">Add Machine</p>
                                    </div>
                                )}
                            </div>

                            {/* 2. Specification Duel Rows */}
                            <div className="space-y-20">
                                {specGroups.map((group) => (
                                    <div key={group.label} className="space-y-10">
                                        <div className="flex items-center gap-6">
                                            <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white italic shrink-0">{group.label}</h4>
                                            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-white/10" />
                                        </div>

                                        <div className="space-y-2">
                                            {group.rows.map((row) => {
                                                const values = compareList.map(v => row.getValue(v));
                                                const allSame = values.every(val => val === values[0]);

                                                return (
                                                    <div key={row.label} className={`grid grid-cols-4 gap-8 py-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 group/row ${!allSame && compareList.length > 1 ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]' : ''}`}>
                                                        {compareList.map((v, idx) => {
                                                            const val = values[idx];
                                                            return (
                                                                <div key={v.id} className="px-4 text-center">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover/row:text-slate-500 transition-colors opacity-0 group-hover/row:opacity-100 uppercase">{row.label}</p>
                                                                    <p className={`text-lg font-black italic tracking-tight leading-none ${!allSame && compareList.length > 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                                                        {val}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selection Overlay (if Adding Mode) */}
                {isAddingMode && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
                        <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-center relative">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Choose Your Ally.</h2>
                                <button onClick={() => setIsAddingMode(false)} className="absolute right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-900 dark:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {allVehicles.filter(v => !compareList.find(c => c.id === v.id)).map((v) => (
                                        <div
                                            key={v.id}
                                            onClick={() => {
                                                addToCompare(v);
                                                setIsAddingMode(false);
                                            }}
                                            className="p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-blue-500/50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center">
                                                    <Zap size={20} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 italic">{v.make}</p>
                                                    <h4 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">{v.model}</h4>
                                                </div>
                                                <ArrowRight size={20} className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PageFrame>
        </div>
    );
}
