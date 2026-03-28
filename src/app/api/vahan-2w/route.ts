import { NextRequest, NextResponse } from 'next/server';
import { applyApiGuard } from '@/lib/server/apiGuard';
import { adminClient } from '@/lib/supabase/admin';
import { buildVahanApiResponse, getSeedRows } from '@/lib/server/vahan/aggregate';
import { VahanTwoWheelerMonthlyRow, VahanTwoWheelerRow } from '@/lib/server/vahan/types';

const PUBLIC_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
};

function mapDbRowToApiRow(row: any): VahanTwoWheelerRow {
    return {
        axis: row.axis,
        state: row.state_name,
        stateCode: row.state_code,
        year: row.year,
        rowLabel: row.row_label,
        mCycleScooter: Number(row.m_cycle_scooter || 0),
        moped: Number(row.moped || 0),
        motorisedCycleGt25cc: Number(row.motorised_cycle_gt_25cc || 0),
        twoWheelerTotal: Number(row.two_wheeler_total || 0),
        source: row.source_file_name || 'upload',
        fetchedAt: row.updated_at || row.uploaded_at || new Date().toISOString(),
    };
}

function normalizeMakerKey(value: unknown): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

async function fetchVahanBrandMap(): Promise<Map<string, { brandName: string; logoSlug: string | null }>> {
    const { data } = await (adminClient as any)
        .from('vahan_oem_brand_map')
        .select('row_label_key, brand_name, logo_slug');
    const entries = Array.isArray(data) ? data : [];
    return new Map(
        entries.map((row: any) => [
            normalizeMakerKey(row.row_label_key),
            { brandName: String(row.brand_name || ''), logoSlug: row.logo_slug ? String(row.logo_slug) : null },
        ])
    );
}

function mapMonthlyDbRowToApiRow(
    row: any,
    brandMap: Map<string, { brandName: string; logoSlug: string | null }>
): VahanTwoWheelerMonthlyRow {
    const rawMaker = String(row.maker || '');
    const mapped = brandMap.get(normalizeMakerKey(rawMaker));

    return {
        stateCode: row.state_code,
        state: row.state_name,
        rtoCode: row.rto_code || 'ALL',
        rtoName: row.rto_name || 'All',
        year: Number(row.year),
        monthNo: Number(row.month_no),
        monthLabel: String(row.month_label || ''),
        maker: mapped?.brandName || rawMaker,
        units: Number(row.units || 0),
        source: row.source_file_name || 'upload',
        fetchedAt: row.updated_at || row.uploaded_at || new Date().toISOString(),
    };
}

export async function GET(req: NextRequest) {
    const blocked = applyApiGuard(req, { maxRequests: 120 });
    if (blocked) return blocked;

    const stateCode = (req.nextUrl.searchParams.get('state') || 'MH').toUpperCase();
    const minYear = Number(req.nextUrl.searchParams.get('fromYear') || 2021);

    const { data, error } = await (adminClient as any)
        .from('vahan_two_wheeler_uploads')
        .select('*')
        .eq('state_code', stateCode)
        .gte('year', minYear)
        .order('year', { ascending: true });
    const { data: monthlyData } = await (adminClient as any)
        .from('vahan_two_wheeler_monthly_uploads')
        .select('*')
        .eq('state_code', stateCode)
        .gte('year', minYear)
        .order('year', { ascending: true });

    if (error) {
        return NextResponse.json(buildVahanApiResponse(getSeedRows(), 'seed', []), { headers: PUBLIC_CACHE_HEADERS });
    }

    const brandMap = await fetchVahanBrandMap();
    let rows: VahanTwoWheelerRow[] = (Array.isArray(data) ? data : []).map(row => {
        const base = mapDbRowToApiRow(row);
        if (base.axis !== 'MAKER') return base;
        const mapped = brandMap.get(normalizeMakerKey(base.rowLabel));
        return mapped ? { ...base, rowLabel: mapped.brandName } : base;
    });

    const monthlyRows = (Array.isArray(monthlyData) ? monthlyData : []).map((row: any) =>
        mapMonthlyDbRowToApiRow(row, brandMap)
    );

    // --- DERIVATION CONTRACT (Synthesize yearly rows from monthly if DB lacks yearly extracts) ---
    if (rows.length === 0 && monthlyRows.length > 0) {
        const aggregated = new Map<string, VahanTwoWheelerRow>();

        monthlyRows.forEach((mr: any) => {
            // Aggregate RTO Axis
            const rtoKey = `RTO_${mr.year}_${mr.rtoCode}`;
            if (!aggregated.has(rtoKey)) {
                aggregated.set(rtoKey, {
                    axis: 'RTO',
                    state: mr.state,
                    stateCode: mr.stateCode,
                    year: mr.year,
                    rowLabel: mr.rtoCode,
                    mCycleScooter: 0,
                    moped: 0,
                    motorisedCycleGt25cc: 0,
                    twoWheelerTotal: 0,
                    source: 'derived-from-monthly',
                    fetchedAt: new Date().toISOString(),
                });
            }
            aggregated.get(rtoKey)!.twoWheelerTotal += mr.units;

            // Aggregate Maker Axis
            const makerKey = `MAKER_${mr.year}_${mr.maker}`;
            if (!aggregated.has(makerKey)) {
                aggregated.set(makerKey, {
                    axis: 'MAKER',
                    state: mr.state,
                    stateCode: mr.stateCode,
                    year: mr.year,
                    rowLabel: mr.maker,
                    mCycleScooter: 0,
                    moped: 0,
                    motorisedCycleGt25cc: 0,
                    twoWheelerTotal: 0,
                    source: 'derived-from-monthly',
                    fetchedAt: new Date().toISOString(),
                });
            }
            aggregated.get(makerKey)!.twoWheelerTotal += mr.units;
        });

        rows = Array.from(aggregated.values());
    }

    if (rows.length === 0) {
        return NextResponse.json(buildVahanApiResponse(getSeedRows(), 'seed', monthlyRows), {
            headers: PUBLIC_CACHE_HEADERS,
        });
    }

    return NextResponse.json(buildVahanApiResponse(rows, 'db', monthlyRows), { headers: PUBLIC_CACHE_HEADERS });
}
