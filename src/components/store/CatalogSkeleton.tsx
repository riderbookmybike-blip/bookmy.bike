'use client';

import React from 'react';

interface SkeletonCardProps {
    viewMode?: 'grid' | 'list';
}

export const ProductCardSkeleton = ({ viewMode = 'grid' }: SkeletonCardProps) => {
    if (viewMode === 'list') {
        return (
            <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 animate-pulse">
                {/* Image Skeleton */}
                <div className="w-32 h-24 bg-slate-200 rounded-xl shrink-0" />

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-24" />
                    <div className="h-5 bg-slate-200 rounded w-40" />
                    <div className="flex gap-4">
                        <div className="h-4 bg-slate-200 rounded w-20" />
                        <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                </div>

                {/* Price */}
                <div className="text-right space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-24 ml-auto" />
                    <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
                </div>
            </div>
        );
    }

    // Grid view skeleton
    return (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
            {/* Image Area */}
            <div className="relative aspect-[4/3] bg-slate-200">
                {/* Brand logo skeleton */}
                <div className="absolute top-3 left-3 w-12 h-6 bg-slate-300 rounded" />
                {/* Heart icon skeleton */}
                <div className="absolute top-3 right-3 w-8 h-8 bg-slate-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Model name */}
                <div className="h-5 bg-slate-200 rounded w-3/4" />

                {/* Specs row */}
                <div className="flex gap-3">
                    <div className="h-6 bg-slate-200 rounded-full w-16" />
                    <div className="h-6 bg-slate-200 rounded-full w-20" />
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-20 mb-2" />
                    <div className="h-7 bg-slate-200 rounded w-28" />
                </div>

                {/* Color swatches */}
                <div className="flex gap-2 pt-2">
                    <div className="w-5 h-5 bg-slate-200 rounded-full" />
                    <div className="w-5 h-5 bg-slate-200 rounded-full" />
                    <div className="w-5 h-5 bg-slate-200 rounded-full" />
                    <div className="w-5 h-5 bg-slate-200 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export const CatalogGridSkeleton = ({ count = 6 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} viewMode="grid" />
            ))}
        </div>
    );
};

export const MobileCardSkeleton = () => {
    return (
        <div className="w-full bg-slate-900 rounded-3xl overflow-hidden animate-pulse">
            {/* Image Area */}
            <div className="relative aspect-[4/3] bg-slate-800">
                {/* Brand skeleton */}
                <div className="absolute top-4 left-4 w-16 h-8 bg-slate-700 rounded" />
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Model name */}
                <div className="h-6 bg-slate-800 rounded w-2/3" />

                {/* Specs */}
                <div className="flex gap-3">
                    <div className="h-7 bg-slate-800 rounded-full w-20" />
                    <div className="h-7 bg-slate-800 rounded-full w-24" />
                </div>

                {/* Price */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <div>
                        <div className="h-4 bg-slate-800 rounded w-16 mb-2" />
                        <div className="h-8 bg-slate-800 rounded w-28" />
                    </div>
                    <div className="h-10 w-32 bg-indigo-600/30 rounded-xl" />
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
