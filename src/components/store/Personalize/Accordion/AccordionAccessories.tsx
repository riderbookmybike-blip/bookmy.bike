/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Package } from 'lucide-react';

export interface AccordionAccessoriesProps {
    activeAccessories: any[];
    selectedAccessories: string[];
    quantities: Record<string, number>;
    toggleAccessory: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
}

const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default function AccordionAccessories({
    activeAccessories,
    selectedAccessories,
    quantities,
    toggleAccessory,
    updateQuantity,
}: AccordionAccessoriesProps) {
    // Selected items float to top, then sort by price within each group
    const sortedAccessories = [...activeAccessories].sort((a: any, b: any) => {
        const aSelected = a.isMandatory || selectedAccessories.includes(a.id) ? 1 : 0;
        const bSelected = b.isMandatory || selectedAccessories.includes(b.id) ? 1 : 0;
        if (aSelected !== bSelected) return bSelected - aSelected;
        return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
    });

    return (
        <>
            {sortedAccessories.map((acc: any, idx: number) => {
                const isSelected = acc.isMandatory || selectedAccessories.includes(acc.id);
                const finalPrice = acc.discountPrice != null && acc.discountPrice >= 0 ? acc.discountPrice : acc.price;
                const hasDiscount =
                    acc.discountPrice != null && acc.discountPrice >= 0 && acc.discountPrice < acc.price;
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
                        className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${
                            isSelected
                                ? 'border-l-emerald-500 bg-emerald-50/50'
                                : 'border-l-transparent hover:bg-slate-50'
                        } ${idx > 0 ? 'border-t border-t-slate-100/80' : ''}`}
                    >
                        {/* Checkbox */}
                        <div
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                    : 'border-2 border-slate-300 group-hover:border-emerald-400'
                            }`}
                        >
                            {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                        </div>

                        {/* Image */}
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all ${
                                skuImg
                                    ? 'bg-white border border-slate-100 shadow-sm'
                                    : 'bg-slate-50 border border-dashed border-slate-200'
                            }`}
                        >
                            {skuImg ? (
                                <Image src={skuImg} alt={acc.name} width={36} height={36} className="object-contain" />
                            ) : (
                                <Package size={16} className="text-slate-300" />
                            )}
                        </div>

                        {/* Name — three lines */}
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-[12px] font-black tracking-tight leading-tight truncate ${
                                    isSelected ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {line1 || toTitle(acc.name)}
                            </p>
                            {subVariant && (
                                <p
                                    className={`text-[11px] font-medium mt-0.5 truncate leading-tight ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}
                                >
                                    {toTitle(subVariant)}
                                </p>
                            )}
                            {line3 && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">{line3}</p>
                            )}
                        </div>

                        {/* Qty ± (Removed because maxQty is practically 1 for accessories) */}

                        {/* Price block */}
                        <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                            <span
                                className={`text-[13px] font-extrabold tabular-nums ${
                                    isSelected ? 'text-emerald-600' : 'text-slate-800'
                                }`}
                            >
                                {finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
                            </span>
                            {hasDiscount && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 line-through tabular-nums">
                                        ₹{acc.price.toLocaleString()}
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
