'use client';

import React from 'react';
import { CheckCircle2, Plus, Edit2, Box, Layers, Grid3X3 } from 'lucide-react';

interface BrandStepProps {
    brands: any[];
    stats?: Record<string, { families: number, variants: number, skus: number }>;
    selectedBrand: string | null;
    onSelectBrand: (brandId: string) => void;
    onCreateBrand: () => void;
    onEditBrand?: (brand: any) => void;
    template?: any;
}

export default function BrandStep({
    brands,
    stats,
    selectedBrand,
    onSelectBrand,
    onCreateBrand,
    onEditBrand
}: BrandStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">Select Brand</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {brands.map((brand: any) => {
                        const brandStats = stats?.[brand.id] || { families: 0, variants: 0, skus: 0 };
                        return (
                            <div
                                key={brand.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onSelectBrand(brand.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        onSelectBrand(brand.id);
                                    }
                                }}
                                className={`group relative p-6 rounded-[2rem] border-2 transition-all duration-500 text-left overflow-hidden cursor-pointer ${selectedBrand === brand.id
                                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 dark:border-indigo-500/50'
                                    : 'border-slate-100 bg-white dark:bg-white/5 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center p-3.5 group-hover:scale-110 transition-transform border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-900 shadow-sm overflow-hidden">
                                        {brand.logo_svg ? (() => {
                                            let svgCode = brand.logo_svg;
                                            // Heal missing viewBox if width/height exist
                                            if (!svgCode.includes('viewBox') && svgCode.includes('width=') && svgCode.includes('height=')) {
                                                const wMatch = svgCode.match(/width="([^"]+)"/);
                                                const hMatch = svgCode.match(/height="([^"]+)"/);
                                                if (wMatch && hMatch) {
                                                    const w = wMatch[1].replace('px', '');
                                                    const h = hMatch[1].replace('px', '');
                                                    svgCode = svgCode.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
                                                }
                                            }
                                            return <div dangerouslySetInnerHTML={{ __html: svgCode }} className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block" />;
                                        })() : (
                                            <span className="font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase text-2xl italic">{brand.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="text-center w-full">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase italic leading-none text-lg">{brand.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 leading-none">Brand Partner</p>
                                    </div>

                                    {/* Brand Stats */}
                                    <div className="flex items-center justify-center gap-8 mt-4 pt-5 border-t border-slate-100 dark:border-white/5 w-full">
                                        <div className="flex items-center gap-2 text-purple-500" title="Models">
                                            <Box size={18} strokeWidth={2.5} /> <span className="text-xs font-black">{brandStats.families}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-indigo-500" title="Variants">
                                            <Layers size={18} strokeWidth={2.5} /> <span className="text-xs font-black">{brandStats.variants}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500" title="SKUs">
                                            <Grid3X3 size={18} strokeWidth={2.5} /> <span className="text-xs font-black">{brandStats.skus}</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedBrand === brand.id && (
                                    <div className="absolute top-4 right-4 text-emerald-500 scale-125 animate-in zoom-in duration-300">
                                        <CheckCircle2 size={24} fill="currentColor" strokeWidth={1} className="text-white" />
                                    </div>
                                )}

                                {/* Edit Button */}
                                <button
                                    onClick={(e) => {
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
        </div >
    );
}
