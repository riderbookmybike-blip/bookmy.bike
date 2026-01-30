/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';

interface FinanceTabProps {
    downPayment: number;
    minDownPayment: number;
    maxDownPayment: number;
    totalOnRoad: number;
    setUserDownPayment: (amount: number) => void;
    emiTenure: number;
    setEmiTenure: (months: number) => void;
    loanAmount: number;
    annualInterest: number;
    initialFinance?: {
        scheme?: {
            allowedTenures?: number[];
        };
    };
}

export default function FinanceTab({
    downPayment,
    minDownPayment,
    maxDownPayment,
    totalOnRoad,
    setUserDownPayment,
    emiTenure,
    setEmiTenure,
    loanAmount,
    annualInterest,
    initialFinance
}: FinanceTabProps) {
    // Local state for immediate UI feedback
    const [displayValue, setDisplayValue] = useState(downPayment);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Sync display value when prop changes (e.g., from external reset)
    useEffect(() => {
        setDisplayValue(downPayment);
    }, [downPayment]);

    // Debounced update handler
    const handleSliderChange = (value: number) => {
        setDisplayValue(value); // Immediate UI update

        // Clear existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer for actual update
        debounceTimer.current = setTimeout(() => {
            setUserDownPayment(value);
        }, 300); // 300ms debounce
    };

    const TabHeader = ({ icon: Icon, title, subtext }: any) => (
        <div className="flex items-center gap-6 px-4 mb-8">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/30 text-brand-primary shrink-0">
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                    {title}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">{subtext}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabHeader
                icon={Zap}
                title="FINANCE"
                subtext="Pick your EMI plan"
            />

            {/* Premium Down Payment Slider */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            Downpayment
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400">Adjust to fit your budget</p>
                    </div>
                    <div className="text-3xl font-black italic text-brand-primary font-mono drop-shadow-[0_0_15px_rgba(244,176,0,0.3)]">
                        ₹{displayValue.toLocaleString()}
                    </div>
                </div>

                {/* Slider Container */}
                <div className="relative pt-4 pb-2">
                    {/* Scale Marks */}
                    <div className="absolute inset-x-0 -top-2 flex justify-between px-1">
                        {(() => {
                            const marks = [];
                            const step = 5000;
                            for (let value = minDownPayment; value <= maxDownPayment; value += step) {
                                const percent = ((value - minDownPayment) / (maxDownPayment - minDownPayment)) * 100;
                                const is10k = value % 10000 === 0;
                                marks.push(
                                    <div
                                        key={value}
                                        className="absolute flex flex-col items-center"
                                        style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                                    >
                                        {is10k && (
                                            <span className="text-[7px] font-bold text-slate-400 mb-1">
                                                {(value / 1000).toFixed(0)}k
                                            </span>
                                        )}
                                        <div
                                            className={`w-[1px] ${is10k ? 'h-3 bg-slate-400' : 'h-1.5 bg-slate-300 dark:bg-slate-600'}`}
                                        />
                                    </div>
                                );
                            }
                            return marks;
                        })()}
                    </div>

                    {/* Slider Track - Split Style */}
                    <div className="relative h-8 flex items-center mt-6">
                        {/* Background Track (ahead of thumb - thin) */}
                        <div className="absolute inset-x-0 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />

                        {/* Filled Track (behind thumb - bold) */}
                        <div
                            className="absolute h-2 rounded-full transition-all duration-200"
                            style={{
                                width: `${((displayValue - minDownPayment) / (maxDownPayment - minDownPayment)) * 100}%`,
                                background: (() => {
                                    const dpPercent = (displayValue / totalOnRoad) * 100;
                                    if (dpPercent < 10) return 'linear-gradient(90deg, #ef4444, #f87171)'; // Red
                                    if (dpPercent < 20) return 'linear-gradient(90deg, #f97316, #fb923c)'; // Orange
                                    return 'linear-gradient(90deg, #10b981, #34d399)'; // Green
                                })(),
                                boxShadow: (() => {
                                    const dpPercent = (displayValue / totalOnRoad) * 100;
                                    if (dpPercent < 10) return '0 0 15px rgba(239, 68, 68, 0.5)';
                                    if (dpPercent < 20) return '0 0 15px rgba(249, 115, 22, 0.5)';
                                    return '0 0 15px rgba(16, 185, 129, 0.5)';
                                })()
                            }}
                        />

                        {/* Slider Input */}
                        <input
                            type="range"
                            min={minDownPayment}
                            max={maxDownPayment}
                            step={1000}
                            value={displayValue}
                            onChange={e => handleSliderChange(parseInt(e.target.value))}
                            className="w-full h-full appearance-none cursor-pointer relative z-20 bg-transparent focus:outline-none slider-enhanced"
                            style={{
                                WebkitAppearance: 'none',
                            }}
                        />
                    </div>
                </div>

                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Min: ₹{minDownPayment.toLocaleString()}</span>
                    <span className={`font-black ${(displayValue / totalOnRoad) * 100 < 10 ? 'text-red-500' :
                        (displayValue / totalOnRoad) * 100 < 20 ? 'text-orange-500' :
                            'text-emerald-500'
                        }`}>
                        {((displayValue / totalOnRoad) * 100).toFixed(1)}% Down
                    </span>
                    <span>Max: ₹{maxDownPayment.toLocaleString()}</span>
                </div>
            </div>

            {/* Vertical Tenure Pills */}
            <div className="space-y-3">
                {(initialFinance?.scheme?.allowedTenures || [24, 36, 48, 60]).map((tenure: number) => {
                    const emiValue = Math.round(
                        (loanAmount * (annualInterest / 12) * Math.pow(1 + annualInterest / 12, tenure)) /
                        (Math.pow(1 + annualInterest / 12, tenure) - 1)
                    );
                    const totalPayable = emiValue * tenure;
                    const totalInterest = totalPayable - loanAmount;
                    const isSelected = emiTenure === tenure;

                    // Popular tenure badges
                    let badge = null;
                    if (tenure === 24) {
                        badge = { label: 'POPULAR', color: 'bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' };
                    } else if (tenure === 30) {
                        badge = { label: 'USER CHOICE', color: 'bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]' };
                    } else if (tenure === 36) {
                        badge = { label: 'BEST VALUE', color: 'bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' };
                    }

                    return (
                        <div
                            key={tenure}
                            onClick={() => setEmiTenure(tenure)}
                            className={`group relative p-4 rounded-[2.5rem] border transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer overflow-visible
                                ${isSelected
                                    ? 'bg-brand-primary/5 border-brand-primary/30'
                                    : 'bg-white/[0.03] border-slate-200 dark:border-white/5 hover:bg-white/[0.05] hover:border-slate-300 dark:hover:border-white/10'
                                }
                            `}
                        >
                            {/* Badge */}
                            {badge && (
                                <div className={`absolute -top-2 left-16 ${badge.color} ${badge.glow} text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full z-10 animate-pulse`}>
                                    {badge.label}
                                </div>
                            )}

                            <div className="flex-1 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4 min-w-[120px]">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shrink-0
                                        ${isSelected
                                                ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_15px_rgba(255,215,0,0.25)]'
                                                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                                            }`}
                                    >
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-xs md:text-sm font-black uppercase italic tracking-wider transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {tenure} Months
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            EMI Loan Tenure
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-end gap-6 pr-2">
                                    <div className="text-center min-w-[90px]">
                                        <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-50">
                                            Interest
                                        </span>
                                        <span className="text-[10px] font-bold font-mono text-slate-400">
                                            ₹{totalInterest.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-center min-w-[90px]">
                                        <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-50">
                                            Total Cost
                                        </span>
                                        <span className="text-[10px] font-bold font-mono text-slate-400">
                                            ₹{totalPayable.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-center min-w-[90px]">
                                        <span className="block text-[7px] font-black text-brand-primary uppercase tracking-widest mb-0.5 opacity-50">
                                            Monthly EMI
                                        </span>
                                        <span className={`text-sm font-black italic font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-400 opacity-20'}`}>
                                            ₹{emiValue.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                        ${isSelected
                                            ? 'border-brand-primary bg-brand-primary scale-110'
                                            : 'border-slate-300 dark:border-white/20'
                                        }`}
                                    >
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
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
