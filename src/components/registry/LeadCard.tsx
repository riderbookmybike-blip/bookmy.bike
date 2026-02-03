'use client';

import React from 'react';
import StatusBadge from './StatusBadge';

interface LeadCardProps {
    id: string;
    customerName: string;
    phone: string;
    status: string;
    intent?: 'HOT' | 'WARM' | 'COLD';
    model?: string;
    variant?: 'mobile' | 'desktop';
}

export default function LeadCard({
    id,
    customerName,
    phone,
    status,
    intent = 'WARM',
    model = 'GENERAL_ENQUIRY',
    variant = 'desktop',
}: LeadCardProps) {
    const isMobile = variant === 'mobile';
    return (
        <div className={`group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-7 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 ${isMobile ? 'p-5' : 'p-7'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        ID: {id}
                    </div>
                    {intent === 'HOT' && <span className="text-[9px] font-black text-rose-500 uppercase">Priority</span>}
                </div>

                <h3 className={`font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    {customerName}
                </h3>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{phone}</div>
                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter mt-2">
                    {model}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10 mt-4">
                    <StatusBadge label={status} tone="indigo" />
                    <span className="text-[10px] font-bold text-slate-400">{intent}</span>
                </div>
            </div>
        </div>
    );
}
