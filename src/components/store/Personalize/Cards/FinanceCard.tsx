/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { HelpCircle, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { formatDisplayIdForUI, unformatDisplayId } from '@/lib/displayId';

interface FinanceCardProps {
    emi: number;
    emiTenure: number;
    setEmiTenure?: (tenure: number) => void;
    downPayment: number;
    totalOnRoad: number;
    loanAmount: number;
    annualInterest: number;
    interestType?: string;
    schemeId?: string;
    financeCharges?: { id: string; label: string; value: number; helpText?: string }[];
}

export default function FinanceCard({
    emi,
    emiTenure,
    setEmiTenure,
    downPayment,
    totalOnRoad,
    loanAmount,
    annualInterest,
    interestType = 'REDUCING',
    schemeId,
    financeCharges = [],
}: FinanceCardProps) {
    const displayDownPayment = downPayment < 1 ? 0 : downPayment;

    // Standard tenures for display comparison
    const tenures = [12, 24, 36, 48, 60];

    // Helper to calculate approximate EMI for other tenures for comparison
    const calculateEMI = (t: number) => {
        const monthlyRate = annualInterest / 12;
        if (monthlyRate === 0) return loanAmount / t;
        return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, t)) / (Math.pow(1 + monthlyRate, t) - 1);
    };

    const financeItems = [
        { label: 'Down Payment', value: `₹${displayDownPayment.toLocaleString()}` },
        ...financeCharges.map(charge => ({
            label: charge.label,
            value: typeof charge.value === 'number' ? `₹${charge.value.toLocaleString()}` : charge.value,
            helpText: charge.helpText,
        })),
        { label: 'Loan Amount', value: `₹${loanAmount.toLocaleString()}` },
        { label: `Interest (${interestType})`, value: `${(annualInterest * 100).toFixed(2)}%`, isHighlight: true },
        {
            label: 'Approval Chance',
            value: downPayment / totalOnRoad > 0.25 ? 'High' : downPayment / totalOnRoad > 0.15 ? 'Medium' : 'Low',
            isHighlight: true,
            colorClass:
                downPayment / totalOnRoad > 0.25
                    ? 'text-emerald-500'
                    : downPayment / totalOnRoad > 0.15
                      ? 'text-brand-primary'
                      : 'text-amber-500',
        },
        { label: 'Scheme', value: schemeId ? formatDisplayIdForUI(unformatDisplayId(schemeId)) : 'STANDARD' },
    ];

    return (
        <div className="glass-panel dark:bg-black/60 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full border border-white/5 group/fcard">
            <div className="p-6 pb-2 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-primary tracking-widest">
                        <Zap size={14} />
                        Tenure & EMI
                    </div>
                    {/* Tooltip trigger for Snapshot */}
                    <div className="relative group/snapshot">
                        <HelpCircle size={14} className="text-slate-500 cursor-help" />
                        <div className="absolute top-full right-0 mt-2 w-64 p-4 glass-panel dark:bg-black/90 rounded-2xl shadow-2xl opacity-0 group-hover/snapshot:opacity-100 transition-all pointer-events-none z-50 translate-y-2 group-hover/snapshot:translate-y-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3">
                                Finance Snapshot
                            </p>
                            <div className="space-y-2">
                                {financeItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest">
                                            {item.label}
                                        </span>
                                        <span
                                            className={`font-mono font-black ${(item as any).isHighlight ? (item as any).colorClass || 'text-brand-primary' : 'text-white'}`}
                                        >
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tenure Selection - Vertical List matching User Image */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {tenures.map(t => {
                        const calculatedEmiForT = Math.round(calculateEMI(t));
                        const isSelected = emiTenure === t;
                        return (
                            <button
                                key={t}
                                onClick={() => setEmiTenure && setEmiTenure(t)}
                                className={`w-full group/item p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between
                                    ${
                                        isSelected
                                            ? 'bg-brand-primary/10 border-brand-primary shadow-[0_4px_15px_rgba(255,215,0,0.1)]'
                                            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex flex-col items-start gap-0.5">
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`}
                                    >
                                        {t} Months
                                    </span>
                                    <span
                                        className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}
                                    >
                                        EMI TENURE
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span
                                            className={`block text-xs font-black font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-white/60'}`}
                                        >
                                            ₹{calculatedEmiForT.toLocaleString()}
                                        </span>
                                        <span className="block text-[7px] font-bold text-slate-500 uppercase">
                                            MONTHLY EMI
                                        </span>
                                    </div>
                                    <div
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-white/10'}`}
                                    >
                                        {isSelected && (
                                            <CheckCircle2 size={10} className="text-black" strokeWidth={4} />
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 pt-4 border-t border-white/5 bg-slate-50/50 dark:bg-white/[0.02] mt-auto">
                <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase italic tracking-widest text-slate-400">
                            Selected EMI
                        </span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                            <Clock size={10} className="text-brand-primary" />
                            <span>{emiTenure} Months Plan</span>
                        </div>
                    </div>
                    <span className="text-lg font-black italic tracking-tighter text-brand-primary font-mono block">
                        ₹{Math.round(calculateEMI(emiTenure)).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
