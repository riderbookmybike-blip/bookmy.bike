/**
 * Storage Keys — Single Source of Truth
 * ──────────────────────────────────────
 * ALL localStorage, sessionStorage, and cookie key names must be defined here.
 * Do NOT hardcode key strings anywhere else. Import from this file.
 *
 * Prefix convention: `bmb_` (bookmy.bike)
 * Previous prefix `bkmb_` was a typo/drift — these are the canonical names.
 *
 * Migration: first-load migration for renamed keys is handled by
 * `migrateLegacyStorageKeys()` — call once from the root layout or app boot.
 */

// ── Location / Pincode ──────────────────────────────────────────────────────
/** localStorage + cookie key for cached user pincode/location JSON payload. */
export const LOCATION_KEY = 'bmb_user_pincode' as const;

/** Legacy key name (pre-SOT). Used only for one-time migration. */
const LEGACY_LOCATION_KEY = 'bkmb_user_pincode' as const;

// ── Auth / Navigation ───────────────────────────────────────────────────────
/** localStorage key for post-login redirect path. */
export const LOGIN_NEXT_KEY = 'bmb_login_next' as const;

// ── Commerce / Preferences ──────────────────────────────────────────────────
/** localStorage key for persisted downpayment preference (number as string). */
export const DOWNPAYMENT_KEY = 'bmb_downpayment' as const;

/** localStorage key for profile sidebar mode toggle ('business' | 'ocircle'). */
export const SIDEBAR_MODE_KEY = 'bmb_sidebar_mode' as const;

/** localStorage key for persisted pricing preferences JSON. */
export const PRICING_PREFS_KEY = 'bmb_pricing_prefs' as const;

// ── Analytics ───────────────────────────────────────────────────────────────
/** sessionStorage key for analytics session ID. */
export const SESSION_ID_KEY = 'bmb_session_id' as const;

/** localStorage key for internal test flag (analytics traffic filtering). */
export const INTERNAL_TEST_KEY = 'bmb_internal_test' as const;

// ── Dealer ──────────────────────────────────────────────────────────────────
/** localStorage key for active dealer context (v2). */
export const DEALER_CONTEXT_KEY = 'bmb_active_dealer_context_v2' as const;

// ── Migration ───────────────────────────────────────────────────────────────
/**
 * One-time migration for users who have data under old `bkmb_` keys.
 * Call this once on app boot (e.g. in RootLayout or StoreLayoutClient).
 * Safe to call multiple times — no-ops if migration already done.
 */
export function migrateLegacyStorageKeys(): void {
    if (typeof window === 'undefined') return;
    try {
        // bkmb_user_pincode -> bmb_user_pincode
        const legacyLocation = localStorage.getItem(LEGACY_LOCATION_KEY);
        if (legacyLocation && !localStorage.getItem(LOCATION_KEY)) {
            localStorage.setItem(LOCATION_KEY, legacyLocation);
            localStorage.removeItem(LEGACY_LOCATION_KEY);
        } else if (legacyLocation) {
            // New key already set — just clean up legacy
            localStorage.removeItem(LEGACY_LOCATION_KEY);
        }
    } catch {
        // Ignore — private mode / storage quota
    }
}
