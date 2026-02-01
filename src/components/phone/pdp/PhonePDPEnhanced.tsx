/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Share2, Heart, Zap, ShieldCheck, ChevronDown, ChevronRight,
    Star, Package, ClipboardList, Wrench, Gift, Info, CheckCircle2, X
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

const SpecRow = ({ label, value }: { label: string, value: string }) => (
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
    initialLocation
}: PhonePDPEnhancedProps) => {
    const router = useRouter();
    const { language } = useI18n();
    const [activeSection, setActiveSection] = useState<string>('finance');
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
        totalOnRoad,
        totalSavings: computedTotalSavings,
        downPayment,
        minDownPayment,
        maxDownPayment,
        emi,
        annualInterest,
        loanAmount,
        activeAccessories,
        activeServices,
        availableInsuranceAddons,
        warrantyItems
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
    const totalSavings = computedTotalSavings ?? (offersDiscount + colorDiscount + (isReferralActive ? REFERRAL_BONUS : 0));

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];
        return '/images/hero-bike.png';
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
        { label: 'Savings Applied', value: totalSavings, isDeduction: true },
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
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-black uppercase rounded">{displayMake}</span>
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

            {/* Main Content */}
            <div className="px-5 py-6 space-y-6">
                {/* 1. FINANCE SECTION */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                    <SectionHeader icon={Zap} title="Finance" subtitle="Flexible EMI Options" />

                    <div className="space-y-4">
                        {/* EMI Display */}
                        <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Monthly EMI</p>
                            <p className="text-4xl font-black text-white">₹{emi.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 mt-1">{emiTenure} months @ {annualInterest}% p.a.</p>
                        </div>

                        {/* Down Payment Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-zinc-400">Down Payment</span>
                                <span className="font-bold">₹{downPayment.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min={minDownPayment}
                                max={maxDownPayment}
                                value={downPayment}
                                onChange={(e) => setUserDownPayment(parseInt(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #F4B000 0%, #F4B000 ${((downPayment - minDownPayment) / (maxDownPayment - minDownPayment)) * 100}%, #27272a ${((downPayment - minDownPayment) / (maxDownPayment - minDownPayment)) * 100}%, #27272a 100%)`
                                }}
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                <span>Min: ₹{minDownPayment.toLocaleString()}</span>
                                <span>Max: ₹{maxDownPayment.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Tenure Selection */}
                        <div>
                            <p className="text-xs text-zinc-400 mb-2">Loan Tenure</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[12, 24, 36, 48].map((months) => (
                                    <button
                                        key={months}
                                        onClick={() => setEmiTenure(months)}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${emiTenure === months
                                            ? 'bg-white text-black'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {months}M
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. REGISTRATION SECTION */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                    <SectionHeader icon={ClipboardList} title="Registration" subtitle="Choose Type" />

                    <div className="space-y-2">
                        {[
                            { type: 'STATE', label: 'State RTO', desc: 'Standard registration' },
                            { type: 'BH', label: 'BH Series', desc: 'Bharat series (All India)' },
                            { type: 'COMPANY', label: 'Company', desc: 'Corporate registration' }
                        ].map((option) => (
                            <button
                                key={option.type}
                                onClick={() => setRegType(option.type as any)}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${regType === option.type
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold">{option.label}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">{option.desc}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === option.type ? 'border-white bg-white' : 'border-zinc-600'}`}>
                                        {regType === option.type && <CheckCircle2 size={12} className="text-black" />}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. ACCESSORIES SECTION */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <SectionHeader icon={Package} title="Accessories" subtitle={`${selectedAccessories.length} selected`} />
                        <button
                            onClick={() => setShowAccessorySheet(true)}
                            className="text-xs font-bold text-white/60 hover:text-white"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-2">
                        {activeAccessories.slice(0, 3).map((acc: any) => (
                            <div
                                key={acc.id}
                                onClick={() => toggleAccessory(acc.id)}
                                className={`p-3 rounded-lg border transition-all ${selectedAccessories.includes(acc.id)
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold">{acc.displayName || acc.name}</p>
                                        <p className="text-xs text-zinc-400">₹{acc.price.toLocaleString()}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedAccessories.includes(acc.id) ? 'border-white bg-white' : 'border-zinc-600'}`}>
                                        {selectedAccessories.includes(acc.id) && <CheckCircle2 size={12} className="text-black" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. INSURANCE SECTION */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                    <SectionHeader icon={ShieldCheck} title="Insurance" subtitle="Add-ons \u0026 Covers" />

                    <div className="space-y-2">
                        {availableInsuranceAddons?.map((addon: any) => (
                            <div
                                key={addon.id}
                                onClick={() => toggleInsuranceAddon(addon.id)}
                                className={`p-3 rounded-lg border transition-all ${selectedInsuranceAddons.includes(addon.id)
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold">{addon.displayName || addon.name}</p>
                                        <p className="text-xs text-zinc-400">₹{addon.price.toLocaleString()}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedInsuranceAddons.includes(addon.id) ? 'border-white bg-white' : 'border-zinc-600'}`}>
                                        {selectedInsuranceAddons.includes(addon.id) && <CheckCircle2 size={12} className="text-black" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. SERVICES SECTION */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                    <SectionHeader icon={Wrench} title="Services" subtitle="AMC \u0026 Packages" />

                    <div className="space-y-2">
                        {activeServices?.map((service: any) => (
                            <div
                                key={service.id}
                                onClick={() => toggleService(service.id)}
                                className={`p-3 rounded-lg border transition-all ${selectedServices.includes(service.id)
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold">{service.displayName || service.name}</p>
                                        <p className="text-xs text-zinc-400">₹{service.price.toLocaleString()}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedServices.includes(service.id) ? 'border-white bg-white' : 'border-zinc-600'}`}>
                                        {selectedServices.includes(service.id) && <CheckCircle2 size={12} className="text-black" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. WARRANTY SECTION */}
                {warrantyItems?.length > 0 && (
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                        <SectionHeader icon={Gift} title="Warranty" subtitle="Extended Protection" />

                        <div className="space-y-2">
                            {warrantyItems.map((warranty: any) => (
                                <div key={warranty.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <p className="text-sm font-bold">{warranty.name}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{warranty.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                    <div key={idx} className={`flex justify-between text-xs py-2 border-b border-white/5 ${item.isDeduction ? 'text-green-400' : ''}`}>
                                        <span className="text-zinc-400">{item.label}</span>
                                        <span className="font-bold">{item.isDeduction ? '-' : ''}₹{item.value.toLocaleString()}</span>
                                    </div>
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
                            <ChevronDown size={14} className={`transition-transform ${showPriceBreakup ? 'rotate-180' : ''}`} />
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
