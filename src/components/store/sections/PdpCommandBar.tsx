/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * PdpCommandBar — Unified responsive command bar for PDP.
 *
 * Replaces:
 *   - Desktop: FloatingCommandBar.tsx (product identity + savings + share + save + CTA)
 *   - Mobile: MobilePDP.tsx inline sticky bar (price + EMI + CTA)
 *
 * Guard behaviors (G4 — canonical via buildCommandBarState):
 *   - isGated=true  → CTA = SAVE QUOTE, bar ENABLED (isDisabled=false)
 *   - isGated=false + not-serviceable → CTA = NOT SERVICEABLE, bar DISABLED
 *   - showOClubPrompt: shows O'Club join prompt (desktop)
 *   - coinPricing: BCoin Wallet card shown only when coinPricing.discount > 0
 *
 * WhatsApp mini-button (desktop only):
 *   - Calls onWhatsAppClick() → opens phone-input popup
 *   - Popup submits via onWaSend(phone) → POST /api/whatsapp/welcome (server-side)
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Wallet, Package, Shield, Zap, MessageCircle, X, Send } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { OCircleLogo } from '@/components/common/OCircleLogo';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { buildCommandBarState } from '../Personalize/pdpComputations';

export interface PdpCommandBarProps {
    layout: 'desktop' | 'mobile';
    getProductImage: () => string;
    displayModel: string;
    displayVariant: string;
    displayColor: string;
    activeColorConfig: { hex: string };
    displayOnRoad: number;
    totalOnRoad: number;
    totalSavings: number;
    totalSurge?: number;
    coinPricing: any;
    showOClubPrompt: boolean;
    footerEmi: number;
    emiTenure: number;
    handleShareQuote: () => void;
    handleSaveQuote: () => void;
    handleBookingRequest: () => void;
    serviceability?: any;
    isGated: boolean;
    // Desktop metric card props
    accessoriesCount?: number;
    accessoriesTotal?: number;
    insuranceAddonsCount?: number;
    /** SOT: insuranceAddonsPrice + insuranceAddonsDiscount — matches buildPriceBreakup formula */
    insuranceAddonsCost?: number;
    // WhatsApp mini-button (desktop only)
    onWaSend?: (phone: string) => Promise<void>;
    locationInfo?: {
        pincode?: string;
        area?: string;
        taluka?: string;
        district?: string;
    };
    onEditLocation?: () => void;
    deliveryByLabel?: string | null;
    studioIdLabel?: string | null;
}

// ── WhatsApp Phone Modal ─────────────────────────────────────────────────────

interface WhatsAppPhoneModalProps {
    onClose: () => void;
    onSend: (phone: string) => Promise<void>;
}

function WhatsAppPhoneModal({ onClose, onSend }: WhatsAppPhoneModalProps) {
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const normalizedPhone = (() => {
        let digits = phone.replace(/\D/g, '');
        if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
        digits = digits.replace(/^0+/, '');
        return digits.slice(0, 10);
    })();
    const isValidIndianMobile = /^[6-9]\d{9}$/.test(normalizedPhone);

    const handleSubmit = async () => {
        if (!isValidIndianMobile) {
            setErrorMsg('Enter a valid 10-digit mobile number (starts with 6-9)');
            return;
        }
        setStatus('sending');
        setErrorMsg('');
        try {
            await onSend(normalizedPhone);
            setStatus('done');
        } catch {
            setStatus('error');
            setErrorMsg('Send failed — please try again');
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4"
            onClick={e => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Blurred overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* Modal panel */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/80 bg-white/92 backdrop-blur-2xl shadow-2xl p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                            {/* WhatsApp Business official icon (Simple Icons) */}
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="#25D366"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12 0C5.374 0 0 5.374 0 12c0 2.13.558 4.122 1.528 5.847L0 24l6.336-1.524A11.939 11.939 0 0012 24c6.626 0 12-5.374 12-12 0-6.627-5.374-12-12-12zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.724.896.939-3.619-.234-.372A9.817 9.817 0 012.182 12C2.182 6.585 6.585 2.182 12 2.182c5.415 0 9.818 4.403 9.818 9.818 0 5.416-4.403 9.818-9.818 9.818zM9 7h3.5c1.38 0 2.5 1.175 2.5 2.625 0 .98-.527 1.82-1.307 2.25C14.611 12.3 15.5 13.35 15.5 14.625c0 1.6-1.232 2.875-2.875 2.875H9V7zm1.5 1.5v2.25h1.875c.62 0 1.125-.56 1.125-1.125C13.5 9.06 12.995 8.5 12.375 8.5H10.5zm0 3.75V14.5h2c.69 0 1.25-.56 1.25-1.25 0-.69-.56-1-1.25-1H10.5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-900">
                                Send on WhatsApp
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium">Welcome offer template</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <X size={14} className="text-slate-500" />
                    </button>
                </div>

                {status === 'done' ? (
                    <div className="py-4 text-center">
                        <p className="text-2xl mb-1">✅</p>
                        <p className="text-sm font-black text-slate-900">Sent successfully!</p>
                        <p className="text-[10px] text-slate-500 mt-1">Welcome message delivered on WhatsApp</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.14em]"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Phone input */}
                        <div className="mb-3">
                            <label className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 mb-1.5">
                                Recipient Mobile
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#25D366] focus-within:bg-white transition-all">
                                <span className="text-[11px] font-bold text-slate-500 shrink-0">+91</span>
                                <div className="w-px h-4 bg-slate-200" />
                                <input
                                    ref={inputRef}
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={normalizedPhone}
                                    onChange={e => {
                                        setPhone(e.target.value);
                                        setErrorMsg('');
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    placeholder="10-digit number"
                                    className="flex-1 bg-transparent text-sm font-mono font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                                    autoFocus
                                />
                            </div>
                            {errorMsg && <p className="mt-1 text-[9px] text-rose-500 font-medium">{errorMsg}</p>}
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={status === 'sending' || !isValidIndianMobile}
                            className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.14em] transition-all
                                ${
                                    status === 'sending' || !isValidIndianMobile
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-[#25D366] text-white hover:bg-[#22c55e] hover:-translate-y-0.5 shadow-lg shadow-[#25D366]/20'
                                }`}
                        >
                            {status === 'sending' ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <Send size={12} />
                                    Send WhatsApp
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Desktop Metric Cards ─────────────────────────────────────────────────────

interface DesktopIdentityClusterProps {
    getProductImage: () => string;
    displayModel: string;
    displayVariant: string;
    displayColor: string;
    activeColorConfig: { hex: string };
}

interface DesktopCommercialClusterProps {
    onRoadBase: number;
    accessoriesCount: number;
    accessoriesTotal: number;
    insuranceAddonsCount: number;
    insuranceAddonsCost: number;
    totalSurge: number;
    totalSavings: number;
    coinPricing: any;
    displayOnRoad: number;
    bCoinEquivalent: number;
}

interface DesktopActionClusterProps {
    primaryLabel: string;
    isDisabled: boolean;
    primaryAction: () => void;
}

function compactInr(value: number, sign: '+' | '-' | '' = '') {
    return `${sign}₹ ${Math.round(value).toLocaleString('en-IN')}`;
}

function DesktopIdentityCluster({
    getProductImage,
    displayModel,
    displayVariant,
    displayColor,
    activeColorConfig,
}: DesktopIdentityClusterProps) {
    return (
        <section className="w-[260px] shrink-0 min-w-0 h-[92px] rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-3 min-w-0 h-full">
                <div className="w-11 h-11 relative flex items-center justify-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0">
                    <Image
                        src={getProductImage()}
                        alt={displayModel}
                        fill
                        sizes="44px"
                        className="object-contain p-1"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-white uppercase italic tracking-tight leading-none truncate">
                        {displayModel}{' '}
                        <span className="text-[8px] font-semibold text-white/90 tracking-[0.08em] not-italic">
                            {displayVariant}
                        </span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div
                            className="w-2.5 h-2.5 rounded-full border border-white/10"
                            style={{ backgroundColor: activeColorConfig.hex }}
                        />
                        <span className="text-[8px] font-semibold tracking-[0.08em] text-white/90 uppercase leading-none truncate">
                            {displayColor}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function DesktopCommercialCluster({
    onRoadBase,
    accessoriesCount,
    accessoriesTotal,
    insuranceAddonsCount,
    insuranceAddonsCost,
    totalSurge,
    totalSavings,
    coinPricing,
    displayOnRoad,
    bCoinEquivalent,
}: DesktopCommercialClusterProps) {
    const bCoinDiscount = coinPricing?.discount || 0;
    const showSurgeCard = totalSurge > 0;

    return (
        <div className="flex-1 flex gap-2 min-w-0">
            {/* Primary Metrics Cluster */}
            <div className="flex-[2] h-[92px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 flex items-center justify-between overflow-hidden">
                <div data-testid="cmd-bar-on-road" className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 mb-1 font-black">Base Price</p>
                    <p className="text-[15px] font-black font-mono text-white leading-none whitespace-nowrap">
                        {compactInr(onRoadBase)}
                    </p>
                </div>

                <div className="text-white/30 text-xs font-light">+</div>

                <div data-testid="cmd-bar-accessories" className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 mb-1 font-black">
                        {accessoriesCount > 0 ? `${accessoriesCount} Accessories` : 'Additional Accessories'}
                    </p>
                    <p className="text-[13px] font-black font-mono text-white leading-none whitespace-nowrap">
                        {accessoriesTotal > 0 ? compactInr(accessoriesTotal, '+') : '₹ 0'}
                    </p>
                </div>

                <div className="text-white/30 text-xs font-light">+</div>

                <div data-testid="cmd-bar-ins-addons" className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 mb-1 font-black">
                        {insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Insurance` : 'Insurance Addons'}
                    </p>
                    <p className="text-[13px] font-black font-mono text-white leading-none whitespace-nowrap">
                        {insuranceAddonsCost > 0 ? compactInr(insuranceAddonsCost, '+') : '₹ 0'}
                    </p>
                </div>
            </div>

            {/* Adjustments & Savings Cluster */}
            <div className="flex-1 h-[92px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 flex items-center justify-between">
                <div data-testid={showSurgeCard ? 'cmd-bar-surge' : 'cmd-bar-ocircle'} className="min-w-0">
                    <p className="text-[7px] uppercase tracking-[0.2em] text-white/70 mb-1 font-black">
                        {showSurgeCard ? 'Surge' : 'Savings'}
                    </p>
                    <p
                        className={`text-[11px] font-black font-mono leading-none ${showSurgeCard ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                        {showSurgeCard
                            ? compactInr(totalSurge, '+')
                            : totalSavings > 0
                              ? compactInr(totalSavings, '-')
                              : '₹ 0'}
                    </p>
                </div>

                <div className="w-px h-6 bg-white/10 mx-2" />

                <div data-testid="cmd-bar-bcoin" className="min-w-0">
                    <p className="text-[7px] uppercase tracking-[0.2em] text-white/70 mb-1 font-black">Wallet</p>
                    <p className="text-[11px] font-black font-mono text-amber-400 leading-none">
                        {bCoinDiscount > 0 ? compactInr(bCoinDiscount, '-') : '₹ 0'}
                    </p>
                </div>
            </div>

            {/* Final Outcome Cluster */}
            <div
                data-testid="cmd-bar-final-offer"
                className="flex-[1.2] h-[92px] rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 relative overflow-hidden group flex flex-col items-center justify-center text-center"
            >
                <div className="absolute top-0 right-0 p-1.5 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Logo variant="icon" size={20} customColor="#F4B000" />
                </div>
                <p className="text-[8px] uppercase tracking-[0.2em] text-amber-500 font-black mb-1.5">
                    Final Deal Value
                </p>
                <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[18px] font-black font-mono text-amber-400 leading-none">₹</span>
                        <span className="text-[18px] font-black font-mono text-amber-400 leading-none tracking-tight">
                            {displayOnRoad.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="w-px h-3 bg-amber-500/20" />
                    <div className="flex items-center gap-2">
                        <Logo variant="icon" size={16} customColor="#F4B000" />
                        <span className="text-[18px] font-black font-mono text-amber-400 leading-none tracking-tight">
                            {bCoinEquivalent.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DesktopActionCluster({ primaryLabel, isDisabled, primaryAction }: DesktopActionClusterProps) {
    return (
        <div className="h-[92px] rounded-xl border border-white/10 bg-white/5 px-2 py-2 flex items-center justify-center">
            <motion.button
                onClick={primaryAction}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.02, backgroundColor: '#FFB800' } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                className={`relative w-full h-full px-6 font-black text-xs uppercase tracking-widest rounded-xl shadow-2xl overflow-hidden flex items-center justify-center gap-3 transition-all
                    ${
                        isDisabled
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale shadow-none'
                            : 'bg-[#F4B000] text-black shadow-[#F4B000]/20 hover:shadow-[#F4B000]/40'
                    }`}
            >
                {/* Shimmer Effect */}
                {!isDisabled && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%', skewX: -20 }}
                        animate={{ x: '200%' }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: 'easeInOut',
                            delay: 0.5,
                        }}
                    />
                )}

                <span className="relative z-10">{primaryLabel}</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </div>
    );
}

// ── Mobile Metric Chip ───────────────────────────────────────────────────────

interface MobileMetricChipProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent?: 'violet' | 'blue' | 'rose' | 'emerald' | 'amber' | 'default';
    active?: boolean;
}

function MobileMetricChip({ label, value, icon, accent = 'default', active = false }: MobileMetricChipProps) {
    const accentClasses: Record<string, string> = {
        violet: active
            ? 'border-violet-400/50 bg-violet-500/15 text-violet-200'
            : 'border-white/10 bg-white/5 text-white/40',
        blue: active ? 'border-blue-400/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/5 text-white/40',
        rose: active ? 'border-rose-400/50 bg-rose-500/20 text-rose-200' : 'border-white/10 bg-white/5 text-white/40',
        emerald: active
            ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
            : 'border-white/10 bg-white/5 text-white/40',
        amber: active
            ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
            : 'border-white/10 bg-white/5 text-white/40',
        default: 'border-white/10 bg-white/5 text-white/50',
    };
    const valueClasses: Record<string, string> = {
        violet: active ? 'text-violet-300' : 'text-white/30',
        blue: active ? 'text-blue-300' : 'text-white/30',
        rose: active ? 'text-rose-300' : 'text-white/30',
        emerald: active ? 'text-emerald-300' : 'text-white/30',
        amber: active ? 'text-amber-300' : 'text-white/30',
        default: 'text-white/30',
    };

    return (
        <div
            className={`flex-none flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border transition-all duration-200 min-w-[64px] ${accentClasses[accent]}`}
        >
            <span className={`text-[11px] font-black font-mono tabular-nums leading-none ${valueClasses[accent]}`}>
                {value}
            </span>
            <div
                className={`mt-1 flex items-center gap-0.5 text-[7.5px] font-black uppercase tracking-[0.06em] ${accentClasses[accent].split(' ').at(-1)}`}
            >
                {icon}
                <span>{label}</span>
            </div>
        </div>
    );
}

// ── Mobile Price Summary ─────────────────────────────────────────────────────

interface MobilePriceSummaryProps {
    displayOnRoad: number;
    totalOnRoad: number;
    totalSavings: number;
    coinPricing: any;
    bCoinEquivalent: number;
    footerEmi: number;
    emiTenure: number;
    showOClubPrompt: boolean;
    // metric cards data
    onRoadBase: number;
    accessoriesCount: number;
    accessoriesTotal: number;
    insuranceAddonsCount: number;
    insuranceAddonsCost: number;
    totalSurge: number;
}

function MobilePriceSummary({
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    coinPricing,
    bCoinEquivalent,
    onRoadBase,
    accessoriesCount,
    accessoriesTotal,
    insuranceAddonsCount,
    insuranceAddonsCost,
    totalSurge,
}: MobilePriceSummaryProps) {
    const hasSavings = totalSavings > 0 || (coinPricing && coinPricing.discount > 0);
    const bCoinDiscount = coinPricing?.discount || 0;

    return (
        <div className="flex md:hidden flex-col gap-2 min-w-0 w-full">
            {/* Row 1: Metric chips rail */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                {/* On-Road Base */}
                <MobileMetricChip
                    label="On-Road"
                    value={`₹${Math.round(onRoadBase / 1000)}k`}
                    icon={<Wallet size={7} />}
                    accent="default"
                    active={true}
                />
                {/* Accessories */}
                <MobileMetricChip
                    label={accessoriesCount > 0 ? `${accessoriesCount} Acc` : 'Acc'}
                    value={accessoriesCount > 0 ? `+₹${Math.round(accessoriesTotal / 1000)}k` : '₹0'}
                    icon={<Package size={7} />}
                    accent="violet"
                    active={accessoriesCount > 0}
                />
                {/* Insurance */}
                <MobileMetricChip
                    label={insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Ins` : 'Ins'}
                    value={insuranceAddonsCost > 0 ? `+₹${Math.round(insuranceAddonsCost / 1000)}k` : '₹0'}
                    icon={<Shield size={7} />}
                    accent="blue"
                    active={insuranceAddonsCost > 0}
                />
                {/* Surge */}
                <MobileMetricChip
                    label="Surge"
                    value={totalSurge > 0 ? `+₹${Math.round(totalSurge / 1000)}k` : '₹0'}
                    icon={<Zap size={7} />}
                    accent="rose"
                    active={totalSurge > 0}
                />
                {/* O'Circle savings */}
                <MobileMetricChip
                    label="O'Circle"
                    value={totalSavings > 0 ? `−₹${Math.round(totalSavings / 1000)}k` : '₹0'}
                    icon={<span className="text-[6px] font-black">◎</span>}
                    accent="emerald"
                    active={totalSavings > 0}
                />
                {/* BCoin Wallet */}
                <MobileMetricChip
                    label="Wallet"
                    value={bCoinDiscount > 0 ? `−₹${Math.round(bCoinDiscount / 1000)}k` : '₹0'}
                    icon={<span className="text-[6px] font-black">ᗗ</span>}
                    accent="amber"
                    active={bCoinDiscount > 0}
                />
            </div>

            {/* Row 2: Final price + BCoin */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-[16px] font-black text-amber-400 font-mono tabular-nums leading-none tracking-tight">
                        ₹{displayOnRoad.toLocaleString('en-IN')}
                    </span>
                    {hasSavings && (
                        <span className="text-[9px] text-white/35 line-through font-mono tabular-nums">
                            ₹{(totalOnRoad + totalSavings).toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
                <div className="w-px h-3.5 bg-white/15" />
                <div className="flex items-center gap-2">
                    <Logo variant="icon" size={12} customColor="#F4B000" />
                    <span className="text-[16px] font-black text-amber-400 font-mono tabular-nums leading-none">
                        {bCoinEquivalent.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Main PdpCommandBar ───────────────────────────────────────────────────────

export function PdpCommandBar({
    layout,
    getProductImage,
    displayModel,
    displayVariant,
    displayColor,
    activeColorConfig,
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    totalSurge = 0,
    coinPricing,
    showOClubPrompt,
    footerEmi,
    emiTenure,
    handleShareQuote,
    handleSaveQuote,
    serviceability,
    isGated,
    accessoriesCount = 0,
    accessoriesTotal = 0,
    insuranceAddonsCount = 0,
    insuranceAddonsCost = 0,
    onWaSend,
    locationInfo,
    onEditLocation,
    deliveryByLabel,
    studioIdLabel,
}: PdpCommandBarProps) {
    const isDesktop = layout === 'desktop';

    // ── Canonical command bar state ──
    const barState = buildCommandBarState({
        displayOnRoad,
        totalOnRoad,
        totalSavings,
        coinPricing,
        footerEmi,
        emiTenure,
        isGated,
        serviceability,
    });
    const isDisabled = barState.isDisabled;
    const isTeamView = Boolean(onWaSend);
    const primaryAction = isTeamView ? handleShareQuote : handleSaveQuote;
    const primaryLabel = isDisabled ? barState.primaryLabel : isTeamView ? 'SHARE QUOTE' : 'SAVE QUOTE';
    const bCoinEquivalent = coinsNeededForPrice(displayOnRoad);
    const onRoadBase = barState.strikethroughPrice;
    const locationHeadline = locationInfo?.area || locationInfo?.taluka || locationInfo?.district || 'Set location';
    const locationSubline = [locationInfo?.taluka, locationInfo?.district, locationInfo?.pincode]
        .filter(Boolean)
        .join(' • ');

    // ── WhatsApp popup state (desktop only) ──
    const [showWaModal, setShowWaModal] = useState(false);

    return (
        <div
            data-parity-section="command-bar"
            className={`fixed inset-x-0 z-[95] ${isDesktop ? 'bottom-0' : 'bottom-[60px]'}`}
            style={{ paddingBottom: isDesktop ? 'env(safe-area-inset-bottom, 0px)' : undefined }}
        >
            <div className={`${isDesktop ? '' : 'px-3 mb-2.5'}`}>
                <div
                    className={`relative overflow-hidden border ${
                        isDesktop
                            ? 'rounded-none border-x-0 border-b-0 border-t-white/10 bg-[#0b0d10]/95 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.40)]'
                            : 'rounded-2xl border-white/[0.08] bg-[#0b0d10]/85 backdrop-blur-2xl shadow [0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]'
                    }`}
                >
                    <div
                        className={`pointer-events-none absolute inset-0 ${isDesktop ? 'bg-gradient-to-b from-white/[0.03] to-transparent' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)_65%)]'}`}
                    />
                    {isDesktop ? (
                        <div className="relative z-10 hidden md:flex items-center gap-2 px-6 py-3.5 overflow-x-auto">
                            {/* Cluster 1: Identity & Logistics (Left) */}
                            <div className="flex-[0.8] flex gap-2 min-w-[320px]">
                                <DesktopIdentityCluster
                                    getProductImage={getProductImage}
                                    displayModel={displayModel}
                                    displayVariant={displayVariant}
                                    displayColor={displayColor}
                                    activeColorConfig={activeColorConfig}
                                />
                                <div className="flex-1 h-[92px] rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-2.5 flex flex-col justify-center">
                                    <div className="min-w-0" data-testid="cmd-bar-location">
                                        <p className="text-[10px] font-black text-blue-400 leading-none truncate mb-1.5">
                                            {locationInfo?.pincode || 'Set City'}
                                        </p>
                                        <p className="text-[7.5px] uppercase tracking-[0.1em] text-white/40 truncate">
                                            {locationHeadline || 'Location'}
                                        </p>
                                    </div>
                                    <div className="my-1.5 h-px bg-white/5" />
                                    <div className="min-w-0" data-testid="cmd-bar-delivery">
                                        <p className="text-[9px] font-black text-white/90 leading-none truncate mb-1">
                                            {deliveryByLabel || 'Fastest'}
                                        </p>
                                        <p className="text-[7px] uppercase tracking-[0.1em] text-white/40 truncate">
                                            Delivery
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cluster 2: Price Math (Center) */}
                            <div className="flex-[2] min-w-[600px]">
                                <DesktopCommercialCluster
                                    onRoadBase={onRoadBase}
                                    accessoriesCount={accessoriesCount}
                                    accessoriesTotal={accessoriesTotal}
                                    insuranceAddonsCount={insuranceAddonsCount}
                                    insuranceAddonsCost={insuranceAddonsCost}
                                    totalSurge={totalSurge}
                                    totalSavings={totalSavings}
                                    coinPricing={coinPricing}
                                    displayOnRoad={displayOnRoad}
                                    bCoinEquivalent={bCoinEquivalent}
                                />
                            </div>

                            {/* Cluster 3: Final Action (Right) */}
                            <div className="flex-[0.7] min-w-[220px]">
                                <DesktopActionCluster
                                    primaryLabel={primaryLabel}
                                    isDisabled={isDisabled}
                                    primaryAction={primaryAction}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex items-center justify-between px-4 py-3 gap-3">
                            <div className="min-w-0 flex-1">
                                <MobilePriceSummary
                                    displayOnRoad={displayOnRoad}
                                    totalOnRoad={totalOnRoad}
                                    totalSavings={totalSavings}
                                    coinPricing={coinPricing}
                                    bCoinEquivalent={bCoinEquivalent}
                                    footerEmi={footerEmi}
                                    emiTenure={emiTenure}
                                    showOClubPrompt={showOClubPrompt}
                                    onRoadBase={onRoadBase}
                                    accessoriesCount={accessoriesCount}
                                    accessoriesTotal={accessoriesTotal}
                                    insuranceAddonsCount={insuranceAddonsCount}
                                    insuranceAddonsCost={insuranceAddonsCost}
                                    totalSurge={totalSurge}
                                />
                            </div>

                            <button
                                onClick={primaryAction}
                                disabled={isDisabled}
                                className={`h-10 px-4.5 font-black text-[11px] uppercase tracking-[0.12em] rounded-full shadow-xl flex items-center gap-2 transition-all group shrink-0
                                    ${
                                        isDisabled
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-[#FFD700] text-[#0b0d10] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                                    }`}
                            >
                                {primaryLabel}
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* WhatsApp Phone Modal — rendered at fixed z-[200] */}
            {isDesktop && showWaModal && onWaSend && (
                <WhatsAppPhoneModal
                    onClose={() => setShowWaModal(false)}
                    onSend={async phone => {
                        await onWaSend(phone);
                        setShowWaModal(false);
                    }}
                />
            )}
        </div>
    );
}
