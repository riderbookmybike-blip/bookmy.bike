/**
 * Image optimization helper for next/image
 *
 * Returns `true` (unoptimized) ONLY for external URLs whose hostname is not
 * configured in next.config.ts `images.remotePatterns`.
 *
 * Returns `false` (optimized) for:
 *   - Local paths starting with `/` (served from the Next.js static dir)
 *   - Supabase Storage URLs (remotePatterns includes the Supabase project host)
 *   - Any hostname listed in next.config.ts remotePatterns
 *
 * Pass the return value directly as the `unoptimized` prop on <Image />.
 *
 * IMPORTANT: Keep this list in sync with next.config.ts images.remotePatterns.
 */

/** Exact hostname matches from remotePatterns */
const OPTIMIZED_HOSTNAMES_EXACT = new Set([
    'aytdeqjxxjxbgiyslubx.supabase.co', // Supabase project
    'www.heromotocorp.com',
    'vespaindia.com',
    'cdni.iconscout.com',
    'upload.wikimedia.org',
    'cdn.bajajauto.com',
]);

/** Wildcard suffix patterns from remotePatterns (`**.domain.tld`) */
const OPTIMIZED_HOSTNAME_SUFFIXES = [
    '.tvsmotorcycle.com',
    '.hondamotorcycle.co.in',
    '.yamahamotorindia.com',
    '.bajajfinserv.in',
    '.parivahan.gov.in',
    '.shriramfinance.in',
];

/**
 * Returns `true` when next/image cannot optimize the URL (unknown external host).
 * Use as: `<Image unoptimized={isNextImageUnoptimized(url)} ... />`
 */
export function isNextImageUnoptimized(url: string | null | undefined): boolean {
    if (!url) return true;

    // Local paths — always optimized by Next.js static pipeline
    if (url.startsWith('/')) return false;

    try {
        const { hostname } = new URL(url);

        if (OPTIMIZED_HOSTNAMES_EXACT.has(hostname)) return false;

        if (OPTIMIZED_HOSTNAME_SUFFIXES.some(suffix => hostname.endsWith(suffix))) return false;

        // Unknown external host — next/image would fail without a remotePattern
        return true;
    } catch {
        // Unparseable — don't attempt optimization
        return true;
    }
}
