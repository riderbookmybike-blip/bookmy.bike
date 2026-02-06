/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import '@/styles/slider-enhanced.css';
import Link from 'next/link';
import Image from 'next/image';
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
    Plus,
    HelpCircle,
    Info,
    Youtube,
    Download,
    Share2,
    Heart,
    ArrowRight,
} from 'lucide-react';
import DynamicHeader from './Personalize/DynamicHeader';
import { formatDisplayIdForUI } from '@/lib/displayId';
import VisualsRow from './Personalize/VisualsRow';
import TabNavigation from './Personalize/Tabs/TabNavigation';
import AccessoriesTab from './Personalize/Tabs/AccessoriesTab';
import SidebarHUD from './Personalize/SidebarHUD';
import CascadingAccessorySelector from './Personalize/CascadingAccessorySelector';
import { ServiceOption } from '@/types/store';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';

// Lazy load tab components for code splitting
const FinanceTab = dynamic(() => import('./Personalize/Tabs/FinanceTab'), {
    loading: () => (
        <div className="space-y-6 animate-pulse">
            <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-3xl" />
            <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-3xl" />
            <div className="h-32 bg-slate-100 dark:bg-white/5 rounded-3xl" />
        </div>
    ),
});

const InsuranceTab = dynamic(() => import('./Personalize/Tabs/InsuranceTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />,
});

const RegistrationTab = dynamic(() => import('./Personalize/Tabs/RegistrationTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />,
});

const ServicesTab = dynamic(() => import('./Personalize/Tabs/ServicesTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />,
});

const WarrantyTab = dynamic(() => import('./Personalize/Tabs/WarrantyTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />,
});

import PricingCard from './Personalize/Cards/PricingCard';
import FinanceCard from './Personalize/Cards/FinanceCard';

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
}

const FullLayoutDebugger = () => {
    const [data, setData] = useState<any>({});

    useEffect(() => {
        const measure = () => {
            // 1. Main Header
            const header = document.querySelector('header[class*="fixed"], nav[class*="fixed"], [class*="AppHeader"]');
            const headerRect = header?.getBoundingClientRect();

            // 2. Sticky Nav
            const sticky = document.querySelector('.sticky-debug-target');
            const stickyRect = sticky?.getBoundingClientRect();
            const stickyComputed = sticky ? window.getComputedStyle(sticky) : null;

            // 3. First Content Card (after sticky)
            const content = document.querySelector('.content-debug-target');
            const contentRect = content?.getBoundingClientRect();

            // CSS Variable
            const headerH = getComputedStyle(document.documentElement).getPropertyValue('--header-h');

            setData({
                scrollY: Math.round(window.scrollY),
                headerH,
                header: {
                    bottom: Math.round(headerRect?.bottom || 0),
                    height: Math.round(headerRect?.height || 0),
                },
                sticky: {
                    top: Math.round(stickyRect?.top || 0),
                    bottom: Math.round(stickyRect?.bottom || 0),
                    height: Math.round(stickyRect?.height || 0),
                    computedTop: stickyComputed?.top || 'N/A',
                    zIndex: stickyComputed?.zIndex || 'N/A',
                },
                content: {
                    top: Math.round(contentRect?.top || 0),
                },
                gaps: {
                    headerToSticky: Math.round((stickyRect?.top || 0) - (headerRect?.bottom || 0)),
                    stickyToContent: Math.round((contentRect?.top || 0) - (stickyRect?.bottom || 0)),
                },
            });
        };

        window.addEventListener('scroll', measure);
        const interval = setInterval(measure, 500);
        measure();
        return () => {
            window.removeEventListener('scroll', measure);
            clearInterval(interval);
        };
    }, []);

    const gapColor = (gap: number) => (gap < 0 ? 'text-red-400' : gap === 0 ? 'text-yellow-400' : 'text-green-400');

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/95 text-white p-4 rounded-xl font-mono text-[10px] border-2 border-cyan-500 shadow-2xl max-w-xs pointer-events-none">
            <h3 className="font-bold text-cyan-400 mb-2 border-b border-white/10 pb-1">🔬 FULL LAYOUT DEBUGGER</h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                <p className="text-slate-400">Scroll Y:</p>
                <p>{data.scrollY}px</p>
                <p className="text-slate-400">--header-h:</p>
                <p>{data.headerH}</p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
                <p className="text-orange-400 font-bold mb-1">MAIN HEADER</p>
                <p>
                    Bottom: {data.header?.bottom}px | Height: {data.header?.height}px
                </p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
                <p className="text-red-400 font-bold mb-1">STICKY NAV</p>
                <p>
                    Top: {data.sticky?.top}px | Bottom: {data.sticky?.bottom}px
                </p>
                <p>
                    Height: {data.sticky?.height}px | Z: {data.sticky?.zIndex}
                </p>
                <p>CSS Top: {data.sticky?.computedTop}</p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
                <p className="text-blue-400 font-bold mb-1">CONTENT</p>
                <p>Top: {data.content?.top}px</p>
            </div>

            <div className="border-t border-white/10 pt-2">
                <p className="font-bold text-white mb-1">GAPS</p>
                <p className={gapColor(data.gaps?.headerToSticky || 0)}>
                    Header → Sticky: {data.gaps?.headerToSticky}px
                </p>
                <p className={gapColor(data.gaps?.stickyToContent || 0)}>
                    Sticky → Content: {data.gaps?.stickyToContent}px
                </p>
            </div>
        </div>
    );
};

export function DesktopPDP({
    product,
    makeParam,
    modelParam,
    variantParam,
    data,
    handlers,
    leadContext,
    basePath = '/store',
}: DesktopPDPProps) {
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

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0];

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
        { label: 'Showroom Price', value: baseExShowroom },
        {
            label: `Registration (${regType})`,
            value: rtoEstimates,
            breakdown: rtoBreakdown,
            comparisonOptions: data?.rtoOptions,
        },
        { label: 'Required Insurance', value: baseInsurance, breakdown: insuranceBreakdown },
        { label: 'Extra Insurance', value: insuranceAddonsPrice },
        { label: 'Accessories', value: accessoriesPrice },
        { label: 'Services / AMC', value: servicesPrice },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges }] : []),
        { label: 'Delivery TAT', value: '7 DAYS', isInfo: true },
        ...(totalSurge > 0 ? [{ label: 'Surge Applied', value: totalSurge, helpText: surgeHelpLines }] : []),
        { label: 'Savings Applied', value: totalSavings, isDeduction: true, helpText: savingsHelpLines },
    ];

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
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

    const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false, isRadio = false, breakdown }: any) => {
        const quantity = isSelected ? quantities[item.id] || 1 : 0;
        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;

        return (
            <div className="group/item relative">
                <button
                    onClick={() => !isMandatory && onToggle && onToggle()}
                    disabled={isMandatory}
                    className={`w-full p-4 rounded-2xl border transition-all duration-500 flex items-center justify-between gap-3 group/btn
                        ${
                            isSelected
                                ? 'bg-brand-primary/10 border-brand-primary/40 shadow-[0_10px_30px_rgba(255,215,0,0.15)] dark:shadow-[0_10px_30px_rgba(255,215,0,0.1)]'
                                : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                        } ${isMandatory ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5'} transition-all`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0
                            ${
                                isSelected
                                    ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-110'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 group-hover/btn:border-slate-300 dark:group-hover/btn:border-white/20'
                            }`}
                        >
                            {isRadio ? (
                                <div
                                    className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-black' : 'bg-transparent'}`}
                                />
                            ) : isMandatory ? (
                                <CheckCircle2 size={16} strokeWidth={3} />
                            ) : isSelected ? (
                                <CheckCircle2 size={16} strokeWidth={3} />
                            ) : (
                                <Plus size={16} />
                            )}
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <span
                                className={`text-[11px] font-black uppercase tracking-tight truncate w-full ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {item.displayName || item.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span
                                    className={`text-[10px] font-bold ${isSelected ? 'text-brand-primary' : 'text-slate-600 dark:text-slate-500'}`}
                                >
                                    ₹{finalPrice.toLocaleString()}
                                </span>
                                {item.discountPrice > 0 && (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-600 line-through font-bold">
                                        ₹{item.price.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {(item.description || breakdown) && (
                        <div className="text-slate-600 hover:text-brand-primary transition-colors p-1 shrink-0">
                            <HelpCircle size={14} />
                        </div>
                    )}
                </button>

                {/* Dense Tooltip */}
                {(item.description || breakdown) && (
                    <div className="absolute right-0 top-full mt-3 z-50 w-64 max-w-[80vw] p-4 rounded-2xl bg-[#15191e] border border-white/10 shadow-2xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 pointer-events-none">
                        <div className="space-y-3">
                            <div className="pb-2 border-b border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                                    {item.displayName || item.name}
                                </p>
                                {item.description && (
                                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-medium">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                            {breakdown && breakdown.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Price Breakdown
                                        </span>
                                        <div className="flex-1 h-px bg-white/5" />
                                    </div>
                                    {breakdown.map((b: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center bg-white/5 p-2 rounded-lg"
                                        >
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {b.label || b.name}
                                            </span>
                                            <span className="text-[10px] font-black text-white">
                                                ₹{(b.amount || b.value || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Triangle pointer */}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#15191e] border-l border-b border-white/10 rotate-45" />
                    </div>
                )}
            </div>
        );
    };

    // Video Modal State
    const [isVideoOpen, setIsVideoOpen] = useState(false);

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

    const ActionIcon = ({ icon: Icon, onClick, colorClass = 'text-slate-400 hover:text-brand-primary' }: any) => (
        <button
            onClick={onClick}
            className={`p-2.5 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-95 group/icon ${colorClass}`}
        >
            <Icon size={18} strokeWidth={2.5} />
        </button>
    );

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
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#0b0d10] transition-colors duration-500 font-sans pt-0 pb-20">
            {/* Cinematic Mesh Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-40 dark:opacity-20 transition-all duration-[2000ms] blur-[120px]"
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
            {/* 1. Sticky PDP Command Bar (Floating Design) */}
            <div
                className="sticky z-[90] w-full flex justify-center transition-all duration-300 py-0 px-4 mb-4 mt-[calc(var(--header-h)+16px)]"
                style={{ top: 'var(--header-h)' }}
            >
                <div className="page-container w-full">
                    <div className="w-full bg-white/60 dark:bg-[#0b0d10]/60 backdrop-blur-3xl border border-slate-200/60 dark:border-white/10 rounded-full h-[var(--header-h)] px-8 flex items-center justify-between shadow-2xl shadow-black/10 ring-1 ring-black/5 dark:ring-white/5">
                        {/* 1. Left: Product Identity & Actions */}
                        <div className="flex items-center gap-8">
                            {/* Product Identity Mini */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 relative flex items-center justify-center bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 group overflow-hidden">
                                    <Image
                                        src={getProductImage()}
                                        alt={displayModel}
                                        fill
                                        sizes="48px"
                                        className="object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                            {displayModel}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none pt-0.5">
                                            {displayVariant}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full border border-white/10 shadow-sm"
                                            style={{ backgroundColor: activeColorConfig.hex }}
                                        />
                                        <span className="text-[8px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase leading-none">
                                            {displayColor}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />

                            {/* Action Icons */}
                            <div className="flex items-center gap-1">
                                <ActionIcon
                                    icon={Youtube}
                                    onClick={() => setIsVideoOpen(true)}
                                    colorClass="text-slate-400 hover:text-red-500"
                                />
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                                <ActionIcon icon={Download} onClick={() => {}} />
                                <ActionIcon icon={Share2} onClick={handleShareQuote} />
                                <ActionIcon
                                    icon={Heart}
                                    onClick={handleSaveQuote}
                                    colorClass="text-slate-400 hover:text-rose-500"
                                />
                            </div>
                        </div>

                        {/* 2. Right: Quote Summary */}
                        <div className="flex items-center gap-6">
                            {/* Context Summary */}
                            {leadContext?.name && (
                                <div className="hidden xl:flex flex-col items-end pr-6 border-r border-slate-200 dark:border-white/10">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 text-right">
                                        Quoting for
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">
                                        {leadContext.name}
                                    </p>
                                </div>
                            )}

                            {/* Price Summary */}
                            <div className="flex flex-col items-end">
                                <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary leading-none mb-1 text-right italic">
                                    Instant Quote
                                </p>
                                <div className="flex items-baseline gap-3">
                                    {totalSavings > 0 && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-700">
                                            <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-mono opacity-70">
                                                ₹{(totalOnRoad + totalSavings).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap border border-[#FFD700]/30">
                                                SAVE ₹{totalSavings.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <p
                                        key={totalOnRoad}
                                        className="text-xl font-black text-[#FFD700] font-mono leading-none animate-in fade-in zoom-in-95 duration-500"
                                    >
                                        ₹{totalOnRoad.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={handleBookingRequest}
                                className="h-10 px-6 bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 font-black text-xs uppercase tracking-widest rounded-full shadow-xl shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group relative overflow-hidden"
                            >
                                <span className="relative z-10">Get Quote</span>
                                <ArrowRight
                                    size={14}
                                    className="relative z-10 group-hover:translate-x-0.5 transition-transform"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-container pt-4 pb-10 space-y-12 relative z-10">
                {/* 2. Top Fluid Section (50/25/25 Split) */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex gap-6 items-stretch"
                >
                    {/* Visual Section (50%) */}
                    <motion.div variants={itemVariants} className="w-1/2 min-w-0">
                        <VisualsRow
                            colors={colors}
                            selectedColor={selectedColor}
                            onColorSelect={handleColorChange}
                            productImage={getProductImage()}
                            videoSource={activeColorConfig?.video || ''}
                            isVideoOpen={isVideoOpen}
                            onCloseVideo={() => setIsVideoOpen(false)}
                        />
                    </motion.div>

                    {/* Pricing Summary (25%) */}
                    <motion.div variants={itemVariants} className="w-1/4">
                        <PricingCard
                            product={product}
                            variantName={displayVariant}
                            activeColor={{ name: displayColor || activeColorConfig.name, hex: activeColorConfig.hex }}
                            totalOnRoad={totalOnRoad}
                            priceBreakup={priceBreakupData}
                            productImage={getProductImage()}
                            pricingSource={data.pricingSource}
                            leadName={leadContext?.name}
                        />
                    </motion.div>

                    {/* Finance Card (25%) */}
                    <motion.div variants={itemVariants} className="w-1/4">
                        <FinanceCard
                            emi={emi}
                            emiTenure={emiTenure}
                            setEmiTenure={setEmiTenure}
                            downPayment={userDownPayment || 0}
                            setUserDownPayment={setUserDownPayment}
                            minDownPayment={minDownPayment}
                            maxDownPayment={maxDownPayment}
                            totalOnRoad={totalOnRoad}
                            loanAmount={loanAmount}
                            annualInterest={annualInterest}
                            interestType={interestType}
                            schemeId={initialFinance?.scheme?.id}
                            financeCharges={financeCharges}
                        />
                    </motion.div>
                </motion.div>

                {/* 3. Modular 5-Pillar Configuration Grid (Consolidated Design) */}
                <div className="grid grid-cols-5 gap-6">
                    {configCards.map((category, idx) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={category.id}
                                custom={idx}
                                variants={configVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="glass-panel bg-white/90 dark:bg-[#0b0d10]/40 rounded-[3rem] h-[720px] flex flex-col border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group/pillar hover:-translate-y-2 hover:shadow-brand-primary/10 transition-all duration-500">
                                    {/* Consolidated Header Section - Unified Background */}
                                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col items-start gap-4 h-20 shrink-0 relative overflow-hidden transition-colors group-hover/pillar:bg-white/[0.02]">
                                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand-primary relative z-10">
                                            <Icon size={16} />
                                            <span>{category.label}</span>
                                        </div>
                                        {/* Subtle Ambient Glow */}
                                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-brand-primary/10 blur-2xl rounded-full" />
                                    </div>

                                    {/* Content Area Section */}
                                    <div className="flex-1 overflow-hidden flex flex-col p-2">
                                        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-4 p-2 pb-12">
                                            {category.id === 'ACCESSORIES' && (
                                                <div className="space-y-6">
                                                    {activeAccessories.filter((a: any) => a.isMandatory).length > 0 && (
                                                        <div className="space-y-3">
                                                            {activeAccessories
                                                                .filter((a: any) => a.isMandatory)
                                                                .map((acc: any) => (
                                                                    <ConfigItemRow
                                                                        key={acc.id}
                                                                        item={acc}
                                                                        isSelected={true}
                                                                        onToggle={() => {}}
                                                                        isMandatory={true}
                                                                    />
                                                                ))}
                                                        </div>
                                                    )}
                                                    <div className="space-y-3">
                                                        {activeAccessories
                                                            .filter((a: any) => !a.isMandatory)
                                                            .map((acc: any) => (
                                                                <ConfigItemRow
                                                                    key={acc.id}
                                                                    item={acc}
                                                                    isSelected={selectedAccessories.includes(acc.id)}
                                                                    onToggle={() => toggleAccessory(acc.id)}
                                                                />
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                            {category.id === 'INSURANCE' && (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        {insuranceRequiredItems.map((item: any) => (
                                                            <ConfigItemRow
                                                                key={item.id}
                                                                item={item}
                                                                isSelected={true}
                                                                onToggle={() => {}}
                                                                isMandatory={true}
                                                                breakdown={item.breakdown}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {availableInsuranceAddons.map((item: any) => (
                                                            <ConfigItemRow
                                                                key={item.id}
                                                                item={item}
                                                                isSelected={selectedInsuranceAddons.includes(item.id)}
                                                                onToggle={() => toggleInsuranceAddon(item.id)}
                                                                breakdown={item.breakdown}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {category.id === 'REGISTRATION' && (
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const fallbackOptions = [
                                                            {
                                                                id: 'STATE',
                                                                name: 'State Registration',
                                                                price: Math.round((data.baseExShowroom || 0) * 0.12),
                                                                description: 'Standard RTO charges for your state.',
                                                            },
                                                            {
                                                                id: 'BH',
                                                                name: 'Bharat Series (BH)',
                                                                price: Math.round((data.baseExShowroom || 0) * 0.08),
                                                                description: 'For frequent interstate travel.',
                                                            },
                                                            {
                                                                id: 'COMPANY',
                                                                name: 'Company Registration',
                                                                price: Math.round((data.baseExShowroom || 0) * 0.2),
                                                                description: 'Corporate entity registration.',
                                                            },
                                                        ];
                                                        const items =
                                                            data.rtoOptions && data.rtoOptions.length > 0
                                                                ? data.rtoOptions
                                                                : fallbackOptions;
                                                        return items.map((item: any) => (
                                                            <ConfigItemRow
                                                                key={item.id}
                                                                item={item}
                                                                isSelected={regType === item.id}
                                                                onToggle={() => setRegType(item.id as any)}
                                                                isRadio
                                                                breakdown={item.breakdown}
                                                            />
                                                        ));
                                                    })()}
                                                </div>
                                            )}
                                            {category.id === 'SERVICES' && (
                                                <div className="space-y-3">
                                                    {activeServices.map((service: any) => (
                                                        <ConfigItemRow
                                                            key={service.id}
                                                            item={service}
                                                            isSelected={selectedServices.includes(service.id)}
                                                            onToggle={() => toggleService(service.id)}
                                                            breakdown={service.breakdown}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            {category.id === 'WARRANTY' && (
                                                <div className="space-y-3">
                                                    {warrantyItems.map((item: any) => (
                                                        <ConfigItemRow
                                                            key={item.id}
                                                            item={item}
                                                            isSelected={true}
                                                            onToggle={() => {}}
                                                            isMandatory={true}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Unified Bottom Fade - Theme Aware */}
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 dark:from-black/80 dark:via-black/40 to-transparent pointer-events-none z-10" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
