'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Pencil, CircleHelp } from 'lucide-react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import type { ProductVariant } from '@/types/productMaster';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
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
}

export function CompactProductCard({
    v,
    downpayment,
    tenure,
    basePath = '/store',
    leadId,
    onEditDownpayment,
    fallbackDealerId,
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

    // Price
    const displayPrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;

    // EMI
    const activeTenure = tenure || 36;
    const loanAmount = Math.max(0, displayPrice - downpayment);
    const factor = EMI_FACTORS[activeTenure] ?? EMI_FACTORS[36];
    const emiValue = Math.max(0, Math.round(loanAmount * factor));
    const bcoinTotal = coinsNeededForPrice(displayPrice);

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
            className="group relative flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-slate-200"
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
                    {/* Offer Price / Starting From */}
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] italic">
                                On-Road
                            </p>
                            <CircleHelp size={10} className="text-slate-500" />
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-[18px] font-black text-slate-900 leading-none">
                                ₹{displayPrice.toLocaleString('en-IN')}
                            </p>
                            <div className="flex items-center gap-1 bg-[#F4B000]/10 px-1.5 py-0.5 rounded border border-[#F4B000]/20">
                                <Logo variant="icon" size={8} />
                                <span className="text-[9px] font-black text-[#F4B000] italic leading-none">
                                    {bcoinTotal.toLocaleString('en-IN')}
                                </span>
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
                            key={`${color.hexCode || i}`}
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
