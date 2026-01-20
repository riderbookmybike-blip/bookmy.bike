'use client';

import React, { useState } from 'react';
import { Zap, Share, Heart, ShieldCheck, ArrowRight } from 'lucide-react';
import { ServiceOption } from '@/types/store';

interface PDPMobileProps {
    product: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    variantParam: string;
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    handlers: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function PDPMobile({ product, variantParam, data, handlers }: PDPMobileProps) {
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
        baseInsurance,
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
        warrantyItems
    } = data;

    const {
        handleColorChange, handleShareQuote, handleBookingRequest,
        toggleAccessory, toggleInsuranceAddon, toggleService, toggleOffer, updateQuantity,
        setRegType, setEmiTenure, setConfigTab, setUserDownPayment
    } = handlers;

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const totalMRP = (product.mrp || (baseExShowroom + 5000)) + rtoEstimates + baseInsurance + accessoriesPrice + servicesPrice + otherCharges;

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        switch (product.bodyType) {
            case 'SCOOTER': return '/images/categories/scooter_nobg.png';
            case 'MOTORCYCLE': return '/images/categories/motorcycle_nobg.png';
            case 'MOPED': return '/images/categories/moped_nobg.png';
            default: return '/images/hero-bike.png';
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ConfigItemRowMobile = ({ item, isSelected, onToggle, isMandatory = false }: { item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, isSelected: boolean, onToggle?: () => void, isMandatory?: boolean }) => {
        const finalPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
        return (
            <div className={`p-4 rounded-2xl border transition-all ${isSelected ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`} onClick={() => !isMandatory && onToggle && onToggle()}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isSelected ? 'bg-brand-primary border-brand-primary text-black' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                            <Zap size={16} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-brand-primary dark:text-brand-primary' : 'text-slate-500'}`}>{item.name}</p>
                            <p className="text-[10px] font-black italic tracking-tighter mt-0.5">₹{finalPrice.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 dark:border-white/20'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black pb-40">
            {/* 1. Mobile Hero: Full Impact */}
            <section className="relative aspect-[4/5] bg-slate-50 dark:bg-neutral-900/50 flex items-center justify-center p-12">
                <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary italic">{product.make}</p>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{product.model}</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{variantParam}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleShareQuote} className="p-3 glass-panel dark:bg-black/40 rounded-full shadow-lg"><Share size={16} /></button>
                        <button className="p-3 glass-panel dark:bg-black/40 rounded-full shadow-lg text-rose-500"><Heart size={16} className="fill-current" /></button>
                    </div>
                </div>

                <div className="relative w-full h-full flex items-center justify-center group">
                    <div className="absolute inset-0 bg-gradient-radial from-brand-primary/10 to-transparent opacity-50" />
                    {getProductImage() && !getProductImage().includes('categories/') ? (
                        <img src={getProductImage()} alt={product.model} className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div
                            className="relative z-10 w-full aspect-square rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
                            style={{
                                background: `radial-gradient(circle at center, ${activeColorConfig.hex}44, ${activeColorConfig.hex}11)`,
                                border: `1px solid ${activeColorConfig.hex}33`
                            }}
                        >
                            <div className="w-32 h-32 rounded-full blur-[60px] opacity-40 animate-pulse" style={{ backgroundColor: activeColorConfig.hex }} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-6">Finish Preview Only</p>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {colors.map((color: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                            <button
                                key={color.id}
                                onClick={() => handleColorChange(color.id)}
                                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 p-1 transition-all ${selectedColor === color.id ? 'border-brand-primary scale-110 shadow-lg' : 'border-transparent'}`}
                            >
                                <div
                                    className={`w-full h-full rounded-full ${color.class}`}
                                    style={{ backgroundColor: color.hex }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. Mobile Clusters: Quick Stats */}
            <section className="px-6 -mt-10 relative z-20">
                <div className="glass-panel dark:bg-neutral-950 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">On-Road Price</p>
                            <p className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white">₹{totalOnRoad.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-green-600 italic">Lowest EMI</p>
                            <p className="text-2xl font-black italic tracking-tighter text-green-600">₹{emi.toLocaleString()}<span className="text-[10px] text-slate-400">/mo</span></p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/5 pt-6">
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <ShieldCheck size={18} className="text-brand-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Price Protection Enabled</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Configuration Tabs: Mobile Refine */}
            <section className="px-6 pt-12 space-y-8">
                <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-white/5 pb-4">
                    {[
                        { id: 'PRICE_BREAKUP', label: 'Summary' },
                        { id: 'FINANCE', label: 'EMI Plan' },
                        { id: 'ACCESSORIES', label: 'Add-ons' },
                        { id: 'TECH_SPECS', label: 'Specs' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setConfigTab(tab.id as 'PRICE_BREAKUP' | 'FINANCE' | 'ACCESSORIES' | 'TECH_SPECS')}
                            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${configTab === tab.id ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-400'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[300px]">
                    {configTab === 'PRICE_BREAKUP' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            {[
                                { label: 'Ex-Showroom', value: baseExShowroom },
                                { label: 'RTO & Reg.', value: rtoEstimates },
                                { label: 'Insurance', value: baseInsurance + insuranceAddonsPrice },
                                { label: 'Total On-Road', value: totalOnRoad, isTotal: true }
                            ].map((item, idx) => (
                                <div key={idx} className={`flex justify-between items-center ${item.isTotal ? 'pt-4 border-t border-slate-200 dark:border-white/10' : ''}`}>
                                    <span className={`text-[11px] uppercase tracking-widest ${item.isTotal ? 'font-black' : 'font-bold text-slate-500'}`}>{item.label}</span>
                                    <span className={`text-sm italic font-black ${item.isTotal ? 'text-brand-primary dark:text-brand-primary' : ''}`}>₹{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {configTab === 'FINANCE' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-4 border border-slate-200 dark:border-white/5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Downpayment</span>
                                    <span className="text-lg font-black italic">₹{downPayment.toLocaleString()}</span>
                                </div>
                                <input type="range" min={minDownPayment} max={maxDownPayment} step={1000} value={downPayment} onChange={(e) => setUserDownPayment(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-brand-primary" />
                            </div>
                            <div className="space-y-3">
                                {[60, 48, 36, 24].map(t => (
                                    <button key={t} onClick={() => setEmiTenure(t)} className={`w-full p-5 rounded-2xl border transition-all flex justify-between items-center ${emiTenure === t ? 'bg-brand-primary border-brand-primary text-black shadow-xl' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}>
                                        <span className="text-xs font-black italic uppercase">{t} MONTHS</span>
                                        <span className="text-base font-black italic">₹{Math.round((loanAmount * (annualInterest / 12) * Math.pow(1 + (annualInterest / 12), t)) / (Math.pow(1 + (annualInterest / 12), t) - 1)).toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'ACCESSORIES' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 gap-3">
                                {activeAccessories.map((acc: any) => (
                                    <ConfigItemRowMobile
                                        key={acc.id}
                                        item={acc}
                                        isSelected={selectedAccessories.includes(acc.id)}
                                        onToggle={() => toggleAccessory(acc.id)}
                                        isMandatory={acc.isMandatory}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'TECH_SPECS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {warrantyItems.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Warranty</p>
                                    {warrantyItems.map((w: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-[10px] font-black uppercase text-white mb-1">{w.label}</p>
                                            <div className="flex justify-between text-[10px] font-mono text-brand-primary">
                                                <span>{w.km} KM</span>
                                                <span>{w.days} Days</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Detailed Specs could go here */}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Sticky Mobile Booking Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] glass-panel dark:bg-black/80 p-6 pb-12 flex items-center justify-between gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col">
                    <p className="text-[9px] font-black uppercase tracking-widest text-green-600 italic leading-none">Smart EMI</p>
                    <p className="text-2xl font-black italic tracking-tighter mt-1">₹{emi.toLocaleString()}<span className="text-[10px] text-slate-400 ml-1">/mo*</span></p>
                </div>
                <button
                    onClick={handleBookingRequest}
                    className="flex-1 h-14 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-transform"
                >
                    BOOK NOW <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
