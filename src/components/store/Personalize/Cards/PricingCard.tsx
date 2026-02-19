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
        isDeduction?: boolean;
        isTotal?: boolean;
        isInfo?: boolean;
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
    infoColorClass = 'text-slate-500 dark:text-slate-400',
    serviceability,
    coinPricing = null,
    showOClubPrompt = false,
    isGated = false,
}: PricingCardProps) {
    // If originalPrice not provided, fallback to total + savings
    const displayOriginal = originalPrice || totalOnRoad + totalSavings;

    return (
        <div className="md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none md:dark:backdrop-blur-none md:border-0 md:shadow-none rounded-[2.5rem] md:rounded-none overflow-hidden flex flex-col h-full">
            {/* Lead Name Banner */}
            {leadName && (
                <div className="mb-4 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl shrink-0">
                    <p className="text-[9px] font-black uppercase text-brand-primary tracking-widest leading-none mb-1">
                        Quoting for
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none">
                        {leadName}
                    </p>
                </div>
            )}

            {/* Price Breakup — stretched to fill content area */}
            <div className="flex-1 flex flex-col justify-evenly">
                {priceBreakup
                    .filter(i => !i.isTotal)
                    .map((item, idx) => (
                        <div key={idx} className="group/item relative">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {item.label}
                                </span>
                                <span
                                    className={`text-[11px] font-mono font-black ${item.isDeduction ? 'text-emerald-500' : item.isInfo ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-300'}`}
                                >
                                    {item.isDeduction ? '-' : ''}₹
                                    {typeof item.value === 'number'
                                        ? Math.abs(item.value).toLocaleString()
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
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
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
                                                            <span className="text-[8px] text-slate-400 dark:text-slate-400 max-w-[120px] truncate">
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
                                                            <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tight">
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
                                                        className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed"
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
                    ))}
            </div>
        </div>
    );
}
