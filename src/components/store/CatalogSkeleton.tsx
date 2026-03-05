'use client';

import React from 'react';

interface SkeletonCardProps {
    viewMode?: 'grid' | 'list';
}

/**
 * ProductCardSkeleton - Matches the high-fidelity ProductCard.tsx (Grid View)
 * ensuring zero layout shift when the real card hydrates.
 */
export const ProductCardSkeleton = ({ viewMode = 'grid' }: SkeletonCardProps) => {
    if (viewMode === 'list') {
        return (
            <div className="flex gap-6 p-6 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse shadow-sm">
                {/* Image Section Skeleton - Matches 38% width */}
                <div className="w-[38%] aspect-[4/3] bg-slate-100 rounded-3xl shrink-0" />

                {/* Content Section */}
                <div className="flex-1 space-y-4 py-2">
                    <div className="space-y-2">
                        <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
                        <div className="h-4 bg-slate-200 rounded-md w-1/4 opacity-60" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                        <div className="h-4 bg-slate-200 rounded w-20" />
                        <div className="h-4 bg-slate-200 rounded w-20" />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <div className="space-y-2">
                            <div className="h-8 bg-slate-200 rounded-xl w-32" />
                            <div className="h-4 bg-slate-200 rounded-md w-24 opacity-60" />
                        </div>
                        <div className="h-12 bg-slate-200 rounded-2xl w-36" />
                    </div>
                </div>
            </div>
        );
    }

    // Grid View Skeleton - Matches ProductCard.tsx (Desktop Grid)
    return (
        <div className="group bg-white border border-black/[0.04] rounded-[2rem] overflow-hidden flex flex-col shadow-sm animate-pulse min-h-[580px] md:min-h-[660px]">
            {/* Image Area - Matches h-[340px] md:h-[344px] lg:h-[384px] */}
            <div className="relative h-[340px] md:h-[344px] lg:h-[384px] bg-slate-50 border-b border-black/[0.04]">
                {/* Brand watermark placeholder */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-slate-200 rounded-xl opacity-40 shrink-0" />
                {/* Action buttons skeleton */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                </div>
            </div>

            {/* Content Area - Matches p-3 md:p-6 */}
            <div className="p-3 md:p-6 flex-1 flex flex-col justify-between bg-[#FAFAFA]">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        {/* Model name */}
                        <div className="h-6 bg-slate-300 rounded-lg w-1/2" />
                        {/* Swatches placeholder */}
                        <div className="flex gap-1.5 pt-1">
                            <div className="w-4 h-4 bg-slate-200 rounded-full" />
                            <div className="w-4 h-4 bg-slate-200 rounded-full" />
                            <div className="w-4 h-4 bg-slate-200 rounded-full" />
                        </div>
                    </div>
                    {/* Variant name */}
                    <div className="h-4 bg-slate-200 rounded-md w-1/3 opacity-70" />

                    {/* Suitable For tags */}
                    <div className="flex gap-2 mt-2">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                        <div className="h-4 bg-slate-100 rounded w-16" />
                    </div>
                </div>

                {/* Pricing Flip Card Placeholder */}
                <div className="mt-4 md:mt-6 pt-4 border-t border-slate-100">
                    <div className="w-full h-[76px] md:h-[88px] bg-slate-200/60 rounded-2xl flex items-center px-4 gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="h-2 bg-slate-300 rounded w-16" />
                            <div className="h-5 bg-slate-300 rounded-lg w-24" />
                        </div>
                        <div className="w-px h-8 bg-slate-300/40" />
                        <div className="flex-1 space-y-2 items-end flex flex-col">
                            <div className="h-2 bg-slate-300 rounded w-16" />
                            <div className="h-5 bg-slate-300 rounded-lg w-24" />
                        </div>
                    </div>
                </div>

                {/* Action Button Skeleton */}
                <div className="mt-4 md:mt-6">
                    <div className="w-full h-11 bg-slate-200 rounded-xl" />
                </div>

                {/* Star rating footer skeleton */}
                <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
                    <div className="h-3 bg-slate-200 rounded w-20" />
                    <div className="h-2 bg-slate-200 rounded w-16" />
                </div>
            </div>
        </div>
    );
};

export const CatalogGridSkeleton = ({ count = 6 }: { count?: number }) => {
    return (
        <>
            {/* Mobile skeleton — compact cards matching CompactProductCard */}
            <div className="md:hidden flex flex-col gap-4 px-4 pt-2">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse flex gap-3 p-3 h-[132px]"
                    >
                        {/* Thumbnail - Matches w-28 h-24 */}
                        <div className="w-28 h-24 bg-slate-100 rounded-xl shrink-0" />
                        {/* Content */}
                        <div className="flex-1 space-y-2 py-1">
                            {/* Make/Model */}
                            <div className="h-2 bg-slate-200 rounded w-12" />
                            <div className="h-4 bg-slate-300 rounded w-32" />
                            {/* Tags/Color Swatches */}
                            <div className="flex gap-1.5 mt-2">
                                <div className="h-4 w-4 bg-slate-200 rounded-full" />
                                <div className="h-4 w-4 bg-slate-200 rounded-full" />
                                <div className="h-4 w-4 bg-slate-200 rounded-full" />
                            </div>
                            {/* Price/Button Area */}
                            <div className="h-8 bg-slate-200 rounded-xl w-full mt-2" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop skeleton — grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, i) => (
                    <ProductCardSkeleton key={i} viewMode="grid" />
                ))}
            </div>
        </>
    );
};

export const MobileCardSkeleton = () => {
    return (
        <div className="w-full bg-slate-900 rounded-[2.5rem] overflow-hidden animate-pulse">
            {/* Image Area */}
            <div className="relative aspect-[4/3] bg-slate-800">
                <div className="absolute top-4 left-4 w-16 h-8 bg-slate-700/50 rounded-lg" />
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4">
                <div className="h-6 bg-slate-800 rounded-lg w-2/3" />
                <div className="flex gap-2">
                    <div className="h-6 bg-slate-800 rounded-full w-20" />
                    <div className="h-6 bg-slate-800 rounded-full w-24" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-800 rounded w-16" />
                        <div className="h-8 bg-slate-800 rounded w-32" />
                    </div>
                    <div className="h-12 w-36 bg-slate-800 rounded-2xl" />
                </div>
            </div>
        </div>
    );
};

export const MobileFeedSkeleton = ({ count = 3 }: { count?: number }) => {
    return (
        <div className="flex flex-col gap-6 pt-[58px] px-5">
            {Array.from({ length: count }).map((_, i) => (
                <MobileCardSkeleton key={i} />
            ))}
        </div>
    );
};
