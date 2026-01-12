'use client';

import React from 'react';
import { ShieldCheck, Share, Heart, Zap, Info, ArrowRight } from 'lucide-react';
import { productColors, mandatoryAccessories, optionalAccessories, mandatoryInsurance, insuranceAddons, serviceOptions, offerOptions } from '@/hooks/usePDPData';

interface PDPTabletProps {
    product: any;
    variantParam: string;
    data: any;
    handlers: any;
}

export function PDPTablet({ product, variantParam, data, handlers }) {
    const {
        selectedColor,
        regType, setRegType,
        selectedAccessories,
        selectedInsuranceAddons,
        emiTenure, setEmiTenure,
        configTab, setConfigTab,
        selectedServices,
        selectedOffers,
        quantities,
        userDownPayment, setUserDownPayment,
        isReferralActive,
        baseExShowroom, rtoEstimates, insuranceAddonsPrice, roadTax, accessoriesPrice, servicesPrice, offersDiscount, colorDiscount, totalOnRoad,
        downPayment, minDownPayment, maxDownPayment, emi, annualInterest, loanAmount
    } = data;

    const {
        handleColorChange, handleShareQuote, handleBookingRequest,
        toggleAccessory, toggleInsuranceAddon, toggleService, toggleOffer, updateQuantity
    } = handlers;

    const activeColorConfig = productColors.find(c => c.id === selectedColor) || productColors[0];

    const getProductImage = () => {
        switch (product.bodyType) {
            case 'SCOOTER': return '/images/categories/scooter_nobg.png';
            case 'MOTORCYCLE': return '/images/categories/motorcycle_nobg.png';
            case 'MOPED': return '/images/categories/moped_nobg.png';
            default: return '/images/hero-bike.png';
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] p-12 pb-40">
            <div className="grid grid-cols-2 gap-16 min-h-[80vh]">
                {/* Visuals Side */}
                <div className="space-y-12">
                    <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600 italic">{product.make}</p>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{product.model}</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{variantParam}</p>
                    </div>

                    <div className="aspect-square bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] flex items-center justify-center p-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-radial from-blue-600/5 to-transparent" />
                        <img src={getProductImage()} alt={product.model} className="relative z-10 w-full h-auto object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110" />
                    </div>

                    <div className="flex gap-4 p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] justify-center">
                        {productColors.map(color => (
                            <button
                                key={color.id}
                                onClick={() => handleColorChange(color.id)}
                                className={`w-14 h-14 rounded-full border-2 p-1.5 transition-all ${selectedColor === color.id ? 'border-blue-600 scale-110 shadow-xl' : 'border-transparent'}`}
                            >
                                <div className={`w-full h-full rounded-full ${color.class}`} style={{ backgroundColor: color.hex }} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Side */}
                <div className="flex flex-col h-full bg-slate-50 dark:bg-white/[0.03] rounded-[3rem] border border-slate-200 dark:border-white/5 p-12">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-white/10 pb-6 mb-8">
                        {[
                            { id: 'PRICE_BREAKUP', label: 'Summary' },
                            { id: 'FINANCE', label: 'EMI' },
                            { id: 'ACCESSORIES', label: 'Accessories' },
                            { id: 'INSURANCE', label: 'Insurance' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setConfigTab(tab.id as any)}
                                className={`flex-shrink-0 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${configTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
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
                                    { label: 'Insurance (Std)', value: mandatoryInsurance.reduce((sum, i) => sum + i.price, 0) },
                                    { label: 'Accessories', value: accessoriesPrice },
                                    { label: 'Total On-Road', value: totalOnRoad, isTotal: true }
                                ].map((item, idx) => (
                                    <div key={idx} className={`flex justify-between items-center ${item.isTotal ? 'pt-8 border-t border-slate-200 dark:border-white/10 mt-4' : ''}`}>
                                        <span className={`text-[12px] uppercase tracking-widest ${item.isTotal ? 'font-black' : 'font-bold text-slate-500'}`}>{item.label}</span>
                                        <span className={`text-xl italic font-black ${item.isTotal ? 'text-blue-600 dark:text-white' : ''}`}>₹{item.value.toLocaleString()}</span>
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
                                        <button key={t} onClick={() => setEmiTenure(t)} className={`w-full p-8 rounded-3xl border transition-all flex justify-between items-center ${emiTenure === t ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-black shadow-2xl scale-[1.02]' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                            <span className="text-sm font-black italic uppercase tracking-widest">{t} Months</span>
                                            <span className="text-2xl font-black italic tracking-tighter">₹{Math.round((loanAmount * (annualInterest / 12) * Math.pow(1 + (annualInterest / 12), t)) / (Math.pow(1 + (annualInterest / 12), t) - 1)).toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {configTab === 'ACCESSORIES' && (
                            <div className="grid grid-cols-1 gap-3">
                                {optionalAccessories.map(acc => (
                                    <button key={acc.id} onClick={() => toggleAccessory(acc.id)} className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${selectedAccessories.includes(acc.id) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-slate-500">{acc.name}</p>
                                            <p className="text-sm font-black italic">₹{acc.price.toLocaleString()}</p>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${selectedAccessories.includes(acc.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                            {selectedAccessories.includes(acc.id) && <Zap size={14} fill="white" />}
                                        </div>
                                    </button>
                                ))}
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
