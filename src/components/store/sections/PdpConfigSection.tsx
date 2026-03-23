/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Shield, ClipboardList, Wrench, Gift, ChevronDown } from 'lucide-react';
import AccordionAccessories from '../Personalize/Accordion/AccordionAccessories';
import AccordionInsurance from '../Personalize/Accordion/AccordionInsurance';
import AccordionRegistration from '../Personalize/Accordion/AccordionRegistration';
import FlatItemList from '../Personalize/Accordion/FlatItemList';
import { INSURANCE_SUBTITLE } from '@/lib/constants/insuranceConstants';

// ─── Types ────────────────────────────────────────────────
export interface PdpConfigSectionProps {
    layout: 'desktop' | 'mobile';
    data: any;
    handlers: {
        toggleAccessory: (id: string) => void;
        toggleInsuranceAddon: (id: string) => void;
        toggleService: (id: string) => void;
        toggleOffer: (id: string) => void;
        updateQuantity: (id: string, delta: number, max?: number) => void;
        setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
    };
    mobileOpenCardId?: string | null;
    onMobileCardToggle?: (cardId: string) => void;
}

// ─── Shared config card definitions ───────────────────────
function getConfigCards(data: any) {
    const { selectedAccessories, selectedInsuranceAddons, selectedServices, regType, activeAccessories } = data;
    const accTotal = Math.round(data.accessoriesPrice || 0);
    const insTotal = Math.round((data.baseInsurance || 0) + (data.insuranceAddonsPrice || 0));

    // Resolve pure number or nested object for rtoEstimates
    const rtoVal = data.rtoEstimates;
    const rtoTotal = Math.round(
        typeof rtoVal === 'number'
            ? rtoVal
            : rtoVal?.[regType] || data.rtoOptions?.find((o: any) => o.id === regType)?.price || 0
    );

    const svcTotal = Math.round(data.servicesPrice || 0);
    const wtyTotal = Math.round((data.warrantyItems || []).reduce((acc: number, w: any) => acc + (w.price || 0), 0));

    const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;
    const getBadge = (v: number) => (v > 0 ? fmt(v) : 'Free');

    // Build accessory subtext: "Side Stand, Floor Matt & +5" or count
    const totalAvailableAcc = (activeAccessories || []).length;
    let accSubtext = totalAvailableAcc > 0 ? `${totalAvailableAcc} accessories to select` : 'Add Extras';
    let accBadge = accTotal > 0 ? fmt(accTotal) : ''; // No 'Free' for accessories
    const allActive = (activeAccessories || []).filter((a: any) => a.isMandatory || selectedAccessories.includes(a.id));
    if (allActive.length > 0) {
        const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        const cleanName = (raw: string) => {
            let n = toTitle(raw);
            n = n.replace(/\s+(Standard|Universal|Generic)?\s*(For\s+.*)$/i, '').trim();
            return n;
        };
        // Try unique product group names first
        let names = [...new Set<string>(allActive.map((a: any) => cleanName(a.productGroup || '')))].filter(Boolean);
        // If less than 2 unique groups, supplement with individual cleaned names
        if (names.length < 2) {
            const individualNames = allActive.map((a: any) =>
                cleanName(a.productGroup || a.displayName || a.name || '')
            );
            names = [...new Set<string>(individualNames)].filter(Boolean);
        }
        const totalItems = allActive.length;
        const shown = names.slice(0, 2).join(', ');
        const rest = totalItems - 2;
        accSubtext = rest > 0 ? `${shown} & +${rest}` : shown;
    }

    return [
        {
            id: 'ACCESSORIES',
            label: 'Accessories',
            subtext: accSubtext,
            subtext2: accBadge || 'Optional extras',
            totalLabel: accBadge,
            icon: Package,
        },
        {
            id: 'INSURANCE',
            label: 'Insurance',
            subtext: INSURANCE_SUBTITLE,
            subtext2: getBadge(insTotal),
            totalLabel: getBadge(insTotal),
            icon: Shield,
        },
        {
            id: 'REGISTRATION',
            label: 'Registration',
            subtext: (() => {
                const rtoOpts = data.rtoOptions || [];
                const match = rtoOpts.find((o: any) => o.id === regType);
                let label = match?.name || regType || 'Choose Type';
                if (regType === 'STATE')
                    label = data.stateCode ? `${data.stateCode.toUpperCase()} Registration` : 'State Registration';
                else if (regType === 'BH') label = 'Bharat (BH) Registration';
                else if (regType === 'COMPANY') label = 'Corporate Registration';
                return label;
            })(),
            subtext2: getBadge(rtoTotal),
            totalLabel: getBadge(rtoTotal),
            icon: ClipboardList,
        },
        {
            id: 'SERVICES',
            label: 'Services',
            subtext: (() => {
                const active = (data.activeServices || []).filter(
                    (s: any) => s.isMandatory || selectedServices.includes(s.id)
                );
                if (active.length === 0) return 'AMC & Plans';
                const names = active.map((s: any) => s.name || '').filter(Boolean);
                const shown = names.slice(0, 2).join(', ');
                const rest = active.length - 2;
                return rest > 0 ? `${shown} & +${rest}` : shown;
            })(),
            subtext2: getBadge(svcTotal),
            totalLabel: getBadge(svcTotal),
            icon: Wrench,
        },
        {
            id: 'WARRANTY',
            label: 'Warranty',
            subtext: (() => {
                const items = data.warrantyItems || [];
                if (items.length === 0) return 'Included Protection';
                const names = items.map((w: any) => w.name || '').filter(Boolean);
                const shown = names.slice(0, 2).join(', ');
                const rest = items.length - 2;
                return rest > 0 ? `${shown} & +${rest}` : shown;
            })(),
            subtext2: getBadge(wtyTotal),
            totalLabel: getBadge(wtyTotal),
            icon: Gift,
        },
    ];
}

// ─── Shared category content renderer ─────────────────────
function renderCategoryContent(categoryId: string, data: any, handlers: PdpConfigSectionProps['handlers']) {
    const {
        activeAccessories,
        selectedAccessories,
        quantities,
        insuranceRequiredItems,
        availableInsuranceAddons,
        selectedInsuranceAddons,
        baseInsurance,
        insuranceTP,
        insuranceOD,
        insuranceGstRate,
        regType,
        activeServices,
        selectedServices,
        warrantyItems,
    } = data;

    switch (categoryId) {
        case 'ACCESSORIES':
            return (
                <AccordionAccessories
                    activeAccessories={activeAccessories}
                    selectedAccessories={selectedAccessories}
                    quantities={quantities}
                    toggleAccessory={handlers.toggleAccessory}
                    updateQuantity={handlers.updateQuantity}
                />
            );
        case 'INSURANCE':
            return (
                <AccordionInsurance
                    insuranceRequiredItems={insuranceRequiredItems}
                    availableInsuranceAddons={availableInsuranceAddons}
                    selectedInsuranceAddons={selectedInsuranceAddons}
                    toggleInsuranceAddon={handlers.toggleInsuranceAddon}
                    baseInsurance={baseInsurance}
                    insuranceTP={insuranceTP}
                    insuranceOD={insuranceOD}
                    insuranceGstRate={insuranceGstRate}
                />
            );
        case 'REGISTRATION':
            return <AccordionRegistration regType={regType} setRegType={handlers.setRegType} data={data} />;
        case 'SERVICES':
            return (
                <FlatItemList
                    items={activeServices}
                    getSelected={(id: string) => selectedServices.includes(id)}
                    onToggle={(id: string) => handlers.toggleService(id)}
                />
            );
        case 'WARRANTY':
            return <FlatItemList items={warrantyItems} getSelected={() => true} onToggle={() => {}} isMandatory />;
        default:
            return null;
    }
}

// ─── Component ────────────────────────────────────────────
export function PdpConfigSection({
    layout,
    data,
    handlers,
    mobileOpenCardId,
    onMobileCardToggle,
}: PdpConfigSectionProps) {
    const configCards = getConfigCards(data);
    const [activeConfigTab, setActiveConfigTab] = useState<string | null>('ACCESSORIES');
    const [mobileOpenId, setMobileOpenId] = useState<string | null>('ACCESSORIES');

    if (layout === 'desktop') {
        return (
            <div data-parity-section="config" className="space-y-4">
                {/* Desktop: horizontal pillar grid */}
                <div className="grid grid-cols-5 gap-3">
                    {configCards.map(card => {
                        const Icon = card.icon;
                        const isActive = activeConfigTab === card.id;
                        return (
                            <button
                                key={card.id}
                                onClick={() => setActiveConfigTab(isActive ? null : card.id)}
                                className={`relative rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer
                                    ${
                                        isActive
                                            ? 'bg-white border-brand-primary shadow-lg scale-[1.02]'
                                            : 'bg-white/60 backdrop-blur-xl border-white/60 hover:bg-white/80'
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                        ${isActive ? 'bg-brand-primary text-black' : 'bg-slate-100 text-slate-400'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
                                    {card.label}
                                </span>
                                <span className="text-[9px] text-slate-500 leading-tight">{card.subtext}</span>

                                {card.totalLabel && (
                                    <span
                                        className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-[6px] border text-[9px] font-black tracking-tight tabular-nums transition-colors shadow-sm
                                        ${
                                            isActive
                                                ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/10'
                                                : 'text-slate-500 border-slate-200 bg-slate-50'
                                        }`}
                                    >
                                        {card.totalLabel}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Active tab content */}
                <AnimatePresence mode="wait">
                    {activeConfigTab && (
                        <motion.div
                            key={activeConfigTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-3xl border border-slate-200 bg-white p-6"
                        >
                            {renderCategoryContent(activeConfigTab, data, handlers)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Mobile: independent cards (no outer grouping), one open at a time.
    const activeMobileCardId = mobileOpenCardId !== undefined ? mobileOpenCardId : mobileOpenId;
    const selectMobileCard = (cardId: string) => {
        if (onMobileCardToggle) {
            onMobileCardToggle(cardId);
            return;
        }
        setMobileOpenId(cardId);
    };

    return (
        <div data-parity-section="config" className="space-y-2">
            {configCards.map(card => {
                const Icon = card.icon;
                const cardStateId = card.id.toLowerCase();
                const isCategoryOpen = activeMobileCardId?.toLowerCase() === cardStateId;
                return (
                    <div
                        key={card.id}
                        className="glass-panel bg-white/90 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
                    >
                        <button
                            onClick={() => selectMobileCard(cardStateId)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                    <Icon size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-black tracking-[0.04em] text-brand-primary leading-tight">
                                        {card.label}
                                    </p>
                                    <p className="text-[10px] text-slate-600 line-clamp-2 leading-snug mt-0.5">
                                        {card.subtext}
                                    </p>
                                    {card.subtext2 && (
                                        <p
                                            className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                                                card.subtext2 === 'Free' ? 'text-emerald-500' : 'text-slate-400'
                                            }`}
                                        >
                                            {card.subtext2}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`text-slate-400 transition-transform shrink-0 ml-2 ${isCategoryOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {isCategoryOpen && (
                            <div className="px-5 pb-5">
                                <div className="border-t border-slate-200/60 pt-4">
                                    {renderCategoryContent(card.id, data, handlers)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
