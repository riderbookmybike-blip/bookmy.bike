'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { DesktopHome } from '@/components/store/DesktopHome';
import { MobileHome } from '@/components/store/mobile/MobileHome';

export default function StorePage() {
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

    return isPhone ? <MobileHome /> : <DesktopHome />;
}
