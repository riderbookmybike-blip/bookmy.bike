'use client';

import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { ServiceOption } from '@/types/store';

interface PDPTabletProps {
    product: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    variantParam: string;
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    handlers: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function PDPTablet({ product, variantParam, data, handlers }: PDPTabletProps) {
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
        warrantyItems
    } = data;

    const {
        handleColorChange, handleShareQuote, handleBookingRequest,
        toggleAccessory, toggleInsuranceAddon, toggleService, toggleOffer, updateQuantity,
        setRegType, setEmiTenure, setConfigTab, setUserDownPayment
    } = handlers;

    const activeColorConfig = colors.find((c: any) => c.id === selectedColor) || colors[0]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const getProductImage = () => {
        if (activeColorConfig?.image) return activeColorConfig.image;
        switch (product.bodyType) {
            case 'SCOOTER': return '/images/categories/scooter_nobg.png';
            case 'MOTORCYCLE': return '/images/categories/motorcycle_nobg.png';
            case 'MOPED': return '/images/categories/moped_nobg.png';
            default: return '/images/hero-bike.png';
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black p-12 pb-40">
            <div className="grid grid-cols-2 gap-16 min-h-[80vh]">
                {/* Visuals Side */}
                <div className="space-y-12">
                    <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-brand-primary italic">{product.make}</p>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{product.model}</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{variantParam}</p>
                    </div>

                    <div className="aspect-square glass-panel dark:bg-neutral-900/50 rounded-[3rem] flex items-center justify-center p-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-radial from-brand-primary/5 to-transparent" />
                        {getProductImage() && !getProductImage().includes('categories/') ? (
                            <img src={getProductImage()} alt={product.model} className="relative z-10 w-full h-auto object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                            <div
                                className="relative z-10 w-full h-full rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
                                style={{
                                    background: `radial-gradient(circle at center, ${activeColorConfig.hex}44, ${activeColorConfig.hex}11)`,
                                    border: `1px solid ${activeColorConfig.hex}33`
                                }}
                            >
                                <div className="w-48 h-48 rounded-full blur-[80px] opacity-40 animate-pulse" style={{ backgroundColor: activeColorConfig.hex }} />
                                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-white/20 mt-10">Finish Preview Only</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] justify-center">
                        {colors.map((color: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                            <button
                                key={color.id}
                                onClick={() => handleColorChange(color.id)}
                                className={`w-14 h-14 rounded-full border-2 p-1.5 transition-all ${selectedColor === color.id ? 'border-brand-primary scale-110 shadow-xl' : 'border-transparent'}`}
                            >
                                <div
                                    className={`w-full h-full rounded-full ${color.class}`}
                                    style={{ backgroundColor: color.hex }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Side */}
                <div className="flex flex-col h-full glass-panel dark:bg-white/[0.03] rounded-[3rem] p-12">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-white/10 pb-6 mb-8">
                        {[
                            { id: 'PRICE_BREAKUP', label: 'Summary' },
                            { id: 'FINANCE', label: 'EMI' },
                            { id: 'ACCESSORIES', label: 'Accessories' },
                            { id: 'INSURANCE', label: 'Insurance' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setConfigTab(tab.id as 'PRICE_BREAKUP' | 'FINANCE' | 'ACCESSORIES' | 'INSURANCE')}
                                className={`flex-shrink-0 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${configTab === tab.id ? 'bg-brand-primary text-black shadow-lg' : 'text-slate-500'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1">
                        {configTab === 'PRICE_BREAKUP' && (
                            <div className="space-y-6">
                                {[
                                    { label: 'Ex-Showroom', value: baseExShowroom },
                                    { label: 'RTO Registration', value: rtoEstimates },
                                    { label: 'Insurance', value: baseInsurance + insuranceAddonsPrice },
                                    { label: 'Accessories', value: accessoriesPrice },
                                    { label: 'Total On-Road', value: totalOnRoad, isTotal: true }
                                ].map((item, idx) => (
                                    <div key={idx} className={`flex justify-between items-center ${item.isTotal ? 'pt-8 border-t border-slate-200 dark:border-white/10 mt-4' : ''}`}>
                                        <span className={`text-[12px] uppercase tracking-widest ${item.isTotal ? 'font-black' : 'font-bold text-slate-500'}`}>{item.label}</span>
                                        <span className={`text-xl italic font-black ${item.isTotal ? 'text-brand-primary dark:text-brand-primary' : ''}`}>₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {configTab === 'FINANCE' && (
                            <div className="space-y-8">
                                <div className="space-y-6 p-8 bg-green-500/5 rounded-[2rem] border border-green-500/10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">Downpayment</span>
                                        <span className="text-2xl font-black italic">₹{downPayment.toLocaleString()}</span>
                                    </div>
                                    <input type="range" min={minDownPayment} max={maxDownPayment} step={2000} value={downPayment} onChange={(e) => setUserDownPayment(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-green-600" />
                                </div>
                                <div className="grid gap-3">
                                    {[60, 48, 36, 24].map(t => (
                                        <button key={t} onClick={() => setEmiTenure(t)} className={`w-full p-8 rounded-3xl border transition-all flex justify-between items-center ${emiTenure === t ? 'bg-slate-950 border-slate-800 text-white dark:bg-white dark:text-black shadow-2xl scale-[1.02]' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                            <span className="text-sm font-black italic uppercase tracking-widest">{t} Months</span>
                                            <span className="text-2xl font-black italic tracking-tighter">₹{Math.round((loanAmount * (annualInterest / 12) * Math.pow(1 + (annualInterest / 12), t)) / (Math.pow(1 + (annualInterest / 12), t) - 1)).toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {configTab === 'ACCESSORIES' && (
                            <div className="grid grid-cols-1 gap-3">
                                {activeAccessories.map((acc: any) => (
                                    <button
                                        key={acc.id}
                                        onClick={() => !acc.isMandatory && toggleAccessory(acc.id)}
                                        className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${selectedAccessories.includes(acc.id) ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'} ${acc.isMandatory ? 'opacity-80' : 'cursor-pointer'}`}
                                    >
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-slate-500">{acc.name}</p>
                                            <p className="text-sm font-black italic">₹{acc.price.toLocaleString()}</p>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${selectedAccessories.includes(acc.id) ? 'bg-brand-primary border-brand-primary text-black' : 'border-slate-300'}`}>
                                            {selectedAccessories.includes(acc.id) && <Zap size={14} fill="black" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {configTab === 'INSURANCE' && (
                            <div className="space-y-6">
                                {warrantyItems.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Warranty</p>
                                        <div className="grid grid-cols-2 gap-4">
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
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-12 border-t border-slate-200 dark:border-white/10">
                        <div className="flex gap-6">
                            <div className="flex-1 bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-600 italic">Smart EMI</p>
                                <p className="text-3xl font-black italic tracking-tighter">₹{emi.toLocaleString()}<span className="text-xs font-bold text-slate-400">/mo</span></p>
                            </div>
                            <button onClick={handleBookingRequest} className="flex-[1.5] bg-red-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest italic shadow-2xl shadow-red-600/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-4">
                                Book Now <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
