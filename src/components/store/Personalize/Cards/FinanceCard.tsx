/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle2, SlidersHorizontal, Edit2 } from 'lucide-react';
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
    // Compute gross loan from scheme charges (upfront + funded/loan add-ons)
    const allSchemeCharges: any[] = scheme?.charges || [];
    const calcChargeAmt = (c: any) => {
        if (c.valueType === 'PERCENTAGE') return Math.round(loanAmount * (c.value / 100));
        return c.value || 0;
    };
    const totalAllCharges = allSchemeCharges.reduce((s: number, c: any) => s + calcChargeAmt(c), 0);
    const grossLoan = loanAmount + totalAllCharges;

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
    const tenures = [3, 6, 9, 12, 18, 24, 30, 36, 42, 48, 54, 60];

    // Helper to calculate EMI for a given tenure — respects FLAT vs REDUCING
    const calculateEMI = (t: number) => {
        if (grossLoan <= 0) return 0;

        if (interestType === 'FLAT') {
            // FLAT: Simple interest over entire tenure
            const totalInterest = grossLoan * annualInterest * (t / 12);
            return (grossLoan + totalInterest) / t;
        }

        // REDUCING: Standard amortization formula
        const monthlyRate = annualInterest / 12;
        if (monthlyRate === 0) return grossLoan / t;
        return (grossLoan * monthlyRate * Math.pow(1 + monthlyRate, t)) / (Math.pow(1 + monthlyRate, t) - 1);
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
        <div className="md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none md:dark:backdrop-blur-none md:border-0 md:shadow-none rounded-[2.5rem] md:rounded-none overflow-hidden flex flex-col h-full group/fcard relative">
            <div className="flex-1 flex flex-col">
                {/* Column headers */}
                <div className="w-full grid grid-cols-5 px-5 pb-1 mb-1.5 border-b border-slate-100 dark:border-white/5 shrink-0">
                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-slate-400 text-left">
                        EMI
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-slate-400 text-left">
                        Tenure
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-slate-400 text-center">
                        Loan
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-slate-400 text-right">
                        Interest
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-slate-400 text-right">
                        Total
                    </span>
                </div>
                {/* Pill rows */}
                <div className="w-full flex-1 flex flex-col justify-evenly gap-[2px]">
                    {tenures.map(t => {
                        const calculatedEmiForT = Math.round(calculateEMI(t));
                        const totalPaidViaEMI = calculatedEmiForT * t;
                        const totalInterest = totalPaidViaEMI - grossLoan;
                        const totalCost = totalPaidViaEMI + downPayment;
                        const isSelected = emiTenure === t;
                        return (
                            <button
                                key={t}
                                onClick={() => {
                                    setEmiTenure && setEmiTenure(t);
                                }}
                                className={`grid grid-cols-5 items-center py-1 px-5 rounded-lg border transition-all duration-300
                                ${
                                    isSelected
                                        ? 'bg-brand-primary/10 border-brand-primary shadow-[0_4px_15px_rgba(255,215,0,0.1)]'
                                        : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <span
                                    className={`text-[10px] font-black font-mono tracking-tight text-left ${isSelected ? 'text-brand-primary' : 'text-slate-700 dark:text-white/60'}`}
                                >
                                    ₹{calculatedEmiForT.toLocaleString()}
                                </span>
                                <span
                                    className={`text-[10px] font-black font-mono tracking-tight text-left ${isSelected ? 'text-brand-primary' : 'text-slate-600 dark:text-slate-400'}`}
                                >
                                    {String(t).padStart(2, '0')} Months
                                </span>
                                <span
                                    className={`text-[10px] font-black font-mono tracking-tight text-center ${isSelected ? 'text-brand-primary' : 'text-slate-500 dark:text-white/40'}`}
                                >
                                    ₹{grossLoan.toLocaleString()}
                                </span>
                                <span
                                    className={`text-[10px] font-black font-mono tracking-tight text-right ${totalInterest > 0 ? 'text-red-400/60' : 'text-slate-400'}`}
                                >
                                    +₹{Math.max(0, totalInterest).toLocaleString()}
                                </span>
                                <span
                                    className={`text-[10px] font-black font-mono tracking-tight text-right ${isSelected ? 'text-brand-primary' : 'text-slate-500 dark:text-white/40'}`}
                                >
                                    ₹{totalCost.toLocaleString()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
