/**
 * Microsoft Clarity Utility
 * -------------------------
 * Centralized wrapper for all Clarity interactions:
 *  - User Identity tagging (links sessions to real users)
 *  - Custom Session Tags (dealer, page type, tenant, etc.)
 *  - Smart Events (conversion funnel tracking)
 *
 * Clarity API Reference:
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
 */

type ClarityFunction = (...args: unknown[]) => void;

declare global {
    interface Window {
        clarity?: ClarityFunction;
    }
}

/**
 * Safe wrapper: calls Clarity only when it's loaded on the client
 */
const clarity = (...args: unknown[]): void => {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
        window.clarity(...args);
    }
};

// ─────────────────────────────────────────────────────
// IDENTITY — Link sessions to actual users
// ─────────────────────────────────────────────────────

/**
 * Identify a logged-in user in Clarity.
 * This links all their heatmaps & recordings to their account.
 *
 * Deferred via requestIdleCallback so the main thread is never blocked during
 * the interaction window that INP measures. Falls back to a 2s timeout if the
 * browser doesn't schedule an idle callback quickly.
 *
 * @param userId   Supabase user ID (UUID)
 * @param phone    User's phone number (e.g. "9876543210")
 * @param name     Optional display name
 * @returns A cleanup function that cancels the pending callback (call on unmount)
 */
export const clarityIdentify = (userId: string, phone?: string, name?: string): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    const identify = () => {
        clarity('identify', userId, undefined, undefined, name ?? phone ?? userId);
    };

    if ('requestIdleCallback' in window) {
        // Schedule during browser idle time; fall back after 2s max
        const handle = requestIdleCallback(identify, { timeout: 2000 });
        return () => cancelIdleCallback(handle);
    }

    // Safari fallback: defer via setTimeout(0) — still async, doesn't block interaction
    const timer = setTimeout(identify, 0);
    return () => clearTimeout(timer);
};

// ─────────────────────────────────────────────────────
// CUSTOM TAGS — Segment sessions for filtering
// ─────────────────────────────────────────────────────

/**
 * Tag the current session with key-value metadata.
 * Allows filtering recordings in Clarity dashboard:
 *   e.g. "Show me only sessions from AUMS dealer on PDP"
 *
 * @param key   Tag name (e.g. "dealer_id", "page_type")
 * @param value Tag value (e.g. "aums-001", "pdp")
 */
export const clarityTag = (key: string, value: string): void => {
    clarity('set', key, value);
};

/**
 * Tag the session with dealer & tenant context.
 * Call this when dealer session is resolved.
 */
export const clarityTagDealerContext = (params: {
    dealerId?: string | null;
    dealerName?: string | null;
    tenantId?: string | null;
    financerId?: string | null;
}): void => {
    if (params.dealerId) clarityTag('dealer_id', params.dealerId);
    if (params.dealerName) clarityTag('dealer_name', params.dealerName);
    if (params.tenantId) clarityTag('tenant_id', params.tenantId);
    if (params.financerId) clarityTag('financer_id', params.financerId);
};

/**
 * Tag session with user role (shopper, dealer_staff, admin, etc.)
 */
export const clarityTagUserRole = (role: string): void => {
    clarityTag('user_role', role);
};

/**
 * Tag session with location context (district, state)
 */
export const clarityTagLocation = (district?: string, state?: string): void => {
    if (district) clarityTag('district', district);
    if (state) clarityTag('state', state);
};

// ─────────────────────────────────────────────────────
// SMART EVENTS — Conversion Funnel Tracking
// ─────────────────────────────────────────────────────

/**
 * Track an upgrade signal — marks this session as important.
 * Use for high-value user actions.
 */
export const clarityUpgrade = (reason: string): void => {
    clarity('upgrade', reason);
};

/**
 * Fire a named Smart Event — appears in Clarity Filters, Dashboard, and Recordings.
 * Per docs: window.clarity("event", eventName)
 * Different from upgrade — this creates a filterable event in the UI.
 *
 * @param eventName  e.g. "lead_submitted", "booking_created", "finance_viewed"
 */
export const clarityEvent = (eventName: string): void => {
    clarity('event', eventName);
};

/**
 * Shopper viewed PDP (product detail page)
 */
export const clarityTrackPDPView = (params: {
    variantName: string;
    brandName?: string;
    priceOnRoad?: number;
}): void => {
    clarityTag('last_viewed_variant', params.variantName);
    if (params.brandName) clarityTag('last_viewed_brand', params.brandName);
    if (params.priceOnRoad) clarityTag('last_viewed_price', String(params.priceOnRoad));
};

/**
 * Shopper opened the finance simulator / viewed EMI
 */
export const clarityTrackFinanceViewed = (params: { emi?: number; tenure?: number; downpayment?: number }): void => {
    clarityUpgrade('finance_intent');
    if (params.emi) clarityTag('finance_emi', String(params.emi));
    if (params.tenure) clarityTag('finance_tenure', String(params.tenure));
};

/**
 * Shopper submitted a lead / quote request
 */
export const clarityTrackLeadSubmitted = (params: {
    variantName?: string;
    dealerName?: string;
    source?: string; // "pdp_cta" | "catalog" | "bottom_bar"
}): void => {
    clarityUpgrade('lead_submitted'); // Prioritize this session for recording
    clarityEvent('lead_submitted'); // Named Smart Event → appears in Clarity Filters
    if (params.variantName) clarityTag('lead_variant', params.variantName);
    if (params.dealerName) clarityTag('lead_dealer', params.dealerName);
    if (params.source) clarityTag('lead_source', params.source);
};

/**
 * A booking was created (high-value event)
 */
export const clarityTrackBookingCreated = (params: {
    bookingId?: string;
    variantName?: string;
    totalOnRoad?: number;
}): void => {
    clarityUpgrade('booking_created'); // Prioritize this session for recording
    clarityEvent('booking_created'); // Named Smart Event → appears in Clarity Filters
    if (params.bookingId) clarityTag('booking_id', params.bookingId);
    if (params.variantName) clarityTag('booked_variant', params.variantName);
    if (params.totalOnRoad) clarityTag('booking_value', String(params.totalOnRoad));
};

/**
 * OTP login completed — user is now authenticated
 */
export const clarityTrackLoginComplete = (userId: string, phone?: string, name?: string): void => {
    clarityUpgrade('user_logged_in'); // Prioritize session
    clarityEvent('user_logged_in'); // Smart Event in Clarity dashboard
    clarityIdentify(userId, phone, name);
};
