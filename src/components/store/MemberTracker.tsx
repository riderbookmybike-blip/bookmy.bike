'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackMemberEvent, trackAnonEvent } from '@/actions/member-tracker';
import type { MemberEventType } from '@/lib/constants/member-tracking';
import type { MemberTrackingDetail } from '@/lib/tracking/emitMemberTrackingEvent';

interface MemberTrackerProps {
    memberId?: string | null;
    anonSessionId: string;
}

function getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
}

function getPageTitle(): string {
    if (typeof document === 'undefined') return '';
    return document.title || '';
}

function inferSurface(pathname: string): 'catalog' | 'pdp' | 'blog' | 'ocircle' | 'earn' | 'other' {
    if (pathname.startsWith('/store/catalog')) return 'catalog';
    if (/^\/store\/[^/]+\/[^/]+\/[^/]+/.test(pathname)) return 'pdp';
    if (pathname.startsWith('/blog')) return 'blog';
    if (pathname.startsWith('/store/ocircle')) {
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const tab = new URLSearchParams(search).get('tab');
        if (tab?.toLowerCase() === 'earn') return 'earn';
        return 'ocircle';
    }
    return 'other';
}

export function MemberTracker({ memberId, anonSessionId }: MemberTrackerProps) {
    const pathname = usePathname();
    const sessionStartRef = useRef<number>(Date.now());
    const pageStartRef = useRef<number>(Date.now());
    const prevPathRef = useRef<string>(pathname);
    const pageCountRef = useRef<number>(0);
    const firedSessionStartRef = useRef(false);
    const sessionEndFiredRef = useRef(false);
    const sessionIdRef = useRef<string>(crypto.randomUUID());

    // Unified tracker — routes to auth or anon path
    const track = (eventType: MemberEventType, payload: Record<string, unknown>) => {
        if (memberId) {
            trackMemberEvent(memberId, eventType, payload);
        } else {
            trackAnonEvent(anonSessionId, eventType, payload);
        }
    };

    const trackSurfaceActivity = (path: string) => {
        const surface = inferSurface(path);
        const basePayload = {
            session_id: sessionIdRef.current,
            url: path,
            title: getPageTitle(),
            surface,
        };
        if (surface === 'catalog') track('CATALOG_ACTIVITY', basePayload);
        else if (surface === 'pdp') track('PDP_ACTIVITY', basePayload);
        else if (surface === 'blog') track('BLOG_ACTIVITY', basePayload);
        else if (surface === 'earn') track('EARN_ACTIVITY', basePayload);
        else if (surface === 'ocircle') track('OCIRCLE_ACTIVITY', basePayload);
    };

    // SESSION_START — once per mount
    useEffect(() => {
        if (firedSessionStartRef.current) return;
        firedSessionStartRef.current = true;
        const now = Date.now();
        sessionStartRef.current = now;
        pageStartRef.current = now;
        const sessionId = sessionIdRef.current;

        track('SESSION_START', {
            session_id: sessionId,
            device: getDeviceType(),
            url: window.location.pathname,
        });
        trackSurfaceActivity(window.location.pathname);

        const handleEnd = () => {
            if (sessionEndFiredRef.current) return;
            sessionEndFiredRef.current = true;
            const totalMs = Date.now() - sessionStartRef.current;
            track('SESSION_END', {
                session_id: sessionId,
                total_duration_ms: totalMs,
                page_count: pageCountRef.current,
            });
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') handleEnd();
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('beforeunload', handleEnd);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('beforeunload', handleEnd);
            const lastPageDurationMs = Date.now() - pageStartRef.current;
            if (lastPageDurationMs > 0 && prevPathRef.current) {
                pageCountRef.current += 1;
                track('PAGE_VIEW', {
                    session_id: sessionId,
                    url: prevPathRef.current,
                    title: getPageTitle(),
                    duration_ms: lastPageDurationMs,
                });
            }
            handleEnd();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memberId, anonSessionId]);

    // HEARTBEAT — every 5 min
    useEffect(() => {
        const interval = setInterval(
            () => {
                track('HEARTBEAT', {
                    session_id: sessionIdRef.current,
                    url: pathname,
                });
            },
            5 * 60 * 1000
        );
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memberId, anonSessionId, pathname]);

    // PAGE_VIEW on route change
    useEffect(() => {
        const prev = prevPathRef.current;
        if (prev && prev !== pathname) {
            const durationMs = Date.now() - pageStartRef.current;
            pageCountRef.current += 1;
            track('PAGE_VIEW', {
                session_id: sessionIdRef.current,
                url: prev,
                title: getPageTitle(),
                duration_ms: durationMs,
            });
        }
        prevPathRef.current = pathname;
        pageStartRef.current = Date.now();
        trackSurfaceActivity(pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Global click capture for cards/actions + explicit custom-tracking events
    useEffect(() => {
        const clickHandler = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            if (!target) return;
            const el = target.closest(
                'a,button,[data-track-event],[data-testid],[data-product-id]'
            ) as HTMLElement | null;
            if (!el) return;

            const href = el instanceof HTMLAnchorElement ? el.href : null;
            const testId = el.getAttribute('data-testid') || null;
            const productId = el.getAttribute('data-product-id') || null;
            const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 120);
            const surface = inferSurface(pathname);
            const isCard = Boolean(productId || testId?.toLowerCase().includes('card'));
            const eventType: MemberEventType = isCard ? 'CARD_CLICK' : 'ACTION_CLICK';

            track(eventType, {
                session_id: sessionIdRef.current,
                url: window.location.pathname,
                click_text: label || null,
                click_href: href,
                test_id: testId,
                product_id: productId,
                surface,
                element: el.tagName.toLowerCase(),
            });
        };

        const customTrackHandler = (ev: Event) => {
            const ce = ev as CustomEvent<MemberTrackingDetail>;
            if (!ce.detail?.eventType) return;
            track(ce.detail.eventType, {
                session_id: sessionIdRef.current,
                url: window.location.pathname,
                ...(ce.detail.payload || {}),
            });
        };

        document.addEventListener('click', clickHandler, true);
        window.addEventListener('bmb:track', customTrackHandler as EventListener);
        return () => {
            document.removeEventListener('click', clickHandler, true);
            window.removeEventListener('bmb:track', customTrackHandler as EventListener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memberId, anonSessionId, pathname]);

    return null;
}
