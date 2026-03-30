/**
 * GET /api/pdp/winner
 *
 * Resolve the winning dealer for a SKU + district.
 *
 * ── Query params ────────────────────────────────────────────
 *  skuId      required   UUID of the vehicle color SKU
 *  district   required   District name (e.g. "Mumbai City")
 *  stateCode  optional   Default: "MH"
 *  defaultDistrict optional  The district used as the baseline default
 *                             (for same_as_default comparison). Default: "Mumbai City"
 *  currentTenantId optional   Current tenant_id shown in the UI
 *                             (for same_as_current comparison).
 *
 * ── Response contract ───────────────────────────────────────
 *  {
 *    found:              boolean
 *    tenant_id:          string | null
 *    offer_amount:       number
 *    tat_days:           number | null
 *    tat_effective_hours: number | null
 *    district:           string
 *    state_code:         string
 *    same_as_default:    boolean   // true → same dealer as Mumbai default
 *    same_as_current:    boolean   // true → same dealer as currently shown UI
 *    source:             'PRE_COMPUTED' | 'FALLBACK_ANY' | 'NONE'
 *    cache_hit:          boolean
 *  }
 *
 * ── Same-winner fast path ────────────────────────────────────
 *  If same_as_current === true, the UI MUST skip re-render.
 *  If same_as_default === true, no dealer panel update needed.
 * ─────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import {
    resolveWinnerForDistrict,
    resolveDefaultWinner,
    resolveWinnerForRegion,
    resolveDefaultRegionWinner,
    isSameWinner,
    DEFAULT_DISTRICT,
    DEFAULT_STATE_CODE,
} from '@/lib/server/winnerResolver';
import { adminClient } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
    const url = new URL(req.url);
    const skuId = url.searchParams.get('skuId') || '';
    const district = url.searchParams.get('district') || '';
    const region = url.searchParams.get('region') || '';
    const stateCode = (url.searchParams.get('stateCode') || DEFAULT_STATE_CODE).toUpperCase();
    const defaultDist = url.searchParams.get('defaultDistrict') || DEFAULT_DISTRICT;
    const currentTenant = url.searchParams.get('currentTenantId') || '';
    const hasCurrentTenant = UUID_RE.test(currentTenant);
    const isRegionMode = Boolean(region.trim());
    const cacheControl =
        isRegionMode && !hasCurrentTenant ? 'public, s-maxage=300, stale-while-revalidate=86400' : 'no-store';

    // Validate
    if (!UUID_RE.test(skuId)) {
        return NextResponse.json({ error: 'skuId must be a valid UUID' }, { status: 400 });
    }
    if (!district.trim() && !region.trim()) {
        return NextResponse.json({ error: 'district is required' }, { status: 400 });
    }

    // Region-only mode: strict resolution, no district/default/current fallback.
    const target = region.trim()
        ? await resolveWinnerForRegion([skuId], region.trim(), stateCode)
        : await resolveWinnerForDistrict([skuId], district, stateCode);

    if (!target) {
        return NextResponse.json(
            {
                found: false,
                tenant_id: null,
                offer_amount: 0,
                tat_days: null,
                tat_effective_hours: null,
                district,
                state_code: stateCode,
                same_as_default: false,
                same_as_current: false,
                source: 'NONE',
                cache_hit: false,
            },
            { headers: { 'Cache-Control': cacheControl } }
        );
    }

    // Resolve default winner (Mumbai City) for comparison — cache-first
    const defaultWinner = region.trim()
        ? await resolveDefaultRegionWinner([skuId], region.trim(), stateCode)
        : district === defaultDist
          ? target
          : await resolveDefaultWinner([skuId], defaultDist, stateCode);

    const same_as_default = isSameWinner(target, defaultWinner);

    // same_as_current — compare against caller-provided tenantId
    const same_as_current = hasCurrentTenant ? target.tenantId === currentTenant : false;

    // Enrich with dealer metadata (tenant name + studio_id) for UI
    let tenantMeta: { name: string | null; studio_id: string | null } = { name: null, studio_id: null };
    try {
        const { data } = await (adminClient as any)
            .from('id_tenants')
            .select('name, studio_id')
            .eq('id', target.tenantId)
            .maybeSingle();
        if (data) tenantMeta = { name: data.name || null, studio_id: data.studio_id || null };
    } catch {
        // Non-fatal — winner still returned without name
    }

    const body = {
        found: true,
        tenant_id: target.tenantId,
        tenant_name: tenantMeta.name,
        studio_id: tenantMeta.studio_id,
        offer_amount: target.winningOfferAmount,
        tat_days: target.tatDays,
        tat_effective_hours: target.tatEffectiveHours,
        district: target.district,
        region: region.trim() || null,
        state_code: target.stateCode,
        same_as_default,
        same_as_current,
        source: target.source,
        cache_hit: target.fromCache,
    };

    return NextResponse.json(body, {
        headers: {
            'Cache-Control': cacheControl,
            'X-Winner-Cache-Hit': String(target.fromCache),
            'X-Same-As-Default': String(same_as_default),
        },
    });
}
