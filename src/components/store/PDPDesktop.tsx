/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
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
import {
    productColors,
    mandatoryAccessories,
    optionalAccessories,
    mandatoryInsurance,
    insuranceAddons,
    serviceOptions,
    offerOptions,
    mandatoryInsurance as mandatoryIns,
} from '@/hooks/usePDPData';

interface PDPDesktopProps {
    product: any;
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
    };
}

export function PDPDesktop({ product, variantParam, data, handlers }: PDPDesktopProps) {
    const {
        selectedColor,
        regType,
        setRegType,
        selectedAccessories,
        selectedInsuranceAddons,
        emiTenure,
        setEmiTenure,
        configTab,
        setConfigTab,
        selectedServices,
        selectedOffers,
        quantities,
        userDownPayment,
        setUserDownPayment,
        isReferralActive,
        baseExShowroom,
        rtoEstimates,
        insuranceAddonsPrice,
        roadTax,
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
    } = handlers;

    // Set default tab to Finance or Accessories if Price Breakup is active (since it's now in the sidebar)
    useEffect(() => {
        if (configTab === 'PRICE_BREAKUP') {
            setConfigTab('FINANCE');
        }
    }, []);

    const activeColorConfig = productColors.find(c => c.id === selectedColor) || productColors[0];
    const totalMRP =
        (product.mrp || baseExShowroom + 5000) +
        rtoEstimates +
        mandatoryIns.reduce((sum, i) => sum + i.price, 0) +
        roadTax +
        accessoriesPrice +
        servicesPrice;
    const totalSavings = offersDiscount + colorDiscount + (isReferralActive ? 5000 : 0);

    const priceBreakupData = [
        { label: 'Showroom Price', value: baseExShowroom },
        { label: `Registration (${regType})`, value: rtoEstimates },
        { label: 'Required Insurance', value: mandatoryIns.reduce((sum, i) => sum + i.price, 0) },
        { label: 'Extra Insurance', value: insuranceAddonsPrice },
        { label: 'Accessories', value: accessoriesPrice },
        { label: 'Services / AMC', value: servicesPrice },
        { label: 'Other Charges', value: roadTax },
        { label: 'Delivery TAT', value: '7 DAYS', isInfo: true },
        { label: 'Savings Applied', value: offersDiscount, isDeduction: true },
        ...(colorDiscount > 0 ? [{ label: 'Color Offer', value: colorDiscount, isDeduction: true }] : []),
        ...(isReferralActive ? [{ label: 'Member Invite', value: 5000, isDeduction: true }] : []),
    ];

    const getProductImage = () => {
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

    const ConfigItemRow = ({ item, isSelected, onToggle, isMandatory = false, isRadio = false }: any) => {
        const quantity = isSelected ? quantities[item.id] || 1 : 0;
        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
        const billedAmount = isSelected ? finalPrice * quantity : 0;

        return (
            <div
                onClick={() => !isMandatory && onToggle && onToggle()}
                className={`group relative p-4 rounded-[2.5rem] border transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer overflow-hidden
                    ${
                        isSelected
                            ? 'bg-brand-primary/5 border-brand-primary/30'
                            : 'bg-white/[0.03] border-slate-200 dark:border-white/5 hover:bg-white/[0.05] hover:border-slate-300 dark:hover:border-white/10'
                    }
                    ${isMandatory ? 'cursor-default opacity-90' : ''}
                `}
            >
                <div className="flex-1 flex items-center justify-between gap-6">
                    {/* 1. Identity */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shrink-0
                            ${
                                isSelected
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
                            ${
                                isSelected
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
                        {/* Slider Row */}
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 space-y-3">
                            <div className="flex justify-between items-end">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 opacity-80">
                                    How much you want to pay now?
                                </h4>
                                <div className="text-2xl font-black italic text-brand-primary font-mono">
                                    ₹{downPayment.toLocaleString()}
                                </div>
                            </div>
                            <input
                                type="range"
                                min={minDownPayment}
                                max={maxDownPayment}
                                step={1000}
                                value={downPayment}
                                onChange={e => setUserDownPayment(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: '#F4B000' }}
                            />
                        </div>

                        {/* Tenure List Selection */}
                        <div className="space-y-4">
                            {[60, 48, 36, 24].map(tenure => {
                                const emiValue = Math.round(
                                    (loanAmount * (annualInterest / 12) * Math.pow(1 + annualInterest / 12, tenure)) /
                                        (Math.pow(1 + annualInterest / 12, tenure) - 1)
                                );
                                return (
                                    <ConfigItemRow
                                        key={tenure}
                                        item={{
                                            id: tenure.toString(),
                                            name: `${tenure} Months`,
                                            description: tenure === 36 ? 'Recommended Tenure' : 'Flexible EMI Duration',
                                            price: emiValue,
                                        }}
                                        isSelected={emiTenure === tenure}
                                        onToggle={() => setEmiTenure(tenure)}
                                        isRadio
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            case 'ACCESSORIES':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <TabHeader icon={Package} title="Accessories" subtext="Personalize your ride" />

                        <div className="space-y-4 mb-10">
                            <SectionLabel text="Mandatory Items" />
                            {mandatoryAccessories.map((acc: any) => (
                                <ConfigItemRow
                                    key={acc.id}
                                    item={{ ...acc, maxQty: acc.maxQty || 1 }}
                                    isSelected={true}
                                    onToggle={() => {}}
                                    isMandatory={true}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <SectionLabel text="Optional Upgrades" />
                            {optionalAccessories.map((acc: any) => (
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
                const regItems = [
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
                            />
                        </div>

                        <div className="space-y-4">
                            <SectionLabel text="Other Options" />
                            {regItems.slice(1).map(item => (
                                <ConfigItemRow
                                    key={item.id}
                                    item={item}
                                    isSelected={regType === item.id}
                                    onToggle={() => setRegType(item.id as any)}
                                    isRadio
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'INSURANCE':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <TabHeader icon={ShieldIcon} title="Insurance" subtext="Secure your journey" />

                        <div className="space-y-4 mb-10">
                            <SectionLabel text="Required Insurance" />
                            {mandatoryInsurance.map(i => (
                                <ConfigItemRow key={i.id} item={i} isSelected={true} isMandatory />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <SectionLabel text="Extra Coverage (Add-ons)" />
                            {insuranceAddons.map(i => (
                                <ConfigItemRow
                                    key={i.id}
                                    item={i}
                                    isSelected={selectedInsuranceAddons.includes(i.id)}
                                    onToggle={() => toggleInsuranceAddon(i.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'SERVICES':
                const freeServiceSchedule = [
                    {
                        id: 'FREE_1',
                        name: '1st Free Service',
                        price: 0,
                        description: '30 Days or 1000 km, whichever is earlier.',
                        isMandatory: true,
                    },
                    {
                        id: 'FREE_2',
                        name: '2nd Free Service',
                        price: 0,
                        description: '90 Days or 3000 km, whichever is earlier.',
                        isMandatory: true,
                    },
                    {
                        id: 'FREE_3',
                        name: '3rd Free Service',
                        price: 0,
                        description: '180 Days or 6000 km, whichever is earlier.',
                        isMandatory: true,
                    },
                    {
                        id: 'FREE_4',
                        name: '4th Free Service',
                        price: 0,
                        description: '270 Days or 9000 km, whichever is earlier.',
                        isMandatory: true,
                    },
                    {
                        id: 'FREE_5',
                        name: '5th Free Service',
                        price: 0,
                        description: '365 Days or 12000 km, whichever is earlier.',
                        isMandatory: true,
                    },
                ];
                const paidServices = serviceOptions.filter((s: any) => s.price > 0);

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
                                    onToggle={() => {}}
                                    isMandatory={true}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <SectionLabel text="AMC Plans & Protection" />
                            {paidServices.map(srv => (
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
                const standardWarranty = offerOptions.filter((o: any) => o.price === 0);
                const extendedWarranty = offerOptions.filter((o: any) => o.price > 0);
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <TabHeader icon={Gift} title="Warranty" subtext="Peace of mind guaranteed" />

                        <div className="space-y-4 mb-10">
                            <SectionLabel text="Standard Manufacturer Warranty" />
                            {standardWarranty.map((off: any) => (
                                <ConfigItemRow
                                    key={off.id}
                                    item={{ ...off, isOffer: true }}
                                    isSelected={selectedOffers.includes(off.id)}
                                    onToggle={() => toggleOffer(off.id)}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <SectionLabel text="Optional Extensions" />
                            {extendedWarranty.map((off: any) => (
                                <ConfigItemRow
                                    key={off.id}
                                    item={{ ...off, isOffer: true }}
                                    isSelected={selectedOffers.includes(off.id)}
                                    onToggle={() => toggleOffer(off.id)}
                                />
                            ))}
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
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white pb-32 transition-colors duration-1000 relative overflow-hidden">
            {/* Dynamic Background Glow */}
            <div
                className="fixed inset-0 pointer-events-none z-0 transition-all duration-[2000ms] opacity-30 dark:opacity-20 blur-[120px]"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${activeColorConfig.hex}33, transparent 50%), radial-gradient(circle at 70% 80%, ${activeColorConfig.hex}22, transparent 50%)`,
                }}
            />

            <div className="max-w-[1550px] mx-auto px-6 md:px-12 py-4 space-y-6 relative z-10">
                {/* 1. Context Navigation Row (Minimal) */}
                <DynamicHeader
                    breadcrumb={
                        <>
                            STORE / <span className="text-slate-500">{product.make}</span> / {product.model}
                        </>
                    }
                />

                {/* 2. Main Flux Layout (Configurator | Sidebar Master) */}
                <div className="flex gap-16 items-start">
                    {/* Left Column: Visuals & Selection Engine */}
                    <div className="flex-1 space-y-12 min-w-0">
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <VisualsRow
                                colors={productColors}
                                selectedColor={selectedColor}
                                onColorSelect={handleColorChange}
                                productImage={getProductImage()}
                                videoSource="4TFu_oDpTNI"
                                isVideoOpen={isVideoOpen}
                                onCloseVideo={() => setIsVideoOpen(false)}
                            />
                        </div>

                        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/5 rounded-[4rem] p-12 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100 shadow-2xl">
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
                        onDownload={() => {}}
                        onShowVideo={() => setIsVideoOpen(true)}
                        productImage={getProductImage()}
                        downPayment={userDownPayment}
                    />
                </div>
            </div>
        </div>
    );
}
