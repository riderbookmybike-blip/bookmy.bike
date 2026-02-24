/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, Share2, Heart, MapPin } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';
import { computeOClubPricing } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import { computeFinanceMetrics } from '../Personalize/pdpComputations';

// Shared responsive section components
import {
    PdpPricingSection,
    PdpFinanceSection,
    PdpFinanceSummarySection,
    PdpConfigSection,
    PdpSpecsSection,
    PdpCommandBar,
    ParitySnapshot,
} from '../sections';

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
// Main MobilePDP Component — Shared Sections Architecture
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
    showOClubPrompt = false,
    isGated = false,
    serviceability,
}: MobilePDPProps) => {
    const { language } = useI18n();
    const shouldDevanagari = language === 'hi' || language === 'mr';
    const scriptText = (value?: string) => (shouldDevanagari ? toDevanagariScript(value || '') : value || '');

    const { colors = [], selectedColor, totalOnRoad = 0, emi = 0, emiTenure = 0, isReferralActive } = data;

    const {
        handleColorChange,
        handleShareQuote,
        handleSaveQuote,
        handleBookingRequest,
        setEmiTenure,
        setUserDownPayment,
        setRegType,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        toggleOffer,
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

    // Shared finance computation
    const financeMetrics = computeFinanceMetrics({
        scheme: data.initialFinance?.scheme,
        displayOnRoad,
        userDownPayment: data.userDownPayment || 0,
        loanAmount: data.loanAmount,
        totalOnRoad,
        emiTenure,
    });
    const footerEmi = financeMetrics.monthlyEmi;

    // Compute total savings for command bar
    const REFERRAL_BONUS = 5000;
    const totalSavingsBase =
        data.totalSavings ??
        (data.colorDiscount || 0) +
            (data.offersDiscount < 0 ? Math.abs(data.offersDiscount) : 0) +
            (data.accessoriesDiscount || 0) +
            (data.servicesDiscount || 0) +
            (data.insuranceAddonsDiscount || 0);
    const totalSavings = totalSavingsBase + (isReferralActive ? REFERRAL_BONUS : 0);
    // Single-open card state (string-based so adding future cards is trivial)
    // null = all closed, string = that card is open
    const [openContentCard, setOpenContentCard] = useState<string | null>('pricing');
    const toggleCard = (id: string) => setOpenContentCard(prev => (prev === id ? null : id));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 font-sans selection:bg-[#F4B000]/30 selection:text-black">
            {/* Parity Snapshot — hidden DOM element for Playwright parity tests */}
            <ParitySnapshot data={data} product={product} />

            {/* 1. Mobile Header (Transparent, floats over image) */}
            <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-white/95 to-transparent pointer-events-none">
                <button
                    onClick={() => window.history.back()}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700 pointer-events-auto"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 flex justify-center pointer-events-auto">
                    <Logo mode="light" variant="icon" size={24} />
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={handleSaveQuote}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700"
                    >
                        <Heart size={18} />
                    </button>
                    <button
                        onClick={handleShareQuote}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* 2. Edge-to-Edge Hero Image */}
            <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-100 to-white pt-12 flex items-center justify-center overflow-hidden">
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
                        style={{
                            transform:
                                [
                                    activeColorConfig?.isFlipped ? 'scaleX(-1)' : '',
                                    activeColorConfig?.zoomFactor ? `scale(${activeColorConfig.zoomFactor})` : '',
                                    activeColorConfig?.offsetX ? `translateX(${activeColorConfig.offsetX}px)` : '',
                                    activeColorConfig?.offsetY ? `translateY(${activeColorConfig.offsetY}px)` : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ') || undefined,
                        }}
                    />
                </motion.div>

                {/* Location Overlay Pill */}
                {initialLocation && (
                    <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 mt-auto">
                        <MapPin size={10} className="text-[#F4B000]" />
                        <span className="text-[9px] font-black tracking-widest uppercase text-slate-900">
                            {initialLocation.district || initialLocation.pincode}
                        </span>
                    </div>
                )}
            </div>

            {/* 3. Title Block */}
            <div className="px-5 py-6">
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1">{displayMake}</p>
                <h1 className="text-3xl font-black italic tracking-tight text-slate-900 leading-none mb-1">
                    {displayModel}
                </h1>
                <p className="text-[12px] font-bold text-[#F4B000] uppercase tracking-wider mb-2">{displayVariant}</p>
            </div>

            {/* 4. Color Selection */}
            {colors && colors.length > 0 && (
                <div className="px-5 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-3 text-center">
                        {displayColor}
                    </p>
                    <div className="flex justify-center flex-wrap gap-4 py-3 px-2">
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
                                        className="absolute inset-[3px] rounded-full border border-black/10 overflow-hidden"
                                        style={{ backgroundColor: c.hexCode || c.hex || '#ffffff' }}
                                    >
                                        {/* Shimmer gloss effect — same as DesktopPDP */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-white/10 to-transparent" />
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-white/10" />
                                        <div className="absolute inset-[-2px] rounded-full bg-[conic-gradient(from_0deg,transparent_60%,rgba(255,255,255,0.3)_80%,transparent_100%)] animate-[spin_3s_linear_infinite] opacity-40" />
                                    </div>
                                    {isColorSelected && (
                                        <div className="absolute inset-0 rounded-full border border-slate-200" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5-9: Shared Content Cards (desktop order: pricing → finance → summary → config-cards → specs) */}
            <div className="px-5 space-y-4">
                {/* 5. Pricing Card — default open */}
                <PdpPricingSection
                    layout="mobile"
                    product={product}
                    data={data}
                    variantParam={variantParam}
                    activeColorConfig={activeColorConfig}
                    productImage={getProductImage()}
                    walletCoins={walletCoins}
                    showOClubPrompt={showOClubPrompt}
                    isGated={isGated}
                    leadName={leadContext?.name}
                    serviceability={serviceability}
                    isOpen={openContentCard === 'pricing'}
                    onToggle={() => toggleCard('pricing')}
                />

                {/* 6. Finance Card */}
                <PdpFinanceSection
                    layout="mobile"
                    data={data}
                    handlers={{ setEmiTenure, setUserDownPayment }}
                    displayOnRoad={displayOnRoad}
                    footerEmi={footerEmi}
                    isOpen={openContentCard === 'finance'}
                    onToggle={() => toggleCard('finance')}
                />

                {/* 7. Finance Summary Card */}
                <PdpFinanceSummarySection
                    layout="mobile"
                    data={data}
                    displayOnRoad={displayOnRoad}
                    totalOnRoad={totalOnRoad}
                    totalSavings={totalSavings}
                    coinPricing={coinPricing}
                    footerEmi={footerEmi}
                    isOpen={openContentCard === 'finance-summary'}
                    onToggle={() => toggleCard('finance-summary')}
                />

                {/* 8. Config Cards — all 5 categories as independent cards */}
                <PdpConfigSection
                    layout="mobile"
                    data={data}
                    handlers={{
                        toggleAccessory,
                        toggleInsuranceAddon,
                        toggleService,
                        toggleOffer,
                        updateQuantity,
                        setRegType,
                    }}
                    mobileOpenCardId={openContentCard}
                    onMobileCardToggle={(id: string) => toggleCard(id)}
                />

                {/* 9. Tech Specs Categories (same category card count as desktop) */}
                <PdpSpecsSection layout="mobile" product={product} data={data} />
            </div>

            {/* 10. Unified Command Bar — with guard behaviors (G4) */}
            <PdpCommandBar
                layout="mobile"
                getProductImage={getProductImage}
                displayModel={displayModel}
                displayVariant={displayVariant}
                displayColor={displayColor}
                activeColorConfig={activeColorConfig || { hex: '#000' }}
                displayOnRoad={displayOnRoad}
                totalOnRoad={totalOnRoad}
                totalSavings={totalSavings}
                coinPricing={coinPricing}
                showOClubPrompt={showOClubPrompt}
                footerEmi={footerEmi}
                emiTenure={emiTenure}
                handleShareQuote={handleShareQuote}
                handleSaveQuote={handleSaveQuote}
                handleBookingRequest={handleBookingRequest}
                serviceability={serviceability}
                isGated={isGated}
            />
        </div>
    );
};
