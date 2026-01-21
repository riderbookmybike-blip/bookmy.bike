'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Stat {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
}

interface StatsHeaderProps {
    stats: Stat[];
}

const colorMap = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-500 border-indigo-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-500 border-amber-500/20',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-500 border-rose-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-500 border-blue-500/20',
};

const iconBgMap = {
    indigo: 'bg-indigo-500/20',
    emerald: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
    rose: 'bg-rose-500/20',
    blue: 'bg-blue-500/20',
};

export default function StatsHeader({ stats }: StatsHeaderProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className={`relative overflow-hidden group p-6 rounded-[2rem] border bg-gradient-to-br ${colorMap[stat.color]} transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${iconBgMap[stat.color]} transition-transform duration-500 group-hover:rotate-12`}>
                            <stat.icon size={20} />
                        </div>
                        {stat.trend && (
                            <span className="text-[10px] font-black tracking-widest opacity-60 uppercase">
                                {stat.trend}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="text-3xl font-black italic tracking-tighter uppercase mb-1">
                            {stat.value}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                            {stat.label}
                        </div>
                    </div>

                    {/* Abstract Background Element */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
                        <stat.icon size={80} strokeWidth={4} />
                    </div>
                </div>
            ))}
        </div>
    );
}
