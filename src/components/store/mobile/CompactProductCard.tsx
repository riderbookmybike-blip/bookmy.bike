'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Star, StarHalf } from 'lucide-react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import type { ProductVariant } from '@/types/productMaster';
import { useFavorites } from '@/lib/favorites/favoritesContext';

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
        <div className="group relative flex flex-col bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/8 rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.98]">
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
            <Link href={href} className="block relative aspect-[4/3] bg-slate-100 dark:bg-white/[0.02] overflow-hidden">
                {selectedImage ? (
                    <img
                        src={selectedImage}
                        alt={`${v.make} ${v.model}`}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700 text-[10px] font-black uppercase tracking-widest">
                        No Image
                    </div>
                )}
            </Link>

            {/* Content */}
            <Link href={href} className="flex flex-col gap-1.5 p-3 pt-2">
                {/* Make & Model */}
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                        {v.make}
                    </p>
                    <h3 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight mt-0.5 line-clamp-1">
                        {v.model}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
                        {v.variant}
                    </p>
                </div>

                {/* Price */}
                <div className="mt-auto">
                    <p className="text-[16px] font-black text-slate-900 dark:text-white leading-none">
                        ₹{displayPrice.toLocaleString('en-IN')}
                    </p>
                    {emiValue > 0 && (
                        <p className="text-[10px] font-bold text-[#F4B000] mt-0.5">
                            ₹{emiValue.toLocaleString('en-IN')}/mo
                        </p>
                    )}
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
                            className={`w-5 h-5 rounded-full border-2 transition-all ${
                                selectedHex === color.hexCode
                                    ? 'border-[#FFD700] scale-110 shadow-[0_0_6px_#FFD700]'
                                    : 'border-slate-200 dark:border-white/15'
                            }`}
                            style={{ backgroundColor: color.hexCode || '#999' }}
                            title={color.name}
                        />
                    ))}
                    {extraCount > 0 && (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-0.5">
                            +{extraCount}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
