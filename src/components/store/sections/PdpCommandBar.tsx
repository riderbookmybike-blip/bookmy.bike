/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * PdpCommandBar — Unified responsive command bar for PDP.
 *
 * Replaces:
 *   - Desktop: FloatingCommandBar.tsx (product identity + savings + share + save + CTA)
 *   - Mobile: MobilePDP.tsx inline sticky bar (price + EMI + CTA)
 *
 * Guard behaviors preserved (G4):
 *   - isGated: disables CTA for team members without lead
 *   - serviceability: disables CTA when area not serviceable
 *   - showOClubPrompt: shows O'Club join prompt (desktop)
 *   - coinPricing: shows savings with coin discount
 */

import React from 'react';
import Image from 'next/image';
import { Share2, Heart, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { coinsNeededForPrice } from '@/lib/oclub/coin';

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
}

const ActionIcon = ({ icon: Icon, onClick, colorClass }: { icon: any; onClick: () => void; colorClass: string }) => (
    <button
        onClick={onClick}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${colorClass} hover:bg-slate-100`}
    >
        <Icon size={16} />
    </button>
);

interface PriceSummaryProps {
    displayOnRoad: number;
    totalOnRoad: number;
    totalSavings: number;
    coinPricing: any;
    bCoinEquivalent: number;
    footerEmi: number;
    emiTenure: number;
    showOClubPrompt: boolean;
}

function DesktopPriceSummary({
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    coinPricing,
    bCoinEquivalent,
    footerEmi,
    emiTenure,
    showOClubPrompt,
}: PriceSummaryProps) {
    const hasSavings = totalSavings > 0 || (coinPricing && coinPricing.discount > 0);

    return (
        <div className="hidden md:flex items-center gap-4 lg:gap-5">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">On-Road</span>
                {hasSavings && (
                    <span className="text-[10px] text-slate-400 line-through font-mono">
                        ₹ {(totalOnRoad + totalSavings).toLocaleString()}
                    </span>
                )}
                <span className="text-lg font-black text-slate-800 font-mono tabular-nums leading-none tracking-tight">
                    ₹ {displayOnRoad.toLocaleString()}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-lg font-black text-slate-800 font-mono tabular-nums leading-none tracking-tight">
                    <Logo variant="icon" size={11} customColor="#334155" />
                    {bCoinEquivalent.toLocaleString()}
                </span>
            </div>

            {hasSavings && (
                <>
                    <div className="w-px h-6 bg-slate-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-600">
                        ✦ O&apos; Circle Privileged Saving: ₹{' '}
                        {(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}
                    </span>
                </>
            )}

            {!coinPricing && showOClubPrompt && (
                <>
                    <div className="w-px h-6 bg-slate-200" />
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[9px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
                        +13 O&apos; Circle Coins
                    </span>
                </>
            )}

            <div className="w-px h-6 bg-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700 font-mono tabular-nums">
                EMI ₹ {footerEmi.toLocaleString()} / {emiTenure}mo
            </span>
        </div>
    );
}

function MobilePriceSummary({
    displayOnRoad,
    totalOnRoad,
    totalSavings,
    coinPricing,
    bCoinEquivalent,
    footerEmi,
    emiTenure,
}: PriceSummaryProps) {
    const hasSavings = totalSavings > 0 || (coinPricing && coinPricing.discount > 0);

    return (
        <div className="flex md:hidden flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">On-Road</span>
            <div className="flex items-center gap-2.5">
                <span className="text-lg font-black text-slate-800 font-mono tabular-nums leading-none tracking-tight">
                    ₹ {displayOnRoad.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-lg font-black text-slate-800 font-mono tabular-nums leading-none tracking-tight">
                    <Logo variant="icon" size={12} customColor="#334155" />
                    {bCoinEquivalent.toLocaleString('en-IN')}
                </span>
            </div>
        </div>
    );
}

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
    handleBookingRequest,
    serviceability,
    isGated,
}: PdpCommandBarProps) {
    const isDesktop = layout === 'desktop';
    const isDisabled = isGated || (serviceability?.status === 'SET' && !serviceability?.isServiceable);
    const bCoinEquivalent = coinsNeededForPrice(displayOnRoad);

    return (
        <div
            data-parity-section="command-bar"
            className="fixed inset-x-0 bottom-0 z-[95]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className={`page-container ${isDesktop ? 'mb-2 md:mb-4' : 'mb-0'}`}>
                <div
                    className={`relative overflow-hidden border shadow-[0_10px_34px_rgba(15,23,42,0.12)] ${
                        isDesktop
                            ? 'rounded-2xl md:rounded-full border-white/80 bg-white/58 backdrop-blur-3xl'
                            : 'rounded-t-2xl border-slate-200 bg-white/95 backdrop-blur-xl'
                    }`}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_65%)]" />
                    <div
                        className={`relative z-10 flex items-center justify-between ${
                            isDesktop ? 'p-3 md:px-8 md:py-3 gap-3 md:gap-6' : 'px-4 py-3 gap-3'
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
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 ml-2" />
                                </div>
                            )}

                            {/* Price Summary */}
                            {isDesktop ? (
                                <DesktopPriceSummary
                                    displayOnRoad={displayOnRoad}
                                    totalOnRoad={totalOnRoad}
                                    totalSavings={totalSavings}
                                    coinPricing={coinPricing}
                                    bCoinEquivalent={bCoinEquivalent}
                                    footerEmi={footerEmi}
                                    emiTenure={emiTenure}
                                    showOClubPrompt={showOClubPrompt}
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
                                />
                            )}
                        </div>

                        {/* Right: Actions + CTA */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Share/Save icons — Desktop only */}
                            {isDesktop && (
                                <div className="hidden md:flex items-center gap-1">
                                    <ActionIcon
                                        icon={Share2}
                                        onClick={handleShareQuote}
                                        colorClass="text-slate-500 hover:text-slate-900"
                                    />
                                    <ActionIcon
                                        icon={Heart}
                                        onClick={handleSaveQuote}
                                        colorClass="text-slate-400 hover:text-rose-500"
                                    />
                                </div>
                            )}

                            {/* CTA Button — both layouts */}
                            <button
                                onClick={handleBookingRequest}
                                disabled={isDisabled}
                                className={`h-11 px-5 md:px-6 font-black text-[11px] uppercase tracking-[0.12em] rounded-full shadow-xl flex items-center gap-2 transition-all group
                                    ${
                                        isDisabled
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 hover:-translate-y-0.5'
                                    }`}
                            >
                                {isGated ? 'OPEN LEAD' : 'GET QUOTE'}
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
