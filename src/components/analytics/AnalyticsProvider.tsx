'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';

declare global {
    interface Window {
        dataLayer?: Record<string, unknown>[];
    }
}

// Types
type EventType = 'PAGE_VIEW' | 'CLICK' | 'SCROLL' | 'FORM_SUBMIT' | 'INTENT_SIGNAL';

interface AnalyticsContextType {
    trackEvent: (type: EventType, name: string, metadata?: any) => void;
    sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// SSR-safe: returns no-op fallback when context is unavailable (e.g. during server rendering)
const noopAnalytics: AnalyticsContextType = {
    trackEvent: () => {},
    sessionId: '',
};

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    return context ?? noopAnalytics;
};

const INTERNAL_QUERY_PARAM = 'internal_test';
const INTERNAL_STORAGE_KEY = 'bkmb_internal_test';
const PROD_HOSTS = new Set(['bookmy.bike', 'www.bookmy.bike']);

const getEnvironment = (): 'production' | 'prelaunch' => {
    if (typeof window === 'undefined') return 'prelaunch';
    return PROD_HOSTS.has(window.location.hostname) ? 'production' : 'prelaunch';
};

const getGa4MeasurementId = (environment: 'production' | 'prelaunch') => {
    if (environment === 'production') return process.env.NEXT_PUBLIC_GA4_ID_PROD;
    return process.env.NEXT_PUBLIC_GA4_ID_PRELAUNCH;
};

const resolveInternalTraffic = () => {
    if (typeof window === 'undefined') return false;
    const isProd = PROD_HOSTS.has(window.location.hostname);
    if (!isProd) return true;

    const params = new URLSearchParams(window.location.search);
    const flag = params.get(INTERNAL_QUERY_PARAM);
    if (flag === '1') {
        try {
            localStorage.setItem(INTERNAL_STORAGE_KEY, '1');
        } catch {
            // Ignore storage errors
        }
        return true;
    }
    if (flag === '0') {
        try {
            localStorage.removeItem(INTERNAL_STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
    }

    try {
        return localStorage.getItem(INTERNAL_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

const pushDataLayer = (payload: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
};

const getPageType = (pathname: string) => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/search')) return 'search';
    if (pathname.startsWith('/store')) return 'product_detail';
    if (pathname.includes('/booking')) return 'booking_details';
    if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth')) {
        return 'auth';
    }
    if (pathname.startsWith('/app/')) return 'dashboard';
    return 'other';
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
        browser: 'Modern', // Simplified, can use UAParser for detail
    };
};

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sessionIdRef = useRef<string>('');
    const queueRef = useRef<any[]>([]);
    const processingRef = useRef(false);
    const environmentRef = useRef<'production' | 'prelaunch'>('prelaunch');
    const internalTrafficRef = useRef(false);
    const ga4MeasurementIdRef = useRef<string | null>(null);
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
        const interval = setInterval(processQueue, 30000); // Flush every 30 seconds

        // Initial Flush on mount (page load)
        processQueue();

        return () => clearInterval(interval);
    }, []);

    // 2. Initialize dataLayer context
    useEffect(() => {
        const environment = getEnvironment();
        const internalTraffic = resolveInternalTraffic();
        const ga4MeasurementId = getGa4MeasurementId(environment);

        environmentRef.current = environment;
        internalTrafficRef.current = internalTraffic;
        ga4MeasurementIdRef.current = ga4MeasurementId ?? null;

        const initPayload: Record<string, unknown> = {
            event: 'bkmb_init',
            environment,
            internal_traffic: internalTraffic ? 'true' : 'false',
        };
        if (ga4MeasurementId) initPayload.ga4_measurement_id = ga4MeasurementId;
        pushDataLayer(initPayload);
    }, []);

    // 2. Track Page Views (Automatic)
    useEffect(() => {
        if (!sessionIdRef.current) return;

        const resolvedEnvironment = environmentRef.current || getEnvironment();
        const resolvedInternalTraffic = resolveInternalTraffic();
        if (resolvedInternalTraffic !== internalTrafficRef.current) {
            internalTrafficRef.current = resolvedInternalTraffic;
        }

        const pagePayload: Record<string, unknown> = {
            event: 'bkmb_page_view',
            page_path: pathname,
            page_type: getPageType(pathname),
            page_title: document.title,
            environment: resolvedEnvironment,
            internal_traffic: resolvedInternalTraffic ? 'true' : 'false',
        };
        if (ga4MeasurementIdRef.current) pagePayload.ga4_measurement_id = ga4MeasurementIdRef.current;
        pushDataLayer(pagePayload);

        // Track Page View
        trackEvent('PAGE_VIEW', 'page_load', {
            path: pathname,
            query: searchParams?.toString(),
            referrer: document.referrer,
        });
    }, [pathname, searchParams]);

    // 3. User Identification (Auth Sync)
    useEffect(() => {
        const syncUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
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
            timestamp: new Date().toISOString(),
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
            const {
                data: { user },
            } = await supabase.auth.getUser();
            let locationData = null;
            try {
                const locationCache = localStorage.getItem('bkmb_user_pincode');
                if (locationCache) {
                    const parsed = JSON.parse(locationCache);
                    // Handle legacy numeric/string pincode or new object
                    if (parsed && typeof parsed === 'object') {
                        locationData = parsed;
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }

            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionIdRef.current,
                    userId: user?.id,
                    events: batch,
                    userAgent: navigator.userAgent,
                    device: getDeviceInfo(),
                    location: locationData, // Send if we have it locally
                }),
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
