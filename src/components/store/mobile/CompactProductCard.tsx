'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Pencil, CircleHelp, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import type { ProductVariant } from '@/types/productMaster';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { coinsNeededForPrice, computeOClubPricing, discountForCoins } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import Image from 'next/image';

const EMI_FACTORS: Record<number, number> = { 12: 0.091, 24: 0.049, 36: 0.035, 48: 0.028, 60: 0.024 };

interface CompactProductCardProps {
    v: ProductVariant;
    downpayment: number;
    tenure: number;
    basePath?: string;
    leadId?: string;
    onEditDownpayment?: () => void;
    fallbackDealerId?: string | null;
    walletCoins?: number | null;
    showOClubPrompt?: boolean;
}

export function CompactProductCard({
    v,
    downpayment,
    tenure,
    basePath = '/store',
    leadId,
    onEditDownpayment,
    fallbackDealerId,
    walletCoins,
    showOClubPrompt,
}: CompactProductCardProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const isSaved = isFavorite(v.id);
    const [selectedHex, setSelectedHex] = useState<string | null>(() => {
        const match = v.availableColors?.find(c => c.imageUrl === v.imageUrl) || v.availableColors?.[0];
        return match?.hexCode || null;
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(v.imageUrl || null);

    useEffect(() => {
        const primaryColor =
            v.availableColors?.find(c => c.imageUrl && c.imageUrl === v.imageUrl) ||
            v.availableColors?.find(c => c.imageUrl) ||
            v.availableColors?.[0];
        setSelectedImage(primaryColor?.imageUrl || v.imageUrl || null);
        setSelectedHex(primaryColor?.hexCode || null);
    }, [v.id, v.imageUrl, v.availableColors]);

    // B-Coin Logic
    const baseDisplayPrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;

    // B-Coin dynamic adjustment
    const hasCoinsToUse = (walletCoins || 0) > 0;
    const isShowingEffectivePrice = showOClubPrompt || (walletCoins !== null && hasCoinsToUse);

    const coinPricing =
        walletCoins !== null && walletCoins !== undefined && hasCoinsToUse
            ? computeOClubPricing(baseDisplayPrice, Number(walletCoins))
            : (v.price as any)?.coinPricing || {
                  discount: 1000,
                  coinsUsed: 13,
              };

    const bcoinAdjustment = isShowingEffectivePrice ? coinPricing.discount || 0 : 0;
    const displayPrice = Math.max(0, baseDisplayPrice - bcoinAdjustment);

    // EMI
    const activeTenure = tenure || 36;
    const loanAmount = Math.max(0, displayPrice - downpayment);
    const factor = EMI_FACTORS[activeTenure] ?? EMI_FACTORS[36];
    const emiValue = Math.max(0, Math.round(loanAmount * factor));

    const bcoinTotal = coinsNeededForPrice(baseDisplayPrice);

    // Swatches (show all visually)
    const swatches = v.availableColors || [];

    const handleColorTap = (color: (typeof swatches)[0]) => {
        setSelectedHex(color.hexCode || null);
        if (color.imageUrl) setSelectedImage(color.imageUrl);
    };

    const normalizeDistrictForUrl = (value?: string | null) => {
        if (!value) return undefined;
        const cleaned = String(value)
            .replace(/^(Best:|Base:)\s*/i, '')
            .split(',')[0]
            .trim();
        if (!cleaned || cleaned.toUpperCase() === 'ALL') return undefined;
        return cleaned;
    };

    const navigableDistrict = normalizeDistrictForUrl(v.dealerLocation || v.price?.pricingSource);
    const offerDeltaForParity = typeof v.price?.discount === 'number' ? -Number(v.price.discount || 0) : 0;

    const href = buildProductUrl({
        make: v.make,
        model: v.model,
        variant: v.variant,
        district: navigableDistrict,
        leadId,
        basePath,
    }).url;

    return (
        <div
            data-testid="catalog-compact-card"
            data-product-id={v.id}
            data-dealer-id={v.dealerId || fallbackDealerId || ''}
            data-offer-delta={offerDeltaForParity}
            data-district={navigableDistrict || ''}
            className="group relative flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden hover:overflow-visible transition-all duration-300 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-slate-200 hover:z-[50]"
        >
            {/* Favorite Button */}
            <button
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite({
                        id: v.id,
                        model: v.model,
                        make: v.make,
                        variant: v.variant,
                        slug: v.slug,
                        imageUrl: selectedImage || v.imageUrl || undefined,
                        price: displayPrice || undefined,
                    });
                }}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all border border-slate-100"
            >
                <Heart
                    size={14}
                    className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}
                    strokeWidth={isSaved ? 2.5 : 1.5}
                />
            </button>

            {/* Vehicle Image */}
            <Link href={href} className="block relative aspect-[4/3] bg-slate-50 overflow-hidden">
                {selectedImage ? (
                    <Image
                        src={selectedImage}
                        alt={`${v.make} ${v.model}`}
                        fill
                        className="object-contain p-2"
                        sizes="320px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 text-[10px] font-black uppercase tracking-widest">
                        No Image
                    </div>
                )}
            </Link>

            {/* Content */}
            <Link href={href} className="flex flex-col gap-1.5 p-3 pt-2">
                {/* Make & Model */}
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                        {v.make}
                    </p>
                    <h3 className="text-[13px] font-black text-slate-900 leading-tight mt-0.5 line-clamp-1">
                        {v.model}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 leading-tight line-clamp-1">{v.variant}</p>
                </div>

                {/* Modern Pricing & EMI Stack */}
                <div className="mt-auto flex flex-col gap-3">
                    {/* On-Road Price */}
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] italic">
                                On-Road
                            </p>
                            <CircleHelp size={10} className="text-slate-500" />
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-[18px] font-black text-slate-900 leading-none">
                                ₹{(v.price?.onRoad || v.price?.exShowroom || 0).toLocaleString('en-IN')}
                            </p>
                            <div className="flex items-center gap-1 bg-[#F4B000]/10 px-1.5 py-0.5 rounded border border-[#F4B000]/20 relative group/bcoin">
                                <Logo variant="icon" size={8} />
                                <span className="text-[9px] font-black text-[#F4B000] italic leading-none">
                                    {bcoinTotal.toLocaleString('en-IN')}
                                </span>
                                <CircleHelp
                                    size={8}
                                    className="text-[#F4B000]/60 hover:text-[#F4B000] cursor-help transition-colors"
                                />
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 p-3 bg-white border border-slate-200 text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 invisible group-hover/bcoin:opacity-100 group-hover/bcoin:visible transition-all pointer-events-auto z-[100] shadow-2xl min-w-[200px] text-center">
                                    <div className="flex flex-col gap-2.5">
                                        {showOClubPrompt ? (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-slate-700 text-[10px] leading-tight flex flex-col items-center gap-1">
                                                        <span>You are a step away from earning</span>
                                                        <span className="text-[#F4B000] text-sm italic flex items-center gap-1">
                                                            {coinPricing.coinsUsed} <Logo variant="icon" size={10} />
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-500 text-[8px] font-medium leading-normal normal-case">
                                                        Signup now to join O&apos;Club and unlock this special member
                                                        price.
                                                    </p>
                                                </div>
                                                <span
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        window.location.href = '/store/ocircle';
                                                    }}
                                                    className="w-full py-2 bg-[#F4B000] text-black rounded-lg font-black flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    Join O&apos;Club <ArrowRight size={10} />
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-slate-700 text-[10px] leading-tight flex flex-col items-center gap-1">
                                                        <span>You have just earned</span>
                                                        <span className="text-emerald-400 text-sm italic flex items-center gap-1">
                                                            {coinPricing.coinsUsed} <Logo variant="icon" size={10} />
                                                        </span>
                                                        <span>by signup!</span>
                                                    </div>
                                                    <p className="text-slate-500 text-[8px] font-medium leading-normal normal-case">
                                                        Applied to your member specific offer price.
                                                    </p>
                                                </div>
                                                <span
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        window.location.href = '/store/ocircle';
                                                    }}
                                                    className="text-[#F4B000] hover:underline flex items-center justify-center gap-1 py-1 border-t border-slate-200 mt-1 cursor-pointer"
                                                >
                                                    O&apos;Club Benefits <ArrowRight size={10} />
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-slate-200 rotate-45" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lowest EMI Block */}
                    {emiValue > 0 && (
                        <div className="flex flex-col items-start border-t border-slate-100 pt-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <CircleHelp
                                    size={10}
                                    className="text-emerald-500 border-none outline-none focus:outline-none"
                                />
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.1em] italic">
                                    Lowest EMI
                                </p>
                            </div>
                            <div className="flex items-baseline mb-1">
                                <span className="text-[18px] font-black text-emerald-500 italic leading-none">
                                    ₹{emiValue.toLocaleString('en-IN')}
                                </span>
                                <span className="text-slate-200 text-sm font-light select-none mx-1">/</span>
                                <span className="text-[12px] font-bold text-emerald-500/80 italic leading-none">
                                    {activeTenure} mo
                                </span>
                            </div>
                            <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none">
                                    Downpayment ₹{(downpayment || 0).toLocaleString('en-IN')}
                                </span>
                                {onEditDownpayment && (
                                    <button
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onEditDownpayment();
                                        }}
                                        className="ml-1 w-4 h-4 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 transition-all border-none outline-none focus:outline-none"
                                    >
                                        <Pencil
                                            size={9}
                                            strokeWidth={2.5}
                                            className="border-none outline-none focus:outline-none"
                                        />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Color Swatches (Desktop High-Fidelity) */}
            {swatches.length > 1 && (
                <div className="flex items-center gap-3 px-3 pb-4 overflow-x-auto hide-scrollbar w-full">
                    {swatches.map((color, i) => (
                        <button
                            key={`${color.hexCode}-${i}`}
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleColorTap(color);
                            }}
                            className="w-8 h-8 shrink-0 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.05)] relative hover:scale-110 transition-all duration-300 overflow-hidden"
                            style={{ background: color.hexCode }}
                            title={`${color.name}${color.finish ? ` (${color.finish})` : ''}`}
                        >
                            {/* Visual Gloss Effect */}
                            {color.finish?.toUpperCase() === 'GLOSS' && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-white/20 pointer-events-none" />
                            )}
                            {/* Visual Matte Effect */}
                            {color.finish?.toUpperCase() === 'MATTE' && (
                                <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] pointer-events-none" />
                            )}
                            {/* Selection Ring */}
                            {selectedHex === color.hexCode && (
                                <div className="absolute inset-[-3px] rounded-full border-2 border-[#F4B000] pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
