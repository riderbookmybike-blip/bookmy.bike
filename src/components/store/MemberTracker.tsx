'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackMemberEvent, trackAnonEvent } from '@/actions/member-tracker';

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
    const track = (eventType: Parameters<typeof trackMemberEvent>[1], payload: Record<string, unknown>) => {
        if (memberId) {
            trackMemberEvent(memberId, eventType, payload);
        } else {
            trackAnonEvent(anonSessionId, eventType, payload);
        }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null;
}
