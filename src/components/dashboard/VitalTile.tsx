'use client';

import React from 'react';

interface VitalTileProps {
    icon: any;
    label: string;
    value: string;
    sub: string;
    meta: string;
    color: 'emerald' | 'blue' | 'indigo' | 'rose' | 'amber';
}

export const VitalTile = ({ icon: Icon, label, value, sub, meta, color }: VitalTileProps) => {
    const colorMap: Record<string, string> = {
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    };

    return (
        <div className="flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/5 hover:border-indigo-500/40 transition-all bg-white dark:bg-slate-900 group cursor-default">
            <div className="flex items-center gap-5">
                <div
                    className={`p-3 rounded-xl border-2 ${colorMap[color]} shrink-0 transition-transform group-hover:scale-110`}
                >
                    {Icon ? <Icon size={20} strokeWidth={2.5} /> : <div className="w-[20px] h-[20px]" />}
                </div>
                <div>
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                        {label}
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums racing-italic tracking-tighter">
                        {value}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1.5">
                    {sub}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                    {meta}
                </div>
            </div>
        </div>
    );
};
