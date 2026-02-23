/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { Wrench } from 'lucide-react';
import { ServiceOption } from '@/types/store';

interface ServicesTabProps {
    activeServices: any[];
    selectedServices: string[];
    toggleService: (id: string) => void;
    ConfigItemRow: any;
}

export default function ServicesTab({
    activeServices,
    selectedServices,
    toggleService,
    ConfigItemRow
}: ServicesTabProps) {
    const TabHeader = ({ icon: Icon, title, subtext }: any) => (
        <div className="flex items-center gap-6 px-4 mb-8">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/30 text-brand-primary shrink-0">
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    {title}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">{subtext}</p>
            </div>
        </div>
    );

    const SectionLabel = ({ text }: { text: string }) => (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-6 mb-4">{text}</p>
    );

    const freeServiceSchedule = activeServices.filter((s: any) => s.isMandatory || s.price === 0);
    const paidServices = activeServices.filter((s: any) => !s.isMandatory && s.price > 0);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabHeader icon={Wrench} title="Services" subtext="Maintenance & Protection" />

            <div className="space-y-4 mb-10">
                <SectionLabel text="Standard Care (Free)" />
                {freeServiceSchedule.map((srv: any) => (
                    <ConfigItemRow
                        key={srv.id}
                        item={srv}
                        isSelected={true}
                        onToggle={() => { }}
                        isMandatory={true}
                    />
                ))}
            </div>

            <div className="space-y-4">
                <SectionLabel text="AMC Plans & Protection" />
                {paidServices.map((srv: ServiceOption) => (
                    <ConfigItemRow
                        key={srv.id}
                        item={srv}
                        isSelected={selectedServices.includes(srv.id)}
                        onToggle={() => toggleService(srv.id)}
                    />
                ))}
            </div>
        </div>
    );
}
