import { unstable_cache } from 'next/cache';
import { headers } from 'next/headers';

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
    const headerList = await headers();
    const noCache = headerList.get('x-no-cache') === '1';

    if (!IS_PROD || noCache) {
        // Bypass cache in development or when requested via header
        return fn();
    }

    // Wrap in unstable_cache for production
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
