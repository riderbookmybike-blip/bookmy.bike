'use client';

import { useState, useEffect } from 'react';
import { isHandheldPhoneUserAgent, isTvUserAgent } from '@/lib/utils/deviceUserAgent';

/**
 * Device breakpoint detection hook.
 * - phone:   ≤767px (or detected handheld phone in desktop-site mode)
 * - tablet:  768–899px
 * - desktop: ≥900px
 * - tv:      TV user-agent
 *
 * SSR-safe: defaults to 'desktop' on server, then hydrates on client
 * with a useEffect guard to prevent layout flash.
 */
export type DeviceBreakpoint = 'phone' | 'tablet' | 'desktop' | 'tv';

const PHONE_MAX = 767;
const TABLET_MAX = 899; // 900px+ is Desktop (Sync with tailwind.config.js lg)

function isLikelyHandheldPhone(): boolean {
    if (typeof window === 'undefined') return false;

    const nav = window.navigator as Navigator & {
        userAgentData?: {
            mobile?: boolean;
        };
    };
    const ua = nav.userAgent || '';
    const uaData = nav.userAgentData;

    const viewportWidth = window.innerWidth;
    const shortEdge = Math.min(viewportWidth, window.innerHeight);
    const hasTouch = (nav.maxTouchPoints || 0) > 0;

    // 960x540 safeguard: If viewport is reasonably wide (>= 800px), it's not a handheld phone.
    if (viewportWidth >= 800) return false;

    const mobileByUAData = Boolean(uaData?.mobile);
    const mobileByUA = isHandheldPhoneUserAgent(ua);
    const mobileByScreen = hasTouch && shortEdge <= 480; // Tighter screen guard

    return mobileByUAData || mobileByUA || mobileByScreen;
}

function getBreakpoint(): DeviceBreakpoint {
    if (typeof window === 'undefined') return 'desktop';
    if (isTvUserAgent(window.navigator.userAgent || '')) return 'tv';

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
        const applyRootFlags = (resolved: DeviceBreakpoint) => {
            document.documentElement.dataset.device = resolved;
            document.documentElement.dataset.tv = resolved === 'tv' ? '1' : '0';
        };

        // Hydrate immediately on mount
        const currentDevice = getBreakpoint();
        setDevice(currentDevice);
        setHydrated(true);
        applyRootFlags(currentDevice);

        const onResize = () => {
            const nextDevice = getBreakpoint();
            setDevice(nextDevice);
            applyRootFlags(nextDevice);
        };

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
