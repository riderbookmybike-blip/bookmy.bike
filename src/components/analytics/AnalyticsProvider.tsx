'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';

// Types
type EventType = 'PAGE_VIEW' | 'CLICK' | 'SCROLL' | 'FORM_SUBMIT' | 'INTENT_SIGNAL';

interface AnalyticsContextType {
    trackEvent: (type: EventType, name: string, metadata?: any) => void;
    sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
    return context;
};

// Helper: Get robust device info
const getDeviceInfo = () => {
    if (typeof window === 'undefined') return {};
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    if (/mobile/i.test(ua)) deviceType = 'mobile';
    else if (/tablet/i.test(ua)) deviceType = 'tablet';

    return {
        userAgent: ua,
        type: deviceType,
        os: navigator.platform,
        browser: 'Modern' // Simplified, can use UAParser for detail
    };
};

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sessionIdRef = useRef<string>('');
    const queueRef = useRef<any[]>([]);
    const processingRef = useRef(false);
    const supabase = createClient();

    // 1. Initialize Session
    useEffect(() => {
        let sid = sessionStorage.getItem('bkmb_session_id');
        if (!sid) {
            sid = uuidv4();
            sessionStorage.setItem('bkmb_session_id', sid);
        }
        sessionIdRef.current = sid;

        // Start processing queue (interval based)
        const interval = setInterval(processQueue, 5000); // Flush every 5 seconds

        // Initial Flush on mount (page load)
        processQueue();

        return () => clearInterval(interval);
    }, []);

    // 2. Track Page Views (Automatic)
    useEffect(() => {
        if (!sessionIdRef.current) return;

        // Track Page View
        trackEvent('PAGE_VIEW', 'page_load', {
            path: pathname,
            query: searchParams?.toString(),
            referrer: document.referrer
        });

    }, [pathname, searchParams]);

    // 3. User Identification (Auth Sync)
    useEffect(() => {
        const syncUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // We'll pass userId in the next batch
                // Optionally we could force a session update here
            }
        };
        syncUser();
    }, []);

    // Core Tracking Function
    const trackEvent = (type: EventType, name: string, metadata: any = {}) => {
        const event = {
            type,
            name,
            path: window.location.pathname,
            metadata,
            timestamp: new Date().toISOString()
        };

        queueRef.current.push(event);

        // If high priority (Intent or Form), flush immediately-ish
        if (type === 'INTENT_SIGNAL' || type === 'FORM_SUBMIT') {
            setTimeout(processQueue, 500);
        }
    };

    const processQueue = async () => {
        if (queueRef.current.length === 0 || processingRef.current) return;
        if (!sessionIdRef.current) return;

        processingRef.current = true;
        const batch = [...queueRef.current];
        queueRef.current = []; // Clear queue immediately

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const locationCache = localStorage.getItem('bkmb_user_pincode');
            let locationData = locationCache ? JSON.parse(locationCache) : null;

            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionIdRef.current,
                    userId: user?.id,
                    events: batch,
                    userAgent: navigator.userAgent,
                    device: getDeviceInfo(),
                    location: locationData // Send if we have it locally
                })
            });
        } catch (error) {
            console.error('Analytics flush failed', error);
            // Ideally retry, but for now simple log (don't block app)
            // queueRef.current = [...batch, ...queueRef.current]; // Re-queue? Be careful of loops.
        } finally {
            processingRef.current = false;
        }
    };

    return (
        <AnalyticsContext.Provider value={{ trackEvent, sessionId: sessionIdRef.current }}>
            {children}
        </AnalyticsContext.Provider>
    );
}
