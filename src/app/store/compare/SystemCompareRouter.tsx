'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useBreakpoint } from '@/hooks/useBreakpoint';

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

const MobileCompare = dynamic(() => import('@/components/store/mobile/MobileCompare').then(m => m.MobileCompare), {
    loading: () => (
        <div className="p-4 space-y-4 animate-pulse">
            <div className="h-12 bg-slate-100 rounded-xl" />
            {[1, 2].map(i => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl" />
            ))}
        </div>
    ),
});

export function SystemCompareRouter({
    initialDevice = 'desktop',
}: { initialDevice?: 'phone' | 'desktop' | 'tv' } = {}) {
    const { device } = useBreakpoint(initialDevice);
    const isPhone = device === 'phone';

    if (isPhone) {
        return <MobileCompare />;
    }

    return <DesktopCompare />;
}
