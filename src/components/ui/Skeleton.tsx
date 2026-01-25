/**
 * Loading Skeleton Components
 * Reusable skeleton loaders for consistent loading states
 */

import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-slate-800/50 rounded ${className}`} />
    );
}

/**
 * Member List Skeleton
 */
export function MemberListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="flex items-start gap-3">
                        {/* Avatar skeleton */}
                        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-28" />
                        </div>

                        {/* Status badge */}
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Member Profile Skeleton
 */
export function MemberProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
                <div className="space-y-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-8 w-64" />
                    <div className="flex gap-3">
                        <Skeleton className="h-6 w-24 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Content cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Card Content Skeleton
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
        </div>
    );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/**
 * Usage Examples:
 * 
 * {loading ? (
 *   <MemberListSkeleton count={5} />
 * ) : (
 *   <MemberList members={members} />
 * )}
 * 
 * {loading ? (
 *   <MemberProfileSkeleton />
 * ) : (
 *   <MemberProfile profile={profile} />
 * )}
 */
