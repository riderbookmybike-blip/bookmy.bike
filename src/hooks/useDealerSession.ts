import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getResolvedPricingContextAction } from '@/actions/pricingActions';
import { useTenant } from '@/lib/tenant/tenantContext';

export interface DealerSession {
    dealerId: string | null;
    studioId: string | null;
    tenantName: string | null;
    district: string | null;
    locked: boolean;
    source: 'URL' | 'STORAGE' | 'PRIMARY' | 'DEFAULT' | 'NONE';
}

const STORAGE_KEY = 'bkmb_active_dealer_context_v2';

const defaultSession: DealerSession = {
    dealerId: null,
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

        // 2. Check Storage/Local Context
        let storedContext: any = null;
        try {
            const local = localStorage.getItem(STORAGE_KEY);
            if (local) storedContext = JSON.parse(local);
        } catch (e) {
            console.error('[useDealerSession] Error parsing storage:', e);
        }

        // 3. Check Location (Pincode/District)
        let district: string | null = null;
        const storedPincode = localStorage.getItem('bkmb_user_pincode');
        if (storedPincode) {
            try {
                const parsed = JSON.parse(storedPincode);
                district = parsed.district || parsed.taluka || parsed.city || null;
            } catch {}
        }

        // 4. Call Server Action to resolve the "truth"
        try {
            const context = await getResolvedPricingContextAction({
                leadId: urlLeadId,
                dealerId: urlDealerId,
                studio: urlStudio,
                district: district,
            });

            const newSession: DealerSession = {
                dealerId: context.dealerId,
                studioId: null, // Resolution happens by dealerId now
                tenantName: context.tenantName,
                district: context.district,
                locked: !!urlLeadId,
                source:
                    context.source === 'EXPLICIT'
                        ? 'URL'
                        : context.source.startsWith('PRIMARY')
                          ? 'PRIMARY'
                          : storedContext && !urlLeadId && !urlDealerId
                            ? 'STORAGE'
                            : 'DEFAULT',
            };

            // 5. Persistence
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
            setSession(newSession);
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
        const newSession: DealerSession = {
            ...defaultSession,
            dealerId,
            district: district || null,
            source: 'DEFAULT',
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        setSession(newSession);
    }, []);

    return {
        session,
        dealerId: session.dealerId,
        locked: session.locked,
        source: session.source,
        district: session.district,
        isLoaded,
        setDealerContext,
        // Legacy shims to prevent immediate breaks
        activeTenantId: session.dealerId,
        studioId: session.studioId,
        tenantName: session.tenantName,
        isTeamMode: !isUnifiedContext && (session.locked || !!session.dealerId),
    };
}
