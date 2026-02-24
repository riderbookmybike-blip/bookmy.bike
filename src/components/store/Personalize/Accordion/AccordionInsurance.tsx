/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { Shield } from 'lucide-react';

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

/* ── Sub-components ─────────────────────────────────────────────── */

const TreeLine = () => <span className="text-slate-300 mr-2 text-[13px] font-light select-none">└</span>;

const tipMap: Record<string, string> = {
    tp: 'Covers damage you cause to other people or their property in an accident. This is mandatory by law for 5 years.',
    od: 'Covers repair or replacement costs if your vehicle gets damaged in an accident, theft, fire, or natural disaster. Valid for 1 year.',
    'zero depreciation':
        'Without this, insurance deducts value for wear & tear on parts. With Zero Dep, you get full claim amount without any deduction.',
    'personal accident':
        'Provides compensation to you (the owner-driver) for injuries or death in a road accident. Covers up to ₹15 lakh.',
    'roadside assistance':
        'Get help if your vehicle breaks down — towing, flat tyre, battery jumpstart, fuel delivery, anywhere in India.',
    'engine protect':
        'Covers engine damage from water logging or oil leakage, which is not covered under regular insurance.',
    'return to invoice':
        'If your vehicle is stolen or totally damaged, you get the full invoice amount back instead of depreciated value.',
    consumables:
        'Covers cost of consumables like engine oil, nuts, bolts, and washers used during repairs — normally not covered.',
    'key replacement': 'Covers the cost of replacing your vehicle keys if they are lost, stolen, or damaged.',
    net_premium: 'The total of all your insurance charges before GST is added. This is the base cost of your coverage.',
    gst: 'Government Service Tax applied on insurance premiums. Currently 18% on all motor insurance.',
};

const getAddonTip = (name: string): string | undefined => {
    const key = name.toLowerCase();
    for (const [k, v] of Object.entries(tipMap)) {
        if (key.includes(k)) return v;
    }
    return undefined;
};

const InfoTip = ({ tip }: { tip?: string }) => {
    if (!tip) return null;
    return (
        <span className="relative group/tip inline-flex ml-1">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-100 inline-flex items-center justify-center cursor-help shrink-0 hover:bg-slate-200 transition-colors">
                <span className="text-[8px] font-bold text-slate-400 leading-none select-none">i</span>
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg bg-slate-800 text-[10px] leading-relaxed text-white font-medium shadow-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 z-50 pointer-events-none">
                {tip}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </span>
        </span>
    );
};

/* ── Main Component ─────────────────────────────────────────────── */

export default function AccordionInsurance({
    insuranceRequiredItems,
    availableInsuranceAddons,
    selectedInsuranceAddons,
    toggleInsuranceAddon,
    baseInsurance,
    insuranceTP,
    insuranceOD,
    insuranceGstRate,
}: AccordionInsuranceProps) {
    // Compute totals
    const activeAddons = availableInsuranceAddons.filter((a: any) => selectedInsuranceAddons.includes(a.id));
    const addonsTotal = activeAddons.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
    const totalInsurance = baseInsurance + addonsTotal;

    // Net Premium (sum of all base premiums before GST)
    const tpBase = insuranceRequiredItems.find((i: any) => i.id === 'insurance-tp');
    const odBase = insuranceRequiredItems.find((i: any) => i.id === 'insurance-od');
    const tpBasePremium = tpBase?.breakdown?.[0]?.amount || insuranceTP || 0;
    const odBasePremium = odBase?.breakdown?.[0]?.amount || insuranceOD || 0;
    const addonsBasePremium = activeAddons.reduce((sum: number, a: any) => {
        const base = a.breakdown?.find((b: any) => b.label === 'Base Premium');
        return sum + Number(base?.amount || a.price || 0);
    }, 0);
    const netPremium = Number(tpBasePremium) + Number(odBasePremium) + Number(addonsBasePremium);
    const totalGst = Math.max(0, totalInsurance - netPremium);

    return (
        <>
            <div>
                {/* Header: INSURANCE PACKAGE */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <Shield size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Insurance Package
                    </span>
                </div>

                {/* Third Party (Basic) */}
                <div className="px-4 py-2.5 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center text-[11px] font-semibold text-slate-700">
                            <TreeLine />
                            Third Party (Basic)
                            <InfoTip tip={tipMap['tp']} />
                        </span>
                        <span className="text-[12px] font-bold tabular-nums text-slate-700">
                            ₹{Number(insuranceTP || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="ml-6 mt-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center text-[10px] text-slate-500 italic">
                                <TreeLine />
                                Liability Only (5 Years Cover)
                            </span>
                            <span className="text-[10px] tabular-nums text-slate-500">
                                ₹{Number(insuranceTP || 0).toLocaleString()}
                            </span>
                        </div>
                        {tpBase?.breakdown
                            ?.filter((b: any) => !b.label.toLowerCase().includes('gst'))
                            .map((b: any, i: number) => (
                                <div key={i} className="flex items-center justify-between ml-5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        {b.label}: ₹{Number(b.amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Own Damage (OD) */}
                <div className="px-4 py-2.5 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center text-[11px] font-semibold text-slate-700">
                            <TreeLine />
                            Own Damage (OD)
                            <InfoTip tip={tipMap['od']} />
                        </span>
                        <span className="text-[12px] font-bold tabular-nums text-slate-700">
                            ₹{Number(insuranceOD || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="ml-6 mt-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center text-[10px] text-slate-500 italic">
                                <TreeLine />
                                Comprehensive (1 Year Cover)
                            </span>
                            <span className="text-[10px] tabular-nums text-slate-500">
                                ₹{Number(insuranceOD || 0).toLocaleString()}
                            </span>
                        </div>
                        {odBase?.breakdown
                            ?.filter((b: any) => !b.label.toLowerCase().includes('gst'))
                            .map((b: any, i: number) => (
                                <div key={i} className="flex items-center justify-between ml-5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        {b.label}: ₹{Number(b.amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* OPTIONAL ADD-ONS section */}
                {availableInsuranceAddons.length > 0 && (
                    <div className="border-t border-slate-200/80">
                        <div className="px-4 py-2 bg-slate-50/60">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                Optional Add-Ons
                            </span>
                        </div>
                        {availableInsuranceAddons.map((addon: any) => {
                            const isActive = selectedInsuranceAddons.includes(addon.id);
                            const isBundled = addon.inclusionType === 'BUNDLE';
                            const isMandatory = addon.isMandatory || isBundled;
                            const basePrice = Number(addon.price || 0);
                            const hasDiscountOverride =
                                addon.discountPrice !== undefined &&
                                addon.discountPrice !== null &&
                                !Number.isNaN(Number(addon.discountPrice));
                            const discountedPrice = hasDiscountOverride ? Number(addon.discountPrice) : basePrice;
                            const effectivePrice = isBundled ? 0 : discountedPrice;
                            const offerAmount =
                                !isBundled && hasDiscountOverride ? Math.max(0, basePrice - discountedPrice) : 0;
                            const hasOffer = offerAmount > 0;
                            const highlightPrice = (hasOffer || effectivePrice === 0) && (isActive || isMandatory);
                            return (
                                <div
                                    key={addon.id}
                                    onClick={() => {
                                        if (!isMandatory) toggleInsuranceAddon(addon.id);
                                    }}
                                    className={`px-4 py-2.5 border-t border-slate-50 transition-all duration-200 ${!isMandatory ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            {/* Toggle checkbox */}
                                            {!isMandatory ? (
                                                <div
                                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                                                            : 'border-[1.5px] border-slate-300 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <svg
                                                            className="w-2.5 h-2.5 text-white"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                                    <svg
                                                        className="w-2.5 h-2.5 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2.5}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                            <span
                                                className={`text-[11px] font-semibold ${isActive || isMandatory ? 'text-slate-700' : 'text-slate-500'}`}
                                            >
                                                {addon.name}
                                                <InfoTip tip={getAddonTip(addon.name)} />
                                            </span>
                                            {isBundled && (
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                    Included
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={`text-[12px] font-bold tabular-nums ${highlightPrice ? 'text-emerald-600' : 'text-slate-700'}`}
                                        >
                                            {effectivePrice === 0 && (isActive || isMandatory)
                                                ? 'FREE'
                                                : `₹${effectivePrice.toLocaleString()}`}
                                        </span>
                                    </div>
                                    {/* Breakdown details */}
                                    {addon.breakdown && addon.breakdown.length > 0 && (isActive || isMandatory) && (
                                        <div className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                            {addon.breakdown
                                                .filter((b: any) => !b.label.toLowerCase().includes('gst'))
                                                .map((b: any, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="text-[9px] font-semibold uppercase tracking-wider text-slate-400"
                                                    >
                                                        {b.label}: ₹{Number(b.amount || 0).toLocaleString()}
                                                    </span>
                                                ))}
                                            {hasOffer && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                                    Offer: ₹{offerAmount.toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Net Premium */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/80">
                    <span className="flex items-center text-[11px] text-slate-600 font-medium">
                        <TreeLine />
                        Net Premium
                        <InfoTip tip={tipMap['net_premium']} />
                    </span>
                    <span className="text-[12px] font-bold tabular-nums text-slate-700">
                        ₹{netPremium.toLocaleString()}
                    </span>
                </div>

                {/* GST */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-50">
                    <span className="flex items-center text-[11px] text-slate-600 font-medium">
                        <TreeLine />
                        GST ({insuranceGstRate}% GST)
                        <InfoTip tip={tipMap['gst']} />
                    </span>
                    <span className="text-[12px] font-bold tabular-nums text-slate-700">
                        ₹{totalGst.toLocaleString()}
                    </span>
                </div>

                {/* Total Insurance footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t-2 border-slate-200 bg-slate-50/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Total Insurance
                    </span>
                    <span className="text-[13px] font-black tabular-nums text-slate-900">
                        ₹{totalInsurance.toLocaleString()}
                    </span>
                </div>
            </div>
        </>
    );
}
