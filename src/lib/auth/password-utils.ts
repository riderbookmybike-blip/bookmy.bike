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
    // We hash the result to ensure it's deterministic and safe.
    // Supabase Policy: Uppercase + Symbol + Number + Lowercase.
    // Hex provides Lowercase + Number. We prefix "A!" to satisfy the rest.
    // Length: 64 (hex) + 2 (prefix) = 66 chars (valid < 72).
    const hash = createHash('sha256').update(rawPassword).digest('hex');
    return `A!${hash}`;
}
