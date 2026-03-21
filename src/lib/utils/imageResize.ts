/**
 * Supabase Storage image resize helper.
 *
 * Converts a Supabase `/object/public/` URL to the `/render/image/public/`
 * endpoint which resizes on-the-fly. The render endpoint is available on all
 * Supabase plans and returns the image at the requested width with quality.
 *
 * Example:
 *   https://xxxx.supabase.co/storage/v1/object/public/vehicles/catalog/img.png
 * →
 *   https://xxxx.supabase.co/storage/v1/render/image/public/vehicles/catalog/img.png?width=640&quality=75
 *
 * Falls back to the original URL for non-Supabase or local paths.
 */
export function supabaseResized(url: string | null | undefined, width: number, quality = 75): string | undefined {
    if (!url) return undefined;
    // Only transform Supabase Storage /object/public/ URLs
    const match = url.match(/^(https:\/\/[^/]+\/storage\/v1)\/object\/public\/(.+)$/);
    if (!match) return url;
    const [, base, path] = match;
    return `${base}/render/image/public/${path}?width=${width}&quality=${quality}&format=webp`;
}

/**
 * Appends a stable image version token for cache-busting only when media changes.
 */
export function appendImageVersion(
    url: string | null | undefined,
    version: string | null | undefined
): string | undefined {
    if (!url) return undefined;
    if (!version) return url;
    try {
        const parsed = new URL(url, 'https://local.invalid');
        parsed.searchParams.set('iv', version);
        if (/^https?:\/\//i.test(url)) return parsed.toString();
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}iv=${encodeURIComponent(version)}`;
    }
}
