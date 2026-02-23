'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    Share2,
    Heart,
    MapPin,
    ShieldCheck,
    Wrench,
    Package,
    Gift,
    ChevronDown,
    ChevronUp,
    Info,
    CheckCircle2,
    Plus,
    ArrowRight,
    Gauge,
    Fuel,
    Weight,
    Bike,
} from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';
import { computeOClubPricing } from '@/lib/oclub/coin';
import { toast } from 'sonner';
import { Logo } from '@/components/brand/Logo';

// ============================================================================
// Props (Identical to DesktopPDPProps for 1:1 API compatibility)
// ============================================================================
export interface MobilePDPProps {
    product: any;
    makeParam: string;
    modelParam: string;
    variantParam: string;
    data: any;
    leadContext?: { id: string; name: string };
    basePath?: string;
    handlers: {
        handleColorChange: (id: string) => void;
        handleShareQuote: () => void;
        handleSaveQuote: () => void;
        handleBookingRequest: () => void;
        toggleAccessory: (id: string) => void;
        toggleInsuranceAddon: (id: string) => void;
        toggleService: (id: string) => void;
        toggleOffer: (id: string) => void;
        updateQuantity: (id: string, delta: number, max?: number) => void;
        setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
        setEmiTenure: (months: number) => void;
        setConfigTab: (tab: any) => void;
        setUserDownPayment: (amount: number) => void;
    };
    initialLocation?: any;
    bestOffer?: any;
    walletCoins?: number | null;
    showOClubPrompt?: boolean;
    isGated?: boolean;
    forceMobileLayout?: boolean;
    serviceability?: {
        isServiceable: boolean;
        status: string;
        pincode?: string;
        taluka?: string;
    };
}

// ============================================================================
// Internal Components
// ============================================================================
const MobileAccordion = ({
    title,
    icon: Icon,
    badge,
    children,
    defaultOpen = false,
}: {
    title: string;
    icon: any;
    badge?: string | number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-white/5 bg-white/5 rounded-3xl overflow-hidden backdrop-blur-md mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/5 active:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#F4B000]">
                        <Icon size={16} />
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-widest text-white">{title}</span>
                    {badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F4B000]/20 text-[#F4B000] text-[9px] font-black">
                            {badge}
                        </span>
                    )}
                </div>
                {isOpen ? (
                    <ChevronUp size={18} className="text-slate-400" />
                ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                )}
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 border-t border-white/5">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================================================
// Main MobilePDP Component
// ============================================================================
export const MobilePDP = ({
    product,
    makeParam,
    modelParam,
    variantParam,
    data,
    handlers,
    leadContext,
    initialLocation,
    walletCoins = null,
}: MobilePDPProps) => {
    const { language } = useI18n();
    const shouldDevanagari = language === 'hi' || language === 'mr';
    const scriptText = (value?: string) => (shouldDevanagari ? toDevanagariScript(value || '') : value || '');

    const {
        colors = [],
        selectedColor,
        activeAccessories = [],
        selectedAccessories = [],
        activeServices = [],
        selectedServices = [],
        availableInsuranceAddons = [],
        selectedInsuranceAddons = [],
        totalOnRoad = 0,
        baseExShowroom = 0,
        emi = 0,
        quantities = {},
    } = data;

    const {
        handleColorChange,
        handleShareQuote,
        handleSaveQuote,
        handleBookingRequest,
        toggleAccessory,
        toggleService,
        toggleInsuranceAddon,
        updateQuantity,
    } = handlers;

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0];
    const displayMake = scriptText(makeParam);
    const displayModel = scriptText(modelParam);
    const displayVariant = scriptText(variantParam);
    const displayColor = scriptText(activeColorConfig?.name);

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        if (activeColorConfig?.image_url) return activeColorConfig.image_url;
        if (activeColorConfig?.imageUrl) return activeColorConfig.imageUrl;
        if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];
        return '/images/hero-bike.webp';
    };

    const walletCoinsValue = Number(walletCoins);
    const coinPricing =
        Number.isFinite(walletCoinsValue) && walletCoinsValue > 0
            ? computeOClubPricing(totalOnRoad, walletCoinsValue)
            : null;
    const displayOnRoad = coinPricing?.effectivePrice ?? totalOnRoad;

    // --- RENDER HELPERS FOR ITEMS ---
    const renderConfigRow = (
        item: any,
        isSelected: boolean,
        onToggle: (id: string) => void,
        isMandatory = false,
        isQuantityConfigurable = false
    ) => {
        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
        const hasDiscount = item.discountPrice > 0 && item.discountPrice < item.price;
        const qty = quantities[item.id] || 1;

        return (
            <div
                key={item.id}
                onClick={() => !isMandatory && onToggle(item.id)}
                className={`relative flex flex-col p-4 rounded-2xl border mb-3 transition-colors ${
                    isSelected
                        ? 'bg-[#F4B000]/10 border-[#F4B000]/50 shadow-[0_0_15px_rgba(244,176,0,0.1)]'
                        : 'bg-white/5 border-white/10'
                }`}
            >
                <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-[#F4B000] text-black' : 'border-2 border-slate-500'
                            }`}
                        >
                            {isSelected && <CheckCircle2 size={14} strokeWidth={3} />}
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-white leading-tight">
                                {item.displayName || item.name}
                            </p>
                            {item.description && (
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <span className={`text-[13px] font-black ${isSelected ? 'text-[#F4B000]' : 'text-white'}`}>
                            {finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
                        </span>
                        {hasDiscount && (
                            <span className="text-[10px] text-slate-500 line-through">
                                ₹{item.price.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {isSelected && isQuantityConfigurable && !isMandatory && (
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                updateQuantity(item.id, -1);
                            }}
                            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
                        >
                            -
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                updateQuantity(item.id, 1, item.maxQty || 10);
                            }}
                            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white pb-36 font-sans selection:bg-[#F4B000]/30 selection:text-[#F4B000]">
            {/* 1. Mobile Header (Transparent, floats over image) */}
            <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button
                    onClick={() => window.history.back()}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 flex justify-center pointer-events-auto">
                    <Logo mode="dark" variant="icon" size={24} />
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={handleSaveQuote}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                    >
                        <Heart size={18} />
                    </button>
                    <button
                        onClick={handleShareQuote}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* 2. Edge-to-Edge Hero Image */}
            <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#1a1c23] to-[#0b0d10] pt-12 flex items-center justify-center overflow-hidden">
                <motion.div
                    key={selectedColor}
                    initial={{ opacity: 0, scale: 0.95, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full h-[80%]"
                >
                    <Image
                        src={getProductImage()}
                        alt={`${displayMake} ${displayModel}`}
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                </motion.div>

                {/* Location Overlay Pill */}
                {initialLocation && (
                    <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 mt-auto">
                        <MapPin size={10} className="text-[#F4B000]" />
                        <span className="text-[9px] font-black tracking-widest uppercase text-white">
                            {initialLocation.district || initialLocation.pincode}
                        </span>
                    </div>
                )}
            </div>

            {/* 3. Title & Price Block */}
            <div className="px-5 py-6">
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1">{displayMake}</p>
                <h1 className="text-3xl font-black italic tracking-tight text-white leading-none mb-1">
                    {displayModel}
                </h1>
                <p className="text-[12px] font-bold text-[#F4B000] uppercase tracking-wider mb-6">{displayVariant}</p>

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                            On-Road Price
                        </p>
                        <p className="text-3xl font-black text-white tabular-nums">₹{displayOnRoad.toLocaleString()}</p>
                    </div>
                    {emi > 0 && (
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                                Starting EMI
                            </p>
                            <p className="text-xl font-black text-[#F4B000] tabular-nums">
                                ₹{Math.round(emi).toLocaleString()}/mo
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Color Selection */}
            {colors && colors.length > 0 && (
                <div className="px-5 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
                        Choose Color: <span className="text-white">{displayColor}</span>
                    </p>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                        {colors.map((c: any) => {
                            const isColorSelected = c.id === selectedColor;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => handleColorChange(c.id)}
                                    className={`relative w-12 h-12 rounded-full shrink-0 transition-all border-2 ${
                                        isColorSelected ? 'border-[#F4B000] scale-110' : 'border-transparent'
                                    }`}
                                >
                                    <div
                                        className="absolute inset-[3px] rounded-full shadow-inner"
                                        style={{ backgroundColor: c.hexCode || c.hex || '#ffffff' }}
                                    />
                                    {isColorSelected && (
                                        <div className="absolute inset-0 rounded-full border border-white/20" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. Specifications Section */}
            {product?.specs && Object.keys(product.specs).length > 0 && (
                <div className="px-5 mb-2">
                    <MobileAccordion title="Specifications" icon={Gauge} defaultOpen={false}>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {product.specs.displacement && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Engine
                                    </span>
                                    <span className="text-[13px] font-black text-white">
                                        {product.specs.displacement}
                                    </span>
                                </div>
                            )}
                            {product.specs.mileage && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Mileage
                                    </span>
                                    <span className="text-[13px] font-black text-emerald-400">
                                        {product.specs.mileage}
                                    </span>
                                </div>
                            )}
                            {product.specs.maxPower && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Power
                                    </span>
                                    <span className="text-[13px] font-black text-white">{product.specs.maxPower}</span>
                                </div>
                            )}
                            {product.specs.maxTorque && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Torque
                                    </span>
                                    <span className="text-[13px] font-black text-white">{product.specs.maxTorque}</span>
                                </div>
                            )}
                            {product.specs.kerbWeight && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Weight
                                    </span>
                                    <span className="text-[13px] font-black text-white">
                                        {product.specs.kerbWeight}
                                    </span>
                                </div>
                            )}
                            {product.specs.seatHeight && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Seat Height
                                    </span>
                                    <span className="text-[13px] font-black text-white">
                                        {product.specs.seatHeight}
                                    </span>
                                </div>
                            )}
                            {product.specs.fuelCapacity && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Fuel Tank
                                    </span>
                                    <span className="text-[13px] font-black text-white">
                                        {product.specs.fuelCapacity}
                                    </span>
                                </div>
                            )}
                            {product.specs.abs && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                        Braking
                                    </span>
                                    <span className="text-[13px] font-black text-white">{product.specs.abs}</span>
                                </div>
                            )}
                        </div>
                    </MobileAccordion>
                </div>
            )}

            {/* 6. Configuration Accordions */}
            <div className="px-5 space-y-2">
                {/* Accessories */}
                {activeAccessories && activeAccessories.length > 0 && (
                    <MobileAccordion
                        title="Accessories"
                        icon={Package}
                        badge={selectedAccessories.length}
                        defaultOpen={true}
                    >
                        <div className="mt-4">
                            {activeAccessories.map((acc: any) =>
                                renderConfigRow(
                                    acc,
                                    acc.isMandatory || selectedAccessories.includes(acc.id),
                                    toggleAccessory,
                                    acc.isMandatory,
                                    true
                                )
                            )}
                        </div>
                    </MobileAccordion>
                )}

                {/* Services */}
                {activeServices && activeServices.length > 0 && (
                    <MobileAccordion title="Services" icon={Wrench} badge={selectedServices.length}>
                        <div className="mt-4">
                            {activeServices.map((svc: any) =>
                                renderConfigRow(svc, selectedServices.includes(svc.id), toggleService, false, true)
                            )}
                        </div>
                    </MobileAccordion>
                )}

                {/* Insurance Addons */}
                {availableInsuranceAddons && availableInsuranceAddons.length > 0 && (
                    <MobileAccordion
                        title="Insurance Add-ons"
                        icon={ShieldCheck}
                        badge={selectedInsuranceAddons.length}
                    >
                        <div className="mt-4">
                            {availableInsuranceAddons.map((addon: any) =>
                                renderConfigRow(
                                    addon,
                                    addon.isMandatory || selectedInsuranceAddons.includes(addon.id),
                                    toggleInsuranceAddon,
                                    addon.isMandatory,
                                    false
                                )
                            )}
                        </div>
                    </MobileAccordion>
                )}
            </div>

            {/* 7. Sticky Bottom Action Bar (single bar — no duplicate) */}
            <div className="fixed bottom-0 inset-x-0 z-50 bg-[#0b0d10]/95 backdrop-blur-2xl border-t border-white/5 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                            Total On-Road
                        </p>
                        <p className="text-xl font-black text-white tabular-nums">₹{displayOnRoad.toLocaleString()}</p>
                        {emi > 0 && (
                            <p className="text-[11px] font-bold text-[#F4B000] mt-0.5">
                                ₹{Math.round(emi).toLocaleString()}/mo EMI
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleBookingRequest}
                        className="flex-shrink-0 px-6 h-12 rounded-2xl bg-[#F4B000] text-black text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,176,0,0.3)] active:scale-95 transition-all whitespace-nowrap"
                    >
                        Get Quote
                        <ArrowRight size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
