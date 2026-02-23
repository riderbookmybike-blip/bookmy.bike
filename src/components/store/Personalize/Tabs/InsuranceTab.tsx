/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface InsuranceTabProps {
    insuranceRequiredItems: any[];
    availableInsuranceAddons: any[];
    selectedInsuranceAddons: string[];
    toggleInsuranceAddon: (id: string) => void;
    ConfigItemRow: any;
}

export default function InsuranceTab({
    insuranceRequiredItems,
    availableInsuranceAddons,
    selectedInsuranceAddons,
    toggleInsuranceAddon,
    ConfigItemRow
}: InsuranceTabProps) {
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

    const requiredInsuranceItems = insuranceRequiredItems || [];

    return (
        <div className="animate-in fade-in-from-bottom-4 duration-700">
            <TabHeader icon={ShieldCheck} title="Insurance" subtext="Secure your journey" />

            <div className="space-y-4 mb-10">
                <SectionLabel text="Required Insurance" />
                <div className="space-y-3">
                    {requiredInsuranceItems.map((item: any) => (
                        <ConfigItemRow
                            key={item.id}
                            item={item}
                            isSelected={true}
                            onToggle={() => { }}
                            isMandatory={true}
                            breakdown={item.breakdown}
                        />
                    ))}
                </div>
            </div>

            {availableInsuranceAddons.length > 0 && (
                <div className="space-y-4">
                    <SectionLabel text="Extra Coverage (Add-ons)" />
                    {availableInsuranceAddons.map((i: any) => (
                        <ConfigItemRow
                            key={i.id}
                            item={i}
                            isSelected={selectedInsuranceAddons.includes(i.id)}
                            onToggle={() => toggleInsuranceAddon(i.id)}
                            isMandatory={i.isMandatory}
                            breakdown={i.breakdown}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
