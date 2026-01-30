/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { Gift, ShieldCheck } from 'lucide-react';

interface WarrantyTabProps {
    warrantyItems: any[];
}

export default function WarrantyTab({ warrantyItems }: WarrantyTabProps) {
    const TabHeader = ({ icon: Icon, title, subtext }: any) => (
        <div className="flex items-center gap-6 px-4 mb-8">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/30 text-brand-primary shrink-0">
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                    {title}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">{subtext}</p>
            </div>
        </div>
    );

    const SectionLabel = ({ text }: { text: string }) => (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-6 mb-4">{text}</p>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabHeader icon={Gift} title="Warranty" subtext="Peace of mind guaranteed" />

            <div className="space-y-4 mb-10">
                <SectionLabel text="Manufacturer Warranty Details" />
                {warrantyItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {warrantyItems.map((w: any, idx: number) => (
                            <div key={idx} className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] flex flex-col gap-2">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-2">
                                    <ShieldCheck size={20} />
                                </div>
                                <p className="text-sm font-black uppercase italic tracking-tighter text-white">{w.label}</p>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Coverage</span>
                                        <span className="text-sm font-black font-mono text-brand-primary">{w.days} Days</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Usage Limit</span>
                                        <span className="text-sm font-black font-mono text-brand-primary">{w.km} KM</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-white/[0.03] rounded-[2rem] border border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Standard manufacturer warranty applies</p>
                    </div>
                )}
            </div>
        </div>
    );
}
