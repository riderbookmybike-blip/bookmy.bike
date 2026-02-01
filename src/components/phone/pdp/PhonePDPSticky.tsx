/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import {
    ChevronDown,
    ChevronUp,
    Zap,
    Package,
    ShieldCheck,
    Gift,
    Wrench,
    Info,
    ArrowRight
} from 'lucide-react';

interface PhonePDPStickyProps {
    product: any;
    modelParam: string;
    variantParam: string;
    data: any;
    handlers: any;
    bestOffer?: any;
    serviceability?: any;
    serverPricing?: any; // SSPP v1: Server-calculated pricing breakdown
}

export function PhonePDPSticky({ product, modelParam, variantParam, data, handlers, bestOffer, serviceability, serverPricing }: PhonePDPStickyProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    const [compactValue, setCompactValue] = useState(false);

    // One-way scroll collapse logic
    useMotionValueEvent(scrollY, "change", (latest) => {
        // Collapse if scrolled down more than 50px
        if (latest > 50 && !compactValue) {
            setCompactValue(true);
        }
    });

    const {
        totalOnRoad,
        baseExShowroom,
        emi,
        emiTenure,
        selectedAccessories,
        selectedInsuranceAddons,
        selectedServices,
        regType,
        colors,
        selectedColor,
    } = data;

    const activeColorConfig = colors?.find((c: any) => c.id === selectedColor) || colors?.[0];
    const vehicleImage = activeColorConfig?.image || product.imageUrl;
    const savings = (product.price?.onRoad || 0) - totalOnRoad;
    const pricingSourceLabel = (() => {
        const source = serverPricing?.location?.district
            ? [serverPricing.location.district, serverPricing.location.state_code].filter(Boolean).join(', ')
            : (bestOffer?.dealerLocation || undefined);
        return source ? source.replace(/^(Best:|Base:)\s*/i, '').trim() : undefined;
    })();

    const GlassCard = ({ title, icon: Icon, children, id, summary }: any) => {
        const [isExpanded, setIsExpanded] = useState(false);

        return (
            <motion.div
                layout
                className="mx-4 mb-6 rounded-[2.5rem] bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden"
            >
                <div
                    className="p-6 flex items-center justify-between cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white">{title}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{summary}</p>
                        </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <ChevronDown size={20} className="text-slate-400" />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-6 overflow-hidden"
                        >
                            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-[#f8fafc] dark:bg-[#060709] pb-32">
            {/* Adaptive Header Section */}
            <div className="sticky top-[58px] z-[100] w-full">
                <motion.div
                    layout
                    className={`w-full overflow-hidden transition-all duration-300 ${compactValue
                        ? 'bg-transparent py-0 cursor-pointer'
                        : 'bg-transparent py-4 px-4 shadow-none'
                        }`}
                    onClick={() => {
                        if (compactValue) {
                            setCompactValue(false);
                            // Scroll to top to show expanded state properly
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                >
                    <div className="relative">
                        {/* FULL HEADER */}
                        <div
                            className={`transition-all duration-300 px-4 pt-4 pb-6 ${compactValue ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100 h-auto'}`}
                        >
                            {!compactValue && (
                                <ProductCard
                                    v={{
                                        ...product,
                                        imageUrl: vehicleImage,
                                        price: {
                                            ...product.price,
                                            onRoad: totalOnRoad // Inject current calculated total
                                        },
                                        availableColors: colors?.map((c: any) => ({
                                            id: c.id,
                                            name: c.name,
                                            hexCode: c.hex,
                                            imageUrl: c.imageUrl,
                                            zoomFactor: c.zoomFactor,
                                            isFlipped: c.isFlipped,
                                            offsetX: c.offsetX,
                                            offsetY: c.offsetY
                                        }))
                                    }}
                                    viewMode="grid"
                                    downpayment={data.userDownPayment}
                                    tenure={data.emiTenure}
                                    basePath="/phone/store"
                                    isParentCompact={compactValue}
                                    onColorChange={(colorId) => handlers.handleColorChange(colorId)}
                                    // Inject Serviceability and Best Offer for District Display
                                    serviceability={serviceability}
                                    bestOffer={bestOffer}
                                    // SSPP v1: Pass server-calculated pricing and hide Know More on PDP
                                    serverPricing={serverPricing}
                                    isPdp={true}
                                />
                            )}
                        </div>

                        {/* COMPACT LIST HEADER (Perfect Match with GlassCard) */}
                        <div
                            className={`transition-all duration-500 flex items-center px-6 h-24 mx-4 mb-6 rounded-[2.5rem] bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl active:scale-[0.98] ${compactValue ? 'opacity-100 translate-y-0 translate-z-0' : 'opacity-0 absolute inset-0 pointer-events-none -translate-y-4'}`}
                        >
                            {/* Left: Component Image */}
                            <div className="w-16 h-16 flex-shrink-0 relative flex items-center justify-center">
                                <img
                                    src={vehicleImage}
                                    alt={product.model}
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            </div>

                            {/* Middle & Right: Details & Pricing */}
                            <div className="flex flex-col min-w-0 flex-1 justify-center ml-2">
                                <div className="flex flex-col">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-0.5 leading-none">
                                        {product.model}
                                    </h3>
                                    <h2 className="text-[22px] font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">
                                        ₹{totalOnRoad.toLocaleString()}
                                    </h2>
                                    <div className="mt-1 flex items-center text-slate-500">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] truncate">
                                            {variantParam} • {activeColorConfig?.name || 'Standard'}
                                        </span>
                                    </div>
                                    {pricingSourceLabel && (
                                        <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                            Source: {pricingSourceLabel}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Expand Indicator */}
                            <div className="flex-shrink-0 flex items-center justify-center mr-1">
                                <ChevronDown size={22} className="text-slate-300 dark:text-slate-500" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scrollable Configuration Cards */}
            <div className="relative z-10">
                <GlassCard
                    title="Price Summary"
                    icon={Wrench}
                    summary={`On-Road: ₹${(serverPricing?.final_on_road || totalOnRoad).toLocaleString()}${pricingSourceLabel ? ` • ${pricingSourceLabel}` : ''}`}
                    id="PRICE_BREAKUP"
                >
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            <span>Ex-Showroom</span>
                            <span>₹{(serverPricing?.ex_showroom || data.baseExShowroom)?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            <span>RTO & Reg.</span>
                            <span>₹{(serverPricing?.rto?.total || data.onRoadDetails?.rto)?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            <span>Insurance</span>
                            <span>₹{(serverPricing?.insurance?.total || data.onRoadDetails?.insurance)?.toLocaleString() || '0'}</span>
                        </div>
                        {serverPricing?.dealer?.offer > 0 && (
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-green-600">
                                <span>Dealer Discount</span>
                                <span>-₹{serverPricing.dealer.offer.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between text-sm font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                            <span>Total On-Road</span>
                            <span className="text-brand-primary">₹{(serverPricing?.final_on_road || totalOnRoad).toLocaleString()}</span>
                        </div>
                        {serverPricing && (
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Calculated by Server • Single Source of Truth</p>
                        )}
                        <button
                            onClick={() => handlers.setConfigTab('PRICE_BREAKUP')}
                            className="w-full mt-2 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
                        >
                            Full Details
                        </button>
                    </div>
                </GlassCard>

                <GlassCard
                    title="Ownership Plan"
                    icon={Zap}
                    summary={emi ? `₹${emi.toLocaleString()}/mo • ${emiTenure} Months` : 'Configure Finance'}
                    id="FINANCE"
                >
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-medium">Monthly commitment starting from ₹{emi?.toLocaleString()}. Adjust your downpayment for better rates.</p>
                        <button
                            onClick={() => handlers.setConfigTab('FINANCE')}
                            className="w-full py-4 bg-brand-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2"
                        >
                            Modify EMI Plan
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </GlassCard>

                <GlassCard
                    title="Personalization"
                    icon={Package}
                    summary={`${selectedAccessories.length} Items Selected`}
                    id="ACCESSORIES"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            {selectedAccessories.slice(0, 3).map((acc: any) => (
                                <div key={acc.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl text-xs">
                                    <span className="font-bold uppercase italic">{acc.name}</span>
                                    <span className="text-slate-500">₹{acc.price?.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => handlers.setConfigTab('ACCESSORIES')}
                            className="w-full py-4 border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl"
                        >
                            View All Accessories
                        </button>
                    </div>
                </GlassCard>

                <GlassCard
                    title="Coverage & Care"
                    icon={ShieldCheck}
                    summary={`${selectedInsuranceAddons.length + selectedServices.length} Protection Items`}
                    id="INSURANCE"
                >
                    <div className="space-y-4">
                        <button
                            onClick={() => handlers.setConfigTab('INSURANCE')}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-2xl"
                        >
                            Manage Protection
                        </button>
                    </div>
                </GlassCard>

                <GlassCard
                    title="Legal & Registry"
                    icon={Gift}
                    summary={`Type: ${regType}`}
                    id="REGISTRATION"
                >
                    <div className="space-y-4">
                        <button
                            onClick={() => handlers.setConfigTab('REGISTRATION')}
                            className="w-full py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px]"
                        >
                            Change Registration Type
                        </button>
                    </div>
                </GlassCard>
            </div>

            {/* Bottom Sticky Final Action */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 bg-gradient-to-t from-white dark:from-[#060709] via-white/90 dark:via-[#060709]/90 to-transparent">
                <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Selection</p>
                        <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">
                            ₹{totalOnRoad.toLocaleString()}
                        </h2>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlers.handleBookingRequest}
                        className="px-8 py-5 bg-brand-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] shadow-2xl shadow-brand-primary/30 flex items-center gap-2"
                    >
                        Checkout
                        <ArrowRight size={18} strokeWidth={3} />
                    </motion.button>
                </div>
            </div>
        </div >
    );
}
