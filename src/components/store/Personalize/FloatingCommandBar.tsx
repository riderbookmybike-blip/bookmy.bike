/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { Share2, Heart, ArrowRight, Wallet, Sparkles, Zap, Package, Shield, Youtube } from 'lucide-react';

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
}

const ActionIcon = ({
    icon: Icon,
    onClick,
    label,
    colorClass,
}: {
    icon: any;
    onClick: () => void;
    label: string;
    colorClass: string;
}) => (
    <button
        onClick={onClick}
        title={label}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${colorClass} hover:scale-110 active:scale-95`}
    >
        <Icon size={17} strokeWidth={2.2} />
    </button>
);

const PriceMetric = ({
    icon: Icon,
    label,
    amount,
    amountClass = 'text-slate-800',
    labelClass = 'text-slate-500',
}: {
    icon: any;
    label: string;
    amount: string;
    amountClass?: string;
    labelClass?: string;
}) => (
    <div className="flex flex-col items-center text-center px-6 py-1 min-w-[120px]">
        <p className={`text-[15px] font-black font-mono tabular-nums leading-none ${amountClass}`}>{amount}</p>
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
    handleSaveQuote,
    handleBookingRequest,
    serviceability,
    isGated,
    accessoriesCount = 0,
    accessoriesTotal = 0,
    insuranceTotal = 0,
    insuranceAddonsCount = 0,
    onOpenVideo,
}: FloatingCommandBarProps) {
    const isShareMode = isGated;
    const isServiceabilityBlocked = serviceability?.status === 'SET' && !serviceability?.isServiceable;
    const isDisabled = !isShareMode && isServiceabilityBlocked;
    const primaryAction = isShareMode ? handleShareQuote : handleBookingRequest;
    const primaryLabel = isDisabled ? 'NOT SERVICEABLE' : isShareMode ? 'SHARE QUOTE' : 'GET QUOTE';
    const privilegedSavings = Math.max(0, totalSavings + (coinPricing?.discount || 0));
    const onRoadBase = Math.max(0, displayOnRoad + privilegedSavings);
    const showDesktopBreakdown = !forceMobileLayout;

    // Insurance addons only — show ₹0 if none selected
    const insuranceAddonAmount = insuranceAddonsCount > 0 ? insuranceTotal : 0;

    const desktopMetrics: {
        key: string;
        icon: any;
        label: string;
        amount: string;
        amountClass?: string;
        labelClass?: string;
    }[] = [
        {
            key: 'on-road',
            icon: Wallet,
            label: 'On-Road',
            amount: `₹ ${onRoadBase.toLocaleString('en-IN')}`,
        },
        ...(accessoriesCount > 0
            ? [
                  {
                      key: 'accessories',
                      icon: Package,
                      label: `${accessoriesCount} Accessories`,
                      amount: `+ ₹ ${accessoriesTotal.toLocaleString('en-IN')}`,
                      amountClass: 'text-slate-700',
                      labelClass: 'text-slate-500',
                  },
              ]
            : []),
        {
            key: 'insurance-addons',
            icon: Shield,
            label: insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Ins. Addons` : 'Ins. Addons',
            amount: `₹ ${Math.round(insuranceAddonAmount).toLocaleString('en-IN')}`,
            amountClass: insuranceAddonAmount > 0 ? 'text-blue-600' : 'text-slate-400',
            labelClass: insuranceAddonAmount > 0 ? 'text-blue-500' : 'text-slate-400',
        },
        {
            key: 'privileged',
            icon: Sparkles,
            label: "O'Circle Benefit",
            amount: `− ₹ ${privilegedSavings.toLocaleString('en-IN')}`,
            amountClass: 'text-emerald-600',
            labelClass: 'text-emerald-600',
        },
        {
            key: 'final-offer',
            icon: Zap,
            label: 'Final Offer',
            amount: `₹ ${displayOnRoad.toLocaleString('en-IN')}`,
            amountClass: 'text-[#C99700]',
            labelClass: 'text-brand-primary',
        },
    ];

    return (
        <div className="fixed inset-x-0 bottom-0 z-[95]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="page-container mb-2 md:mb-4">
                <div className="relative overflow-hidden rounded-2xl md:rounded-full border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_-4px_40px_rgba(15,23,42,0.10),0_8px_30px_rgba(15,23,42,0.08)]">
                    {/* Subtle gradient overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(255,255,255,0.2)_50%,rgba(255,215,0,0.03))]" />

                    <div className="relative z-10 p-3 md:px-6 md:py-3.5 flex items-center justify-between gap-3">
                        {/* ═══ SECTION 1: Vehicle Identity (Left) ═══ */}
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
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-none mt-0.5 truncate">
                                    {displayModel}{' '}
                                    <span className="text-[10px] font-semibold text-slate-500 tracking-[0.08em] not-italic">
                                        {displayVariant}
                                    </span>
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-sm"
                                        style={{ backgroundColor: activeColorConfig.hex }}
                                    />
                                    <span className="text-[9px] font-semibold tracking-[0.08em] text-slate-500 uppercase leading-none">
                                        {displayColor}
                                    </span>
                                </div>
                            </div>
                            {/* Section Divider */}
                            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent ml-1" />
                        </div>

                        {/* ═══ SECTION 2: Pricing Details (Center) ═══ */}
                        <div className="flex-1 flex items-center justify-center min-w-0">
                            {showDesktopBreakdown && (
                                <div className="hidden md:flex items-center divide-x divide-slate-200/70">
                                    {desktopMetrics.map(metric => (
                                        <PriceMetric
                                            key={metric.key}
                                            icon={metric.icon}
                                            label={metric.label}
                                            amount={metric.amount}
                                            amountClass={metric.amountClass}
                                            labelClass={metric.labelClass}
                                        />
                                    ))}
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
                                    <span className="text-lg font-black text-[#C99700] font-mono">
                                        ₹ {displayOnRoad.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ═══ SECTION 3: Actions + CTA (Right) ═══ */}
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            {/* Section Divider */}
                            <div
                                className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent`}
                            />

                            {/* Action Icons — Desktop only */}
                            <div className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-1`}>
                                {onOpenVideo && (
                                    <ActionIcon
                                        icon={Youtube}
                                        onClick={onOpenVideo}
                                        label="Watch Video"
                                        colorClass="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    />
                                )}
                                <ActionIcon
                                    icon={Share2}
                                    onClick={handleShareQuote}
                                    label="Share Quote"
                                    colorClass="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                />
                                <ActionIcon
                                    icon={Heart}
                                    onClick={handleSaveQuote}
                                    label="Save Quote"
                                    colorClass="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                />
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={primaryAction}
                                disabled={isDisabled}
                                className={`h-11 md:h-12 px-5 md:px-8 font-black text-[11px] md:text-xs uppercase tracking-[0.12em] rounded-full flex items-center gap-2.5 transition-all group
                                    ${
                                        isDisabled
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-[#FFD700] hover:bg-[#F4B000] text-slate-900 shadow-[0_4px_20px_rgba(255,215,0,0.3)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.45)] hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                {primaryLabel}
                                <ArrowRight
                                    size={15}
                                    className="group-hover:translate-x-1 transition-transform duration-200"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
