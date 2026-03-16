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
import Image from 'next/image';
import { ArrowRight, Wallet, Package, Shield, Zap, MessageCircle, X, Send, MapPin, Pencil } from 'lucide-react';
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

interface DesktopMetricCardsProps {
    displayOnRoad: number;
    totalSavings: number;
    totalSurge: number;
    coinPricing: any;
    bCoinEquivalent: number;
    onRoadBase: number;
    accessoriesCount: number;
    accessoriesTotal: number;
    insuranceAddonsCount: number;
    insuranceAddonsCost: number;
}

/** Uniform desktop command-bar card.
 *  "Premium Cockpit" style: bg-slate-900/90, white accents, monospaced values.
 */
function DesktopCard({
    testId,
    value,
    labelNode,
    accentColor,
    isActive = true,
    flexValue = '1',
}: {
    testId?: string;
    value: React.ReactNode;
    labelNode: React.ReactNode;
    accentColor: 'violet' | 'blue' | 'rose' | 'emerald' | 'amber' | 'slate';
    isActive?: boolean;
    flexValue?: string;
}) {
    // Static mapping for Tailwind classes to ensure they are picked up by the compiler
    const themes = {
        violet: {
            text: 'text-violet-400',
            border: 'border-violet-500/30',
            bg: 'bg-violet-500/10',
            glow: 'bg-violet-400/50',
        },
        blue: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', glow: 'bg-blue-400/50' },
        rose: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', glow: 'bg-rose-400/50' },
        emerald: {
            text: 'text-emerald-400',
            border: 'border-emerald-500/30',
            bg: 'bg-emerald-500/10',
            glow: 'bg-emerald-400/50',
        },
        amber: {
            text: 'text-amber-400',
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/10',
            glow: 'bg-amber-400/50',
        },
        slate: {
            text: 'text-slate-400',
            border: 'border-slate-500/30',
            bg: 'bg-slate-500/10',
            glow: 'bg-slate-400/50',
        },
    };

    const theme = themes[accentColor];
    const accentClass = isActive ? theme.text : 'text-slate-500';
    const borderClass = isActive ? theme.border : 'border-white/5';
    const bgClass = isActive ? theme.bg : 'bg-white/5';

    return (
        <div
            data-testid={testId}
            style={{ flex: flexValue }}
            className={`relative flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border transition-all duration-300 group
                ${isActive ? 'shadow-lg shadow-black/20' : ''}
                ${borderClass} ${bgClass}`}
        >
            <div
                className={`absolute top-0 inset-x-0 h-px transition-colors duration-300 ${isActive ? theme.glow : 'bg-white/10'}`}
            />

            <p
                className={`text-[13px] font-black font-mono tabular-nums leading-none transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500'}`}
            >
                {value}
            </p>
            <div
                className={`mt-1.5 inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.08em] transition-colors duration-300 ${accentClass}`}
            >
                {labelNode}
            </div>
        </div>
    );
}

/** Info chip (Delivery By / STUDIO) — matches Cockpit system. */
function DesktopInfoChip({
    chipLabel,
    chipValue,
    icon,
}: {
    chipLabel: string;
    chipValue: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="relative flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border border-white/5 bg-white/5 overflow-hidden transition-all duration-200 min-w-[70px]">
            <p className="text-[12px] font-black font-mono tabular-nums leading-none text-slate-300">{chipValue}</p>
            <p className="mt-1.5 text-[7px] font-black uppercase tracking-[0.12em] text-slate-500 inline-flex items-center gap-1">
                {icon}
                {chipLabel}
            </p>
        </div>
    );
}

function DesktopMetricCards({
    displayOnRoad,
    totalSavings,
    totalSurge,
    coinPricing,
    bCoinEquivalent,
    onRoadBase,
    accessoriesCount,
    accessoriesTotal,
    insuranceAddonsCount,
    insuranceAddonsCost,
}: DesktopMetricCardsProps) {
    const bCoinDiscount = coinPricing?.discount || 0;

    return (
        <div className="hidden md:flex items-stretch gap-1.5 flex-1 h-12">
            {/* 1. On-Road base */}
            <DesktopCard
                testId="cmd-bar-on-road"
                accentColor="slate"
                value={`₹ ${onRoadBase.toLocaleString('en-IN')}`}
                labelNode={
                    <>
                        <Wallet size={8} /> On-Road
                    </>
                }
                isActive={true}
            />

            {/* 2. Accessories */}
            <DesktopCard
                testId="cmd-bar-accessories"
                accentColor="violet"
                value={accessoriesCount > 0 ? `+ ₹ ${accessoriesTotal.toLocaleString('en-IN')}` : '₹ 0'}
                labelNode={
                    <>
                        <Package size={8} /> {accessoriesCount > 0 ? `${accessoriesCount} Acc` : 'Accessories'}
                    </>
                }
                isActive={accessoriesCount > 0}
            />

            {/* 3. Insurance */}
            <DesktopCard
                testId="cmd-bar-ins-addons"
                accentColor="blue"
                value={
                    insuranceAddonsCost > 0 ? `+ ₹ ${Math.round(insuranceAddonsCost).toLocaleString('en-IN')}` : '₹ 0'
                }
                labelNode={
                    <>
                        <Shield size={8} /> {insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Ins` : 'Insurance'}
                    </>
                }
                isActive={insuranceAddonsCost > 0}
            />

            {/* 4. Surge */}
            <DesktopCard
                testId="cmd-bar-surge"
                accentColor="rose"
                value={totalSurge > 0 ? `+ ₹ ${Math.round(totalSurge).toLocaleString('en-IN')}` : '₹ 0'}
                labelNode={
                    <>
                        <Zap size={8} /> Surge
                    </>
                }
                isActive={totalSurge > 0}
            />

            {/* 5. O'Circle */}
            <DesktopCard
                testId="cmd-bar-ocircle"
                accentColor="emerald"
                value={`− ₹ ${Math.max(0, totalSavings).toLocaleString('en-IN')}`}
                labelNode={
                    <>
                        <OCircleLogo size={8} color={totalSavings > 0 ? '#10B981' : '#64748b'} strokeWidth={20} />
                        O'Circle
                    </>
                }
                isActive={totalSavings > 0}
            />

            {/* 6. BCoin Wallet */}
            <DesktopCard
                testId="cmd-bar-bcoin"
                accentColor="amber"
                value={bCoinDiscount > 0 ? `− ₹ ${bCoinDiscount.toLocaleString('en-IN')}` : '₹ 0'}
                labelNode={
                    <>
                        <Logo variant="icon" size={8} customColor={bCoinDiscount > 0 ? '#f59e0b' : '#64748b'} />
                        Wallet
                    </>
                }
                isActive={bCoinDiscount > 0}
            />

            {/* 7. Final Offer — Premium Golden Hero */}
            <div
                data-testid="cmd-bar-final-offer"
                style={{ flex: '1.8' }}
                className="relative flex flex-col items-center justify-center text-center px-4 py-2 rounded-xl overflow-hidden border border-amber-500/40 bg-[#0b0d10] transition-all duration-300 group"
            >
                {/* Premium Golden Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                <div className="relative flex items-center gap-2 justify-center">
                    <p className="text-[15px] font-black font-mono tabular-nums leading-none text-white tracking-tight">
                        ₹ {displayOnRoad.toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2 py-0.5">
                        <Logo variant="icon" size={9} customColor="#fbbf24" />
                        <span className="text-[12px] font-black text-amber-200 font-mono tabular-nums leading-none">
                            {bCoinEquivalent.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
                <p className="relative mt-1.5 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-amber-500/80">
                    <Zap size={8} className="fill-amber-500 text-amber-500" />
                    Final Offer
                </p>
            </div>
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
            <div className="flex items-center gap-2.5">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[17px] font-black text-white font-mono tabular-nums leading-none tracking-tight drop-shadow-sm">
                        ₹{displayOnRoad.toLocaleString('en-IN')}
                    </span>
                    {hasSavings && (
                        <span className="text-[9px] text-white/35 line-through font-mono tabular-nums">
                            ₹{(totalOnRoad + totalSavings).toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
                <div className="w-px h-3.5 bg-white/15" />
                <div className="flex items-center gap-1">
                    <Logo variant="icon" size={10} customColor="#FFD700" />
                    <span className="text-[12px] font-bold text-[#FFD700] font-mono tabular-nums leading-none">
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
                    <div
                        className={`relative z-10 flex items-center justify-between ${
                            isDesktop ? 'px-4 py-3.5 md:px-8 md:py-4 gap-4 md:gap-8' : 'px-4 py-3 gap-3'
                        }`}
                    >
                        {/* Left: Product Identity + Logistics */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            {/* Product Thumbnail — Desktop only */}
                            {isDesktop && (
                                <div className="hidden md:flex items-center gap-4 min-w-0">
                                    <div className="w-11 h-11 relative flex items-center justify-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0">
                                        <Image
                                            src={getProductImage()}
                                            alt={displayModel}
                                            fill
                                            sizes="44px"
                                            className="object-contain p-1"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[13px] font-black text-white uppercase italic tracking-tight leading-none truncate">
                                            {displayModel}{' '}
                                            <span className="text-[9px] font-semibold text-slate-500 tracking-[0.08em] not-italic">
                                                {displayVariant}
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full border border-white/10"
                                                style={{ backgroundColor: activeColorConfig.hex }}
                                            />
                                            <span className="text-[8px] font-semibold tracking-[0.08em] text-slate-400 uppercase leading-none">
                                                {displayColor}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Logistics Group */}
                                    <div className="flex items-center gap-1.5 ml-2">
                                        {!!locationInfo?.pincode && (
                                            <button
                                                type="button"
                                                onClick={() => onEditLocation?.()}
                                                className="relative flex flex-col items-center justify-center text-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 min-w-[90px] group"
                                                title="Change location"
                                            >
                                                <span className="text-[11px] font-black font-mono tabular-nums leading-none text-blue-400 group-hover:text-blue-300 transition-colors">
                                                    {locationInfo.pincode}
                                                </span>
                                                <span className="mt-1.5 text-[7px] font-black uppercase tracking-[0.12em] text-slate-500 inline-flex items-center gap-1">
                                                    <MapPin size={7} />
                                                    {locationInfo.area || locationInfo.district || 'Location'}
                                                    <Pencil
                                                        size={6}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </span>
                                            </button>
                                        )}
                                        {deliveryByLabel && (
                                            <DesktopInfoChip
                                                chipLabel="Delivery by"
                                                chipValue={deliveryByLabel}
                                                icon={<Zap size={7} className="text-amber-400" />}
                                            />
                                        )}
                                        {studioIdLabel && (
                                            <DesktopInfoChip
                                                chipLabel="STUDIO"
                                                chipValue={String(studioIdLabel).toUpperCase()}
                                                icon={<Package size={7} className="text-slate-400" />}
                                            />
                                        )}
                                    </div>

                                    {/* Vertical Divider between Logistics and Commercials */}
                                    <div className="w-px h-8 bg-white/10 mx-2" />
                                </div>
                            )}

                            {/* Commercials: Price Summary */}
                            {isDesktop ? (
                                <DesktopMetricCards
                                    displayOnRoad={displayOnRoad}
                                    totalSavings={totalSavings}
                                    totalSurge={totalSurge}
                                    coinPricing={coinPricing}
                                    bCoinEquivalent={bCoinEquivalent}
                                    onRoadBase={onRoadBase}
                                    accessoriesCount={accessoriesCount}
                                    accessoriesTotal={accessoriesTotal}
                                    insuranceAddonsCount={insuranceAddonsCount}
                                    insuranceAddonsCost={insuranceAddonsCost}
                                />
                            ) : (
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
                            )}
                        </div>

                        {/* Right: Actions + CTA */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* CTA Button — both layouts */}
                            <button
                                onClick={primaryAction}
                                disabled={isDisabled}
                                className={`${isDesktop ? 'h-12 px-7' : 'h-10 px-4.5'} font-black text-[11px] uppercase tracking-[0.12em] rounded-full shadow-xl flex items-center gap-2 transition-all group
                                    ${
                                        isDisabled
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : isDesktop
                                              ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 hover:-translate-y-0.5'
                                              : 'bg-[#FFD700] text-[#0b0d10] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                                    }`}
                            >
                                {primaryLabel}
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
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
