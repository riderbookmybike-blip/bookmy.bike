'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/components/store/desktop/ProductCard';
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
            className="relative w-full flex items-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="w-full">
                {/* Current Variant Display */}
                <ProductCard
                    v={currentVariant}
                    viewMode="grid"
                    downpayment={0} // Default for mobile if not available
                    tenure={36}     // Default for mobile
                    basePath="/phone/store"
                />

                {/* Swipe Arrows (subtle hint) - Adjusted for card view */}
                {variants.length > 1 && (
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                        {variants.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeVariantIdx ? 'bg-white w-4' : 'bg-white/20'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
