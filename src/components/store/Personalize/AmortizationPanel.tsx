/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from 'react';
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

    return (
        <div className="flex flex-col h-full cursor-default [&_*]:cursor-default relative overflow-hidden pb-4">
            <div className="w-full flex-1 overflow-y-auto max-w-[800px] mr-auto hide-scrollbar select-none pr-2 pb-4 pt-1">
                <div className="w-full overflow-x-auto hide-scrollbar">
                    <table className="w-full min-w-[620px] border-collapse border border-slate-200/80 rounded-xl overflow-hidden">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50">
                                {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map(label => (
                                    <th
                                        key={label}
                                        className="h-[38px] px-2 text-center text-[8px] font-bold uppercase tracking-[0.15em] text-slate-500 border-b border-slate-200 bg-slate-50"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((r, idx) => (
                                <tr
                                    key={`m-${r.month}`}
                                    className={`h-[36px] transition-colors hover:bg-slate-50/80 ${idx % 2 !== 0 ? 'bg-slate-50/30' : 'bg-white'}`}
                                >
                                    <td className="px-2 text-center text-[11px] lg:text-[12px] font-bold text-slate-600 border-t border-slate-100">
                                        {r.month}
                                    </td>
                                    <td className="px-2 text-center text-[10px] lg:text-[11px] font-bold font-mono tracking-tight text-slate-700 border-t border-slate-100">
                                        ₹{r.emi.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-2 text-center text-[10px] lg:text-[11px] font-semibold font-mono tracking-tight text-emerald-600 border-t border-slate-100">
                                        ₹{r.principal.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-2 text-center text-[10px] lg:text-[11px] font-semibold font-mono tracking-tight text-rose-500 border-t border-slate-100">
                                        ₹{r.interest.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-2 text-center text-[10px] lg:text-[11px] font-bold font-mono tracking-tight text-slate-800 border-t border-slate-100">
                                        ₹{r.balance.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
