/**
 * winner-cache.ts
 * Phase 6D — Runtime Cache Layer for Winner-Read Path
 *
 * Caches only the 4 runtime read tables:
 *   - price_snapshot_sku
 *   - market_winner_price
 *   - market_winner_finance
 *   - sku_accessory_matrix
 *
 * Cache Key Contract (ARCH-PRECOMPUTE-V1 §Cache Keys):
 *   price_snapshot_sku    → sku:{sku_id}:state:{state_code}:price
 *   market_winner_price   → winner:{state_code}:geo:{geo_cell}:sku:{sku_id}:mode:{offer_mode}
 *   market_winner_finance → finance:{state_code}:sku:{sku_id}:dp:{dp_bucket}:t:{tenure_months}:p:{policy}
 *   sku_accessory_matrix  → acc:{sku_id}:state:{state_code}:dealer:{dealer_id}
 *
 * TTL Policy:
 *   - Default TTL: 120 seconds
 *   - Stale-while-revalidate: implicit via Next.js unstable_cache (revalidate option)
 *
 * Invalidation:
 *   - On worker upsert → purge only impacted cache keys via revalidateTag()
 *   - version_hash check on reads → stale row detected → immediate cache bust
 *
 * NOT cached at request-time (heavy source tables):
 *   cat_price_dealer, fin_marketplace_schemes, cat_price_state_mh, etc.
 */

import { adminClient } from '@/lib/supabase/admin';
import { revalidateTag, unstable_cache } from 'next/cache';

// ─────────────────────────────────────────────
// TTL Config
// ─────────────────────────────────────────────
const WINNER_CACHE_TTL = 120; // seconds — locked in Phase 6D spec

// ─────────────────────────────────────────────
// Cache Key Builders (matches ARCH contract)
// ─────────────────────────────────────────────

export function buildPriceSnapshotKey(sku_id: string, state_code: string): string {
    return `sku:${sku_id}:state:${state_code}:price`;
}

export function buildWinnerPriceKey(state_code: string, geo_cell: string, sku_id: string, offer_mode: string): string {
    return `winner:${state_code}:geo:${geo_cell}:sku:${sku_id}:mode:${offer_mode}`;
}

export function buildWinnerFinanceKey(
    state_code: string,
    sku_id: string,
    dp_bucket: number,
    tenure_months: number,
    policy = 'APR'
): string {
    return `finance:${state_code}:sku:${sku_id}:dp:${dp_bucket}:t:${tenure_months}:p:${policy}`;
}

export function buildAccessoryMatrixKey(sku_id: string, state_code: string, dealer_id: string): string {
    return `acc:${sku_id}:state:${state_code}:dealer:${dealer_id}`;
}

// ─────────────────────────────────────────────
// Cache Tag Builders (for targeted invalidation)
// ─────────────────────────────────────────────

/** Scope: all offer variants for sku+state */
export function tagPriceSnapshot(sku_id: string, state_code: string): string {
    return `price-snap:${sku_id}:${state_code}`;
}

/** Scope: all offer_modes for sku+state+geo (BEST_OFFER + FAST_DELIVERY invalidated together) */
export function tagWinnerPrice(sku_id: string, state_code: string, geo_cell: string): string {
    return `winner-price:${sku_id}:${state_code}:${geo_cell}`;
}

/** Scope: all dp_bucket × tenure_months for sku+state */
export function tagWinnerFinance(sku_id: string, state_code: string): string {
    return `winner-finance:${sku_id}:${state_code}`;
}

/** Scope: single dealer's accessory matrix for sku+state+dealer */
export function tagAccessoryMatrix(sku_id: string, state_code: string, dealer_id: string): string {
    return `acc-matrix:${sku_id}:${state_code}:${dealer_id}`;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PriceSnapshotRow {
    sku_id: string;
    state_code: string;
    ex_showroom: number;
    rto_json: Record<string, unknown>;
    insurance_json: Record<string, unknown>;
    on_road_base: number;
    computed_at: string;
    version_hash: string;
}

export interface WinnerPriceRow {
    state_code: string;
    geo_cell: string;
    sku_id: string;
    offer_mode: string;
    winner_dealer_id: string;
    winner_studio_id: string | null;
    winner_offer_amount: number;
    delivery_charge: number;
    tat_effective_hours: number;
    distance_km: number;
    is_serviceable: boolean;
    final_effective_price: number;
    runner_up_json: unknown;
    computed_at: string;
    version_hash: string;
}

export interface WinnerFinanceRow {
    state_code: string;
    sku_id: string;
    dp_bucket: number;
    tenure_months: number;
    policy: string;
    winner_lender_id: string;
    winner_scheme_code: string;
    apr: number;
    total_cost: number;
    emi: number;
    processing_fee: number;
    charges_json: unknown;
    computed_at: string;
    version_hash: string;
}

export interface AccessoryMatrixRow {
    sku_id: string;
    state_code: string;
    dealer_id: string;
    accessories_json: AccessoryItem[];
    computed_at: string;
    version_hash: string;
}

export interface AccessoryItem {
    accessory_id: string;
    compatible: boolean;
    mrp: number;
    dealer_delta: number;
    final_price: number;
}

// ─────────────────────────────────────────────
// Cache Read Helpers
// ─────────────────────────────────────────────

/**
 * Read price_snapshot_sku with TTL cache.
 * version_hash guard: if row is stale vs expected hash, bust cache and return null.
 * Caller should invoke legacy fallback + enqueue recompute on null.
 */
export async function getCachedPriceSnapshot(
    sku_id: string,
    state_code: string,
    expectedVersionHash?: string
): Promise<PriceSnapshotRow | null> {
    const tag = tagPriceSnapshot(sku_id, state_code);
    const key = buildPriceSnapshotKey(sku_id, state_code);

    const fetchFn = unstable_cache(
        async (): Promise<PriceSnapshotRow | null> => {
            const { data, error } = await adminClient
                .from('price_snapshot_sku')
                .select('*')
                .eq('sku_id', sku_id)
                .eq('state_code', state_code)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] price_snapshot_sku error: ${error.message}`);
                return null;
            }
            return data as PriceSnapshotRow | null;
        },
        [key],
        { revalidate: WINNER_CACHE_TTL, tags: [tag] }
    );

    const row = await fetchFn();

    // version_hash staleness guard
    if (row && expectedVersionHash && row.version_hash !== expectedVersionHash) {
        // Purge stale cache entry — next request will re-fetch from DB
        revalidateTag(tag);
        return null;
    }

    return row;
}

/**
 * Read market_winner_price with TTL cache.
 * Returns null on miss — caller invokes legacy path + enqueue WINNER_PRICE job.
 */
export async function getCachedWinnerPrice(
    state_code: string,
    geo_cell: string,
    sku_id: string,
    offer_mode: string
): Promise<WinnerPriceRow | null> {
    const tag = tagWinnerPrice(sku_id, state_code, geo_cell);
    const key = buildWinnerPriceKey(state_code, geo_cell, sku_id, offer_mode);

    const fetchFn = unstable_cache(
        async (): Promise<WinnerPriceRow | null> => {
            const { data, error } = await adminClient
                .from('market_winner_price')
                .select('*')
                .eq('state_code', state_code)
                .eq('geo_cell', geo_cell)
                .eq('sku_id', sku_id)
                .eq('offer_mode', offer_mode)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] market_winner_price error: ${error.message}`);
                return null;
            }
            return data as WinnerPriceRow | null;
        },
        [key],
        { revalidate: WINNER_CACHE_TTL, tags: [tag] }
    );

    return fetchFn();
}

/**
 * Read market_winner_finance with TTL cache.
 * Finance gaps vs legacy get_fin_winner are EXPECTED_SEMANTIC_GAP (not failures).
 */
export async function getCachedWinnerFinance(
    state_code: string,
    sku_id: string,
    dp_bucket: number,
    tenure_months: number,
    policy = 'APR'
): Promise<WinnerFinanceRow | null> {
    const tag = tagWinnerFinance(sku_id, state_code);
    const key = buildWinnerFinanceKey(state_code, sku_id, dp_bucket, tenure_months, policy);

    const fetchFn = unstable_cache(
        async (): Promise<WinnerFinanceRow | null> => {
            const { data, error } = await adminClient
                .from('market_winner_finance')
                .select('*')
                .eq('state_code', state_code)
                .eq('sku_id', sku_id)
                .eq('dp_bucket', dp_bucket)
                .eq('tenure_months', tenure_months)
                .eq('policy', policy)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] market_winner_finance error: ${error.message}`);
                return null;
            }
            return data as WinnerFinanceRow | null;
        },
        [key],
        { revalidate: WINNER_CACHE_TTL, tags: [tag] }
    );

    return fetchFn();
}

/**
 * Read sku_accessory_matrix with TTL cache.
 * Keyed by winner_dealer_id (winner-dealer-only granularity per ARCH decision #5).
 */
export async function getCachedAccessoryMatrix(
    sku_id: string,
    state_code: string,
    dealer_id: string
): Promise<AccessoryMatrixRow | null> {
    const tag = tagAccessoryMatrix(sku_id, state_code, dealer_id);
    const key = buildAccessoryMatrixKey(sku_id, state_code, dealer_id);

    const fetchFn = unstable_cache(
        async (): Promise<AccessoryMatrixRow | null> => {
            const { data, error } = await adminClient
                .from('sku_accessory_matrix')
                .select('*')
                .eq('sku_id', sku_id)
                .eq('state_code', state_code)
                .eq('dealer_id', dealer_id)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] sku_accessory_matrix error: ${error.message}`);
                return null;
            }
            return data as AccessoryMatrixRow | null;
        },
        [key],
        { revalidate: WINNER_CACHE_TTL, tags: [tag] }
    );

    return fetchFn();
}

// ─────────────────────────────────────────────
// Cache Invalidation (called on worker upsert)
// ─────────────────────────────────────────────

/**
 * Purge price_snapshot_sku cache for a sku+state.
 * Call after PRICE_SNAPSHOT worker job completes its upsert.
 */
export function invalidatePriceSnapshot(sku_id: string, state_code: string): void {
    revalidateTag(tagPriceSnapshot(sku_id, state_code));
}

/**
 * Purge market_winner_price cache for a sku+state+geo.
 * Invalidates ALL offer_modes (BEST_OFFER + FAST_DELIVERY) in one tag call.
 * Call after WINNER_PRICE worker job completes its upsert.
 */
export function invalidateWinnerPrice(sku_id: string, state_code: string, geo_cell: string): void {
    revalidateTag(tagWinnerPrice(sku_id, state_code, geo_cell));
}

/**
 * Purge market_winner_finance cache for a sku+state.
 * Invalidates ALL dp_bucket × tenure_months combinations in one tag call.
 * Call after WINNER_FINANCE worker job completes its upsert.
 */
export function invalidateWinnerFinance(sku_id: string, state_code: string): void {
    revalidateTag(tagWinnerFinance(sku_id, state_code));
}

/**
 * Purge sku_accessory_matrix cache for a sku+state+dealer.
 * Call after ACCESSORY_MATRIX worker job completes its upsert.
 */
export function invalidateAccessoryMatrix(sku_id: string, state_code: string, dealer_id: string): void {
    revalidateTag(tagAccessoryMatrix(sku_id, state_code, dealer_id));
}

// ─────────────────────────────────────────────
// Compound Read: Full PDP Winner Resolution
// ─────────────────────────────────────────────

export interface WinnerReadResult {
    priceSnapshot: PriceSnapshotRow | null;
    winnerPrice: WinnerPriceRow | null;
    winnerFinance: WinnerFinanceRow | null;
    accessoryMatrix: AccessoryMatrixRow | null;
    /** true if any required precomputed row (price/winner/finance) is absent */
    hasMiss: boolean;
    /**
     * Conservative upper-bound metric, not exact DB call count.
     * Computed from absent rows because null from unstable_cache can be either:
     * - fresh miss (DB was queried), or
     * - cached-null hit (DB was NOT queried).
     */
    dbCalls: number;
}

/**
 * readWinnersForPdp()
 *
 * Phase 6D primary PDP read path — fires 4 cached reads in parallel.
 * Replaces legacy: get_market_candidate_offers + winnerEngine.rankCandidates()
 *
 * On cache hit (all 4 rows exist): 0 DB calls = full cache hit.
 * On partial miss: 1–3 DB calls (vs 3–5 legacy baseline).
 * On full miss: 4 DB calls (equivalent to legacy, triggers background recompute).
 */
export async function readWinnersForPdp(params: {
    sku_id: string;
    state_code: string;
    geo_cell: string;
    offer_mode: string;
    dp_bucket: number;
    tenure_months: number;
    policy?: string;
}): Promise<WinnerReadResult> {
    const { sku_id, state_code, geo_cell, offer_mode, dp_bucket, tenure_months, policy = 'APR' } = params;

    // --- Step 1: Fire 3 parallel cached reads ---
    const [priceSnapshot, winnerPrice, winnerFinance] = await Promise.all([
        getCachedPriceSnapshot(sku_id, state_code),
        getCachedWinnerPrice(state_code, geo_cell, sku_id, offer_mode),
        getCachedWinnerFinance(state_code, sku_id, dp_bucket, tenure_months, policy),
    ]);

    // --- Step 2: Accessory matrix — requires winner_dealer_id from winnerPrice ---
    const winner_dealer_id = winnerPrice?.winner_dealer_id ?? null;
    const accessoryMatrix = winner_dealer_id
        ? await getCachedAccessoryMatrix(sku_id, state_code, winner_dealer_id)
        : null;

    // --- Step 3: Determine if fallback is needed ---
    const requiredMisses = [priceSnapshot, winnerPrice, winnerFinance].filter(r => r === null).length;
    const accessoryMiss = winner_dealer_id && accessoryMatrix === null ? 1 : 0;
    const dbCalls = requiredMisses + accessoryMiss;

    return {
        priceSnapshot,
        winnerPrice,
        winnerFinance,
        accessoryMatrix,
        hasMiss: requiredMisses > 0,
        dbCalls,
    };
}
