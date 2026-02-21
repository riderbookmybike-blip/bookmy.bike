'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import DesktopCompare from '@/components/store/desktop/DesktopCompare';
import { MobileCompare } from '@/components/store/mobile/MobileCompare';

export function SystemCompareRouter({ initialDevice = 'desktop' }: { initialDevice?: 'phone' | 'desktop' } = {}) {
    const { device } = useBreakpoint(initialDevice);
    const isPhone = device === 'phone';

    if (isPhone) {
        return <MobileCompare />;
    }

    return <DesktopCompare />;
}
