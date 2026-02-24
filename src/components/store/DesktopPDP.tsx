/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import '@/styles/slider-enhanced.css';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import {
    ShieldCheck,
    Zap,
    ShieldCheck as ShieldIcon,
    CheckCircle2,
    Package,
    ClipboardList,
    Wrench,
    Gift,
    ChevronRight,
    ChevronDown,
    Plus,
    HelpCircle,
    Info,
    Youtube,
    Download,
    Share2,
    Heart,
    ArrowRight,
    Shield,
    Wallet,
    Banknote,
    Camera,
    SlidersHorizontal,
    Edit2,
} from 'lucide-react';
import DynamicHeader from './Personalize/DynamicHeader';
import { formatDisplayIdForUI } from '@/lib/displayId';
import { formatInterestRate } from '@/utils/formatVehicleSpec';
import VisualsRow from './Personalize/VisualsRow';
import TabNavigation from './Personalize/Tabs/TabNavigation';
import AccessoriesTab from './Personalize/Tabs/AccessoriesTab';
import SidebarHUD from './Personalize/SidebarHUD';
import CascadingAccessorySelector from './Personalize/CascadingAccessorySelector';
import { ServiceOption } from '@/types/store';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';
import { computeOClubPricing, coinsNeededForPrice } from '@/lib/oclub/coin';

// Lazy load tab components for code splitting
const FinanceTab = dynamic(() => import('./Personalize/Tabs/FinanceTab'), {
    loading: () => (
        <div className="space-y-6 animate-pulse">
            <div className="h-20 bg-slate-100 rounded-3xl" />
            <div className="h-40 bg-slate-100 rounded-3xl" />
            <div className="h-32 bg-slate-100 rounded-3xl" />
        </div>
    ),
});

const InsuranceTab = dynamic(() => import('./Personalize/Tabs/InsuranceTab'), {
    loading: () => <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />,
});

const RegistrationTab = dynamic(() => import('./Personalize/Tabs/RegistrationTab'), {
    loading: () => <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />,
});

const ServicesTab = dynamic(() => import('./Personalize/Tabs/ServicesTab'), {
    loading: () => <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />,
});

const WarrantyTab = dynamic(() => import('./Personalize/Tabs/WarrantyTab'), {
    loading: () => <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />,
});

import PricingCard from './Personalize/Cards/PricingCard';
import FinanceCard from './Personalize/Cards/FinanceCard';
import TechSpecsSection from './Personalize/TechSpecsSection';
import { ParitySnapshot } from './sections/ParitySnapshot';

interface DesktopPDPProps {
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
        setConfigTab: (
            tab:
                | 'PRICE_BREAKUP'
                | 'FINANCE'
                | 'ACCESSORIES'
                | 'INSURANCE'
                | 'REGISTRATION'
                | 'SERVICES'
                | 'OFFERS'
                | 'WARRANTY'
                | 'TECH_SPECS'
        ) => void;
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

// FullLayoutDebugger extracted to ./Personalize/FullLayoutDebugger.tsx
// import FullLayoutDebugger from './Personalize/FullLayoutDebugger';
import ConfigItemRow from './Personalize/ConfigItemRow';
import AccordionAccessories from './Personalize/Accordion/AccordionAccessories';
import AccordionInsurance from './Personalize/Accordion/AccordionInsurance';
import AccordionRegistration from './Personalize/Accordion/AccordionRegistration';
import FlatItemList from './Personalize/Accordion/FlatItemList';
import FloatingCommandBar from './Personalize/FloatingCommandBar';
import FinanceSummaryPanel from './Personalize/FinanceSummaryPanel';
import DownPaymentSlider from './Personalize/DownPaymentSlider';
import {
    computeFinanceMetrics,
    resolveProductImage,
    buildSavingsHelpLines,
    buildSurgeHelpLines,
} from './Personalize/pdpComputations';

export function DesktopPDP({
    product,
    makeParam,
    modelParam,
    variantParam,
    data,
    handlers,
    leadContext,
    basePath = '/store',
    initialLocation,
    bestOffer,
    walletCoins = null,
    showOClubPrompt = false,
    isGated = false,
    forceMobileLayout = false,
    serviceability,
}: DesktopPDPProps) {
    const params = useSearchParams();
    const { language } = useI18n();
    // Configuration Constants
    const REFERRAL_BONUS = 5000; // Member referral discount amount

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
        insuranceOD,
        insuranceTP,
        insuranceGstRate,
        insuranceAddonsPrice,
        otherCharges,
        accessoriesPrice,
        servicesPrice,
        offersDiscount,
        colorDiscount,
        colorSurge,
        accessoriesDiscount,
        accessoriesSurge,
        servicesDiscount,
        servicesSurge,
        insuranceAddonsDiscount,
        insuranceAddonsSurge,
        totalSurge: computedTotalSurge,
        totalOnRoad,
        totalSavings: computedTotalSavings,
        downPayment,
        minDownPayment,
        maxDownPayment,
        emi,
        annualInterest,
        interestType,
        loanAmount,
        financeCharges,
        activeAccessories,
        activeServices,
        availableInsuranceAddons,
        insuranceRequiredItems,
        warrantyItems,
        initialFinance,
    } = data;

    const walletCoinsValue = Number(walletCoins);
    const coinPricing =
        Number.isFinite(walletCoinsValue) && walletCoinsValue > 0
            ? computeOClubPricing(totalOnRoad, walletCoinsValue)
            : null;
    const displayOnRoad = coinPricing?.effectivePrice ?? totalOnRoad;
    const bCoinEquivalent = coinsNeededForPrice(displayOnRoad);

    // Compute EMI using shared finance computation (Phase 7)
    const financeMetrics = computeFinanceMetrics({
        scheme: initialFinance?.scheme,
        displayOnRoad,
        userDownPayment: userDownPayment || 0,
        loanAmount,
        totalOnRoad,
        emiTenure,
    });
    const footerEmi = financeMetrics.monthlyEmi;

    const {
        handleColorChange,
        handleShareQuote,
        handleSaveQuote,
        handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        toggleOffer,
        updateQuantity,
        setRegType,
        setEmiTenure,
        setUserDownPayment,
    } = handlers;

    // Smooth DP slider animation (click = slow animate, drag = instant)
    const dpAnimRef = useRef<number | null>(null);
    const dpClickRef = useRef({ preVal: 0, time: 0, x: 0, targetVal: 0 });
    const animateDP = useCallback(
        (fromVal: number, targetVal: number) => {
            if (dpAnimRef.current) cancelAnimationFrame(dpAnimRef.current);
            const diff = targetVal - fromVal;
            if (diff === 0) return;
            const fullRange = maxDownPayment - minDownPayment;
            const duration = fullRange > 0 ? (Math.abs(diff) / fullRange) * 10000 : 500; // 0→max = 10s
            const startTime = performance.now();
            const step = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / Math.max(duration, 1), 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round((fromVal + diff * eased) / 500) * 500;
                if (setUserDownPayment) setUserDownPayment(current);
                if (progress < 1) {
                    dpAnimRef.current = requestAnimationFrame(step);
                } else {
                    if (setUserDownPayment) setUserDownPayment(targetVal);
                    dpAnimRef.current = null;
                }
            };
            dpAnimRef.current = requestAnimationFrame(step);
        },
        [maxDownPayment, minDownPayment, setUserDownPayment]
    );

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0];
    const activeColorAssets = activeColorConfig?.assets || [];

    const shouldDevanagari = language === 'hi' || language === 'mr';
    const scriptText = (value?: string) => {
        if (!value) return '';
        return shouldDevanagari ? toDevanagariScript(value) : value;
    };
    const displayMake = scriptText(makeParam);
    const displayModel = scriptText(modelParam);
    const displayVariant = scriptText(variantParam);
    const displayColor = scriptText(activeColorConfig?.name);

    const totalMRP =
        (product.mrp || Math.round(baseExShowroom * 1.06)) + // 6% markup if no MRP set
        rtoEstimates +
        baseInsurance +
        accessoriesPrice +
        servicesPrice +
        otherCharges;

    const totalSavingsBase =
        computedTotalSavings ??
        colorDiscount +
            (offersDiscount < 0 ? Math.abs(offersDiscount) : 0) +
            accessoriesDiscount +
            servicesDiscount +
            insuranceAddonsDiscount;
    const totalSavings = totalSavingsBase + (isReferralActive ? REFERRAL_BONUS : 0);
    const totalSurge = computedTotalSurge ?? 0;
    const savingsHelpLines = [
        colorDiscount > 0 ? `Vehicle Offer: ₹${colorDiscount.toLocaleString('en-IN')}` : null,
        offersDiscount < 0 ? `Offers/Plans: ₹${Math.abs(offersDiscount).toLocaleString('en-IN')}` : null,
        accessoriesDiscount > 0 ? `Accessories: ₹${accessoriesDiscount.toLocaleString('en-IN')}` : null,
        servicesDiscount > 0 ? `Services: ₹${servicesDiscount.toLocaleString('en-IN')}` : null,
        insuranceAddonsDiscount > 0 ? `Insurance Add-ons: ₹${insuranceAddonsDiscount.toLocaleString('en-IN')}` : null,
        isReferralActive ? `Member Invite: ₹${REFERRAL_BONUS.toLocaleString('en-IN')}` : null,
        `Total: ₹${totalSavings.toLocaleString('en-IN')}`,
    ].filter(Boolean) as string[];

    const surgeHelpLines = [
        colorSurge > 0 ? `Dealer Surge: ₹${colorSurge.toLocaleString('en-IN')}` : null,
        offersDiscount > 0 ? `Offers/Plans: ₹${offersDiscount.toLocaleString('en-IN')}` : null,
        accessoriesSurge > 0 ? `Accessories: ₹${accessoriesSurge.toLocaleString('en-IN')}` : null,
        servicesSurge > 0 ? `Services: ₹${servicesSurge.toLocaleString('en-IN')}` : null,
        insuranceAddonsSurge > 0 ? `Insurance Add-ons: ₹${insuranceAddonsSurge.toLocaleString('en-IN')}` : null,
        totalSurge > 0 ? `Total: ₹${totalSurge.toLocaleString('en-IN')}` : null,
    ].filter(Boolean) as string[];

    const priceBreakupData = [
        { label: 'Ex-Showroom', value: baseExShowroom },
        {
            label: `Registration (${regType})`,
            value: rtoEstimates,
            breakdown: rtoBreakdown,
            comparisonOptions: data?.rtoOptions,
        },
        { label: 'Insurance', value: baseInsurance, breakdown: insuranceBreakdown },
        {
            label: 'Insurance Add-ons',
            value: Math.round((data.insuranceAddonsPrice || 0) + (data.insuranceAddonsDiscount || 0)),
        },
        {
            label: 'Mandatory Accessories',
            value: accessoriesPrice,
            breakdown: activeAccessories
                .filter((a: any) => a.isMandatory)
                .map((a: any) => ({ label: a.displayName || a.name, amount: a.discountPrice || a.price })),
        },
        {
            label: 'Optional Accessories',
            value: (data.accessoriesPrice || 0) + (data.accessoriesDiscount || 0) - accessoriesPrice,
        },
        { label: 'Services', value: (data.servicesPrice || 0) + (data.servicesDiscount || 0) },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges }] : []),
        { label: 'Delivery TAT', value: '7 DAYS', isInfo: true },
        ...(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)
            ? [
                  {
                      label: "O' Circle Privileged",
                      value: totalSavings + (coinPricing?.discount || 0),
                      isDeduction: true,
                      helpText: [
                          ...savingsHelpLines.slice(0, -1),
                          ...(coinPricing
                              ? [
                                    `Coins: ₹${coinPricing.discount.toLocaleString('en-IN')} (${coinPricing.coinsUsed} coins)`,
                                ]
                              : []),
                          `Total: ₹${(totalSavings + (coinPricing?.discount || 0)).toLocaleString('en-IN')}`,
                      ],
                  },
              ]
            : []),
        ...(totalSurge > 0 ? [{ label: 'Surge Charges', value: totalSurge, helpText: surgeHelpLines }] : []),
    ];

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        if (activeColorConfig?.image_url) return activeColorConfig.image_url;
        if (activeColorConfig?.imageUrl) return activeColorConfig.imageUrl;
        if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];

        switch (product.bodyType) {
            case 'SCOOTER':
                return '/images/categories/scooter_nobg.webp';
            case 'MOTORCYCLE':
                return '/images/categories/motorcycle_nobg.webp';
            case 'MOPED':
                return '/images/categories/moped_nobg.webp';
            default:
                return '/images/hero-bike.webp';
        }
    };

    // ConfigItemRow extracted to ./Personalize/ConfigItemRow.tsx (imported at top)

    const renderCategoryContent = (categoryId: string) => {
        switch (categoryId) {
            case 'ACCESSORIES':
                return (
                    <AccordionAccessories
                        activeAccessories={activeAccessories}
                        selectedAccessories={selectedAccessories}
                        quantities={quantities}
                        toggleAccessory={toggleAccessory}
                        updateQuantity={updateQuantity}
                    />
                );
            case 'INSURANCE':
                return (
                    <AccordionInsurance
                        insuranceRequiredItems={insuranceRequiredItems}
                        availableInsuranceAddons={availableInsuranceAddons}
                        selectedInsuranceAddons={selectedInsuranceAddons}
                        toggleInsuranceAddon={toggleInsuranceAddon}
                        baseInsurance={baseInsurance}
                        insuranceTP={insuranceTP}
                        insuranceOD={insuranceOD}
                        insuranceGstRate={insuranceGstRate}
                    />
                );
            case 'REGISTRATION':
                return <AccordionRegistration regType={regType} setRegType={setRegType} data={data} />;
            case 'SERVICES':
                return (
                    <FlatItemList
                        items={activeServices}
                        getSelected={id => selectedServices.includes(id)}
                        onToggle={id => toggleService(id)}
                    />
                );
            case 'WARRANTY':
                return <FlatItemList items={warrantyItems} getSelected={() => true} onToggle={() => {}} isMandatory />;
            default:
                return null;
        }
    };

    // Video Modal State
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [mobileConfigOpen, setMobileConfigOpen] = useState<string | null>('ACCESSORIES');
    const [activeConfigTab, setActiveConfigTab] = useState<string | null>('ACCESSORIES');
    const [heroActiveTab, setHeroActiveTab] = useState<string>('GALLERY');

    const configCards = [
        {
            id: 'ACCESSORIES',
            label: 'Accessories',
            subtext: selectedAccessories.length > 0 ? `${selectedAccessories.length} Selected` : 'Add Extras',
            icon: Package,
        },
        {
            id: 'INSURANCE',
            label: 'Insurance',
            subtext: selectedInsuranceAddons.length > 0 ? `${selectedInsuranceAddons.length} Addons` : 'Secure Rider',
            icon: ShieldCheck,
        },
        { id: 'REGISTRATION', label: 'Registration', subtext: regType || 'Choose Type', icon: ClipboardList },
        {
            id: 'SERVICES',
            label: 'Services',
            subtext: selectedServices.length > 0 ? `${selectedServices.length} Selected` : 'AMC & Plans',
            icon: Wrench,
        },
        { id: 'WARRANTY', label: 'Warranty', subtext: 'Protect Ride', icon: Gift },
    ];

    const heroCards = [
        {
            id: 'GALLERY',
            label: 'Gallery',
            subtext: (() => {
                const c = displayColor || 'Vehicle Visuals';
                const finishes = ['Pearl', 'Matte', 'Metallic', 'Gloss'];
                const f = finishes.find(f => c.toLowerCase().startsWith(f.toLowerCase()));
                return f ? `${c.replace(new RegExp('^' + f + '\\s*', 'i'), '')} (${f})` : c;
            })(),
            icon: Camera,
        },
        { id: 'PRICING', label: 'Pricing', subtext: `₹${displayOnRoad.toLocaleString()}`, icon: Wallet },
        { id: 'FINANCE', label: 'Finance', subtext: '', icon: Banknote },
        { id: 'FINANCE_SUMMARY', label: 'Summary', subtext: `${emiTenure}mo Plan`, icon: SlidersHorizontal },
    ];

    // Cinematic Animation Variants
    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 },
        },
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
            },
        },
    };

    const configVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.5 + i * 0.1,
                duration: 0.5,
                ease: 'easeOut',
            },
        }),
    };

    return (
        <div className="relative min-h-screen bg-slate-50 transition-colors duration-500 font-sans pt-0 pb-20">
            {/* Parity Snapshot — hidden DOM element for Playwright parity tests */}
            <ParitySnapshot data={data} product={product} />
            {/* Always-mounted parity markers — these must exist regardless of active hero tab */}
            <div data-parity-section="pricing" style={{ display: 'none' }} aria-hidden="true" />
            <div data-parity-section="finance" style={{ display: 'none' }} aria-hidden="true" />
            <div data-parity-section="finance-summary" style={{ display: 'none' }} aria-hidden="true" />
            {/* Cinematic Mesh Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-40 transition-all duration-[2000ms] blur-[120px]"
                    style={{
                        background: `
                            radial-gradient(circle at 20% 20%, ${activeColorConfig.hex}44, transparent 40%),
                            radial-gradient(circle at 80% 80%, ${activeColorConfig.hex}33, transparent 40%),
                            radial-gradient(circle at 10% 90%, ${activeColorConfig.hex}22, transparent 40%),
                            radial-gradient(circle at 90% 10%, ${activeColorConfig.hex}11, transparent 40%)
                        `,
                    }}
                />
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -50, 50, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-primary/[0.03] rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        x: [0, -60, 60, 0],
                        y: [0, 60, -60, 0],
                        scale: [1.1, 0.8, 1.2, 1.1],
                    }}
                    transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-brand-primary/[0.02] rounded-full blur-[120px]"
                />
            </div>
            <div className="page-container pt-4 pb-28 md:pb-28 space-y-6 relative z-10">
                {/* 1. Hero Row: Image / Pricing / Finance — Horizontal Accordion (Desktop) */}
                <div
                    className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} flex-row gap-4 h-[720px] overflow-visible`}
                >
                    {heroCards.map((card, idx) => {
                        const Icon = card.icon;
                        const isActive = heroActiveTab === card.id;

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                custom={idx}
                                variants={configVariants}
                                initial="hidden"
                                animate="visible"
                                onClick={() => setHeroActiveTab(card.id)}
                                className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between shrink-0 lg:shrink
                                    ${
                                        isActive
                                            ? 'flex-[3] bg-white border-slate-200 shadow-2xl,0,0,0.5)]'
                                            : 'flex-[0.5] bg-white/40 backdrop-blur-xl border-white/60 hover:bg-white/60 shadow-lg shadow-black/[0.03]'
                                    }`}
                            >
                                {/* Header */}
                                <div
                                    className={`p-6 items-center gap-3 transition-colors duration-500 shrink-0 ${isActive ? 'bg-brand-primary/[0.03] border-b border-slate-100' : ''} ${isActive && card.id === 'GALLERY' ? 'grid grid-cols-[auto_1fr_auto]' : 'flex'}`}
                                >
                                    {/* Left: Icon + Label + Color Name */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                                            ${isActive ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-slate-200 text-slate-400'}`}
                                        >
                                            <Icon size={20} />
                                        </div>
                                        <div
                                            className={`flex flex-col transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                                                {card.label}
                                            </span>
                                            {card.id !== 'FINANCE' && card.id !== 'PRICING' && (
                                                <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                                                    {card.subtext}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Center: Color Swatches — Gallery only */}
                                    {isActive && card.id === 'GALLERY' && (
                                        <div
                                            className="flex items-center justify-center gap-3"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {colors.map(
                                                (color: { id: string; name: string; hex: string; class?: string }) => {
                                                    const isSel = selectedColor === color.id;
                                                    return (
                                                        <button
                                                            key={color.id}
                                                            onClick={() => handleColorChange(color.id)}
                                                            className="flex flex-col items-center group/swatch relative"
                                                            title={color.name}
                                                        >
                                                            <div
                                                                className={`w-7 h-7 rounded-full transition-all duration-300 border-2 ${isSel ? 'border-[#F4B000] scale-110 shadow-[0_0_8px_rgba(255,215,0,0.4)]' : 'border-transparent hover:scale-110'}`}
                                                            >
                                                                <div
                                                                    className="w-full h-full rounded-full border border-black/10 relative overflow-hidden"
                                                                    style={{ backgroundColor: color.hex }}
                                                                >
                                                                    {/* Shimmer gloss effect — enhanced */}
                                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-white/10 to-transparent" />
                                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-white/10" />
                                                                    <div className="absolute inset-[-2px] rounded-full bg-[conic-gradient(from_0deg,transparent_60%,rgba(255,255,255,0.3)_80%,transparent_100%)] animate-[spin_3s_linear_infinite] opacity-40" />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}

                                    {/* Right: YouTube + Favorite — Gallery only */}
                                    {isActive && card.id === 'GALLERY' && (
                                        <div
                                            className="flex items-center justify-end gap-2"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => setIsVideoOpen(true)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-500 transition-all hover:scale-110 shadow-lg"
                                                title="Watch Video"
                                            >
                                                <Youtube size={14} className="text-white" />
                                            </button>
                                            <button
                                                onClick={() => handleSaveQuote()}
                                                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all hover:scale-110 border border-black/10"
                                                title="Save to Favorites"
                                            >
                                                <Heart size={14} className="text-rose-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-hidden relative">
                                    <AnimatePresence mode="wait">
                                        {isActive ? (
                                            <motion.div
                                                key="content"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.4, delay: 0.2 }}
                                                className={`absolute inset-0 flex flex-col ${card.id === 'GALLERY' ? '' : ''}`}
                                            >
                                                {card.id === 'GALLERY' ? (
                                                    <VisualsRow
                                                        className="h-full"
                                                        colors={colors}
                                                        selectedColor={selectedColor}
                                                        onColorSelect={handleColorChange}
                                                        productImage={getProductImage()}
                                                        assets={activeColorAssets}
                                                        videoSource={activeColorConfig?.video || ''}
                                                        isVideoOpen={isVideoOpen}
                                                        onCloseVideo={() => setIsVideoOpen(false)}
                                                    />
                                                ) : (
                                                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col pl-[76px] pr-[76px] pt-2 pb-4">
                                                        {card.id === 'PRICING' && (
                                                            <div>
                                                                <PricingCard
                                                                    product={product}
                                                                    variantName={displayVariant}
                                                                    activeColor={{
                                                                        name: displayColor || activeColorConfig.name,
                                                                        hex: activeColorConfig.hex,
                                                                    }}
                                                                    totalOnRoad={displayOnRoad}
                                                                    totalSavings={totalSavings}
                                                                    originalPrice={totalOnRoad + totalSavings}
                                                                    coinPricing={coinPricing}
                                                                    showOClubPrompt={showOClubPrompt}
                                                                    priceBreakup={priceBreakupData}
                                                                    productImage={getProductImage()}
                                                                    pricingSource={
                                                                        [
                                                                            initialLocation?.district,
                                                                            bestOffer?.dealer?.business_name,
                                                                        ]
                                                                            .filter(Boolean)
                                                                            .join(' • ') || data.pricingSource
                                                                    }
                                                                    leadName={leadContext?.name}
                                                                    isGated={isGated}
                                                                />
                                                            </div>
                                                        )}
                                                        {card.id === 'FINANCE' && (
                                                            <div>
                                                                <FinanceCard
                                                                    emi={emi}
                                                                    emiTenure={emiTenure}
                                                                    setEmiTenure={setEmiTenure}
                                                                    downPayment={userDownPayment || 0}
                                                                    setUserDownPayment={setUserDownPayment}
                                                                    minDownPayment={minDownPayment}
                                                                    maxDownPayment={maxDownPayment}
                                                                    totalOnRoad={displayOnRoad}
                                                                    loanAmount={Math.max(
                                                                        0,
                                                                        displayOnRoad - (userDownPayment || 0)
                                                                    )}
                                                                    annualInterest={annualInterest}
                                                                    interestType={interestType}
                                                                    schemeId={initialFinance?.scheme?.id}
                                                                    financeCharges={financeCharges}
                                                                    bank={initialFinance?.bank}
                                                                    scheme={initialFinance?.scheme}
                                                                />
                                                            </div>
                                                        )}
                                                        {card.id === 'FINANCE_SUMMARY' && (
                                                            <FinanceSummaryPanel
                                                                initialFinance={initialFinance}
                                                                displayOnRoad={displayOnRoad}
                                                                userDownPayment={userDownPayment || 0}
                                                                loanAmount={loanAmount}
                                                                totalOnRoad={totalOnRoad}
                                                                totalSavings={totalSavings}
                                                                coinPricing={coinPricing}
                                                                emiTenure={emiTenure}
                                                                annualInterest={financeMetrics.annualInterest}
                                                                interestType={financeMetrics.interestType}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="vertical-label"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                            >
                                                <span className="text-[28px] font-extrabold uppercase tracking-[0.16em] text-slate-400/75 -rotate-90 whitespace-nowrap">
                                                    {card.label}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Section 3: Footer — Offer Price (PRICING only, shrink-0) */}
                                {isActive && card.id === 'PRICING' && (
                                    <div className="shrink-0 pl-[76px] pr-[76px] pt-3 pb-8 border-t border-slate-100 bg-brand-primary/[0.03] relative z-10">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-600">
                                                        On-Road Price
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const src =
                                                        [initialLocation?.district, bestOffer?.dealer?.business_name]
                                                            .filter(Boolean)
                                                            .join(' • ') || data.pricingSource;
                                                    return src ? (
                                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                                                            ({src})
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                                    <span className="text-xs font-bold text-slate-400 line-through decoration-red-500/50 decoration-2 mr-1">
                                                        On Road ₹{(totalOnRoad + totalSavings).toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="text-4xl font-black italic tracking-tighter text-brand-primary font-mono block drop-shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-in zoom-in-95 duration-700">
                                                    ₹{displayOnRoad.toLocaleString()}
                                                </span>
                                                <span className="mt-1 inline-flex items-center gap-1 text-lg font-black italic tracking-tight text-brand-primary font-mono tabular-nums leading-none">
                                                    <Logo variant="icon" size={12} />
                                                    {bCoinEquivalent.toLocaleString()}
                                                </span>
                                                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                                    <span className="mt-1 self-stretch text-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                        ⚡ You Save ₹
                                                        {(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}
                                                    </span>
                                                )}
                                                {!coinPricing && showOClubPrompt && (
                                                    <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                        Signup & get 13 O' Circle coins
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Section 3: Footer — EMI (FINANCE_SUMMARY only, shrink-0) */}
                                {isActive && card.id === 'FINANCE_SUMMARY' && (
                                    <div className="shrink-0 min-h-[118px] pl-[76px] pr-[76px] pt-4 pb-8 border-t border-slate-100 bg-white relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                                                    Monthly EMI
                                                </span>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-4xl font-black tracking-tight text-slate-900 font-mono tabular-nums leading-none">
                                                    ₹{footerEmi.toLocaleString()}
                                                </span>
                                                <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                    / {emiTenure}mo
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section 3: Footer — Down Payment (FINANCE only, shrink-0) */}
                                {isActive && card.id === 'FINANCE' && maxDownPayment > minDownPayment && (
                                    <DownPaymentSlider
                                        userDownPayment={userDownPayment || 0}
                                        minDownPayment={minDownPayment}
                                        maxDownPayment={maxDownPayment}
                                        displayOnRoad={displayOnRoad}
                                        setUserDownPayment={setUserDownPayment}
                                        animateDP={animateDP}
                                    />
                                )}

                                {/* Bottom Fade — skip for Gallery and Finance */}
                                {isActive &&
                                    card.id !== 'GALLERY' &&
                                    card.id !== 'FINANCE' &&
                                    card.id !== 'PRICING' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
                                    )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* 1b. Hero Row: Mobile (Vertical Stack) */}
                <div className={`${forceMobileLayout ? '' : 'md:hidden'} space-y-4`}>
                    <VisualsRow
                        colors={colors}
                        selectedColor={selectedColor}
                        onColorSelect={handleColorChange}
                        productImage={getProductImage()}
                        assets={activeColorAssets}
                        videoSource={activeColorConfig?.video || ''}
                        isVideoOpen={isVideoOpen}
                        onCloseVideo={() => setIsVideoOpen(false)}
                    />
                </div>

                {/* 3. Mobile Configuration Accordions */}
                <div className={`${forceMobileLayout ? '' : 'md:hidden'} space-y-4`}>
                    {configCards.map(category => {
                        const Icon = category.icon;
                        const isOpen = mobileConfigOpen === category.id;
                        return (
                            <div
                                key={category.id}
                                className="glass-panel bg-white/90 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setMobileConfigOpen(isOpen ? null : category.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-primary">
                                                {category.label}
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-500">{category.subtext}</p>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={18}
                                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5">
                                        <div className="border-t border-slate-200/60 pt-4 space-y-4">
                                            {renderCategoryContent(category.id)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 4. Modular 5-Pillar Configuration Grid (Horizontal Accordion Design) */}
                <div
                    data-parity-section="config"
                    className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} flex-row gap-4 h-[720px] overflow-visible`}
                >
                    {configCards.map((category, idx) => {
                        const Icon = category.icon;
                        const isActive = activeConfigTab === category.id;

                        return (
                            <motion.div
                                key={category.id}
                                layout
                                custom={idx}
                                variants={configVariants}
                                initial="hidden"
                                animate="visible"
                                onClick={() => setActiveConfigTab(category.id)}
                                className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between shrink-0 lg:shrink
                                    ${
                                        isActive
                                            ? 'flex-[3] bg-white border-slate-200 shadow-2xl,0,0,0.5)]'
                                            : 'flex-[0.5] bg-white/40 backdrop-blur-xl border-white/60 hover:bg-white/60 shadow-lg shadow-black/[0.03]'
                                    }`}
                            >
                                {/* Header / Category Label (Always visible) */}
                                <div
                                    className={`p-6 flex items-center gap-3 transition-colors duration-500 shrink-0 ${isActive ? 'bg-brand-primary/[0.03] border-b border-slate-100' : ''}`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                                        ${isActive ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-slate-200 text-slate-400'}`}
                                    >
                                        <Icon size={20} />
                                    </div>

                                    <div
                                        className={`flex flex-col transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-primary">
                                            {category.label}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                                            {category.subtext}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Area (Only visible when active) */}
                                <div className="flex-1 overflow-hidden relative">
                                    <AnimatePresence mode="wait">
                                        {isActive ? (
                                            <motion.div
                                                key="content"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.4, delay: 0.2 }}
                                                className="absolute inset-0 p-4 pt-2 flex flex-col"
                                            >
                                                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-4 p-2 pb-12">
                                                    {renderCategoryContent(category.id)}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="vertical-label"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                            >
                                                <span className="text-[28px] font-extrabold uppercase tracking-[0.16em] text-slate-400/75 -rotate-90 whitespace-nowrap">
                                                    {category.label}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Unified Bottom Fade (Active state) */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* 5. Technical Specifications Section */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                    <motion.div
                        data-parity-section="specs"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="relative">
                            <TechSpecsSection
                                specs={product.specs}
                                modelName={displayModel}
                                variantName={displayVariant}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Floating Bottom Command Bar (All Viewports) */}
            <div data-parity-section="command-bar">
                <FloatingCommandBar
                    getProductImage={getProductImage}
                    displayModel={displayModel}
                    displayVariant={displayVariant}
                    displayColor={displayColor}
                    activeColorConfig={activeColorConfig}
                    displayOnRoad={displayOnRoad}
                    totalOnRoad={totalOnRoad}
                    totalSavings={totalSavings}
                    coinPricing={coinPricing}
                    forceMobileLayout={forceMobileLayout}
                    handleShareQuote={handleShareQuote}
                    handleSaveQuote={handleSaveQuote}
                    handleBookingRequest={handleBookingRequest}
                    serviceability={serviceability}
                    isGated={isGated}
                />
            </div>
        </div>
    );
}
