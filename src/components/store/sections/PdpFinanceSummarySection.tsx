/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ChevronDown, Landmark } from 'lucide-react';
import FinanceSummaryPanel from '../Personalize/FinanceSummaryPanel';

export interface PdpFinanceSummarySectionProps {
    layout: 'desktop' | 'mobile';
    data: any;
    displayOnRoad: number;
    totalOnRoad: number;
    totalSavings: number;
    coinPricing: any;
    footerEmi: number;
    isOpen?: boolean;
    onToggle?: () => void;
}

export function PdpFinanceSummarySection({
    layout,
    data,
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    coinPricing,
    footerEmi,
    isOpen,
    onToggle,
}: PdpFinanceSummarySectionProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { initialFinance, userDownPayment, downPayment, loanAmount, emiTenure, annualInterest, interestType } = data;

    const effectiveDownPayment = userDownPayment || downPayment || 0;
    const candidates: Array<{ bank: any; scheme: any }> = Array.isArray(initialFinance?.candidateSchemes)
        ? initialFinance.candidateSchemes
        : [];

    const isTenureSupported = (scheme: any, tenure: number) => {
        const allowed = Array.isArray(scheme?.allowedTenures) ? scheme.allowedTenures.map((t: any) => Number(t)) : [];
        if (allowed.length > 0) return allowed.includes(tenure);
        const minT = Number(scheme?.minTenure || 0);
        const maxT = Number(scheme?.maxTenure || 0);
        if (Number.isFinite(minT) && Number.isFinite(maxT) && minT > 0 && maxT >= minT) {
            return tenure >= minT && tenure <= maxT;
        }
        return true;
    };

    const calcChargeAmt = (charge: any, baseLoan: number) => {
        const type = String(charge?.type || charge?.valueType || 'FIXED').toUpperCase();
        if (type === 'PERCENTAGE') {
            const basisKey = String(charge?.calculationBasis || 'ON_ROAD').toUpperCase();
            const basis = basisKey === 'LOAN_AMOUNT' ? baseLoan : totalOnRoad;
            return Math.round(Number(basis || 0) * (Number(charge?.value || 0) / 100));
        }
        return Number(charge?.value || 0);
    };

    const pickWinnerForTenure = () => {
        const baseLoan = Math.max(0, Math.round(displayOnRoad - effectiveDownPayment));
        let best: { bank: any; scheme: any; emi: number } | null = null;
        for (const candidate of candidates) {
            const scheme = candidate?.scheme || {};
            if (!isTenureSupported(scheme, Number(emiTenure))) continue;

            const charges: any[] = Array.isArray(scheme?.charges) ? scheme.charges : [];
            const totalUpfront = charges
                .filter(c => String(c?.impact || '').toUpperCase() === 'UPFRONT')
                .reduce((s, c) => s + calcChargeAmt(c, baseLoan), 0);
            const totalFunded = charges
                .filter(c => String(c?.impact || '').toUpperCase() === 'FUNDED')
                .reduce((s, c) => s + calcChargeAmt(c, baseLoan), 0);
            const grossLoan = Math.max(0, Math.round(baseLoan + totalFunded + totalUpfront));
            if (grossLoan <= 0) continue;

            const annualRate = Number(scheme?.interestRate || 0) / 100;
            const iType = String(scheme?.interestType || 'REDUCING').toUpperCase();
            const emiRaw =
                iType === 'FLAT'
                    ? (grossLoan + grossLoan * annualRate * (Number(emiTenure) / 12)) / Number(emiTenure)
                    : (() => {
                          const monthlyRate = annualRate / 12;
                          if (monthlyRate === 0) return grossLoan / Number(emiTenure);
                          return (
                              (grossLoan * monthlyRate * Math.pow(1 + monthlyRate, Number(emiTenure))) /
                              (Math.pow(1 + monthlyRate, Number(emiTenure)) - 1)
                          );
                      })();
            const emi = Math.round(emiRaw);
            if (!best || emi < best.emi) best = { bank: candidate?.bank, scheme, emi };
        }
        return best;
    };

    const tenureWinner = React.useMemo(
        () => pickWinnerForTenure(),
        [candidates, emiTenure, effectiveDownPayment, displayOnRoad, totalOnRoad]
    );
    const effectiveFinance =
        tenureWinner?.scheme && tenureWinner?.bank
            ? { ...initialFinance, bank: tenureWinner.bank, scheme: tenureWinner.scheme }
            : initialFinance;
    const effectiveAnnualInterest = tenureWinner?.scheme?.interestRate
        ? Number(tenureWinner.scheme.interestRate) / 100
        : annualInterest;
    const effectiveInterestType = tenureWinner?.scheme?.interestType || interestType || 'REDUCING';

    const financerName =
        effectiveFinance?.bank?.name || effectiveFinance?.bank?.identity || effectiveFinance?.bankName || '';
    const schemeName = effectiveFinance?.scheme?.name || effectiveFinance?.scheme?.title || '';
    const financeHeaderSubtitle = financerName
        ? schemeName
            ? `${financerName} • ${schemeName}`
            : financerName
        : `₹${(footerEmi || 0).toLocaleString('en-IN')}/mo × ${emiTenure}mo`;

    if (layout === 'desktop') {
        return (
            <div data-parity-section="finance-summary">
                <FinanceSummaryPanel
                    initialFinance={effectiveFinance}
                    displayOnRoad={displayOnRoad}
                    userDownPayment={effectiveDownPayment}
                    loanAmount={loanAmount}
                    totalOnRoad={totalOnRoad}
                    totalSavings={totalSavings}
                    coinPricing={coinPricing}
                    emiTenure={emiTenure}
                    annualInterest={effectiveAnnualInterest}
                    interestType={effectiveInterestType}
                />
            </div>
        );
    }

    const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;
    const handleToggle = () => {
        if (onToggle) {
            onToggle();
            return;
        }
        setInternalOpen(prev => !prev);
    };

    return (
        <div
            data-parity-section="finance-summary"
            className="glass-panel bg-white/90 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
            <button onClick={handleToggle} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <Landmark size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black tracking-[0.04em] text-brand-primary leading-tight">
                            Finance Summary
                        </p>
                        {financerName && (
                            <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{financerName}</p>
                        )}
                        {schemeName && <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{schemeName}</p>}
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="px-5 pb-5">
                    <div className="border-t border-slate-200/60 pt-4">
                        <FinanceSummaryPanel
                            initialFinance={effectiveFinance}
                            displayOnRoad={displayOnRoad}
                            userDownPayment={effectiveDownPayment}
                            loanAmount={loanAmount}
                            totalOnRoad={totalOnRoad}
                            totalSavings={totalSavings}
                            coinPricing={coinPricing}
                            emiTenure={emiTenure}
                            annualInterest={effectiveAnnualInterest}
                            interestType={effectiveInterestType}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
