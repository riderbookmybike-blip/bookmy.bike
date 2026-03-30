/**
 * winnerResolver.ts — SKU District Winner Resolution Layer
 *
 * Winner = dealer with best offer_amount from cat_price_dealer ONLY.
 * Base price / RTO / insurance are NEVER used in ranking.
 *
 * ── Cache Key Contract (frozen) ─────────────────────────────────────
 *  winner:{state}:{district}:{sku}       TTL 5 min, SWR allowed
 *  winner_default:{state}:{sku}          TTL 5 min, warm on SSR
 *  districts:{state}                     TTL 24 h (static-ish)
 * ────────────────────────────────────────────────────────────────────
 *
 * Invalidation: after recompute, purge winner:* + winner_default:* for
 * impacted skuId/state — NOT a blanket purge (keeps other districts hot).
 */

import { adminClient } from '@/lib/supabase/admin';

// ─── Defaults ─────────────────────────────────────────────────────
export const DEFAULT_DISTRICT = 'Mumbai City';
export const DEFAULT_STATE_CODE = 'MH';

// ─── TTLs ─────────────────────────────────────────────────────────
const WINNER_TTL_MS = 5 * 60 * 1000; // 5 min
const DISTRICTS_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const SWR_GRACE_MS = 60 * 1000; // 1 min after TTL = stale-ok window

// ─── In-Process Cache ─────────────────────────────────────────────
interface CacheEntry<T> {
    data: T;
    cachedAt: number;
    ttl: number;
}
const _cache = new Map<string, CacheEntry<unknown>>();

function _get<T>(key: string): { data: T; isStale: boolean } | null {
    const e = _cache.get(key) as CacheEntry<T> | undefined;
    if (!e) return null;
    const age = Date.now() - e.cachedAt;
    if (age > e.ttl + SWR_GRACE_MS) {
        _cache.delete(key);
        return null;
    }
    return { data: e.data, isStale: age > e.ttl };
}
function _set<T>(key: string, data: T, ttl: number) {
    _cache.set(key, { data, cachedAt: Date.now(), ttl });
}

// ── Cache key builders (single source of truth for key format) ────
export const cacheKey = {
    winner: (state: string, district: string, sku: string) => `winner:${state}:${district}:${sku}`,
    default: (state: string, sku: string) => `winner_default:${state}:${sku}`,
    winnerRegion: (state: string, region: string, sku: string) => `winner_region:${state}:${region}:${sku}`,
    defaultRegion: (state: string, sku: string) => `winner_region_default:${state}:${sku}`,
    districts: (state: string) => `districts:${state}`,
    regions: (state: string) => `regions:${state}`,
};

/**
 * Purge winner + default cache for a specific (sku, state) after recompute.
 * Does NOT purge other SKUs or other states (targeted invalidation).
 */
export function purgeWinnerCache(skuId: string, stateCode: string): void {
    const prefix = `winner:${stateCode}:`;
    const regionPrefix = `winner_region:${stateCode}:`;
    const defaultKey = cacheKey.default(stateCode, skuId);
    const defaultRegionKey = cacheKey.defaultRegion(stateCode, skuId);
    _cache.delete(defaultKey);
    _cache.delete(defaultRegionKey);
    for (const key of _cache.keys()) {
        if (key.startsWith(prefix) && key.endsWith(`:${skuId}`)) {
            _cache.delete(key);
        }
        if (key.startsWith(regionPrefix) && key.endsWith(`:${skuId}`)) {
            _cache.delete(key);
        }
    }
}

/** Purge all cached data (e.g. admin-triggered bulk recompute) */
export function purgeAllWinnerCache(): void {
    for (const key of _cache.keys()) {
        if (key.startsWith('winner:') || key.startsWith('winner_default:') || key.startsWith('districts:')) {
            _cache.delete(key);
        }
    }
}

// ─── Types ────────────────────────────────────────────────────────
export interface WinnerResult {
    tenantId: string;
    winningOfferAmount: number;
    tatDays: number | null;
    tatEffectiveHours: number | null;
    district: string;
    stateCode: string;
    source: 'PRE_COMPUTED' | 'FALLBACK_ANY' | 'PRE_COMPUTED_REGION' | 'NONE';
    fromCache: boolean;
}

// ─── DB Fetch ─────────────────────────────────────────────────────
async function _fetchFromDb(skuIds: string[], district: string, stateCode: string): Promise<WinnerResult | null> {
    const { data, error } = await (adminClient as any)
        .from('sku_district_winners')
        .select('sku_id, district, state_code, tenant_id, winning_offer_amount, tat_days, tat_effective_hours')
        .in('sku_id', skuIds)
        .eq('district', district)
        .eq('state_code', stateCode)
        .limit(1)
        .maybeSingle();

    if (!error && data) {
        return {
            tenantId: data.tenant_id,
            winningOfferAmount: Number(data.winning_offer_amount || 0),
            tatDays: data.tat_days ?? null,
            tatEffectiveHours: data.tat_effective_hours ?? null,
            district: data.district,
            stateCode: data.state_code,
            source: 'PRE_COMPUTED',
            fromCache: false,
        };
    }

    // Fallback: 'ALL' district for this state
    const { data: fb } = await (adminClient as any)
        .from('sku_district_winners')
        .select('sku_id, district, state_code, tenant_id, winning_offer_amount, tat_days, tat_effective_hours')
        .in('sku_id', skuIds)
        .eq('district', 'ALL')
        .eq('state_code', stateCode)
        .limit(1)
        .maybeSingle();

    if (!fb) return null;
    return {
        tenantId: fb.tenant_id,
        winningOfferAmount: Number(fb.winning_offer_amount || 0),
        tatDays: fb.tat_days ?? null,
        tatEffectiveHours: fb.tat_effective_hours ?? null,
        district: fb.district,
        stateCode: fb.state_code,
        source: 'FALLBACK_ANY',
        fromCache: false,
    };
}

async function _fetchRegionFromDb(skuIds: string[], region: string, stateCode: string): Promise<WinnerResult | null> {
    const { data } = await (adminClient as any)
        .from('sku_region_winners')
        .select('sku_id, region, state_code, tenant_id, winning_offer_amount, tat_days, tat_effective_hours')
        .in('sku_id', skuIds)
        .eq('region', region)
        .eq('state_code', stateCode)
        .limit(1)
        .maybeSingle();

    if (!data) return null;
    return {
        tenantId: data.tenant_id,
        winningOfferAmount: Number(data.winning_offer_amount || 0),
        tatDays: data.tat_days ?? null,
        tatEffectiveHours: data.tat_effective_hours ?? null,
        district: data.region,
        stateCode: data.state_code,
        source: 'PRE_COMPUTED_REGION',
        fromCache: false,
    };
}

// ─── Public Resolvers ─────────────────────────────────────────────

/**
 * Resolve winner for a given district.
 * Cache key: `winner:{state}:{district}:{primarySkuId}`
 * SWR: returns stale immediately, refreshes in background.
 */
export async function resolveWinnerForDistrict(
    skuIds: string[],
    district: string,
    stateCode: string = DEFAULT_STATE_CODE
): Promise<WinnerResult | null> {
    if (!skuIds.length) return null;
    const primarySku = skuIds[0];
    const key = cacheKey.winner(stateCode, district, primarySku);

    const cached = _get<WinnerResult>(key);
    if (cached) {
        if (cached.isStale) {
            // SWR background refresh
            void _fetchFromDb(skuIds, district, stateCode).then(fresh => {
                if (fresh) _set(key, fresh, WINNER_TTL_MS);
            });
        }
        return { ...cached.data, fromCache: true };
    }

    const result = await _fetchFromDb(skuIds, district, stateCode);
    if (result) _set(key, result, WINNER_TTL_MS);
    return result;
}

/**
 * Resolve default Mumbai City winner — used on SSR PDP load.
 * Also warms `winner_default:{state}:{sku}` key.
 */
export async function resolveDefaultWinner(
    skuIds: string[],
    district: string = DEFAULT_DISTRICT,
    stateCode: string = DEFAULT_STATE_CODE
): Promise<WinnerResult | null> {
    if (!skuIds.length) return null;
    const primarySku = skuIds[0];
    const defKey = cacheKey.default(stateCode, primarySku);

    // Check default cache first
    const defCached = _get<WinnerResult>(defKey);
    if (defCached) {
        if (defCached.isStale) {
            void resolveWinnerForDistrict(skuIds, district, stateCode).then(fresh => {
                if (fresh) _set(defKey, fresh, WINNER_TTL_MS);
            });
        }
        return { ...defCached.data, fromCache: true };
    }

    const result = await resolveWinnerForDistrict(skuIds, district, stateCode);
    if (result) _set(defKey, result, WINNER_TTL_MS);
    return result;
}

export async function resolveWinnerForRegion(
    skuIds: string[],
    region: string,
    stateCode: string = DEFAULT_STATE_CODE
): Promise<WinnerResult | null> {
    if (!skuIds.length) return null;
    const primarySku = skuIds[0];
    const key = cacheKey.winnerRegion(stateCode, region, primarySku);
    const cached = _get<WinnerResult>(key);
    if (cached) {
        if (cached.isStale) {
            void _fetchRegionFromDb(skuIds, region, stateCode).then(fresh => {
                if (fresh) _set(key, fresh, WINNER_TTL_MS);
            });
        }
        return { ...cached.data, fromCache: true };
    }
    const result = await _fetchRegionFromDb(skuIds, region, stateCode);
    if (result) _set(key, result, WINNER_TTL_MS);
    return result;
}

export async function resolveDefaultRegionWinner(
    skuIds: string[],
    region: string,
    stateCode: string = DEFAULT_STATE_CODE
): Promise<WinnerResult | null> {
    if (!skuIds.length) return null;
    const primarySku = skuIds[0];
    const defKey = cacheKey.defaultRegion(stateCode, primarySku);
    const defCached = _get<WinnerResult>(defKey);
    if (defCached) {
        if (defCached.isStale) {
            void resolveWinnerForRegion(skuIds, region, stateCode).then(fresh => {
                if (fresh) _set(defKey, fresh, WINNER_TTL_MS);
            });
        }
        return { ...defCached.data, fromCache: true };
    }
    const result = await resolveWinnerForRegion(skuIds, region, stateCode);
    if (result) _set(defKey, result, WINNER_TTL_MS);
    return result;
}

/**
 * Fetch serviceable districts list.
 * Cache key: `districts:{state}` — 24 h TTL.
 */
export async function getServiceableDistricts(
    stateCode: string = DEFAULT_STATE_CODE
): Promise<{ district: string; state_code: string }[]> {
    const key = cacheKey.districts(stateCode);
    const cached = _get<{ district: string; state_code: string }[]>(key);
    if (cached) return cached.data;

    const { data } = await (adminClient as any)
        .from('v_serviceable_districts')
        .select('district, state_code')
        .eq('state_code', stateCode);

    const result = data || [];
    _set(key, result, DISTRICTS_TTL_MS);
    return result;
}

export async function getServiceableRegions(
    stateCode: string = DEFAULT_STATE_CODE
): Promise<{ region: string; state_code: string }[]> {
    const key = cacheKey.regions(stateCode);
    const cached = _get<{ region: string; state_code: string }[]>(key);
    if (cached) return cached.data;

    const { data } = await (adminClient as any)
        .from('v_serviceable_regions')
        .select('region, state_code')
        .eq('state_code', stateCode);

    const result = data || [];
    _set(key, result, DISTRICTS_TTL_MS);
    return result;
}

/**
 * True if two winners resolve to the same dealer tenant.
 * Used for same_as_default / same_as_current no-op guard.
 */
export function isSameWinner(a: WinnerResult | null, b: WinnerResult | null): boolean {
    if (!a || !b) return false;
    return a.tenantId === b.tenantId;
}
