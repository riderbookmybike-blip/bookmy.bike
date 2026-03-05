'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DesktopCompare = dynamic(() => import('@/components/store/desktop/DesktopCompare'), {
    loading: () => (
        <div className="p-8 space-y-6 animate-pulse">
            <div className="h-14 bg-slate-100 rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-80 bg-slate-100 rounded-3xl" />
                ))}
            </div>
        </div>
    ),
});

const MobileCompare = dynamic(
    () => import('@/components/store/mobile/MobileCompare').then(m => ({ default: m.MobileCompare })),
    {
        loading: () => (
            <div className="p-4 space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
                    ))}
                </div>
            </div>
        ),
    }
);

export function SystemCompareRouter() {
    return (
        <>
            {/* Mobile */}
            <div className="lg:hidden">
                <MobileCompare />
            </div>
            {/* Desktop */}
            <div className="hidden lg:block">
                <DesktopCompare />
            </div>
        </>
    );
}
