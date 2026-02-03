'use client';

import React from 'react';
import StatusBadge, { Tone } from './StatusBadge';

interface BookingCardProps {
    id: string;
    customerName: string;
    model: string;
    stage: string;
    deliveryDate: string;
    amount: number;
    variant?: 'mobile' | 'desktop';
}

const stageTone = (stage: string): Tone => {
    const value = stage.toLowerCase();
    if (value.includes('approved') || value.includes('disbursed')) return 'emerald';
    if (value.includes('pending') || value.includes('hold')) return 'amber';
    if (value.includes('cancel') || value.includes('rejected')) return 'rose';
    if (value.includes('delivered')) return 'blue';
    return 'indigo';
};

export default function BookingCard({
    id,
    customerName,
    model,
    stage,
    deliveryDate,
    amount,
    variant = 'desktop',
}: BookingCardProps) {
    const isMobile = variant === 'mobile';
    return (
        <div className={`group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 ${isMobile ? 'p-5' : 'p-7'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booking #{id}</span>
                    <StatusBadge label={stage} tone={stageTone(stage)} />
                </div>

                <div>
                    <h3 className={`font-black text-slate-900 dark:text-white uppercase tracking-tighter ${isMobile ? 'text-lg' : 'text-xl'}`}>
                        {customerName}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{model}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery {deliveryDate}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                    <span className={`font-black text-indigo-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                        ₹{amount.toLocaleString()}
                    </span>
                    <button className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest">
                        Track
                    </button>
                </div>
            </div>
        </div>
    );
}
