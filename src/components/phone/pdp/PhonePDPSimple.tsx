/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Package, Wrench, Gift, CheckCircle2 } from 'lucide-react';
import { PhonePDPBottomBar } from './PhonePDPBottomBar';

// Lazy load tab components
const FinanceTab = dynamic(() => import('@/components/store/Personalize/Tabs/FinanceTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const InsuranceTab = dynamic(() => import('@/components/store/Personalize/Tabs/InsuranceTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const RegistrationTab = dynamic(() => import('@/components/store/Personalize/Tabs/RegistrationTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const ServicesTab = dynamic(() => import('@/components/store/Personalize/Tabs/ServicesTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

const WarrantyTab = dynamic(() => import('@/components/store/Personalize/Tabs/WarrantyTab'), {
    loading: () => <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
});

interface PhonePDPSimpleProps {
    product: any;
    modelParam: string;
    variantParam: string;
    data: any;
    handlers: {
        handleBookingRequest: () => void;
        toggleAccessory: (id: string) => void;
        toggleInsuranceAddon: (id: string) => void;
        toggleService: (id: string) => void;
        setRegType: (type: 'STATE' | 'BH' | 'COMPANY') => void;
        setEmiTenure: (months: number) => void;
        setConfigTab: (tab: any) => void;
        setUserDownPayment: (amount: number) => void;
    };
}

const TABS = [
    { id: 'FINANCE', label: 'EMI Plan', icon: Zap },
    { id: 'ACCESSORIES', label: 'Accessories', icon: Package },
    { id: 'INSURANCE', label: 'Insurance', icon: ShieldCheck },
    { id: 'REGISTRATION', label: 'Registration', icon: Gift },
    { id: 'SERVICES', label: 'Services', icon: Wrench },
];

export function PhonePDPSimple({ product, modelParam, variantParam, data, handlers }: PhonePDPSimpleProps) {
    const tabsRef = useRef<HTMLDivElement>(null);

    const {
        colors,
        selectedColor,
        regType,
        selectedAccessories,
        selectedInsuranceAddons,
        emiTenure,
        configTab,
        selectedServices,
        userDownPayment,
        baseExShowroom,
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
        insuranceRequiredItems,
        warrantyItems,
        initialFinance
    } = data;

    const {
        handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        setRegType,
        setEmiTenure,
        setConfigTab,
        setUserDownPayment,
    } = handlers;

    // Set default tab to Finance
    useEffect(() => {
        if (configTab === 'PRICE_BREAKUP') {
            setConfigTab('FINANCE');
        }
    }, []);

    // Get summary info for each accordion card
    const getCardSummary = (tabId: string): string => {
        switch (tabId) {
            case 'FINANCE':
                if (emi && emiTenure) {
                    const dpText = downPayment > 0 ? `₹${(downPayment / 1000).toFixed(0)}K DP` : '₹0 DP';
                    return `${dpText} • ₹${emi.toLocaleString()}/mo × ${emiTenure}`;
                }
                return 'Configure EMI';
            case 'ACCESSORIES':
                const accCount = selectedAccessories?.length || 0;
                const accTotal = data.accessoriesPrice || 0;
                if (accCount > 0) {
                    return `${accCount} items • ₹${accTotal.toLocaleString()}`;
                }
                return 'No accessories added';
            case 'INSURANCE':
                const insTotal = (data.baseInsurance || 0) + (data.insuranceAddonsPrice || 0);
                const addonsCount = selectedInsuranceAddons?.length || 0;
                return `1+5 Comp${addonsCount > 0 ? ` +${addonsCount}` : ''} • ₹${insTotal.toLocaleString()}`;
            case 'REGISTRATION':
                const regPrice = data.rtoEstimates || 0;
                return `${regType} • ₹${regPrice.toLocaleString()}`;
            case 'SERVICES':
                const svcCount = selectedServices?.length || 0;
                const svcTotal = data.servicesPrice || 0;
                if (svcCount > 0) {
                    return `${svcCount} plans • ₹${svcTotal.toLocaleString()}`;
                }
                return 'No services added';
            default:
                return '';
        }
    };

    const activeColorConfig = colors?.find((c: any) => c.id === selectedColor) || colors?.[0] || { name: 'Default', hex: '#888888' };

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];
        switch (product.bodyType) {
            case 'SCOOTER': return '/images/categories/scooter_nobg.png';
            case 'MOTORCYCLE': return '/images/categories/motorcycle_nobg.png';
            default: return '/images/hero-bike.png';
        }
    };

    // Scroll active tab into view
    useEffect(() => {
        if (tabsRef.current) {
            const activeTab = tabsRef.current.querySelector('[data-active="true"]');
            if (activeTab) {
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [configTab]);

    // Config Item Row for accessories/insurance/services
    const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false }: any) => (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => !isMandatory && onToggle?.()}
            className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3
                ${isSelected
                    ? 'bg-brand-primary/10 border-brand-primary/30'
                    : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10'
                }
                ${isMandatory ? 'opacity-70' : 'active:bg-slate-50 dark:active:bg-white/5'}
            `}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all
                    ${isSelected ? 'bg-brand-primary text-black' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                    <Zap size={18} />
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-bold uppercase tracking-tight truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {item.displayName || item.name}
                    </p>
                    {item.description && (
                        <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-black italic ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`}>
                    ₹{(item.discountPrice || item.price || 0).toLocaleString()}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={3} />}
                </div>
            </div>
        </motion.div>
    );

    const renderTabContent = () => {
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
                const optionalAccessories = activeAccessories?.filter((a: any) => !a.isMandatory) || [];
                return (
                    <div className="space-y-3">
                        {optionalAccessories.map((acc: any) => (
                            <ConfigItemRow
                                key={acc.id}
                                item={acc}
                                isSelected={selectedAccessories?.includes(acc.id)}
                                onToggle={() => toggleAccessory(acc.id)}
                            />
                        ))}
                        {optionalAccessories.length === 0 && (
                            <p className="text-center text-slate-400 py-8">No accessories available</p>
                        )}
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
            case 'WARRANTY':
                return <WarrantyTab warrantyItems={warrantyItems} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] pb-24">
            {/* Vehicle Info Hero Section */}
            <div className="bg-white dark:bg-[#0b0d10] pt-16 pb-4">
                <div className="flex items-center gap-4 px-4">
                    {/* Product Image */}
                    <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/5 dark:to-white/[0.02] overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/10 shadow-lg">
                        <img
                            src={getProductImage()}
                            alt={modelParam}
                            className="w-full h-full object-contain p-2"
                        />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white leading-none">
                            {modelParam}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {variantParam}
                        </p>

                        {/* Color Info */}
                        <div className="flex items-center gap-2 mt-2">
                            <span
                                className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: activeColorConfig?.hex || '#888' }}
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {activeColorConfig?.name || 'Default'}
                            </span>
                        </div>

                        {/* Ex-Showroom Price */}
                        <div className="mt-3">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ex-Showroom</span>
                            <p className="text-xl font-black italic text-slate-900 dark:text-white">
                                ₹{baseExShowroom?.toLocaleString('en-IN') || '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible Accordion Cards */}
            <div className="px-4 py-4 space-y-3">
                {TABS.map((tab) => {
                    const isExpanded = configTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <motion.div
                            key={tab.id}
                            layout
                            className={`rounded-3xl border overflow-hidden transition-all duration-300
                                ${isExpanded
                                    ? 'bg-white dark:bg-white/[0.03] border-brand-primary/30 shadow-lg'
                                    : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                                }`}
                        >
                            {/* Card Header - Always Visible */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setConfigTab(isExpanded ? '' : tab.id)}
                                className="w-full flex items-center justify-between p-4"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all
                                        ${isExpanded ? 'bg-brand-primary text-black' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                                        <Icon size={20} strokeWidth={2} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className={`text-sm font-black uppercase tracking-wider transition-colors block
                                            ${isExpanded ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {tab.label}
                                        </span>
                                        {/* Summary Info Pill */}
                                        <span className={`text-[10px] font-bold tracking-wide block truncate transition-colors mt-0.5
                                            ${isExpanded ? 'text-brand-primary' : 'text-slate-400'}`}>
                                            {getCardSummary(tab.id)}
                                        </span>
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors
                                        ${isExpanded ? 'bg-brand-primary/20 text-brand-primary' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 4L6 8L10 4" />
                                    </svg>
                                </motion.div>
                            </motion.button>

                            {/* Card Content - Collapsible */}
                            <motion.div
                                initial={false}
                                animate={{
                                    height: isExpanded ? 'auto' : 0,
                                    opacity: isExpanded ? 1 : 0
                                }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4">
                                    {isExpanded && renderTabContent()}
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Sticky Bottom Bar */}
            <PhonePDPBottomBar
                productImage={getProductImage()}
                modelName={modelParam}
                variantName={variantParam}
                colorName={activeColorConfig?.name || 'Default'}
                colorHex={activeColorConfig?.hex || '#888888'}
                totalPrice={totalOnRoad}
                emi={emi}
                emiTenure={emiTenure}
                onGetQuote={handleBookingRequest}
            />
        </div>
    );
}
