/**
 * Referral Code Normalization Tests
 *
 * These tests validate the canonical normalization logic used in the signup API
 * (/api/auth/signup/route.ts) to ensure that raw codes, hyphenated display codes,
 * and any formatting variants all resolve to the same canonical form.
 *
 * The DB stores referral codes as raw alphanumeric strings (e.g., "8UHQ3KFZ4").
 * ProfileDropdown.tsx emits the raw code in URLs.
 * The signup API strips all non-alnum chars + uppercases before lookup.
 */

/** Mirrors the exact normalization in route.ts */
const canonicalizeReferralCode = (input: string): string =>
    String(input || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

describe('Referral Code Canonicalization', () => {
    // --- Raw code (new links from fixed ProfileDropdown) ---
    test('raw code passes through unchanged', () => {
        expect(canonicalizeReferralCode('8UHQ3KFZ4')).toBe('8UHQ3KFZ4');
    });

    test('raw code lowercased is normalized to uppercase', () => {
        expect(canonicalizeReferralCode('8uhq3kfz4')).toBe('8UHQ3KFZ4');
    });

    // --- Hyphenated code (old links from unfixed ProfileDropdown) ---
    test('hyphenated code strips hyphens correctly', () => {
        expect(canonicalizeReferralCode('8UH-Q3K-FZ4')).toBe('8UHQ3KFZ4');
    });

    test('hyphenated code with lowercase normalizes fully', () => {
        expect(canonicalizeReferralCode('8uh-q3k-fz4')).toBe('8UHQ3KFZ4');
    });

    // --- Edge cases ---
    test('leading/trailing whitespace is trimmed', () => {
        expect(canonicalizeReferralCode('  8UHQ3KFZ4  ')).toBe('8UHQ3KFZ4');
    });

    test('empty string returns empty string', () => {
        expect(canonicalizeReferralCode('')).toBe('');
    });

    test('code with spaces (URL-decoded %20) is stripped correctly', () => {
        expect(canonicalizeReferralCode('8UHQ 3KF Z4')).toBe('8UHQ3KFZ4');
    });

    // --- Format validation (mirrors route.ts regex) ---
    const isValidCanonical = (code: string): boolean => /^[A-Z0-9]{4,32}$/.test(code);

    test('raw code passes format validation', () => {
        expect(isValidCanonical(canonicalizeReferralCode('8UHQ3KFZ4'))).toBe(true);
    });

    test('hyphenated code is valid after normalization', () => {
        expect(isValidCanonical(canonicalizeReferralCode('8UH-Q3K-FZ4'))).toBe(true);
    });

    test('invalid code (too short) fails validation', () => {
        expect(isValidCanonical(canonicalizeReferralCode('AB'))).toBe(false);
    });

    test('invalid code (special chars only) fails validation', () => {
        expect(isValidCanonical(canonicalizeReferralCode('!@#$'))).toBe(false);
    });

    test('null-like input returns empty and fails validation', () => {
        const result = canonicalizeReferralCode(null as any);
        expect(result).toBe('');
        expect(isValidCanonical(result)).toBe(false);
    });
});

describe('Referral URL SOT — raw code round-trip', () => {
    /**
     * Simulates what ProfileDropdown does: store raw referral_code in state → URL.
     * LoginSidebar reads it from ?ref=, normalizes it, sends to signup API.
     * Signup API canonicalizes it. Final canonical must match what's in DB.
     */
    test('raw code survives the full URL round-trip', () => {
        const rawDbCode = '8UHQ3KFZ4'; // What's stored in id_members.referral_code
        const urlCode = rawDbCode; // What ProfileDropdown puts in ?ref= (after fix)
        const fromUrlParam = decodeURIComponent(urlCode).trim().toUpperCase(); // LoginSidebar
        const canonical = fromUrlParam.replace(/[^A-Z0-9]/g, ''); // route.ts
        expect(canonical).toBe(rawDbCode);
    });

    test('hyphenated (old link) code survives the full URL round-trip', () => {
        const rawDbCode = '8UHQ3KFZ4';
        const oldUrlCode = '8UH-Q3K-FZ4'; // What old ProfileDropdown put in ?ref=
        const fromUrlParam = decodeURIComponent(oldUrlCode).trim().toUpperCase();
        const canonical = fromUrlParam.replace(/[^A-Z0-9]/g, '');
        expect(canonical).toBe(rawDbCode);
    });
});
