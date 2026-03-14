/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { Zap, Info } from 'lucide-react';

interface PricingCardProps {
    product: any;
    variantName: string;
    activeColor: { name: string; hex: string };
    totalOnRoad: number;
    originalPrice?: number;
    totalSavings?: number;
    priceBreakup: {
        label: string;
        value: number | string;
        caption?: string; // New: Second row detail
        isDeduction?: boolean;
        isTotal?: boolean;
        isInfo?: boolean;
        isSpacer?: boolean;
        helpText?: string[] | string;
        breakdown?: { label: string; amount: number }[];
    }[];
    productImage: string;
    pricingSource?: string;
    leadName?: string;
    infoColorClass?: string;
    serviceability?: {
        isServiceable: boolean;
        status: string;
        pincode?: string;
        taluka?: string;
        insuranceRequiredItems?: any; // Assuming 'any' based on the instruction's lack of type
        warrantyItems?: any; // Assuming 'any'
        initialFinance?: any; // Assuming 'any'
    };
    coinPricing?: {
        coinsUsed: number;
        discount: number;
        effectivePrice: number;
    } | null;
    showOClubPrompt?: boolean;
    isGated?: boolean;
    deliveryByLabel?: string | null;
    deliveryLabel?: string | null;
    studioIdLabel?: string | null;
    studioDistanceKm?: number | null;
}

export default function PricingCard({
    product,
    variantName,
    activeColor,
    totalOnRoad,
    originalPrice,
    totalSavings = 0,
    priceBreakup,
    productImage,
    pricingSource,
    leadName,
    infoColorClass = 'text-slate-500',
    serviceability,
    coinPricing = null,
    showOClubPrompt = false,
    isGated = false,
    deliveryByLabel = null,
    deliveryLabel = 'Delivery By',
    studioIdLabel = null,
    studioDistanceKm = null,
}: PricingCardProps) {
    // If originalPrice not provided, fallback to total + savings
    const displayOriginal = originalPrice || totalOnRoad + totalSavings;
    const distanceLabel =
        Number.isFinite(Number(studioDistanceKm)) && Number(studioDistanceKm) >= 0
            ? `${Number(studioDistanceKm).toFixed(1)} km away`
            : null;

    return (
        <div className="md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none rounded-[2.5rem] md:rounded-none overflow-hidden flex flex-col h-full">
            {/* Lead Name Banner */}
            {leadName && (
                <div className="mb-4 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl shrink-0">
                    <p className="text-[9px] font-black uppercase text-brand-primary tracking-widest leading-none mb-1">
                        Quoting for
                    </p>
                    <p className="text-lg font-black text-slate-900 uppercase leading-none">{leadName}</p>
                </div>
            )}

            {/* Redundant top grid removed - Info now integrated into priceBreakup items */}

            {/* Price Breakup — stretched to fill content area */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {priceBreakup
                    .filter(i => !i.isTotal)
                    .map((item, idx) =>
                        item.isSpacer ? (
                            <div key={idx} className="h-px border-b border-slate-100/50 my-1" />
                        ) : (
                            <div
                                key={idx}
                                className={`group/item relative py-1 px-1 -mx-1 rounded-xl hover:bg-slate-50/50 transition-all ${
                                    (item as any).isGrossTotal
                                        ? 'mt-1 pt-2 border-t border-slate-200 hover:bg-amber-50/30'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-baseline gap-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 group-hover/item:text-brand-primary transition-colors leading-tight">
                                            {item.label}
                                        </span>
                                        {item.caption && (
                                            <span className="text-[8.5px] font-medium text-slate-400 leading-none">
                                                {item.caption}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[11px] font-mono font-black tabular-nums transition-all ${
                                            (item as any).isGrossTotal
                                                ? 'text-slate-800'
                                                : item.isDeduction
                                                  ? 'text-emerald-600'
                                                  : item.isInfo
                                                    ? 'text-slate-600'
                                                    : 'text-slate-900 group-hover/item:text-brand-primary'
                                        }`}
                                    >
                                        {item.isDeduction ? '-' : ''}
                                        {item.isInfo ? '' : '₹'}
                                        {typeof item.value === 'number'
                                            ? Math.abs(item.value).toLocaleString('en-IN')
                                            : item.value}
                                    </span>
                                </div>

                                {/* Enhanced Tooltip */}
                                {(item.breakdown || item.helpText || (item as any).comparisonOptions) && (
                                    <div className="absolute right-0 top-full mt-2 z-50 w-max min-w-[200px] max-w-[320px] p-3 rounded-xl bg-[#15191e] border border-white/10 shadow-2xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 pointer-events-none origin-top-right">
                                        {/* Triangle pointer */}
                                        <div className="absolute -top-1 right-4 w-2 h-2 bg-[#15191e] border-l border-t border-white/10 rotate-45" />

                                        <div className="space-y-3 relative z-10">
                                            <div className="pb-2 border-b border-white/5">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-0.5">
                                                    {item.label}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-medium">
                                                    Breakdown & Details
                                                </p>
                                            </div>

                                            {/* Comparison Cards (The "Teen Card" View) */}
                                            {(item as any).comparisonOptions && (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {(item as any).comparisonOptions.map((opt: any) => (
                                                        <div
                                                            key={opt.id}
                                                            className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between gap-4"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-white uppercase tracking-tighter">
                                                                    {opt.name.replace(' Registration', '')}
                                                                </span>
                                                                <span className="text-[8px] text-slate-400 max-w-[120px] truncate">
                                                                    {opt.description}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-brand-primary tabular-nums">
                                                                ₹{opt.price.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Standard Breakdown List */}
                                            {item.breakdown &&
                                                item.breakdown.length > 0 &&
                                                !(item as any).comparisonOptions && (
                                                    <div className="space-y-1.5">
                                                        {item.breakdown.map((b: any, bIdx: number) => (
                                                            <div
                                                                key={bIdx}
                                                                className="flex justify-between items-center text-[9px]"
                                                            >
                                                                <span className="text-slate-600 font-bold uppercase tracking-tight">
                                                                    {b.label}
                                                                </span>
                                                                <span className="text-white font-mono">
                                                                    ₹{(b.amount || b.value || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                            {/* Help Text Lines */}
                                            {item.helpText && Array.isArray(item.helpText) && (
                                                <div className="space-y-1">
                                                    {item.helpText.map((text, hIdx) => (
                                                        <p
                                                            key={hIdx}
                                                            className="text-[9px] text-slate-500 leading-relaxed"
                                                        >
                                                            • {text}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
            </div>
        </div>
    );
}
