'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

type Device = 'phone' | 'tablet' | 'desktop';

interface Stat {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
}

interface StatsHeaderProps {
    stats: Stat[];
    /** Device from useBreakpoint — phone gets horizontal scroll */
    device?: Device;
}

const colorMap = {
    indigo: 'text-indigo-600 bg-indigo-50/50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50/50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50/50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50/50 border-rose-100',
    blue: 'text-blue-600 bg-blue-50/50 border-blue-100',
};

const iconBgMap = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    blue: 'bg-blue-100 text-blue-600',
};

export default function StatsHeader({ stats, device = 'desktop' }: StatsHeaderProps) {
    const isPhone = device === 'phone';

    if (isPhone) {
        return (
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
                <div className="flex gap-2 py-1" style={{ minWidth: 'max-content' }}>
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col p-3 rounded-lg border bg-white shadow-sm min-w-[140px] ${colorMap[stat.color].split(' ')[2]}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-1.5 rounded-md ${iconBgMap[stat.color]}`}>
                                    <stat.icon size={12} />
                                </div>
                                {stat.trend && (
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                        {stat.trend}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className={`bg-white border p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${colorMap[stat.color].split(' ')[2]}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${iconBgMap[stat.color]}`}>
                            <stat.icon size={14} />
                        </div>
                        {stat.trend && (
                            <div className="flex items-center gap-1">
                                <span
                                    className={`text-[9px] font-black uppercase tracking-tighter ${colorMap[stat.color].split(' ')[0]}`}
                                >
                                    {stat.trend}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">
                            {stat.value}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {stat.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
