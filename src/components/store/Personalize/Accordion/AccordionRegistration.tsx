/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';

export interface AccordionRegistrationProps {
    regType: 'STATE' | 'BH' | 'COMPANY';
    setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
    data: {
        baseExShowroom?: number;
        rtoOptions?: any[];
        stateCode?: string;
    };
}

const stateNameMap: Record<string, string> = {
    MH: 'Maharashtra',
    DL: 'Delhi',
    KA: 'Karnataka',
    TN: 'Tamil Nadu',
    UP: 'Uttar Pradesh',
    GJ: 'Gujarat',
    RJ: 'Rajasthan',
    WB: 'West Bengal',
    MP: 'Madhya Pradesh',
    AP: 'Andhra Pradesh',
    TS: 'Telangana',
    KL: 'Kerala',
    PB: 'Punjab',
    HR: 'Haryana',
    BR: 'Bihar',
    JH: 'Jharkhand',
    AS: 'Assam',
    OR: 'Odisha',
    CG: 'Chhattisgarh',
    UK: 'Uttarakhand',
    HP: 'Himachal Pradesh',
    GA: 'Goa',
    TR: 'Tripura',
    ML: 'Meghalaya',
    MN: 'Manipur',
    NL: 'Nagaland',
    MZ: 'Mizoram',
    AR: 'Arunachal Pradesh',
    SK: 'Sikkim',
    JK: 'Jammu & Kashmir',
    CT: 'Chhattisgarh',
};

const TreeLine = () => <span className="text-slate-300 mr-2 text-[13px] font-light select-none">└</span>;

export default function AccordionRegistration({ regType, setRegType, data }: AccordionRegistrationProps) {
    const fallbackOptions = [
        { id: 'STATE', name: 'State', price: Math.round((data.baseExShowroom || 0) * 0.12), breakdown: [] },
        { id: 'BH', name: 'Bharat Series', price: Math.round((data.baseExShowroom || 0) * 0.08), breakdown: [] },
        { id: 'COMPANY', name: 'Company', price: Math.round((data.baseExShowroom || 0) * 0.2), breakdown: [] },
    ];
    const items = data.rtoOptions && data.rtoOptions.length > 0 ? data.rtoOptions : fallbackOptions;
    const selectedItem = items.find((i: any) => i.id === regType) || items[0];
    const breakdown = selectedItem?.breakdown || [];

    // Split breakdown into fixed vs variable (Road Tax, Cess change per type)
    const variableLabels = new Set(['Road Tax', 'Cess', 'Cess Amount']);
    const fixedCharges = breakdown.filter((b: any) => !variableLabels.has(b.label));
    const cessEntry = breakdown.find((b: any) => b.label === 'Cess' || b.label === 'Cess Amount');

    const getRoadTax = (typeId: string) => {
        const opt = items.find((i: any) => i.id === typeId);
        const bd = opt?.breakdown || [];
        const rt = bd.find((b: any) => b.label === 'Road Tax');
        return Number(rt?.amount || 0);
    };

    return (
        <>
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                {/* Header: REGISTRATION (RTO) + Total */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <ClipboardList size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Registration (RTO)
                    </span>
                </div>

                {/* Fixed Charges — tree lines */}
                {fixedCharges.length > 0 && (
                    <div>
                        {fixedCharges.map((b: any, i: number) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between px-4 py-2 ${i > 0 ? 'border-t border-slate-50' : ''}`}
                            >
                                <span className="flex items-center text-[11px] text-slate-600 font-medium">
                                    <TreeLine />
                                    {b.label}
                                </span>
                                <span className="text-[12px] font-bold tabular-nums text-slate-700">
                                    ₹{Number(b.amount || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Road Tax — section header + 3 vertical radio rows */}
                <div className="border-t border-slate-200/80">
                    <div className="px-4 py-2 bg-slate-50/60">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                            Road Tax
                        </span>
                    </div>
                    {(['BH', 'STATE', 'COMPANY'] as const).map(typeId => {
                        const opt = items.find((i: any) => i.id === typeId);
                        if (!opt) return null;
                        const isActive = regType === typeId;
                        const roadTaxAmt = getRoadTax(typeId);
                        const stateName = data.stateCode
                            ? stateNameMap[data.stateCode.toUpperCase()] || data.stateCode
                            : null;
                        const displayName =
                            typeId === 'STATE'
                                ? stateName
                                    ? `State (${stateName})`
                                    : 'State'
                                : typeId === 'BH'
                                  ? 'Bharat Series'
                                  : 'Company';
                        return (
                            <div
                                key={typeId}
                                onClick={() => setRegType(typeId)}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 border-l-[3px] border-t border-t-slate-50 ${
                                    isActive
                                        ? 'border-l-emerald-500 bg-emerald-50/40'
                                        : 'border-l-transparent hover:bg-slate-50/50'
                                }`}
                            >
                                {/* Radio dot */}
                                <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                        isActive
                                            ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                                            : 'border-[1.5px] border-slate-300'
                                    }`}
                                >
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span
                                    className={`flex-1 text-[11px] font-semibold ${
                                        isActive ? 'text-slate-900' : 'text-slate-600'
                                    }`}
                                >
                                    {displayName}
                                </span>
                                <span
                                    className={`text-[12px] font-bold tabular-nums ${
                                        isActive ? 'text-emerald-600' : 'text-slate-700'
                                    }`}
                                >
                                    ₹{roadTaxAmt.toLocaleString()}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Cess — tree line, auto-updates per type */}
                {cessEntry && (
                    <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/80">
                        <span className="flex items-center text-[11px] text-slate-600 font-medium">
                            <TreeLine />
                            Cess Amount
                        </span>
                        <span className="text-[12px] font-bold tabular-nums text-slate-700">
                            ₹{Number(cessEntry.amount || 0).toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Total footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/80 bg-slate-50/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Total Registration
                    </span>
                    <span className="text-[13px] font-black tabular-nums text-slate-900">
                        ₹{(selectedItem?.price || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Info: Required Documents / Process for selected type */}
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                {regType === 'STATE' && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            State Registration
                        </p>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">
                            Valid for the state of registration. You will need to provide Aadhaar Card, Address Proof,
                            Passport-size Photos, and PAN Card. Processing takes 7–15 working days at the local RTO.
                        </p>
                    </div>
                )}
                {regType === 'BH' && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Bharat Series (BH)
                        </p>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">
                            Pan-India validity — no re-registration needed when moving states. Ideal for Defence,
                            Central Govt, PSU employees &amp; private-sector transferees. You will need Aadhaar Card,
                            Address Proof, Passport-size Photos, PAN Card, and Employer Transfer Certificate or Posting
                            Order.
                        </p>
                    </div>
                )}
                {regType === 'COMPANY' && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Company Registration
                        </p>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">
                            Registered under a corporate entity. You will need Company PAN Card, GST Certificate, Board
                            Resolution or Authorization Letter, and Certificate of Incorporation. Higher road tax
                            applies.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
