'use client';

import React from 'react';
import StatusBadge from './StatusBadge';

interface ProductCardProps {
    name: string;
    price: number;
    imageUrl: string;
    tag?: string;
    subtitle?: string;
    variant?: 'mobile' | 'desktop';
}

export default function ProductCard({
    name,
    price,
    imageUrl,
    tag = 'NEW',
    subtitle = 'Premium Release',
    variant = 'desktop',
}: ProductCardProps) {
    const isMobile = variant === 'mobile';
    return (
        <div className={`group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-500 ${isMobile ? 'p-5' : 'p-7'} hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <StatusBadge label={tag} tone="indigo" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>
                </div>

                <div className="h-32 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden">
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                </div>

                <div>
                    <h3 className={`font-black text-slate-900 dark:text-white uppercase tracking-tighter ${isMobile ? 'text-lg' : 'text-xl'}`}>{name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">On-Road Price</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                    <span className={`font-black text-indigo-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                        ₹{price.toLocaleString()}
                    </span>
                    <button className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest">
                        View
                    </button>
                </div>
            </div>
        </div>
    );
}
