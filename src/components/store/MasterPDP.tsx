/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import '@/styles/slider-enhanced.css';
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
import { formatDisplayIdForUI } from '@/lib/displayId';
import VisualsRow from './Personalize/VisualsRow';
import TabNavigation from './Personalize/Tabs/TabNavigation';
import AccessoriesTab from './Personalize/Tabs/AccessoriesTab';
import SidebarHUD from './Personalize/SidebarHUD';
import CascadingAccessorySelector from './Personalize/CascadingAccessorySelector';
import { ServiceOption } from '@/types/store';

// Lazy load tab components for code splitting
const FinanceTab = dynamic(() => import('./Personalize/Tabs/FinanceTab'), {
    loading: () => (
        <div className="space-y-6 animate-pulse">
            <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-3xl" />
            <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-3xl" />
            <div className="h-32 bg-slate-100 dark:bg-white/5 rounded-3xl" />
        </div>
    )
});

const InsuranceTab = dynamic(() => import('./Personalize/Tabs/InsuranceTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const RegistrationTab = dynamic(() => import('./Personalize/Tabs/RegistrationTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const ServicesTab = dynamic(() => import('./Personalize/Tabs/ServicesTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const WarrantyTab = dynamic(() => import('./Personalize/Tabs/WarrantyTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

interface MasterPDPProps {
    product: any;
    makeParam: string;
    modelParam: string;
    variantParam: string;
    data: any;
    leadContext?: { id: string, name: string };
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

export function MasterPDP({ product, makeParam, modelParam, variantParam, data, handlers, leadContext }: MasterPDPProps) {
    // Configuration Constants
    const REFERRAL_BONUS = 5000; // Member referral discount amount

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
        accessoriesDiscount,
        servicesDiscount,
        insuranceAddonsDiscount,
        totalOnRoad,
        totalSavings: computedTotalSavings,
        downPayment,
        minDownPayment,
        maxDownPayment,
        emi,
        annualInterest,
        interestType,
        loanAmount,
        financeCharges,
        activeAccessories,
        activeServices,
        availableInsuranceAddons,
        insuranceRequiredItems,
        warrantyItems,
        initialFinance
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
        (product.mrp || Math.round(baseExShowroom * 1.06)) + // 6% markup if no MRP set
        rtoEstimates +
        baseInsurance +
        accessoriesPrice +
        servicesPrice +
        otherCharges;

    const totalSavings = computedTotalSavings ?? (offersDiscount + colorDiscount + (isReferralActive ? REFERRAL_BONUS : 0));
    const savingsHelpLines = [
        colorDiscount > 0 ? `Vehicle Offer: ₹${colorDiscount.toLocaleString('en-IN')}` : null,
        offersDiscount > 0 ? `Offers/Plans: ₹${offersDiscount.toLocaleString('en-IN')}` : null,
        accessoriesDiscount > 0 ? `Accessories: ₹${accessoriesDiscount.toLocaleString('en-IN')}` : null,
        servicesDiscount > 0 ? `Services: ₹${servicesDiscount.toLocaleString('en-IN')}` : null,
        insuranceAddonsDiscount > 0 ? `Insurance Add-ons: ₹${insuranceAddonsDiscount.toLocaleString('en-IN')}` : null,
        isReferralActive ? `Member Invite: ₹${REFERRAL_BONUS.toLocaleString('en-IN')}` : null,
        `Total: ₹${totalSavings.toLocaleString('en-IN')}`
    ].filter(Boolean) as string[];

    const priceBreakupData = [
        { label: 'Showroom Price', value: baseExShowroom },
        { label: `Registration (${regType})`, value: rtoEstimates, breakdown: rtoBreakdown },
        { label: 'Required Insurance', value: baseInsurance, breakdown: insuranceBreakdown },
        { label: 'Extra Insurance', value: insuranceAddonsPrice },
        { label: 'Accessories', value: accessoriesPrice },
        { label: 'Services / AMC', value: servicesPrice },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges }] : []),
        { label: 'Delivery TAT', value: '7 DAYS', isInfo: true },
        { label: 'Savings Applied', value: totalSavings, isDeduction: true, helpText: savingsHelpLines },
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

    const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false, isRadio = false, breakdown, priceImpact }: any) => {
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
                            <div className="flex items-center gap-2">
                                <p
                                    className={`text-xs md:text-sm font-black uppercase italic tracking-wider transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                                >
                                    {item.displayName || item.name}
                                </p>
                                {/* Price Impact Badge */}
                                {priceImpact !== undefined && priceImpact !== 0 && (
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md whitespace-nowrap
                                        ${priceImpact > 0
                                            ? 'text-orange-600 bg-orange-500/10 border border-orange-500/20'
                                            : 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20'}
                                    `}>
                                        {priceImpact > 0 ? '+' : ''}₹{Math.abs(priceImpact).toLocaleString()}
                                    </span>
                                )}
                            </div>
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
                    <FinanceTab
                        downPayment={downPayment}
                        minDownPayment={minDownPayment}
                        maxDownPayment={maxDownPayment}
                        totalOnRoad={totalOnRoad}
                        setUserDownPayment={setUserDownPayment}
                        emiTenure={emiTenure}
                        setEmiTenure={setEmiTenure}
                        loanAmount={loanAmount}
                        annualInterest={annualInterest}
                        initialFinance={initialFinance}
                    />
                );
            case 'ACCESSORIES':
                // Group accessories by category
                const helmets = activeAccessories.filter((a: any) => a.category === 'HELMET');
                const others = activeAccessories.filter((a: any) => a.category !== 'HELMET');
                const optionalAccessories = others.filter((a: any) => !a.isMandatory);
                const sortedOptionalAccessories = [...optionalAccessories].sort((a: any, b: any) => {
                    const aSelected = selectedAccessories.includes(a.id);
                    const bSelected = selectedAccessories.includes(b.id);

                    if (aSelected !== bSelected) return aSelected ? -1 : 1;

                    return 0;
                });

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
                            {sortedOptionalAccessories.map((acc: any) => (
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
                return (
                    <RegistrationTab
                        regType={regType}
                        setRegType={setRegType}
                        baseExShowroom={baseExShowroom}
                        rtoOptions={data.rtoOptions}
                        ConfigItemRow={ConfigItemRow}
                    />
                );
            case 'INSURANCE':
                return (
                    <InsuranceTab
                        insuranceRequiredItems={insuranceRequiredItems || []}
                        availableInsuranceAddons={availableInsuranceAddons}
                        selectedInsuranceAddons={selectedInsuranceAddons}
                        toggleInsuranceAddon={toggleInsuranceAddon}
                        ConfigItemRow={ConfigItemRow}
                    />
                );
            case 'SERVICES':
                return (
                    <ServicesTab
                        activeServices={activeServices}
                        selectedServices={selectedServices}
                        toggleService={toggleService}
                        ConfigItemRow={ConfigItemRow}
                    />
                );
            case 'OFFERS':
            case 'WARRANTY':
                return <WarrantyTab warrantyItems={warrantyItems} />;
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

            <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 pt-24 md:pt-28 pb-10 space-y-12 relative z-10">
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
                        activeColor={{ name: activeColorConfig.name, hex: activeColorConfig.hex }}
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
                        onShowVideo={() => setIsVideoOpen(true)}
                        productImage={getProductImage()}
                        downPayment={userDownPayment}
                        pricingSource={data.pricingSource}
                        schemeId={initialFinance?.scheme?.id}
                        leadName={leadContext?.name}
                        financeCharges={financeCharges}
                        annualInterest={annualInterest}
                        interestType={interestType}
                    />
                </div>
            </div>
        </div>
    );
}
