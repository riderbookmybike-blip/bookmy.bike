'use client';

import React from 'react';
import { CheckCircle2, Plus, Edit2, Box, Layers, Grid3X3, Bike, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';
import CopyableId from '@/components/ui/CopyableId';

const CATEGORIES = [
    {
        id: 'VEHICLE',
        title: 'Vehicles',
        description: 'Bikes, Scooters, and two-wheeled vehicles',
        icon: Bike,
        activeColor: 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20',
        iconActiveBg: 'bg-blue-500 text-white',
    },
    {
        id: 'ACCESSORY',
        title: 'Accessories',
        description: 'Helmets, safety gear, and performance parts',
        icon: ShieldCheck,
        activeColor: 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/20',
        iconActiveBg: 'bg-amber-500 text-white',
    },
    {
        id: 'SERVICE',
        title: 'Services',
        description: 'Extended warranty, roadside assistance, AMC',
        icon: Wrench,
        activeColor: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20',
        iconActiveBg: 'bg-emerald-500 text-white',
    },
];

interface BrandStepProps {
    brands: any[];
    stats?: Record<string, { families: number; variants: number; skus: number }>;
    selectedBrand: string | null;
    selectedCategory: string | null;
    onSelectBrand: (brandId: string) => void;
    onSelectCategory: (categoryId: string) => void;
    onCreateBrand: () => void;
    onEditBrand?: (brand: any) => void;
}

export default function BrandStepV2({
    brands,
    stats,
    selectedBrand,
    selectedCategory,
    onSelectBrand,
    onSelectCategory,
    onCreateBrand,
    onEditBrand,
}: BrandStepProps) {
    const brand = brands.find(b => b.id === selectedBrand);
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Section 1: Category Selection */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">
                    1. Select Product Type
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left flex items-center gap-4 ${
                                    isSelected
                                        ? cat.activeColor
                                        : 'border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                                        isSelected
                                            ? cat.iconActiveBg
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-600'
                                    }`}
                                >
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className={`text-sm font-black uppercase italic tracking-tight leading-none transition-colors ${
                                            isSelected
                                                ? 'text-slate-900 dark:text-white'
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {cat.title}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-tight truncate">
                                        {cat.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <CheckCircle2
                                        size={20}
                                        className="text-emerald-500 shrink-0"
                                        fill="currentColor"
                                        strokeWidth={1}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-slate-100 dark:border-white/5" />
                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">then</span>
                <div className="flex-1 border-t border-slate-100 dark:border-white/5" />
            </div>

            {/* Section 2: Brand Selection */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">
                    2. Select Brand
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {brands.map((brand: any) => {
                        const brandStats = stats?.[brand.id] || { families: 0, variants: 0, skus: 0 };
                        return (
                            <div
                                key={brand.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onSelectBrand(brand.id)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        onSelectBrand(brand.id);
                                    }
                                }}
                                className={`group relative p-3 rounded-[1.25rem] border-2 transition-all duration-500 text-left overflow-hidden cursor-pointer ${
                                    selectedBrand === brand.id
                                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 dark:border-indigo-500/50'
                                        : 'border-slate-100 bg-white dark:bg-white/5 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center p-2 group-hover:scale-110 transition-transform border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-900 shadow-sm overflow-hidden">
                                        {brand.logo_svg ? (
                                            (() => {
                                                let svgCode = brand.logo_svg;
                                                // Heal missing viewBox if width/height exist
                                                if (
                                                    !svgCode.includes('viewBox') &&
                                                    svgCode.includes('width=') &&
                                                    svgCode.includes('height=')
                                                ) {
                                                    const wMatch = svgCode.match(/width="([^"]+)"/);
                                                    const hMatch = svgCode.match(/height="([^"]+)"/);
                                                    if (wMatch && hMatch) {
                                                        const w = wMatch[1].replace('px', '');
                                                        const h = hMatch[1].replace('px', '');
                                                        svgCode = svgCode.replace(
                                                            '<svg',
                                                            `<svg viewBox="0 0 ${w} ${h}"`
                                                        );
                                                    }
                                                }
                                                return (
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgCode) }}
                                                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                    />
                                                );
                                            })()
                                        ) : (
                                            <span className="font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase text-2xl italic">
                                                {brand.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-center w-full">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase italic leading-none text-xs">
                                            {brand.name}
                                        </h4>
                                    </div>

                                    {/* Brand Stats */}
                                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-white/5 w-full">
                                        <div className="flex items-center gap-1 text-purple-500" title="Models">
                                            <Box size={12} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black">{brandStats.families}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-500" title="Variants">
                                            <Layers size={12} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black">{brandStats.variants}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-500" title="SKUs">
                                            <Grid3X3 size={12} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black">{brandStats.skus}</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedBrand === brand.id && (
                                    <div className="absolute top-2 right-2 text-emerald-500 animate-in zoom-in duration-300">
                                        <CheckCircle2
                                            size={18}
                                            fill="currentColor"
                                            strokeWidth={1}
                                            className="text-white"
                                        />
                                    </div>
                                )}

                                {/* Edit Button */}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        onEditBrand?.(brand);
                                    }}
                                    className="absolute bottom-4 right-4 p-2.5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-indigo-100 hover:shadow-lg"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Create Brand Card */}
                    <button
                        onClick={onCreateBrand}
                        className="group relative p-6 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-4 hover:border-indigo-500 hover:bg-indigo-50/10 dark:hover:bg-indigo-500/10 transition-all text-slate-400 hover:text-indigo-600 shadow-sm"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <Plus size={32} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">Create Brand</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
