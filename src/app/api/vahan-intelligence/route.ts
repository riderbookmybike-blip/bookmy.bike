import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function normalizeRtoCode(value: unknown): string {
    const raw = String(value || '')
        .trim()
        .toUpperCase();
    const m = raw.match(/^([A-Z]{2})(\d{1,3})$/);
    if (!m) return raw;
    const prefix = m[1];
    const num = Number(m[2]);
    if (!Number.isFinite(num)) return raw;
    const width = prefix === 'MH' ? 2 : 3;
    return `${prefix}${String(num).padStart(width, '0')}`;
}

function normalizeMakerKey(value: unknown): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function parseYyyyMm(value: string): { year: number; month: number } | null {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
    return { year, month };
}

function periodStartByGrain(year: number, month: number, grain: string): string {
    if (String(grain || '').toLowerCase() === 'year') return `${String(year).padStart(4, '0')}-01-01`;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

async function fetchVahanBrandMap(): Promise<
    Map<string, { brandName: string; logoSlug: string | null; brandColorHex: string | null }>
> {
    const { data } = await (adminClient as any)
        .from('vahan_oem_brand_map')
        .select('row_label_key, brand_name, logo_slug, brand_color_hex');
    const entries = Array.isArray(data) ? data : [];
    return new Map(
        entries.map((row: any) => [
            normalizeMakerKey(row.row_label_key),
            {
                brandName: String(row.brand_name || ''),
                logoSlug: row.logo_slug ? String(row.logo_slug) : null,
                brandColorHex: row.brand_color_hex ? String(row.brand_color_hex) : null,
            },
        ])
    );
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const stateCode = searchParams.get('state_code');
        const fromMonth = searchParams.get('from_month');
        const toMonth = searchParams.get('to_month');
        const grain = searchParams.get('grain') || 'month';

        let rtoCode = searchParams.get('rto_code');
        let brandName = searchParams.get('brand_name');

        // Clean up inputs
        if (rtoCode && rtoCode.toUpperCase() === 'ALL') rtoCode = null;
        if (brandName && brandName.toUpperCase() === 'ALL') brandName = null;

        if (!stateCode || !fromMonth || !toMonth) {
            return NextResponse.json(
                { error: 'Missing canonical filters (state_code, from_month, to_month).' },
                { status: 400 }
            );
        }

        const client = adminClient as any;
        const brandMap = await fetchVahanBrandMap();
        const mapBrandMeta = (raw: unknown) => {
            const key = normalizeMakerKey(raw);
            const mapped = brandMap.get(key);
            return {
                brandDisplay: mapped?.brandName || String(raw || ''),
                brandColorHex: mapped?.brandColorHex || null,
            };
        };

        // Execute queries in parallel
        const [kpiRes, stateTimelineRes, rtoShareRes, brandShareRes, brandTrendRes, brandRtoMatrixRes, lastUpdateRes] =
            await Promise.all([
                client.rpc('vahan_kpi_summary', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_rto_code: rtoCode,
                    p_brand_name: brandName,
                }),
                client.rpc('vahan_state_timeline', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_grain: grain,
                    p_rto_code: rtoCode,
                    p_brand_name: brandName,
                }),
                client.rpc('vahan_rto_share', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_brand_name: brandName,
                    p_top_n: 999,
                }),
                client.rpc('vahan_brand_share', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_rto_code: rtoCode,
                    p_top_n: 999,
                }),
                client.rpc('vahan_brand_trend', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_grain: grain,
                    p_rto_code: rtoCode,
                    p_top_n: 999,
                }),
                client.rpc('vahan_brand_rto_matrix', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_top_brands: 12,
                    p_top_rtos: 20,
                }),
                client
                    .from('vahan_two_wheeler_monthly_uploads')
                    .select('updated_at, uploaded_at')
                    .eq('state_code', stateCode)
                    .order('uploaded_at', { ascending: false })
                    .limit(1)
                    .maybeSingle(),
            ]);

        const fromParts = parseYyyyMm(fromMonth);
        const toParts = parseYyyyMm(toMonth);
        let rtoTimeline: any[] = [];
        if (fromParts && toParts) {
            const minYear = Math.min(fromParts.year, toParts.year);
            const maxYear = Math.max(fromParts.year, toParts.year);
            const ymFrom = fromParts.year * 100 + fromParts.month;
            const ymTo = toParts.year * 100 + toParts.month;

            const rows: any[] = [];
            const pageSize = 1000;
            let from = 0;
            while (true) {
                const to = from + pageSize - 1;
                const { data: timelineBaseRows, error: timelineErr } = await client
                    .from('vahan_two_wheeler_monthly_uploads')
                    .select('year, month_no, rto_code, rto_name, maker, brand_name, units')
                    .eq('state_code', stateCode)
                    .gte('year', minYear)
                    .lte('year', maxYear)
                    .range(from, to);

                if (timelineErr) throw timelineErr;
                const batch = Array.isArray(timelineBaseRows) ? timelineBaseRows : [];
                if (batch.length === 0) break;
                rows.push(...batch);
                if (batch.length < pageSize) break;
                from += batch.length;
            }
            const bucket = new Map<
                string,
                { rto_code: string; rto_name: string; period_start: string; units: number }
            >();
            const targetBrand = normalizeMakerKey(brandName || '');
            for (const row of rows) {
                const year = Number(row.year || 0);
                const monthNo = Number(row.month_no || 0);
                if (!year || !monthNo) continue;
                const ym = year * 100 + monthNo;
                if (ym < ymFrom || ym > ymTo) continue;

                const rowRto = normalizeRtoCode(row.rto_code);
                if (rtoCode && rowRto !== normalizeRtoCode(rtoCode)) continue;

                const rowBrand = normalizeMakerKey(row.brand_name || row.maker);
                if (targetBrand && rowBrand !== targetBrand) continue;

                const periodStart = periodStartByGrain(year, monthNo, grain);
                const key = `${periodStart}|${rowRto}`;
                const prev = bucket.get(key);
                const units = Number(row.units || 0);
                if (!prev) {
                    bucket.set(key, {
                        rto_code: rowRto,
                        rto_name: String(row.rto_name || rowRto),
                        period_start: periodStart,
                        units,
                    });
                } else {
                    prev.units += units;
                }
            }
            rtoTimeline = Array.from(bucket.values()).sort((a, b) => {
                const byPeriod = String(a.period_start).localeCompare(String(b.period_start));
                return byPeriod !== 0 ? byPeriod : String(a.rto_code).localeCompare(String(b.rto_code));
            });
        }

        const { data: latestPublishedSeriesRow } = await client
            .from('vahan_fancy_series_daily')
            .select('snapshot_date')
            .eq('state_code', stateCode)
            .eq('published', true)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        const latestSeriesSnapshotDate =
            latestPublishedSeriesRow?.snapshot_date ||
            (
                await client
                    .from('vahan_fancy_series_daily')
                    .select('snapshot_date')
                    .eq('state_code', stateCode)
                    .order('snapshot_date', { ascending: false })
                    .limit(1)
                    .maybeSingle()
            ).data?.snapshot_date;

        let runningSeries: any[] = [];
        if (latestSeriesSnapshotDate) {
            const query = client
                .from('vahan_fancy_series_daily')
                .select(
                    'snapshot_date, state_code, rto_code, rto_name, series_name, series_status, is_active, first_open_number, filled_till, running_open_count, available_count, active_on_date, open_on_text, scraped_at'
                )
                .eq('state_code', stateCode)
                .eq('snapshot_date', latestSeriesSnapshotDate)
                .eq('is_active', true)
                .order('rto_code', { ascending: true });
            if (latestPublishedSeriesRow?.snapshot_date) query.eq('published', true);
            const { data: seriesRows } = await query;
            const allRows = Array.isArray(seriesRows) ? seriesRows : [];
            const bestByRto = new Map<string, any>();
            for (const row of allRows) {
                const normalizedCode = normalizeRtoCode(row?.rto_code);
                const candidate = {
                    ...row,
                    rto_code: normalizedCode,
                };
                const prev = bestByRto.get(normalizedCode);
                if (!prev) {
                    bestByRto.set(normalizedCode, candidate);
                    continue;
                }
                const candidateFilled = Number(candidate.filled_till || 0);
                const prevFilled = Number(prev.filled_till || 0);
                const candidateOpen = Number(candidate.running_open_count || 0);
                const prevOpen = Number(prev.running_open_count || 0);
                const candidateScraped = new Date(candidate.scraped_at || 0).getTime();
                const prevScraped = new Date(prev.scraped_at || 0).getTime();
                const shouldReplace =
                    candidateFilled > prevFilled ||
                    (candidateFilled === prevFilled && candidateOpen > prevOpen) ||
                    (candidateFilled === prevFilled && candidateOpen === prevOpen && candidateScraped > prevScraped);
                if (shouldReplace) bestByRto.set(normalizedCode, candidate);
            }
            runningSeries = Array.from(bestByRto.values()).sort((a, b) =>
                String(a.rto_code || '').localeCompare(String(b.rto_code || ''), 'en')
            );
        }

        const brandShare = (brandShareRes.data || []).map((row: any) => {
            const mapped = mapBrandMeta(row.brand_name);
            return {
                ...row,
                brand_display: mapped.brandDisplay,
                brand_color_hex: mapped.brandColorHex,
            };
        });
        const rtoShare = rtoShareRes.data || [];
        const brandTrend = (brandTrendRes.data || []).map((row: any) => {
            const mapped = mapBrandMeta(row.brand_name);
            return {
                ...row,
                brand_display: mapped.brandDisplay,
                brand_color_hex: mapped.brandColorHex,
            };
        });
        const brandRtoMatrix = (brandRtoMatrixRes.data || []).map((row: any) => {
            const mapped = mapBrandMeta(row.brand_name);
            return {
                ...row,
                brand_display: mapped.brandDisplay,
                brand_color_hex: mapped.brandColorHex,
            };
        });
        const kpiData = kpiRes.data?.[0] || { total_units: 0, prev_period_units: 0, prev_period_pct: 0, yoy_pct: 0 };

        const totalUnits = Number(kpiData.total_units || 0);
        const topBrand = brandShare[0];
        const topRto = rtoShare[0];

        // Enrich KPIs with derived metadata
        const enrichedKpis = {
            ...kpiData,
            top_brand: topBrand?.brand_display || topBrand?.brand_name || '---',
            top_brand_pct: totalUnits > 0 ? ((Number(topBrand?.units || 0) / totalUnits) * 100).toFixed(1) : '0',
            top_rto_code: topRto?.rto_code || '',
            top_rto_name: topRto?.rto_name || '---',
            top_rto: topRto?.rto_name || '---',
        };

        return NextResponse.json({
            filters: { stateCode, fromMonth, toMonth, grain, rtoCode, brandName },
            kpis: enrichedKpis,
            meta: {
                last_data_update_at: lastUpdateRes.data?.updated_at || lastUpdateRes.data?.uploaded_at || null,
            },
            timeline: stateTimelineRes.data || [],
            timeline_rto: rtoTimeline,
            rto: {
                share: rtoShare,
            },
            series: {
                latest_snapshot_date: latestSeriesSnapshotDate || null,
                running: runningSeries,
            },
            brand: {
                share: brandShare,
                trend: brandTrend,
                rtoMatrix: brandRtoMatrix,
            },
        });
    } catch (error: any) {
        console.error('[GET /api/vahan-intelligence] Fatal Error:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error.message,
                hint: 'Ensure migrations in /supabase/migrations/20260329000000_create_vahan_intelligence_rpcs.sql are applied.',
            },
            { status: 500 }
        );
    }
}
