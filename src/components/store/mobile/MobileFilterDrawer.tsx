'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';

const VISIBLE_COUNT = 3;

interface FilterSectionRowProps {
    section: {
        title: string;
        options: readonly string[] | string[];
        selected: string[];
        onToggle: (val: string) => void;
        onReset: () => void;
    };
}

function FilterSectionRow({ section }: FilterSectionRowProps) {
    const [expanded, setExpanded] = useState(false);
    const hasMore = section.options.length > VISIBLE_COUNT;
    const hiddenCount = section.options.length - VISIBLE_COUNT;

    // Always include selected items so they're not hidden
    const baseVisible = section.options.slice(0, VISIBLE_COUNT);
    const extraSelected = section.options.slice(VISIBLE_COUNT).filter(o => section.selected.includes(o));
    const visible: (typeof section.options)[number][] = expanded
        ? [...section.options]
        : [...baseVisible, ...extraSelected];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                    <div
                        className={`w-1.5 h-1.5 rounded-full transition-all ${section.selected.length > 0 ? 'bg-[#F4B000] shadow-[0_0_8px_#F4B000]' : 'bg-slate-300'}`}
                    />
                    {section.title}
                </h4>
                {section.selected.length > 0 && (
                    <button onClick={section.onReset} className="text-[9px] font-black uppercase text-rose-500">
                        Reset
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {visible.map(opt => (
                    <button
                        key={opt}
                        onClick={() => section.onToggle(opt)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all min-h-[40px] ${
                            section.selected.includes(opt)
                                ? 'bg-[#F4B000]/15 border-[#F4B000]/50 text-slate-900 border shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
                {hasMore && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all min-h-[40px] bg-slate-50 border border-dashed border-slate-300 text-slate-400"
                    >
                        {expanded ? '− Less' : `+${hiddenCount} more`}
                    </button>
                )}
            </div>
        </div>
    );
}

interface FilterSection {
    title: string;
    options: readonly string[] | string[];
    selected: string[];
    onToggle: (val: string) => void;
    onReset: () => void;
}

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    sections: FilterSection[];
    onClearAll: () => void;
    activeFilterCount: number;
    /** Sort */
    sortBy: string;
    onSortChange: (val: string) => void;
    /** Finance */
    downpayment: number;
    onDownpaymentChange: (val: number) => void;
    tenure: number;
    onTenureChange: (val: number) => void;
}

export function MobileFilterDrawer({
    isOpen,
    onClose,
    sections,
    onClearAll,
    activeFilterCount,
    sortBy,
    onSortChange,
    downpayment,
    onDownpaymentChange,
    tenure,
    onTenureChange,
}: MobileFilterDrawerProps) {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[101] max-h-[85svh] flex flex-col bg-white rounded-t-3xl border-t border-slate-200"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-slate-300" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <SlidersHorizontal size={18} className="text-[#FFD700]" />
                                <h3 className="text-lg font-black uppercase tracking-widest text-slate-900">
                                    Customize
                                </h3>
                                {activeFilterCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-[#FFD700] text-black text-[10px] font-black flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        className="text-[10px] font-black uppercase tracking-widest text-rose-500"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
                                >
                                    <X size={16} className="text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content — scrollable */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-6">
                            {/* Sort By */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${sortBy !== 'popular' ? 'bg-[#F4B000] shadow-[0_0_8px_#F4B000]' : 'bg-slate-300'}`}
                                    />
                                    Sort By
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'popular', label: 'Popularity' },
                                        { value: 'price', label: 'Price' },
                                        { value: 'mileage', label: 'Mileage' },
                                        { value: 'seatHeight', label: 'Seat Height' },
                                        { value: 'kerbWeight', label: 'Weight' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onSortChange(opt.value)}
                                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all min-h-[40px] ${
                                                sortBy === opt.value
                                                    ? 'bg-[#F4B000]/15 border-[#F4B000]/50 text-slate-900 border shadow-sm'
                                                    : 'bg-white border border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filter Sections */}
                            {sections.map(section => (
                                <FilterSectionRow key={section.title} section={section} />
                            ))}
                        </div>

                        {/* Footer — Apply button */}
                        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100">
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl bg-[#FFD700] text-black text-sm font-black uppercase tracking-widest shadow-lg shadow-[#FFD700]/20 active:scale-[0.98] transition-all"
                            >
                                Show Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/** Floating trigger pill for the filter drawer */
export function MobileFilterTrigger({ onClick, activeCount }: { onClick: () => void; activeCount: number }) {
    return (
        <button
            onClick={onClick}
            className="fixed z-[50] bottom-[calc(60px+env(safe-area-inset-bottom,0px)+12px)] left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-300/40 active:scale-95 transition-all"
        >
            <SlidersHorizontal size={14} className="text-[#FFD700]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Customize</span>
            {activeCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-[#FFD700] text-black text-[9px] font-black flex items-center justify-center min-w-[18px] px-1">
                    {activeCount}
                </span>
            )}
        </button>
    );
}
