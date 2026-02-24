/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { Share2, Heart, ArrowRight, Wallet, Sparkles, Zap } from 'lucide-react';

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
}

const ActionIcon = ({ icon: Icon, onClick, colorClass }: { icon: any; onClick: () => void; colorClass: string }) => (
    <button
        onClick={onClick}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${colorClass} hover:bg-slate-100`}
    >
        <Icon size={16} />
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
    <div className="min-w-[90px] px-2.5 py-1.5 rounded-xl bg-white/72 border border-slate-200/70 shadow-sm">
        <p className={`text-[14px] font-black font-mono tabular-nums leading-none ${amountClass}`}>{amount}</p>
        <p
            className={`mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.09em] ${labelClass}`}
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
}: FloatingCommandBarProps) {
    const isShareMode = isGated;
    const isServiceabilityBlocked = serviceability?.status === 'SET' && !serviceability?.isServiceable;
    const isDisabled = !isShareMode && isServiceabilityBlocked;
    const primaryAction = isShareMode ? handleShareQuote : handleBookingRequest;
    const primaryLabel = isDisabled ? 'NOT SERVICEABLE' : isShareMode ? 'SHARE QUOTE' : 'GET QUOTE';
    const privilegedSavings = Math.max(0, totalSavings + (coinPricing?.discount || 0));
    const onRoadBase = Math.max(0, displayOnRoad + privilegedSavings);
    const showDesktopBreakdown = !forceMobileLayout;

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
                <div className="relative overflow-hidden rounded-2xl md:rounded-full border border-white/80 bg-white/58 backdrop-blur-3xl shadow-[0_10px_34px_rgba(15,23,42,0.12)]">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_65%)]" />
                    <div className="relative z-10 p-3 md:px-8 md:py-3 flex items-center justify-between gap-3 md:gap-6">
                        {/* Left: Product Identity (Desktop) + Price */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            {/* Product Thumbnail — Desktop only */}
                            <div
                                className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-3 min-w-0`}
                            >
                                <div className="w-12 h-12 relative flex items-center justify-center bg-slate-100/90 border border-slate-200 rounded-xl overflow-hidden shrink-0">
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
                                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                            style={{ backgroundColor: activeColorConfig.hex }}
                                        />
                                        <span className="text-[9px] font-semibold tracking-[0.08em] text-slate-600 uppercase leading-none">
                                            {displayColor}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 ml-2" />
                            </div>

                            {/* Price Summary */}
                            <div className="flex items-center gap-3 md:gap-4">
                                {showDesktopBreakdown && (
                                    <div className="hidden md:flex items-center gap-2">
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
                        </div>

                        {/* Right: Actions (Desktop) + CTA */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Action Icons — Desktop only */}
                            <div className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-1`}>
                                <ActionIcon
                                    icon={Share2}
                                    onClick={handleShareQuote}
                                    colorClass="text-slate-500 hover:text-slate-900"
                                />
                                <ActionIcon
                                    icon={Heart}
                                    onClick={handleSaveQuote}
                                    colorClass="text-slate-400 hover:text-rose-500"
                                />
                            </div>
                            <button
                                onClick={primaryAction}
                                disabled={isDisabled}
                                className={`h-11 px-5 md:px-6 font-black text-[11px] uppercase tracking-[0.12em] rounded-full shadow-xl flex items-center gap-2 transition-all group
                            ${
                                isDisabled
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 hover:-translate-y-0.5'
                            }
                        `}
                            >
                                {primaryLabel}
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
