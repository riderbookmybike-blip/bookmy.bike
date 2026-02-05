'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DealerSession {
    mode: 'INDIVIDUAL' | 'TEAM';
    activeTenantId: string | null;
    studioId: string | null;
    district: string | null;
    tenantName: string | null;
}

const STORAGE_KEY = 'bmb_active_tenant_id';
const COOKIE_NAME = 'bmb_dealer_session';

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 30) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const defaultSession: DealerSession = {
    mode: 'INDIVIDUAL',
    activeTenantId: null,
    studioId: null,
    district: null,
    tenantName: null,
};

export function useDealerSession() {
    const [session, setSession] = useState<DealerSession>(defaultSession);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load session on mount
    useEffect(() => {
        try {
            // Try cookie first (source of truth)
            const cookieValue = getCookie(COOKIE_NAME);
            if (cookieValue) {
                const parsed = JSON.parse(cookieValue);
                setSession(parsed);
                // Sync to localStorage as backup
                localStorage.setItem(STORAGE_KEY, cookieValue);
            } else {
                // Fallback to localStorage
                const localValue = localStorage.getItem(STORAGE_KEY);
                if (localValue) {
                    const parsed = JSON.parse(localValue);
                    setSession(parsed);
                    // Restore cookie
                    setCookie(COOKIE_NAME, localValue);
                }
            }
        } catch (e) {
            console.error('[useDealerSession] Error loading session:', e);
        }
        setIsLoaded(true);
    }, []);

    // Activate a dealer session (TEAM mode)
    const activateDealer = useCallback(
        (tenant: { tenantId: string; studioId: string | null; district: string | null; tenantName: string }) => {
            const newSession: DealerSession = {
                mode: 'TEAM',
                activeTenantId: tenant.tenantId,
                studioId: tenant.studioId,
                district: tenant.district,
                tenantName: tenant.tenantName,
            };
            const serialized = JSON.stringify(newSession);
            setCookie(COOKIE_NAME, serialized);
            localStorage.setItem(STORAGE_KEY, serialized);
            setSession(newSession);
        },
        []
    );

    // Switch to individual mode (clear session)
    const switchToIndividual = useCallback(() => {
        deleteCookie(COOKIE_NAME);
        localStorage.removeItem(STORAGE_KEY);
        setSession(defaultSession);
    }, []);

    // Toggle between modes
    const toggleMode = useCallback(() => {
        if (session.mode === 'TEAM') {
            switchToIndividual();
        }
        // Note: To go from INDIVIDUAL to TEAM, user must select a dealership
    }, [session.mode, switchToIndividual]);

    return {
        session,
        isLoaded,
        isTeamMode: session.mode === 'TEAM',
        activeTenantId: session.activeTenantId,
        studioId: session.studioId,
        district: session.district,
        tenantName: session.tenantName,
        activateDealer,
        switchToIndividual,
        toggleMode,
    };
}
