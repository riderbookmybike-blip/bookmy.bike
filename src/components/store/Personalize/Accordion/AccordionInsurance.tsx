/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import {
    CheckCircle2,
    Shield,
    Lock,
    Zap,
    Activity,
    Truck,
    Wrench,
    Percent,
    RotateCcw,
    Droplets,
    ShieldAlert,
} from 'lucide-react';
import { TP_LABEL, TP_SUBTEXT, TP_DETAIL, OD_LABEL, OD_SUBTEXT } from '@/lib/constants/insuranceConstants';

const ICON_MAP: Record<string, any> = {
    'insurance-tp': { icon: Lock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    'insurance-od': { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
    personal_accident_cover: { icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
    zero_depreciation: { icon: Percent, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    roadside_assistance: { icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50' },
    engine_protector: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
    consumables_cover: { icon: Droplets, color: 'text-sky-500', bg: 'bg-sky-50' },
    return_to_invoice: { icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-50' },
};

const getAddonIcon = (id: string, name: string) => {
    const key = String(id || '').toLowerCase();
    if (ICON_MAP[key]) return ICON_MAP[key];

    // Fallback based on name keywords
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pa ') || lowerName.includes('accident')) return ICON_MAP['personal_accident_cover'];
    if (lowerName.includes('depreciation') || lowerName.includes('zero dep')) return ICON_MAP['zero_depreciation'];
    if (lowerName.includes('rsa') || lowerName.includes('roadside')) return ICON_MAP['roadside_assistance'];
    if (lowerName.includes('engine')) return ICON_MAP['engine_protector'];
    if (lowerName.includes('consumable')) return ICON_MAP['consumables_cover'];
    if (lowerName.includes('invoice') || lowerName.includes('rti')) return ICON_MAP['return_to_invoice'];

    return { icon: ShieldAlert, color: 'text-slate-400', bg: 'bg-slate-50' };
};

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

const getAddonDescription = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pa ') || lowerName.includes('accident'))
        return 'Financial security against disability or injury';
    if (lowerName.includes('depreciation') || lowerName.includes('zero dep'))
        return 'Full claim payout without wear & tear deductions';
    if (lowerName.includes('rsa') || lowerName.includes('roadside')) return '24x7 emergency breakdown & towing support';
    if (lowerName.includes('engine')) return 'Protection against water ingress & fluid leaks';
    if (lowerName.includes('consumable')) return 'Covers cost of oils, nuts, bolts & coolants';
    if (lowerName.includes('invoice') || lowerName.includes('rti'))
        return 'Get full invoice value if vehicle is stolen or totalled';
    return 'Optional Add-on Coverage';
};

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
            name: TP_LABEL,
            subtext: TP_SUBTEXT,
            detail: TP_DETAIL,
            price: insuranceTP,
            isMandatory: true,
        },
        {
            id: 'insurance-od',
            name: OD_LABEL,
            subtext: OD_SUBTEXT,
            detail: '',
            price: insuranceOD,
            isMandatory: true,
        },
    ];

    // All items built uniformly
    const allItems = [
        ...mandatoryItems.map(item => ({ ...item, isBundled: false })),
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

            const rawDesc =
                addon.description && addon.description.toLowerCase() !== 'coverage' ? addon.description : null;

            return {
                id: addon.id,
                name: `${addon.name} (${tenure})`,
                subtext: rawDesc || (isBundled ? 'Bundled • Included Free' : getAddonDescription(addon.name)),
                detail: '',
                price: finalPrice,
                originalPrice: hasDiscount ? basePrice : undefined,
                savingsPct: savingsPct > 0 ? savingsPct : undefined,
                isMandatory,
                isBundled,
            };
        }),
    ];

    // Move selected addons to the "Included" section at the top, but keep them optional to toggle
    const included = allItems
        .filter(item => item.isMandatory || selectedInsuranceAddons.includes(item.id))
        .sort((a, b) => {
            if (a.isMandatory && !b.isMandatory) return -1;
            if (!a.isMandatory && b.isMandatory) return 1;
            return b.price - a.price; // Largest price on top for addons
        });

    const optional = allItems
        .filter(item => !item.isMandatory && !selectedInsuranceAddons.includes(item.id))
        .sort((a, b) => b.price - a.price); // Largest price on top

    const renderInsuranceRow = (item: any, idx: number) => {
        const isSelected = item.isMandatory || selectedInsuranceAddons.includes(item.id);
        const finalPrice = item.price;
        const hasDiscount = item.savingsPct && item.savingsPct > 0;

        return (
            <div
                key={item.id}
                onClick={() => !item.isMandatory && toggleInsuranceAddon(item.id)}
                className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${
                    isSelected
                        ? 'border-l-brand-primary bg-brand-primary/[0.02]'
                        : 'border-l-transparent hover:bg-slate-50'
                } ${idx > 0 ? 'border-t border-t-slate-100/80' : ''} ${item.isMandatory ? 'cursor-default' : ''}`}
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

                {(() => {
                    const config = getAddonIcon(item.id, item.name);
                    const Icon = config.icon;
                    return (
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                    ? `${config.bg} border border-${config.color.split('-')[1]}-200/50 shadow-sm`
                                    : 'bg-slate-50 border border-slate-200 border-dashed'
                            }`}
                        >
                            <Icon size={16} className={isSelected ? config.color : 'text-slate-300'} />
                        </div>
                    );
                })()}

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
                            className={`text-[11px] font-medium mt-0.5 truncate leading-tight ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}
                        >
                            {item.subtext}
                        </p>
                    )}
                    {item.detail && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">{item.detail}</p>
                    )}
                </div>

                <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                    <span
                        className={`text-[13px] font-black tabular-nums ${
                            isSelected ? 'text-brand-primary' : 'text-[#4666f2] italic'
                        }`}
                    >
                        {finalPrice === 0
                            ? 'FREE'
                            : `${!isSelected && !item.isMandatory ? '@' : ''}₹${Math.round(finalPrice).toLocaleString()}`}
                    </span>
                    {hasDiscount && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 line-through tabular-nums">
                                ₹{item.originalPrice?.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full leading-none">
                                {item.savingsPct}% off
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col">
            {included.length > 0 && (
                <div className="bg-slate-50/80 px-4 py-1.5 border-y border-slate-100/80">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Mandatory / Included
                    </span>
                </div>
            )}
            {included.map((item: any, idx: number) => renderInsuranceRow(item, idx))}

            {optional.length > 0 && (
                <div className="bg-slate-50/80 px-4 py-1.5 border-y border-slate-100/80 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Optional Add-Ons
                    </span>
                </div>
            )}
            {optional.map((item: any, idx: number) => renderInsuranceRow(item, idx))}
        </div>
    );
}
