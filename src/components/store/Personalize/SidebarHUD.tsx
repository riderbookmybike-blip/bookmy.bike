/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {
    Zap,
    Download,
    Share2,
    Heart,
    ShieldCheck,
    ChevronRight,
    Info,
    Clock,
    CheckCircle2,
    Youtube,
} from 'lucide-react';

interface SidebarHUDProps {
    product: any;
    variantName: string;
    activeColor: { name: string; hex: string };
    totalOnRoad: number;
    totalMRP: number;
    emi: number;
    emiTenure: number;
    savings: number;
    priceBreakup: {
        label: string;
        value: number | string;
        isDeduction?: boolean;
        isTotal?: boolean;
        isInfo?: boolean;
    }[];
    onGetQuote: () => void;
    onShare: () => void;
    onSave: () => void;
    onDownload: () => void;
    onShowVideo?: () => void;
    productImage: string;
    downPayment: number;
    pricingSource?: string;
    isEstimate?: boolean;
}

import { checkServiceability } from '@/actions/serviceArea';

/**
 * Master Sidebar HUD for Desktop PDP.
 * Now grows naturally without internal scrolling.
 */
export default function SidebarHUD({
    product,
    variantName,
    activeColor,
    totalOnRoad,
    totalMRP,
    emi,
    emiTenure,
    savings,
    priceBreakup,
    onGetQuote,
    onShare,
    onSave,
    onDownload,
    onShowVideo,
    productImage,
    downPayment,
    pricingSource,
    isEstimate,
}: SidebarHUDProps) {
    const discountPercent = Math.round((savings / totalMRP) * 100);
    const loanAmount = totalOnRoad - downPayment;

    const [serviceability, setServiceability] = React.useState<{
        pincode?: string;
        taluka?: string;
        isServiceable: boolean;
        status: 'CHECKING' | 'SET' | 'UNSET';
    }>({ isServiceable: false, status: 'CHECKING' });

    React.useEffect(() => {
        const checkCurrentServiceability = async () => {
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (!cached) {
                setServiceability({ isServiceable: false, status: 'UNSET' });
                return;
            }

            try {
                const data = JSON.parse(cached);
                if (data.pincode) {
                    const result = await checkServiceability(data.pincode);
                    setServiceability({
                        pincode: data.pincode,
                        taluka: result.location || data.taluka || data.city,
                        isServiceable: result.isServiceable,
                        status: 'SET'
                    });
                } else {
                    setServiceability({
                        taluka: data.taluka || data.city,
                        isServiceable: false, // Or keep as unset if no pincode
                        status: 'SET'
                    });
                }
            } catch {
                setServiceability({ isServiceable: false, status: 'UNSET' });
            }
        };
        checkCurrentServiceability();
    }, []);

    let infoColorClass = 'text-slate-400';
    if (serviceability.status === 'SET') {
        infoColorClass = serviceability.isServiceable
            ? 'text-emerald-500 fill-emerald-500/20'
            : 'text-red-500 fill-red-500/20';
    }

    return (
        <div className="w-[440px] sticky top-20 glass-panel dark:bg-black/60 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-right-8 duration-700 h-fit">
            {/* 1. Global Actions */}
            <div className="p-8 pb-4">
                <div className="flex items-center justify-end gap-1">
                    {onShowVideo && (
                        <button
                            onClick={onShowVideo}
                            className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-slate-400 hover:text-red-600 transition-all"
                            title="Watch Video Review"
                        >
                            <Youtube size={20} />
                        </button>
                    )}
                    <button
                        onClick={onDownload}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-brand-primary transition-all"
                        title="Download Quote"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        onClick={onShare}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-brand-primary transition-all"
                        title="Share Configuration"
                    >
                        <Share2 size={16} />
                    </button>
                    <button
                        onClick={onSave}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                        title="Add to Favorites"
                    >
                        <Heart size={16} />
                    </button>
                </div>

                <div className="flex gap-6 items-center pt-2">
                    <div className="w-32 h-32 flex items-center justify-center group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white dark:from-white/5 dark:to-white/10 rounded-[2rem] opacity-50" />
                        {productImage && !productImage.includes('categories/') ? (
                            <img
                                src={productImage}
                                alt="thumb"
                                className="w-[120%] h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl z-10"
                            />
                        ) : (
                            <div
                                className="w-full h-full rounded-[2rem] z-10 p-4 flex flex-col items-center justify-center text-center opacity-80"
                                style={{
                                    background: `linear-gradient(135deg, ${activeColor.hex}dd, ${activeColor.hex}44)`,
                                    border: `1px solid ${activeColor.hex}33`,
                                }}
                            >
                                <Zap size={40} className="text-white/20 mb-2" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-right">
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white">
                            {product.model}
                        </h3>
                        <p className="text-sm font-bold text-slate-500 italic mt-1.5">{variantName}</p>
                        <div className="flex items-center justify-end gap-2 mt-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                                {activeColor.name}
                            </span>
                            <div
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: activeColor.hex }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Pricing Section */}
            <div className="px-8 py-5">
                <div className="glass-card dark:bg-white/[0.02] rounded-3xl p-7 space-y-6">
                    <div className="space-y-3">
                        {priceBreakup
                            .filter(item => !item.isTotal)
                            .map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-slate-500/80 uppercase tracking-widest">
                                        {item.label}
                                    </span>
                                    <span
                                        className={`font-mono font-black ${item.isDeduction ? 'text-emerald-500' : item.isInfo ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        {item.isDeduction ? '-' : ''}
                                        {typeof item.value === 'number'
                                            ? `₹${item.value.toLocaleString()}`
                                            : item.value}
                                    </span>
                                </div>
                            ))}
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center group/price relative">
                        <div className="flex items-center gap-1.5 cursor-help group/tooltip">
                            <span className="text-xs font-[900] uppercase italic tracking-wider text-slate-900 dark:text-white/40 border-b border-dotted border-slate-300 dark:border-white/10">
                                Final Price
                            </span>
                            {pricingSource && (
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    ({pricingSource})
                                </span>
                            )}
                            {/* Smart Serviceability Icon */}
                            <Info size={12} className={infoColorClass} />

                            {/* Tooltip Content */}
                            <div className="absolute bottom-full left-0 mb-2 px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                                {serviceability.status === 'CHECKING' && 'Checking Serviceability...'}
                                {serviceability.status === 'UNSET' && 'Set Location to check serviceability'}
                                {serviceability.status === 'SET' && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${serviceability.isServiceable ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}
                                            />
                                            <span
                                                className={
                                                    serviceability.isServiceable
                                                        ? 'text-emerald-400 font-black'
                                                        : 'text-red-400 font-black'
                                                }
                                            >
                                                {serviceability.isServiceable ? 'Fully Serviceable' : 'Not Serviceable Area'}
                                            </span>
                                        </div>
                                        <span className="opacity-50 font-medium">
                                            {serviceability.taluka || serviceability.pincode}
                                        </span>
                                        {isEstimate && (
                                            <span className="text-amber-500 font-bold block mt-1">*Estimated Price (Non-Binding)</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-3xl font-black italic tracking-tighter text-brand-primary dark:text-brand-primary font-mono block drop-shadow-[0_0_15px_rgba(244,176,0,0.2)]">
                                ₹{totalOnRoad.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {savings > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Zap size={10} className="text-emerald-500 fill-current" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                Total Savings: ₹{savings.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Finance Block */}
            <div className="px-8 py-4 space-y-6">
                <div className="glass-card dark:bg-white/[0.02] rounded-3xl p-7 relative group transition-all overflow-hidden space-y-6">
                    {/* List-style Finance Details */}
                    <div className="space-y-4">
                        {[
                            { label: 'How much you pay now?', value: `₹${(downPayment || 0).toLocaleString()}` },
                            { label: 'Loan Amount', value: `₹${loanAmount.toLocaleString()}` },
                            { label: 'Fixed Interest Rate', value: '9.5%', isHighlight: true },
                            { label: 'Duration', value: `${emiTenure} Months` },
                            {
                                label: 'Approval Probability',
                                value:
                                    downPayment / totalOnRoad > 0.25
                                        ? 'High'
                                        : downPayment / totalOnRoad > 0.15
                                            ? 'Medium'
                                            : 'Low',
                                isHighlight: true,
                                colorClass:
                                    downPayment / totalOnRoad > 0.25
                                        ? 'text-emerald-500'
                                        : downPayment / totalOnRoad > 0.15
                                            ? 'text-brand-primary'
                                            : 'text-amber-500',
                            },
                            {
                                label: 'Finance TAT',
                                value: '30 Minutes',
                                isHighlight: true,
                                colorClass: 'text-brand-primary',
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-500/80 uppercase tracking-widest">
                                    {item.label}
                                </span>
                                <span
                                    className={`font-mono font-black tracking-tight uppercase ${item.isHighlight ? item.colorClass || 'text-brand-primary italic' : 'text-slate-900 dark:text-white'}`}
                                >
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Primary EMI Highlight (Aligned with Final Price) */}
                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center group/price">
                        <span className="text-xs font-[900] uppercase italic tracking-wider text-slate-900 dark:text-white/40">
                            Monthly EMI
                        </span>
                        <div className="text-right">
                            <span className="text-3xl font-black italic tracking-tighter text-brand-primary dark:text-brand-primary font-mono block">
                                ₹{emi.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Global Quote CTA */}
            <div className="p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 space-y-4">
                <button
                    onClick={onGetQuote}
                    disabled={serviceability.status === 'SET' && !serviceability.isServiceable}
                    className={`w-full h-18 py-6 rounded-[2rem] text-base font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-5 shadow-2xl transition-all group
                        ${(serviceability.status === 'SET' && !serviceability.isServiceable)
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-[#F4B000] hover:bg-[#E0A800] text-black shadow-[#F4B000]/30 active:scale-[0.98]'
                        }`}
                >
                    {(serviceability.status === 'SET' && !serviceability.isServiceable) ? 'NOT SERVICEABLE' : 'GET QUOTE'}
                    {!((serviceability.status === 'SET' && !serviceability.isServiceable)) && (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                            <ChevronRight size={22} />
                        </div>
                    )}
                </button>
                <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                    <Clock size={12} className="text-brand-primary" />
                    <span>Estimated 2-hour approval</span>
                </div>
            </div>
        </div>
    );
}
