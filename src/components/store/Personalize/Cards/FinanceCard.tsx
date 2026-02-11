/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Zap, Clock, CheckCircle2, SlidersHorizontal, Edit2 } from 'lucide-react';
import { formatDisplayIdForUI, unformatDisplayId } from '@/lib/displayId';

interface FinanceCardProps {
    emi: number;
    emiTenure: number;
    setEmiTenure?: (tenure: number) => void;
    downPayment: number;
    setUserDownPayment?: (amount: number) => void; // Added setter
    minDownPayment?: number; // Added min
    maxDownPayment?: number; // Added max
    totalOnRoad: number;
    loanAmount: number;
    annualInterest: number;
    interestType?: string;
    schemeId?: string;
    financeCharges?: { id: string; label: string; value: number; helpText?: string }[];
    bank?: any;
    scheme?: any;
}

export default function FinanceCard({
    emi,
    emiTenure,
    setEmiTenure,
    downPayment,
    setUserDownPayment,
    minDownPayment = 0,
    maxDownPayment = 0,
    totalOnRoad,
    loanAmount,
    annualInterest,
    interestType = 'REDUCING',
    schemeId,
    financeCharges = [],
    bank,
    scheme,
}: FinanceCardProps) {
    const displayDownPayment = downPayment < 1 ? 0 : downPayment;

    // Local state for slider to prevent lag
    const [localDP, setLocalDP] = useState<number | string>(displayDownPayment);

    // Sync local state when prop changes (debounce handling)
    useEffect(() => {
        setLocalDP(displayDownPayment);
    }, [displayDownPayment]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value;
        if (valStr === '') {
            setLocalDP('');
            return;
        }
        const val = parseInt(valStr);
        if (isNaN(val)) return;

        setLocalDP(val);
        if (setUserDownPayment) {
            setUserDownPayment(val);
        }
    };

    // Standard tenures for display comparison
    const tenures = [12, 24, 36, 48, 60];

    // Helper to calculate EMI for a given tenure — respects FLAT vs REDUCING
    const calculateEMI = (t: number) => {
        if (loanAmount <= 0) return 0;

        if (interestType === 'FLAT') {
            // FLAT: Simple interest over entire tenure
            const totalInterest = loanAmount * annualInterest * (t / 12);
            return (loanAmount + totalInterest) / t;
        }

        // REDUCING: Standard amortization formula
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

    const [expandedTenure, setExpandedTenure] = useState<number | null>(null);

    return (
        <div className="glass-panel dark:bg-black/60 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full border border-white/5 group/fcard relative">
            <div className="p-6 pb-2 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-primary tracking-widest">
                        <Zap size={14} />
                        Tenure & EMI
                    </div>
                    {/* Tooltip trigger for Snapshot */}
                    <div className="relative group/snapshot">
                        <HelpCircle size={14} className="text-slate-500 dark:text-slate-400 cursor-help" />
                        <div className="absolute top-full right-0 mt-2 w-64 p-4 glass-panel dark:bg-black/90 rounded-2xl shadow-2xl opacity-0 group-hover/snapshot:opacity-100 transition-all pointer-events-none z-50 translate-y-2 group-hover/snapshot:translate-y-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3">
                                Finance Snapshot
                            </p>
                            <div className="space-y-2">
                                {financeItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                            {item.label}
                                        </span>
                                        <span
                                            className={`font-mono font-black ${(item as any).isHighlight ? (item as any).colorClass || 'text-brand-primary' : 'text-slate-900 dark:text-white'}`}
                                        >
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Down Payment Slider Section */}
                {/* Down Payment Card (Styled like EMI) */}
                {setUserDownPayment && maxDownPayment > minDownPayment && (
                    <div className="mb-6 w-full flex items-center justify-between group/dp transition-all p-3 rounded-2xl hover:bg-white/5">
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                                Down Payment
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500">
                                Adjustable
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                    <span className="text-xs font-black font-mono tracking-tight text-brand-primary">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        value={localDP}
                                        onChange={handleSliderChange}
                                        className="w-16 bg-transparent text-xs font-black font-mono tracking-tight text-slate-900 dark:text-white text-right outline-none border-b border-brand-primary/20 focus:border-brand-primary transition-all p-0"
                                    />
                                </div>
                                <span className="block text-[7px] font-bold text-slate-600 dark:text-slate-500 uppercase">
                                    One-time Pay
                                </span>
                            </div>
                            <div className="w-4 h-4 rounded-full border border-white/10 flex items-center justify-center transition-all group-hover/dp:border-brand-primary group-hover/dp:bg-brand-primary">
                                <Edit2
                                    size={10}
                                    className="text-slate-400 group-hover/dp:text-black transition-colors"
                                    strokeWidth={3}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tenure Selection - Vertical List matching User Image */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {tenures.map(t => {
                        const calculatedEmiForT = Math.round(calculateEMI(t));
                        const isSelected = emiTenure === t;
                        const isExpanded = expandedTenure === t;
                        return (
                            <div key={t} className="relative">
                                <button
                                    onClick={() => {
                                        setEmiTenure && setEmiTenure(t);
                                    }}
                                    className={`w-full group/item p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between
                                        ${
                                            isSelected
                                                ? 'bg-brand-primary/10 border-brand-primary shadow-[0_4px_15px_rgba(255,215,0,0.1)]'
                                                : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span
                                            className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-brand-primary' : 'text-slate-600 dark:text-slate-400'}`}
                                        >
                                            {t} Months
                                        </span>
                                        <span
                                            className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-500'}`}
                                        >
                                            EMI TENURE
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span
                                                className={`block text-xs font-black font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-700 dark:text-white/60'}`}
                                            >
                                                ₹{calculatedEmiForT.toLocaleString()}
                                            </span>
                                            <span className="block text-[7px] font-bold text-slate-600 dark:text-slate-500 uppercase">
                                                MONTHLY EMI
                                            </span>
                                        </div>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setExpandedTenure(prev => (prev === t ? null : t));
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.stopPropagation();
                                                    setExpandedTenure(prev => (prev === t ? null : t));
                                                }
                                            }}
                                            className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/60 transition-all cursor-pointer"
                                            title="View breakdown"
                                        >
                                            <HelpCircle size={12} />
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

                                {isExpanded && (
                                    <div className="mt-3 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
                                        {(() => {
                                            const allCharges = scheme?.charges || [];
                                            const upfrontCharges = allCharges.filter(
                                                (c: any) => c.impact === 'UPFRONT'
                                            );
                                            const fundedCharges = allCharges.filter((c: any) => c.impact === 'FUNDED');

                                            const calcChargeAmount = (charge: any) => {
                                                if (charge.type === 'PERCENTAGE') {
                                                    const basis =
                                                        charge.calculationBasis === 'LOAN_AMOUNT'
                                                            ? loanAmount
                                                            : totalOnRoad;
                                                    return Math.round(basis * (charge.value / 100));
                                                }
                                                return charge.value || 0;
                                            };

                                            const totalUpfront = upfrontCharges.reduce(
                                                (sum: number, c: any) => sum + calcChargeAmount(c),
                                                0
                                            );
                                            const totalFunded = fundedCharges.reduce(
                                                (sum: number, c: any) => sum + calcChargeAmount(c),
                                                0
                                            );
                                            const grossLoan = loanAmount + totalFunded;

                                            let totalInterestForT = 0;
                                            if (interestType === 'FLAT') {
                                                totalInterestForT = Math.round(grossLoan * annualInterest * (t / 12));
                                            } else {
                                                totalInterestForT = Math.round(calculatedEmiForT * t - grossLoan);
                                            }
                                            const totalOutflow = Math.round(
                                                downPayment + totalUpfront + calculatedEmiForT * t
                                            );

                                            return (
                                                <div className="space-y-3">
                                                    <div className="pb-2 border-b border-slate-200/60 dark:border-white/5">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary mb-1">
                                                            Finance Breakdown
                                                        </p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                                            {t} Months Plan
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            Financier
                                                        </span>
                                                        <span className="font-black text-slate-900 dark:text-white truncate ml-2 text-right">
                                                            {bank?.name || 'Standard'}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            Scheme
                                                        </span>
                                                        <span className="font-black text-slate-900 dark:text-white truncate ml-2 text-right">
                                                            {scheme?.name || 'Standard'}
                                                        </span>
                                                    </div>
                                                    {schemeId && (
                                                        <div className="flex justify-between items-center text-[10px] -mt-2">
                                                            <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                                Code
                                                            </span>
                                                            <span className="font-mono font-black text-brand-primary/70 text-[9px]">
                                                                {formatDisplayIdForUI(unformatDisplayId(schemeId))}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            Interest
                                                        </span>
                                                        <span className="font-mono font-black text-brand-primary">
                                                            {(annualInterest * 100).toFixed(2)}% ({interestType})
                                                        </span>
                                                    </div>

                                                    <div className="border-t border-slate-200/60 dark:border-white/5 pt-2" />

                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            Loan Amount
                                                        </span>
                                                        <span className="font-mono font-black text-slate-900 dark:text-white">
                                                            ₹{loanAmount.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {upfrontCharges.length > 0 && (
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">
                                                                Upfront Charges
                                                            </span>
                                                            {upfrontCharges.map((c: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex justify-between items-start text-[9px] pl-2 py-0.5"
                                                                >
                                                                    <div className="flex flex-col pr-2 min-w-0">
                                                                        <span className="text-slate-600 dark:text-slate-400 truncate">
                                                                            {c.name}
                                                                        </span>
                                                                        {c.taxStatus === 'INCLUSIVE' && (
                                                                            <span className="text-slate-400 dark:text-slate-500 text-[7px]">
                                                                                Inclusive of GST
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                                                        ₹{calcChargeAmount(c).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-slate-200/60 dark:border-white/5">
                                                                <span className="font-bold text-slate-600 dark:text-slate-400">
                                                                    Total Upfront
                                                                </span>
                                                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                                                    ₹{totalUpfront.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {fundedCharges.length > 0 && (
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">
                                                                Loan Addons (Funded)
                                                            </span>
                                                            {fundedCharges.map((c: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex justify-between items-center text-[9px] pl-2 py-0.5"
                                                                >
                                                                    <span className="text-slate-600 dark:text-slate-400 truncate pr-2">
                                                                        {c.name}
                                                                    </span>
                                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                                                        ₹{calcChargeAmount(c).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {totalFunded > 0 && (
                                                        <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-200/60 dark:border-white/5">
                                                            <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                                Gross Loan
                                                            </span>
                                                            <span className="font-mono font-black text-slate-900 dark:text-white">
                                                                ₹{grossLoan.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="border-t border-slate-200/60 dark:border-white/5 pt-2" />

                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            Interest ({t}mo)
                                                        </span>
                                                        <span className="font-mono font-bold text-amber-400">
                                                            ₹{Math.max(0, totalInterestForT).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            Monthly EMI
                                                        </span>
                                                        <span className="font-mono font-black text-brand-primary text-xs">
                                                            ₹{calculatedEmiForT.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="border-t border-brand-primary/20 pt-2" />

                                                    <div className="flex justify-between items-center text-[11px]">
                                                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                                            Total Outflow
                                                        </span>
                                                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                                                            ₹{totalOutflow.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 pt-4 border-t border-white/5 bg-slate-50/50 dark:bg-white/[0.02] mt-auto">
                <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase italic tracking-widest text-slate-600 dark:text-slate-400">
                            Selected EMI
                        </span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">
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
