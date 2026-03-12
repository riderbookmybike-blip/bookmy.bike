/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { Share2, Wallet, Zap, Package, Shield, CalendarClock, Building2 } from 'lucide-react';
import { OCircleLogo } from '@/components/common/OCircleLogo';
import { Logo } from '@/components/brand/Logo';
import { coinsNeededForPrice } from '@/lib/oclub/coin';

export interface FloatingCommandBarProps {
    getProductImage: () => string;
    displayModel: string;
    displayVariant: string;
    displayColor: string;
    activeColorConfig: { hex: string };
    displayOnRoad: number;
    totalOnRoad: number;
    totalSavings: number;
    coinPricing: any;
    forceMobileLayout: boolean;
    handleShareQuote: () => void;
    handleSaveQuote: () => void;
    handleBookingRequest: () => void;
    serviceability: any;
    isGated: boolean;
    accessoriesCount?: number;
    accessoriesTotal?: number;
    insuranceTotal?: number;
    insuranceAddonsCount?: number;
    onOpenVideo?: () => void;
    deliveryByLabel?: string | null;
    studioIdLabel?: string | null;
    dealerIdLabel?: string | null;
    studioDistanceKm?: number | null;
}

const PriceMetric = ({
    icon: Icon,
    label,
    amount,
    amountClass = 'text-slate-800',
    labelClass = 'text-slate-500',
    bCoin,
}: {
    icon: any;
    label: string;
    amount: string;
    amountClass?: string;
    labelClass?: string;
    bCoin?: number;
}) => (
    <div className="flex flex-col items-center text-center px-6 py-1 min-w-[120px]">
        <div className="flex items-end gap-1.5 justify-center">
            <p className={`text-[15px] font-black font-mono tabular-nums leading-none ${amountClass}`}>{amount}</p>
            {bCoin !== undefined && (
                <div className="flex items-center gap-0.5 pb-[1px]">
                    <Logo variant="icon" size={9} customColor="#FFD700" />
                    <span className="text-[11px] font-bold text-[#FFD700] font-mono tabular-nums leading-none">
                        {bCoin.toLocaleString('en-IN')}
                    </span>
                </div>
            )}
        </div>
        <p
            className={`mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] ${labelClass}`}
        >
            <Icon size={10} />
            {label}
        </p>
    </div>
);

export default function FloatingCommandBar({
    getProductImage,
    displayModel,
    displayVariant,
    displayColor,
    activeColorConfig,
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    coinPricing,
    forceMobileLayout,
    handleShareQuote,
    handleBookingRequest,
    serviceability,
    isGated,
    accessoriesCount = 0,
    accessoriesTotal = 0,
    insuranceTotal = 0,
    insuranceAddonsCount = 0,
    deliveryByLabel = null,
    studioIdLabel = null,
    dealerIdLabel = null,
    studioDistanceKm = null,
}: FloatingCommandBarProps) {
    const isShareMode = isGated;
    const isServiceabilityBlocked = serviceability?.status === 'SET' && !serviceability?.isServiceable;
    const isDisabled = !isShareMode && isServiceabilityBlocked;
    const primaryAction = isShareMode ? handleShareQuote : handleBookingRequest;
    const privilegedSavings = Math.max(0, totalSavings + (coinPricing?.discount || 0));
    const bCoinDiscount = coinPricing?.discount || 0;
    const onRoadBase = Math.max(0, displayOnRoad + privilegedSavings);
    const showDesktopBreakdown = !forceMobileLayout;
    const displayStudioCode = (() => {
        const normalize = (value?: string | null) =>
            String(value || '')
                .trim()
                .toUpperCase();
        const formatNine = (value?: string | null) => {
            const raw = String(value || '')
                .replace(/[^A-Z0-9]/gi, '')
                .toUpperCase();
            if (raw.length < 9) return null;
            return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 9)}`;
        };

        const studioRaw = normalize(studioIdLabel);
        if (/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(studioRaw)) return studioRaw;
        const studioFormatted = formatNine(studioRaw);
        if (studioFormatted) return studioFormatted;

        const dealerRaw = normalize(dealerIdLabel);
        if (/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(dealerRaw)) return dealerRaw;
        const dealerFormatted = formatNine(dealerRaw);
        if (dealerFormatted) return dealerFormatted;

        return studioRaw || dealerRaw || 'NA';
    })();
    const distanceLabel =
        Number.isFinite(Number(studioDistanceKm)) && Number(studioDistanceKm) >= 0
            ? `${Number(studioDistanceKm).toFixed(1)} km away`
            : null;

    // Insurance addons only — show ₹0 if none selected
    const insuranceAddonAmount = insuranceAddonsCount > 0 ? insuranceTotal : 0;

    const desktopMetrics: {
        key: string;
        icon: any;
        label: string;
        amount: string;
        amountClass?: string;
        labelClass?: string;
        bCoin?: number;
    }[] = [
        {
            key: 'on-road',
            icon: Wallet,
            label: 'On-Road',
            amount: `₹ ${onRoadBase.toLocaleString('en-IN')}`,
        },
        {
            key: 'accessories',
            icon: Package,
            label: accessoriesCount > 0 ? `${accessoriesCount} Accessories` : 'Accessories',
            amount: accessoriesCount > 0 ? `+ ₹ ${accessoriesTotal.toLocaleString('en-IN')}` : `₹ 0`,
            amountClass: accessoriesCount > 0 ? 'text-slate-700' : 'text-slate-400',
            labelClass: accessoriesCount > 0 ? 'text-slate-500' : 'text-slate-400',
        },
        {
            key: 'insurance-addons',
            icon: Shield,
            label: insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Ins. Addons` : 'Ins. Addons',
            amount: `₹ ${Math.round(insuranceAddonAmount).toLocaleString('en-IN')}`,
            amountClass: insuranceAddonAmount > 0 ? 'text-blue-600' : 'text-slate-400',
            labelClass: insuranceAddonAmount > 0 ? 'text-blue-500' : 'text-slate-400',
        },
    ];

    return (
        <div className="fixed inset-x-0 top-[var(--header-h)] z-[95]">
            <div className="page-container mt-4 md:mt-6">
                <div className="relative overflow-hidden rounded-2xl md:rounded-full border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_4px_40px_rgba(15,23,42,0.10),0_8px_30px_rgba(15,23,42,0.08)]">
                    {/* Subtle gradient overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(255,255,255,0.2)_50%,rgba(255,215,0,0.03))]" />

                    <div className="relative z-10 p-3 md:px-6 md:py-3.5 flex items-center justify-between gap-3">
                        {/* ═══ SECTION 1: Vehicle Identity (Left) — 3 rows: Model, Variant, Color ═══ */}
                        <div
                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-3.5 min-w-0 shrink-0`}
                        >
                            <div className="w-12 h-12 relative flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden shrink-0">
                                <Image
                                    src={getProductImage()}
                                    alt={displayModel}
                                    fill
                                    sizes="48px"
                                    className="object-contain"
                                />
                            </div>
                            <div className="flex flex-col min-w-0 gap-0.5">
                                {/* Row 1: Model */}
                                <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-none truncate">
                                    {displayModel}
                                </span>
                                {/* Row 2: Variant */}
                                <span className="text-[10px] font-semibold text-slate-500 tracking-[0.08em] leading-none truncate">
                                    {displayVariant}
                                </span>
                                {/* Row 3: Color */}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-sm"
                                        style={{ backgroundColor: activeColorConfig.hex }}
                                    />
                                    <span className="text-[9px] font-semibold tracking-[0.08em] text-slate-400 uppercase leading-none truncate">
                                        {displayColor}
                                    </span>
                                </div>
                            </div>
                            {/* Section Divider */}
                            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent ml-1" />
                        </div>

                        {/* ═══ SECTION 2: Pricing Details (Center) ═══ */}
                        <div className="flex-1 flex items-center min-w-0">
                            {showDesktopBreakdown && (
                                <div className="hidden md:flex items-stretch gap-1.5 w-full">
                                    {desktopMetrics.map(metric => (
                                        <div
                                            key={metric.key}
                                            className={`flex-1 flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-sm transition-all duration-200`}
                                        >
                                            <div className="flex items-end gap-1.5 justify-center">
                                                <p
                                                    className={`text-[13px] font-black font-mono tabular-nums leading-none ${metric.amountClass || 'text-slate-800'}`}
                                                >
                                                    {metric.amount}
                                                </p>
                                            </div>
                                            <p
                                                className={`mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] ${metric.labelClass || 'text-slate-500'}`}
                                            >
                                                <metric.icon size={9} />
                                                {metric.label}
                                            </p>
                                        </div>
                                    ))}

                                    {/* O'Circle Privileged — emerald card */}
                                    <div className="flex-[1.2] flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border border-emerald-300/70 hover:border-emerald-400 hover:shadow-sm transition-all duration-200">
                                        <p className="text-[13px] font-black font-mono tabular-nums leading-none text-emerald-600">
                                            − ₹ {Math.max(0, totalSavings).toLocaleString('en-IN')}
                                        </p>
                                        <div className="mt-1 inline-flex items-center gap-1">
                                            <OCircleLogo size={10} color="#7EB4E2" strokeWidth={16} />
                                            <span className="text-[8px] font-bold tracking-[-0.03em]">
                                                <span className="text-[#7EB4E2]">O&apos;</span>
                                                <span className="text-slate-700">Circle</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* bCoin Wallet — amber card */}
                                    {bCoinDiscount > 0 && (
                                        <div className="flex-[1.2] flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border border-amber-300/70 hover:border-amber-400 hover:shadow-sm transition-all duration-200">
                                            <p className="text-[13px] font-black font-mono tabular-nums leading-none text-amber-600">
                                                − ₹ {bCoinDiscount.toLocaleString('en-IN')}
                                            </p>
                                            <div className="mt-1 inline-flex items-center gap-1">
                                                <Logo variant="icon" size={9} customColor="#C99700" />
                                                <span className="text-[8px] font-black text-slate-900 leading-none">
                                                    Wallet
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Final Offer — gold accent card */}
                                    <div className="flex-[2] flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border border-[#FFD700]/50 hover:border-[#FFD700] hover:shadow-sm transition-all duration-200">
                                        <div className="flex items-center gap-2 justify-center">
                                            <p className="text-[14px] font-black font-mono tabular-nums leading-none text-[#C99700]">
                                                ₹ {displayOnRoad.toLocaleString('en-IN')}
                                            </p>
                                            <div className="flex items-center gap-0.5">
                                                <Logo variant="icon" size={12} customColor="#FFD700" />
                                                <span className="text-[14px] font-black text-[#FFD700] font-mono tabular-nums leading-none">
                                                    {coinsNeededForPrice(displayOnRoad).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] text-brand-primary">
                                            <Zap size={9} />
                                            Final Offer
                                        </p>
                                    </div>

                                    {/* Delivery + Studio Info */}
                                    <div className="flex-[1.8] flex flex-col items-start justify-center px-3 py-2 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                                        <p className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
                                            <CalendarClock size={9} />
                                            Delivery By
                                        </p>
                                        <p className="mt-0.5 text-[11px] font-black text-slate-900 leading-none">
                                            {deliveryByLabel || 'TBD'}
                                        </p>
                                        <p className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
                                            <Building2 size={9} />
                                            Studio ID
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <p className="text-[10px] font-black text-slate-700 leading-none">
                                                {displayStudioCode}
                                            </p>
                                            {distanceLabel && (
                                                <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-500 leading-none">
                                                    {distanceLabel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mobile-only compact price */}
                            <div className={`${showDesktopBreakdown ? 'md:hidden' : ''} flex flex-col`}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Final Offer
                                </span>
                                <div className="flex items-center gap-2">
                                    {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                        <span className="text-[10px] text-slate-400 line-through font-mono">
                                            ₹ {(totalOnRoad + totalSavings).toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    <div className="flex items-baseline gap-1.5 mt-0.5">
                                        <span className="text-lg font-black text-[#C99700] font-mono leading-none">
                                            ₹ {displayOnRoad.toLocaleString('en-IN')}
                                        </span>
                                        <div className="flex items-center gap-0.5">
                                            <Logo variant="icon" size={10} customColor="#FFD700" />
                                            <span className="text-[12px] font-bold text-[#FFD700] font-mono tabular-nums leading-none">
                                                {coinsNeededForPrice(displayOnRoad).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ SECTION 3: CTA Button Only (Right) ═══ */}
                        <div className="flex items-center shrink-0">
                            {/* CTA Button — icon-only circle with pulse ring */}
                            <div className="relative">
                                {!isDisabled && (
                                    <span
                                        className="absolute inset-0 rounded-full bg-[#FFD700]/30 animate-ping"
                                        style={{ animationDuration: '2.5s' }}
                                    />
                                )}
                                <button
                                    onClick={primaryAction}
                                    disabled={isDisabled}
                                    title={isDisabled ? 'Not Serviceable' : isShareMode ? 'Share Quote' : 'Get Quote'}
                                    className={`relative w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 group
                                        ${
                                            isDisabled
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-[#FFD700] hover:bg-[#F4B000] text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.3)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.45)] hover:-translate-y-0.5 active:scale-95'
                                        }
                                    `}
                                >
                                    <Share2
                                        size={17}
                                        strokeWidth={2.5}
                                        className="group-hover:scale-110 transition-transform duration-200"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
