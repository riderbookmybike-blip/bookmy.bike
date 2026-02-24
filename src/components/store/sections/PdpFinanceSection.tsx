/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ChevronDown, Banknote } from 'lucide-react';
import FinanceCard from '../Personalize/Cards/FinanceCard';
import DownPaymentSlider from '../Personalize/DownPaymentSlider';

export interface PdpFinanceSectionProps {
    layout: 'desktop' | 'mobile';
    data: any;
    handlers: {
        setEmiTenure: (months: number) => void;
        setUserDownPayment: (amount: number) => void;
    };
    displayOnRoad: number;
    footerEmi: number;
    isOpen?: boolean;
    onToggle?: () => void;
}

export function PdpFinanceSection({
    layout,
    data,
    handlers,
    displayOnRoad,
    footerEmi,
    isOpen,
    onToggle,
}: PdpFinanceSectionProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const {
        emi,
        emiTenure,
        downPayment,
        minDownPayment,
        maxDownPayment,
        userDownPayment,
        loanAmount,
        annualInterest,
        interestType,
        initialFinance,
    } = data;

    const { setEmiTenure, setUserDownPayment } = handlers;

    // Smooth DP slider animation (replicating DesktopPDP's animateDP)
    const dpAnimRef = useRef<number | null>(null);
    const animateDP = useCallback(
        (fromVal: number, targetVal: number) => {
            if (dpAnimRef.current) cancelAnimationFrame(dpAnimRef.current);
            const diff = targetVal - fromVal;
            if (diff === 0) return;
            const fullRange = (maxDownPayment || 0) - (minDownPayment || 0);
            const duration = fullRange > 0 ? (Math.abs(diff) / fullRange) * 10000 : 500;
            const startTime = performance.now();
            const step = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / Math.max(duration, 1), 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round((fromVal + diff * eased) / 500) * 500;
                setUserDownPayment(current);
                if (progress < 1) {
                    dpAnimRef.current = requestAnimationFrame(step);
                } else {
                    setUserDownPayment(targetVal);
                    dpAnimRef.current = null;
                }
            };
            dpAnimRef.current = requestAnimationFrame(step);
        },
        [maxDownPayment, minDownPayment, setUserDownPayment]
    );

    if (layout === 'desktop') {
        // Desktop: rendered inline inside hero accordion cards by DesktopPDP shell
        return (
            <div data-parity-section="finance" className="space-y-4">
                <FinanceCard
                    emi={emi}
                    emiTenure={emiTenure}
                    setEmiTenure={setEmiTenure}
                    downPayment={userDownPayment || downPayment}
                    setUserDownPayment={setUserDownPayment}
                    minDownPayment={minDownPayment || 0}
                    maxDownPayment={maxDownPayment || 0}
                    totalOnRoad={displayOnRoad}
                    loanAmount={loanAmount}
                    annualInterest={annualInterest}
                    interestType={interestType || 'REDUCING'}
                    financeCharges={data.financeCharges || []}
                    bank={initialFinance?.bank}
                    scheme={initialFinance?.scheme}
                />
            </div>
        );
    }

    // Mobile: collapsible accordion
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
            data-parity-section="finance"
            className="glass-panel bg-white/90 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
            <button onClick={handleToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <Banknote size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-[0.05em] text-brand-primary">Finance</p>
                        <p className="text-[11px] text-slate-500">
                            ₹ {(footerEmi || emi || 0).toLocaleString('en-IN')}/mo × {emiTenure}mo • Loan ₹{' '}
                            {(loanAmount || 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="px-5 pb-5">
                    <div className="border-t border-slate-200/60 pt-4 space-y-4">
                        <FinanceCard
                            emi={emi}
                            emiTenure={emiTenure}
                            setEmiTenure={setEmiTenure}
                            downPayment={userDownPayment || downPayment}
                            setUserDownPayment={setUserDownPayment}
                            minDownPayment={minDownPayment || 0}
                            maxDownPayment={maxDownPayment || 0}
                            totalOnRoad={displayOnRoad}
                            loanAmount={loanAmount}
                            annualInterest={annualInterest}
                            interestType={interestType || 'REDUCING'}
                            financeCharges={data.financeCharges || []}
                            bank={initialFinance?.bank}
                            scheme={initialFinance?.scheme}
                        />
                        <DownPaymentSlider
                            userDownPayment={userDownPayment || downPayment || 0}
                            minDownPayment={minDownPayment || 0}
                            maxDownPayment={maxDownPayment || 0}
                            displayOnRoad={displayOnRoad}
                            setUserDownPayment={setUserDownPayment}
                            animateDP={animateDP}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
