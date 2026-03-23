/**
 * Referral constants — Single Source of Truth
 * ──────────────────────────────────────────────
 * ALL referral URL building, reading, validation, and storage
 * must use these constants. Do not redefine locally.
 *
 * Canonical URL format (set by MSG91 template + ProfileDropdown):
 *   https://www.bookmy.bike/store?ref=<REFERRAL_CODE>
 *
 * Storage key in localStorage (shared across all readers):
 *   bmb_referral_code
 *
 * Pattern: uppercase alphanumeric + hyphen + underscore, 3–32 chars.
 * This matches id_members.referral_code values generated at signup.
 */

/** The single canonical URL query key for referral links. */
export const REFERRAL_QUERY_KEY = 'ref' as const;

/** localStorage key used to persist captured referral codes across page loads. */
export const REFERRAL_STORAGE_KEY = 'bmb_referral_code' as const;

/**
 * Validation pattern for referral codes.
 * Matches what's stored in id_members.referral_code.
 * /^[A-Z0-9_-]{3,32}$/
 */
export const REFERRAL_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

/**
 * Normalize a raw referral code string:
 * - Trim whitespace
 * - Uppercase
 * Returns empty string if input is falsy.
 */
export function normalizeReferralCode(raw: string | null | undefined): string {
    return String(raw ?? '')
        .trim()
        .toUpperCase();
}

/**
 * Extract the canonical referral code from a URLSearchParams instance.
 * Only reads REFERRAL_QUERY_KEY ('ref'). Validates against REFERRAL_CODE_PATTERN.
 * Returns '' if not present or invalid.
 */
export function extractReferralFromParams(params: URLSearchParams): string {
    const value = normalizeReferralCode(params.get(REFERRAL_QUERY_KEY));
    return REFERRAL_CODE_PATTERN.test(value) ? value : '';
}

/**
 * Extract the canonical referral code from a URL search string (e.g. window.location.search).
 * Returns '' if not present or invalid.
 */
export function extractReferralFromSearch(search: string): string {
    return extractReferralFromParams(new URLSearchParams(search));
}

/**
 * Build the canonical referral share URL for a member.
 * Uses the platform base URL and the single ?ref= key.
 */
export function buildReferralUrl(baseUrl: string, referralCode: string): string {
    const code = normalizeReferralCode(referralCode);
    if (!REFERRAL_CODE_PATTERN.test(code)) return baseUrl;
    return `${baseUrl}/store?${REFERRAL_QUERY_KEY}=${encodeURIComponent(code)}`;
}
