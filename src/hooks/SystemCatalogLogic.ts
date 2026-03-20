import { useState, useEffect } from 'react';
import { ProductVariant } from '@/types/productMaster';
import { getErrorMessage } from '@/lib/utils/errorMessage';

function isAbortLikeError(err: unknown): boolean {
    const message = (getErrorMessage(err) || '').toLowerCase();
    if (message.includes('aborterror') || message.includes('operation was aborted')) return true;

    const candidate = err as { name?: string; message?: string };
    const name = String(candidate?.name || '').toLowerCase();
    const raw = String(candidate?.message || '').toLowerCase();
    return name === 'aborterror' || raw.includes('operation was aborted') || raw.includes('aborterror');
}

type CatalogSnapshotResponse = {
    products: ProductVariant[];
    error?: string;
    context?: {
        dealerId?: string | null;
        dealerName?: string | null;
        studioId?: string | null;
        district?: string | null;
        stateCode?: string;
        source?: string;
    };
};

const CATALOG_CACHE_TTL_MS = 60_000;

export function useSystemCatalogLogic(
    leadId?: string,
    options?: { allowStateOnly?: boolean; ssrItems?: ProductVariant[] }
) {
    const allowStateOnly = options?.allowStateOnly ?? true;
    const ssrItems = options?.ssrItems ?? [];

    // Seed from SSR immediately so first render shows cards without loading spinner.
    // The background refresh below will overwrite with location-specific pricing.
    const [items, setItems] = useState<ProductVariant[]>(() => ssrItems);
    const [isLoading, setIsLoading] = useState(() => ssrItems.length === 0);
    const [error, setError] = useState<string | null>(null);
    const [skuCount, setSkuCount] = useState<number>(() =>
        ssrItems.reduce((sum, item) => sum + (item.skuIds?.length || 0), 0)
    );
    const [locationVersion, setLocationVersion] = useState(0);
    const [needsLocation, setNeedsLocation] = useState(false);

    const resolveLocationFromCache = () => {
        if (typeof window === 'undefined') {
            return { stateCode: null, district: null };
        }

        const cached = localStorage.getItem('bkmb_user_pincode');
        if (!cached) {
            return { stateCode: null, district: null };
        }

        try {
            const data = JSON.parse(cached) as {
                state?: string;
                stateCode?: string;
                district?: string;
            };

            let code = data.stateCode;
            if (!code && data.state) {
                const stateMap: Record<string, string> = {
                    MAHARASHTRA: 'MH',
                    KARNATAKA: 'KA',
                    DELHI: 'DL',
                    GUJARAT: 'GJ',
                    TAMIL_NADU: 'TN',
                    TELANGANA: 'TS',
                    UTTAR_PRADESH: 'UP',
                    WEST_BENGAL: 'WB',
                    RAJASTHAN: 'RJ',
                };
                code = stateMap[data.state.toUpperCase()] || data.state.substring(0, 2).toUpperCase();
            }

            return {
                stateCode: code || null,
                district: data.district || null,
            };
        } catch {
            return { stateCode: null, district: null };
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleLocationChanged = () => setLocationVersion(prev => prev + 1);
        window.addEventListener('locationChanged', handleLocationChanged);
        return () => window.removeEventListener('locationChanged', handleLocationChanged);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
            const res = await fetch(input, {
                ...init,
                signal: controller.signal,
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            return (await res.json()) as T;
        };

        const fetchItems = async () => {
            let wasAborted = false;
            let hadWarmCache = false;
            try {
                setError(null);

                const cachedLocation = resolveLocationFromCache();
                const district = cachedLocation.district;
                const state = cachedLocation.stateCode;

                if (!district && !leadId && !allowStateOnly) {
                    setNeedsLocation(true);
                    setItems([]);
                    return;
                }
                setNeedsLocation(false);

                const params = new URLSearchParams();
                if (leadId) params.set('leadId', leadId);
                if (district) params.set('district', district);
                if (state) params.set('state', state);
                const cacheKey = `bmb_catalog_snapshot:${params.toString()}`;

                if (typeof window !== 'undefined') {
                    try {
                        const raw = sessionStorage.getItem(cacheKey);
                        if (raw) {
                            const parsed = JSON.parse(raw) as {
                                ts: number;
                                payload: CatalogSnapshotResponse;
                            };
                            if (Date.now() - parsed.ts < CATALOG_CACHE_TTL_MS && parsed.payload?.products?.length) {
                                const warm = parsed.payload;
                                const warmItems = warm.products || [];
                                setItems(warmItems);
                                setSkuCount(warmItems.reduce((sum, item) => sum + (item.skuIds?.length || 0), 0));
                                setIsLoading(false);
                                hadWarmCache = true;
                            }
                        }
                    } catch {
                        // Ignore invalid cache payloads and continue with network fetch.
                    }
                }

                if (!hadWarmCache) {
                    // Only show spinner if we have no SSR data to display
                    if (ssrItems.length === 0) setIsLoading(true);
                }

                const payload = await fetchJson<CatalogSnapshotResponse>(`/api/store/catalog?${params.toString()}`);
                if (payload.error) {
                    throw new Error(payload.error);
                }

                const nextItems = payload.products || [];
                setItems(nextItems);
                setSkuCount(nextItems.reduce((sum, item) => sum + (item.skuIds?.length || 0), 0));

                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
                    } catch {
                        // Storage full/unavailable should not block catalog render.
                    }
                }
            } catch (err: unknown) {
                if (isAbortLikeError(err)) {
                    wasAborted = true;
                    return;
                }
                if (!hadWarmCache) {
                    setError(err instanceof Error ? getErrorMessage(err) : 'Unknown error');
                    // Only clear items if we have no SSR fallback
                    if (ssrItems.length === 0) setItems([]);
                }
            } finally {
                if (!wasAborted) {
                    setIsLoading(false);
                }
            }
        };

        // Check whether we can defer the initial client fetch:
        // If SSR data is present AND the user has no location-specific context
        // (no leadId, no district in localStorage), the SSR payload is already
        // sufficient for first paint. Defer the background refresh so it doesn't
        // compete with LCP rendering.
        const cachedLocation = resolveLocationFromCache();
        const hasUserContext = leadId || cachedLocation.district;
        const hasSsrCover = ssrItems.length > 0 && !hasUserContext;

        let timerId: ReturnType<typeof setTimeout> | undefined;
        if (hasSsrCover) {
            // Defer background refresh 3s — SSR cards are visible at LCP time.
            // After 3s the refresh silently updates with any location-specific pricing.
            timerId = setTimeout(fetchItems, 3000);
        } else {
            fetchItems();
        }

        return () => {
            if (timerId !== undefined) clearTimeout(timerId);
            controller.abort();
        };
    }, [leadId, locationVersion, allowStateOnly]);

    return {
        items,
        isLoading,
        error,
        skuCount,
        needsLocation,
        resolvedDealerId: null,
        resolvedStudioId: null,
        resolvedDealerName: null,
    };
}
