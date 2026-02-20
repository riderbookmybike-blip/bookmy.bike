'use client';

import { useState, useEffect } from 'react';

/**
 * Device breakpoint detection hook.
 * - phone:   ≤767px (or detected handheld phone in desktop-site mode)
 * - tablet:  768–1024px
 * - desktop: >1024px
 *
 * SSR-safe: defaults to 'desktop' on server, then hydrates on client
 * with a useEffect guard to prevent layout flash.
 */
export type DeviceBreakpoint = 'phone' | 'tablet' | 'desktop';

const PHONE_MAX = 767;
const TABLET_MAX = 1024;

function isLikelyHandheldPhone(): boolean {
    if (typeof window === 'undefined') return false;

    const nav = window.navigator as Navigator & {
        userAgentData?: {
            mobile?: boolean;
        };
    };
    const ua = nav.userAgent || '';
    const uaData = nav.userAgentData;

    const mobileByUAData = Boolean(uaData?.mobile);
    const mobileByUA = /Android|iPhone|iPod|Mobile|IEMobile|Opera Mini/i.test(ua);

    const shortEdge = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
    const hasTouch = (nav.maxTouchPoints || 0) > 0;
    const mobileByScreen = hasTouch && shortEdge <= 600;

    return mobileByUAData || mobileByUA || mobileByScreen;
}

function getBreakpoint(): DeviceBreakpoint {
    if (typeof window === 'undefined') return 'desktop';

    // Handles desktop-site mode on phones where innerWidth can be inflated.
    if (isLikelyHandheldPhone()) return 'phone';

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
