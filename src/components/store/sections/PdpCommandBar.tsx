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
import {
    ArrowRight,
    Wallet,
    Package,
    Shield,
    Zap,
    MessageCircle,
    X,
    Send,
    Edit2,
    Share2,
    Download,
    Lock,
    CircleHelp,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { OCircleLogo } from '@/components/common/OCircleLogo';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { buildCommandBarState } from '../Personalize/pdpComputations';

const LOGIN_NEXT_STORAGE_KEY = 'bkmb_login_next';

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
    handleDownloadQuote?: () => void;
    handleReachUsQuote?: () => void;
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
    isLoggedIn?: boolean;
    /** IDLE = not saved yet; SAVED = quote saved, show Download Dossier CTA; DOWNLOADED = dossier opened, show Share CTA */
    quoteState?: 'IDLE' | 'SAVED' | 'DOWNLOADED';
    quoteActionDisabled?: boolean;
    quoteActionDisabledLabel?: string;
    isPendingPrice?: boolean;
    /** Phase 2: when false, price values are masked and primary CTA is disabled */
    isCommercialReady?: boolean;
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
    isLoggedIn: boolean;
    quoteActionsEnabled: boolean;
    primaryAction: () => void;
    handleShareQuote?: () => void;
    handleDownloadQuote?: () => void;
    handleReachUsQuote?: () => void;
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
        <section className="flex-1 lg:flex-[2.5] w-full min-w-[200px] max-w-none shrink-0 h-[72px] lg:h-[80px] rounded-[18px] border border-slate-200 bg-white px-3 lg:px-6 py-2 flex items-center justify-center relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-center gap-2 lg:gap-3 min-w-0 w-full relative z-10">
                <div className="w-[56px] h-[56px] lg:w-[64px] lg:h-[64px] relative flex items-center justify-center shrink-0">
                    <Image
                        src={getProductImage()}
                        alt={displayModel}
                        fill
                        sizes="(min-width: 1024px) 64px, 56px"
                        className="object-contain"
                    />
                </div>
                <div className="min-w-0 flex flex-col justify-center items-center shrink-0">
                    <p className="text-[12px] font-black text-slate-900 uppercase italic tracking-tight leading-none truncate text-center">
                        {displayModel}{' '}
                        <span className="text-[8px] font-semibold text-slate-500 tracking-[0.08em] not-italic">
                            {displayVariant}
                        </span>
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-1 relative w-full overflow-hidden whitespace-nowrap">
                        <div
                            className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0 inline-block align-middle shadow-sm"
                            style={{ backgroundColor: activeColorConfig.hex }}
                        />
                        <span className="text-[8px] font-semibold tracking-[0.08em] text-slate-600 uppercase leading-none truncate inline-block align-middle mt-0.5">
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
}: DesktopCommercialClusterProps) {
    const bCoinDiscount = coinPricing?.discount || 0;
    const showSurgeCard = totalSurge > 0;
    const hasAccessories = accessoriesTotal > 0;
    const hasInsurance = insuranceAddonsCost > 0;
    const hasSavings = totalSavings > 0;
    const hasWallet = bCoinDiscount > 0;

    return (
        <div className="flex-1 flex gap-px min-w-0 bg-slate-200 p-px rounded-[18px] overflow-hidden shadow-sm">
            {/* Primary Metrics Cluster */}
            <div className="flex-[1.5] flex items-center bg-white px-2 lg:px-3 xl:px-6 py-2 xl:py-3 rounded-l-[18px] min-w-0">
                <div data-testid="cmd-bar-on-road" className="min-w-0 flex-1 shrink">
                    <p className="text-[18px] font-black font-mono text-slate-900 leading-tight whitespace-nowrap">
                        {compactInr(onRoadBase)}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-black mt-0.5">On Road</p>
                </div>

                <div className="text-slate-300 text-xs font-light px-1 xl:px-2 shrink-0">+</div>

                <div data-testid="cmd-bar-accessories" className="min-w-0 flex-1 shrink">
                    <p
                        className={`text-[16px] font-black font-mono leading-tight whitespace-nowrap transition-colors ${hasAccessories ? 'text-slate-800' : 'text-slate-300'}`}
                    >
                        {hasAccessories ? compactInr(accessoriesTotal, '+') : '₹ 0'}
                    </p>
                    <p
                        className={`text-[9px] uppercase tracking-[0.14em] font-black mt-0.5 transition-colors ${hasAccessories ? 'text-slate-600' : 'text-slate-400'}`}
                    >
                        {accessoriesCount > 0 ? `${accessoriesCount} Additional Accessories` : 'Additional Accessories'}
                    </p>
                </div>

                <div className="text-slate-300 text-xs font-light px-1 xl:px-2 shrink-0">+</div>

                <div data-testid="cmd-bar-ins-addons" className="min-w-0 flex-1 shrink">
                    <p
                        className={`text-[16px] font-black font-mono leading-tight whitespace-nowrap transition-colors ${hasInsurance ? 'text-slate-800' : 'text-slate-300'}`}
                    >
                        {hasInsurance ? compactInr(insuranceAddonsCost, '+') : '₹ 0'}
                    </p>
                    <p
                        className={`text-[9px] uppercase tracking-[0.14em] font-black mt-0.5 transition-colors ${hasInsurance ? 'text-slate-600' : 'text-slate-400'}`}
                    >
                        {insuranceAddonsCount > 0 ? `${insuranceAddonsCount} Insurance Addons` : 'Insurance Addons'}
                    </p>
                </div>
            </div>

            {/* Adjustments & Savings Cluster */}
            <div className="w-[110px] lg:w-[140px] xl:w-[180px] shrink-0 flex flex-col justify-center bg-white px-2 xl:px-4 py-2 rounded-r-[18px] gap-1 relative overflow-hidden group">
                <div
                    data-testid={showSurgeCard ? 'cmd-bar-surge' : 'cmd-bar-ocircle'}
                    className="min-w-0 flex items-center justify-between gap-2 relative z-10"
                >
                    <p
                        className={`text-[9px] uppercase tracking-[0.14em] font-black whitespace-nowrap ${showSurgeCard ? 'text-rose-500' : hasSavings ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                        {showSurgeCard ? 'Surge' : "O'Circle"}
                    </p>
                    <p
                        className={`text-[13px] font-black font-mono leading-tight whitespace-nowrap ${showSurgeCard ? 'text-rose-600' : hasSavings ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                        {showSurgeCard
                            ? compactInr(totalSurge, '+')
                            : hasSavings
                              ? compactInr(totalSavings, '-')
                              : '₹ 0'}
                    </p>
                </div>

                <div className="h-px w-full bg-slate-100 relative z-10" />

                <div
                    data-testid="cmd-bar-bcoin"
                    className="min-w-0 flex items-center justify-between gap-2 relative z-10"
                >
                    <p
                        className={`text-[9px] uppercase tracking-[0.14em] font-black whitespace-nowrap ${hasWallet ? 'text-amber-500' : 'text-slate-400'}`}
                    >
                        Wallet
                    </p>
                    <p
                        className={`text-[13px] font-black font-mono leading-tight whitespace-nowrap ${hasWallet ? 'text-amber-500' : 'text-slate-400'}`}
                    >
                        {hasWallet ? compactInr(bCoinDiscount, '-') : '₹ 0'}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface DesktopFinalOutcomeProps {
    displayOnRoad: number;
    bCoinEquivalent: number;
    isPendingPrice?: boolean;
    isCommercialReady?: boolean;
}

function DesktopFinalOutcome({
    displayOnRoad,
    bCoinEquivalent,
    isPendingPrice,
    isCommercialReady = true,
}: DesktopFinalOutcomeProps) {
    return (
        <div className="h-full px-4 py-1.5 xl:py-2 w-full bg-slate-50 border border-slate-200 shadow-sm rounded-2xl flex items-center justify-between">
            {/* Left: On-Road Price */}
            <div className="flex-1 flex flex-col items-start pr-2">
                <div className="flex items-center gap-1 mb-0.5 cursor-help">
                    <p className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] italic text-slate-500 leading-none">
                        ON-ROAD PRICE
                    </p>
                    <CircleHelp size={10} className="text-emerald-500/40" />
                </div>
                {isPendingPrice ? (
                    <div className="h-6 w-24 rounded bg-slate-200/50 animate-pulse mt-0.5" />
                ) : !isCommercialReady ? (
                    <p className="text-[11px] italic text-slate-400 mt-0.5">Login to view price</p>
                ) : (
                    <div className="flex flex-col items-start gap-0.5 mt-0.5">
                        <span className="whitespace-nowrap tabular-nums font-black italic text-[#0f172a] text-[24px] md:text-[28px] leading-none">
                            ₹{displayOnRoad.toLocaleString('en-IN')}
                        </span>
                    </div>
                )}
            </div>

            {/* Center Divider */}
            {bCoinEquivalent > 0 && !isPendingPrice && (
                <div className="w-px h-8 bg-slate-200 mx-2 xl:mx-4 shrink-0 rounded-full" />
            )}

            {/* Right Panel: O'Circle */}
            {!isPendingPrice && bCoinEquivalent > 0 && (
                <div className="flex-1 flex flex-col items-start pl-2">
                    <p className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] italic text-slate-500 leading-none mb-0.5 mt-0.5">
                        O'CIRCLE
                    </p>
                    <div className="flex items-center gap-1 xl:gap-1.5 mt-0.5 xl:mt-0">
                        <div className="translate-y-px">
                            <Logo variant="icon" size={14} customColor="#0f172a" />
                        </div>
                        <span className="whitespace-nowrap tabular-nums font-black italic text-[#0f172a] text-[24px] md:text-[28px] leading-none">
                            {bCoinEquivalent.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function DesktopActionCluster({
    primaryLabel,
    isDisabled,
    isLoggedIn,
    quoteActionsEnabled,
    primaryAction,
    handleShareQuote,
    handleDownloadQuote,
    handleReachUsQuote,
}: DesktopActionClusterProps) {
    const lockButtonClasses = !isLoggedIn ? 'border-amber-200 bg-amber-50 text-amber-600' : '';
    const quoteActionsDisabledClasses = !quoteActionsEnabled
        ? 'opacity-45 cursor-not-allowed hover:!bg-white hover:!text-slate-500 hover:scale-100 hover:shadow-sm'
        : '';

    return (
        <div className="h-full flex items-center justify-end w-full gap-2">
            {/* Download Quote Button */}
            <motion.button
                onClick={
                    quoteActionsEnabled ? handleDownloadQuote || (() => console.log('Download clicked')) : undefined
                }
                disabled={!quoteActionsEnabled}
                whileHover={{ scale: 1.05, backgroundColor: '#f1f5f9' }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-[50px] lg:w-[60px] h-full rounded-[18px] bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shrink-0 shadow-sm ${lockButtonClasses} ${quoteActionsDisabledClasses}`}
                title={
                    !quoteActionsEnabled
                        ? 'Save quote first'
                        : isLoggedIn
                          ? 'Download Quote'
                          : 'Login required to download quote'
                }
            >
                <Download size={18} strokeWidth={2.5} />
                {!isLoggedIn && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                        <Lock size={10} className="text-slate-900" strokeWidth={2.5} />
                    </span>
                )}
            </motion.button>

            {/* Share Quote Button */}
            <motion.button
                onClick={quoteActionsEnabled ? handleShareQuote : undefined}
                disabled={!quoteActionsEnabled}
                whileHover={{ scale: 1.05, backgroundColor: '#f1f5f9' }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-[50px] lg:w-[60px] h-full rounded-[18px] bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shrink-0 shadow-sm ${lockButtonClasses} ${quoteActionsDisabledClasses}`}
                title={
                    !quoteActionsEnabled
                        ? 'Save quote first'
                        : isLoggedIn
                          ? 'Share Quote'
                          : 'Login required to share quote'
                }
            >
                <Share2 size={18} strokeWidth={2.5} />
                {!isLoggedIn && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                        <Lock size={10} className="text-slate-900" strokeWidth={2.5} />
                    </span>
                )}
            </motion.button>

            {/* Reach Us (WhatsApp) Button */}
            <motion.button
                onClick={quoteActionsEnabled ? handleReachUsQuote : undefined}
                disabled={!quoteActionsEnabled}
                whileHover={{ scale: 1.05, backgroundColor: '#f1f5f9' }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-[50px] lg:w-[60px] h-full rounded-[18px] bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shrink-0 shadow-sm ${quoteActionsDisabledClasses}`}
                title={quoteActionsEnabled ? 'Reach Us on WhatsApp' : 'Save quote first'}
            >
                <MessageCircle size={18} strokeWidth={2.5} />
            </motion.button>

            {/* Main Action Button (Save) */}
            <motion.button
                onClick={primaryAction}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.02, backgroundColor: '#FFB800' } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                className={`relative flex-1 lg:w-[150px] h-full px-4 font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-[18px] overflow-hidden flex items-center justify-center gap-2 transition-all shadow-sm
                    ${
                        isDisabled
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale'
                            : 'bg-[#F4B000] text-[#0a0a0a]'
                    }`}
            >
                {/* Shimmer Effect */}
                {!isDisabled && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
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
                {!isLoggedIn && !isDisabled && <Lock size={12} className="relative z-10" />}
            </motion.button>
        </div>
    );
}

interface AuthGateModalProps {
    onClose: () => void;
    onLogin: () => void;
}

function AuthGateModal({ onClose, onLogin }: AuthGateModalProps) {
    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#111319] p-5 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-300">Login Required</p>
                    <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="Close">
                        <X size={16} />
                    </button>
                </div>
                <p className="mt-3 text-sm text-white/80">
                    Quote save, share aur download continue karne ke liye pehle login karein.
                </p>
                <div className="mt-5 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 rounded-xl border border-white/20 text-xs font-black uppercase tracking-[0.12em] text-white/80"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onLogin}
                        className="flex-1 h-10 rounded-xl bg-[#F4B000] text-xs font-black uppercase tracking-[0.12em] text-[#0a0a0a]"
                    >
                        Login
                    </button>
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
    handleDownloadQuote,
    handleReachUsQuote,
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
    isLoggedIn = false,
    quoteState = 'IDLE',
    quoteActionDisabled = false,
    quoteActionDisabledLabel,
    isPendingPrice = false,
    isCommercialReady = true,
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
    const isDisabled = !isCommercialReady || barState.isDisabled || quoteActionDisabled;
    const isTeamView = Boolean(onWaSend);
    // Desktop: IDLE → SAVE QUOTE, SAVED → DOWNLOAD DOSSIER, DOWNLOADED → SHARE QUOTE
    // Mobile:  IDLE → SAVE QUOTE, SAVED/DOWNLOADED → DOWNLOAD QUOTE
    const isSaved = quoteState === 'SAVED';
    const isDownloaded = quoteState === 'DOWNLOADED';
    const isDownloadModeMobile = !isDesktop && (isSaved || isDownloaded);
    const quoteActionsEnabled = quoteState !== 'IDLE';
    const effectivePrimaryLabel = !isCommercialReady
        ? 'LOGIN TO VIEW'
        : isDisabled
          ? quoteActionDisabledLabel || barState.primaryLabel
          : isDesktop
            ? isTeamView
                ? 'SHARE QUOTE'
                : isDownloaded
                  ? 'SHARE QUOTE'
                  : isSaved
                    ? 'DOWNLOAD DOSSIER'
                    : 'SAVE QUOTE'
            : isDownloadModeMobile
              ? 'DOWNLOAD QUOTE'
              : 'SAVE QUOTE';
    const primaryAction = isDesktop
        ? isTeamView
            ? handleShareQuote
            : isDownloaded
              ? handleShareQuote
              : isSaved
                ? (handleDownloadQuote ?? handleSaveQuote)
                : handleSaveQuote
        : isDownloadModeMobile
          ? (handleDownloadQuote ?? handleSaveQuote)
          : handleSaveQuote;
    const primaryLabel = effectivePrimaryLabel;
    const bCoinEquivalent = isCommercialReady ? coinsNeededForPrice(displayOnRoad) : 0;
    const onRoadBase = barState.strikethroughPrice;
    const locationHeadline = locationInfo?.area || locationInfo?.taluka || locationInfo?.district || 'Set location';
    const locationSubline = [locationInfo?.taluka, locationInfo?.district, locationInfo?.pincode]
        .filter(Boolean)
        .join(' • ');

    // ── WhatsApp popup state (desktop only) ──
    const [showWaModal, setShowWaModal] = useState(false);
    const [showAuthGateModal, setShowAuthGateModal] = useState(false);

    const redirectToLogin = () => {
        if (typeof window === 'undefined') return;
        const next = `${window.location.pathname}${window.location.search || ''}`;
        localStorage.setItem(LOGIN_NEXT_STORAGE_KEY, next);
        // StoreLayoutClient listens for 'openLogin' and opens LoginSidebar in-place.
        window.dispatchEvent(new CustomEvent('openLogin'));
        setShowAuthGateModal(false);
    };

    const runWithAuthGate = (action?: () => void) => {
        if (!isLoggedIn) {
            setShowAuthGateModal(true);
            return;
        }
        action?.();
    };

    const authAwareShare = () => runWithAuthGate(handleShareQuote);
    const authAwareDownload = () => runWithAuthGate(handleDownloadQuote || (() => console.log('Download clicked')));
    const authAwareReachUs = () => runWithAuthGate(handleReachUsQuote);
    const authAwarePrimaryAction = () => runWithAuthGate(primaryAction);

    return (
        <div
            data-parity-section="command-bar"
            className={`fixed inset-x-0 z-[95] ${isDesktop ? 'bottom-0' : 'bottom-[60px]'}`}
            style={{ paddingBottom: isDesktop ? 'env(safe-area-inset-bottom, 0px)' : undefined }}
        >
            <div className={`${isDesktop ? '' : 'px-3 mb-2.5'}`}>
                <div
                    className={`relative overflow-hidden ${
                        isDesktop
                            ? 'rounded-t-[32px] bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'
                            : 'rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(255,255,255,0.6)]'
                    }`}
                >
                    {/* Glass shimmer overlay */}
                    <div
                        className={`pointer-events-none absolute inset-0 ${isDesktop ? 'bg-gradient-to-b from-slate-50 to-transparent' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.05)_60%,rgba(255,255,255,0.2))]'}`}
                    />
                    {isDesktop ? (
                        <div className="relative z-10 hidden md:flex items-center justify-center w-full px-4 lg:px-8 py-3 lg:py-4 border-t border-white">
                            <div className="flex items-stretch justify-center gap-3 lg:gap-8 w-full max-w-[1600px] overflow-x-auto">
                                {/* Card 1: Identity */}
                                <DesktopIdentityCluster
                                    getProductImage={getProductImage}
                                    displayModel={displayModel}
                                    displayVariant={displayVariant}
                                    displayColor={displayColor}
                                    activeColorConfig={activeColorConfig}
                                />

                                {/* Card 2: Final Deal */}
                                <div className="flex-[1.2] lg:flex-[1.6] w-full min-w-[220px] max-w-[480px] h-[72px] lg:h-[80px] rounded-[18px] bg-slate-50 border border-slate-200 shadow-sm overflow-hidden">
                                    <DesktopFinalOutcome
                                        displayOnRoad={displayOnRoad}
                                        bCoinEquivalent={bCoinEquivalent}
                                        isPendingPrice={isPendingPrice}
                                        isCommercialReady={isCommercialReady}
                                    />
                                </div>

                                {/* Card 3: Location and TAT */}
                                <div className="flex-[0.8] lg:flex-1 w-full min-w-[150px] max-w-[300px] shrink-0 h-[72px] lg:h-[80px] rounded-[18px] border border-slate-200 bg-white shadow-sm px-4 lg:px-6 py-2 lg:py-3 flex flex-col justify-center gap-2">
                                    <button
                                        onClick={onEditLocation}
                                        className="min-w-0 flex items-center justify-between group cursor-pointer text-left"
                                        data-testid="cmd-bar-location"
                                    >
                                        <div className="flex flex-col flex-1 min-w-0 pr-4">
                                            <p className="text-[11px] font-black text-slate-800 leading-none truncate mb-1 group-hover:text-slate-900 transition-colors">
                                                {locationHeadline || 'Location'}
                                            </p>
                                            <p className="text-[9px] uppercase tracking-[0.1em] text-amber-500 font-bold truncate">
                                                {locationInfo?.pincode || 'Set City'}
                                            </p>
                                        </div>
                                        <Edit2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                                    </button>
                                    <div className="h-px bg-slate-100 w-full" />
                                    <div
                                        className="min-w-0 flex items-center justify-between"
                                        data-testid="cmd-bar-delivery"
                                    >
                                        <p className="text-[11px] font-black text-slate-800 leading-none truncate mb-1">
                                            {deliveryByLabel || 'Fastest'}
                                        </p>
                                        <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-bold truncate">
                                            Delivery By
                                        </p>
                                    </div>
                                </div>

                                {/* Card 4: CTA Cluster (Download, Share, Save) */}
                                <div className="shrink-0 w-auto min-w-[260px] lg:min-w-[360px] max-w-[460px] lg:flex-[1.2] h-[72px] lg:h-[80px] flex-none">
                                    <DesktopActionCluster
                                        primaryLabel={primaryLabel}
                                        isDisabled={isDisabled}
                                        isLoggedIn={isLoggedIn}
                                        quoteActionsEnabled={quoteActionsEnabled}
                                        primaryAction={authAwarePrimaryAction}
                                        handleShareQuote={authAwareShare}
                                        handleDownloadQuote={authAwareDownload}
                                        handleReachUsQuote={authAwareReachUs}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex items-center justify-center w-full px-4 py-3">
                            <button
                                onClick={authAwarePrimaryAction}
                                disabled={isDisabled}
                                className={`relative w-full h-[52px] px-6 font-black text-[13px] uppercase tracking-[0.14em] rounded-full shadow-xl flex items-center justify-center gap-2 transition-all group shrink-0 overflow-hidden
                                    ${
                                        isDisabled
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-[#FFD700] text-[#0b0d10] shadow-[0_4px_24px_rgba(255,215,0,0.4)]'
                                    }`}
                            >
                                {/* Shimmer sweep */}
                                {!isDisabled && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                                        initial={{ x: '-100%', skewX: -15 }}
                                        animate={{ x: '200%' }}
                                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.8 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {primaryLabel === 'DOWNLOAD QUOTE' ? 'DOWNLOAD DOSSIER' : primaryLabel}
                                </span>
                                {!isLoggedIn && !isDisabled && (
                                    <Lock size={14} className="relative z-10 ml-1 opacity-70" />
                                )}
                                <ArrowRight
                                    size={16}
                                    className="relative z-10 group-hover:translate-x-1 transition-transform"
                                />
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
            {showAuthGateModal && (
                <AuthGateModal onClose={() => setShowAuthGateModal(false)} onLogin={redirectToLogin} />
            )}
        </div>
    );
}
