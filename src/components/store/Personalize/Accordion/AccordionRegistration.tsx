/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';

export interface AccordionRegistrationProps {
    regType: 'STATE' | 'BH' | 'COMPANY';
    setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
    data: {
        baseExShowroom?: number;
        rtoOptions?: any[];
        stateCode?: string;
    };
}

export default function AccordionRegistration({ regType, setRegType, data }: AccordionRegistrationProps) {
    const items = data.rtoOptions || [];

    // If no SOT data, render nothing — no guesswork
    if (items.length === 0) {
        return (
            <div className="px-4 py-6 text-center text-[11px] text-slate-400">
                Registration charges unavailable for this location.
            </div>
        );
    }

    const selectedItem = items.find((i: any) => i.id === regType) || items[0];
    const breakdown = selectedItem?.breakdown || [];

    // Split breakdown: variable labels (road tax / cess) go to per-option display
    const variableLabels = new Set([
        'Road Tax',
        'Road Tax Rate',
        'Road Tax Amount',
        'Cess',
        'Cess Amount',
        'Cess Rate',
    ]);
    const fixedCharges = breakdown.filter((b: any) => !variableLabels.has(b.label));

    const getRoadTax = (typeId: string) => {
        const opt = items.find((i: any) => i.id === typeId);
        const bd = opt?.breakdown || [];
        const rt = bd.find((b: any) => b.label === 'Road Tax' || b.label === 'Road Tax Amount');
        return Number(rt?.amount || 0);
    };

    const getCess = (typeId: string) => {
        const opt = items.find((i: any) => i.id === typeId);
        const bd = opt?.breakdown || [];
        const ce = bd.find((b: any) => b.label === 'Cess' || b.label === 'Cess Amount');
        return Number(ce?.amount || 0);
    };

    return (
        <>
            {/* Fixed charges — mandatory rows from SOT breakdown */}
            {fixedCharges.map((charge: any, idx: number) => (
                <div
                    key={`fixed-${idx}`}
                    className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 border-l-[3px] border-l-emerald-500 bg-emerald-50/50 ${idx > 0 ? 'border-t border-t-slate-100/80' : ''}`}
                >
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                        <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-slate-50 border border-dashed border-slate-200">
                        <FileText size={16} className="text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black tracking-tight leading-tight truncate text-slate-900">
                            {charge.label}
                        </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                        <span className="text-[13px] font-extrabold tabular-nums text-emerald-600">
                            ₹{Math.round(Number(charge.amount || 0)).toLocaleString()}
                        </span>
                    </div>
                </div>
            ))}

            {/* Road Tax options — driven entirely from SOT rtoOptions */}
            {items.map((item: any) => {
                const typeId = String(item.id || '').toUpperCase();
                const isSelected = regType === typeId;
                const roadTaxAmt = getRoadTax(typeId);
                const cessAmt = getCess(typeId);
                const displayAmount = roadTaxAmt + cessAmt;
                const displayName = item.name || item.label || typeId;
                const description = item.description || '';

                return (
                    <div
                        key={typeId}
                        onClick={() => setRegType(typeId as any)}
                        className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${
                            isSelected
                                ? 'border-l-emerald-500 bg-emerald-50/50'
                                : 'border-l-transparent hover:bg-slate-50'
                        } border-t border-t-slate-100/80`}
                    >
                        <div
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                    : 'border-2 border-slate-300 group-hover:border-emerald-400'
                            }`}
                        >
                            {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                        </div>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-slate-50 border border-dashed border-slate-200">
                            <FileText size={16} className="text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-[12px] font-black tracking-tight leading-tight truncate ${
                                    isSelected ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {displayName}
                            </p>
                            {description && (
                                <p
                                    className={`text-[11px] font-medium mt-0.5 truncate leading-tight ${
                                        isSelected ? 'text-slate-600' : 'text-slate-500'
                                    }`}
                                >
                                    {description}
                                </p>
                            )}
                            {cessAmt > 0 && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight italic">
                                    inclusive of cess ₹{cessAmt.toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                            <span
                                className={`text-[13px] font-extrabold tabular-nums ${
                                    isSelected ? 'text-emerald-600' : 'text-slate-800'
                                }`}
                            >
                                ₹{displayAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
