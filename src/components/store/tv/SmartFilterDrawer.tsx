'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Check } from 'lucide-react';
import { useBrands } from '@/hooks/useBrands';
import { slugify } from '@/utils/slugs';

interface SmartFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    // Brands
    activeBrands: string[];
    onToggleBrand: (brand: string) => void;
    // New Filters
    activeEngines: string[];
    onToggleEngine: (id: string) => void;
    activeFuels: string[];
    onToggleFuel: (id: string) => void;
    // Finance
    activeDownpayment: number | null;
    onSelectDownpayment: (amount: number | null) => void;
    activeTenure: number | null;
    onSelectTenure: (months: number | null) => void;
    // Reset
    onReset: () => void;
}

const FUEL_TYPES = [
    { id: 'PETROL', label: 'PETROL' },
    { id: 'ELECTRIC', label: 'ELECTRIC' },
];

const ENGINE_CC = [
    { id: '100-125', label: '100 - 125 cc' },
    { id: '125-160', label: '125 - 160 cc' },
    { id: '160-350', label: '160 - 350 cc' },
    { id: '>350', label: '350+ cc' },
];

export const SmartFilterDrawer = ({
    isOpen,
    onClose,
    activeBrands,
    onToggleBrand,
    activeEngines = [],
    onToggleEngine = () => {},
    activeFuels = [],
    onToggleFuel = () => {},
    activeDownpayment = null,
    onSelectDownpayment = () => {},
    activeTenure = null,
    onSelectTenure = () => {},
    onReset,
}: SmartFilterDrawerProps) => {
    const { brands } = useBrands();

    // Lock body scroll when open
    React.useEffect(() => {
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
                    {/* Overlay Container */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-[76px] inset-x-0 bottom-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex flex-col"
                    >
                        <div className="max-w-[1440px] mx-auto w-full px-20 flex flex-col h-full">
                            {/* Header (Fixed) */}
                            <div className="flex-shrink-0 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-widest italic uppercase">
                                        CUSTOMIZE
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                        Refine by Brand, Engine & Fuel
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={onReset}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                                    >
                                        <RotateCcw size={14} />
                                        RESET
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all"
                                    >
                                        <X size={24} className="text-slate-900 dark:text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto py-10 space-y-12">
                                {/* Top Section: Finance Configuration (Requested Priority) */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                                        FINANCE CONFIGURATION
                                    </h4>
                                    <div className="space-y-8 bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                        {/* Downpayment Slider */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                    Downpayment
                                                </span>
                                                <span className="text-xl font-black text-brand-primary italic">
                                                    ₹{(activeDownpayment || 50000).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div className="relative flex items-center h-8">
                                                <input
                                                    type="range"
                                                    min="5000"
                                                    max="95000"
                                                    step="5000"
                                                    value={activeDownpayment || 50000}
                                                    onChange={e => onSelectDownpayment(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white slider-thumb-premium"
                                                    style={{
                                                        background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(((activeDownpayment || 50000) - 5000) / (95000 - 5000)) * 100}%, rgba(255,255,255,0.1) ${(((activeDownpayment || 50000) - 5000) / (95000 - 5000)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                                                    }}
                                                />
                                                <style
                                                    dangerouslySetInnerHTML={{
                                                        __html: `
                                                            .slider-thumb-premium::-webkit-slider-thumb {
                                                                appearance: none;
                                                                width: 24px;
                                                                height: 24px;
                                                                background: #000;
                                                                border: 4px solid #FFD700;
                                                                border-radius: 50%;
                                                                cursor: pointer;
                                                                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
                                                                transition: all 0.2s;
                                                            }
                                                            .slider-thumb-premium::-webkit-slider-thumb:hover {
                                                                transform: scale(1.2);
                                                                background: #FFD700;
                                                                border-color: #000;
                                                            }
                                                        `,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>₹5k</span>
                                                <span>₹95k</span>
                                            </div>
                                        </div>

                                        {/* Tenure Grid */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                    EMI Tenure
                                                </span>
                                                <span className="text-sm font-black text-brand-primary italic">
                                                    {activeTenure || 36} Months
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-6 gap-3">
                                                {[12, 18, 24, 30, 36, 42, 48, 54, 60].map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => onSelectTenure(t)}
                                                        className={`py-3 rounded-xl text-xs font-black transition-all duration-300 ${
                                                            activeTenure === t
                                                                ? 'bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-105 ring-2 ring-[#FFD700]/50'
                                                                : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />

                                {/* Brands Section */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                                        BRANDS
                                    </h4>
                                    <div className="grid grid-cols-4 gap-4">
                                        {brands.map(brand => {
                                            const isActive = activeBrands.includes(brand.id); // Assuming hook returns id which matches catalog
                                            return (
                                                <button
                                                    key={brand.id}
                                                    onClick={() => onToggleBrand(brand.id)}
                                                    className={`relative h-20 flex items-center justify-center rounded-xl border-2 transition-all duration-300 group overflow-hidden ${
                                                        isActive
                                                            ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-[1.02]'
                                                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/30 hover:scale-[1.02]'
                                                    }`}
                                                >
                                                    <span className="text-lg font-black uppercase tracking-widest z-10">
                                                        {brand.name}
                                                    </span>
                                                    {isActive && (
                                                        <div className="absolute top-2 right-2">
                                                            <Check size={16} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />

                                {/* Dual Grid: Fuel & Engine */}
                                <div className="grid grid-cols-2 gap-12">
                                    {/* Fuel Type */}
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                                            FUEL TYPE
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {FUEL_TYPES.map(fuel => {
                                                const isActive = activeFuels.includes(fuel.id);
                                                return (
                                                    <button
                                                        key={fuel.id}
                                                        onClick={() => onToggleFuel(fuel.id)}
                                                        className={`relative h-16 flex items-center justify-center rounded-xl border-2 transition-all duration-300 group ${
                                                            isActive
                                                                ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-[1.02]'
                                                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/30'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-black uppercase tracking-widest">
                                                            {fuel.label}
                                                        </span>
                                                        {isActive && (
                                                            <div className="absolute top-2 right-2">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Engine Capacity */}
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                                            ENGINE CAPACITY
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {ENGINE_CC.map(engine => {
                                                const isActive = activeEngines.includes(engine.id);
                                                return (
                                                    <button
                                                        key={engine.id}
                                                        onClick={() => onToggleEngine(engine.id)}
                                                        className={`relative h-16 flex items-center justify-center rounded-xl border-2 transition-all duration-300 group ${
                                                            isActive
                                                                ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-[1.02]'
                                                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/30'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-black uppercase tracking-widest">
                                                            {engine.label}
                                                        </span>
                                                        {isActive && (
                                                            <div className="absolute top-2 right-2">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Spacing */}
                                <div className="h-20" />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
