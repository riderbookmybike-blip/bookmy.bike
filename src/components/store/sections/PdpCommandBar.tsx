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
    deliveryTatLabel?: string | null;
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
    coinPricing: any;
    bCoinEquivalent: number;
    onRoadBase: number;
    accessoriesCount: number;
    accessoriesTotal: number;
    insuranceAddonsCount: number;
    insuranceAddonsCost: number;
}

function DesktopMetricCards({
    displayOnRoad,
    totalSavings,
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
        <div className="hidden md:flex items-stretch gap-2 flex-1">
            {/* 1. On-Road */}
            <div
                data-testid="cmd-bar-on-road"
                className="flex-1 flex flex-col items-center justify-center text-center px-2.5 py-2 rounded-xl border border-slate-200/60 bg-slate-50/40 hover:border-slate-300 transition-all duration-300"
            >
                <p className="text-[12px] font-black font-mono tabular-nums leading-none text-slate-900">
                    ₹ {onRoadBase.toLocaleString('en-IN')}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.04em] text-slate-500">
                    <Wallet size={9} />
                    On-Road
                </p>
            </div>

            {/* 2. Accessories */}
            <div
                data-testid="cmd-bar-accessories"
                className={`flex-1 flex flex-col items-center justify-center text-center px-2.5 py-2 rounded-xl border transition-all duration-300 ${
                    accessoriesCount > 0
                        ? 'border-violet-200/60 bg-violet-50/30 hover:border-violet-300'
                        : 'border-slate-200/70 hover:border-slate-300'
                }`}
            >
                <p
                    className={`text-[12px] font-black font-mono tabular-nums leading-none ${
                        accessoriesCount > 0 ? 'text-violet-700' : 'text-slate-400'
                    }`}
                >
                    {accessoriesCount > 0 ? `+ ₹ ${accessoriesTotal.toLocaleString('en-IN')}` : '₹ 0'}
                </p>
                <p
                    className={`mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.04em] ${
                        accessoriesCount > 0 ? 'text-violet-500' : 'text-slate-400'
                    }`}
                >
                    <Package size={9} />
                    {accessoriesCount > 0 ? `${accessoriesCount} Accessories` : 'Accessories'}
                </p>
            </div>

            {/* 3. Insurance Add-ons */}
            <div
                data-testid="cmd-bar-ins-addons"
                className={`flex-1 flex flex-col items-center justify-center text-center px-2.5 py-2 rounded-xl border transition-all duration-300 ${
                    insuranceAddonsCost > 0
                        ? 'border-blue-200/60 bg-blue-50/30 hover:border-blue-300'
                        : 'border-slate-200/70 hover:border-slate-300'
                }`}
            >
                <p
                    className={`text-[12px] font-black font-mono tabular-nums leading-none ${
                        insuranceAddonsCost > 0 ? 'text-blue-600' : 'text-slate-400'
                    }`}
                >
                    {insuranceAddonsCost > 0 ? `+ ₹ ${Math.round(insuranceAddonsCost).toLocaleString('en-IN')}` : '₹ 0'}
                </p>
                <p
                    className={`mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.04em] ${
                        insuranceAddonsCost > 0 ? 'text-blue-500' : 'text-slate-400'
                    }`}
                >
                    <Shield size={9} />
                    {insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Ins. Addons` : 'Ins. Addons'}
                </p>
            </div>

            {/* 4. O'Circle Privileged — always shown */}
            <div
                data-testid="cmd-bar-ocircle"
                className="flex-[1.2] flex flex-col items-center justify-center text-center px-2.5 py-2 rounded-xl border border-emerald-300/60 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-sm transition-all duration-300"
            >
                <p className="text-[12px] font-black font-mono tabular-nums leading-none text-emerald-600">
                    − ₹ {Math.max(0, totalSavings).toLocaleString('en-IN')}
                </p>
                <div className="mt-1 inline-flex items-center gap-1">
                    <OCircleLogo size={9} color="#10B981" strokeWidth={20} />
                    <span className="text-[8px] font-black tracking-[0.04em] uppercase">
                        <span className="text-emerald-500">O&apos;</span>
                        <span className="text-slate-700">Circle</span>
                    </span>
                </div>
            </div>

            {/* 5. BCoin Wallet — always visible */}
            <div
                data-testid="cmd-bar-bcoin"
                className={`flex-[1.2] flex flex-col items-center justify-center text-center px-2.5 py-2 rounded-xl border transition-all duration-300 ${
                    bCoinDiscount > 0
                        ? 'border-amber-300/60 bg-amber-50/20 hover:border-amber-400 hover:shadow-sm'
                        : 'border-slate-200/70 hover:border-slate-300'
                }`}
            >
                <p
                    className={`text-[12px] font-black font-mono tabular-nums leading-none ${
                        bCoinDiscount > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                >
                    {bCoinDiscount > 0 ? `− ₹ ${bCoinDiscount.toLocaleString('en-IN')}` : '₹ 0'}
                </p>
                <div className="mt-1 inline-flex items-center gap-1">
                    <Logo variant="icon" size={9} customColor={bCoinDiscount > 0 ? '#C99700' : '#94A3B8'} />
                    <span
                        className={`text-[8px] font-black leading-none uppercase tracking-[0.04em] ${
                            bCoinDiscount > 0 ? 'text-slate-900' : 'text-slate-400'
                        }`}
                    >
                        Wallet
                    </span>
                </div>
            </div>

            {/* 6. Final Offer — always shown */}
            <div
                data-testid="cmd-bar-final-offer"
                className="flex-[2] flex flex-col items-center justify-center text-center px-4 py-2 rounded-xl border border-amber-400/50 bg-amber-50/30 hover:border-amber-500 hover:shadow-md ring-1 ring-amber-400/20 transition-all duration-300"
            >
                <div className="flex items-center gap-2 justify-center">
                    <p className="text-[15px] font-black font-mono tabular-nums leading-none text-amber-700">
                        ₹ {displayOnRoad.toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-0.5">
                        <Logo variant="icon" size={11} customColor="#F59E0B" />
                        <span className="text-[14px] font-black text-amber-500 font-mono tabular-nums leading-none">
                            {bCoinEquivalent.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
                <p className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-600">
                    <Zap size={9} className="fill-amber-600" />
                    Final Offer
                </p>
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
}

function MobilePriceSummary({
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    coinPricing,
    bCoinEquivalent,
}: MobilePriceSummaryProps) {
    const hasSavings = totalSavings > 0 || (coinPricing && coinPricing.discount > 0);

    return (
        <div className="flex md:hidden items-center gap-3 min-w-0">
            {/* INR Price */}
            <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-black text-white font-mono tabular-nums leading-none tracking-tight drop-shadow-sm">
                    ₹{displayOnRoad.toLocaleString('en-IN')}
                </span>
                {hasSavings && (
                    <span className="text-[9px] text-white/40 line-through font-mono tabular-nums">
                        ₹{(totalOnRoad + totalSavings).toLocaleString('en-IN')}
                    </span>
                )}
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-white/20" />

            {/* B-Coin equivalent */}
            <div className="flex items-center gap-1">
                <Logo variant="icon" size={11} customColor="#FFD700" />
                <span className="text-[13px] font-bold text-[#FFD700] font-mono tabular-nums leading-none">
                    {bCoinEquivalent.toLocaleString('en-IN')}
                </span>
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
    deliveryTatLabel,
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
            <div className={`${isDesktop ? '' : 'px-4 mb-3'}`}>
                <div
                    className={`relative overflow-hidden border ${
                        isDesktop
                            ? 'rounded-none border-x-0 border-b-0 border-t-white/70 bg-white/42 backdrop-blur-2xl shadow-[0_-8px_24px_rgba(15,23,42,0.10)]'
                            : 'rounded-full border-white/[0.08] bg-[#0b0d10]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)_inset]'
                    }`}
                >
                    <div
                        className={`pointer-events-none absolute inset-0 ${isDesktop ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_65%)]' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)_65%)]'}`}
                    />
                    <div
                        className={`relative z-10 flex items-center justify-between ${
                            isDesktop ? 'px-4 py-4.5 md:px-8 md:py-5 gap-3 md:gap-6' : 'px-5 py-4.5 gap-3'
                        }`}
                    >
                        {/* Left: Product Identity + Price */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            {/* Product Thumbnail — Desktop only */}
                            {isDesktop && (
                                <div className="hidden md:flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 relative flex items-center justify-center bg-slate-100/90 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                                        <Image
                                            src={getProductImage()}
                                            alt={displayModel}
                                            fill
                                            sizes="48px"
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-none mt-0.5 truncate">
                                            {displayModel}{' '}
                                            <span className="text-[10px] font-semibold text-slate-500 tracking-[0.08em] not-italic">
                                                {displayVariant}
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                                style={{ backgroundColor: activeColorConfig.hex }}
                                            />
                                            <span className="text-[9px] font-semibold tracking-[0.08em] text-slate-600 uppercase leading-none">
                                                {displayColor}
                                            </span>
                                        </div>
                                        <span className="mt-1 text-[8px] font-semibold tracking-[0.04em] text-slate-500 leading-none">
                                            *Price shown for Maharashtra state
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 ml-2" />
                                    {!!locationInfo?.pincode && (
                                        <button
                                            type="button"
                                            onClick={() => onEditLocation?.()}
                                            className="ml-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-left"
                                            title="Change location"
                                        >
                                            <MapPin size={12} className="text-slate-500 shrink-0" />
                                            <span className="flex flex-col min-w-0">
                                                <span className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-700 truncate">
                                                    {locationHeadline}
                                                </span>
                                                <span className="text-[8px] font-semibold text-slate-500 truncate">
                                                    {locationSubline}
                                                </span>
                                            </span>
                                            <Pencil size={10} className="text-slate-500 shrink-0" />
                                        </button>
                                    )}
                                    {(deliveryTatLabel || deliveryByLabel || studioIdLabel) && (
                                        <div className="ml-2 inline-flex items-center gap-1.5">
                                            {deliveryTatLabel && (
                                                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-2">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                                                        TAT
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.06em] text-slate-900">
                                                        {deliveryTatLabel}
                                                    </span>
                                                </div>
                                            )}
                                            {deliveryByLabel && (
                                                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-2">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                                                        BY
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.06em] text-slate-900">
                                                        {deliveryByLabel}
                                                    </span>
                                                </div>
                                            )}
                                            {studioIdLabel && (
                                                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-2">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                                                        STUDIO
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.06em] text-slate-900">
                                                        {String(studioIdLabel).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price Summary */}
                            {isDesktop ? (
                                <DesktopMetricCards
                                    displayOnRoad={displayOnRoad}
                                    totalSavings={totalSavings}
                                    coinPricing={coinPricing}
                                    bCoinEquivalent={bCoinEquivalent}
                                    onRoadBase={onRoadBase}
                                    accessoriesCount={accessoriesCount}
                                    accessoriesTotal={accessoriesTotal}
                                    insuranceAddonsCount={insuranceAddonsCount}
                                    insuranceAddonsCost={insuranceAddonsCost}
                                />
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <MobilePriceSummary
                                        displayOnRoad={displayOnRoad}
                                        totalOnRoad={totalOnRoad}
                                        totalSavings={totalSavings}
                                        coinPricing={coinPricing}
                                        bCoinEquivalent={bCoinEquivalent}
                                        footerEmi={footerEmi}
                                        emiTenure={emiTenure}
                                        showOClubPrompt={showOClubPrompt}
                                    />
                                    {(deliveryTatLabel || deliveryByLabel || studioIdLabel) && (
                                        <div className="flex items-center gap-1.5 text-[9px] leading-none">
                                            {deliveryTatLabel && (
                                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 font-black uppercase tracking-[0.12em] text-white">
                                                    TAT {deliveryTatLabel}
                                                </span>
                                            )}
                                            {deliveryByLabel && (
                                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 font-semibold text-white/90">
                                                    By {deliveryByLabel}
                                                </span>
                                            )}
                                            {studioIdLabel && (
                                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 font-semibold text-white/90">
                                                    {String(studioIdLabel).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
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
