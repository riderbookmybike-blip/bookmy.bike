'use client';

import React from 'react';
import { useBreakpoint, type DeviceBreakpoint } from '@/hooks/useBreakpoint';
import { DesktopHome } from '@/components/store/DesktopHome';
import { M2Home } from '@/components/store/mobile/M2Home';

interface StoreHomeClientProps {
    initialDevice: DeviceBreakpoint;
}

export default function StoreHomeClient({ initialDevice }: StoreHomeClientProps) {
    const { device, hydrated } = useBreakpoint(initialDevice);
    const isPhone = device === 'phone';

    // During SSR and initial render, use the server-detected device.
    // After hydration, useBreakpoint reads the actual viewport width,
    // so Chrome DevTools emulation and responsive testing work correctly.
    return <M2Home heroImage="/images/hero_d8.jpg" />;
}
