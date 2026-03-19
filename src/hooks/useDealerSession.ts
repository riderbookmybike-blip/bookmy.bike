import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getResolvedPricingContextAction } from '@/actions/pricingActions';
import { useTenant } from '@/lib/tenant/tenantContext';
import { shouldSkipDealerContextUpdate, shouldSkipFinanceContextUpdate } from '@/lib/marketplace/dealerSessionGuards';
import { resolveSessionLocally, buildSessionFromServerContext } from '@/lib/marketplace/dealerSessionResolver';

export interface DealerSession {
    dealerId: string | null;
    financeId: string | null;
    studioId: string | null;
    tenantName: string | null;
    district: string | null;
    locked: boolean;
    source: 'URL' | 'STORAGE' | 'PRIMARY' | 'DEFAULT' | 'NONE';
}

const STORAGE_KEY = 'bkmb_active_dealer_context_v2';
const COOKIE_NAME = 'bmb_dealer_session';

function writeDealerSessionCookie(payload: {
    activeDealerTenantId?: string | null;
    activeFinanceTenantId?: string | null;
}) {
    if (typeof document === 'undefined') return;
    const value = encodeURIComponent(
        JSON.stringify({
            mode: 'TEAM',
            activeDealerTenantId: payload.activeDealerTenantId || null,
            activeFinanceTenantId: payload.activeFinanceTenantId || null,
        })
    );
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
}

function clearDealerSessionCookieClient() {
    if (typeof document === 'undefined') return;
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

const defaultSession: DealerSession = {
    dealerId: null,
    financeId: null,
    studioId: null,
    tenantName: null,
    district: null,
    locked: false,
    source: 'NONE',
};

export function useDealerSession() {
    const searchParams = useSearchParams();
    const { isUnifiedContext } = useTenant();
    const [session, setSession] = useState<DealerSession>(defaultSession);
    const [isLoaded, setIsLoaded] = useState(false);
    const resolutionStarted = useRef(false);

    const resolveSession = useCallback(async () => {
        if (typeof window === 'undefined') return;

        // 1. Check URL Parameters (Highest Priority)
        const urlLeadId = searchParams?.get('lead_id');
        const urlDealerId = searchParams?.get('dealer_id');
        const urlStudio = searchParams?.get('studio');
        const urlParams = { leadId: urlLeadId, dealerId: urlDealerId, studio: urlStudio };

        // 2. Check Storage/Local Context
        let storedContext: any = null;
        try {
            const local = localStorage.getItem(STORAGE_KEY);
            if (local) storedContext = JSON.parse(local);
        } catch (e) {
            console.error('[useDealerSession] Error parsing storage:', e);
        }

        // ── MANUAL SELECTION PERSISTENCE ─────────────────────────────────
        // Delegate to the pure helper. Returns a resolved session when the
        // stored context is sufficient (no URL overrides), otherwise null.
        const localResult = resolveSessionLocally(storedContext, urlParams);
        if (localResult) {
            const { shortCircuit: _sc, ...restored } = localResult;
            setSession(restored);
            writeDealerSessionCookie({
                activeDealerTenantId: restored.dealerId,
                activeFinanceTenantId: restored.financeId,
            });
            setIsLoaded(true);
            return;
        }
        // ─────────────────────────────────────────────────────────────────

        // 3. Check Location (Pincode/District)
        let district: string | null = null;
        const storedPincode = localStorage.getItem('bkmb_user_pincode');
        if (storedPincode) {
            try {
                const parsed = JSON.parse(storedPincode);
                district = parsed.district || parsed.taluka || parsed.city || null;
            } catch {}
        }

        // 4. Call Server Action to resolve the "truth" (only when URL overrides present)
        try {
            const context = (await getResolvedPricingContextAction({
                leadId: urlLeadId,
                dealerId: urlDealerId,
                studio: urlStudio,
                district: district,
            })) as {
                dealerId: string | null;
                tenantName: string | null;
                district: string | null;
                stateCode: string;
                source: string;
            };

            const { shortCircuit: _sc, ...newSession } = buildSessionFromServerContext(
                context,
                storedContext,
                urlParams
            );

            // 5. Persistence
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
            setSession(newSession);
            writeDealerSessionCookie({
                activeDealerTenantId: newSession.dealerId,
                activeFinanceTenantId: newSession.financeId,
            });
        } catch (error) {
            console.error('[useDealerSession] Resolution failed:', error);
            // Fallback to stored context if available
            if (storedContext) {
                setSession(storedContext);
            }
        } finally {
            setIsLoaded(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (resolutionStarted.current) return;
        resolutionStarted.current = true;
        resolveSession();
    }, [resolveSession]);

    // Manual setter if a dealer is explicitly selected from a list/prompt
    const setDealerContext = useCallback((dealerId: string, district?: string) => {
        setSession(prev => {
            if (shouldSkipDealerContextUpdate(prev, dealerId, district)) {
                return prev;
            }
            const nextDistrict = district || null;
            const nextFinanceId = prev.financeId || null;

            const newSession: DealerSession = {
                ...defaultSession,
                dealerId,
                financeId: nextFinanceId,
                district: nextDistrict,
                source: 'DEFAULT',
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
            writeDealerSessionCookie({
                activeDealerTenantId: newSession.dealerId,
                activeFinanceTenantId: newSession.financeId,
            });
            return newSession;
        });
    }, []);

    const setFinanceContext = useCallback((financeId: string | null) => {
        setSession(prev => {
            if (shouldSkipFinanceContextUpdate(prev, financeId)) return prev;
            const nextFinanceId = financeId || null;

            const newSession: DealerSession = {
                ...prev,
                financeId: nextFinanceId,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
            writeDealerSessionCookie({
                activeDealerTenantId: newSession.dealerId,
                activeFinanceTenantId: newSession.financeId,
            });
            return newSession;
        });
    }, []);

    const clearDealerContext = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(defaultSession);
        clearDealerSessionCookieClient();
    }, []);

    return {
        session,
        dealerId: session.dealerId,
        locked: session.locked,
        source: session.source,
        district: session.district,
        financeId: session.financeId,
        isLoaded,
        setDealerContext,
        setFinanceContext,
        clearDealerContext,
        // Legacy shims to prevent immediate breaks
        activeTenantId: session.dealerId,
        studioId: session.studioId,
        tenantName: session.tenantName,
        isTeamMode: !isUnifiedContext && (session.locked || !!session.dealerId),
    };
}
