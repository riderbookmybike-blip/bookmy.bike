/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    HelpCircle,
} from 'lucide-react';

import { formatDisplayIdForUI, unformatDisplayId } from '@/lib/displayId';

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
        helpText?: string[] | string;
        breakdown?: { label: string; amount: number }[];
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
    leadName?: string;
    schemeId?: string;
    financeCharges?: { id: string; label: string; value: number; helpText?: string }[];
    annualInterest: number;
    interestType?: string;
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
    leadName,
    schemeId,
    financeCharges = [],
    annualInterest,
    interestType,
}: SidebarHUDProps) {
    console.log('SidebarHUD Debug:', { schemeId, leadName, pricingSource });
    const discountPercent = Math.round((savings / totalMRP) * 100);
    // Ensure negative zero or small decimals show as 0
    const displayDownPayment = downPayment < 1 ? 0 : downPayment;
    const loanAmount = totalOnRoad - displayDownPayment;

    const [serviceability, setServiceability] = React.useState<{
        pincode?: string;
        taluka?: string;
        isServiceable: boolean;
        status: 'CHECKING' | 'SET' | 'UNSET';
    }>({ isServiceable: false, status: 'CHECKING' });
    const [isExpanded, setIsExpanded] = React.useState(false);

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
                        status: 'SET',
                    });
                } else {
                    setServiceability({
                        taluka: data.taluka || data.city,
                        isServiceable: false, // Or keep as unset if no pincode
                        status: 'SET',
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
        <div className="hidden lg:block lg:w-[440px] lg:sticky lg:top-[var(--header-h)] glass-panel dark:bg-[#0b0d10]/60 rounded-[3rem] overflow-hidden shadow-2xl flex-col animate-in fade-in slide-in-from-right-8 duration-700 h-fit lg:flex border border-slate-200 dark:border-white/5 relative">
            {/* Ambient Card Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/10 blur-3xl rounded-full pointer-events-none" />
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

                {leadName && (
                    <div className="mb-4 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl animate-pulse">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                            <Zap size={14} />
                            Quoting for Customer
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white uppercase mt-1">
                            {leadName}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Pricing Section */}
            <div className="px-8 py-5">
                <div className="glass-card dark:bg-white/[0.02] rounded-3xl p-7 space-y-6">
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {priceBreakup
                                .filter(item => !item.isTotal)
                                .map((item, idx) => {
                                    // Only show basic items when collapsed, show all when expanded
                                    const isBasic = idx < 2 || item.isDeduction || item.isInfo;
                                    if (!isExpanded && !isBasic) return null;

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex justify-between items-center text-[10px] relative group/item"
                                        >
                                            <span
                                                className={`font-bold uppercase tracking-[0.1em] ${item.breakdown || item.helpText ? 'cursor-help border-b border-dotted border-slate-300 dark:border-white/20' : 'text-slate-500/80'}`}
                                            >
                                                {item.label}
                                            </span>
                                            <span
                                                className={`font-mono font-black ${item.isDeduction ? 'text-emerald-500' : item.isInfo ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-300'} flex items-center gap-1.5`}
                                            >
                                                <span className={item.isDeduction ? 'animate-pulse' : ''}>
                                                    {item.isDeduction ? '-' : ''}
                                                    {typeof item.value === 'number'
                                                        ? `₹${Math.abs(item.value).toLocaleString()}`
                                                        : item.value}
                                                </span>
                                            </span>

                                            {/* Tooltip for Breakdown or HelpText */}
                                            {(item.breakdown || item.helpText) && (
                                                <div className="absolute right-0 bottom-full mb-2 w-max max-w-[240px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-3 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                                                    {item.breakdown ? (
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2 border-b border-white/20 dark:border-black/10 pb-1">
                                                                Breakdown
                                                            </p>
                                                            {item.breakdown.map((b, bIdx) => (
                                                                <div
                                                                    key={bIdx}
                                                                    className="flex justify-between gap-6 text-[10px]"
                                                                >
                                                                    <span className="opacity-80 font-medium">
                                                                        {b.label}
                                                                    </span>
                                                                    <span className="font-mono font-bold">
                                                                        ₹{b.amount.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[9px] font-bold uppercase tracking-wide">
                                                            {Array.isArray(item.helpText)
                                                                ? item.helpText.map((line, lineIdx) => (
                                                                      <div key={lineIdx}>{line}</div>
                                                                  ))
                                                                : item.helpText}
                                                        </div>
                                                    )}
                                                    {/* Arrow */}
                                                    <div className="absolute top-full right-4 -mt-1 w-2 h-2 bg-slate-900 dark:bg-white rotate-45"></div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                        </AnimatePresence>

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full py-2 border border-slate-200 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all flex items-center justify-center gap-2 group/toggle"
                        >
                            <span>{isExpanded ? 'Show Less' : 'Show Full Breakdown'}</span>
                            <ChevronRight
                                size={12}
                                className={`transition-transform duration-300 ${isExpanded ? '-rotate-90' : 'rotate-90'}`}
                            />
                        </button>
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
                                                {serviceability.isServiceable
                                                    ? 'Fully Serviceable'
                                                    : 'Not Serviceable Area'}
                                            </span>
                                        </div>
                                        <span className="opacity-50 font-medium">
                                            {serviceability.taluka || serviceability.pincode}
                                        </span>
                                        {isEstimate && (
                                            <span className="text-amber-500 font-bold block mt-1">
                                                *Estimated Price (Non-Binding)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-4xl font-black italic tracking-tighter text-brand-primary dark:text-brand-primary font-mono block drop-shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-in zoom-in-95 duration-700">
                                ₹{totalOnRoad.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Finance Block */}
            <div className="px-8 py-4 space-y-6">
                <div className="glass-card dark:bg-white/[0.02] rounded-3xl p-7 relative group transition-all overflow-hidden space-y-6">
                    {/* List-style Finance Details */}
                    <div className="space-y-4">
                        {[
                            { label: 'Down Payment', value: `₹${displayDownPayment.toLocaleString()}` },
                            // Dynamic Charges
                            ...financeCharges.map(charge => ({
                                label: charge.label,
                                value:
                                    typeof charge.value === 'number'
                                        ? `₹${charge.value.toLocaleString()}`
                                        : charge.value,
                                isDeduction: false,
                                helpText: charge.helpText,
                            })),
                            { label: 'Loan Amount', value: `₹${loanAmount.toLocaleString()}` },
                            {
                                label: `Interest Rate (${interestType || 'REDUCING'})`,
                                value: `${(annualInterest * 100).toFixed(2)}%`,
                                isHighlight: true,
                            },
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
                            // Applied Scheme - moved to bottom
                            schemeId || 'QGH-X2A-SMY'
                                ? {
                                      label: 'Applied Scheme',
                                      value: formatDisplayIdForUI(unformatDisplayId(schemeId || 'QGH-X2A-SMY')),
                                      isHighlight: false,
                                  }
                                : null,
                        ]
                            .filter(Boolean)
                            .map((item: any, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-500/80 uppercase tracking-widest">
                                        {item.label}
                                    </span>
                                    <span
                                        className={`font-mono font-black tracking-tight uppercase ${item.isHighlight ? item.colorClass || 'text-brand-primary italic' : 'text-slate-900 dark:text-white'} flex items-center gap-1.5`}
                                    >
                                        {item.value}
                                        {item.helpText && (
                                            <div className="relative group/help cursor-help">
                                                <HelpCircle
                                                    size={10}
                                                    className="text-slate-400 group-hover/help:text-slate-600"
                                                />
                                                <div className="absolute right-0 bottom-full mb-2 w-max max-w-[200px] rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold uppercase tracking-wide px-2 py-1 opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                                                    {item.helpText}
                                                </div>
                                            </div>
                                        )}
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
                            <span className="text-4xl font-black italic tracking-tighter text-brand-primary dark:text-brand-primary font-mono block drop-shadow-[0_0_20px_rgba(255,215,0,0.2)]">
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
                        ${
                            serviceability.status === 'SET' && !serviceability.isServiceable
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black shadow-[#FFD700]/30 active:scale-[0.98]'
                        }`}
                >
                    {leadName
                        ? 'SAVE QUOTE'
                        : serviceability.status === 'SET' && !serviceability.isServiceable
                          ? 'NOT SERVICEABLE'
                          : 'GET QUOTE'}
                    {!(serviceability.status === 'SET' && !serviceability.isServiceable) && (
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
