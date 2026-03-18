/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { CheckCircle2, FileText, ClipboardList, Fingerprint, Receipt, Landmark, Hash, Factory } from 'lucide-react';

export interface AccordionRegistrationProps {
    regType: 'STATE' | 'BH' | 'COMPANY';
    setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
    data: {
        baseExShowroom?: number;
        rtoOptions?: any[];
        stateCode?: string;
    };
}

const getRegDescription = (name: string) => {
    const lowerName = name.toLowerCase();

    // Explicit tax strings requested by User
    if (lowerName.includes('state')) return 'Individual State Residential Road Tax (15 Years)';
    if (lowerName.includes('bh') || lowerName.includes('bharat'))
        return 'For Central Govt. / MNC employees (Offices in >3 states). Road Tax (2 Years)';
    if (lowerName.includes('company') || lowerName.includes('corporate')) return 'Corporate Body Road Tax (15 Years)';

    if (lowerName.includes('hp') || lowerName.includes('hypothecation'))
        return 'Loan endorsement on vehicle registration';
    if (lowerName.includes('hsrp') || lowerName.includes('number plate'))
        return 'Government mandated high-security number plate';
    if (lowerName.includes('tax')) return 'Mandatory government road tax';
    if (lowerName.includes('cess')) return 'Mandatory local infrastructure cess variant';
    if (lowerName.includes('rto') || lowerName.includes('registration'))
        return 'Mandatory regional transport office charges';

    return 'Statutory registration charges';
};

const getRegIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hp') || lowerName.includes('hypothecation'))
        return { icon: Landmark, color: 'text-amber-500', bg: 'bg-amber-50' };
    if (lowerName.includes('hsrp') || lowerName.includes('number plate'))
        return { icon: Hash, color: 'text-sky-500', bg: 'bg-sky-50' };
    if (lowerName.includes('tax')) return { icon: Receipt, color: 'text-rose-500', bg: 'bg-rose-50' };
    if (lowerName.includes('state')) return { icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    if (lowerName.includes('bh') || lowerName.includes('bharat'))
        return { icon: Fingerprint, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (lowerName.includes('company') || lowerName.includes('corporate'))
        return { icon: Factory, color: 'text-purple-500', bg: 'bg-purple-50' };
    if (lowerName.includes('cess')) return { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' };
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
};

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
    const rawBreakdown = selectedItem?.breakdown || [];

    // Extract rates (e.g., "Road Tax Rate" -> 8%) to merge into descriptions
    const rates: Record<string, number> = {};
    const visibleBreakdown: any[] = [];
    // 'cess' removed from this list so it appears independently in the top block
    const taxIdentifiers = ['road tax', 'road tax amount', 'tax', 'roadtax'];

    rawBreakdown.forEach((charge: any) => {
        const lbl = charge.label || '';
        const lowerLbl = lbl.toLowerCase();

        if (lowerLbl.includes('rate')) {
            const baseName = lowerLbl.replace(/\s*rate$/i, '').trim();
            rates[baseName] = Number(charge.amount || 0);

            // Handle edgecases mapping
            if (baseName === 'tax') rates['road tax'] = Number(charge.amount || 0);
        } else if (!taxIdentifiers.includes(lowerLbl)) {
            visibleBreakdown.push(charge);
        }
    });

    const getRoadTaxTotal = (itemObj: any) => {
        const bd = itemObj?.breakdown || [];
        const sum = bd
            .filter((b: any) => {
                const l = (b.label || '').toLowerCase();
                return taxIdentifiers.includes(l);
            })
            .reduce((acc: number, b: any) => acc + Number(b.amount || 0), 0);
        return sum || Number(itemObj.price || 0); // Fallback to price if breakdown is empty
    };
    const STATE_MAP: Record<string, string> = {
        AP: 'Andhra Pradesh',
        AR: 'Arunachal Pradesh',
        AS: 'Assam',
        BR: 'Bihar',
        CG: 'Chhattisgarh',
        GA: 'Goa',
        GJ: 'Gujarat',
        HR: 'Haryana',
        HP: 'Himachal Pradesh',
        JH: 'Jharkhand',
        KA: 'Karnataka',
        KL: 'Kerala',
        MP: 'Madhya Pradesh',
        MH: 'Maharashtra',
        MN: 'Manipur',
        ML: 'Meghalaya',
        MZ: 'Mizoram',
        NL: 'Nagaland',
        OD: 'Odisha',
        PB: 'Punjab',
        RJ: 'Rajasthan',
        SK: 'Sikkim',
        TN: 'Tamil Nadu',
        TS: 'Telangana',
        TR: 'Tripura',
        UP: 'Uttar Pradesh',
        UK: 'Uttarakhand',
        WB: 'West Bengal',
        AN: 'Andaman & Nicobar',
        CH: 'Chandigarh',
        DN: 'Dadra & Nagar Haveli',
        DD: 'Daman & Diu',
        DL: 'Delhi',
        JK: 'Jammu & Kashmir',
        LA: 'Ladakh',
        LD: 'Lakshadweep',
        PY: 'Puducherry',
    };

    return (
        <div className="flex flex-col">
            {visibleBreakdown.length > 0 && (
                <div className="bg-slate-50/80 px-4 py-1.5 border-b border-slate-100/80">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Applicable Charges
                    </span>
                </div>
            )}
            {/* Full Breakdown — bifurcation from SOT */}
            {visibleBreakdown.map((charge: any, idx: number) => {
                const config = getRegIcon(charge.label);
                const Icon = config.icon;
                const baseLabel = charge.label.toLowerCase();
                const ratePct = rates[baseLabel] || (baseLabel === 'road tax' && rates['tax']) ? rates['tax'] : null;
                const finalRate = rates[baseLabel] ?? ratePct;

                return (
                    <div
                        key={`fixed-${idx}`}
                        className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-default border-l-[3px] border-l-brand-primary bg-brand-primary/[0.02] ${
                            idx > 0 ? 'border-t border-t-slate-100/80' : ''
                        }`}
                    >
                        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 bg-brand-primary text-black shadow-sm shadow-brand-primary/20">
                            <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${config.bg} border border-${config.color.split('-')[1]}-200/50 shadow-sm`}
                        >
                            <Icon size={16} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black tracking-tight leading-tight truncate text-slate-900 capitalize">
                                {charge.label.toLowerCase()}
                            </p>
                            <p className="text-[11px] font-medium mt-0.5 truncate leading-tight text-slate-600">
                                {getRegDescription(charge.label)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
                                {finalRate ? `Variable Rate @ ${finalRate}%` : 'Fixed Mandatory Charge'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                            <span className="text-[13px] font-black tabular-nums text-brand-primary">
                                ₹{Math.round(Number(charge.amount || 0)).toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}

            {items.length > 0 && (
                <div className="bg-slate-50/80 px-4 py-1.5 border-y border-slate-100/80 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Registration Options
                    </span>
                </div>
            )}
            {/* Road Tax options — driven entirely from SOT rtoOptions */}
            {items.map((item: any, idx: number) => {
                const typeId = String(item.id || '').toUpperCase();
                const isSelected = regType === typeId;
                const displayAmount = getRoadTaxTotal(item);
                let displayName = item.name || item.label || typeId;
                let description = getRegDescription(displayName);
                let detailText = '';

                if (typeId === 'STATE') {
                    const stateName = data.stateCode
                        ? STATE_MAP[data.stateCode.toUpperCase()] || data.stateCode
                        : 'State';
                    displayName = `${stateName} Registration`;
                    description = 'Individual State Residential Road Tax';
                    detailText = '(15 Years)';
                } else if (typeId === 'BH') {
                    displayName = 'Bharat Series (BH) Registration';
                    description = 'For Central Government or Corporate employees with offices in over three states';
                    detailText = 'Road Tax (2 Years)';
                } else if (typeId === 'COMPANY') {
                    displayName = 'Company / Corporate Registration';
                    description = 'Corporate Body Road Tax';
                    detailText = '(15 Years)';
                }

                // Fetch rate for this specific option from its own breakdown
                let optionRate = null;
                (item.breakdown || []).forEach((b: any) => {
                    const blbl = (b.label || '').toLowerCase();
                    if (blbl.includes('rate') && (blbl.includes('tax') || blbl.includes('road'))) {
                        optionRate = Number(b.amount || 0);
                    }
                });

                const config = getRegIcon(displayName);
                const Icon = config.icon;

                return (
                    <div
                        key={typeId}
                        onClick={() => setRegType(typeId as any)}
                        className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-l-[3px] ${
                            isSelected
                                ? 'border-l-brand-primary bg-brand-primary/[0.02]'
                                : 'border-l-transparent hover:bg-slate-50'
                        } ${idx > 0 && !isSelected ? 'border-t border-t-slate-100/80' : ''}`}
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
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? `${config.bg} border border-${config.color.split('-')[1]}-200/50 shadow-sm` : 'bg-slate-50 border border-slate-200 border-dashed'}`}
                        >
                            <Icon size={16} className={isSelected ? config.color : 'text-slate-300'} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-[12px] font-black tracking-tight leading-tight truncate ${
                                    isSelected ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {displayName}
                            </p>
                            <p
                                className={`text-[11px] font-medium mt-0.5 truncate leading-tight ${
                                    isSelected ? 'text-slate-600' : 'text-slate-500'
                                }`}
                            >
                                {description}
                            </p>
                            {detailText && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
                                    {detailText} {optionRate ? ` @ ${optionRate}%` : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 min-w-[72px]">
                            <span
                                className={`text-[13px] font-black tabular-nums ${
                                    isSelected ? 'text-brand-primary' : 'text-[#4666f2] italic'
                                }`}
                            >
                                {!isSelected ? '@' : ''}₹{Math.round(displayAmount).toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
