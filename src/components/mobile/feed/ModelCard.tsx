'use client';

import React, { useState } from 'react';
import { FullPageDeal } from './FullPageDeal';
import { ProductVariant } from '@/types/productMaster';

interface ModelCardProps {
    variants: ProductVariant[];
    isActive: boolean;
}

export const ModelCard = ({ variants, isActive }: ModelCardProps) => {
    const [activeVariantIdx, setActiveVariantIdx] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        // Left swipe = next variant
        if (isLeftSwipe && activeVariantIdx < variants.length - 1) {
            setActiveVariantIdx(prev => prev + 1);
        }
        // Right swipe = previous variant
        if (isRightSwipe && activeVariantIdx > 0) {
            setActiveVariantIdx(prev => prev - 1);
        }
    };

    const currentVariant = variants[activeVariantIdx];

    return (
        <div
            className="relative w-full h-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Variant Indicator */}
            {variants.length > 1 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-lg px-4 py-2 rounded-full">
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                        {currentVariant.variant}
                    </span>
                    <span className="text-[8px] text-zinc-400">
                        {activeVariantIdx + 1}/{variants.length}
                    </span>
                </div>
            )}

            {/* Current Variant Display */}
            <FullPageDeal
                product={currentVariant}
                isActive={isActive}
            />

            {/* Swipe Arrows (subtle hint) */}
            {variants.length > 1 && (
                <>
                    {activeVariantIdx > 0 && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 opacity-30 pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                <span className="text-white text-xl">‹</span>
                            </div>
                        </div>
                    )}
                    {activeVariantIdx < variants.length - 1 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 opacity-30 pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                <span className="text-white text-xl">›</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
