/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronDown,
    Share2,
    Heart,
    Zap,
    ShieldCheck,
    ChevronRight,
    Star,
    Package,
    ClipboardList,
    Wrench,
    Gift,
    Info,
    CheckCircle2,
    X,
    ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';

interface PhonePDPEnhancedProps {
    product: any;
    makeParam: string;
    modelParam: string;
    variantParam: string;
    data: any;
    handlers: any;
    leadContext: any;
    initialLocation: any;
}

// Mobile-optimized reusable components
const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <h3 className="text-lg font-black uppercase italic text-white leading-none">{title}</h3>
            {subtitle && <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const SpecRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
        <span className="text-zinc-400 text-xs font-medium">{label}</span>
        <span className="text-zinc-100 text-xs font-bold text-right">{value}</span>
    </div>
);

export const PhonePDPEnhanced = ({
    product,
    makeParam,
    modelParam,
    variantParam,
    data,
    handlers,
    leadContext,
    initialLocation,
}: PhonePDPEnhancedProps) => {
    const router = useRouter();
    const { language } = useI18n();
    const [showPriceBreakup, setShowPriceBreakup] = useState(false);
    const [showAccessorySheet, setShowAccessorySheet] = useState(false);

    // Destructure data from parent
    const {
        colors,
        selectedColor,
        regType,
        selectedAccessories,
        selectedInsuranceAddons,
        emiTenure,
        selectedServices,
        selectedOffers,
        quantities,
        userDownPayment,
        isReferralActive,
        baseExShowroom,
        rtoEstimates,
        rtoBreakdown,
        baseInsurance,
        insuranceBreakdown,
        insuranceAddonsPrice,
        otherCharges,
        accessoriesPrice,
        servicesPrice,
        offersDiscount,
        colorDiscount,
        accessoriesDiscount,
        servicesDiscount,
        insuranceAddonsDiscount,
        totalOnRoad,
        totalSavings: computedTotalSavings,
        totalSurge: computedTotalSurge,
        downPayment,
        minDownPayment,
        maxDownPayment,
        emi,
        annualInterest,
        loanAmount,
        activeAccessories,
        activeServices,
        availableInsuranceAddons,
        warrantyItems,
    } = data;

    const {
        handleColorChange,
        handleShareQuote,
        handleSaveQuote,
        handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        setRegType,
        setEmiTenure,
        setUserDownPayment,
        setConfigTab,
    } = handlers;

    const REFERRAL_BONUS = 5000;
    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0];

    const shouldDevanagari = language === 'hi' || language === 'mr';
    const scriptText = (value?: string) => {
        if (!value) return '';
        return shouldDevanagari ? toDevanagariScript(value) : value;
    };
    const displayMake = scriptText(product?.make || makeParam);
    const displayModel = scriptText(product?.model || modelParam);
    const displayVariant = scriptText(variantParam);
    const totalSavingsBase =
        computedTotalSavings ??
        colorDiscount +
            (offersDiscount < 0 ? Math.abs(offersDiscount) : 0) +
            (accessoriesDiscount || 0) +
            (servicesDiscount || 0) +
            (insuranceAddonsDiscount || 0);
    const totalSavings = totalSavingsBase + (isReferralActive ? REFERRAL_BONUS : 0);
    const totalSurge = computedTotalSurge ?? 0;

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];
        return '/images/hero-bike.webp';
    };

    // Price Breakup Data
    const priceBreakupData = [
        { label: 'Showroom Price', value: baseExShowroom },
        { label: `Registration (${regType})`, value: rtoEstimates, breakdown: rtoBreakdown },
        { label: 'Required Insurance', value: baseInsurance, breakdown: insuranceBreakdown },
        { label: 'Extra Insurance', value: insuranceAddonsPrice },
        { label: 'Accessories', value: accessoriesPrice },
        { label: 'Services / AMC', value: servicesPrice },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges }] : []),
        ...(totalSurge > 0 ? [{ label: 'Surge Applied', value: totalSurge }] : []),
        { label: 'Savings Applied', value: totalSavings, isDeduction: true },
    ];

    const selectedAccessoryItems = activeAccessories.filter((acc: any) => selectedAccessories.includes(acc.id));
    const selectedServiceItems = (activeServices || []).filter((svc: any) => selectedServices.includes(svc.id));

    const cards = [
        {
            id: 'price',
            title: 'Price Summary',
            subtitle: 'On-road breakup',
            icon: Info,
            content: (
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <span>Ex-Showroom</span>
                        <span>₹{baseExShowroom?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <span>RTO & Reg.</span>
                        <span>₹{rtoEstimates?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <span>Insurance</span>
                        <span>₹{baseInsurance?.toLocaleString() || '0'}</span>
                    </div>
                    {(offersDiscount < 0 || colorDiscount < 0) && (
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-green-400">
                            <span>Dealer Discount</span>
                            <span>₹{(Math.abs(offersDiscount) + Math.abs(colorDiscount)).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-white/10 flex justify-between text-sm font-black uppercase italic tracking-tighter text-white">
                        <span>Total On-Road</span>
                        <span className="text-[#F4B000]">₹{totalOnRoad.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={() => setShowPriceBreakup(true)}
                        className="w-full mt-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300"
                    >
                        Full Details
                    </button>
                </div>
            ),
        },
        {
            id: 'ownership',
            title: 'Ownership Plan',
            subtitle: 'Finance',
            icon: Zap,
            content: (
                <div className="space-y-4">
                    <p className="text-xs text-zinc-400 font-medium">
                        Monthly commitment starting from ₹{emi?.toLocaleString()}. Adjust your downpayment for better
                        rates.
                    </p>
                    <button
                        onClick={() => setConfigTab?.('FINANCE')}
                        className="w-full py-4 bg-[#F4B000] text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2"
                    >
                        Modify EMI Plan
                        <ArrowRight size={16} />
                    </button>
                </div>
            ),
        },
        {
            id: 'personalization',
            title: 'Personalization',
            subtitle: `${selectedAccessoryItems.length} Items Selected`,
            icon: Package,
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {selectedAccessoryItems.slice(0, 3).map((acc: any) => (
                            <div
                                key={acc.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs"
                            >
                                <span className="font-bold uppercase italic">{acc.name || acc.displayName}</span>
                                <span className="text-zinc-400">₹{acc.price?.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setConfigTab?.('ACCESSORIES')}
                        className="w-full py-4 border-2 border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl"
                    >
                        View All Accessories
                    </button>
                </div>
            ),
        },
        {
            id: 'coverage',
            title: 'Coverage & Care',
            subtitle: `${selectedInsuranceAddons.length + selectedServiceItems.length} Protection Items`,
            icon: ShieldCheck,
            content: (
                <div className="space-y-4">
                    <button
                        onClick={() => setConfigTab?.('INSURANCE')}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl"
                    >
                        Manage Protection
                    </button>
                </div>
            ),
        },
        {
            id: 'legal',
            title: 'Legal & Registry',
            subtitle: 'RTO',
            icon: ClipboardList,
            content: (
                <div className="space-y-2">
                    <button
                        onClick={() => setConfigTab?.('REGISTRATION')}
                        className="w-full py-3 text-zinc-400 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Change Registration Type
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="bg-black min-h-screen text-white pb-32 font-sans">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black via-black/50 to-transparent">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveQuote}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95"
                    >
                        <Heart size={20} />
                    </button>
                    <button
                        onClick={handleShareQuote}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Image Section */}
            <div className="relative h-[50vh] w-full bg-zinc-900 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedColor}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={getProductImage()}
                            alt={product.model}
                            fill
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

                {/* Product Title */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-black uppercase rounded">
                            {displayMake}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase leading-tight">{displayModel}</h1>
                    <p className="text-sm text-zinc-400 uppercase tracking-wider mt-1">{displayVariant}</p>

                    {/* Color Selector */}
                    <div className="flex gap-2 mt-3">
                        {colors.map((color: any) => (
                            <button
                                key={color.id}
                                onClick={() => handleColorChange(color.id)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color.id === selectedColor ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                                style={{ backgroundColor: color.hex }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content - Swipeable Cards */}
            <div className="pt-6 pb-2">
                <div className="px-5 mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Swipe left/right to explore sections
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 pb-6 snap-x snap-mandatory no-scrollbar">
                    {cards.map(card => (
                        <div key={card.id} className="snap-center shrink-0 w-[90vw] max-w-[520px] min-h-[70vh]">
                            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                                <div className="w-full flex items-center justify-between">
                                    <SectionHeader icon={card.icon} title={card.title} subtitle={card.subtitle} />
                                </div>
                                <div className="space-y-4">{card.content}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky Footer - Price Summary */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50">
                {/* Expandable Price Breakup */}
                <AnimatePresence>
                    {showPriceBreakup && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-white/10"
                        >
                            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-black uppercase">Price Breakup</h3>
                                    <button onClick={() => setShowPriceBreakup(false)}>
                                        <X size={16} />
                                    </button>
                                </div>
                                {priceBreakupData.map((item: any, idx) => (
                                    <React.Fragment key={idx}>
                                        <div
                                            className={`flex justify-between text-xs py-2 border-b border-white/5 ${item.isDeduction ? 'text-green-400' : ''}`}
                                        >
                                            <span className="text-zinc-400">{item.label}</span>
                                            <span className="font-bold">
                                                {item.isDeduction ? '-' : ''}₹{item.value.toLocaleString()}
                                            </span>
                                        </div>
                                        {/* Nested Breakdown for Mobile */}
                                        {item.breakdown && item.breakdown.length > 0 && (
                                            <div className="pl-4 pr-2 pb-2 space-y-1 bg-white/5 rounded-b-lg mb-2">
                                                {item.breakdown.map((b: any, bIdx: number) => (
                                                    <div
                                                        key={bIdx}
                                                        className="flex justify-between text-[10px] text-zinc-500"
                                                    >
                                                        <span>{b.label}</span>
                                                        <span className="font-mono">₹{b.amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-4 space-y-3">
                    {/* Price Summary Row */}
                    <div
                        onClick={() => setShowPriceBreakup(!showPriceBreakup)}
                        className="flex justify-between items-center cursor-pointer"
                    >
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-wider">On-Road Price</p>
                            <p className="text-2xl font-black">₹{totalOnRoad.toLocaleString()}</p>
                            {totalSavings > 0 && (
                                <p className="text-xs text-green-400">Saving ₹{totalSavings.toLocaleString()}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>Breakup</span>
                            <ChevronDown
                                size={14}
                                className={`transition-transform ${showPriceBreakup ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                        <button className="flex-1 h-12 bg-zinc-800 rounded-xl font-bold uppercase text-xs tracking-widest border border-white/10 active:scale-95">
                            Test Ride
                        </button>
                        <button
                            onClick={handleBookingRequest}
                            className="flex-[2] h-12 bg-white rounded-xl font-black text-black text-sm uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                        >
                            Get Quote <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
