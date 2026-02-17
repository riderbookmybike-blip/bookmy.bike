const IS_PROD = process.env.NODE_ENV === 'production';

interface CacheOptions {
    revalidate?: number | false;
    tags?: string[];
}

/**
 * A wrapper for unstable_cache that only applies caching in Production.
 * In development, it executes the function directly.
 */
export async function withCache<T>(fn: () => Promise<T>, keyParts: string[], options: CacheOptions = {}): Promise<T> {
    // Client bundles cannot import server-only modules like `next/headers`.
    if (typeof window !== 'undefined') {
        return fn();
    }

    let noCache = false;
    try {
        const { headers } = await import('next/headers');
        const headerList = await headers();
        noCache = headerList.get('x-no-cache') === '1';
    } catch {
        // If request headers are unavailable in this execution context, keep default noCache=false.
    }

    if (!IS_PROD || noCache) {
        // Bypass cache in development or when requested via header
        return fn();
    }

    // Wrap in unstable_cache for production
    const { unstable_cache } = await import('next/cache');
    const cachedFn = unstable_cache(async () => fn(), keyParts, options);

    return cachedFn();
}

/**
 * Generate a consistent, stable cache key for complex filters.
 */
export function generateFilterKey(filters: Record<string, any>): string {
    const sortedKeys = Object.keys(filters).sort();
    const parts = sortedKeys.map(key => `${key}:${JSON.stringify(filters[key])}`);
    return parts.join('|');
}
