/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle2, SlidersHorizontal, Edit2 } from 'lucide-react';
import { formatDisplayIdForUI, unformatDisplayId } from '@/lib/displayId';
import { formatInterestRate } from '@/utils/formatVehicleSpec';

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
    const grossLoan = Math.round(loanAmount + totalAllCharges);

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
        { label: 'Down Payment', value: `₹${displayDownPayment.toLocaleString('en-IN')}` },
        ...financeCharges.map(charge => ({
            label: charge.label,
            value: typeof charge.value === 'number' ? `₹${charge.value.toLocaleString('en-IN')}` : charge.value,
            helpText: charge.helpText,
        })),
        { label: 'Loan Amount', value: `₹${loanAmount.toLocaleString('en-IN')}` },
        { label: `Interest (${interestType})`, value: formatInterestRate(annualInterest), isHighlight: true },
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
        <div className="md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none rounded-[2.5rem] md:rounded-none overflow-hidden flex flex-col h-full group/fcard relative">
            <div className="w-full flex-1 flex gap-2 lg:gap-3 px-4 md:px-0 pb-4 overflow-x-auto max-w-[800px] mr-auto hide-scrollbar">
                {/* Independent Vertical Cards */}
                {[
                    { key: 'emi', label: 'EMI', align: 'text-left lg:text-center' },
                    { key: 'tenure', label: 'Tenure', align: 'text-center' },
                    { key: 'loan', label: 'Loan', align: 'text-center' },
                    { key: 'interest', label: 'Interest', align: 'text-center' },
                    { key: 'total', label: 'Total', align: 'text-right lg:text-center' },
                ].map(col => (
                    <div
                        key={col.key}
                        className="flex-1 min-w-[80px] flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-slate-50/80 w-full py-2.5 px-2 border-b border-slate-200 flex items-center justify-center shrink-0 h-[38px]">
                            <span className="text-[8px] font-bold tracking-[0.08em] text-slate-500">{col.label}</span>
                        </div>
                        {/* Vertical Cells */}
                        <div className="flex flex-col flex-1 divide-y divide-slate-100">
                            {tenures.map(t => {
                                const calculatedEmiForT = Math.round(calculateEMI(t));
                                const totalPaidViaEMI = calculatedEmiForT * t;
                                const totalInterest = Math.round(totalPaidViaEMI - grossLoan);
                                const totalCost = Math.round(totalPaidViaEMI + downPayment);
                                const isSelected = emiTenure === t;

                                let valueNode = <></>;

                                if (col.key === 'emi') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-black font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-700'}`}
                                        >
                                            ₹{calculatedEmiForT.toLocaleString('en-IN')}
                                        </span>
                                    );
                                } else if (col.key === 'tenure') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-bold font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-600'}`}
                                        >
                                            {String(t).padStart(2, '0')}mo
                                        </span>
                                    );
                                } else if (col.key === 'loan') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-semibold font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-500'}`}
                                        >
                                            ₹{grossLoan.toLocaleString('en-IN')}
                                        </span>
                                    );
                                } else if (col.key === 'interest') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-semibold font-mono tracking-tight ${totalInterest > 0 ? 'text-red-400/80' : 'text-slate-400'} ${isSelected && 'opacity-90'}`}
                                        >
                                            +₹{Math.max(0, totalInterest).toLocaleString('en-IN')}
                                        </span>
                                    );
                                } else if (col.key === 'total') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-bold font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-600'}`}
                                        >
                                            ₹{totalCost.toLocaleString('en-IN')}
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        key={`${col.key}-${t}`}
                                        onClick={() => {
                                            setEmiTenure && setEmiTenure(t);
                                        }}
                                        className={`w-full py-2.5 px-2 flex items-center justify-center transition-all duration-200 relative
                                        ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50/60'}`}
                                    >
                                        {/* Row sync hover highlight hack */}
                                        <div className="absolute inset-x-0 inset-y-0 opacity-0 group-hover/row:opacity-100 peer-hover:bg-slate-50/60 pointer-events-none" />

                                        {/* Selection Indicator: gold left-bar on EMI col, right-bar on Total col */}
                                        {isSelected && col.key === 'emi' && (
                                            <div className="absolute left-0 inset-y-0 w-[4px] bg-amber-400 rounded-r-full" />
                                        )}
                                        {isSelected && col.key === 'total' && (
                                            <div className="absolute right-0 inset-y-0 w-[3px] bg-amber-400/60" />
                                        )}

                                        {valueNode}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
