import { createHash } from 'crypto';

export function getAuthPassword(phone: string): string {
    const secret = process.env.MIGRATION_PASSWORD_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Fail Fast in Production
    if (isProduction && !secret) {
        throw new Error(
            'CRITICAL: MIGRATION_PASSWORD_SECRET is missing in production environment. Authentication cannot proceed safely.'
        );
    }

    let rawPassword;

    // 2. Deterministic Password (Preferred)
    if (secret) {
        rawPassword = `MSG91_${phone}_${secret}`;
    } else {
        // 3. Fallback Random Password (Dev/Preview only)
        console.warn('[Auth] MIGRATION_PASSWORD_SECRET missing. Using random fallback password for session.');
        rawPassword = `OTP_${phone}_${crypto.randomUUID()}`;
    }

    // CRITICAL: Supabase/Bcrypt has a 72-char limit.
    // We hash the result to ensure it's always 64 characters (SHA-256 hex) regardless of input length.
    return createHash('sha256').update(rawPassword).digest('hex');
}
