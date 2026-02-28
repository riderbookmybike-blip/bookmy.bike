'use client';

import { useState, useEffect } from 'react';
import { isHandheldPhoneUserAgent, isTvUserAgent } from '@/lib/utils/deviceUserAgent';

/**
 * Device breakpoint detection hook.
 * - phone:   ≤767px (or detected handheld phone in desktop-site mode)
 * - tablet:  768–899px
 * - desktop: ≥900px
 *
 * SSR-safe: defaults to 'desktop' on server, then hydrates on client
 * with a useEffect guard to prevent layout flash.
 */
export type DeviceBreakpoint = 'phone' | 'tablet' | 'desktop';

const PHONE_MAX = 767;
const TABLET_MAX = 899; // 900px+ is Desktop (Sync with tailwind.config.js lg)
const LEANBACK_LONG_EDGE_MIN = 900;
const LEANBACK_SHORT_EDGE_MIN = 500;
const LEANBACK_SHORT_EDGE_MAX = 620;

function isLikelyLeanBackViewport(width: number, height: number, userAgent?: string): boolean {
    const longEdge = Math.max(width, height);
    const shortEdge = Math.min(width, height);
    if (longEdge < LEANBACK_LONG_EDGE_MIN) return false;
    if (shortEdge < LEANBACK_SHORT_EDGE_MIN || shortEdge > LEANBACK_SHORT_EDGE_MAX) return false;

    const ua = userAgent || window.navigator.userAgent || '';
    if (isTvUserAgent(ua)) return true;

    // If geometry looks like TV/cast and UA is NOT a handheld phone, force desktop.
    if (!isHandheldPhoneUserAgent(ua)) return true;

    const hasHover = window.matchMedia('(hover: hover)').matches || window.matchMedia('(any-hover: hover)').matches;
    const coarsePointer =
        window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches;
    const hasTouch = (window.navigator.maxTouchPoints || 0) > 0;

    // Final fallback for ambiguous UAs.
    return coarsePointer && !hasHover && !hasTouch;
}

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

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const shortEdge = Math.min(viewportWidth, viewportHeight);
    const hasTouch = (nav.maxTouchPoints || 0) > 0;

    // 960x540 safeguard: If viewport is reasonably wide (>= 800px), it's not a handheld phone.
    // This catches TVs and Tablets even if they report touch or have ambiguous UAs.
    if (viewportWidth >= 800) return false;

    // Some TV browsers report portrait-like dimensions (540x960) despite lean-back context.
    if (isLikelyLeanBackViewport(viewportWidth, viewportHeight, ua)) return false;

    const mobileByUAData = Boolean(uaData?.mobile);
    const mobileByUA = isHandheldPhoneUserAgent(ua);
    const mobileByScreen = hasTouch && shortEdge <= 480; // Tighter screen guard
    const likelyLeanBackScreen = !hasTouch && viewportWidth >= 900;

    // Defensive guard: some TV browsers may set UA-CH mobile=true incorrectly.
    if (likelyLeanBackScreen && !mobileByUA) return false;

    return mobileByUAData || mobileByUA || mobileByScreen;
}

function getBreakpoint(): DeviceBreakpoint {
    if (typeof window === 'undefined') return 'desktop';

    const ua = window.navigator.userAgent || '';
    if (isTvUserAgent(ua)) return 'desktop';

    if (isLikelyLeanBackViewport(window.innerWidth, window.innerHeight, ua)) return 'desktop';

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
