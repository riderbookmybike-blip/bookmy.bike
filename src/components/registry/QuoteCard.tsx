'use client';

import React from 'react';
import StatusBadge, { Tone } from './StatusBadge';

interface QuoteCardProps {
    id: string;
    customerName: string;
    total: number;
    status: string;
    validTill: string;
    variant?: 'mobile' | 'desktop';
}

const statusTone = (status: string): Tone => {
    const value = status.toLowerCase();
    if (value.includes('approved') || value.includes('closed')) return 'emerald';
    if (value.includes('pending') || value.includes('review')) return 'amber';
    if (value.includes('rejected')) return 'rose';
    return 'indigo';
};

export default function QuoteCard({
    id,
    customerName,
    total,
    status,
    validTill,
    variant = 'desktop',
}: QuoteCardProps) {
    const isMobile = variant === 'mobile';
    return (
        <div className={`group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 ${isMobile ? 'p-5' : 'p-7'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quote #{id}</span>
                    <StatusBadge label={status} tone={statusTone(status)} />
                </div>

                <div>
                    <h3 className={`font-black text-slate-900 dark:text-white uppercase tracking-tighter ${isMobile ? 'text-lg' : 'text-xl'}`}>
                        {customerName}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        <span>Valid till {validTill}</span>
                        <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">3 Items</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                    <span className={`font-black text-indigo-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                        ₹{total.toLocaleString()}
                    </span>
                    <button className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest">
                        Open
                    </button>
                </div>
            </div>
        </div>
    );
}
