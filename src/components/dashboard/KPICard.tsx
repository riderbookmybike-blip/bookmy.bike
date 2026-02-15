'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const sparkData = [{ v: 40 }, { v: 30 }, { v: 45 }, { v: 50 }, { v: 35 }, { v: 55 }, { v: 60 }];

interface KPICardProps {
    title: string;
    value: string | number;
    delta?: string;
    isUp?: boolean;
    icon: any;
    sub?: string;
    onClick?: () => void;
    showSparkline?: boolean;
}

export const KPICard = ({
    title,
    value,
    delta,
    isUp,
    icon: Icon,
    sub,
    onClick,
    showSparkline = true,
}: KPICardProps) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 
                p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 
                group overflow-hidden relative cursor-pointer active:scale-95
                ${isUp ? 'neon-border-indigo hover:border-indigo-500/50' : 'hover:border-slate-400'}
            `}
        >
            {/* Gauge Backdrop */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] dark:opacity-10 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-indigo-500">
                    <path d="M 20 80 A 40 40 0 1 1 80 80" strokeWidth="6" strokeLinecap="round" />
                    <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="20"
                        strokeWidth="3"
                        className="origin-bottom transform rotate-45 group-hover:rotate-[150deg] transition-transform duration-1000"
                    />
                </svg>
            </div>

            <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                {delta && (
                    <div
                        className={`flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-xl border ${isUp ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}
                    >
                        {isUp ? 'ACCEL' : 'DECEL'}
                        {isUp ? (
                            <ArrowUpRight size={12} strokeWidth={3} />
                        ) : (
                            <ArrowDownRight size={12} strokeWidth={3} />
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-1 relative z-10">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">
                    {title}
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter racing-italic">
                    {value}
                </div>
                {sub && (
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-2 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-indigo-500" />
                        {sub}
                    </div>
                )}
            </div>

            {/* Micro Sparkline */}
            {showSparkline && (
                <div className="absolute inset-x-0 bottom-0 h-10 opacity-20 group-hover:opacity-40 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                            <Area
                                type="monotone"
                                dataKey="v"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fill="#6366f1"
                                fillOpacity={0.1}
                                animationDuration={3000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};
