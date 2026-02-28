'use client';

import { useState, useEffect } from 'react';
import { isHandheldPhoneUserAgent, isTvUserAgent } from '@/lib/utils/deviceUserAgent';

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

    if (isTvUserAgent(ua)) return false;

    const mobileByUAData = Boolean(uaData?.mobile);
    const mobileByUA = isHandheldPhoneUserAgent(ua);

    const shortEdge = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
    const hasTouch = (nav.maxTouchPoints || 0) > 0;
    const mobileByScreen = hasTouch && shortEdge <= 600;
    const likelyLeanBackScreen = !hasTouch && window.innerWidth >= 900;

    // Defensive guard: some TV browsers may set UA-CH mobile=true incorrectly.
    if (likelyLeanBackScreen && !mobileByUA) return false;

    return mobileByUAData || mobileByUA || mobileByScreen;
}

function getBreakpoint(): DeviceBreakpoint {
    if (typeof window === 'undefined') return 'desktop';

    const ua = window.navigator.userAgent || '';
    if (isTvUserAgent(ua)) return 'desktop';

    // Handles desktop-site mode on phones where innerWidth can be inflated.
    if (isLikelyHandheldPhone()) return 'phone';

    const w = window.innerWidth;
    if (w <= PHONE_MAX) return 'phone';
    if (w <= TABLET_MAX) return 'tablet';
    return 'desktop';
}

export function useBreakpoint(initialDevice: DeviceBreakpoint = 'desktop'): {
    device: DeviceBreakpoint;
    hydrated: boolean;
} {
    // SSR-safe: start with initialDevice (from server) to match server render perfectly
    const [device, setDevice] = useState<DeviceBreakpoint>(initialDevice);
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
