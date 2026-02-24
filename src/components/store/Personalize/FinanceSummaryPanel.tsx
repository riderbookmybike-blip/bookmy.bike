/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { computeFinanceMetrics, formatInterestRate } from './pdpComputations';

export interface FinanceSummaryPanelProps {
    initialFinance: any;
    displayOnRoad: number;
    userDownPayment: number;
    loanAmount: number;
    totalOnRoad: number;
    totalSavings: number;
    coinPricing: any;
    emiTenure: number;
    annualInterest: number;
    interestType: string;
}

const Row = ({
    label,
    value,
    accent,
    sub,
    indent,
}: {
    label: string;
    value: string;
    accent?: string;
    sub?: string;
    indent?: boolean;
    key?: number;
}) => (
    <div className={`flex justify-between items-start py-1 ${indent ? 'pl-4' : ''}`}>
        <div className="flex flex-col">
            <span
                className={`text-[11px] font-semibold uppercase tracking-[0.09em] ${indent ? 'text-slate-400' : 'text-slate-500'}`}
            >
                {label}
            </span>
            {sub && <span className="text-[9px] font-semibold tracking-[0.06em] text-emerald-600 mt-0.5">{sub}</span>}
        </div>
        <span
            className={`text-[13px] font-semibold leading-tight text-right tabular-nums ${accent || 'text-slate-800'}`}
        >
            {value}
        </span>
    </div>
);

export default function FinanceSummaryPanel({
    initialFinance,
    displayOnRoad,
    userDownPayment,
    loanAmount,
    totalOnRoad,
    totalSavings,
    coinPricing,
    emiTenure,
    annualInterest,
    interestType,
}: FinanceSummaryPanelProps) {
    const metrics = computeFinanceMetrics({
        scheme: initialFinance?.scheme,
        displayOnRoad,
        userDownPayment,
        loanAmount,
        totalOnRoad,
        emiTenure,
    });

    const {
        netLoan,
        grossLoan,
        totalFunded,
        totalUpfront: _totalUpfront,
        totalInterest,
        totalOutflow,
        upfrontCharges,
        fundedCharges,
    } = metrics;

    const calcAmt = (charge: any): number => {
        if (charge.type === 'PERCENTAGE') {
            const basis = charge.calculationBasis === 'LOAN_AMOUNT' ? loanAmount : totalOnRoad;
            return Math.round(basis * (charge.value / 100));
        }
        return charge.value || 0;
    };

    return (
        <div className="flex flex-col h-full">
            {/* HEADER: Finance Partner */}
            <div className="space-y-3 pb-4 border-b border-slate-200/60 shrink-0">
                <Row label="Financier" value={initialFinance?.bank?.name || 'Standard'} />
                <Row label="Scheme" value={initialFinance?.scheme?.name || 'Standard'} />
                <Row label="Interest Rate" value={`${formatInterestRate(annualInterest)} (${interestType})`} />
            </div>

            {/* CONTENT: Calculation Flow */}
            <div className="flex-1 flex flex-col justify-evenly py-3 gap-1">
                <Row label="Asset Cost (Net SOT)" value={`₹${(totalOnRoad + totalSavings).toLocaleString()}`} />
                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                    <Row
                        label="O' Circle Privileged"
                        value={`-₹${(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}`}
                        accent="text-emerald-500"
                    />
                )}
                <Row
                    label="Total Payable"
                    value={`₹${displayOnRoad.toLocaleString()}`}
                    accent="text-brand-primary font-black"
                />

                <div className="border-t border-slate-200/60" />

                <Row
                    label="Down Payment"
                    value={`-₹${(userDownPayment || 0).toLocaleString()}`}
                    accent="text-emerald-500"
                />
                <Row label="Net Loan Amount" value={`₹${netLoan.toLocaleString()}`} />
                {totalFunded > 0 &&
                    fundedCharges.map((c: any, i: number) => (
                        <Row key={i} label={c.name} value={`+₹${calcAmt(c).toLocaleString()}`} accent="text-red-400" />
                    ))}
                {upfrontCharges.map((c: any, i: number) => (
                    <Row key={i} label={c.name} value={`+₹${calcAmt(c).toLocaleString()}`} accent="text-red-400" />
                ))}
                <Row label="Gross Loan Amount" value={`₹${grossLoan.toLocaleString()}`} accent="text-brand-primary" />

                <div className="border-t border-slate-200/60" />

                <Row label="Total Extra Pay" value={`+₹${totalInterest.toLocaleString()}`} accent="text-red-400" />
                <Row
                    label="Total Outflow"
                    value={`₹${totalOutflow.toLocaleString()}`}
                    accent="text-brand-primary font-black"
                />
            </div>
        </div>
    );
}
