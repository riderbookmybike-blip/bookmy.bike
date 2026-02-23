/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export interface FlatItemListProps {
    items: any[];
    getSelected: (id: string) => boolean;
    onToggle: (id: string) => void;
    isMandatory?: boolean;
    isRadio?: boolean;
}

const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

/**
 * Shared flat-row renderer for Insurance add-ons, Registration options,
 * Services, and Warranty items. Renders a compact list with checkboxes/radios,
 * breakdown tooltips, and discount badges.
 */
export default function FlatItemList({
    items,
    getSelected,
    onToggle,
    isMandatory = false,
    isRadio = false,
}: FlatItemListProps) {
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
                        className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${
                            selected
                                ? 'border-l-emerald-500 bg-emerald-50/50'
                                : 'border-l-transparent hover:bg-slate-50'
                        } ${idx > 0 ? 'border-t border-t-slate-100/80' : ''} ${isMandatory ? 'cursor-default' : ''}`}
                    >
                        {/* Checkbox / Radio */}
                        <div
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${
                                selected
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                    : 'border-2 border-slate-300 group-hover:border-emerald-400'
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
                                className={`text-[12px] font-semibold leading-tight truncate ${
                                    selected ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {toTitle(item.displayName || item.name)}
                            </p>
                            {item.description && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
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
                                            <span className="text-[9px] text-slate-400">{b.label || b.name}</span>
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
                                className={`text-[13px] font-extrabold tabular-nums ${
                                    selected ? 'text-emerald-600' : 'text-slate-800'
                                }`}
                            >
                                {finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
                            </span>
                            {hasDiscount && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 line-through tabular-nums">
                                        ₹{item.price.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full leading-none">
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
