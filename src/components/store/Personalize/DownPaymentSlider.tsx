/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef } from 'react';
import { Edit2 } from 'lucide-react';

export interface DownPaymentSliderProps {
    userDownPayment: number;
    minDownPayment: number;
    maxDownPayment: number;
    displayOnRoad: number;
    setUserDownPayment: (val: number) => void;
    animateDP: (from: number, to: number) => void;
}

export default function DownPaymentSlider({
    userDownPayment,
    minDownPayment,
    maxDownPayment,
    displayOnRoad,
    setUserDownPayment,
    animateDP,
}: DownPaymentSliderProps) {
    const dpClickRef = useRef({ preVal: 0, time: 0, x: 0, targetVal: 0 });
    const currentDP = userDownPayment || 0;
    const range = maxDownPayment - minDownPayment;
    const fillPct = range > 0 ? ((currentDP - minDownPayment) / range) * 100 : 0;
    const dpOfOnRoad = displayOnRoad > 0 ? (currentDP / displayOnRoad) * 100 : 0;

    // Dynamic hue: red (0%) → yellow (20%) → green (40%+)
    let hue: number;
    if (dpOfOnRoad <= 20) hue = (dpOfOnRoad / 20) * 30;
    else if (dpOfOnRoad <= 40) hue = 30 + ((dpOfOnRoad - 20) / 20) * 50;
    else hue = 80 + Math.min((dpOfOnRoad - 40) / 30, 1) * 60;
    const fillColor = `hsl(${hue}, 80%, 50%)`;
    const trackBg =
        typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
            ? 'rgba(255,255,255,0.1)'
            : '#e2e8f0';

    // Build milestone labels + tick marks
    const milestones: React.ReactNode[] = [];
    if (range > 0) {
        for (let v = 0; v <= maxDownPayment; v += 10000) {
            if (v < minDownPayment) v = minDownPayment;
            const pct = ((v - minDownPayment) / range) * 100;
            if (pct < 0 || pct > 100) continue;
            const kVal = v / 1000;
            const label =
                v === 0 ? '₹0' : kVal >= 100 ? `₹${(kVal / 100).toFixed(kVal % 100 === 0 ? 0 : 1)}L` : `₹${kVal}K`;
            milestones.push(
                <div
                    key={`label-${v}`}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pct}%`, top: '50%', transform: 'translateX(-50%)' }}
                >
                    <div className="w-[1px] h-[6px] bg-slate-400 rounded-full" />
                    <span className="text-[7px] font-black text-slate-400 mt-[1px] tabular-nums whitespace-nowrap">
                        {label}
                    </span>
                </div>
            );
        }
        for (let v = minDownPayment; v <= maxDownPayment; v += 1000) {
            if (v % 10000 === 0) continue;
            const pct = ((v - minDownPayment) / range) * 100;
            if (pct <= fillPct) continue;
            milestones.push(
                <div
                    key={v}
                    className="absolute top-1/2 -translate-y-1/2 w-[1px] h-[2px] bg-slate-400 opacity-10 rounded-full"
                    style={{ left: `${pct}%` }}
                />
            );
        }
    }

    return (
        <div
            className="shrink-0 pl-5 pr-5 pt-3 pb-8 border-t border-slate-100 bg-brand-primary/[0.03]"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Down Payment</span>
                <div className="flex items-center gap-0">
                    <span className="text-xs font-black font-mono tracking-tight text-brand-primary leading-none">
                        ₹
                    </span>
                    <input
                        type="number"
                        value={currentDP}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                const from = userDownPayment || 0;
                                animateDP(from, val);
                            }
                        }}
                        className="bg-transparent text-xs font-black font-mono tracking-tight text-slate-900 outline-none border-b border-transparent focus:border-brand-primary transition-all p-0"
                        style={{
                            width: `${Math.max(String(currentDP).length, 1) * 8 + 4}px`,
                        }}
                    />
                    <Edit2
                        size={10}
                        className="text-slate-400 hover:text-brand-primary transition-colors cursor-pointer ml-0.5"
                        strokeWidth={3}
                    />
                </div>
            </div>

            {/* Slider Track */}
            <div className="relative h-[32px]">
                <div className="absolute top-[4px] left-0 right-0">
                    <input
                        type="range"
                        min={minDownPayment}
                        max={maxDownPayment}
                        step={500}
                        value={currentDP}
                        onPointerDown={e => {
                            dpClickRef.current = {
                                preVal: currentDP,
                                time: Date.now(),
                                x: e.clientX,
                                targetVal: currentDP,
                            };
                        }}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                dpClickRef.current.targetVal = val;
                                setUserDownPayment(val);
                            }
                        }}
                        onPointerUp={e => {
                            const { preVal, time, x, targetVal } = dpClickRef.current;
                            const isClick = Date.now() - time < 300 && Math.abs(e.clientX - x) < 5;
                            if (isClick && targetVal !== preVal) {
                                setUserDownPayment(preVal);
                                animateDP(preVal, targetVal);
                            }
                        }}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer relative z-10"
                        style={{
                            background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${fillPct}%, ${trackBg} ${fillPct}%, ${trackBg} 100%)`,
                            accentColor: fillColor,
                        }}
                    />
                </div>
                <div className="absolute top-[4px] left-0 right-0 h-[28px] pointer-events-none">{milestones}</div>
            </div>
        </div>
    );
}
