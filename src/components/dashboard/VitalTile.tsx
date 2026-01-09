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
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all bg-white dark:bg-slate-900/50">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border ${colorMap[color]} shrink-0`}>
                    <Icon size={18} />
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</div>
                    <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">{value}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter leading-none mb-1">{sub}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">{meta}</div>
            </div>
        </div>
    );
};
