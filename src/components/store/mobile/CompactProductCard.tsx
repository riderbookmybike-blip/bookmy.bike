'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Star, StarHalf } from 'lucide-react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import type { ProductVariant } from '@/types/productMaster';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';

const EMI_FACTORS: Record<number, number> = { 12: 0.091, 24: 0.049, 36: 0.035, 48: 0.028, 60: 0.024 };

interface CompactProductCardProps {
    v: ProductVariant;
    downpayment: number;
    tenure: number;
    basePath?: string;
    leadId?: string;
}

export function CompactProductCard({ v, downpayment, tenure, basePath = '/store', leadId }: CompactProductCardProps) {
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

    // Swatches (max 4 visible)
    const swatches = (v.availableColors || []).slice(0, 4);
    const extraCount = (v.availableColors || []).length - 4;

    const handleColorTap = (color: (typeof swatches)[0]) => {
        setSelectedHex(color.hexCode || null);
        if (color.imageUrl) setSelectedImage(color.imageUrl);
    };

    const href = buildProductUrl({
        make: v.make,
        model: v.model,
        variant: v.variant,
        leadId,
        basePath,
    }).url;

    return (
        <div className="group relative flex flex-col bg-[#0f1115] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.98]">
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
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-all"
            >
                <Heart
                    size={14}
                    className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-white/80'}
                    strokeWidth={isSaved ? 2.5 : 1.5}
                />
            </button>

            {/* Vehicle Image */}
            <Link href={href} className="block relative aspect-[4/3] bg-white/[0.02] overflow-hidden">
                {selectedImage ? (
                    <img
                        src={selectedImage}
                        alt={`${v.make} ${v.model}`}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-black uppercase tracking-widest">
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
                    <h3 className="text-[13px] font-black text-white leading-tight mt-0.5 line-clamp-1">{v.model}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 leading-tight line-clamp-1">{v.variant}</p>
                </div>

                {/* Price */}
                <div className="mt-auto flex justify-between items-end">
                    <div>
                        <p className="text-[16px] font-black text-white leading-none">
                            ₹{displayPrice.toLocaleString('en-IN')}
                        </p>
                        {emiValue > 0 && (
                            <p className="text-[10px] font-bold text-[#F4B000] mt-0.5">
                                ₹{emiValue.toLocaleString('en-IN')}/mo
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                        <Logo variant="icon" size={10} />
                        <span className="text-[10px] font-black text-[#F4B000] italic leading-none">
                            {bcoinTotal.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Color Swatches (outside the link to prevent navigation on tap) */}
            {swatches.length > 1 && (
                <div className="flex items-center gap-1.5 px-3 pb-3">
                    {swatches.map((color, i) => (
                        <button
                            key={`${color.hexCode || i}`}
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleColorTap(color);
                            }}
                            className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                                selectedHex === color.hexCode
                                    ? 'border-[#FFD700] scale-110 shadow-[0_0_6px_rgba(255,215,0,0.5)]'
                                    : 'border-white/15'
                            }`}
                            style={{ backgroundColor: color.hexCode || '#999' }}
                            title={color.name}
                        >
                            {color.finish === 'MATTE' && (
                                <span className="text-[8px] font-black mix-blend-difference text-white/50">M</span>
                            )}
                            {color.finish === 'GLOSS' && (
                                <span className="text-[8px] font-black mix-blend-difference text-white/50">G</span>
                            )}
                        </button>
                    ))}
                    {extraCount > 0 && (
                        <span className="text-[9px] font-bold text-slate-500 ml-0.5">+{extraCount}</span>
                    )}
                </div>
            )}
        </div>
    );
}
