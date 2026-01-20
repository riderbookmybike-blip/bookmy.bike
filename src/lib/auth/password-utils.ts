export function getAuthPassword(phone: string): string {
    const secret = process.env.MIGRATION_PASSWORD_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Fail Fast in Production
    if (isProduction && !secret) {
        throw new Error("CRITICAL: MIGRATION_PASSWORD_SECRET is missing in production environment. Authentication cannot proceed safely.");
    }

    // 2. Deterministic Password (Preferred)
    // Allows password persistence across logins if the secret doesn't change
    if (secret) {
        return `MSG91_${phone}_${secret}`;
    }

    // 3. Fallback Random Password (Dev/Preview only)
    // Prevents "Server misconfiguration" errors in non-prod environments when secret is missing.
    // Note: This effectively resets the user's password on every login, which is acceptable for OTP-only flows.
    console.warn('[Auth] MIGRATION_PASSWORD_SECRET missing. Using random fallback password for session.');
    return `OTP_${phone}_${crypto.randomUUID()}`;
}
