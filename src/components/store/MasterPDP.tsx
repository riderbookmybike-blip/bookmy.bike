/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ShieldCheck,
    Zap,
    ShieldCheck as ShieldIcon,
    CheckCircle2,
    Package,
    ClipboardList,
    Wrench,
    Gift,
} from 'lucide-react';
import DynamicHeader from './Personalize/DynamicHeader';
import VisualsRow from './Personalize/VisualsRow';
import TabNavigation from './Personalize/Tabs/TabNavigation';
import AccessoriesTab from './Personalize/Tabs/AccessoriesTab';
import SidebarHUD from './Personalize/SidebarHUD';
import CascadingAccessorySelector from './Personalize/CascadingAccessorySelector';
import { ServiceOption } from '@/types/store';

interface MasterPDPProps {
    product: any;
    makeParam: string;
    modelParam: string;
    variantParam: string;
    data: any;
    handlers: {
        handleColorChange: (id: string) => void;
        handleShareQuote: () => void;
        handleSaveQuote: () => void;
        handleBookingRequest: () => void;
        toggleAccessory: (id: string) => void;
        toggleInsuranceAddon: (id: string) => void;
        toggleService: (id: string) => void;
        toggleOffer: (id: string) => void;
        updateQuantity: (id: string, delta: number, max?: number) => void;
        setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
        setEmiTenure: (months: number) => void;
        setConfigTab: (tab: 'PRICE_BREAKUP' | 'FINANCE' | 'ACCESSORIES' | 'INSURANCE' | 'REGISTRATION' | 'SERVICES' | 'OFFERS' | 'WARRANTY' | 'TECH_SPECS') => void;
        setUserDownPayment: (amount: number) => void;
    };
}

export function MasterPDP({ product, makeParam, modelParam, variantParam, data, handlers }: MasterPDPProps) {
    const {
        colors,
        selectedColor,
        regType,
        selectedAccessories,
        selectedInsuranceAddons,
        emiTenure,
        configTab,
        selectedServices,
        selectedOffers,
        quantities,
        userDownPayment,
        isReferralActive,
        baseExShowroom,
        rtoEstimates,
        rtoBreakdown,
        baseInsurance,
        insuranceBreakdown,
        insuranceAddonsPrice,
        otherCharges,
        accessoriesPrice,
        servicesPrice,
        offersDiscount,
        colorDiscount,
        totalOnRoad,
        downPayment,
        minDownPayment,
        maxDownPayment,
        emi,
        annualInterest,
        loanAmount,
        activeAccessories,
        activeServices,
        availableInsuranceAddons,
        warrantyItems
    } = data;

    const {
        handleColorChange,
        handleShareQuote,
        handleSaveQuote,
        handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        toggleOffer,
        updateQuantity,
        setRegType,
        setEmiTenure,
        setConfigTab,
        setUserDownPayment,
    } = handlers;

    // Set default tab to Finance or Accessories if Price Breakup is active (since it's now in the sidebar)
    useEffect(() => {
        if (configTab === 'PRICE_BREAKUP') {
            setConfigTab('FINANCE');
        }
    }, []);

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0];

    const totalMRP =
        (product.mrp || baseExShowroom + 5000) +
        rtoEstimates +
        baseInsurance +
        accessoriesPrice +
        servicesPrice +
        otherCharges;

    const totalSavings = offersDiscount + colorDiscount + (isReferralActive ? 5000 : 0);

    const priceBreakupData = [
        { label: 'Showroom Price', value: baseExShowroom },
        { label: `Registration (${regType})`, value: rtoEstimates, breakdown: rtoBreakdown },
        { label: 'Required Insurance', value: baseInsurance, breakdown: insuranceBreakdown },
        { label: 'Extra Insurance', value: insuranceAddonsPrice },
        { label: 'Accessories', value: accessoriesPrice },
        { label: 'Services / AMC', value: servicesPrice },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges }] : []),
        { label: 'Delivery TAT', value: '7 DAYS', isInfo: true },
        { label: 'Savings Applied', value: offersDiscount, isDeduction: true },
        ...(colorDiscount > 0 ? [{ label: 'Color Offer', value: colorDiscount, isDeduction: true }] : []),
        ...(isReferralActive ? [{ label: 'Member Invite', value: 5000, isDeduction: true }] : []),
    ];

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];

        switch (product.bodyType) {
            case 'SCOOTER':
                return '/images/categories/scooter_nobg.png';
            case 'MOTORCYCLE':
                return '/images/categories/motorcycle_nobg.png';
            case 'MOPED':
                return '/images/categories/moped_nobg.png';
            default:
                return '/images/hero-bike.png';
        }
    };

    const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false, isRadio = false, breakdown }: any) => {
        const quantity = isSelected ? quantities[item.id] || 1 : 0;
        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
        const billedAmount = isSelected ? finalPrice * quantity : 0;

        return (
            <div
                onClick={() => !isMandatory && onToggle && onToggle()}
                className={`group relative p-4 rounded-[2.5rem] border transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer
                    ${isSelected
                        ? 'bg-brand-primary/5 border-brand-primary/30'
                        : 'bg-white/[0.03] border-slate-200 dark:border-white/5 hover:bg-white/[0.05] hover:border-slate-300 dark:hover:border-white/10'
                    }
                    ${isMandatory ? 'cursor-default opacity-90' : ''}
                `}
            >
                {/* Breakdown Tooltip */}
                {breakdown && breakdown.length > 0 && (
                    <div className="absolute top-full left-14 mt-2 w-64 p-3 glass-panel dark:bg-black/80 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 border-b border-white/5 pb-1">Charge Breakdown</p>
                            {breakdown.map((b: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-[10px] text-slate-300">
                                    <span>{b.label}</span>
                                    <span className="font-mono">₹{b.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        {/* Arrow */}
                        <div className="absolute bottom-full left-4 -mb-1 w-2 h-2 bg-neutral-950 border-l border-t border-white/10 rotate-45 transform"></div>
                    </div>
                )}

                <div className="flex-1 flex items-center justify-between gap-6">
                    {/* 1. Identity */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shrink-0
                            ${isSelected
                                    ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_15px_rgba(255,215,0,0.25)]'
                                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                                }`}
                        >
                            {configTab === 'INSURANCE' ? <ShieldIcon size={20} /> : <Zap size={20} />}
                        </div>
                        <div>
                            <p
                                className={`text-xs md:text-sm font-black uppercase italic tracking-wider transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                            >
                                {item.name}
                            </p>
                            {item.description && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 2. Metrics Block (Price Breakdown) */}
                    <div className="flex-1 flex items-center justify-end gap-8 pr-2">
                        <div className="text-center min-w-[60px] hidden md:block">
                            <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-50">
                                Base
                            </span>
                            <span className="text-[10px] font-bold font-mono text-slate-400">
                                ₹{(item.price || 0).toLocaleString()}
                            </span>
                        </div>
                        {item.discountPrice > 0 ? (
                            <div className="text-center min-w-[60px] hidden md:block">
                                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-50">
                                    Discount
                                </span>
                                <span className="text-[10px] font-bold font-mono text-emerald-500">
                                    -₹{(item.price - item.discountPrice).toLocaleString()}
                                </span>
                            </div>
                        ) : item.isOffer ? (
                            <div className="text-center min-w-[60px] hidden md:block">
                                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-50">
                                    Offer
                                </span>
                                <span className="text-[10px] font-bold font-mono text-emerald-500">
                                    -₹{(item.price || 0).toLocaleString()}
                                </span>
                            </div>
                        ) : null}
                        <div className="text-center min-w-[30px]">
                            <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-50">
                                Qty
                            </span>
                            <span className="text-[10px] font-bold font-mono text-slate-500">{quantity || 1}</span>
                        </div>
                        <div className="text-right min-w-[80px]">
                            <span className="block text-[7px] font-black text-brand-primary uppercase tracking-widest mb-0.5 opacity-50">
                                Line Total
                            </span>
                            <span
                                className={`text-sm font-black italic font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-400 opacity-20'}`}
                            >
                                ₹{Math.max(billedAmount, finalPrice).toLocaleString()}
                            </span>
                        </div>

                        {/* Selection Checkbox/Radio */}
                        <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${isSelected
                                    ? 'bg-brand-primary border-brand-primary scale-110 shadow-lg shadow-brand-primary/30'
                                    : 'border-slate-300 dark:border-slate-700 bg-transparent group-hover:border-brand-primary'
                                }`}
                        >
                            {isSelected && (
                                <CheckCircle2
                                    className="w-3.5 h-3.5 text-black animate-in zoom-in spin-in-180 duration-300"
                                    strokeWidth={3}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        const SectionLabel = ({ text }: { text: string }) => (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-6 mb-4">{text}</p>
        );

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

        switch (configTab) {
            case 'FINANCE':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <TabHeader icon={Zap} title="EMI Plan" subtext="Pick what works for you" />

                        {/* Slider Row */}
                        {/* Premium Gold Slider */}
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                        Downpayment
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400">Adjust to fit your budget</p>
                                </div>
                                <div className="text-3xl font-black italic text-brand-primary font-mono drop-shadow-[0_0_15px_rgba(244,176,0,0.3)]">
                                    ₹{downPayment.toLocaleString()}
                                </div>
                            </div>

                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range"
                                    min={minDownPayment}
                                    max={maxDownPayment}
                                    step={1000}
                                    value={downPayment}
                                    onChange={e => setUserDownPayment(parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer relative z-20 bg-transparent focus:outline-none"
                                    style={{
                                        WebkitAppearance: 'none',
                                    }}
                                />
                                {/* Custom Track */}
                                <div className="absolute inset-x-0 h-2 rounded-full overflow-hidden pointer-events-none z-10 bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#F4B000] to-[#FFD700] shadow-[0_0_15px_#F4B000]"
                                        style={{
                                            width: `${((downPayment - minDownPayment) / (maxDownPayment - minDownPayment)) * 100}%`,
                                        }}
                                    />
                                </div>
                                {/* Thumb Styles injected via style tag for strict control if needed, 
                                    but standard tailwind accent-color doesn't support complex shadows. 
                                    Reliance on updated global css or Webkit styles is usually needed for custom thumbs.
                                    For now, using standard input with refined track. */}
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Min: ₹{minDownPayment.toLocaleString()}</span>
                                <span>Max: ₹{maxDownPayment.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Tenure Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[24, 36, 48, 60].map(tenure => {
                                const emiValue = Math.round(
                                    (loanAmount * (annualInterest / 12) * Math.pow(1 + annualInterest / 12, tenure)) /
                                    (Math.pow(1 + annualInterest / 12, tenure) - 1)
                                );
                                const isSelected = emiTenure === tenure;

                                return (
                                    <button
                                        key={tenure}
                                        onClick={() => setEmiTenure(tenure)}
                                        className={`relative group p-6 rounded-[2rem] border transition-all duration-300 text-left overflow-hidden
                                            ${isSelected
                                                ? 'bg-brand-primary border-brand-primary shadow-[0_0_20px_rgba(244,176,0,0.2)]'
                                                : 'bg-white/[0.03] border-slate-200 dark:border-white/5 hover:border-brand-primary/50'
                                            }
                                        `}
                                    >
                                        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span
                                                    className={`text-4xl font-black italic tracking-tighter ${isSelected ? 'text-black' : 'text-slate-300 dark:text-slate-700'}`}
                                                >
                                                    {tenure}
                                                </span>
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isSelected ? 'border-black bg-black text-brand-primary' : 'border-slate-200 dark:border-white/10'}`}
                                                >
                                                    {isSelected && <Zap size={14} fill="currentColor" />}
                                                </div>
                                            </div>

                                            <div>
                                                <p
                                                    className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? 'text-black/60' : 'text-slate-500'}`}
                                                >
                                                    Monthly EMI
                                                </p>
                                                <p
                                                    className={`text-xl font-black font-mono ${isSelected ? 'text-black' : 'text-white'}`}
                                                >
                                                    ₹{emiValue.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'ACCESSORIES':
                // Group accessories by category
                const helmets = activeAccessories.filter((a: any) => a.category === 'HELMET');
                const others = activeAccessories.filter((a: any) => a.category !== 'HELMET');

                // Find currently selected helmet ID
                const selectedHelmetId = helmets.find((h: any) => selectedAccessories.includes(h.id))?.id;

                const handleHelmetSelect = (id: string) => {
                    // Since helmets are usually exclusive (1 per slot), we remove other helmets and add this one
                    // Just use toggleAccessory logic but ensure exclusivity if that's the rule
                    // For now, let's just use the toggle logic but clearer:
                    // 1. Remove all *other* helmets from selection
                    const otherHelmetIds = helmets.map((h: any) => h.id).filter((hid: string) => hid !== id);
                    const newSelection = selectedAccessories.filter((sid: string) => !otherHelmetIds.includes(sid));

                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                    // Updates state via parent handler (need to expose a direct set or simulate toggle)
                    // Since we only have toggle, we might need to iterate. 
                    // OR better: Update the handlers on parent to allow 'setExclusive'
                    // For MVP, just toggle the new one ON and others OFF? No, race conditions.

                    // Optimization: Just expose setSelectedAccessories or a bulk update in handlers?
                    // Currently only toggle is exposed. 
                    // Let's assume toggle is smart enough or we update the handler.

                    // ACTUALLY: The user's request "mandatory is variant 1 but i can add more too" 
                    // implies MULTI-SELECT is okay. "I can add more too".
                    // So maybe just standard toggle? 
                    // User said "in cascading effect bhut layage..." -> "will look like..."

                    // Let's use the Selector for "Configuring" the *Mandatory* one if it exists?
                    // If Helmets are mandatory, we want to swap.

                    // Let's try a swap logic: If I pick a new helmet, unselect the old one IF it was mandatory replacement?
                    // Simplest: Just use toggle. If they want 2 helmets, they get 2.
                    toggleAccessory(id);
                };

                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
                        <TabHeader icon={Package} title="Accessories" subtext="Personalize your ride" />

                        {/* 1. Cascading Selectors for Complex Categories (e.g. Helmets) */}
                        {helmets.length > 0 && (
                            <div className="space-y-4">
                                <SectionLabel text="Rider Gear (Helmets)" />
                                <CascadingAccessorySelector
                                    category="HELMET"
                                    items={helmets}
                                    selectedId={selectedHelmetId}
                                    onSelect={(id: string) => {
                                        // Exclusive Selection Logic for Helmets (Swap behavior)
                                        // 1. Find currently selected helmet(s)
                                        const current = selectedAccessories.filter((sid: string) => helmets.some((h: any) => h.id === sid));
                                        // Then toggle them OFF
                                        current.forEach((sid: string) => toggleAccessory(sid));
                                        // 3. Toggle new one (if not same)
                                        if (!current.includes(id)) {
                                            toggleAccessory(id);
                                        }
                                    }}
                                    label="Select Helmet"
                                />
                            </div>
                        )}

                        {/* 2. Standard Mandatory Items (Non-Helmet) */}
                        <div className="space-y-4">
                            <SectionLabel text="Essentials" />
                            {others.filter((a: any) => a.isMandatory).map((acc: any) => (
                                <ConfigItemRow
                                    key={acc.id}
                                    item={{ ...acc, maxQty: acc.maxQty || 1 }}
                                    isSelected={true}
                                    onToggle={() => { }}
                                    isMandatory={true}
                                />
                            ))}
                        </div>

                        {/* 3. Standard Optional Items (Non-Helmet) */}
                        <div className="space-y-4">
                            <SectionLabel text="Optional Upgrades" />
                            {others.filter((a: any) => !a.isMandatory).map((acc: any) => (
                                <ConfigItemRow
                                    key={acc.id}
                                    item={{ ...acc, maxQty: acc.maxQty || 1 }}
                                    isSelected={selectedAccessories.includes(acc.id)}
                                    onToggle={() => toggleAccessory(acc.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'REGISTRATION':
                // Use rtoOptions if available (Calculated), else fallback to old hardcoded (should not happen if hook is updated)
                const regItems = (data.rtoOptions && data.rtoOptions.length > 0) ? data.rtoOptions : [
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
            case 'INSURANCE':
                const insuranceItems = insuranceBreakdown || [];

                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <TabHeader icon={ShieldIcon} title="Insurance" subtext="Secure your journey" />

                        <div className="space-y-4 mb-10">
                            <SectionLabel text="Required Insurance (TP + OD)" />
                            <div className="space-y-3 px-2">
                                {insuranceItems.map((b: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <ShieldCheck size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase italic tracking-wider text-white">{b.label}</p>
                                                {b.detail && <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{b.detail}</p>}
                                            </div>
                                        </div>
                                        <p className="text-sm font-black font-mono text-white">₹{b.amount.toLocaleString()}</p>
                                    </div>
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
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'SERVICES':
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
            case 'OFFERS':
            case 'WARRANTY':
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
            default:
                return null;
        }
    };

    // Video Modal State
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0b0d10] text-slate-900 dark:text-white pb-24 transition-colors duration-1000 relative overflow-hidden">
            {/* Dynamic Background Glow */}
            <div
                className="fixed inset-0 pointer-events-none z-0 transition-all duration-[2000ms] opacity-30 dark:opacity-20 blur-[120px]"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${activeColorConfig.hex}33, transparent 50%), radial-gradient(circle at 70% 80%, ${activeColorConfig.hex}22, transparent 50%)`,
                }}
            />

            <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 pt-4 md:pt-6 lg:pt-8 pb-10 space-y-8 relative z-10">
                {/* 1. Context Navigation Row (Minimal) */}
                <DynamicHeader
                    breadcrumb={
                        <div className="flex items-center gap-4">
                            <Link href="/store" className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-all duration-500 hover:tracking-[0.35em]">
                                STORE
                            </Link>

                            <span className="text-brand-primary/30">•</span>

                            <Link href={`/store/catalog?make=${makeParam}`} className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-all duration-500 hover:tracking-[0.35em] uppercase">
                                {makeParam}
                            </Link>

                            <span className="text-brand-primary/30">•</span>

                            <span className="text-slate-900 dark:text-white font-black italic uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                {modelParam}
                            </span>
                        </div>
                    }
                />

                {/* 2. Main Flux Layout (Configurator | Sidebar Master) */}
                <div className="flex gap-16 items-start">
                    {/* Left Column: Visuals & Selection Engine */}
                    <div className="flex-1 space-y-10 min-w-0">
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <VisualsRow
                                colors={colors}
                                selectedColor={selectedColor}
                                onColorSelect={handleColorChange}
                                productImage={getProductImage()}
                                videoSource={activeColorConfig?.video || ''}
                                isVideoOpen={isVideoOpen}
                                onCloseVideo={() => setIsVideoOpen(false)}
                            />
                        </div>

                        <div className="glass-panel dark:bg-white/[0.02] rounded-[4rem] p-8 space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100 shadow-2xl">
                            <TabNavigation
                                activeTab={configTab}
                                onTabChange={id => setConfigTab(id as any)}
                                tabs={[
                                    { id: 'FINANCE', label: 'EMI Plan' },
                                    {
                                        id: 'ACCESSORIES',
                                        label: 'Accessories',
                                        count: selectedAccessories.length > 0 ? selectedAccessories.length : undefined,
                                    },
                                    { id: 'INSURANCE', label: 'Insurance' },
                                    { id: 'REGISTRATION', label: 'Registration' },
                                    {
                                        id: 'SERVICES',
                                        label: 'Services',
                                        count: selectedServices.length > 0 ? selectedServices.length : undefined,
                                    },
                                    {
                                        id: 'WARRANTY',
                                        label: 'Warranty',
                                        count: selectedOffers.length > 0 ? selectedOffers.length : undefined,
                                    },
                                ]}
                            />

                            <div className="min-h-[460px]">{renderTabContent()}</div>
                        </div>
                    </div>

                    {/* Right Column: Master Sidebar HUD (Single Source of Truth) */}
                    <SidebarHUD
                        product={product}
                        variantName={variantParam}
                        activeColor={activeColorConfig}
                        totalOnRoad={totalOnRoad}
                        totalMRP={totalMRP}
                        emi={emi}
                        emiTenure={emiTenure}
                        savings={totalSavings}
                        priceBreakup={priceBreakupData}
                        onGetQuote={handleBookingRequest}
                        onShare={handleShareQuote}
                        onSave={handleSaveQuote}
                        onDownload={() => { }}
                        onShowVideo={activeColorConfig?.video ? () => setIsVideoOpen(true) : undefined}
                        productImage={getProductImage()}
                        downPayment={userDownPayment}
                        pricingSource={data.pricingSource}
                        isEstimate={data.isEstimate}
                    />
                </div>
            </div>
        </div>
    );
}
