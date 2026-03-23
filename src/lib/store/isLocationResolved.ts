/**
 * isLocationResolved — shared SOT helper for location gate logic.
 *
 * Used by: UniversalCatalog, ProductClient (PDP guard), and any future surface
 * that needs to enforce the catalog-first location policy.
 *
 * Serviceability matrix (locked 2026-03-15):
 *   state != 'MH'                              → NON_SERVICEABLE
 *   state == 'MH' && nearest_distance_km > 200 → NON_SERVICEABLE
 *   state == 'MH' && nearest_distance_km ≤ 200 → SERVICEABLE
 */

export type ServiceabilityStatus = 'serviceable' | 'unserviceable' | 'unset' | 'loading';

export type BlockReason = 'OUT_OF_STATE' | 'OUT_OF_RADIUS' | null;

/**
 * Resolve block reason from serviceability state for analytics payloads.
 * Returns null when not blocked (serviceable or loading).
 */
export function resolveBlockReason(status: ServiceabilityStatus, stateCode?: string | null): BlockReason {
    if (status !== 'unserviceable') return null;
    if (!stateCode || stateCode.toUpperCase() !== 'MH') return 'OUT_OF_STATE';
    return 'OUT_OF_RADIUS'; // MH state but nearest dealer > 200km
}

/**
 * Whether catalog CTA (onExplore + onCompare) should be blocked.
 * Single shared condition — prevents logic drift between surfaces.
 */
export function isCatalogCTABlocked(showLocationGate: boolean, status: ServiceabilityStatus): boolean {
    return showLocationGate || status === 'unserviceable';
}

/**
 * Check if a parsed localStorage bmb_user_pincode payload has a resolved location.
 * Accepts both lat/lng coords and a valid 6-digit pincode.
 */
export function hasResolvedLocationPayload(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    const lat = Number(v.lat ?? v.latitude);
    const lng = Number(v.lng ?? v.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return true;
    const pincode = String(v.pincode || '').trim();
    return /^\d{6}$/.test(pincode);
}

/**
 * Read resolved location from localStorage (client-side only).
 * Returns false on server or parse error.
 */
export function readLocationFromStorage(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('bmb_user_pincode');
        if (!raw) return false;
        return hasResolvedLocationPayload(JSON.parse(raw));
    } catch {
        return false;
    }
}

/**
 * PDP redirect guard — generates safe redirect URL back to catalog.
 * Includes redirected=1 to prevent redirect loops.
 * Sanitizes make/model to prevent undefined in QS.
 */
export function buildPdpGuardRedirectUrl(make?: string, model?: string): string {
    const safeMake = (make || '').toLowerCase().trim();
    const safeModel = (model || '').toLowerCase().trim();
    const base = '/store/catalog';
    const params = new URLSearchParams();
    params.set('redirected', '1'); // Loop guard
    if (safeMake) params.set('make', safeMake);
    if (safeModel) params.set('model', safeModel);
    return `${base}?${params.toString()}`;
}

/**
 * Check if current page was already redirected from PDP guard.
 * Used to prevent double-redirect loops.
 */
export function isPdpGuardRedirected(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return new URLSearchParams(window.location.search).get('redirected') === '1';
    } catch {
        return false;
    }
}
