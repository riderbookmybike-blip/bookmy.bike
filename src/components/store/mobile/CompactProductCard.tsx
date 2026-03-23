'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Pencil, CircleHelp, ArrowRight, Zap, Palette, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { buildProductUrl, buildVariantExplorerUrl } from '@/lib/utils/urlHelper';
import type { ProductVariant } from '@/types/productMaster';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { coinsNeededForPrice, computeOClubPricing, discountForCoins } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import Image from 'next/image';
import { appendImageVersion, supabaseResized } from '@/lib/utils/imageResize';
import { getEmiFactor } from '@/lib/constants/pricingConstants';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import { slugify } from '@/utils/slugs';
import { useDiscovery } from '@/contexts/DiscoveryContext';

interface CompactProductCardProps {
    v: ProductVariant;
    downpayment: number;
    tenure: number;
    basePath?: string;
    leadId?: string;
    onEditDownpayment?: () => void;
    walletCoins?: number | null;
    showOClubPrompt?: boolean;
    onExplodeColors?: () => void;
    isExploded?: boolean;
    bestOffer?: {
        delivery_tat_days?: number | null;
        studio_id?: string | null;
    } | null;
    offerMode?: 'BEST_OFFER' | 'FAST_DELIVERY';
    variantCount?: number;
    /** Pass true for the first above-the-fold card to trigger eager/high-priority loading. */
    priority?: boolean;
}

export function CompactProductCard({
    v,
    downpayment,
    tenure,
    basePath = '/store',
    leadId,
    onEditDownpayment,
    walletCoins,
    showOClubPrompt,
    onExplodeColors,
    isExploded = false,
    bestOffer,
    offerMode: propOfferMode,
    variantCount = 1,
    priority = false,
}: CompactProductCardProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { trackEvent } = useAnalytics();
    const { offerMode: globalOfferMode, setPricingMode, pricingMode } = useDiscovery();
    const effectiveOfferMode = propOfferMode || globalOfferMode;
    const isSaved = isFavorite(v.id);
    const [selectedHex, setSelectedHex] = useState<string | null>(() => {
        const match = v.availableColors?.find(c => c.imageUrl === v.imageUrl) || v.availableColors?.[0];
        return match?.hexCode || null;
    });
    const [selectedSkuId, setSelectedSkuId] = useState<string | null>(() => {
        const match = v.availableColors?.find(c => c.imageUrl === v.imageUrl) || v.availableColors?.[0];
        return match?.id || null;
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(v.imageUrl || null);

    useEffect(() => {
        const primaryColor =
            v.availableColors?.find(c => c.imageUrl && c.imageUrl === v.imageUrl) ||
            v.availableColors?.find(c => c.imageUrl) ||
            v.availableColors?.[0];
        setSelectedImage(primaryColor?.imageUrl || v.imageUrl || null);
        setSelectedHex(primaryColor?.hexCode || null);
        setSelectedSkuId(primaryColor?.id || null);
    }, [v.id, v.imageUrl, v.availableColors]);

    // Keep mobile card pricing source aligned with desktop: active color price first.
    const activeColorPrice = v.availableColors?.find(c => c.id === selectedSkuId)?.price;
    const baseDisplayPrice =
        activeColorPrice?.onRoad || activeColorPrice?.exShowroom || v.price?.onRoad || v.price?.exShowroom || 0;

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
    const formatRoundedPrice = (value: number | null | undefined) =>
        Math.ceil(Number(value) || 0).toLocaleString('en-IN');

    // EMI — skip if loan is too small to be meaningful (auto-cash flip)
    // Rule: downpayment >= (price - 25000) → cash mode  [= loanAmount < ₹25k]
    const MIN_LOAN_AMOUNT = 25000;
    const activeTenure = tenure || 36;
    const loanAmount = Math.max(0, displayPrice - downpayment);
    const factor = getEmiFactor(activeTenure);
    const emiValue = Math.max(0, Math.round(loanAmount * factor));
    const showEmi = loanAmount >= MIN_LOAN_AMOUNT && emiValue > 0;
    const winnerTatDaysRaw =
        (bestOffer as any)?.delivery_tat_days ??
        (bestOffer as any)?.deliveryTatDays ??
        (bestOffer as any)?.tat_days ??
        null;
    const winnerTatDays = winnerTatDaysRaw !== null && winnerTatDaysRaw !== undefined ? Number(winnerTatDaysRaw) : null;
    const deliveryTatLabel = (() => {
        if (winnerTatDays !== null && Number.isFinite(winnerTatDays) && winnerTatDays >= 0) {
            if (winnerTatDays === 0) return 'Same day delivery';
            if (winnerTatDays === 1) return 'Delivery in 1 day';
            return `Delivery in ${winnerTatDays} days`;
        }
        return null; // Hide on catalog cards when TAT unknown
    })();

    const bcoinTotal = coinsNeededForPrice(baseDisplayPrice);

    // Swatches (show all visually)
    const swatches = v.availableColors || [];

    const handleColorTap = (color: (typeof swatches)[0]) => {
        setSelectedHex(color.hexCode || null);
        setSelectedSkuId(color.id || null);
        if (color.imageUrl) setSelectedImage(color.imageUrl);
    };

    const discountBasedDelta = typeof v.price?.discount === 'number' ? -Number(v.price.discount || 0) : 0;
    const offerDeltaForParity =
        typeof v.price?.offerPrice === 'number' && typeof v.price?.onRoad === 'number'
            ? Number(v.price.offerPrice) - Number(v.price.onRoad)
            : discountBasedDelta;

    const hasMultipleVariants = variantCount > 1;
    const currentMonth = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        timeZone: 'Asia/Kolkata',
    }).format(new Date());
    const offerCtaText = `Check ${currentMonth} Offers`;
    const ctaLabel = hasMultipleVariants ? 'Know More' : offerCtaText;
    const href = hasMultipleVariants
        ? buildVariantExplorerUrl(v.make || '', v.model || '')
        : buildProductUrl({
              make: v.make,
              model: v.model,
              variant: v.variant,
              studio: bestOffer?.studio_id || v.studioCode || undefined,
              leadId,
              basePath,
          }).url;
    const trackCatalogClick = () => {
        trackEvent('INTENT_SIGNAL', 'catalog_vehicle_click', {
            lead_id: leadId || undefined,
            sku_id: v.availableColors?.[0]?.id || undefined,
            make_slug: slugify(v.make || ''),
            model_slug: slugify(v.model || ''),
            variant_slug: slugify(v.variant || ''),
            source: 'STORE_CATALOG',
        });
    };

    const handleFlip = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const nextMode = pricingMode === 'cash' ? 'finance' : 'cash';
        setPricingMode(nextMode);
    };

    return (
        <div
            data-testid="catalog-compact-card"
            data-product-id={v.id}
            data-dealer-id={v.dealerId || ''}
            data-offer-delta={offerDeltaForParity}
            data-on-road={baseDisplayPrice || 0}
            data-ex-showroom={v.price?.exShowroom || 0}
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
                    trackEvent('INTENT_SIGNAL', 'wishlist_toggle', {
                        lead_id: leadId || undefined,
                        sku_id: v.availableColors?.[0]?.id || undefined,
                        make_slug: slugify(v.make || ''),
                        model_slug: slugify(v.model || ''),
                        variant_slug: slugify(v.variant || ''),
                        action: isSaved ? 'removed' : 'added',
                        source: 'STORE_CATALOG',
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
            {/* Explode Colours Button */}
            {onExplodeColors && (v.availableColors?.length || 0) > 1 && (
                <button
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        onExplodeColors();
                    }}
                    title={isExploded ? 'Collapse colours' : 'Explode colours'}
                    className={`absolute top-2 right-11 z-10 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all border ${
                        isExploded
                            ? 'bg-[#F4B000] border-[#F4B000] text-black'
                            : 'bg-white border-slate-100 text-slate-400 hover:text-[#F4B000]'
                    }`}
                >
                    <Palette size={13} />
                </button>
            )}

            {/* Vehicle Image */}
            <Link
                href={href}
                onClick={trackCatalogClick}
                className="block relative aspect-[4/3] bg-slate-50 overflow-hidden"
            >
                {selectedImage ? (
                    <Image
                        src={(() => {
                            const raw = selectedImage || '/images/categories/scooter_nobg.png';
                            const resized = supabaseResized(raw, priority ? 640 : 400) ?? raw;
                            return appendImageVersion(resized, v.mediaVersion) ?? resized;
                        })()}
                        alt={`${v.make} ${v.model}`}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
                        priority={priority}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 text-[10px] font-black uppercase tracking-widest">
                        No Image
                    </div>
                )}
            </Link>

            {/* Content Wrap */}
            <div className="flex flex-col flex-1">
                {/* Make & Model Wrapper */}
                <Link href={href} onClick={trackCatalogClick} className="block p-3 pt-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                        {v.make}
                    </p>
                    <h3 className="text-[13px] font-black text-slate-900 leading-tight mt-0.5 line-clamp-1">
                        {v.model}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 leading-tight line-clamp-1">{v.variant}</p>
                </Link>

                {/* Modern Pricing & EMI Stack */}
                <div className="mt-auto flex flex-col gap-3 p-3 pt-0">
                    {/* On-Road Price */}
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] italic">
                                On-Road
                            </p>
                            <CircleHelp size={10} className="text-slate-500" />
                        </div>
                        <div className="flex items-center gap-2" onClick={handleFlip}>
                            <p className="text-[18px] font-black text-slate-900 leading-none cursor-pointer hover:scale-105 active:scale-95 transition-all">
                                ₹{formatRoundedPrice(baseDisplayPrice)}
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

                    {/* Lowest EMI Block — hidden if loan < ₹15k (auto cash-flip) */}
                    {showEmi && (
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
                            <div className="flex items-baseline mb-1" onClick={handleFlip}>
                                <span className="text-[18px] font-black text-emerald-500 italic leading-none cursor-pointer hover:scale-105 active:scale-95 transition-all">
                                    ₹{formatRoundedPrice(emiValue)}
                                </span>
                                <span className="text-slate-200 text-sm font-light select-none mx-1">/</span>
                                <span className="text-[12px] font-bold text-emerald-500/80 italic leading-none">
                                    {activeTenure} mo
                                </span>
                            </div>
                            <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 w-fit">
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none">
                                    Downpayment ₹{formatRoundedPrice(downpayment || 0)}
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
            </div>

            {/* Delivery TAT Line — only shown when TAT data is available */}
            {deliveryTatLabel && (
                <div className="mx-3 mb-2 flex items-center justify-center gap-1">
                    <Clock size={8} className="text-slate-400" />
                    <span
                        className={`text-[7px] uppercase tracking-wider italic ${effectiveOfferMode === 'FAST_DELIVERY' ? 'font-black text-slate-600' : 'font-bold text-slate-400'}`}
                    >
                        {deliveryTatLabel}
                    </span>
                </div>
            )}

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
                            style={{
                                background: (color as any).secondaryHexCode
                                    ? `linear-gradient(135deg, ${color.hexCode} 50%, ${(color as any).secondaryHexCode} 50%)`
                                    : color.hexCode,
                            }}
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

            <div className="px-3 pb-3">
                <Link
                    href={href}
                    onClick={trackCatalogClick}
                    className="group/cta relative overflow-hidden w-full h-10 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-[0.16em] text-[10px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(244,176,0,0.26)] hover:shadow-[0_6px_20px_rgba(244,176,0,0.36)] transition-all"
                >
                    <span className="relative z-10">{ctaLabel}</span>
                    <ChevronRight
                        size={12}
                        className="relative z-10 opacity-0 group-hover/cta:opacity-100 -translate-x-1 group-hover/cta:translate-x-0 transition-all"
                    />
                </Link>
            </div>
        </div>
    );
}
