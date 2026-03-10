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
 * Cache Key Contract:
 *   price_snapshot_sku    → sku:{sku_id}:state:{state_code}:price
 *   market_winner_price   → winner:{state_code}:geo:{geo_cell}:sku:{sku_id}:mode:{offer_mode}
 *   market_winner_finance → finance:{state_code}:sku:{sku_id}:dp:{dp_bucket}:t:{tenure_months}:p:{policy}
 *   sku_accessory_matrix  → acc:{sku_id}:state:{state_code}:dealer:{dealer_id}
 *
 * TTL Policy:
 *   - Default TTL: 120 seconds
 *   - Stale-while-revalidate: enabled (Next.js unstable_cache handles this)
 *
 * Invalidation:
 *   - On worker upsert → purge only impacted cache keys via revalidateTag()
 *   - version_hash check on reads → stale row triggers immediate refresh
 *
 * Heavy source tables (cat_price_dealer, fin_marketplace_schemes, etc.)
 * are NEVER cached at request-time.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';

// ─────────────────────────────────────────────
// TTL & SWR Config
// ─────────────────────────────────────────────
const WINNER_CACHE_TTL = 120; // seconds
const WINNER_CACHE_SWR = 60; // stale-while-revalidate window (seconds)

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
// Cache Tag Builders (for invalidation via revalidateTag)
// ─────────────────────────────────────────────

/** Tag for all price snapshot entries under a sku+state */
export function tagPriceSnapshot(sku_id: string, state_code: string): string {
    return `price-snap:${sku_id}:${state_code}`;
}

/** Tag for all winner price entries under a sku+state+geo+mode */
export function tagWinnerPrice(sku_id: string, state_code: string, geo_cell: string): string {
    return `winner-price:${sku_id}:${state_code}:${geo_cell}`;
}

/** Tag for all finance winner entries under a sku+state */
export function tagWinnerFinance(sku_id: string, state_code: string): string {
    return `winner-finance:${sku_id}:${state_code}`;
}

/** Tag for all accessory matrix entries under a sku+state+dealer */
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
 * Read price_snapshot_sku with caching.
 * Returns null on miss or stale version_hash (stale triggers background recompute).
 */
export async function getCachedPriceSnapshot(
    sku_id: string,
    state_code: string,
    expectedVersionHash?: string
): Promise<PriceSnapshotRow | null> {
    const tag = tagPriceSnapshot(sku_id, state_code);
    const key = buildPriceSnapshotKey(sku_id, state_code);

    const fetchFn = unstable_cache(
        async () => {
            const supabase = createAdminClient();
            const { data, error } = await supabase
                .from('price_snapshot_sku')
                .select('*')
                .eq('sku_id', sku_id)
                .eq('state_code', state_code)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] price_snapshot_sku read error: ${error.message}`);
                return null;
            }
            return data as PriceSnapshotRow | null;
        },
        [key],
        {
            revalidate: WINNER_CACHE_TTL,
            tags: [tag],
        }
    );

    const row = await fetchFn();

    // version_hash staleness guard — if provided and mismatched, force refresh
    if (row && expectedVersionHash && row.version_hash !== expectedVersionHash) {
        revalidateTag(tag);
        return null; // caller triggers fallback / recompute
    }

    return row;
}

/**
 * Read market_winner_price with caching.
 * Falls back to legacy path on miss.
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
        async () => {
            const supabase = createAdminClient();
            const { data, error } = await supabase
                .from('market_winner_price')
                .select('*')
                .eq('state_code', state_code)
                .eq('geo_cell', geo_cell)
                .eq('sku_id', sku_id)
                .eq('offer_mode', offer_mode)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] market_winner_price read error: ${error.message}`);
                return null;
            }
            return data as WinnerPriceRow | null;
        },
        [key],
        {
            revalidate: WINNER_CACHE_TTL,
            tags: [tag],
        }
    );

    return fetchFn();
}

/**
 * Read market_winner_finance with caching.
 * Falls back to legacy get_fin_winner on miss (deprecated; EXPECTED_SEMANTIC_GAP accepted).
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
        async () => {
            const supabase = createAdminClient();
            const { data, error } = await supabase
                .from('market_winner_finance')
                .select('*')
                .eq('state_code', state_code)
                .eq('sku_id', sku_id)
                .eq('dp_bucket', dp_bucket)
                .eq('tenure_months', tenure_months)
                .eq('policy', policy)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] market_winner_finance read error: ${error.message}`);
                return null;
            }
            return data as WinnerFinanceRow | null;
        },
        [key],
        {
            revalidate: WINNER_CACHE_TTL,
            tags: [tag],
        }
    );

    return fetchFn();
}

/**
 * Read sku_accessory_matrix with caching.
 * dealer_id is part of the primary key (winner-dealer-only granularity).
 */
export async function getCachedAccessoryMatrix(
    sku_id: string,
    state_code: string,
    dealer_id: string
): Promise<AccessoryMatrixRow | null> {
    const tag = tagAccessoryMatrix(sku_id, state_code, dealer_id);
    const key = buildAccessoryMatrixKey(sku_id, state_code, dealer_id);

    const fetchFn = unstable_cache(
        async () => {
            const supabase = createAdminClient();
            const { data, error } = await supabase
                .from('sku_accessory_matrix')
                .select('*')
                .eq('sku_id', sku_id)
                .eq('state_code', state_code)
                .eq('dealer_id', dealer_id)
                .maybeSingle();

            if (error) {
                console.error(`[winner-cache] sku_accessory_matrix read error: ${error.message}`);
                return null;
            }
            return data as AccessoryMatrixRow | null;
        },
        [key],
        {
            revalidate: WINNER_CACHE_TTL,
            tags: [tag],
        }
    );

    return fetchFn();
}

// ─────────────────────────────────────────────
// Cache Invalidation (called by worker upsert path)
// ─────────────────────────────────────────────

/**
 * Invalidates price_snapshot_sku cache entries for a given sku+state.
 * Called by worker after PRICE_SNAPSHOT job completes.
 */
export function invalidatePriceSnapshot(sku_id: string, state_code: string): void {
    revalidateTag(tagPriceSnapshot(sku_id, state_code));
}

/**
 * Invalidates market_winner_price cache entries for a given sku+state+geo combination.
 * Called by worker after WINNER_PRICE job completes.
 * All offer_mode variants are invalidated together (same tag scope).
 */
export function invalidateWinnerPrice(sku_id: string, state_code: string, geo_cell: string): void {
    revalidateTag(tagWinnerPrice(sku_id, state_code, geo_cell));
}

/**
 * Invalidates market_winner_finance cache entries for a given sku+state.
 * Called by worker after WINNER_FINANCE job completes.
 * All dp_bucket × tenure_months combinations invalidated together.
 */
export function invalidateWinnerFinance(sku_id: string, state_code: string): void {
    revalidateTag(tagWinnerFinance(sku_id, state_code));
}

/**
 * Invalidates sku_accessory_matrix cache entries for a given sku+state+dealer.
 * Called by worker after ACCESSORY_MATRIX job completes.
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
    /** true if any of the 4 reads was a cache miss → fallback should be logged */
    hasMiss: boolean;
    /** DB calls made in this request (1 per miss, 0 per hit) */
    dbCalls: number;
}

/**
 * Full PDP winner read path — 4 cached reads in parallel.
 * Returns all 4 precomputed rows for one PDP request.
 *
 * Usage: replace legacy get_market_candidate_offers + winnerEngine.rankCandidates()
 * when NEXT_PUBLIC_USE_CANDIDATE_RPC is true.
 *
 * Fallback (hasMiss === true): invoke legacy path + enqueue recompute job.
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

    // All 4 reads fired in parallel — each individually cached
    const [priceSnapshot, winnerPrice, winnerFinance] = await Promise.all([
        getCachedPriceSnapshot(sku_id, state_code),
        getCachedWinnerPrice(state_code, geo_cell, sku_id, offer_mode),
        getCachedWinnerFinance(state_code, sku_id, dp_bucket, tenure_months, policy),
    ]);

    // Accessory matrix requires winner_dealer_id from winnerPrice
    const winner_dealer_id = winnerPrice?.winner_dealer_id ?? null;
    const accessoryMatrix = winner_dealer_id
        ? await getCachedAccessoryMatrix(sku_id, state_code, winner_dealer_id)
        : null;

    const misses = [priceSnapshot, winnerPrice, winnerFinance, accessoryMatrix].filter(r => r === null).length;

    return {
        priceSnapshot,
        winnerPrice,
        winnerFinance,
        accessoryMatrix,
        hasMiss: misses > 0,
        dbCalls: misses, // each null = 1 DB call was made (cache miss hit DB)
    };
}
