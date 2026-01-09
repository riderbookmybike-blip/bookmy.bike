'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const sparkData = [
    { v: 40 }, { v: 30 }, { v: 45 }, { v: 50 }, { v: 35 }, { v: 55 }, { v: 60 }
];

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

export const KPICard = ({ title, value, delta, isUp, icon: Icon, sub, onClick, showSparkline = true }: KPICardProps) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 
                p-6 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 
                group overflow-hidden relative cursor-pointer
                ${onClick ? 'hover:border-indigo-500/50' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-500 dark:text-white group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Icon size={20} />
                </div>
                {delta && (
                    <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${isUp ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
                        {delta}
                        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                )}
            </div>

            <div className="space-y-1 relative z-10">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter italic">{value}</div>
                {sub && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{sub}</div>}
            </div>

            {/* Micro Sparkline */}
            {showSparkline && (
                <div className="absolute inset-x-0 bottom-0 h-10 opacity-30">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                            <Area
                                type="monotone"
                                dataKey="v"
                                stroke="#6366f1"
                                strokeWidth={2}
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
