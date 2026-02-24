/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShieldCheck, ClipboardList, Wrench, Gift, ChevronDown } from 'lucide-react';
import AccordionAccessories from '../Personalize/Accordion/AccordionAccessories';
import AccordionInsurance from '../Personalize/Accordion/AccordionInsurance';
import AccordionRegistration from '../Personalize/Accordion/AccordionRegistration';
import FlatItemList from '../Personalize/Accordion/FlatItemList';

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
    const { selectedAccessories, selectedInsuranceAddons, selectedServices, regType } = data;
    const accTotal = Math.round((data.accessoriesPrice || 0) + (data.accessoriesDiscount || 0));
    const insAddonsTotal = Math.round((data.insuranceAddonsPrice || 0) + (data.insuranceAddonsDiscount || 0));
    const svcTotal = Math.round((data.servicesPrice || 0) + (data.servicesDiscount || 0));

    const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

    return [
        {
            id: 'ACCESSORIES',
            label: 'Accessories',
            subtext:
                selectedAccessories.length > 0
                    ? `${selectedAccessories.length} Selected • ${fmt(accTotal)}`
                    : 'Add Extras',
            icon: Package,
        },
        {
            id: 'INSURANCE',
            label: 'Insurance',
            subtext:
                selectedInsuranceAddons.length > 0
                    ? `${selectedInsuranceAddons.length} Addons • ${fmt(insAddonsTotal)}`
                    : 'Secure Rider',
            icon: ShieldCheck,
        },
        {
            id: 'REGISTRATION',
            label: 'Registration',
            subtext: regType || 'Choose Type',
            icon: ClipboardList,
        },
        {
            id: 'SERVICES',
            label: 'Services',
            subtext:
                selectedServices.length > 0 ? `${selectedServices.length} Selected • ${fmt(svcTotal)}` : 'AMC & Plans',
            icon: Wrench,
        },
        {
            id: 'WARRANTY',
            label: 'Warranty',
            subtext: 'Protect Ride',
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
                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                                        {card.label}
                                    </p>
                                    <p className="text-[11px] text-slate-500">{card.subtext}</p>
                                </div>
                            </div>
                            <ChevronDown
                                size={18}
                                className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
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
