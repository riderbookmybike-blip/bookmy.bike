'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackMemberEvent } from '@/actions/member-tracker';

interface MemberTrackerProps {
    memberId: string;
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

export function MemberTracker({ memberId }: MemberTrackerProps) {
    const pathname = usePathname();
    const sessionStartRef = useRef<number>(Date.now());
    const pageStartRef = useRef<number>(Date.now());
    const prevPathRef = useRef<string>(pathname);
    const pageCountRef = useRef<number>(0);
    const firedSessionStartRef = useRef(false);
    // One-time guard: SESSION_END must fire exactly once per tracker lifetime
    const sessionEndFiredRef = useRef(false);
    // Tab-scoped session identifier — stable for this component lifetime
    const sessionIdRef = useRef<string>(crypto.randomUUID());

    // SESSION_START — once per mount
    useEffect(() => {
        if (!memberId || firedSessionStartRef.current) return;
        firedSessionStartRef.current = true;
        const now = Date.now();
        sessionStartRef.current = now;
        pageStartRef.current = now;
        const sessionId = sessionIdRef.current;

        // Fire SESSION_START
        trackMemberEvent(memberId, 'SESSION_START', {
            session_id: sessionId,
            device: getDeviceType(),
            url: window.location.pathname,
        });
        // Note: the landing page will be captured as PAGE_VIEW on either:
        // - the next route change (with real duration), or
        // - unmount (last-page flush below).
        // We do NOT emit a zero-duration PAGE_VIEW here to avoid double-logging.

        // SESSION_END — deduped via sessionEndFiredRef
        const handleEnd = () => {
            if (sessionEndFiredRef.current) return;
            sessionEndFiredRef.current = true;

            const totalMs = Date.now() - sessionStartRef.current;
            trackMemberEvent(memberId, 'SESSION_END', {
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

            // Flush the last page's duration before unmount
            const lastPageDurationMs = Date.now() - pageStartRef.current;
            if (lastPageDurationMs > 0 && prevPathRef.current) {
                pageCountRef.current += 1; // count this page toward SESSION_END.page_count
                trackMemberEvent(memberId, 'PAGE_VIEW', {
                    session_id: sessionId,
                    url: prevPathRef.current,
                    title: getPageTitle(),
                    duration_ms: lastPageDurationMs,
                });
            }

            handleEnd();
        };
    }, [memberId]);

    // PAGE_VIEW — on route change (records time spent on the PREVIOUS page)
    useEffect(() => {
        if (!memberId) return;
        const prev = prevPathRef.current;

        if (prev && prev !== pathname) {
            const durationMs = Date.now() - pageStartRef.current;
            pageCountRef.current += 1;
            trackMemberEvent(memberId, 'PAGE_VIEW', {
                session_id: sessionIdRef.current,
                url: prev,
                title: getPageTitle(),
                duration_ms: durationMs,
            });
        }

        // Reset for new page
        prevPathRef.current = pathname;
        pageStartRef.current = Date.now();
    }, [pathname, memberId]);

    return null; // invisible tracker
}
