/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';

interface RegistrationTabProps {
    regType: 'STATE' | 'BH' | 'COMPANY';
    setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
    baseExShowroom: number;
    rtoOptions?: any[];
    ConfigItemRow: any;
}

export default function RegistrationTab({
    regType,
    setRegType,
    baseExShowroom,
    rtoOptions,
    ConfigItemRow
}: RegistrationTabProps) {
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

    // Use rtoOptions if available (Calculated), else fallback to old hardcoded
    const regItems = (rtoOptions && rtoOptions.length > 0) ? rtoOptions : [
        {
            id: 'STATE',
            name: 'State Registration',
            price: Math.round(baseExShowroom * 0.12),
            description: 'Standard RTO charges for your state.',
        },
        {
            id: 'BH',
            name: 'Bharat Series (BH)',
            price: Math.round(baseExShowroom * 0.08),
            description: 'For frequent interstate travel.',
        },
        {
            id: 'COMPANY',
            name: 'Company Registration',
            price: Math.round(baseExShowroom * 0.2),
            description: 'Corporate entity registration.',
        },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabHeader icon={ClipboardList} title="Registration" subtext="Get road-ready" />

            <div className="space-y-4 mb-10">
                <SectionLabel text="Most Popular" />
                <ConfigItemRow
                    item={regItems[0]}
                    isSelected={regType === 'STATE'}
                    onToggle={() => setRegType('STATE')}
                    isRadio
                    breakdown={regItems[0].breakdown}
                />
            </div>

            <div className="space-y-4">
                <SectionLabel text="Other Options" />
                {regItems.slice(1).map((item: any) => (
                    <ConfigItemRow
                        key={item.id}
                        item={item}
                        isSelected={regType === item.id}
                        onToggle={() => setRegType(item.id as any)}
                        isRadio
                        breakdown={item.breakdown}
                    />
                ))}
            </div>
        </div>
    );
}
