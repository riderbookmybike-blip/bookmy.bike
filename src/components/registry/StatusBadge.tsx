'use client';

import React from 'react';

export type Tone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';

const toneMap: Record<Tone, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    slate: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export default function StatusBadge({ label, tone = 'slate' }: { label: string; tone?: Tone }) {
    return (
        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${toneMap[tone]}`}>
            {label}
        </span>
    );
}
