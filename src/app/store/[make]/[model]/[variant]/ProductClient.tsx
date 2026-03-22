'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSystemPDPLogic } from '@/hooks/SystemPDPLogic';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import { LocationPicker } from '@/components/store/LocationPicker';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSystemDealerContext } from '@/hooks/useSystemDealerContext';
import { useDealerSession } from '@/hooks/useDealerSession';
import { useOClubWallet } from '@/hooks/useOClubWallet';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import { useTenant } from '@/lib/tenant/tenantContext';
import { isHandheldPhoneUserAgent, isTvUserAgent } from '@/lib/utils/deviceUserAgent';
import { buildPublicUrl } from '@/lib/utils/publicUrl';
import { computeOClubPricing, OCLUB_SIGNUP_BONUS } from '@/lib/oclub/coin';

import { InsuranceRule } from '@/types/insurance';

const SKU_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIN_DWELL_TRACKING_MS = 1500;
const BOOKMYBIKE_WHATSAPP_NUMBER = '917447403491';

let crmActionsPromise: Promise<typeof import('@/actions/crm')> | null = null;
function getCrmActions() {
    if (!crmActionsPromise) {
        crmActionsPromise = import('@/actions/crm').catch(err => {
            crmActionsPromise = null;
            throw err;
        });
    }
    return crmActionsPromise;
}

function isAbortError(err: unknown): boolean {
    if (!err) return false;
    const candidate = err as { name?: string; message?: string };
    return candidate?.name === 'AbortError' || candidate?.message?.includes('operation was aborted') === true;
}

// Dynamic imports for heavy PDP components (bundle optimization)
const PDPSkeleton = () => (
    <div className="min-h-screen bg-slate-50 animate-pulse">
        {/* Mobile (< md): stacked image → price pill */}
        <div className="md:hidden">
            <div className="aspect-[4/3] bg-slate-200 w-full" />
            <div className="p-4 space-y-3 mt-2">
                <div className="h-3 bg-slate-200 rounded w-20" />
                <div className="h-6 bg-slate-200 rounded w-40" />
                <div className="flex gap-2 mt-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 bg-slate-200 rounded-full" />
                    ))}
                </div>
                <div className="h-24 bg-slate-200 rounded-2xl mt-2" />
                <div className="h-12 bg-slate-200 rounded-2xl mt-2" />
            </div>
        </div>
        {/* Desktop (md+): 2-col image + details */}
        <div className="hidden md:block">
            <div className="h-16 bg-white border-b border-slate-200" />
            <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-2 gap-8 mt-8">
                <div className="aspect-square bg-slate-200 rounded-3xl" />
                <div className="space-y-4">
                    <div className="h-12 bg-slate-200 rounded-xl w-3/4" />
                    <div className="h-8 bg-slate-200 rounded-lg w-1/2" />
                    <div className="h-32 bg-slate-200 rounded-2xl mt-8" />
                </div>
            </div>
        </div>
    </div>
);

const DesktopPDP = dynamic(() => import('@/components/store/DesktopPDP').then(mod => mod.DesktopPDP), {
    loading: () => <PDPSkeleton />,
    ssr: false,
});

const MobilePDP = dynamic(() => import('@/components/store/mobile/MobilePDP').then(mod => mod.MobilePDP), {
    loading: () => <PDPSkeleton />,
    ssr: false,
});

interface ProductClientProps {
    product: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    makeParam: string;
    modelParam: string;
    variantParam: string;
    initialLocation: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    initialPrice: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    insuranceRule?: InsuranceRule;
    registrationRule?: any; // Added
    initialAccessories?: any[];
    initialServices?: any[];
    initialFinance?: any;
    initialDealerId?: string | null;
    leadMeta?: {
        id: string;
        displayId?: string | null;
        customerName?: string | null;
        ownerTenantName?: string | null;
        leadDealerId?: string | null;
        leadDealerName?: string | null;
        leadFinancerId?: string | null;
        leadFinancerName?: string | null;
    };
    initialDevice?: 'phone' | 'desktop' | 'tv';
    /** Server-resolved auth state. Used to gate commercial CTAs without a redirect. */
    isAuthenticated?: boolean;
}

export default function ProductClient({
    product,
    makeParam,
    modelParam,
    variantParam,
    initialLocation,
    initialPrice,
    insuranceRule,
    registrationRule, // Added
    initialAccessories = [],
    initialServices = [],
    initialFinance,
    initialDealerId = null,
    leadMeta,
    initialDevice = 'desktop',
    isAuthenticated = false,
}: ProductClientProps) {
    const [clientAccessories, setClientAccessories] = useState(initialAccessories);
    const [clientColors, setClientColors] = useState(product.colors);
    const [hasTouchedAccessories, setHasTouchedAccessories] = useState(false);
    const initialServerPricing =
        initialPrice?.breakdown && typeof initialPrice.breakdown === 'object' ? initialPrice.breakdown : null;
    const hasResolvedDealer = Boolean(initialDealerId || initialServerPricing?.dealer?.id);
    // SSPP v1: Local state to bridge serverPricing from useSystemDealerContext to useSystemPDPLogic
    const [ssppServerPricing, setSsppServerPricing] = useState<any>(initialServerPricing);
    const searchParams = useSearchParams();
    const router = useRouter();
    const leadIdFromUrl = searchParams.get('lead') || searchParams.get('leadId');
    const [leadContext, setLeadContext] = useState<{ id: string; name: string } | null>(null);
    const [isTeamMember, setIsTeamMember] = useState(false);
    const { availableCoins, isLoggedIn, loading: walletLoading } = useOClubWallet();
    const { dealerId: sessionDealerId, financeId: sessionFinanceId } = useDealerSession();
    const { device } = useBreakpoint(initialDevice);
    const { memberships } = useTenant();
    const [forceMobileLayout, setForceMobileLayout] = useState(false);
    const { trackEvent } = useAnalytics();
    const [showPdpLogin, setShowPdpLogin] = useState(false);

    /**
     * requireAuth — call this as the first line of any commercial action handler.
     * If the user is not authenticated, opens the login sidebar and fires the
     * pdp_auth_gate_opened analytics event. Returns true if the action should abort.
     */
    const requireAuth = (actionLabel: string): boolean => {
        if (isAuthenticated || isLoggedIn) return false; // already logged in
        trackEvent('INTENT_SIGNAL', 'pdp_auth_gate_opened', { action: actionLabel, path: window.location.pathname });
        setShowPdpLogin(true);
        return true; // caller should early-return
    };

    // Deterministic PDP mode:
    // - Default to BEST_OFFER on all devices
    // - Allow explicit override only via URL (?offer=FAST_DELIVERY)
    const offerParam = searchParams.get('offer');
    const offerMode: 'BEST_OFFER' | 'FAST_DELIVERY' =
        offerParam === 'FAST_DELIVERY' || offerParam === 'BEST_OFFER' ? offerParam : 'BEST_OFFER';

    const activeSkuRef = useRef<string | null>(null);
    const activeSkuStartedAtRef = useRef<number | null>(null);
    const lastImmediateDwellFlushRef = useRef<number>(0);

    // Authority: CRM mode = team member arrived via a lead link (?lead=xxx)
    // Direct marketplace visit by team member → treat as regular shopper (not gated)
    // CRM visit (lead in URL) → staff mode, force phone capture for customer's number
    const isCrmMode = isTeamMember && !!leadIdFromUrl;
    const isGated = false; // Never gate on marketplace — team members shop freely

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const isCoarsePointer =
            window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
        const isMobileUA = isHandheldPhoneUserAgent(navigator.userAgent || '');
        const isTv = isTvUserAgent(navigator.userAgent || '');

        // Always treat detected phones as mobile PDP, even if browser is in desktop-site mode.
        const isPhoneDevice = device === 'phone';

        // TVs should ALWAYS use desktop layout.
        // Others (Tablets/Phones) might be forced based on pointer/UA if not already 'phone'.
        if (isTv) {
            setForceMobileLayout(false);
        } else {
            setForceMobileLayout(isPhoneDevice || (device !== 'desktop' && (isCoarsePointer || isMobileUA)));
        }
    }, [device]);

    useEffect(() => {
        let active = true;
        const checkTeamMembership = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                if (active) setIsTeamMember(false);
                return;
            }

            const contextDealerMembership = (memberships || []).some((m: any) => {
                if (String(m?.status || '').toUpperCase() !== 'ACTIVE') return false;
                const type = String(m?.tenants?.type || '').toUpperCase();
                return type === 'DEALER' || type === 'DEALERSHIP' || type === 'BANK';
            });

            let dbDealerMembership = false;
            if (!contextDealerMembership) {
                const { data: dbMemberships } = await supabase
                    .from('memberships')
                    .select('status, tenants!inner(type)')
                    .eq('user_id', user.id)
                    .eq('status', 'ACTIVE');

                dbDealerMembership = (dbMemberships || []).some((m: any) => {
                    const type = String(m?.tenants?.type || '').toUpperCase();
                    return type === 'DEALER' || type === 'DEALERSHIP' || type === 'BANK';
                });
            }

            const { data: memberProfile } = await supabase
                .from('id_members')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();
            const role = String(memberProfile?.role || '').toUpperCase();
            const roleSignalsStaff = !!role && !['MEMBER', 'CUSTOMER'].includes(role);
            const emailSignalsStaff = user.email?.endsWith('@bookmy.bike') || false;

            if (active) {
                setIsTeamMember(contextDealerMembership || dbDealerMembership || roleSignalsStaff || emailSignalsStaff);
            }
        };

        void checkTeamMembership();
        return () => {
            active = false;
        };
    }, [memberships]);

    useEffect(() => {
        if (leadIdFromUrl) {
            const fetchLead = async () => {
                const supabase = createClient();
                const { data: lead } = (await supabase
                    .from('crm_leads')
                    .select('id, customer_name')
                    .or(`id.eq.${leadIdFromUrl},display_id.eq.${leadIdFromUrl}`)
                    .maybeSingle()) as { data: { id: string; customer_name: string } | null; error: any };

                if (lead) {
                    setLeadContext({ id: lead.id, name: lead.customer_name });
                }
            };
            fetchLead();
        }
    }, [leadIdFromUrl]);

    useEffect(() => {
        let active = true;
        const syncMemberActivity = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!active || !user?.id) return;

            const pdpSlug = [makeParam, modelParam, variantParam]
                .map(v => String(v || '').trim())
                .filter(Boolean)
                .join('/');

            const activityPatch: Record<string, any> = {
                last_active_at: new Date().toISOString(),
                last_pdp_slug: pdpSlug || null,
            };

            await supabase
                .from('id_members')
                .update(activityPatch as any)
                .eq('id', user.id);
        };

        void syncMemberActivity();
        return () => {
            active = false;
        };
    }, [makeParam, modelParam, variantParam]);

    const { data, actions } = useSystemPDPLogic({
        initialPrice,
        colors: clientColors, // Passing colors from product (client-aware)
        insuranceRule,
        registrationRule,
        initialAccessories: clientAccessories,
        initialServices,
        product,
        initialFinance,
        serverPricing: ssppServerPricing, // SSPP v1: Pass server-calculated pricing for Single Source of Truth
    });

    const {
        selectedColor,
        selectedSkuId,
        hasValidColorSku,
        totalOnRoad,
        selectedAccessories,
        selectedInsuranceAddons,
        selectedServices,
        selectedOffers,
        quantities,
        isReferralActive,
        baseExShowroom,
    } = data;
    const walletCoinsForDisplay =
        !walletLoading && Number.isFinite(Number(isLoggedIn ? availableCoins : OCLUB_SIGNUP_BONUS))
            ? Number(isLoggedIn ? availableCoins : OCLUB_SIGNUP_BONUS)
            : 0;
    const coinPricingForDisplay =
        walletCoinsForDisplay > 0 ? computeOClubPricing(Number(totalOnRoad || 0), walletCoinsForDisplay) : null;
    const modalDisplayOnRoadEstimate = coinPricingForDisplay?.effectivePrice ?? Number(totalOnRoad || 0);
    // SSPP v1: Enforce canonical SKU UUID for all persistence actions.
    const colorSkuId = SKU_UUID_REGEX.test(String(selectedSkuId || '')) ? String(selectedSkuId) : null;

    const {
        setSelectedColor,
        setSelectedAccessories,
        setSelectedInsuranceAddons,
        setSelectedServices,
        setSelectedOffers,
        setQuantities,
        setIsReferralActive,
        setRegType,
        setEmiTenure,
        setConfigTab,
        setUserDownPayment,
    } = actions;

    const buildSkuEventMetadata = React.useCallback(
        (skuId: string, extra: Record<string, unknown> = {}) => ({
            sku_id: skuId,
            lead_id: leadContext?.id || leadIdFromUrl || undefined,
            make_slug: makeParam || undefined,
            model_slug: modelParam || undefined,
            variant_slug: variantParam || undefined,
            source: 'STORE_PDP',
            ...extra,
        }),
        [leadContext?.id, leadIdFromUrl, makeParam, modelParam, variantParam]
    );

    const buildPdpIntentMetadata = React.useCallback(
        (extra: Record<string, unknown> = {}) => ({
            lead_id: leadContext?.id || leadIdFromUrl || undefined,
            sku_id: colorSkuId || undefined,
            color_id: selectedColor || undefined,
            make_slug: makeParam || undefined,
            model_slug: modelParam || undefined,
            variant_slug: variantParam || undefined,
            source: 'STORE_PDP',
            ...extra,
        }),
        [leadContext?.id, leadIdFromUrl, colorSkuId, selectedColor, makeParam, modelParam, variantParam]
    );

    const sendImmediateIntentSignal = React.useCallback((eventName: string, metadata: Record<string, unknown>) => {
        if (typeof window === 'undefined') return;

        let sessionId = sessionStorage.getItem('bkmb_session_id');
        if (!sessionId && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('bkmb_session_id', sessionId);
        }
        if (!sessionId) return;

        const payload = JSON.stringify({
            sessionId,
            events: [
                {
                    type: 'INTENT_SIGNAL',
                    name: eventName,
                    path: window.location.pathname,
                    metadata,
                    timestamp: new Date().toISOString(),
                },
            ],
        });

        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/analytics/track', blob);
            return;
        }

        void fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => {
            // Best-effort telemetry; never surface network failures to user/runtime overlay.
        });
    }, []);

    const emitDwellForActiveSku = React.useCallback(
        (reason: 'SKU_SWITCH' | 'TAB_HIDDEN' | 'BEFORE_UNLOAD' | 'UNMOUNT', immediate = false) => {
            const activeSku = activeSkuRef.current;
            const startedAt = activeSkuStartedAtRef.current;
            if (!activeSku || !startedAt) return;

            const dwellMs = Date.now() - startedAt;
            if (dwellMs < MIN_DWELL_TRACKING_MS) return;

            const metadata = buildSkuEventMetadata(activeSku, {
                dwell_ms: Math.round(dwellMs),
                reason,
            });

            if (immediate) {
                const now = Date.now();
                if (now - lastImmediateDwellFlushRef.current < 500) return;
                lastImmediateDwellFlushRef.current = now;
                sendImmediateIntentSignal('sku_dwell', metadata);
                return;
            }

            trackEvent('INTENT_SIGNAL', 'sku_dwell', metadata);
        },
        [buildSkuEventMetadata, sendImmediateIntentSignal, trackEvent]
    );

    const trackedSkuId = React.useMemo(() => {
        const nextSku = String(selectedSkuId || selectedColor || '')
            .trim()
            .toLowerCase();
        return nextSku || null;
    }, [selectedSkuId, selectedColor]);

    useEffect(() => {
        if (!trackedSkuId) return;
        if (activeSkuRef.current === trackedSkuId) return;

        if (activeSkuRef.current) {
            emitDwellForActiveSku('SKU_SWITCH');
        }

        activeSkuRef.current = trackedSkuId;
        activeSkuStartedAtRef.current = Date.now();
        trackEvent('INTENT_SIGNAL', 'sku_view', buildSkuEventMetadata(trackedSkuId));
    }, [trackedSkuId, emitDwellForActiveSku, trackEvent, buildSkuEventMetadata]);

    useEffect(() => {
        trackEvent('INTENT_SIGNAL', 'pdp_visit', buildPdpIntentMetadata());
    }, [trackEvent, buildPdpIntentMetadata]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                emitDwellForActiveSku('TAB_HIDDEN', true);
                if (activeSkuRef.current) {
                    activeSkuStartedAtRef.current = Date.now();
                }
                return;
            }

            if (document.visibilityState === 'visible' && activeSkuRef.current) {
                activeSkuStartedAtRef.current = Date.now();
            }
        };

        const handleBeforeUnload = () => {
            emitDwellForActiveSku('BEFORE_UNLOAD', true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            emitDwellForActiveSku('UNMOUNT', true);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [emitDwellForActiveSku]);

    const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);
    // Stores the quote display_id (e.g. RGEA47BE4) after LeadCaptureModal saves a quote.
    // This is the canonical ID for the /q/[displayId] dossier route.
    const [savedQuoteDisplayId, setSavedQuoteDisplayId] = useState<string | null>(null);
    // 3-step bottom bar state machine: IDLE → SAVED → DOWNLOADED
    type QuotePhase = 'IDLE' | 'SAVED' | 'DOWNLOADED';
    const [quotePhase, setQuotePhase] = useState<QuotePhase>(() => (leadMeta?.displayId ? 'SAVED' : 'IDLE'));
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [dealerRetryCount, setDealerRetryCount] = useState(0);
    const [waInFlight, setWaInFlight] = useState(false);
    const shouldForcePhoneCapture = isCrmMode; // Only force phone capture in CRM/lead context
    const [cachedLocationHint, setCachedLocationHint] = useState<{ district?: string; pincode?: string } | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (!cached) return;
            const parsed = JSON.parse(cached);
            setCachedLocationHint({
                district: parsed?.district || parsed?.taluka || parsed?.city || undefined,
                pincode: parsed?.pincode || undefined,
            });
        } catch {
            setCachedLocationHint(null);
        }
    }, []);

    useEffect(() => {
        const syncLocationState = () => {
            try {
                const cached = localStorage.getItem('bkmb_user_pincode');
                const parsed = cached ? JSON.parse(cached) : null;
                setCachedLocationHint({
                    district: parsed?.district || parsed?.taluka || parsed?.city || undefined,
                    pincode: parsed?.pincode || undefined,
                });
            } catch {
                setCachedLocationHint(null);
            }
            // Also trigger dealer hook re-run so it picks up newly resolved lat/lng from localStorage.
            // This closes the race: StoreLayoutClient bootstraps location async → fires locationChanged
            // → hook was already done with null coords → needs to re-run with fresh cache.
            setDealerRetryCount(c => c + 1);
        };
        syncLocationState();

        window.addEventListener('locationChanged', syncLocationState);
        window.addEventListener('focus', syncLocationState);
        window.addEventListener('storage', syncLocationState);
        return () => {
            window.removeEventListener('locationChanged', syncLocationState);
            window.removeEventListener('focus', syncLocationState);
            window.removeEventListener('storage', syncLocationState);
        };
    }, [initialLocation]);

    // Note: Do NOT disable when hasResolvedDealer — the hook must still run to fetch
    // the actual offer_amount via its overrideDealerId path (no lat/lng needed).
    // PDP is login-gated server-side; dealer context should always try resolving.
    const isDealerFetchDisabled = false;

    // Unified Dealer Context Hook
    const {
        dealerColors,
        dealerAccessories,
        bestOffer,
        otherOffers,
        resolvedLocation,
        serverPricing,
        isHydrating,
        dealerFetchState,
        dealerFetchNotice,
    } = useSystemDealerContext({
        product,
        initialAccessories,
        initialLocation,
        selectedColor, // This relies on the color state from useSystemPDPLogic
        overrideDealerId: initialDealerId, // Prioritize this dealer
        disabled: isDealerFetchDisabled,
        prefetchedPricing: initialServerPricing,
        prefetchedLocation: initialLocation,
        offerMode,
        retrySignal: dealerRetryCount,
        // Observability: dealer fetch failures
        onDealerFetchTimeout: payload =>
            trackEvent('INTENT_SIGNAL', 'dealer_fetch_timeout', {
                ...payload,
                source_confidence: (() => {
                    try {
                        return JSON.parse(localStorage.getItem('bkmb_user_pincode') || '{}')?.source_confidence || null;
                    } catch {
                        return null;
                    }
                })(),
            }),
        onDealerFetchError: payload => trackEvent('INTENT_SIGNAL', 'dealer_fetch_error', payload),
    });

    // Update client state when hook returns new data
    useEffect(() => {
        if (dealerColors && dealerColors.length > 0) {
            setClientColors(dealerColors);
        }
    }, [dealerColors]);

    // SSPP v1: Sync serverPricing from useSystemDealerContext to local state
    // Note: Always sync — even if dealer was pre-resolved server-side, the hook
    // fetches the actual offer_amount which must be applied to pricing.
    useEffect(() => {
        if (serverPricing) {
            setSsppServerPricing(serverPricing);
        }
    }, [serverPricing]);

    useEffect(() => {
        if (dealerAccessories && dealerAccessories.length > 0) {
            setClientAccessories(dealerAccessories);

            // Only auto-select inclusive (zero-price) items if user hasn't touched yet
            if (!hasTouchedAccessories) {
                const defaults = dealerAccessories
                    .filter((a: any) => Number(a.discountPrice ?? a.price ?? 0) === 0)
                    .map((a: any) => a.id);
                setSelectedAccessories(defaults);
            }
        }
    }, [dealerAccessories, hasTouchedAccessories, setSelectedAccessories]);

    const legacyBestOffer = bestOffer as
        | ({
              dealer_id?: string;
              id?: string;
          } & typeof bestOffer)
        | undefined;
    const quoteTenantId =
        sessionDealerId ||
        product?.tenant_id ||
        initialDealerId ||
        ssppServerPricing?.dealer?.id ||
        bestOffer?.dealerId ||
        legacyBestOffer?.dealer_id ||
        legacyBestOffer?.id ||
        undefined;
    const isQuoteTenantPending =
        !quoteTenantId && (isHydrating || dealerFetchState === 'IDLE' || dealerFetchState === 'GATED');
    const quoteActionDisabled = !quoteTenantId;
    const quoteActionDisabledLabel = isQuoteTenantPending ? 'SEARCHING BEST OFFER...' : 'SET LOCATION TO GET QUOTE';
    const quoteActionDisabledNotice = isQuoteTenantPending
        ? 'Searching best offer for you, please stay with us.'
        : dealerFetchNotice || 'Best offer dealer abhi resolve nahi hua. Location set karke retry karein.';
    const resolvedStudioIdForUrl =
        ssppServerPricing?.dealer?.studio_id ||
        initialServerPricing?.dealer?.studio_id ||
        initialPrice?.dealer?.studio_id;

    const shareInFlightRef = useRef(false);

    const handleShareQuote = async () => {
        if (shareInFlightRef.current) return;
        const url = new URL(window.location.href);
        if (selectedColor) {
            url.searchParams.set('color', selectedColor);
        } else {
            url.searchParams.delete('color');
        }

        // Remove legacy pincode if it somehow exists
        url.searchParams.delete('pincode');

        url.searchParams.delete('district');
        if (resolvedStudioIdForUrl) {
            url.searchParams.set('studio', String(resolvedStudioIdForUrl).toUpperCase());
        } else {
            url.searchParams.delete('studio');
        }

        const existingState = url.searchParams.get('state');
        if (!existingState) {
            let stateValue: string | null = initialLocation?.state || null;
            if (!stateValue && typeof window !== 'undefined') {
                const cached = localStorage.getItem('bkmb_user_pincode');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        stateValue = parsed?.stateCode || parsed?.state || null;
                    } catch {
                        stateValue = null;
                    }
                }
            }
            if (stateValue) {
                url.searchParams.set('state', stateValue);
            }
        }
        if (leadIdFromUrl) url.searchParams.set('lead', leadIdFromUrl);
        const shareMetadata = buildPdpIntentMetadata({ color_name: selectedColor || undefined });

        if (navigator.share) {
            try {
                shareInFlightRef.current = true;
                trackEvent('INTENT_SIGNAL', 'pdp_share_quote', {
                    ...shareMetadata,
                    share_channel: 'native_share',
                });
                await navigator.share({
                    title: `${product.model} Configuration`,
                    text: `Check out ${product.model} on BookMyBike! Price: ₹${totalOnRoad.toLocaleString()}`,
                    url: url.toString(),
                });
            } catch (err: unknown) {
                const errorName = err instanceof Error ? err.name : '';
                if (errorName !== 'AbortError' && errorName !== 'InvalidStateError') {
                    console.error('Share failed:', err);
                }
            } finally {
                shareInFlightRef.current = false;
            }
        } else {
            try {
                await navigator.clipboard.writeText(url.toString());
                trackEvent('INTENT_SIGNAL', 'pdp_share_quote', {
                    ...shareMetadata,
                    share_channel: 'clipboard',
                });
                alert('URL copied!');
            } catch (err) {
                console.error('Clipboard copy failed:', err);
            }
        }
    };

    // Open the saved Quote Dossier in a new tab.
    // Priority: freshly saved quote display_id (from modal) > leadMeta.displayId (pre-loaded).
    // NEVER use leadContext.id or leadIdFromUrl — those are lead UUIDs, not quote display IDs.
    const handleDownloadQuote = () => {
        const dossierId = savedQuoteDisplayId || leadMeta?.displayId;
        if (dossierId) {
            window.open(`/q/${dossierId}`, '_blank', 'noopener,noreferrer');
            // Advance state machine: SAVED → DOWNLOADED (CTA becomes SHARE QUOTE)
            setQuotePhase('DOWNLOADED');
            trackEvent('INTENT_SIGNAL', 'pdp_download_dossier', {
                ...buildPdpIntentMetadata(),
                dossier_id: dossierId,
            });
        } else {
            // Quote not saved yet — prompt user to save first
            toast.info('Save your quote first to download the dossier.');
        }
    };

    const handleReachUsQuote = () => {
        const dossierId = savedQuoteDisplayId || leadMeta?.displayId;
        if (!dossierId) {
            toast.info('Save your quote first, then we can open WhatsApp with your dossier.');
            return;
        }
        const dossierUrl = buildPublicUrl(`/dossier/${encodeURIComponent(dossierId)}`);
        const customerName =
            String(leadMeta?.customerName || '')
                .trim()
                .split(/\s+/)[0] || 'Hi';
        const msg =
            `${customerName}, I reviewed my personalised dossier.\n` +
            `Dossier: ${dossierUrl}\n` +
            `Please help me with booking confirmation and next steps.`;
        window.open(
            `https://wa.me/${BOOKMYBIKE_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
            '_blank',
            'noopener,noreferrer'
        );
        trackEvent('INTENT_SIGNAL', 'pdp_reach_us_whatsapp', {
            ...buildPdpIntentMetadata(),
            dossier_id: dossierId,
        });
    };

    const buildCommercials = () => {
        const resolvedColor =
            data.colors?.find(
                (c: any) => c.id === selectedColor || c.skuId === selectedColor || c.name === selectedColor
            ) ||
            clientColors?.find(
                (c: any) => c.id === selectedColor || c.skuId === selectedColor || c.name === selectedColor
            );
        const colorName = resolvedColor?.name || selectedColor;
        const variantName = product.variant || variantParam;
        const labelBase = [product.model, variantName].filter(Boolean).join(' ');
        const displayLabel = `${labelBase}${colorName ? ` (${colorName})` : ''}`;

        const selectedAccessoryItems = (data.activeAccessories || [])
            .filter((a: any) => selectedAccessories.includes(a.id))
            .map((a: any) => ({
                id: a.id,
                name: a.description || a.displayName || a.name,
                price: a.price,
                discountPrice: a.discountPrice,
                inclusionType: a.inclusionType,
                qty: Number(quantities?.[a.id] || 1),
            }));
        const accessoryCatalogItems = (data.activeAccessories || []).map((a: any) => ({
            id: a.id,
            name: a.description || a.displayName || a.name,
            price: a.price,
            discountPrice: a.discountPrice,
            inclusionType: a.inclusionType,
            qty: Number(quantities?.[a.id] || 1),
            selected: selectedAccessories.includes(a.id),
        }));

        const selectedServiceItems = (data.activeServices || [])
            .filter((s: any) => selectedServices.includes(s.id))
            .map((s: any) => ({
                id: s.id,
                name: s.name,
                price: s.price,
                discountPrice: s.discountPrice,
                qty: Number(quantities?.[s.id] || 1),
            }));
        const serviceCatalogItems = (data.activeServices || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            discountPrice: s.discountPrice,
            qty: Number(quantities?.[s.id] || 1),
            selected: selectedServices.includes(s.id),
        }));

        const selectedInsuranceAddonItems = (data.availableInsuranceAddons || [])
            .filter((i: any) => selectedInsuranceAddons.includes(i.id))
            .map((i: any) => ({
                id: i.id,
                name: i.name,
                price: i.price,
                discountPrice: i.discountPrice,
                inclusionType: i.inclusionType,
                breakdown: i.breakdown,
                selected: true,
            }));
        const insuranceCatalogItems = (data.availableInsuranceAddons || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            discountPrice: i.discountPrice,
            inclusionType: i.inclusionType,
            breakdown: i.breakdown,
            isMandatory: Boolean(i.isMandatory || i.inclusionType === 'BUNDLE'),
            selected: selectedInsuranceAddons.includes(i.id),
            description: i.description,
            tenure: i.tenure || i.term || null,
        }));
        const warrantyCatalogItems = (data.warrantyItems || []).map((w: any) => ({
            ...w,
            selected: true,
        }));

        const insuranceTotal = (data.baseInsurance || 0) + (data.insuranceAddonsPrice || 0);
        const colorDelta = (data.colorSurge || 0) - (data.colorDiscount || 0);
        const offersDelta = data.offersDiscount || 0;
        const referralBonus = data.isReferralActive ? 5000 : 0;

        const financeOnRoad = Number(modalDisplayOnRoadEstimate || totalOnRoad || 0);
        const financeDownPayment = Number(data.userDownPayment || data.downPayment || 0);
        const financeTenure = Number(data.emiTenure || 0);
        const financeBaseLoan = Math.max(0, Math.round(financeOnRoad - financeDownPayment));
        const schemeCandidates: Array<{ bank: any; scheme: any }> = Array.isArray(data.initialFinance?.candidateSchemes)
            ? data.initialFinance.candidateSchemes
            : [];

        const isTenureSupported = (scheme: any, tenure: number) => {
            const allowed = Array.isArray(scheme?.allowedTenures)
                ? scheme.allowedTenures.map((t: any) => Number(t))
                : [];
            if (allowed.length > 0) return allowed.includes(tenure);
            const minT = Number(scheme?.minTenure || 0);
            const maxT = Number(scheme?.maxTenure || 0);
            if (Number.isFinite(minT) && Number.isFinite(maxT) && minT > 0 && maxT >= minT) {
                return tenure >= minT && tenure <= maxT;
            }
            return true;
        };

        const calcChargeAmount = (charge: any, baseLoan: number, onRoad: number) => {
            const type = String(charge?.type || charge?.valueType || 'FIXED').toUpperCase();
            if (type === 'PERCENTAGE') {
                const basisKey = String(charge?.calculationBasis || 'ON_ROAD').toUpperCase();
                const basis = basisKey === 'LOAN_AMOUNT' ? baseLoan : onRoad;
                return Math.round(Number(basis || 0) * (Number(charge?.value || 0) / 100));
            }
            return Number(charge?.value || 0);
        };

        let financeWinner: { bank: any; scheme: any; emi: number; grossLoan: number } | null = null;
        if (financeTenure > 0 && schemeCandidates.length > 0) {
            for (const candidate of schemeCandidates) {
                const candidateScheme = candidate?.scheme || {};
                if (!isTenureSupported(candidateScheme, financeTenure)) continue;

                const charges: any[] = Array.isArray(candidateScheme?.charges) ? candidateScheme.charges : [];
                const upfront = charges
                    .filter(c => String(c?.impact || '').toUpperCase() === 'UPFRONT')
                    .reduce((sum, c) => sum + calcChargeAmount(c, financeBaseLoan, financeOnRoad), 0);
                const funded = charges
                    .filter(c => String(c?.impact || '').toUpperCase() === 'FUNDED')
                    .reduce((sum, c) => sum + calcChargeAmount(c, financeBaseLoan, financeOnRoad), 0);
                const grossLoan = Math.max(0, Math.round(financeBaseLoan + funded + upfront));
                if (grossLoan <= 0) continue;

                const annualRate = Number(candidateScheme?.interestRate || 0) / 100;
                const iType = String(candidateScheme?.interestType || 'REDUCING').toUpperCase();
                const emiRaw =
                    iType === 'FLAT'
                        ? (grossLoan + grossLoan * annualRate * (financeTenure / 12)) / financeTenure
                        : (() => {
                              const monthlyRate = annualRate / 12;
                              if (monthlyRate === 0) return grossLoan / financeTenure;
                              return (
                                  (grossLoan * monthlyRate * Math.pow(1 + monthlyRate, financeTenure)) /
                                  (Math.pow(1 + monthlyRate, financeTenure) - 1)
                              );
                          })();
                const emi = Math.round(emiRaw);
                if (!financeWinner || emi < financeWinner.emi) {
                    financeWinner = { bank: candidate?.bank, scheme: candidateScheme, emi, grossLoan };
                }
            }
        }

        const effectiveFinanceBank = financeWinner?.bank || data.initialFinance?.bank || null;
        const effectiveFinanceScheme = financeWinner?.scheme || data.initialFinance?.scheme || null;
        const effectiveFinanceCharges: any[] = Array.isArray(effectiveFinanceScheme?.charges)
            ? effectiveFinanceScheme.charges
            : [];
        const financeChargesDetailed = effectiveFinanceCharges.map((c: any, idx: number) => ({
            id: c.id || `charge-${idx}`,
            label: c.label || c.name || 'Charge',
            amount: calcChargeAmount(c, financeBaseLoan, financeOnRoad),
            impact: c.impact || 'UPFRONT',
            type: c.type || c.valueType || 'FIXED',
            calculationBasis: c.calculationBasis || 'ON_ROAD',
            taxStatus: c.taxStatus,
            taxRate: c.taxRate,
            rawValue: c.value,
            basisAmount:
                String(c?.calculationBasis || 'ON_ROAD').toUpperCase() === 'LOAN_AMOUNT'
                    ? financeBaseLoan
                    : financeOnRoad,
            helpText: c.helpText,
        }));
        const upfrontChargesTotal = financeChargesDetailed
            .filter(c => (c.impact || 'UPFRONT') === 'UPFRONT')
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const fundedChargesTotal = financeChargesDetailed
            .filter(c => (c.impact || 'UPFRONT') === 'FUNDED')
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const grossLoanAmount =
            financeWinner?.grossLoan ||
            Math.max(0, Math.round(financeBaseLoan + fundedChargesTotal + upfrontChargesTotal));
        const marketTenures = Array.from(
            new Set(
                schemeCandidates.flatMap(candidate => {
                    const s = candidate?.scheme || {};
                    const allowed = Array.isArray(s?.allowedTenures)
                        ? s.allowedTenures.map((t: any) => Number(t)).filter((t: number) => Number.isFinite(t) && t > 0)
                        : [];
                    if (allowed.length > 0) return allowed;
                    const minT = Number(s?.minTenure || 0);
                    const maxT = Number(s?.maxTenure || 0);
                    if (Number.isFinite(minT) && Number.isFinite(maxT) && minT > 0 && maxT >= minT) {
                        return Array.from({ length: maxT - minT + 1 }, (_, i) => minT + i);
                    }
                    return [];
                })
            )
        ).sort((a, b) => a - b);
        const getBankShortCode = (name: string) => {
            const key = String(name || '').toLowerCase();
            const mapped =
                (key.includes('home credit') && 'HCI') ||
                (key.includes('shriram') && 'SFL') ||
                (key.includes('kotak') && 'KPL') ||
                (key.includes('bajaj') && 'BFS') ||
                (key.includes('bandhan') && 'BBL') ||
                ((key.includes('l&t') || key.includes('lt finance')) && 'LTF') ||
                '';
            if (mapped) return mapped;
            const initials = String(name || '')
                .split(/[\s&/-]+/)
                .map(token => token.trim())
                .filter(Boolean)
                .map(token => token.charAt(0).toUpperCase())
                .join('');
            if (initials.length >= 3) return initials.slice(0, 3);
            const compact = String(name || '')
                .replace(/[^a-zA-Z0-9]/g, '')
                .toUpperCase();
            if (compact.length >= 3) return compact.slice(0, 3);
            return 'FIN';
        };
        const financeTenureRows = marketTenures
            .map(tenure => {
                let best: {
                    bankName: string;
                    bankShortCode: string;
                    schemeCode: string | null;
                    emi: number;
                    grossLoan: number;
                    interest: number;
                    total: number;
                } | null = null;
                for (const candidate of schemeCandidates) {
                    const candidateScheme = candidate?.scheme || {};
                    if (!isTenureSupported(candidateScheme, tenure)) continue;

                    const charges: any[] = Array.isArray(candidateScheme?.charges) ? candidateScheme.charges : [];
                    const upfront = charges
                        .filter(c => String(c?.impact || '').toUpperCase() === 'UPFRONT')
                        .reduce((sum, c) => sum + calcChargeAmount(c, financeBaseLoan, financeOnRoad), 0);
                    const funded = charges
                        .filter(c => String(c?.impact || '').toUpperCase() === 'FUNDED')
                        .reduce((sum, c) => sum + calcChargeAmount(c, financeBaseLoan, financeOnRoad), 0);
                    const grossLoan = Math.max(0, Math.round(financeBaseLoan + funded + upfront));
                    if (grossLoan <= 0) continue;

                    const annualRate = Number(candidateScheme?.interestRate || 0) / 100;
                    const iType = String(candidateScheme?.interestType || 'REDUCING').toUpperCase();
                    const emiRaw =
                        iType === 'FLAT'
                            ? (grossLoan + grossLoan * annualRate * (tenure / 12)) / tenure
                            : (() => {
                                  const monthlyRate = annualRate / 12;
                                  if (monthlyRate === 0) return grossLoan / tenure;
                                  return (
                                      (grossLoan * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                                      (Math.pow(1 + monthlyRate, tenure) - 1)
                                  );
                              })();
                    const emi = Math.round(emiRaw);
                    const totalPaidViaEmi = emi * tenure;
                    const interest = Math.max(0, Math.round(totalPaidViaEmi - grossLoan));
                    const total = Math.round(totalPaidViaEmi + financeDownPayment);
                    const bankName = String(
                        candidate?.bank?.name ||
                            candidate?.bank?.identity?.display_name ||
                            candidate?.bank?.identity?.displayName ||
                            candidate?.bank?.identity?.name ||
                            'Financier'
                    );
                    const row = {
                        bankName,
                        bankShortCode: getBankShortCode(bankName),
                        schemeCode: candidateScheme?.id || candidateScheme?.name || null,
                        emi,
                        grossLoan,
                        interest,
                        total,
                    };
                    if (!best || row.emi < best.emi) best = row;
                }
                if (!best) return null;
                return {
                    tenure,
                    bank_name: best.bankName,
                    bank_short_code: best.bankShortCode,
                    scheme_code: best.schemeCode,
                    emi: best.emi,
                    net_loan: financeBaseLoan,
                    gross_loan: best.grossLoan,
                    interest: best.interest,
                    total: best.total,
                };
            })
            .filter(Boolean);
        const effectiveAnnualRatePct = Number(effectiveFinanceScheme?.interestRate || (data.annualInterest || 0) * 100);
        const effectiveInterestType = effectiveFinanceScheme?.interestType || data.interestType || null;
        const effectiveFinanceEmi = financeWinner?.emi || data.emi || 0;
        const financeWinnerMeta = {
            winner_source: financeWinner ? 'UI_RECOMPUTE' : 'SERVER_INITIAL',
            winner_bank: effectiveFinanceBank?.name || null,
            winner_scheme_code: effectiveFinanceScheme?.id || null,
            candidate_count: schemeCandidates.length,
            computed_at: new Date().toISOString(),
        };

        return {
            brand: product.make,
            model: product.model,
            variant: variantName,
            label: displayLabel,
            color_name: colorName,
            color_hex: resolvedColor?.hexCode || resolvedColor?.hex || resolvedColor?.hex_primary,
            color_is_default: (data.colors || []).length <= 1,
            image_url: resolvedColor?.imageUrl || resolvedColor?.image_url || resolvedColor?.image || product.imageUrl,
            ex_showroom: baseExShowroom,
            grand_total: totalOnRoad,
            finance: {
                bank_id: effectiveFinanceBank?.id || null,
                bank_name: effectiveFinanceBank?.name || null,
                scheme_id: effectiveFinanceScheme?.id || null,
                scheme_code: effectiveFinanceScheme?.name || null,
                scheme_name: effectiveFinanceScheme?.name || null,
                scheme_interest_rate: effectiveFinanceScheme?.interestRate || null,
                scheme_interest_type: effectiveInterestType,
                scheme_allowed_tenures: effectiveFinanceScheme?.allowedTenures || [],
                scheme_market_tenures: marketTenures,
                tenure_rows: financeTenureRows,
                selection_logic: data.initialFinance?.logic || null,
                ltv: effectiveFinanceScheme?.maxLTV || null,
                roi: effectiveAnnualRatePct,
                tenure_months: financeTenure || null,
                down_payment: financeDownPayment,
                loan_amount: financeBaseLoan,
                loan_addons: fundedChargesTotal,
                gross_loan_amount: grossLoanAmount,
                processing_fee: upfrontChargesTotal,
                charges_breakup: financeChargesDetailed,
                emi: effectiveFinanceEmi,
                status: 'IN_PROCESS',
                _meta: financeWinnerMeta,
            },
            delivery: {
                serviceable: bestOffer?.isServiceable ?? serverPricing?.dealer?.is_serviceable ?? null,
                pincode: resolvedLocation?.pincode || null,
                taluka: resolvedLocation?.taluka || null,
                district: resolvedLocation?.district || null,
                stateCode: resolvedLocation?.stateCode || null,
                delivery_tat_days:
                    (bestOffer as any)?.delivery_tat_days ??
                    (bestOffer as any)?.deliveryTatDays ??
                    (bestOffer as any)?.tat_days ??
                    null,
                checked_at: new Date().toISOString(),
            },
            pricing_snapshot: {
                pricing_source: data.pricingSource,
                location: serverPricing?.location || resolvedLocation || null,
                dealer: serverPricing?.dealer || bestOffer || null,
                sku_id: colorSkuId,
                color_name: colorName,
                color_is_default: (data.colors || []).length <= 1,
                color_delta: colorDelta,
                ex_showroom: baseExShowroom,
                rto_type: data.regType,
                rto_total: data.rtoEstimates || 0,
                rto_breakdown: data.rtoBreakdown || [],
                insurance_base: data.baseInsurance || 0,
                insurance_od: data.insuranceOD || 0,
                insurance_tp: data.insuranceTP || 0,
                insurance_gst: Math.round(
                    (((data.insuranceOD || 0) + (data.insuranceTP || 0)) * (data.insuranceGstRate || 18)) / 100
                ),
                insurance_gst_rate: data.insuranceGstRate || 18,
                insurance_addons_total: data.insuranceAddonsPrice || 0,
                insurance_total: insuranceTotal,
                insurance_breakdown: data.insuranceBreakdown || [],
                insurance_required_items: data.insuranceRequiredItems || [],
                insurance_addons_catalog: insuranceCatalogItems,
                offers: selectedOffers,
                offers_items: data.offersItems || [],
                offers_delta: offersDelta,
                accessories_total: data.accessoriesPrice || 0,
                accessories_discount: data.accessoriesDiscount || 0,
                accessories_surge: data.accessoriesSurge || 0,
                services_total: data.servicesPrice || 0,
                services_discount: data.servicesDiscount || 0,
                services_surge: data.servicesSurge || 0,
                insurance_addons_discount: data.insuranceAddonsDiscount || 0,
                insurance_addons_surge: data.insuranceAddonsSurge || 0,
                total_savings: data.totalSavings || 0,
                total_surge: data.totalSurge || 0,
                coin_effective_onroad: modalDisplayOnRoadEstimate || totalOnRoad,
                coin_discount: Math.max(0, Number(totalOnRoad || 0) - Number(modalDisplayOnRoadEstimate || 0)),
                coin_used: coinPricingForDisplay?.coinsUsed || 0,
                accessories: selectedAccessories,
                accessory_items: selectedAccessoryItems,
                all_accessory_items: accessoryCatalogItems,
                services: selectedServices,
                service_items: selectedServiceItems,
                all_service_items: serviceCatalogItems,
                insurance_addons: selectedInsuranceAddons,
                insurance_addon_items: selectedInsuranceAddonItems,
                warranty_items: warrantyCatalogItems,
                all_warranty_items: warrantyCatalogItems,
                emi_tenure: data.emiTenure,
                down_payment: data.userDownPayment || data.downPayment, // Use calculated downPayment if user hasn't explicitly set it
                referral_applied: data.isReferralActive || false,
                referral_bonus: referralBonus,
                rto_options: data.rtoOptions || [],
                // Finance Integration
                finance_scheme_id: effectiveFinanceScheme?.id || null,
                finance_scheme_name: effectiveFinanceScheme?.name || null,
                finance_bank_id: effectiveFinanceBank?.id || null,
                finance_bank_name: effectiveFinanceBank?.name || null,
                finance_emi: effectiveFinanceEmi,
                finance_roi: effectiveAnnualRatePct,
                finance_interest_type: effectiveInterestType,
                finance_allowed_tenures: effectiveFinanceScheme?.allowedTenures || [],
                finance_market_tenures: marketTenures,
                finance_tenure_rows: financeTenureRows,
                finance_loan_amount: financeBaseLoan,
                finance_gross_loan_amount: grossLoanAmount,
                finance_funded_addons: fundedChargesTotal,
                finance_upfront_charges: upfrontChargesTotal,
                finance_charges_breakup: financeChargesDetailed,
                finance_processing_fees: upfrontChargesTotal,
                finance_meta: financeWinnerMeta,
            },
        };
    };

    const notifySmsStatus = (smsStatus?: { state?: string; reason?: string; message?: string }) => {
        if (!smsStatus) return;
        if (smsStatus.state === 'SENT') {
            toast.success('Quote shared on SMS');
            return;
        }
        if (smsStatus.state === 'FAILED') {
            toast.warning(`Quote created, SMS failed (${smsStatus.reason || 'SEND_FAILED'})`);
            return;
        }
        if (smsStatus.state === 'SKIPPED') {
            toast.warning(`Quote created, SMS skipped (${smsStatus.reason || 'SKIPPED'})`);
        }
    };

    const handleConfirmQuote = async () => {
        if (requireAuth('save_quote')) return;
        if (!leadContext) return;
        if (!quoteTenantId) {
            toast.error(quoteActionDisabledNotice);
            return;
        }
        if (!colorSkuId) {
            toast.error('Selected color SKU is unavailable. Please refresh or choose another color.');
            return;
        }

        try {
            const commercials = buildCommercials();
            trackEvent('INTENT_SIGNAL', 'pdp_save_quote', buildPdpIntentMetadata({ action: 'attempt' }));
            const { createQuoteAction } = await getCrmActions();

            const result: any = await createQuoteAction({
                tenant_id: quoteTenantId,
                lead_id: leadContext.id,
                variant_id: product.id,
                color_id: colorSkuId || undefined,
                commercials,
                source: 'STORE_PDP',
            });

            if (result?.success) {
                trackEvent(
                    'INTENT_SIGNAL',
                    'pdp_save_quote',
                    buildPdpIntentMetadata({
                        action: 'success',
                        quote_id: result?.data?.id || undefined,
                    })
                );
                toast.success(`Quote saved for ${leadContext.name}`);
                notifySmsStatus(result?.smsStatus);
                router.back(); // Go back to leads
            } else {
                trackEvent('INTENT_SIGNAL', 'pdp_save_quote', buildPdpIntentMetadata({ action: 'failed' }));
                console.error('Server reported failure saving quote in PDP:', result);
                toast.error(result?.message || 'Failed to save quote');
            }
        } catch (error) {
            if (isAbortError(error)) return;
            trackEvent('INTENT_SIGNAL', 'pdp_save_quote', buildPdpIntentMetadata({ action: 'failed' }));
            console.error('Save quote error:', error);
            toast.error('An error occurred while saving the quote');
        }
    };

    const handleDirectPublicSaveQuote = async () => {
        if (requireAuth('save_quote')) return;
        if (!quoteTenantId) {
            toast.error(quoteActionDisabledNotice);
            return;
        }
        if (!colorSkuId) {
            toast.error('Selected color SKU is unavailable. Please refresh or choose another color.');
            return;
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;

        try {
            const { data: member } = await supabase
                .from('id_members')
                .select('full_name, primary_phone, pincode, aadhaar_pincode, latitude, longitude, whatsapp')
                .eq('id', user.id)
                .maybeSingle();

            const hasPhone = member?.primary_phone || member?.whatsapp;
            const hasLocation = member?.latitude && member?.longitude;
            const hasName = member?.full_name;

            if (!hasName || (!hasPhone && !hasLocation)) {
                toast.error('Quote save ke liye pehle profile complete karein (name + phone/location).');
                return;
            }

            const { createLeadAction, createQuoteAction } = await getCrmActions();
            toast.loading('Saving quote...', { id: 'save-quote' });

            let phoneForLead = member?.primary_phone || member?.whatsapp || '';
            if (!phoneForLead && user.phone) {
                const digits = user.phone.replace(/\D/g, '');
                phoneForLead = digits.length >= 10 ? digits.slice(-10) : user.phone;
            }
            if (!member) return;

            const leadResult = await createLeadAction({
                customer_name: member.full_name || 'Unknown',
                customer_phone: phoneForLead,
                customer_pincode: (member.pincode || member.aadhaar_pincode || undefined) as string | undefined,
                customer_id: user.id,
                model: product.model || '',
                owner_tenant_id: quoteTenantId,
                selected_dealer_id: quoteTenantId,
                source: 'STORE_PDP',
            });

            if (!leadResult.success || !('leadId' in leadResult) || !leadResult.leadId) {
                toast.dismiss('save-quote');
                toast.error((leadResult as any)?.message || 'Failed to process request');
                return;
            }

            const commercials = buildCommercials();
            const quoteResult = await createQuoteAction({
                tenant_id: quoteTenantId,
                lead_id: leadResult.leadId,
                variant_id: product.id,
                color_id: colorSkuId || undefined,
                commercials,
                source: 'STORE_PDP',
            });

            toast.dismiss('save-quote');
            if (!quoteResult?.success) {
                toast.error(quoteResult?.message || 'Failed to create quote');
                return;
            }

            const displayId = quoteResult.data?.display_id || quoteResult.data?.id;
            setSavedQuoteDisplayId(displayId || null);
            setQuotePhase('SAVED');
            notifySmsStatus((quoteResult as any)?.smsStatus);
            toast.success(`Quote ${displayId} saved`);
        } catch (error) {
            if (isAbortError(error)) return;
            console.error('Direct quote save error:', error);
            toast.error('An error occurred while saving the quote');
        }
    };

    const handleBookingRequest = async () => {
        if (requireAuth('book_now')) return;
        if (!quoteTenantId) {
            toast.error(quoteActionDisabledNotice);
            return;
        }
        if (!colorSkuId) {
            toast.error('Selected color SKU is unavailable. Please refresh or choose another color.');
            return;
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user?.email?.endsWith('@bookmy.bike')) {
            setShowEmailModal(true);
            return;
        }

        // Check if user is authenticated and has complete profile
        if (user?.id) {
            try {
                const { data: member } = await supabase
                    .from('id_members')
                    .select('full_name, primary_phone, pincode, aadhaar_pincode, latitude, longitude, whatsapp')
                    .eq('id', user.id)
                    .maybeSingle();

                // Profile is complete if: name exists + (phone OR GPS coordinates)
                const hasPhone = member?.primary_phone || member?.whatsapp;
                const hasLocation = member?.latitude && member?.longitude;
                const hasName = member?.full_name;

                // If user has required data, skip modal and create quote directly
                if (hasName && (hasPhone || hasLocation)) {
                    const { createLeadAction, createQuoteAction } = await getCrmActions();

                    toast.loading('Creating your quote...', { id: 'create-quote' });

                    // Extract phone number (normalize if needed)
                    let phoneForLead = member?.primary_phone || member?.whatsapp || '';
                    if (!phoneForLead && user.phone) {
                        // Fallback to auth phone, normalize to 10 digits
                        const digits = user.phone.replace(/\D/g, '');
                        phoneForLead = digits.length >= 10 ? digits.slice(-10) : user.phone;
                    }

                    if (!member) return;

                    const leadResult = await createLeadAction({
                        customer_name: member.full_name || 'Unknown',
                        customer_phone: phoneForLead,
                        customer_pincode: (member.pincode || member.aadhaar_pincode || undefined) as string | undefined,
                        customer_id: user.id, // Pass logged-in user's ID directly!
                        model: product.model || '',
                        owner_tenant_id: quoteTenantId,
                        selected_dealer_id: quoteTenantId,
                        source: 'PDP_QUICK_QUOTE',
                    });

                    if (leadResult.success && 'leadId' in leadResult && leadResult.leadId) {
                        const commercials = buildCommercials();
                        const quoteResult = await createQuoteAction({
                            tenant_id: quoteTenantId,
                            lead_id: leadResult.leadId,
                            variant_id: product.id,
                            color_id: colorSkuId || undefined,
                            commercials,
                            source: 'STORE_PDP',
                        });

                        toast.dismiss('create-quote');

                        if (quoteResult?.success) {
                            const displayId = quoteResult.data?.display_id || quoteResult.data?.id;
                            trackEvent('INTENT_SIGNAL', 'pdp_save_quote', {
                                ...buildPdpIntentMetadata({
                                    action: 'success',
                                    quote_id: quoteResult?.data?.id || undefined,
                                    lead_id: leadResult.leadId,
                                }),
                            });
                            toast.success(`Quote ${displayId} created successfully! 🎉`);
                            notifySmsStatus((quoteResult as any)?.smsStatus);
                            // Optionally redirect to quotes page or show success message
                            router.push('/profile?tab=quotes');
                            return;
                        } else {
                            toast.error(quoteResult?.message || 'Failed to create quote');
                        }
                    } else {
                        toast.dismiss('create-quote');
                        toast.error(leadResult.message || 'Failed to process request');
                    }
                    return;
                }
            } catch (error) {
                if (isAbortError(error)) return;
                console.error('Auto-quote creation error:', error);
                toast.error('Failed to create quote automatically');
            }
        }

        // Fallback: Show modal for non-logged-in users or incomplete profiles
        if (!isReferralActive) {
            setShowQuoteSuccess(true);
        } else {
            setShowQuoteSuccess(true);
        }
    };

    const handleWaSend = async (recipientPhone: string, language: 'en_GB' | 'hi' | 'mr' = 'en_GB') => {
        if (requireAuth('whatsapp_send')) return;
        if (waInFlight) return;
        setWaInFlight(true);
        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Login required to send WhatsApp');
                return;
            }

            // Fetch advisor profile (full_name + primary_phone + referral_code)
            const { data: member } = await supabase
                .from('id_members')
                .select('full_name, primary_phone, whatsapp, referral_code')
                .eq('id', user.id)
                .maybeSingle();

            const advisorName = member?.full_name?.trim() || '';
            const advisorRawPhone = (member?.primary_phone || member?.whatsapp || '').replace(/\D/g, '').slice(-10);
            const referralCode = (member?.referral_code || '').trim().toUpperCase();

            if (!advisorName) {
                toast.error('Your profile name is required to send WhatsApp');
                return;
            }
            if (advisorRawPhone.length < 10) {
                toast.error('Your profile phone is required to send WhatsApp');
                return;
            }
            if (!referralCode) {
                toast.error('Your referral code is missing. Please contact support.');
                return;
            }

            // Send only the referral code — MSG91 template URL is:
            // https://www.bookmy.bike/store?ref={{1}}
            const res = await fetch('/api/whatsapp/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: recipientPhone,
                    advisor_name: advisorName,
                    advisor_mobile: advisorRawPhone,
                    referral_code: referralCode,
                    language,
                }),
            });

            const result = await res.json();

            if (result?.success) {
                if (result.message?.includes('Duplicate')) {
                    toast.info('WhatsApp already sent recently (duplicate suppressed)');
                } else {
                    const reqId = typeof result?.requestId === 'string' ? result.requestId : '';
                    toast.success(reqId ? `WhatsApp queued! Req: ${reqId.slice(0, 8)}…` : 'WhatsApp welcome sent! 🚀');
                    if (reqId) {
                        console.info('[WA:welcome] request_id:', reqId);
                    }
                }
            } else {
                const reqId = typeof result?.requestId === 'string' ? ` (Req: ${result.requestId.slice(0, 8)}…)` : '';
                toast.error((result?.message || 'WhatsApp send failed') + reqId);
            }
        } catch (err) {
            console.error('[WA:welcome] Error:', err);
            toast.error('WhatsApp send failed — network error');
        } finally {
            setWaInFlight(false);
        }
    };

    const toggleAccessory = (id: string) => {
        const accessory: any = data.activeAccessories.find((a: any) => a.id === id);
        if (accessory?.isMandatory) return;
        setHasTouchedAccessories(true);
        setSelectedAccessories(prev => {
            // Deselecting: simply remove
            if (prev.includes(id)) return prev.filter(x => x !== id);

            // Selecting: enforce one-SKU-per-product-group
            const group = accessory?.productGroup;
            if (group) {
                // Find sibling SKU IDs in the same product group
                const siblingIds = data.activeAccessories
                    .filter((a: any) => a.productGroup === group && a.id !== id && !a.isMandatory)
                    .map((a: any) => a.id);
                // Remove any siblings, then add the new one
                return [...prev.filter(x => !siblingIds.includes(x)), id];
            }
            return [...prev, id];
        });
    };

    const toggleInsuranceAddon = (id: string) => {
        const addon = data.availableInsuranceAddons.find((i: any) => i.id === id);
        if (addon?.isMandatory) return;
        setSelectedInsuranceAddons(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const toggleService = (id: string) => {
        setSelectedServices(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const toggleOffer = (id: string) => {
        setSelectedOffers(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const updateQuantity = (id: string, delta: number, max: number = 1) => {
        setQuantities(prev => {
            const current = prev[id] || 1;
            const next = Math.min(Math.max(1, current + delta), max);
            return { ...prev, [id]: next };
        });
    };

    const handlers = {
        handleColorChange: setSelectedColor,
        handleShareQuote: shouldForcePhoneCapture ? () => setShowQuoteSuccess(true) : handleShareQuote,
        handleSaveQuote: leadIdFromUrl ? handleConfirmQuote : handleDirectPublicSaveQuote,
        handleBookingRequest: shouldForcePhoneCapture
            ? () => setShowQuoteSuccess(true)
            : leadIdFromUrl
              ? handleConfirmQuote
              : handleBookingRequest,
        handleWaSend,
        handleDownloadQuote,
        handleReachUsQuote,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        toggleOffer,
        updateQuantity,
        setRegType,
        setEmiTenure,
        setConfigTab,
        setUserDownPayment,
    };

    const winnerTatDays =
        (bestOffer as any)?.delivery_tat_days ??
        (bestOffer as any)?.deliveryTatDays ??
        (bestOffer as any)?.tat_days ??
        (ssppServerPricing as any)?.dealer?.delivery_tat_days ??
        null;

    const pdpDealerIdForParity =
        ssppServerPricing?.dealer?.id ||
        bestOffer?.dealerId ||
        legacyBestOffer?.dealer_id ||
        legacyBestOffer?.id ||
        initialDealerId ||
        '';
    const pdpOfferDeltaForParity = Number(
        ssppServerPricing?.dealer?.offer ??
            bestOffer?.price ??
            Number(data.colorSurge || 0) - Number(data.colorDiscount || 0)
    );
    const pdpGateReason: 'LEGACY_MODE' | 'LOCATION_REQUIRED' | 'DEALER_TIMEOUT' | 'READY' =
        dealerFetchState === 'TIMEOUT' ? 'DEALER_TIMEOUT' : 'READY';
    const derivedServiceability = useMemo(() => {
        const isServiceableFromBestOffer =
            typeof (bestOffer as any)?.isServiceable === 'boolean' ? Boolean((bestOffer as any)?.isServiceable) : null;
        const isServiceableFromServerPricing =
            typeof (serverPricing as any)?.dealer?.is_serviceable === 'boolean'
                ? Boolean((serverPricing as any)?.dealer?.is_serviceable)
                : null;
        const isServiceableFromDealer = isServiceableFromBestOffer ?? isServiceableFromServerPricing;

        // Primary: derive serviceability from location state code (GPS-first policy)
        // MH-only policy: non-MH stateCode → unserviceable regardless of dealer flag
        const stateCode = String(resolvedLocation?.stateCode || initialLocation?.stateCode || '')
            .trim()
            .toUpperCase()
            .slice(0, 2);

        const isMhState = stateCode === 'MH';
        // If stateCode is known, it is authoritative. Dealer flag is secondary.
        const isServiceable = stateCode ? isMhState && isServiceableFromDealer !== false : isServiceableFromDealer;

        if (isServiceable === null || isServiceable === undefined) return undefined;
        return {
            isServiceable: Boolean(isServiceable),
            status: isServiceable ? 'serviceable' : 'unserviceable',
            pincode: resolvedLocation?.pincode || initialLocation?.pincode,
            taluka: resolvedLocation?.taluka || resolvedLocation?.district || initialLocation?.taluka,
            stateCode: stateCode || undefined,
        };
    }, [
        bestOffer,
        initialLocation?.pincode,
        initialLocation?.stateCode,
        initialLocation?.taluka,
        resolvedLocation,
        serverPricing,
    ]);

    const commonProps = {
        product,
        makeParam,
        modelParam,
        variantParam,
        data: {
            ...data,
            tat_effective_hours: null,
            delivery_tat_days: winnerTatDays,
        },
        handlers,
        leadContext: leadContext || undefined,
        initialLocation: resolvedLocation || initialLocation,
        bestOffer, // Passing bestOffer to children
        otherOffers,
        serverPricing, // SSPP v1: Server-calculated pricing breakdown
        walletCoins: !walletLoading ? (isLoggedIn ? availableCoins : OCLUB_SIGNUP_BONUS) : null,
        showOClubPrompt: !walletLoading && !isLoggedIn,
        isLoggedIn: Boolean(isLoggedIn),
        isGated,
        forceMobileLayout,
        gateReason: pdpGateReason,
        dealerFetchState,
        dealerFetchNotice: dealerFetchNotice || undefined,
        onRetryDealerFetch: () => setDealerRetryCount(c => c + 1),
        onRetryLocation: () => setShowLocationPicker(true),
        onWaSend: handleWaSend,
        cachedPincode: cachedLocationHint?.pincode || undefined,
        serviceability: derivedServiceability,
        quoteState: quotePhase,
        quoteActionDisabled,
        quoteActionDisabledLabel,
    };
    const leadDealerMismatch = Boolean(
        leadMeta?.leadDealerId && sessionDealerId && leadMeta.leadDealerId !== sessionDealerId
    );
    const leadFinancerMismatch = Boolean(
        leadMeta?.leadFinancerId && sessionFinanceId && leadMeta.leadFinancerId !== sessionFinanceId
    );
    const showLeadContextAlert = Boolean(leadIdFromUrl && (leadDealerMismatch || leadFinancerMismatch));

    if (!hasValidColorSku) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-8">
                <div className="max-w-md rounded-3xl border border-amber-300/60 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-black tracking-tight mb-3">
                        COLOR SKU <span className="text-amber-400">UNAVAILABLE</span>
                    </h1>
                    <p className="text-sm text-slate-600">
                        This variant does not have a valid purchasable color SKU right now. Try another color or open
                        catalog again.
                    </p>
                    <a
                        href="/store/catalog"
                        className="inline-block mt-6 px-5 py-3 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-[0.16em] hover:bg-slate-100"
                    >
                        Back To Catalog
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* PDP Auth Gate — login sidebar for unauthenticated commercial actions */}
            <LoginSidebar
                isOpen={showPdpLogin}
                onClose={() => setShowPdpLogin(false)}
                redirectTo={
                    typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined
                }
            />
            {showLeadContextAlert && (
                <div className="mx-auto w-full max-w-7xl px-4 pt-3">
                    <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-amber-900">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em]">Lead Context Mismatch</p>
                        <p className="mt-1 text-sm">
                            Active Dealership/Financer is different from this lead context.
                            {` Lead: ${leadMeta?.displayId || leadMeta?.id || leadIdFromUrl}`}
                            {leadMeta?.customerName ? ` (${leadMeta.customerName})` : ''}.
                        </p>
                        <p className="mt-1 text-xs">
                            Lead Owner: {leadMeta?.ownerTenantName || 'Unknown'} | Lead Dealership:{' '}
                            {leadMeta?.leadDealerName || 'Unknown'} | Lead Financer:{' '}
                            {leadMeta?.leadFinancerName || 'Unknown'}
                        </p>
                    </div>
                </div>
            )}
            <div
                data-testid="pdp-offer-meta"
                data-dealer-id={pdpDealerIdForParity}
                data-offer-delta={pdpOfferDeltaForParity}
                data-sku-id={colorSkuId || ''}
                data-gate-reason={pdpGateReason}
                data-dealer-fetch-state={dealerFetchState}
                data-dealer-fetch-notice={dealerFetchNotice || ''}
                style={{ display: 'none' }}
            />
            {/* ── END DEBUG BANNER (removed) ── */}
            {/* Avoid transient price mismatch while wallet context is still resolving. */}
            {walletLoading ? (
                <PDPSkeleton />
            ) : forceMobileLayout ? (
                <MobilePDP {...commonProps} />
            ) : (
                <DesktopPDP {...commonProps} />
            )}

            <LocationPicker
                isOpen={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                initialPincode={
                    cachedLocationHint?.pincode || resolvedLocation?.pincode || initialLocation?.pincode || ''
                }
                onLocationSet={(pincode, taluka, lat, lng) => {
                    const nextLocation = {
                        ...(resolvedLocation || initialLocation || {}),
                        pincode,
                        taluka,
                        district: taluka,
                        lat: lat ?? null,
                        lng: lng ?? null,
                    };
                    localStorage.setItem('bkmb_user_pincode', JSON.stringify(nextLocation));
                    window.dispatchEvent(new Event('locationChanged'));
                    setDealerRetryCount(c => c + 1);
                }}
            />

            <LeadCaptureModal
                isOpen={showQuoteSuccess}
                onClose={() => setShowQuoteSuccess(false)}
                productName={`${product.make} ${product.model}`}
                model={product.model}
                variant={variantParam}
                variantId={product.id}
                colorId={colorSkuId || undefined}
                commercials={buildCommercials()}
                quoteTenantId={quoteTenantId}
                displayOnRoadEstimate={modalDisplayOnRoadEstimate}
                source={leadIdFromUrl ? 'LEADS' : 'STORE_PDP'}
                onQuoteSaved={displayId => {
                    setSavedQuoteDisplayId(displayId);
                    setQuotePhase('SAVED');
                }}
            />

            <EmailUpdateModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSuccess={() => setShowEmailModal(false)}
            />
        </>
    );
}
