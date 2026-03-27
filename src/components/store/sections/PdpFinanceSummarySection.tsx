/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ChevronDown, Landmark } from 'lucide-react';
import FinanceSummaryPanel from '../Personalize/FinanceSummaryPanel';
import { pickBestCandidateForTenure } from '@/utils/financeCandidateSelection';

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
    /** Phase 2: when false, finance values are masked */
    isCommercialReady?: boolean;
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
    isCommercialReady = true,
}: PdpFinanceSummarySectionProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { initialFinance, userDownPayment, downPayment, loanAmount, emiTenure, annualInterest, interestType } = data;

    const effectiveDownPayment = userDownPayment || downPayment || 0;
    const candidates: Array<{ bank: any; scheme: any }> = Array.isArray(initialFinance?.candidateSchemes)
        ? initialFinance.candidateSchemes
        : [];

    const tenureWinner = React.useMemo(
        () =>
            pickBestCandidateForTenure(candidates, {
                tenure: Number(emiTenure),
                baseLoan: Math.max(0, Math.round(displayOnRoad - effectiveDownPayment)),
                totalOnRoad,
                downPayment: effectiveDownPayment,
            }),
        [candidates, emiTenure, effectiveDownPayment, displayOnRoad, totalOnRoad]
    );
    const effectiveFinance =
        tenureWinner?.scheme && tenureWinner?.bank
            ? { ...initialFinance, bank: tenureWinner.bank, scheme: tenureWinner.scheme }
            : candidates.length > 0
              ? { ...initialFinance, bank: null, scheme: null }
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
        if (!isCommercialReady) return null; // desktop: hide panel entirely until ready
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
                        {isCommercialReady ? (
                            <>
                                {financerName && (
                                    <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{financerName}</p>
                                )}
                                {schemeName && (
                                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{schemeName}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-[10px] italic text-slate-400 leading-snug mt-0.5">
                                Login to view EMI details
                            </p>
                        )}
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
                        {isCommercialReady ? (
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
                        ) : (
                            <p className="text-[12px] italic text-slate-400 py-4 text-center">
                                Login to unlock finance details
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
