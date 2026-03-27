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

function mapMonthlyDbRowToApiRow(row: any): VahanTwoWheelerMonthlyRow {
    return {
        stateCode: row.state_code,
        state: row.state_name,
        rtoCode: row.rto_code || 'ALL',
        rtoName: row.rto_name || 'All',
        year: Number(row.year),
        monthNo: Number(row.month_no),
        monthLabel: String(row.month_label || ''),
        maker: String(row.maker || ''),
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

    const rows = (Array.isArray(data) ? data : []).map(mapDbRowToApiRow);
    const monthlyRows = (Array.isArray(monthlyData) ? monthlyData : []).map(mapMonthlyDbRowToApiRow);
    if (rows.length === 0) {
        return NextResponse.json(buildVahanApiResponse(getSeedRows(), 'seed', monthlyRows), {
            headers: PUBLIC_CACHE_HEADERS,
        });
    }

    return NextResponse.json(buildVahanApiResponse(rows, 'db', monthlyRows), { headers: PUBLIC_CACHE_HEADERS });
}
