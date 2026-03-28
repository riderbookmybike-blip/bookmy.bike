import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MMRD_RTO_NAMES: Record<string, string> = {
    MH01: 'Mumbai Central',
    MH02: 'Mumbai West',
    MH03: 'Mumbai East',
    MH04: 'Thane',
    MH05: 'Kalyan',
    MH06: 'Pen (Raigad)',
    MH43: 'Navi Mumbai',
    MH46: 'Panvel (MMR)',
    MH47: 'Mumbai North',
    MH48: 'Vasai-Virar',
    MH58: 'Ulhasnagar/Ambernath',
};

function normalizeMakerKey(value: unknown): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
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
        const [kpiRes, stateTimelineRes, rtoShareRes, brandShareRes, brandTrendRes, brandRtoMatrixRes] =
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
                    p_top_n: 12,
                }),
                client.rpc('vahan_brand_rto_matrix', {
                    p_state_code: stateCode,
                    p_from_month: fromMonth,
                    p_to_month: toMonth,
                    p_top_brands: 12,
                    p_top_rtos: 20,
                }),
            ]);

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
            top_rto_name: MMRD_RTO_NAMES[topRto?.rto_code || ''] || topRto?.rto_name || '---',
            top_rto: topRto?.rto_name || '---',
        };

        return NextResponse.json({
            filters: { stateCode, fromMonth, toMonth, grain, rtoCode, brandName },
            kpis: enrichedKpis,
            timeline: stateTimelineRes.data || [],
            rto: {
                share: rtoShare,
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
