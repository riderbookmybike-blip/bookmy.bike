'use client';

import { useState, useEffect } from 'react';

/**
 * Device breakpoint detection hook.
 * - phone:   ≤480px
 * - tablet:  481–1024px
 * - desktop: >1024px
 *
 * SSR-safe: defaults to 'desktop' on server, then hydrates on client
 * with a useEffect guard to prevent layout flash.
 */
export type DeviceBreakpoint = 'phone' | 'tablet' | 'desktop';

const PHONE_MAX = 480;
const TABLET_MAX = 1024;

function getBreakpoint(): DeviceBreakpoint {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w <= PHONE_MAX) return 'phone';
    if (w <= TABLET_MAX) return 'tablet';
    return 'desktop';
}

export function useBreakpoint(): { device: DeviceBreakpoint; hydrated: boolean } {
    // SSR-safe: always start with 'desktop' to match server render
    const [device, setDevice] = useState<DeviceBreakpoint>('desktop');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Hydrate immediately on mount
        setDevice(getBreakpoint());
        setHydrated(true);

        const onResize = () => setDevice(getBreakpoint());

        // Use matchMedia for efficient breakpoint listening
        const phoneQuery = window.matchMedia(`(max-width: ${PHONE_MAX}px)`);
        const tabletQuery = window.matchMedia(`(max-width: ${TABLET_MAX}px)`);

        phoneQuery.addEventListener('change', onResize);
        tabletQuery.addEventListener('change', onResize);
        window.addEventListener('resize', onResize);

        return () => {
            phoneQuery.removeEventListener('change', onResize);
            tabletQuery.removeEventListener('change', onResize);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return { device, hydrated };
}
