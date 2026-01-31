'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    Package,
    ShieldCheck,
    Wrench,
    Zap,
    ArrowRight,
    Circle,
    CheckCircle2
} from 'lucide-react';
import { SwipeHint } from '../ui/SwipeHint';

interface PhonePDPProps {
    product: any;
    data: any;
    handlers: any;
    initialLocation: any;
}

export const PhonePDP = ({ product, data, handlers, initialLocation }: PhonePDPProps) => {
    const [activePhase, setActivePhase] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const phases = [
        { id: 'MACHINE', label: 'The Machine', icon: Zap },
        { id: 'PACKAGE', label: 'Your Package', icon: Package },
        { id: 'PLAN', label: 'Payment Plan', icon: Zap },
        { id: 'CONFIRM', label: 'Final Setup', icon: CheckCircle2 }
    ];

    const {
        colors,
        selectedColor,
        totalOnRoad,
        baseExShowroom,
        selectedAccessories,
        selectedInsuranceAddons,
        selectedServices,
        activeAccessories,
        availableInsuranceAddons,
        activeServices,
        emi,
        emiTenure,
        downPayment
    } = data;

    const {
        handleColorChange,
        handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        setEmiTenure,
        setSelectedColor
    } = handlers;

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0];

    // Helper for Level 2 Horizontal Swiper
    const configTabs = [
        { id: 'ACCESSORIES', label: 'Accessories', icon: Package, count: selectedAccessories.length, items: activeAccessories },
        { id: 'INSURANCE', label: 'Insurance', icon: ShieldCheck, count: selectedInsuranceAddons.length, items: availableInsuranceAddons },
        { id: 'SERVICES', label: 'Services', icon: Wrench, count: selectedServices.length, items: activeServices }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] text-slate-900 dark:text-white pb-32 transition-colors duration-500">
            {/* 1. Journey Progress Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-4">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    {phases.map((phase, i) => {
                        const Icon = phase.icon;
                        const isActive = activePhase === i;
                        const isCompleted = activePhase > i;
                        return (
                            <div key={phase.id} className="flex flex-col items-center gap-1">
                                <div
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isActive ? 'bg-brand-primary border-brand-primary text-black' :
                                        isCompleted ? 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary' :
                                            'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-brand-primary' : 'text-slate-500'}`}>
                                    {phase.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Phase Content */}
            <div className="px-6 py-8 space-y-12">
                <AnimatePresence mode="wait">
                    {/* LEVEL 1: THE MACHINE */}
                    {activePhase === 0 && (
                        <motion.div
                            key="phase-0"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                    Define your <span className="text-brand-primary">Machine.</span>
                                </h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select your warpaint</p>
                            </div>

                            <div className="relative aspect-square flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 to-transparent blur-3xl opacity-50" />
                                <motion.img
                                    layoutId="product-image"
                                    src={activeColorConfig?.image || '/images/categories/scooter_nobg.png'}
                                    className="w-full h-full object-contain drop-shadow-2xl z-10"
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-center gap-4">
                                    {colors.map((color: any) => (
                                        <button
                                            key={color.id}
                                            onClick={() => handleColorChange(color.id)}
                                            className={`relative w-12 h-12 rounded-2xl transition-all duration-300 ${selectedColor === color.id ? 'scale-110 ring-2 ring-brand-primary ring-offset-4 ring-offset-slate-50 dark:ring-offset-[#0b0d10]' : 'opacity-60'}`}
                                            style={{ backgroundColor: color.hex }}
                                        />
                                    ))}
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary">{activeColorConfig?.name}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 space-y-4 shadow-xl">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Starting On-Road</p>
                                        <p className="text-4xl font-black italic text-brand-primary">₹{totalOnRoad.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => setActivePhase(1)}
                                        className="bg-brand-primary text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 group transition-all"
                                    >
                                        Next Step <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* LEVEL 2: YOUR PACKAGE (The Hybrid Swipe/Scroll Section) */}
                    {activePhase === 1 && (
                        <motion.div
                            key="phase-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                    Forge your <span className="text-brand-primary">Package.</span>
                                </h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personalize with horizontal depth</p>
                            </div>

                            <SwipeHint text="Swipe for Categories" />

                            <div className="overflow-x-auto snap-x snap-mandatory flex gap-6 pb-8 scrollbar-hide -mx-6 px-6">
                                {configTabs.map((tab) => (
                                    <div key={tab.id} className="flex-none w-[85vw] snap-center">
                                        <div className="bg-white dark:bg-white/[0.03] rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 h-full space-y-6 shadow-xl">
                                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                                                        <tab.icon size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black uppercase italic tracking-tighter">{tab.label}</h3>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tab.count} selected</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {tab.items.length > 0 ? (
                                                    tab.items.map((item: any) => {
                                                        const isSelected = tab.id === 'ACCESSORIES' ? selectedAccessories.includes(item.id) :
                                                            tab.id === 'INSURANCE' ? selectedInsuranceAddons.includes(item.id) :
                                                                selectedServices.includes(item.id);
                                                        const toggle = tab.id === 'ACCESSORIES' ? () => toggleAccessory(item.id) :
                                                            tab.id === 'INSURANCE' ? () => toggleInsuranceAddon(item.id) :
                                                                () => toggleService(item.id);

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={toggle}
                                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${isSelected ? 'bg-brand-primary/10 border-brand-primary/40' : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5'
                                                                    }`}
                                                            >
                                                                <div className="flex-1">
                                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-brand-primary' : 'text-slate-900 dark:text-white'}`}>{item.name}</p>
                                                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">₹{item.price.toLocaleString()}</p>
                                                                </div>
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 dark:border-slate-700'}`}>
                                                                    {isSelected && <CheckCircle2 size={12} className="text-black" />}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-center py-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">No options available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center gap-4">
                                <button
                                    onClick={() => setActivePhase(0)}
                                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => setActivePhase(2)}
                                    className="flex-1 bg-brand-primary text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group transition-all shadow-xl"
                                >
                                    Confirm Package <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* LEVEL 3: THE PLAN */}
                    {activePhase === 2 && (
                        <motion.div
                            key="phase-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                    The <span className="text-brand-primary">Plan.</span>
                                </h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Financial engineering</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[12, 24, 36, 48, 60].map((months) => (
                                    <button
                                        key={months}
                                        onClick={() => setEmiTenure(months)}
                                        className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${emiTenure === months ? 'bg-brand-primary border-brand-primary text-black' : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/5'}`}
                                    >
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">{months} Months Tenure</p>
                                            <p className="text-3xl font-black italic tracking-tighter">₹{emi.toLocaleString()}<span className="text-xs not-italic lowercase">/mo</span></p>
                                        </div>
                                        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center border ${emiTenure === months ? 'bg-black/10 border-black/20' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                            < Zap size={18} />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between items-center gap-4">
                                <button
                                    onClick={() => setActivePhase(1)}
                                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => setActivePhase(3)}
                                    className="flex-1 bg-brand-primary text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group transition-all shadow-xl"
                                >
                                    Review Setup <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* LEVEL 4: CONFIRM */}
                    {activePhase === 3 && (
                        <motion.div
                            key="phase-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                    Final <span className="text-brand-primary">Setup.</span>
                                </h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Everything is ready</p>
                            </div>

                            <div className="bg-white dark:bg-white/[0.03] rounded-[3rem] border border-slate-200 dark:border-white/5 p-10 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Logo variant="icon" size={120} mode="auto" />
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-2">Machine Config</p>
                                        <h3 className="text-2xl font-black italic uppercase">{product.make} {product.model}</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{product.variant} • {activeColorConfig?.name}</p>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-white/5" />

                                    <div className="flex justify-between items-center text-slate-900 dark:text-white">
                                        <p className="text-xs font-black uppercase tracking-widest">Downpayment</p>
                                        <p className="text-xl font-black font-mono">₹{downPayment.toLocaleString()}</p>
                                    </div>

                                    <div className="flex justify-between items-center text-slate-900 dark:text-white">
                                        <p className="text-xs font-black uppercase tracking-widest">Monthly EMI</p>
                                        <p className="text-xl font-black font-mono text-brand-primary">₹{emi.toLocaleString()}</p>
                                    </div>

                                    <div className="pt-4">
                                        <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex items-center gap-4">
                                            <ShieldCheck size={24} className="text-brand-primary" />
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-relaxed">
                                                Secured by Institutional Banking Protocols. <br />
                                                <span className="text-brand-primary font-black italic">Verified in Real-Time.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleBookingRequest}
                                className="w-full bg-brand-primary text-black py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 group transition-all shadow-[0_20px_40px_rgba(244,176,0,0.3)] animate-bounce"
                            >
                                Confirm & Book Machine <Zap size={20} fill="currentColor" />
                            </button>

                            <button
                                onClick={() => setActivePhase(2)}
                                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Go back to Plan
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(244,176,0,0.2);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

// Simplified Logo for the card background
const Logo = ({ variant, size, mode }: any) => {
    return (
        <div style={{ width: size, height: size }} className="opacity-20 grayscale pointer-events-none">
            <svg viewBox="0 0 80 109" fill="currentColor">
                <path d="M40 0L80 40L40 80L0 40L40 0Z" />
            </svg>
        </div>
    );
};
