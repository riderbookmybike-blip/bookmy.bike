/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { CheckCircle2, Shield } from 'lucide-react';

export interface AccordionInsuranceProps {
    insuranceRequiredItems: any[];
    availableInsuranceAddons: any[];
    selectedInsuranceAddons: string[];
    toggleInsuranceAddon: (id: string) => void;
    baseInsurance: number;
    insuranceTP: number;
    insuranceOD: number;
    insuranceGstRate: number;
}

export default function AccordionInsurance({
    availableInsuranceAddons,
    selectedInsuranceAddons,
    toggleInsuranceAddon,
    baseInsurance,
    insuranceTP,
    insuranceOD,
}: AccordionInsuranceProps) {
    // Build a unified flat list: mandatory items first, then optional add-ons
    const mandatoryItems = [
        {
            id: 'insurance-tp',
            name: 'Third Party',
            subtext: 'Liability Only (5 Years Cover)',
            detail: 'Mandatory by Law',
            price: insuranceTP,
            isMandatory: true,
        },
        {
            id: 'insurance-od',
            name: 'Own Damage',
            subtext: 'Comprehensive (1 Year Cover)',
            detail: '',
            price: insuranceOD,
            isMandatory: true,
        },
    ];

    // All items in one list: mandatory + addons
    const allItems = [
        ...mandatoryItems,
        ...availableInsuranceAddons.map((addon: any) => {
            const isBundled = addon.inclusionType === 'BUNDLE';
            const isMandatory = addon.isMandatory || isBundled;
            const basePrice = Number(addon.price || 0);
            const hasDiscount =
                addon.discountPrice !== undefined &&
                addon.discountPrice !== null &&
                !Number.isNaN(Number(addon.discountPrice)) &&
                Number(addon.discountPrice) < basePrice;
            const finalPrice = isBundled ? 0 : hasDiscount ? Number(addon.discountPrice) : basePrice;
            const savings = hasDiscount ? basePrice - finalPrice : 0;
            const savingsPct = hasDiscount ? Math.round((savings / basePrice) * 100) : 0;
            const tenure = addon.tenure || addon.term || '1 Year';

            return {
                id: addon.id,
                name: `${addon.name} (${tenure})`,
                subtext: addon.description || (isBundled ? 'Bundled • Included Free' : 'Optional Add-On'),
                detail: '',
                price: finalPrice,
                originalPrice: hasDiscount ? basePrice : undefined,
                savingsPct: savingsPct > 0 ? savingsPct : undefined,
                isMandatory,
                isBundled,
            };
        }),
    ];

    // Active addons total
    const activeAddons = availableInsuranceAddons.filter((a: any) => selectedInsuranceAddons.includes(a.id));
    const addonsTotal = activeAddons.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
    const totalInsurance = baseInsurance + addonsTotal;

    return (
        <>
            {allItems.map((item: any, idx: number) => {
                const isSelected = item.isMandatory || selectedInsuranceAddons.includes(item.id);

                return (
                    <div
                        key={item.id}
                        onClick={() => !item.isMandatory && toggleInsuranceAddon(item.id)}
                        className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${
                            isSelected
                                ? 'border-l-emerald-500 bg-emerald-50/50'
                                : 'border-l-transparent hover:bg-slate-50'
                        } ${idx > 0 ? 'border-t border-t-slate-100/80' : ''}`}
                    >
                        {/* Checkbox — same circle style as accessories */}
                        <div
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                    : 'border-2 border-slate-300 group-hover:border-emerald-400'
                            }`}
                        >
                            {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                        </div>

                        {/* Icon — Shield for insurance (like Package for accessories) */}
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-slate-50 border border-dashed border-slate-200">
                            <Shield size={16} className="text-slate-300" />
                        </div>

                        {/* Name lines — same 3-line pattern as accessories */}
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-[12px] font-black tracking-tight leading-tight truncate ${
                                    isSelected ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {item.name}
                            </p>
                            {item.subtext && (
                                <p
                                    className={`text-[11px] font-medium mt-0.5 truncate leading-tight ${
                                        isSelected ? 'text-slate-600' : 'text-slate-500'
                                    }`}
                                >
                                    {item.subtext}
                                </p>
                            )}
                            {item.detail && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
                                    {item.detail}
                                </p>
                            )}
                        </div>

                        {/* Price block — same style as accessories */}
                        <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                            <span
                                className={`text-[13px] font-extrabold tabular-nums ${
                                    isSelected ? 'text-emerald-600' : 'text-slate-800'
                                }`}
                            >
                                {item.price === 0 && isSelected
                                    ? 'FREE'
                                    : `₹${Math.round(Number(item.price || 0)).toLocaleString()}`}
                            </span>
                            {item.originalPrice && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 line-through tabular-nums">
                                        ₹{Math.round(item.originalPrice).toLocaleString()}
                                    </span>
                                    {item.savingsPct && (
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full leading-none">
                                            {item.savingsPct}% off
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
