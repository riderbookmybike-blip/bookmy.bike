/**
 * pdpGating.ts — Server-side enforcement guard for PDP commercial actions.
 *
 * Called at the top of createLeadAction / createQuoteAction.
 * No-ops when STRICT_PDP_GATING !== 'true' (backward-compatible).
 *
 * Guard order:
 *   1. UNAUTHENTICATED  — no auth user
 *   2. LOCATION_REQUIRED — auth present but no pincode provided
 *   3. NOT_SERVICEABLE   — pincode present but outside coverage
 */

export type GatingCode = 'UNAUTHENTICATED' | 'LOCATION_REQUIRED' | 'NOT_SERVICEABLE';

export type GatingResult = { ok: true } | { ok: false; code: GatingCode; message: string };

/**
 * assertPdpGating
 *
 * @param authUserId   Auth UID from getAuthUser() — null if unauthenticated.
 * @param customerPincode  6-digit pincode from the lead/quote payload — null if absent.
 * @returns GatingResult — { ok: true } to proceed, or { ok: false, code, message } to reject.
 */
export async function assertPdpGating(
    authUserId: string | null,
    customerPincode?: string | null
): Promise<GatingResult> {
    // No-op when strict gating is disabled (default dev / backward-compat path)
    if (process.env.STRICT_PDP_GATING !== 'true') {
        return { ok: true };
    }

    // Guard 1: Authentication required
    if (!authUserId) {
        return {
            ok: false,
            code: 'UNAUTHENTICATED',
            message: 'Login required to save quotes or submit a lead.',
        };
    }

    // Guard 2: Pincode required
    const cleanPincode = (customerPincode || '').trim();
    if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
        return {
            ok: false,
            code: 'LOCATION_REQUIRED',
            message: 'Please enter your delivery pincode to continue.',
        };
    }

    // Guard 3: Serviceability check
    try {
        const { checkServiceability } = await import('@/actions/serviceArea');
        const result = await checkServiceability(cleanPincode);
        if (!result?.isServiceable) {
            return {
                ok: false,
                code: 'NOT_SERVICEABLE',
                message: `We don't currently serve pincode ${cleanPincode}. Please update your delivery location.`,
            };
        }
    } catch {
        // Fail-open: on serviceability API error prefer not to block the action.
        // Server enforcement is defense-in-depth; client-side gate already blocks UI.
        console.warn('[pdpGating] serviceability check failed — allowing through');
    }

    return { ok: true };
}
