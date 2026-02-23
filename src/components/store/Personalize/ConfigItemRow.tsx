/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { CheckCircle2, Plus, Info } from 'lucide-react';
import type { BreakdownEntry } from '../DesktopPDP.types';

export interface ConfigItemRowProps {
    item: {
        id: string;
        name: string;
        displayName?: string;
        description?: string;
        price: number;
        discountPrice?: number;
    };
    isSelected: boolean;
    onToggle?: () => void;
    isMandatory?: boolean;
    isRadio?: boolean;
    breakdown?: BreakdownEntry[];
    /** Current quantity — pass from parent's quantities map */
    quantity?: number;
}

/**
 * Reusable configuration item card used by both Tab components
 * and the accordion category renderers in DesktopPDP.
 */
export default function ConfigItemRow({
    item,
    isSelected,
    onToggle,
    isMandatory = false,
    isRadio = false,
    breakdown,
    quantity: rawQuantity,
}: ConfigItemRowProps) {
    const quantity = isSelected ? (rawQuantity ?? 1) : 0;
    const finalPrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;

    return (
        <div className="group/item relative h-full">
            <button
                onClick={() => !isMandatory && onToggle && onToggle()}
                disabled={isMandatory}
                className={`w-full h-full p-4 rounded-3xl border transition-all duration-500 flex flex-col justify-between gap-4 group/btn
                    ${
                        isSelected
                            ? 'bg-brand-primary/[0.08] border-brand-primary/40 shadow-[0_15px_40px_rgba(255,215,0,0.1)]'
                            : 'bg-white/40 border-slate-100 hover:border-slate-200 hover:bg-white'
                    } ${isMandatory ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5'}`}
            >
                <div className="w-full flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0
                            ${
                                isSelected
                                    ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-105'
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
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
                                className={`text-xs font-black uppercase tracking-tight leading-tight mb-1 truncate w-full ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}
                            >
                                {item.displayName || item.name}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span
                                    className={`text-sm font-black font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-900'}`}
                                >
                                    ₹{finalPrice.toLocaleString()}
                                </span>
                                {item.discountPrice && item.discountPrice > 0 && (
                                    <span className="text-[10px] text-slate-400 line-through font-bold">
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
                        className={`text-[10px] leading-relaxed text-left line-clamp-2 ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}
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
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
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
}
