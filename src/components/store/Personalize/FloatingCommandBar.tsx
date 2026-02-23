/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { Share2, Heart, ArrowRight } from 'lucide-react';

export interface FloatingCommandBarProps {
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
    forceMobileLayout: boolean;
    handleShareQuote: () => void;
    handleSaveQuote: () => void;
    handleBookingRequest: () => void;
    serviceability: any;
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

export default function FloatingCommandBar({
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
    forceMobileLayout,
    handleShareQuote,
    handleSaveQuote,
    handleBookingRequest,
    serviceability,
    isGated,
}: FloatingCommandBarProps) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-[95]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="page-container mb-2 md:mb-4">
                <div className="relative overflow-hidden rounded-2xl md:rounded-full border border-white/80 bg-white/58 backdrop-blur-3xl shadow-[0_10px_34px_rgba(15,23,42,0.12)]">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_65%)]" />
                    <div className="relative z-10 p-3 md:px-8 md:py-3 flex items-center justify-between gap-3 md:gap-6">
                        {/* Left: Product Identity (Desktop) + Price */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            {/* Product Thumbnail — Desktop only */}
                            <div
                                className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-3 min-w-0`}
                            >
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

                            {/* Price Summary */}
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest text-slate-500 ${forceMobileLayout ? '' : 'md:hidden'}`}
                                    >
                                        On-Road
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline'} text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500`}
                                        >
                                            On-Road
                                        </span>
                                        {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                            <span className="text-[10px] text-slate-400 line-through font-mono">
                                                ₹{(totalOnRoad + totalSavings).toLocaleString()}
                                            </span>
                                        )}
                                        <span className="text-lg font-black text-[#C99700] font-mono">
                                            ₹{displayOnRoad.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)) && (
                                    <>
                                        <div
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-6 bg-slate-200`}
                                        />
                                        <span
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline'} text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-600`}
                                        >
                                            ✦ O&apos; Circle Privileged Saving: ₹
                                            {(totalSavings + (coinPricing?.discount || 0)).toLocaleString()}
                                        </span>
                                    </>
                                )}

                                {!coinPricing && showOClubPrompt && (
                                    <>
                                        <div
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-6 bg-slate-200`}
                                        />
                                        <span
                                            className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline-flex'} items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[9px] font-semibold uppercase tracking-[0.1em] text-indigo-600`}
                                        >
                                            +13 O&apos; Circle Coins
                                        </span>
                                    </>
                                )}

                                {/* EMI & Tenure */}
                                <div
                                    className={`${forceMobileLayout ? 'hidden' : 'hidden md:block'} w-px h-6 bg-slate-200`}
                                />
                                <span
                                    className={`${forceMobileLayout ? 'hidden' : 'hidden md:inline'} text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700 font-mono tabular-nums`}
                                >
                                    EMI ₹{footerEmi.toLocaleString()} / {emiTenure}mo
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions (Desktop) + CTA */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Action Icons — Desktop only */}
                            <div className={`${forceMobileLayout ? 'hidden' : 'hidden md:flex'} items-center gap-1`}>
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
                            <button
                                onClick={handleBookingRequest}
                                disabled={
                                    isGated || (serviceability?.status === 'SET' && !serviceability?.isServiceable)
                                }
                                className={`h-11 px-5 md:px-6 font-black text-[11px] uppercase tracking-[0.12em] rounded-full shadow-xl flex items-center gap-2 transition-all group
                            ${
                                isGated || (serviceability?.status === 'SET' && !serviceability?.isServiceable)
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 hover:-translate-y-0.5'
                            }
                        `}
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
