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
import VisualsRow from './Personalize/VisualsRow';
import TabNavigation from './Personalize/Tabs/TabNavigation';
import AccessoriesTab from './Personalize/Tabs/AccessoriesTab';
import SidebarHUD from './Personalize/SidebarHUD';
import CascadingAccessorySelector from './Personalize/CascadingAccessorySelector';
import { ServiceOption } from '@/types/store';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';
import { computeOClubPricing, OCLUB_COIN_VALUE } from '@/lib/oclub/coin';

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
import TechSpecsSection from './Personalize/TechSpecsSection';

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
    const showCoinRate = Number.isFinite(walletCoinsValue);

    // Compute EMI at component level for footer display
    const footerEmi = (() => {
        const annualInterest = initialFinance?.scheme?.interestRate ? initialFinance.scheme.interestRate / 100 : 0;
        const interestType = initialFinance?.scheme?.interestType || 'REDUCING';
        const allCharges = initialFinance?.scheme?.charges || [];
        const calcAmt = (charge: any) => {
            if (charge.type === 'PERCENTAGE') {
                const basis = charge.calculationBasis === 'LOAN_AMOUNT' ? loanAmount : totalOnRoad;
                return Math.round(basis * (charge.value / 100));
            }
            return charge.value || 0;
        };
        const totalUpfront = allCharges
            .filter((c: any) => c.impact === 'UPFRONT')
            .reduce((s: number, c: any) => s + calcAmt(c), 0);
        const totalFunded = allCharges
            .filter((c: any) => c.impact === 'FUNDED')
            .reduce((s: number, c: any) => s + calcAmt(c), 0);
        const netLoan = Math.max(0, displayOnRoad - (userDownPayment || 0));
        const grossLoan = netLoan + totalFunded + totalUpfront;
        if (interestType === 'FLAT') {
            const totalInt = grossLoan * annualInterest * (emiTenure / 12);
            return Math.round((grossLoan + totalInt) / emiTenure);
        }
        const r = annualInterest / 12;
        if (r === 0) return Math.round(grossLoan / emiTenure);
        return Math.round((grossLoan * r * Math.pow(1 + r, emiTenure)) / (Math.pow(1 + r, emiTenure) - 1));
    })();

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
        { label: 'Insurance Add-ons', value: Math.round((data.insuranceAddonsPrice || 0) + (data.insuranceAddonsDiscount || 0)) },
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
                    label: "O'Club Privileged",
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

    const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false, isRadio = false, breakdown }: any) => {
        const quantity = isSelected ? quantities[item.id] || 1 : 0;
        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;

        return (
            <div className="group/item relative h-full">
                <button
                    onClick={() => !isMandatory && onToggle && onToggle()}
                    disabled={isMandatory}
                    className={`w-full h-full p-4 rounded-3xl border transition-all duration-500 flex flex-col justify-between gap-4 group/btn
                        ${isSelected
                            ? 'bg-brand-primary/[0.08] dark:bg-brand-primary/[0.04] border-brand-primary/40 shadow-[0_15px_40px_rgba(255,215,0,0.1)]'
                            : 'bg-white/40 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/[0.04]'
                        } ${isMandatory ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5'}`}
                >
                    <div className="w-full flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0
                                ${isSelected
                                        ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-105'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-white/10'
                                    }`}
                            >
                                {isRadio ? (
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-black' : 'bg-transparent'}`}
                                    />
                                ) : isMandatory ? (
                                    <CheckCircle2 size={18} strokeWidth={3} />
                                ) : isSelected ? (
                                    <CheckCircle2 size={18} strokeWidth={3} />
                                ) : (
                                    <Plus size={18} />
                                )}
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <span
                                    className={`text-xs font-black uppercase tracking-tight leading-tight mb-1 truncate w-full ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`}
                                >
                                    {item.displayName || item.name}
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <span
                                        className={`text-sm font-black font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-900 dark:text-zinc-300'}`}
                                    >
                                        ₹{finalPrice.toLocaleString()}
                                    </span>
                                    {item.discountPrice > 0 && (
                                        <span className="text-[10px] text-slate-400 dark:text-zinc-600 line-through font-bold">
                                            ₹{item.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {(item.description || breakdown) && (
                            <div
                                className={`p-1.5 rounded-full transition-colors ${isSelected ? 'bg-brand-primary/20 text-brand-primary' : 'text-slate-400 hover:text-brand-primary'}`}
                            >
                                <Info size={14} />
                            </div>
                        )}
                    </div>

                    {item.description && (
                        <p
                            className={`text-[10px] leading-relaxed text-left line-clamp-2 ${isSelected ? 'text-slate-700 dark:text-zinc-400' : 'text-slate-400 dark:text-zinc-600'}`}
                        >
                            {item.description}
                        </p>
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

    const renderCategoryContent = (categoryId: string) => {
        if (categoryId === 'ACCESSORIES') {
            // Selected items float to top, then sort by price within each group
            const sortedAccessories = [...activeAccessories].sort((a: any, b: any) => {
                const aSelected = a.isMandatory || selectedAccessories.includes(a.id) ? 1 : 0;
                const bSelected = b.isMandatory || selectedAccessories.includes(b.id) ? 1 : 0;
                if (aSelected !== bSelected) return bSelected - aSelected; // selected first
                return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price); // then by price
            });

            // Helper: title case
            const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

            return (
                <>
                    {sortedAccessories.map((acc: any, idx: number) => {
                        const isSelected = acc.isMandatory || selectedAccessories.includes(acc.id);
                        const finalPrice = acc.discountPrice > 0 ? acc.discountPrice : acc.price;
                        const hasDiscount = acc.discountPrice > 0 && acc.discountPrice < acc.price;
                        const savings = hasDiscount ? acc.price - acc.discountPrice : 0;
                        const savingsPct = hasDiscount ? Math.round((savings / acc.price) * 100) : 0;
                        const quantity = isSelected ? quantities[acc.id] || 1 : 0;
                        const maxQty = acc.maxQty || 99;
                        const skuImg = acc.image || null;

                        // Line 1: Product group (e.g., "Crash Guard")
                        const line1 = toTitle(acc.productGroup || acc.name);
                        // Line 2: Sub-variant (e.g., "Premium Mild Steel (Black)")
                        const rawName = acc.name || '';
                        const groupName = acc.productGroup || '';
                        const subVariant = rawName
                            .replace(new RegExp(`^${groupName}\\s*`, 'i'), '')
                            .replace(/\s+for\s+.*/i, '')
                            .trim();
                        // Line 3: "Generic For Activa"
                        const vehicleModel = (acc.variantName || '').split('›').pop()?.trim() || '';
                        const line3 = vehicleModel
                            ? toTitle([acc.brand, 'for', vehicleModel].filter(Boolean).join(' '))
                            : toTitle(acc.brand || '');

                        return (
                            <div
                                key={acc.id}
                                onClick={() => !acc.isMandatory && toggleAccessory(acc.id)}
                                className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${isSelected
                                    ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                                    : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                    } ${idx > 0 ? 'border-t border-t-slate-100/80 dark:border-t-white/5' : ''}`}
                            >
                                {/* Checkbox */}
                                <div
                                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${isSelected
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40'
                                        : 'border-2 border-slate-300 dark:border-zinc-600 group-hover:border-emerald-400'
                                        }`}
                                >
                                    {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                                </div>

                                {/* Image */}
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all ${skuImg
                                        ? 'bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm'
                                        : 'bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10'
                                        }`}
                                >
                                    {skuImg ? (
                                        <Image
                                            src={skuImg}
                                            alt={acc.name}
                                            width={36}
                                            height={36}
                                            className="object-contain"
                                        />
                                    ) : (
                                        <Package size={16} className="text-slate-300 dark:text-zinc-600" />
                                    )}
                                </div>

                                {/* Name — three lines */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-[12px] font-black tracking-tight leading-tight truncate ${isSelected
                                            ? 'text-slate-900 dark:text-white'
                                            : 'text-slate-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        {line1 || toTitle(acc.name)}
                                    </p>
                                    {subVariant && (
                                        <p
                                            className={`text-[11px] font-medium mt-0.5 truncate leading-tight ${isSelected ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-500 dark:text-zinc-400'}`}
                                        >
                                            {toTitle(subVariant)}
                                        </p>
                                    )}
                                    {line3 && (
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate leading-tight">
                                            {line3}
                                        </p>
                                    )}
                                </div>

                                {/* Qty ± */}
                                {isSelected && (
                                    <div className="flex items-center gap-1 shrink-0 bg-slate-100/80 dark:bg-white/5 rounded-lg px-1 py-0.5">
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                updateQuantity(acc.id, Math.max(1, quantity - 1));
                                            }}
                                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 dark:text-zinc-400 text-sm font-bold hover:bg-white dark:hover:bg-white/10 transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-5 text-center text-[11px] font-black text-slate-700 dark:text-zinc-300">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                updateQuantity(acc.id, Math.min(maxQty, quantity + 1));
                                            }}
                                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 dark:text-zinc-400 text-sm font-bold hover:bg-white dark:hover:bg-white/10 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                )}

                                {/* Price block */}
                                <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                                    <span
                                        className={`text-[13px] font-extrabold tabular-nums ${isSelected
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-800 dark:text-zinc-200'
                                            }`}
                                    >
                                        {finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
                                    </span>
                                    {hasDiscount && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-slate-400 dark:text-zinc-600 line-through tabular-nums">
                                                ₹{acc.price.toLocaleString()}
                                            </span>
                                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full leading-none">
                                                {savingsPct}% off
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            );
        }

        // Shared flat-row renderer for Insurance / Registration / Services / Warranty
        const renderFlatItemList = (
            items: any[],
            {
                getSelected,
                onToggle,
                isMandatory = false,
                isRadio = false,
            }: {
                getSelected: (id: string) => boolean;
                onToggle: (id: string) => void;
                isMandatory?: boolean;
                isRadio?: boolean;
            }
        ) => {
            const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            return (
                <>
                    {items.map((item: any, idx: number) => {
                        const selected = getSelected(item.id);
                        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
                        const hasDiscount = item.discountPrice > 0 && item.discountPrice < item.price;
                        const savings = hasDiscount ? item.price - item.discountPrice : 0;
                        const savingsPct = hasDiscount ? Math.round((savings / item.price) * 100) : 0;

                        return (
                            <div
                                key={item.id}
                                onClick={() => !isMandatory && onToggle(item.id)}
                                className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${selected
                                    ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                                    : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                    } ${idx > 0 ? 'border-t border-t-slate-100/80 dark:border-t-white/5' : ''} ${isMandatory ? 'cursor-default' : ''}`}
                            >
                                {/* Checkbox / Radio */}
                                <div
                                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${selected
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40'
                                        : 'border-2 border-slate-300 dark:border-zinc-600 group-hover:border-emerald-400'
                                        }`}
                                >
                                    {selected &&
                                        (isRadio ? (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        ) : (
                                            <CheckCircle2 size={12} strokeWidth={3} />
                                        ))}
                                </div>

                                {/* Name + description */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-[12px] font-semibold leading-tight truncate ${selected
                                            ? 'text-slate-900 dark:text-white'
                                            : 'text-slate-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        {toTitle(item.displayName || item.name)}
                                    </p>
                                    {item.description && (
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate leading-tight">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Breakdown info icon */}
                                {item.breakdown && item.breakdown.length > 0 && (
                                    <div className="relative group/tip shrink-0">
                                        <div
                                            className={`p-1 rounded-full transition-colors ${selected ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}
                                        >
                                            <Info size={13} />
                                        </div>
                                        <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 rounded-xl bg-[#15191e] border border-white/10 shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-300 pointer-events-none">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2">
                                                Breakdown
                                            </p>
                                            {item.breakdown.map((b: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center py-1 border-b border-white/5 last:border-0"
                                                >
                                                    <span className="text-[9px] text-slate-400">
                                                        {b.label || b.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white">
                                                        ₹{(b.amount || b.value || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Price block */}
                                <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                                    <span
                                        className={`text-[13px] font-extrabold tabular-nums ${selected
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-800 dark:text-zinc-200'
                                            }`}
                                    >
                                        {finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
                                    </span>
                                    {hasDiscount && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-slate-400 dark:text-zinc-600 line-through tabular-nums">
                                                ₹{item.price.toLocaleString()}
                                            </span>
                                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full leading-none">
                                                {savingsPct}% off
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            );
        };

        if (categoryId === 'INSURANCE') {
            const allInsurance = [...insuranceRequiredItems, ...availableInsuranceAddons];
            const mandatoryIds = new Set(insuranceRequiredItems.map((i: any) => i.id));

            // Compute totals
            const activeAddons = availableInsuranceAddons.filter((a: any) => selectedInsuranceAddons.includes(a.id));
            const addonsTotal = activeAddons.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
            const totalInsurance = baseInsurance + addonsTotal;

            // Net Premium (sum of all base premiums before GST)
            const tpBase = insuranceRequiredItems.find((i: any) => i.id === 'insurance-tp');
            const odBase = insuranceRequiredItems.find((i: any) => i.id === 'insurance-od');
            const tpBasePremium = tpBase?.breakdown?.[0]?.amount || insuranceTP || 0;
            const odBasePremium = odBase?.breakdown?.[0]?.amount || insuranceOD || 0;
            const addonsBasePremium = activeAddons.reduce((sum: number, a: any) => {
                const base = a.breakdown?.find((b: any) => b.label === 'Base Premium');
                return sum + Number(base?.amount || a.price || 0);
            }, 0);
            const netPremium = Number(tpBasePremium) + Number(odBasePremium) + Number(addonsBasePremium);
            const totalGst = Math.max(0, totalInsurance - netPremium);

            const TreeLine = () => (
                <span className="text-slate-300 dark:text-zinc-700 mr-2 text-[13px] font-light select-none">└</span>
            );

            // Tooltip descriptions for insurance components
            const tipMap: Record<string, string> = {
                tp: 'Covers damage you cause to other people or their property in an accident. This is mandatory by law for 5 years.',
                od: 'Covers repair or replacement costs if your vehicle gets damaged in an accident, theft, fire, or natural disaster. Valid for 1 year.',
                'zero depreciation':
                    'Without this, insurance deducts value for wear & tear on parts. With Zero Dep, you get full claim amount without any deduction.',
                'personal accident':
                    'Provides compensation to you (the owner-driver) for injuries or death in a road accident. Covers up to ₹15 lakh.',
                'roadside assistance':
                    'Get help if your vehicle breaks down — towing, flat tyre, battery jumpstart, fuel delivery, anywhere in India.',
                'engine protect':
                    'Covers engine damage from water logging or oil leakage, which is not covered under regular insurance.',
                'return to invoice':
                    'If your vehicle is stolen or totally damaged, you get the full invoice amount back instead of depreciated value.',
                consumables:
                    'Covers cost of consumables like engine oil, nuts, bolts, and washers used during repairs — normally not covered.',
                'key replacement':
                    'Covers the cost of replacing your vehicle keys if they are lost, stolen, or damaged.',
                net_premium:
                    'The total of all your insurance charges before GST is added. This is the base cost of your coverage.',
                gst: 'Government Service Tax applied on insurance premiums. Currently 18% on all motor insurance.',
            };

            const getAddonTip = (name: string): string | undefined => {
                const key = name.toLowerCase();
                for (const [k, v] of Object.entries(tipMap)) {
                    if (key.includes(k)) return v;
                }
                return undefined;
            };

            // InfoTip: hover on desktop, tap (i) on mobile
            const InfoTip = ({ tip }: { tip?: string }) => {
                if (!tip) return null;
                return (
                    <span className="relative group/tip inline-flex ml-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-100 dark:bg-zinc-800 inline-flex items-center justify-center cursor-help shrink-0 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 leading-none select-none">
                                i
                            </span>
                        </span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg bg-slate-800 dark:bg-zinc-200 text-[10px] leading-relaxed text-white dark:text-zinc-900 font-medium shadow-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 z-50 pointer-events-none">
                            {tip}
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-zinc-200" />
                        </span>
                    </span>
                );
            };

            return (
                <>
                    <div>
                        {/* Header: INSURANCE PACKAGE */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                            <Shield size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Insurance Package
                            </span>
                        </div>

                        {/* Third Party (Basic) */}
                        <div className="px-4 py-2.5 border-b border-slate-50 dark:border-white/[0.03]">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                                    <TreeLine />
                                    Third Party (Basic)
                                    <InfoTip tip={tipMap['tp']} />
                                </span>
                                <span className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                    ₹{Number(insuranceTP || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="ml-6 mt-1 space-y-0.5">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center text-[10px] text-slate-500 dark:text-zinc-500 italic">
                                        <TreeLine />
                                        Liability Only (5 Years Cover)
                                    </span>
                                    <span className="text-[10px] tabular-nums text-slate-500 dark:text-zinc-500">
                                        ₹{Number(insuranceTP || 0).toLocaleString()}
                                    </span>
                                </div>
                                {tpBase?.breakdown
                                    ?.filter((b: any) => !b.label.toLowerCase().includes('gst'))
                                    .map((b: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between ml-5">
                                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-600">
                                                {b.label}: ₹{Number(b.amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Own Damage (OD) */}
                        <div className="px-4 py-2.5 border-b border-slate-50 dark:border-white/[0.03]">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                                    <TreeLine />
                                    Own Damage (OD)
                                    <InfoTip tip={tipMap['od']} />
                                </span>
                                <span className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                    ₹{Number(insuranceOD || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="ml-6 mt-1 space-y-0.5">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center text-[10px] text-slate-500 dark:text-zinc-500 italic">
                                        <TreeLine />
                                        Comprehensive (1 Year Cover)
                                    </span>
                                    <span className="text-[10px] tabular-nums text-slate-500 dark:text-zinc-500">
                                        ₹{Number(insuranceOD || 0).toLocaleString()}
                                    </span>
                                </div>
                                {odBase?.breakdown
                                    ?.filter((b: any) => !b.label.toLowerCase().includes('gst'))
                                    .map((b: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between ml-5">
                                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-600">
                                                {b.label}: ₹{Number(b.amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* OPTIONAL ADD-ONS section */}
                        {availableInsuranceAddons.length > 0 && (
                            <div className="border-t border-slate-200/80 dark:border-white/10">
                                <div className="px-4 py-2 bg-slate-50/60 dark:bg-white/[0.015]">
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                                        Optional Add-Ons
                                    </span>
                                </div>
                                {availableInsuranceAddons.map((addon: any) => {
                                    const isActive = selectedInsuranceAddons.includes(addon.id);
                                    const isBundled = addon.inclusionType === 'BUNDLE' || addon.isMandatory;
                                    const addonPrice = Number(addon.discountPrice || addon.price || 0);
                                    const effectivePrice = isBundled ? 0 : addonPrice;
                                    const hasOffer = isBundled || addon.discountPrice === 0;
                                    return (
                                        <div
                                            key={addon.id}
                                            onClick={() => {
                                                if (!isBundled) toggleInsuranceAddon(addon.id);
                                            }}
                                            className={`px-4 py-2.5 border-t border-slate-50 dark:border-white/[0.03] transition-all duration-200 ${!isBundled ? 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.015]' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    {/* Toggle checkbox */}
                                                    {!isBundled ? (
                                                        <div
                                                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-200 ${isActive
                                                                ? 'bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40'
                                                                : 'border-[1.5px] border-slate-300 dark:border-zinc-600 hover:border-emerald-400'
                                                                }`}
                                                        >
                                                            {isActive && (
                                                                <svg
                                                                    className="w-2.5 h-2.5 text-white"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={3}
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-4 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                            <svg
                                                                className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2.5}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <span
                                                        className={`text-[11px] font-semibold ${isActive || isBundled ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-500 dark:text-zinc-500'}`}
                                                    >
                                                        {addon.name}
                                                        <InfoTip tip={getAddonTip(addon.name)} />
                                                    </span>
                                                    {isBundled && (
                                                        <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                                                            Included
                                                        </span>
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[12px] font-bold tabular-nums ${hasOffer && (isActive || isBundled) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-zinc-300'}`}
                                                >
                                                    {effectivePrice === 0 && (isActive || isBundled)
                                                        ? 'FREE'
                                                        : `₹${effectivePrice.toLocaleString()}`}
                                                </span>
                                            </div>
                                            {/* Breakdown details */}
                                            {addon.breakdown &&
                                                addon.breakdown.length > 0 &&
                                                (isActive || isBundled) && (
                                                    <div className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                                        {addon.breakdown
                                                            .filter((b: any) => !b.label.toLowerCase().includes('gst'))
                                                            .map((b: any, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-600"
                                                                >
                                                                    {b.label}: ₹{Number(b.amount || 0).toLocaleString()}
                                                                </span>
                                                            ))}
                                                        {hasOffer && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                                                Offer: ₹0
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Net Premium */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/80 dark:border-white/10">
                            <span className="flex items-center text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                                <TreeLine />
                                Net Premium
                                <InfoTip tip={tipMap['net_premium']} />
                            </span>
                            <span className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                ₹{netPremium.toLocaleString()}
                            </span>
                        </div>

                        {/* GST */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-50 dark:border-white/[0.03]">
                            <span className="flex items-center text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                                <TreeLine />
                                GST ({insuranceGstRate}% GST)
                                <InfoTip tip={tipMap['gst']} />
                            </span>
                            <span className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                ₹{totalGst.toLocaleString()}
                            </span>
                        </div>

                        {/* Total Insurance footer */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t-2 border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.015]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Total Insurance
                            </span>
                            <span className="text-[13px] font-black tabular-nums text-slate-900 dark:text-white">
                                ₹{totalInsurance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </>
            );
        }

        if (categoryId === 'REGISTRATION') {
            const fallbackOptions = [
                { id: 'STATE', name: 'State', price: Math.round((data.baseExShowroom || 0) * 0.12), breakdown: [] },
                {
                    id: 'BH',
                    name: 'Bharat Series',
                    price: Math.round((data.baseExShowroom || 0) * 0.08),
                    breakdown: [],
                },
                { id: 'COMPANY', name: 'Company', price: Math.round((data.baseExShowroom || 0) * 0.2), breakdown: [] },
            ];
            const items = data.rtoOptions && data.rtoOptions.length > 0 ? data.rtoOptions : fallbackOptions;
            const selectedItem = items.find((i: any) => i.id === regType) || items[0];
            const breakdown = selectedItem?.breakdown || [];

            // Split breakdown into fixed vs variable (Road Tax, Cess change per type)
            const variableLabels = new Set(['Road Tax', 'Cess', 'Cess Amount']);
            const fixedCharges = breakdown.filter((b: any) => !variableLabels.has(b.label));
            const roadTaxEntry = breakdown.find((b: any) => b.label === 'Road Tax');
            const cessEntry = breakdown.find((b: any) => b.label === 'Cess' || b.label === 'Cess Amount');

            // Get road tax amount per type for radio display
            const getRoadTax = (typeId: string) => {
                const opt = items.find((i: any) => i.id === typeId);
                const bd = opt?.breakdown || [];
                const rt = bd.find((b: any) => b.label === 'Road Tax');
                return Number(rt?.amount || 0);
            };

            // Tree connector component
            const TreeLine = () => (
                <span className="text-slate-300 dark:text-zinc-700 mr-2 text-[13px] font-light select-none">└</span>
            );

            return (
                <>
                    <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
                        {/* Header: REGISTRATION (RTO) + Total */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                            <ClipboardList size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Registration (RTO)
                            </span>
                        </div>

                        {/* Fixed Charges — tree lines */}
                        {fixedCharges.length > 0 && (
                            <div>
                                {fixedCharges.map((b: any, i: number) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between px-4 py-2 ${i > 0 ? 'border-t border-slate-50 dark:border-white/[0.03]' : ''}`}
                                    >
                                        <span className="flex items-center text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                                            <TreeLine />
                                            {b.label}
                                        </span>
                                        <span className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                            ₹{Number(b.amount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Road Tax — section header + 3 vertical radio rows */}
                        <div className="border-t border-slate-200/80 dark:border-white/10">
                            <div className="px-4 py-2 bg-slate-50/60 dark:bg-white/[0.015]">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                                    Road Tax
                                </span>
                            </div>
                            {(['BH', 'STATE', 'COMPANY'] as const).map(typeId => {
                                const opt = items.find((i: any) => i.id === typeId);
                                if (!opt) return null;
                                const isActive = regType === typeId;
                                const roadTaxAmt = getRoadTax(typeId);
                                const stateNameMap: Record<string, string> = {
                                    MH: 'Maharashtra',
                                    DL: 'Delhi',
                                    KA: 'Karnataka',
                                    TN: 'Tamil Nadu',
                                    UP: 'Uttar Pradesh',
                                    GJ: 'Gujarat',
                                    RJ: 'Rajasthan',
                                    WB: 'West Bengal',
                                    MP: 'Madhya Pradesh',
                                    AP: 'Andhra Pradesh',
                                    TS: 'Telangana',
                                    KL: 'Kerala',
                                    PB: 'Punjab',
                                    HR: 'Haryana',
                                    BR: 'Bihar',
                                    JH: 'Jharkhand',
                                    AS: 'Assam',
                                    OR: 'Odisha',
                                    CG: 'Chhattisgarh',
                                    UK: 'Uttarakhand',
                                    HP: 'Himachal Pradesh',
                                    GA: 'Goa',
                                    TR: 'Tripura',
                                    ML: 'Meghalaya',
                                    MN: 'Manipur',
                                    NL: 'Nagaland',
                                    MZ: 'Mizoram',
                                    AR: 'Arunachal Pradesh',
                                    SK: 'Sikkim',
                                    JK: 'Jammu & Kashmir',
                                    CT: 'Chhattisgarh',
                                };
                                const stateName = data.stateCode
                                    ? stateNameMap[data.stateCode.toUpperCase()] || data.stateCode
                                    : null;
                                const displayName =
                                    typeId === 'STATE'
                                        ? stateName
                                            ? `State (${stateName})`
                                            : 'State'
                                        : typeId === 'BH'
                                            ? 'Bharat Series'
                                            : 'Company';
                                return (
                                    <div
                                        key={typeId}
                                        onClick={() => setRegType(typeId)}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 border-l-[3px] border-t border-t-slate-50 dark:border-t-white/[0.03] ${isActive
                                            ? 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/10'
                                            : 'border-l-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.015]'
                                            }`}
                                    >
                                        {/* Radio dot */}
                                        <div
                                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${isActive
                                                ? 'bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40'
                                                : 'border-[1.5px] border-slate-300 dark:border-zinc-600'
                                                }`}
                                        >
                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span
                                            className={`flex-1 text-[11px] font-semibold ${isActive
                                                ? 'text-slate-900 dark:text-white'
                                                : 'text-slate-600 dark:text-zinc-400'
                                                }`}
                                        >
                                            {displayName}
                                        </span>
                                        <span
                                            className={`text-[12px] font-bold tabular-nums ${isActive
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-slate-700 dark:text-zinc-300'
                                                }`}
                                        >
                                            ₹{roadTaxAmt.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cess — tree line, auto-updates per type */}
                        {cessEntry && (
                            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/80 dark:border-white/10">
                                <span className="flex items-center text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                                    <TreeLine />
                                    Cess Amount
                                </span>
                                <span className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                    ₹{Number(cessEntry.amount || 0).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Total footer */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.01]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Total Registration
                            </span>
                            <span className="text-[13px] font-black tabular-nums text-slate-900 dark:text-white">
                                ₹{(selectedItem?.price || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Info: Required Documents / Process for selected type */}
                    <div className="mt-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] px-4 py-3">
                        {regType === 'STATE' && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                    State Registration
                                </p>
                                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Valid for the state of registration. You will need to provide Aadhaar Card, Address
                                    Proof, Passport-size Photos, and PAN Card. Processing takes 7–15 working days at the
                                    local RTO.
                                </p>
                            </div>
                        )}
                        {regType === 'BH' && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                    Bharat Series (BH)
                                </p>
                                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Pan-India validity — no re-registration needed when moving states. Ideal for
                                    Defence, Central Govt, PSU employees &amp; private-sector transferees. You will need
                                    Aadhaar Card, Address Proof, Passport-size Photos, PAN Card, and Employer Transfer
                                    Certificate or Posting Order.
                                </p>
                            </div>
                        )}
                        {regType === 'COMPANY' && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                    Company Registration
                                </p>
                                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Registered under a corporate entity. You will need Company PAN Card, GST
                                    Certificate, Board Resolution or Authorization Letter, and Certificate of
                                    Incorporation. Higher road tax applies.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            );
        }

        if (categoryId === 'SERVICES') {
            return renderFlatItemList(activeServices, {
                getSelected: id => selectedServices.includes(id),
                onToggle: id => toggleService(id),
            });
        }

        if (categoryId === 'WARRANTY') {
            return renderFlatItemList(warrantyItems, {
                getSelected: () => true,
                onToggle: () => { },
                isMandatory: true,
            });
        }

        return null;
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
                                    ${isActive
                                        ? 'flex-[3] bg-white dark:bg-[#0b0d10] border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)]'
                                        : 'flex-[0.5] bg-white/40 dark:bg-white/[0.03] backdrop-blur-xl border-white/60 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/[0.06] shadow-lg shadow-black/[0.03]'
                                    }`}
                            >
                                {/* Header */}
                                <div
                                    className={`p-6 items-center gap-3 transition-colors duration-500 shrink-0 ${isActive ? 'bg-brand-primary/[0.03] border-b border-slate-100 dark:border-white/5' : ''} ${isActive && card.id === 'GALLERY' ? 'grid grid-cols-[auto_1fr_auto]' : 'flex'}`}
                                >
                                    {/* Left: Icon + Label + Color Name */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                                            ${isActive ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-zinc-600'}`}
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
                                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold whitespace-nowrap">
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
                                                                    className="w-full h-full rounded-full border border-black/10 dark:border-white/20 relative overflow-hidden"
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
                                                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all hover:scale-110 border border-black/10 dark:border-white/20"
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
                                                        )}
                                                        {card.id === 'FINANCE' && (
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
                                                        )}
                                                        {card.id === 'FINANCE_SUMMARY' &&
                                                            (() => {
                                                                const allCharges =
                                                                    initialFinance?.scheme?.charges || [];
                                                                const upfrontCharges = allCharges.filter(
                                                                    (c: any) => c.impact === 'UPFRONT'
                                                                );
                                                                const fundedCharges = allCharges.filter(
                                                                    (c: any) => c.impact === 'FUNDED'
                                                                );
                                                                const calcAmt = (charge: any) => {
                                                                    if (charge.type === 'PERCENTAGE') {
                                                                        const basis =
                                                                            charge.calculationBasis === 'LOAN_AMOUNT'
                                                                                ? loanAmount
                                                                                : totalOnRoad;
                                                                        return Math.round(basis * (charge.value / 100));
                                                                    }
                                                                    return charge.value || 0;
                                                                };
                                                                const totalUpfront = upfrontCharges.reduce(
                                                                    (s: number, c: any) => s + calcAmt(c),
                                                                    0
                                                                );
                                                                const totalFunded = fundedCharges.reduce(
                                                                    (s: number, c: any) => s + calcAmt(c),
                                                                    0
                                                                );
                                                                const netLoan = Math.max(
                                                                    0,
                                                                    displayOnRoad - (userDownPayment || 0)
                                                                );
                                                                const grossLoan = netLoan + totalFunded + totalUpfront;
                                                                const marginMoney =
                                                                    (userDownPayment || 0) + totalUpfront;
                                                                const monthlyEmi = Math.round(
                                                                    (() => {
                                                                        if (interestType === 'FLAT') {
                                                                            const totalInt =
                                                                                grossLoan *
                                                                                annualInterest *
                                                                                (emiTenure / 12);
                                                                            return (grossLoan + totalInt) / emiTenure;
                                                                        }
                                                                        const r = annualInterest / 12;
                                                                        if (r === 0) return grossLoan / emiTenure;
                                                                        return (
                                                                            (grossLoan *
                                                                                r *
                                                                                Math.pow(1 + r, emiTenure)) /
                                                                            (Math.pow(1 + r, emiTenure) - 1)
                                                                        );
                                                                    })()
                                                                );
                                                                const totalInterest = Math.max(
                                                                    0,
                                                                    Math.round(monthlyEmi * emiTenure - grossLoan)
                                                                );
                                                                const totalOutflow = Math.round(
                                                                    (userDownPayment || 0) +
                                                                    totalUpfront +
                                                                    monthlyEmi * emiTenure
                                                                );

                                                                const Row = ({
                                                                    label,
                                                                    value,
                                                                    accent,
                                                                    sub,
                                                                    indent,
                                                                }: {
                                                                    label: string;
                                                                    value: string;
                                                                    accent?: string;
                                                                    sub?: string;
                                                                    indent?: boolean;
                                                                }) => (
                                                                    <div
                                                                        className={`flex justify-between items-start ${indent ? 'pl-4' : ''}`}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span
                                                                                className={`text-[11px] font-bold uppercase tracking-widest ${indent ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}
                                                                            >
                                                                                {label}
                                                                            </span>
                                                                            {sub && (
                                                                                <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500 mt-0.5">
                                                                                    {sub}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span
                                                                            className={`text-[11px] font-mono font-black ${accent || 'text-slate-700 dark:text-slate-300'}`}
                                                                        >
                                                                            {value}
                                                                        </span>
                                                                    </div>
                                                                );

                                                                return (
                                                                    <div className="flex flex-col h-full">
                                                                        {/* HEADER: Finance Partner */}
                                                                        <div className="space-y-2 pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
                                                                            <Row
                                                                                label="Financier"
                                                                                value={
                                                                                    initialFinance?.bank?.name ||
                                                                                    'Standard'
                                                                                }
                                                                            />
                                                                            <Row
                                                                                label="Scheme"
                                                                                value={
                                                                                    initialFinance?.scheme?.name ||
                                                                                    'Standard'
                                                                                }
                                                                            />
                                                                            <Row
                                                                                label="Interest Rate"
                                                                                value={`${(annualInterest * 100).toFixed(2)}% (${interestType})`}
                                                                            />
                                                                        </div>

                                                                        {/* CONTENT: Calculation Flow */}
                                                                        <div className="flex-1 flex flex-col justify-evenly py-2">
                                                                            <Row
                                                                                label="Asset Cost (Net SOT)"
                                                                                value={`₹${(totalOnRoad + totalSavings).toLocaleString()}`}
                                                                            />
                                                                            {(totalSavings > 0 ||
                                                                                (coinPricing &&
                                                                                    coinPricing.discount > 0)) && (
                                                                                    <Row
                                                                                        label="O'Club Privileged"
                                                                                        value={`-₹${(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}`}
                                                                                        accent="text-emerald-500"
                                                                                    />
                                                                                )}
                                                                            <Row
                                                                                label="Total Payable"
                                                                                value={`₹${displayOnRoad.toLocaleString()}`}
                                                                                accent="text-brand-primary font-black"
                                                                            />

                                                                            <div className="border-t border-slate-200/60 dark:border-white/5" />

                                                                            <Row
                                                                                label="Down Payment"
                                                                                value={`-₹${(userDownPayment || 0).toLocaleString()}`}
                                                                                accent="text-emerald-500"
                                                                            />
                                                                            <Row
                                                                                label="Net Loan Amount"
                                                                                value={`₹${netLoan.toLocaleString()}`}
                                                                            />
                                                                            {totalFunded > 0 &&
                                                                                fundedCharges.map(
                                                                                    (c: any, i: number) => (
                                                                                        <Row
                                                                                            key={i}
                                                                                            label={c.name}
                                                                                            value={`+₹${calcAmt(c).toLocaleString()}`}
                                                                                            accent="text-red-400"
                                                                                        />
                                                                                    )
                                                                                )}
                                                                            {upfrontCharges.map((c: any, i: number) => (
                                                                                <Row
                                                                                    key={i}
                                                                                    label={c.name}
                                                                                    value={`+₹${calcAmt(c).toLocaleString()}`}
                                                                                    accent="text-red-400"
                                                                                />
                                                                            ))}
                                                                            <Row
                                                                                label="Gross Loan Amount"
                                                                                value={`₹${grossLoan.toLocaleString()}`}
                                                                                accent="text-brand-primary"
                                                                            />

                                                                            <div className="border-t border-slate-200/60 dark:border-white/5" />

                                                                            <Row
                                                                                label="Total Extra Pay"
                                                                                value={`+₹${totalInterest.toLocaleString()}`}
                                                                                accent="text-red-400"
                                                                            />
                                                                            <Row
                                                                                label="Total Outflow"
                                                                                value={`₹${totalOutflow.toLocaleString()}`}
                                                                                accent="text-brand-primary font-black"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
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
                                                <span className="text-2xl font-black uppercase tracking-[0.3em] text-slate-400/60 dark:text-white/10 -rotate-90 whitespace-nowrap">
                                                    {card.label}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Section 3: Footer — Offer Price (PRICING only, shrink-0) */}
                                {isActive && card.id === 'PRICING' && (
                                    <div className="shrink-0 pl-[76px] pr-[76px] pt-3 pb-8 border-t border-slate-100 dark:border-white/5 bg-brand-primary/[0.03] relative z-10">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-600 dark:text-slate-400">
                                                        On-Road Price
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const src =
                                                        [initialLocation?.district, bestOffer?.dealer?.business_name]
                                                            .filter(Boolean)
                                                            .join(' • ') || data.pricingSource;
                                                    return src ? (
                                                        <span className="text-[8px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">
                                                            ({src})
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-600 line-through decoration-red-500/50 decoration-2 mr-1">
                                                        On Road ₹{(totalOnRoad + totalSavings).toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="text-4xl font-black italic tracking-tighter text-brand-primary font-mono block drop-shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-in zoom-in-95 duration-700">
                                                    ₹{displayOnRoad.toLocaleString()}
                                                </span>
                                                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                                    <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                        ⚡ You Save ₹
                                                        {(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}
                                                    </span>
                                                )}
                                                {!coinPricing && showOClubPrompt && (
                                                    <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                        Signup & get 13 O-Club coins
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Section 3: Footer — EMI (FINANCE_SUMMARY only, shrink-0) */}
                                {isActive && card.id === 'FINANCE_SUMMARY' && (
                                    <div className="shrink-0 min-h-[118px] pl-[76px] pr-[76px] pt-4 pb-8 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0b0d10] relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                                                    Monthly EMI
                                                </span>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-[#FFD700] font-mono tabular-nums leading-none">
                                                    ₹{footerEmi.toLocaleString()}
                                                </span>
                                                <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                    / {emiTenure}mo
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section 3: Footer — Down Payment (FINANCE only, shrink-0) */}
                                {isActive && card.id === 'FINANCE' && maxDownPayment > minDownPayment && (
                                    <div
                                        className="shrink-0 pl-[76px] pr-[76px] pt-3 pb-8 border-t border-slate-100 dark:border-white/5 bg-brand-primary/[0.03]"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                Down Payment
                                            </span>
                                            <div className="flex items-center gap-0">
                                                <span className="text-xs font-black font-mono tracking-tight text-brand-primary leading-none">
                                                    ₹
                                                </span>
                                                <input
                                                    type="number"
                                                    value={userDownPayment || 0}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) {
                                                            const from = userDownPayment || 0;
                                                            animateDP(from, val);
                                                        }
                                                    }}
                                                    className="bg-transparent text-xs font-black font-mono tracking-tight text-slate-900 dark:text-white outline-none border-b border-transparent focus:border-brand-primary transition-all p-0"
                                                    style={{
                                                        width: `${Math.max(String(userDownPayment || 0).length, 1) * 8 + 4}px`,
                                                    }}
                                                />
                                                <Edit2
                                                    size={10}
                                                    className="text-slate-400 hover:text-brand-primary transition-colors cursor-pointer ml-0.5"
                                                    strokeWidth={3}
                                                />
                                            </div>
                                        </div>
                                        {(() => {
                                            const currentDP = userDownPayment || 0;
                                            const range = maxDownPayment - minDownPayment;
                                            const fillPct =
                                                range > 0 ? ((currentDP - minDownPayment) / range) * 100 : 0;
                                            const dpOfOnRoad =
                                                displayOnRoad > 0 ? (currentDP / displayOnRoad) * 100 : 0;
                                            let hue: number;
                                            if (dpOfOnRoad <= 20) hue = (dpOfOnRoad / 20) * 30;
                                            else if (dpOfOnRoad <= 40) hue = 30 + ((dpOfOnRoad - 20) / 20) * 50;
                                            else hue = 80 + Math.min((dpOfOnRoad - 40) / 30, 1) * 60;
                                            const fillColor = `hsl(${hue}, 80%, 50%)`;
                                            const trackBg =
                                                typeof window !== 'undefined' &&
                                                    document.documentElement.classList.contains('dark')
                                                    ? 'rgba(255,255,255,0.1)'
                                                    : '#e2e8f0';
                                            const milestones: React.ReactNode[] = [];
                                            if (range > 0) {
                                                // Add all 5K milestone labels below the track
                                                for (let v = 0; v <= maxDownPayment; v += 5000) {
                                                    if (v < minDownPayment) v = minDownPayment;
                                                    const pct = ((v - minDownPayment) / range) * 100;
                                                    if (pct < 0 || pct > 100) continue;
                                                    const kVal = v / 1000;
                                                    const label = v === 0 ? '₹0' : `₹${kVal}K`;
                                                    milestones.push(
                                                        <div
                                                            key={`label-${v}`}
                                                            className="absolute flex flex-col items-center"
                                                            style={{
                                                                left: `${pct}%`,
                                                                top: '50%',
                                                                transform: 'translateX(-50%)',
                                                            }}
                                                        >
                                                            <div className="w-[1px] h-[6px] bg-slate-400 dark:bg-white/25 rounded-full" />
                                                            <span className="text-[6px] font-black text-slate-400 dark:text-white/25 mt-[1px] tabular-nums whitespace-nowrap">
                                                                {label}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                // Add subtle 1K tick dots
                                                for (let v = minDownPayment; v <= maxDownPayment; v += 1000) {
                                                    if (v % 5000 === 0) continue;
                                                    const pct = ((v - minDownPayment) / range) * 100;
                                                    if (pct <= fillPct) continue;
                                                    milestones.push(
                                                        <div
                                                            key={v}
                                                            className="absolute top-1/2 -translate-y-1/2 w-[1px] h-[2px] bg-slate-400 dark:bg-white opacity-10 rounded-full"
                                                            style={{ left: `${pct}%` }}
                                                        />
                                                    );
                                                }
                                            }
                                            return (
                                                <div className="relative h-[32px]">
                                                    <div className="absolute top-[4px] left-0 right-0">
                                                        <input
                                                            type="range"
                                                            min={minDownPayment}
                                                            max={maxDownPayment}
                                                            step={500}
                                                            value={currentDP}
                                                            onPointerDown={e => {
                                                                dpClickRef.current = {
                                                                    preVal: currentDP,
                                                                    time: Date.now(),
                                                                    x: e.clientX,
                                                                    targetVal: currentDP,
                                                                };
                                                            }}
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    dpClickRef.current.targetVal = val;
                                                                    if (setUserDownPayment) setUserDownPayment(val);
                                                                }
                                                            }}
                                                            onPointerUp={e => {
                                                                // Platform Discount / Surge Charges
                                                                const { preVal, time, x, targetVal } =
                                                                    dpClickRef.current;
                                                                const isClick =
                                                                    Date.now() - time < 300 &&
                                                                    Math.abs(e.clientX - x) < 5;
                                                                if (isClick && targetVal !== preVal) {
                                                                    if (setUserDownPayment) setUserDownPayment(preVal);
                                                                    animateDP(preVal, targetVal);
                                                                }
                                                            }}
                                                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer relative z-10"
                                                            style={{
                                                                background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${fillPct}%, ${trackBg} ${fillPct}%, ${trackBg} 100%)`,
                                                                accentColor: fillColor,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="absolute top-[4px] left-0 right-0 h-[28px] pointer-events-none">
                                                        {milestones}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Bottom Fade — skip for Gallery and Finance */}
                                {isActive &&
                                    card.id !== 'GALLERY' &&
                                    card.id !== 'FINANCE' &&
                                    card.id !== 'PRICING' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 dark:from-[#0b0d10] dark:via-[#0b0d10]/40 to-transparent pointer-events-none z-10" />
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
                                className="glass-panel bg-white/90 dark:bg-[#0b0d10]/40 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden"
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
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                                                {category.label}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {category.subtext}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={18}
                                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5">
                                        <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 space-y-4">
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
                                    ${isActive
                                        ? 'flex-[3] bg-white dark:bg-[#0b0d10] border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)]'
                                        : 'flex-[0.5] bg-white/40 dark:bg-white/[0.03] backdrop-blur-xl border-white/60 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/[0.06] shadow-lg shadow-black/[0.03]'
                                    }`}
                            >
                                {/* Header / Category Label (Always visible) */}
                                <div
                                    className={`p-6 flex items-center gap-3 transition-colors duration-500 shrink-0 ${isActive ? 'bg-brand-primary/[0.03] border-b border-slate-100 dark:border-white/5' : ''}`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                                        ${isActive ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-zinc-600'}`}
                                    >
                                        <Icon size={20} />
                                    </div>

                                    <div
                                        className={`flex flex-col transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                                            {category.label}
                                        </span>
                                        <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold whitespace-nowrap">
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
                                                <span className="text-2xl font-black uppercase tracking-[0.3em] text-slate-400/60 dark:text-white/10 -rotate-90 whitespace-nowrap">
                                                    {category.label}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Unified Bottom Fade (Active state) */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 dark:from-[#0b0d10] dark:via-[#0b0d10]/40 to-transparent pointer-events-none z-10" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* 5. Technical Specifications Section */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                    <motion.div
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
            <div
                className="fixed inset-x-0 bottom-0 z-[95]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="page-container mb-2 md:mb-4">
                    <div className="rounded-2xl md:rounded-full border border-white/10 bg-[#0b0d10]/95 backdrop-blur-xl shadow-2xl p-3 md:px-8 md:py-3 flex items-center justify-between gap-3 md:gap-6">
                        {/* Left: Product Identity (Desktop) + Price */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            {/* Product Thumbnail — Desktop only */}
                            <div
                                className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-3 min-w-0`}
                            >
                                <div className="w-12 h-12 relative flex items-center justify-center bg-white/10 rounded-xl overflow-hidden shrink-0">
                                    <Image
                                        src={getProductImage()}
                                        alt={displayModel}
                                        fill
                                        sizes="48px"
                                        className="object-contain"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-black text-white uppercase italic tracking-tight leading-none mt-0.5 truncate">
                                        {displayModel}{' '}
                                        <span className="text-[9px] font-bold text-slate-400 tracking-widest not-italic">
                                            {displayVariant}
                                        </span>
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full border border-white/20"
                                            style={{ backgroundColor: activeColorConfig.hex }}
                                        />
                                        <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase leading-none">
                                            {displayColor}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/10 ml-2" />
                            </div>

                            {/* Price Summary */}
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest text-slate-400 ${forceMobileLayout ? '' : 'md:hidden'}`}
                                    >
                                        On-Road
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline'} text-[10px] font-black uppercase tracking-widest text-slate-400`}
                                        >
                                            On-Road
                                        </span>
                                        {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                            <span className="text-[10px] text-slate-500 line-through font-mono">
                                                ₹{(totalOnRoad + totalSavings).toLocaleString()}
                                            </span>
                                        )}
                                        <span className="text-lg font-black text-[#FFD700] font-mono">
                                            ₹{displayOnRoad.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                    <>
                                        <div
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-6 bg-white/10`}
                                        />
                                        <span
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline'} text-[10px] font-black uppercase tracking-widest text-emerald-400`}
                                        >
                                            ✦ O'Club Privileged Saving: ₹
                                            {(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}
                                        </span>
                                    </>
                                )}

                                {!coinPricing && showOClubPrompt && (
                                    <>
                                        <div
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-6 bg-white/10`}
                                        />
                                        <span
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline-flex'} items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400`}
                                        >
                                            +13 O-Club Coins
                                        </span>
                                    </>
                                )}

                                {/* EMI & Tenure */}
                                <div
                                    className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-6 bg-white/10`}
                                />
                                <span
                                    className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline'} text-[10px] font-black uppercase tracking-widest text-white font-mono tabular-nums`}
                                >
                                    EMI ₹{footerEmi.toLocaleString()} / {emiTenure}mo
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions (Desktop) + CTA */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Action Icons — Desktop only */}
                            <div className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-1`}>
                                <ActionIcon
                                    icon={Share2}
                                    onClick={handleShareQuote}
                                    colorClass="text-slate-400 hover:text-white"
                                />
                                <ActionIcon
                                    icon={Heart}
                                    onClick={handleSaveQuote}
                                    colorClass="text-slate-400 hover:text-rose-500"
                                />
                            </div>
                            <button
                                onClick={handleBookingRequest}
                                disabled={
                                    isGated || (serviceability?.status === 'SET' && !serviceability?.isServiceable)
                                }
                                className={`h-11 px-5 md:px-6 font-black text-[11px] uppercase tracking-widest rounded-full shadow-xl flex items-center gap-2 transition-all group
                                ${isGated || (serviceability?.status === 'SET' && !serviceability?.isServiceable)
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 hover:-translate-y-0.5'
                                    }
                            `}
                            >
                                {isGated ? 'OPEN LEAD' : 'GET QUOTE'}
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
