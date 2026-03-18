/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { computeFinanceMetrics } from './pdpComputations';

interface AmortizationPanelProps {
    initialFinance: any;
    displayOnRoad: number;
    userDownPayment: number;
    loanAmount: number;
    totalOnRoad: number;
    emiTenure: number;
    disbursementDate?: string | Date | null;
}

type ForeclosureSlab = { fromMonth: number; toMonth: number; chargePct: number };
type LenderPolicy = {
    emiDay: number;
    cutoffDay: number;
    lockInMonths: number;
    foreclosureSlabs: ForeclosureSlab[];
};

const DEFAULT_POLICY: LenderPolicy = {
    emiDay: 5,
    cutoffDay: 20,
    lockInMonths: 6,
    foreclosureSlabs: [
        { fromMonth: 0, toMonth: 6, chargePct: 6 },
        { fromMonth: 6, toMonth: 12, chargePct: 5 },
        { fromMonth: 12, toMonth: 24, chargePct: 4 },
        { fromMonth: 24, toMonth: 999, chargePct: 3 },
    ],
};

const LENDER_POLICY_MAP: Array<{ test: (name: string) => boolean; policy: LenderPolicy }> = [
    {
        test: name => name.includes('l&t') || name.includes('lt finance'),
        policy: {
            emiDay: 3,
            cutoffDay: 21,
            lockInMonths: 6,
            foreclosureSlabs: [
                { fromMonth: 0, toMonth: 6, chargePct: 6 },
                { fromMonth: 6, toMonth: 12, chargePct: 5 },
                { fromMonth: 12, toMonth: 24, chargePct: 4 },
                { fromMonth: 24, toMonth: 999, chargePct: 3 },
            ],
        },
    },
    {
        test: name => name.includes('bandhan'),
        policy: {
            emiDay: 5,
            cutoffDay: 20,
            lockInMonths: 6,
            foreclosureSlabs: [
                { fromMonth: 0, toMonth: 6, chargePct: 6 },
                { fromMonth: 6, toMonth: 12, chargePct: 5 },
                { fromMonth: 12, toMonth: 24, chargePct: 4 },
                { fromMonth: 24, toMonth: 999, chargePct: 3 },
            ],
        },
    },
    {
        test: name => name.includes('home credit'),
        policy: {
            emiDay: 5,
            cutoffDay: 20,
            lockInMonths: 6,
            foreclosureSlabs: [
                { fromMonth: 0, toMonth: 6, chargePct: 6 },
                { fromMonth: 6, toMonth: 12, chargePct: 5 },
                { fromMonth: 12, toMonth: 24, chargePct: 4 },
                { fromMonth: 24, toMonth: 999, chargePct: 3 },
            ],
        },
    },
    {
        test: name => name.includes('kotak'),
        policy: {
            emiDay: 5,
            cutoffDay: 20,
            lockInMonths: 6,
            foreclosureSlabs: [
                { fromMonth: 0, toMonth: 6, chargePct: 6 },
                { fromMonth: 6, toMonth: 12, chargePct: 5 },
                { fromMonth: 12, toMonth: 24, chargePct: 4 },
                { fromMonth: 24, toMonth: 999, chargePct: 3 },
            ],
        },
    },
    {
        test: name => name.includes('shriram'),
        policy: {
            emiDay: 5,
            cutoffDay: 20,
            lockInMonths: 6,
            foreclosureSlabs: [
                { fromMonth: 0, toMonth: 6, chargePct: 6 },
                { fromMonth: 6, toMonth: 12, chargePct: 5 },
                { fromMonth: 12, toMonth: 24, chargePct: 4 },
                { fromMonth: 24, toMonth: 999, chargePct: 3 },
            ],
        },
    },
];

const clampDay = (date: Date, day: number) => {
    const d = new Date(date);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, maxDay));
    return d;
};

const monthShiftDate = (baseDate: Date, addMonths: number, targetDay: number) => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + addMonths, 1);
    return clampDay(d, targetDay);
};

const formatDate = (date: Date) =>
    date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const solveReducingMonthlyRate = (principal: number, tenureMonths: number, emi: number): number => {
    if (principal <= 0 || tenureMonths <= 0 || emi <= 0) return 0;
    const minEmi = principal / tenureMonths;
    if (emi <= minEmi) return 0;

    const emiAt = (r: number) => {
        if (r <= 0) return principal / tenureMonths;
        const growth = Math.pow(1 + r, tenureMonths);
        return (principal * r * growth) / (growth - 1);
    };

    const derivativeAt = (r: number) => {
        const eps = 1e-7;
        return (emiAt(r + eps) - emiAt(r - eps)) / (2 * eps);
    };

    let rate = 0.01;
    for (let i = 0; i < 40; i += 1) {
        const f = emiAt(rate) - emi;
        if (Math.abs(f) < 1e-8) break;
        const d = derivativeAt(rate);
        if (!Number.isFinite(d) || Math.abs(d) < 1e-10) break;
        const next = rate - f / d;
        if (!Number.isFinite(next) || next <= 0) break;
        rate = next;
    }

    if (!Number.isFinite(rate) || rate <= 0) {
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 80; i += 1) {
            const mid = (lo + hi) / 2;
            const emiMid = emiAt(mid);
            if (emiMid > emi) hi = mid;
            else lo = mid;
        }
        rate = (lo + hi) / 2;
    }
    return Math.max(0, rate);
};

export default function AmortizationPanel({
    initialFinance,
    displayOnRoad,
    userDownPayment,
    loanAmount,
    totalOnRoad,
    emiTenure,
    disbursementDate,
}: AmortizationPanelProps) {
    const lenderName = String(initialFinance?.bank?.name || initialFinance?.bankName || '').toLowerCase();
    const policy = useMemo(
        () => LENDER_POLICY_MAP.find(x => x.test(lenderName))?.policy || DEFAULT_POLICY,
        [lenderName]
    );

    const metrics = computeFinanceMetrics({
        scheme: initialFinance?.scheme,
        displayOnRoad,
        userDownPayment,
        loanAmount,
        totalOnRoad,
        emiTenure,
    });

    const schedule = useMemo(() => {
        const tenure = Math.max(1, Number(emiTenure) || 1);
        const disb = disbursementDate ? new Date(disbursementDate) : new Date();
        const firstShift = disb.getDate() >= policy.cutoffDay ? 2 : 1;
        const firstEmiDate = monthShiftDate(disb, firstShift, policy.emiDay);

        const rows: Array<{
            month: number;
            dueDate: Date;
            emi: number;
            principal: number;
            interest: number;
            balance: number;
            foreclosureCharge: number;
            foreclosureAmount: number;
            lockIn: boolean;
        }> = [];

        const principal = Math.max(0, Number(metrics.grossLoan) || 0);
        const annualRate = Math.max(0, Number(metrics.annualInterest) || 0);
        const isFlat = String(metrics.interestType || '').toUpperCase() === 'FLAT';
        const monthlyRateInput = annualRate / 12;
        const emiExact = isFlat
            ? (principal + principal * annualRate * (tenure / 12)) / tenure
            : monthlyRateInput > 0
              ? (principal * monthlyRateInput * Math.pow(1 + monthlyRateInput, tenure)) /
                (Math.pow(1 + monthlyRateInput, tenure) - 1)
              : principal / tenure;
        const monthlyRate = isFlat ? solveReducingMonthlyRate(principal, tenure, emiExact) : monthlyRateInput;

        let balance = principal;

        for (let month = 1; month <= tenure; month += 1) {
            const dueDate = monthShiftDate(firstEmiDate, month - 1, policy.emiDay);
            const interestRaw = Math.max(0, balance * monthlyRate);
            const emiForRow = month === tenure ? balance + interestRaw : emiExact;
            const principalRaw = Math.max(0, emiForRow - interestRaw);
            const principalComponent = month === tenure ? balance : Math.min(balance, principalRaw);
            const interestComponent = Math.max(0, interestRaw);
            balance = Math.max(0, balance - principalComponent);

            const slab =
                policy.foreclosureSlabs.find(s => month > s.fromMonth && month <= s.toMonth) ||
                policy.foreclosureSlabs[policy.foreclosureSlabs.length - 1];
            const chargePct = slab?.chargePct || 4;
            const foreclosureCharge = Math.round(balance * (chargePct / 100));
            const foreclosureAmount = Math.round(balance + foreclosureCharge);
            const lockIn = month <= policy.lockInMonths;

            rows.push({
                month,
                dueDate,
                emi: Math.round(emiForRow),
                principal: Math.round(principalComponent),
                interest: Math.round(interestComponent),
                balance: Math.round(balance),
                foreclosureCharge,
                foreclosureAmount,
                lockIn,
            });
        }
        return rows;
    }, [disbursementDate, emiTenure, metrics, policy]);

    const yearlySchedules = useMemo(() => {
        const years = [];
        for (let i = 0; i < schedule.length; i += 12) {
            years.push({
                year: Math.floor(i / 12) + 1,
                months: schedule.slice(i, i + 12),
            });
        }
        return years;
    }, [schedule]);

    const [expandedYear, setExpandedYear] = useState<number | null>(1);

    return (
        <div className="flex flex-col h-full cursor-default [&_*]:cursor-default relative overflow-hidden pb-4">
            <div className="w-full flex-1 flex flex-col gap-3 overflow-y-auto max-w-[800px] mr-auto hide-scrollbar select-none pr-2 pb-4 pt-1">
                {yearlySchedules.map(ys => {
                    const isExpanded = expandedYear === ys.year;
                    return (
                        <div
                            key={ys.year}
                            className="flex flex-col border border-slate-200/80 rounded-2xl overflow-hidden bg-white/50 shadow-sm shrink-0"
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => setExpandedYear(isExpanded ? null : ys.year)}
                                className={`flex items-center justify-between w-full px-5 py-4 transition-colors ${isExpanded ? 'bg-slate-50/80' : 'bg-white hover:bg-slate-50/60'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isExpanded ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-slate-100 border-slate-200'}`}
                                    >
                                        <span
                                            className={`text-xs font-bold ${isExpanded ? 'text-brand-primary' : 'text-slate-500'}`}
                                        >
                                            Y{ys.year}
                                        </span>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold text-slate-800">Year {ys.year}</span>
                                        <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                                            Months {ys.months[0].month} - {ys.months[ys.months.length - 1].month}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isExpanded ? 'rotate-180 bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'bg-slate-100 text-slate-400 border border-transparent'}`}
                                >
                                    <ChevronDown size={18} />
                                </div>
                            </button>

                            {/* Expandable Content */}
                            <div
                                className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${isExpanded ? 'max-h-[850px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-3 pt-0 border-t border-slate-100/60 bg-slate-50/30">
                                    <div className="w-full flex gap-2 lg:gap-3 overflow-x-auto hide-scrollbar pt-3">
                                        {/* Independent Vertical Cards for this Year */}
                                        {[
                                            { key: 'month', label: 'Month', align: 'text-left' },
                                            { key: 'emi', label: 'EMI', align: 'text-center' },
                                            { key: 'principal', label: 'Principal', align: 'text-center' },
                                            { key: 'interest', label: 'Interest', align: 'text-center' },
                                            { key: 'balance', label: 'Balance', align: 'text-right' },
                                        ].map(col => (
                                            <div
                                                key={col.key}
                                                className="flex-1 min-w-[70px] flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm !h-max"
                                            >
                                                {/* Header */}
                                                <div className="bg-slate-50 w-full py-2.5 px-2 border-b border-slate-200 flex items-center justify-center shrink-0 h-[38px] rounded-t-xl">
                                                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-500">
                                                        {col.label}
                                                    </span>
                                                </div>
                                                {/* Vertical Cells */}
                                                <div className="flex flex-col flex-1 divide-y divide-slate-100">
                                                    {ys.months.map((r, idx) => {
                                                        let valueNode = <></>;

                                                        if (col.key === 'month') {
                                                            valueNode = (
                                                                <div className="flex items-center gap-1.5 justify-center w-full">
                                                                    <span className="text-[11px] lg:text-[12px] font-bold text-slate-600 w-4 text-center">
                                                                        {r.month}
                                                                    </span>
                                                                </div>
                                                            );
                                                        } else if (col.key === 'emi') {
                                                            valueNode = (
                                                                <span className="text-[10px] lg:text-[11px] font-bold font-mono tracking-tight text-slate-700">
                                                                    ₹{r.emi.toLocaleString('en-IN')}
                                                                </span>
                                                            );
                                                        } else if (col.key === 'principal') {
                                                            valueNode = (
                                                                <span className="text-[10px] lg:text-[11px] font-semibold font-mono tracking-tight text-emerald-600">
                                                                    ₹{r.principal.toLocaleString('en-IN')}
                                                                </span>
                                                            );
                                                        } else if (col.key === 'interest') {
                                                            valueNode = (
                                                                <span className="text-[10px] lg:text-[11px] font-semibold font-mono tracking-tight text-rose-500">
                                                                    ₹{r.interest.toLocaleString('en-IN')}
                                                                </span>
                                                            );
                                                        } else if (col.key === 'balance') {
                                                            valueNode = (
                                                                <span className="text-[10px] lg:text-[11px] font-bold font-mono tracking-tight text-slate-800">
                                                                    ₹{r.balance.toLocaleString('en-IN')}
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={`${col.key}-${r.month}`}
                                                                className={`w-full py-2.5 px-2 flex items-center justify-center relative transition-colors group/row h-[36px] hover:bg-slate-50/80 ${idx % 2 !== 0 ? 'bg-slate-50/30' : 'bg-white'}`}
                                                            >
                                                                {valueNode}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
