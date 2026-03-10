/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from 'react';
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

        let balance = Math.max(0, Number(metrics.grossLoan) || 0);
        const monthlyRate = (Number(metrics.annualInterest) || 0) / 12;

        for (let month = 1; month <= tenure; month += 1) {
            const dueDate = monthShiftDate(firstEmiDate, month - 1, policy.emiDay);
            // Display schedule is amortized/reducing-style:
            // interest declines with outstanding balance, principal grows over time.
            const interestRaw = balance * monthlyRate;
            const principalRaw = Math.max(0, Number(metrics.monthlyEmi) - interestRaw);
            const principal = month === tenure ? balance : Math.min(balance, principalRaw);
            const interest = Math.max(0, interestRaw);
            balance = Math.max(0, balance - principal);

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
                emi: Math.round(metrics.monthlyEmi),
                principal: Math.round(principal),
                interest: Math.round(interest),
                balance: Math.round(balance),
                foreclosureCharge,
                foreclosureAmount,
                lockIn,
            });
        }
        return rows;
    }, [disbursementDate, emiTenure, metrics, policy]);

    return (
        <div className="flex flex-col h-full cursor-default [&_*]:cursor-default">
            <div className="pt-1 flex-1 overflow-auto cursor-default select-none rounded-lg border border-slate-200">
                <table className="w-full text-[10px] cursor-default">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                        <tr className="uppercase tracking-wider text-slate-500">
                            <th className="px-2 py-2 text-left">M</th>
                            <th className="px-2 py-2 text-left">Date</th>
                            <th className="px-2 py-2 text-right">EMI</th>
                            <th className="px-2 py-2 text-right">Principal</th>
                            <th className="px-2 py-2 text-right">Interest</th>
                            <th className="px-2 py-2 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((r, idx) => (
                            <tr
                                key={r.month}
                                className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                            >
                                <td className="px-2 py-1.5 font-semibold text-slate-600">{r.month}</td>
                                <td className="px-2 py-1.5 text-slate-600">{formatDate(r.dueDate)}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums">
                                    ₹{r.emi.toLocaleString('en-IN')}
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-emerald-600">
                                    ₹{r.principal.toLocaleString('en-IN')}
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-rose-500">
                                    ₹{r.interest.toLocaleString('en-IN')}
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                                    ₹{r.balance.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
