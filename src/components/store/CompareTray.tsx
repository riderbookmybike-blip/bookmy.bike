'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompareArrows, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export interface CompareItem {
    make: string;
    model: string;
    modelSlug: string;
    imageUrl: string;
    variant?: string;
}

interface CompareTrayProps {
    items: CompareItem[];
    onRemove: (modelSlug: string) => void;
    onCompareNow: () => void;
    onClear: () => void;
}

export const CompareTray: React.FC<CompareTrayProps> = ({ items, onRemove, onCompareNow, onClear }) => {
    if (items.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-0 inset-x-0 z-[100] pb-[env(safe-area-inset-bottom)]"
            >
                <div className="mx-auto max-w-3xl px-4 pb-4">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 shadow-[0_-8px_40px_rgba(0,0,0,0.15)],0,0,0.5)] p-3">
                        <div className="flex items-center gap-3">
                            {/* Icon + Label */}
                            <div className="flex items-center gap-2 pl-2 shrink-0">
                                <div className="w-8 h-8 rounded-full bg-[#F4B000]/15 flex items-center justify-center">
                                    <GitCompareArrows size={16} className="text-[#F4B000]" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Compare
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-600">
                                        {items.length} selected
                                    </p>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="w-px h-10 bg-slate-200 shrink-0" />

                            {/* Thumbnails */}
                            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                {items.map(item => (
                                    <motion.div
                                        key={item.modelSlug}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="relative group flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0"
                                    >
                                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-white">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.model}
                                                fill
                                                className="object-contain"
                                                sizes="40px"
                                            />
                                        </div>
                                        <div className="max-w-[80px]">
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 truncate">
                                                {item.make}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-700 truncate">
                                                {item.model}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => onRemove(item.modelSlug)}
                                            className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <X size={10} />
                                        </button>
                                    </motion.div>
                                ))}

                                {/* Empty slots */}
                                {Array.from({ length: Math.max(0, 2 - items.length) }).map((_, i) => (
                                    <div
                                        key={`empty-${i}`}
                                        className="w-[120px] h-[46px] rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0"
                                    >
                                        <span className="text-[9px] font-bold text-slate-300">
                                            + Add
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={onClear}
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors px-2"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={onCompareNow}
                                    disabled={items.length < 1}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4B000] text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#F4B000]/20 hover:shadow-[#F4B000]/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Compare
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
