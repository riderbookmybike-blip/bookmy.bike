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
    const financerName = initialFinance?.bank?.name || initialFinance?.bank?.identity || initialFinance?.bankName || '';
    const schemeName = initialFinance?.scheme?.name || initialFinance?.scheme?.title || '';
    const financeHeaderSubtitle = financerName
        ? schemeName
            ? `${financerName} • ${schemeName}`
            : financerName
        : `₹${(footerEmi || 0).toLocaleString('en-IN')}/mo × ${emiTenure}mo`;

    if (layout === 'desktop') {
        return (
            <div data-parity-section="finance-summary">
                <FinanceSummaryPanel
                    initialFinance={initialFinance}
                    displayOnRoad={displayOnRoad}
                    userDownPayment={userDownPayment || downPayment || 0}
                    loanAmount={loanAmount}
                    totalOnRoad={totalOnRoad}
                    totalSavings={totalSavings}
                    coinPricing={coinPricing}
                    emiTenure={emiTenure}
                    annualInterest={annualInterest}
                    interestType={interestType || 'REDUCING'}
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
            <button onClick={handleToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <Landmark size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-[0.05em] text-brand-primary">Finance Summary</p>
                        <p className="text-[11px] text-slate-500">{financeHeaderSubtitle}</p>
                    </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="px-5 pb-5">
                    <div className="border-t border-slate-200/60 pt-4">
                        <FinanceSummaryPanel
                            initialFinance={initialFinance}
                            displayOnRoad={displayOnRoad}
                            userDownPayment={userDownPayment || downPayment || 0}
                            loanAmount={loanAmount}
                            totalOnRoad={totalOnRoad}
                            totalSavings={totalSavings}
                            coinPricing={coinPricing}
                            emiTenure={emiTenure}
                            annualInterest={annualInterest}
                            interestType={interestType || 'REDUCING'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
