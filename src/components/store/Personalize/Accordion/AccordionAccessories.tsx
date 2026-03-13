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
        const aSelected = selectedAccessories.includes(a.id) ? 1 : 0;
        const bSelected = selectedAccessories.includes(b.id) ? 1 : 0;
        if (aSelected !== bSelected) return bSelected - aSelected;
        return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
    });

    const mandatory = sortedAccessories.filter((a: any) => a.isMandatory);
    const optional = sortedAccessories.filter((a: any) => !a.isMandatory);

    const renderAccessoryRow = (acc: any, idx: number, isLastInCategory: boolean) => {
        const isSelected = selectedAccessories.includes(acc.id);
        const finalPrice = acc.discountPrice != null && acc.discountPrice >= 0 ? acc.discountPrice : acc.price;
        const hasDiscount = acc.discountPrice != null && acc.discountPrice >= 0 && acc.discountPrice < acc.price;
        const savings = hasDiscount ? acc.price - acc.discountPrice : 0;
        const savingsPct = hasDiscount ? Math.round((savings / acc.price) * 100) : 0;
        const skuImg = acc.image || null;

        const line1 = toTitle(acc.productGroup || acc.name);
        const rawName = acc.name || '';
        const groupName = acc.productGroup || '';
        const subVariant = rawName
            .replace(new RegExp(`^${groupName}\\s*`, 'i'), '')
            .replace(/\s+for\s+.*/i, '')
            .trim();
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
                        ? 'border-l-brand-primary bg-brand-primary/[0.02]'
                        : 'border-l-transparent hover:bg-slate-50'
                } ${idx > 0 ? 'border-t border-t-slate-100/80' : ''} ${acc.isMandatory ? 'cursor-default' : ''}`}
            >
                <div
                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                            ? 'bg-brand-primary text-black shadow-sm shadow-brand-primary/20'
                            : 'border-2 border-slate-300 group-hover:border-brand-primary'
                    }`}
                >
                    {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                </div>

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
                    {line3 && <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">{line3}</p>}
                </div>

                <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                    <span
                        className={`text-[13px] font-black tabular-nums ${
                            isSelected ? 'text-brand-primary' : 'text-slate-800'
                        }`}
                    >
                        {finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
                    </span>
                    {hasDiscount && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 line-through tabular-nums">
                                ₹{acc.price.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                                {savingsPct}% off
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col">
            {mandatory.length > 0 && (
                <div className="bg-slate-50/80 px-4 py-1.5 border-y border-slate-100/80">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Mandatory / Included
                    </span>
                </div>
            )}
            {mandatory.map((acc, idx) => renderAccessoryRow(acc, idx, idx === mandatory.length - 1))}

            {optional.length > 0 && (
                <div className="bg-slate-50/80 px-4 py-1.5 border-y border-slate-100/80 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Optional Accessories
                    </span>
                </div>
            )}
            {optional.map((acc, idx) => renderAccessoryRow(acc, idx, idx === optional.length - 1))}
        </div>
    );
}
