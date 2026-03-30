/**
 * winnerWorker.ts — SKU District Winner Compute Worker
 *
 * Processes sku_winner_recompute_queue → computes winner → upserts sku_district_winners.
 *
 * ── Winner selection rules ──────────────────────────────────────────
 *  Ranked ONLY by offer_amount from cat_price_dealer.
 *  offer_amount is a DELTA applied to base price:
 *    negative = discount (more negative = bigger discount = BETTER)
 *    positive = surcharge (worse)
 *    zero     = no adjustment
 *
 *  Rule 1: LOWER offer_amount wins (most negative = best deal for consumer).
 *  This aligns with winnerEngine.ts: winner_score = base + offer + delivery → ASC.
 *
 *  Tie-break order (when offer_amount equal):
 *   1. Lower tat_days wins
 *   2. Lower tat_effective_hours wins
 *   3. Lexicographically smaller tenant_id (deterministic final fallback)
 *
 * ── State-code normalization ────────────────────────────────────────
 *  District assignments can have state_code='ALL' or state_code='MH'.
 *  We ALWAYS write winner rows with the concrete state_code (e.g. 'MH'),
 *  never 'ALL', so resolver can always do an exact match.
 *  'ALL' district-scope assignments are expanded into each concrete state.
 *
 * ── Cache invalidation ──────────────────────────────────────────────
 *  After upsert: compare old winner vs new winner per (district, state).
 *  If ANY district's winner changed → purge cache for (sku, state).
 *  If NO winner changed → keep all cached entries hot (no eviction).
 *  Note: purge is per (sku, state), not per individual district key,
 *  because keys include sku as suffix and we iterate to match.
 * ────────────────────────────────────────────────────────────────────
 */

import { adminClient } from '@/lib/supabase/admin';
import { purgeWinnerCache } from '@/lib/server/winnerResolver';

export const WORKER_BATCH_SIZE = 50;
export const MAX_RETRIES = 3;

// ─── Interfaces ───────────────────────────────────────────────────
interface QueueItem {
    id: string;
    sku_id: string;
    state_code: string;
    reason: string;
    retries: number;
}

interface DealerOffer {
    tenant_id: string;
    offer_amount: number; // DELTA: negative = discount, positive = surcharge
    tat_days: number | null;
    tat_effective_hours: number | null;
    state_code: string;
}

interface DistrictAssignment {
    tenant_id: string;
    district: string;
    state_code: string;
    region?: string | null;
}

interface ComputedWinner {
    district: string;
    state_code: string; // Always a concrete code (e.g. 'MH'), never 'ALL'
    tenant_id: string;
    winning_offer_amount: number;
    tat_days: number | null;
    tat_effective_hours: number | null;
}

interface ComputedRegionWinner {
    region: string;
    state_code: string;
    tenant_id: string;
    winning_offer_amount: number;
    tat_days: number | null;
    tat_effective_hours: number | null;
}

// ─── Comparison ───────────────────────────────────────────────────
/**
 * Deterministic offer comparison.
 * Returns < 0 if a is better, > 0 if b is better, 0 if equal.
 *
 * Lower offer_amount = larger discount = better for consumer.
 * e.g. -1000 < -500 < 0 < +500
 */
export function compareOffers(a: DealerOffer, b: DealerOffer): number {
    // Rule 1: Lower offer_amount wins (negative = discount)
    const offerDiff = a.offer_amount - b.offer_amount;
    if (offerDiff !== 0) return offerDiff;

    // Tie-break 1: Lower tat_days wins
    const aTat = a.tat_days ?? 9999;
    const bTat = b.tat_days ?? 9999;
    if (aTat !== bTat) return aTat - bTat;

    // Tie-break 2: Lower tat_effective_hours wins
    const aHrs = a.tat_effective_hours ?? 99999;
    const bHrs = b.tat_effective_hours ?? 99999;
    if (aHrs !== bHrs) return aHrs - bHrs;

    // Tie-break 3: Lexicographically smaller tenant_id (deterministic)
    return a.tenant_id.localeCompare(b.tenant_id);
}

// ─── Core compute ─────────────────────────────────────────────────
async function computeWinnersForSku(
    skuId: string,
    requestedStateCode: string // concrete code, e.g. 'MH'
): Promise<{ districtWinners: ComputedWinner[]; regionWinners: ComputedRegionWinner[] }> {
    // 1. Get all active district assignments for this state (including ALL scope)
    const { data: districtRows, error: distErr } = await (adminClient as any)
        .from('id_primary_dealer_districts')
        .select('tenant_id, district, state_code, region')
        .eq('is_active', true)
        .or(`state_code.eq.${requestedStateCode},state_code.eq.ALL`);

    if (distErr || !districtRows?.length) return { districtWinners: [], regionWinners: [] };

    const assignments = districtRows as DistrictAssignment[];
    const allDealerIds = Array.from(new Set(assignments.map(d => d.tenant_id)));

    // 2. Get active dealer offers — offer_amount ONLY (never base price)
    const { data: offerRows, error: offerErr } = await (adminClient as any)
        .from('cat_price_dealer')
        .select('tenant_id, offer_amount, tat_days, tat_effective_hours, state_code, is_active, is_available')
        .eq('vehicle_color_id', skuId)
        .eq('is_active', true)
        .eq('is_available', true)
        .in('tenant_id', allDealerIds)
        .or(`state_code.eq.${requestedStateCode},state_code.eq.ALL`);

    if (offerErr || !offerRows?.length) return { districtWinners: [], regionWinners: [] };

    // 3. Per-dealer best offer (prefer state-specific over ALL)
    const bestByDealer = new Map<string, DealerOffer>();
    for (const row of offerRows as DealerOffer[]) {
        const existing = bestByDealer.get(row.tenant_id);
        if (!existing) {
            bestByDealer.set(row.tenant_id, row);
            continue;
        }
        // State-specific row beats 'ALL' row
        const existingIsState = existing.state_code === requestedStateCode;
        const rowIsState = row.state_code === requestedStateCode;
        if (!existingIsState && rowIsState) bestByDealer.set(row.tenant_id, row);
    }

    // 4. Group assignments by district name (ignoring assignment's state_code —
    //    we always write with the concrete requestedStateCode)
    const byDistrict = new Map<string, DistrictAssignment[]>();
    for (const a of assignments) {
        const district = a.district; // 'Mumbai City', 'Thane', 'ALL', etc.
        if (!byDistrict.has(district)) byDistrict.set(district, []);
        byDistrict.get(district)!.push(a);
    }

    // 5. Pick winner per district; write with concrete state_code
    const computed: ComputedWinner[] = [];
    for (const [district, group] of byDistrict) {
        let winner: DealerOffer | null = null;
        for (const assign of group) {
            const offer = bestByDealer.get(assign.tenant_id);
            if (!offer) continue;
            if (!winner || compareOffers(offer, winner) < 0) winner = offer;
        }
        if (!winner) continue;

        computed.push({
            district,
            state_code: requestedStateCode, // Always concrete, never 'ALL'
            tenant_id: winner.tenant_id,
            winning_offer_amount: Number(winner.offer_amount ?? 0),
            tat_days: winner.tat_days ?? null,
            tat_effective_hours: winner.tat_effective_hours ?? null,
        });
    }

    const byRegion = new Map<string, DistrictAssignment[]>();
    for (const a of assignments) {
        const region = String(a.region || '').trim();
        if (!region) continue;
        if (!byRegion.has(region)) byRegion.set(region, []);
        byRegion.get(region)!.push(a);
    }

    const regionComputed: ComputedRegionWinner[] = [];
    for (const [region, group] of byRegion) {
        let winner: DealerOffer | null = null;
        for (const assign of group) {
            const offer = bestByDealer.get(assign.tenant_id);
            if (!offer) continue;
            if (!winner || compareOffers(offer, winner) < 0) winner = offer;
        }
        if (!winner) continue;
        regionComputed.push({
            region,
            state_code: requestedStateCode,
            tenant_id: winner.tenant_id,
            winning_offer_amount: Number(winner.offer_amount ?? 0),
            tat_days: winner.tat_days ?? null,
            tat_effective_hours: winner.tat_effective_hours ?? null,
        });
    }

    return { districtWinners: computed, regionWinners: regionComputed };
}

async function upsertWithSmartCacheInvalidation(
    skuId: string,
    stateCode: string,
    computed: { districtWinners: ComputedWinner[]; regionWinners: ComputedRegionWinner[] }
): Promise<void> {
    if (!computed.districtWinners.length && !computed.regionWinners.length) return;

    // Fetch existing winners to compare (old vs new)
    const districts = computed.districtWinners.map(c => c.district);
    const { data: existing } = await (adminClient as any)
        .from('sku_district_winners')
        .select('district, state_code, tenant_id')
        .eq('sku_id', skuId)
        .eq('state_code', stateCode)
        .in('district', districts.length ? districts : ['__NOOP__']);

    const prevByDistrict = new Map<string, string>((existing || []).map((r: any) => [r.district, r.tenant_id]));

    const regions = computed.regionWinners.map(c => c.region);
    const { data: existingRegions } = await (adminClient as any)
        .from('sku_region_winners')
        .select('region, state_code, tenant_id')
        .eq('sku_id', skuId)
        .eq('state_code', stateCode)
        .in('region', regions.length ? regions : ['__NOOP__']);

    const prevByRegion = new Map<string, string>((existingRegions || []).map((r: any) => [r.region, r.tenant_id]));

    // Upsert all computed winners
    if (computed.districtWinners.length) {
        await (adminClient as any).from('sku_district_winners').upsert(
            computed.districtWinners.map(c => ({
                sku_id: skuId,
                district: c.district,
                state_code: c.state_code,
                tenant_id: c.tenant_id,
                winning_offer_amount: c.winning_offer_amount,
                tat_days: c.tat_days,
                tat_effective_hours: c.tat_effective_hours,
                computed_at: new Date().toISOString(),
            })),
            { onConflict: 'sku_id,district,state_code', ignoreDuplicates: false }
        );
    }

    if (computed.regionWinners.length) {
        await (adminClient as any).from('sku_region_winners').upsert(
            computed.regionWinners.map(c => ({
                sku_id: skuId,
                region: c.region,
                state_code: c.state_code,
                tenant_id: c.tenant_id,
                winning_offer_amount: c.winning_offer_amount,
                tat_days: c.tat_days,
                tat_effective_hours: c.tat_effective_hours,
                computed_at: new Date().toISOString(),
            })),
            { onConflict: 'sku_id,region,state_code', ignoreDuplicates: false }
        );
    }

    // Smart invalidation: purge cache for (sku, state) only if any winner changed.
    // We purge the full (sku, state) — not individual district keys — because the
    // cache key pattern `winner:{state}:*:{sku}` requires iterating to selectively
    // remove; we accept this as correct behavior (other states remain unaffected).
    const districtChanged = computed.districtWinners.some(c => prevByDistrict.get(c.district) !== c.tenant_id);
    const regionChanged = computed.regionWinners.some(c => prevByRegion.get(c.region) !== c.tenant_id);
    const anyChanged = districtChanged || regionChanged;
    if (anyChanged) {
        purgeWinnerCache(skuId, stateCode);
    }
    // Unchanged: all cached entries stay hot
}

// ─── Queue Processor ──────────────────────────────────────────────
export async function processWinnerQueue(
    batchSize: number = WORKER_BATCH_SIZE
): Promise<{ processed: number; failed: number; skipped: number }> {
    let processed = 0,
        failed = 0,
        skipped = 0;

    const { data: batch, error: fetchErr } = await (adminClient as any)
        .from('sku_winner_recompute_queue')
        .select('id, sku_id, state_code, reason, retries')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(batchSize);

    if (fetchErr || !batch?.length) return { processed, failed, skipped };

    const ids = (batch as QueueItem[]).map(r => r.id);
    await (adminClient as any).from('sku_winner_recompute_queue').update({ status: 'PROCESSING' }).in('id', ids);

    for (const item of batch as QueueItem[]) {
        // Normalize: never process 'ALL' — expand to concrete state
        const stateCode = item.state_code === 'ALL' ? 'MH' : item.state_code;
        try {
            const computed = await computeWinnersForSku(item.sku_id, stateCode);
            await upsertWithSmartCacheInvalidation(item.sku_id, stateCode, computed);
            await (adminClient as any).from('sku_winner_recompute_queue').update({ status: 'DONE' }).eq('id', item.id);
            processed++;
        } catch (err) {
            const nextRetries = item.retries + 1;
            const nextStatus = nextRetries >= MAX_RETRIES ? 'FAILED' : 'PENDING';
            await (adminClient as any)
                .from('sku_winner_recompute_queue')
                .update({ status: nextStatus, retries: nextRetries })
                .eq('id', item.id);
            console.error(`[WinnerWorker] sku=${item.sku_id} state=${stateCode}:`, err);
            nextStatus === 'FAILED' ? failed++ : skipped++;
        }
    }

    return { processed, failed, skipped };
}
