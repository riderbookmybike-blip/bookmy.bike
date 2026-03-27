import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { applyApiGuard } from '@/lib/server/apiGuard';
import { parseVahanMonthlyWorkbookBuffer, parseVahanWorkbookBuffer } from '@/lib/server/vahan/parser';
import { buildVahanApiResponse, getSeedRows } from '@/lib/server/vahan/aggregate';
import { VahanTwoWheelerRow } from '@/lib/server/vahan/types';

async function isAumsAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { allowed: false as const, status: 401 };

    const { data: membership } = await supabase
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = String(membership?.role || '').toUpperCase();
    const allowed = ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role);
    return { allowed, status: allowed ? 200 : 403 } as const;
}

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

export async function GET(req: NextRequest) {
    const blocked = applyApiGuard(req, { maxRequests: 60 });
    if (blocked) return blocked;

    const auth = await isAumsAdmin();
    if (!auth.allowed) {
        return NextResponse.json(
            { error: auth.status === 401 ? 'unauthorized' : 'forbidden' },
            { status: auth.status }
        );
    }

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
        const payload = buildVahanApiResponse(getSeedRows(), 'seed', []);
        return NextResponse.json(payload);
    }

    const rows = (Array.isArray(data) ? data : []).map(mapDbRowToApiRow);
    const monthlyRows = (Array.isArray(monthlyData) ? monthlyData : []).map((row: any) => ({
        stateCode: row.state_code,
        state: row.state_name,
        rtoCode: row.rto_code || 'ALL',
        rtoName: row.rto_name || 'All',
        year: row.year,
        monthNo: row.month_no,
        monthLabel: row.month_label,
        maker: row.maker,
        units: Number(row.units || 0),
        source: row.source_file_name || 'upload',
        fetchedAt: row.updated_at || row.uploaded_at || new Date().toISOString(),
    }));
    if (rows.length === 0) {
        const payload = buildVahanApiResponse(getSeedRows(), 'seed', monthlyRows);
        return NextResponse.json(payload);
    }

    return NextResponse.json(buildVahanApiResponse(rows, 'db', monthlyRows));
}

export async function POST(req: NextRequest) {
    const blocked = applyApiGuard(req, { maxRequests: 20 });
    if (blocked) return blocked;

    const auth = await isAumsAdmin();
    if (!auth.allowed) {
        return NextResponse.json(
            { error: auth.status === 401 ? 'unauthorized' : 'forbidden' },
            { status: auth.status }
        );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        return NextResponse.json({ error: 'Only .xlsx files are supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let parsed;
    try {
        parsed = parseVahanWorkbookBuffer(buffer, file.name);
    } catch (error) {
        try {
            const monthly = parseVahanMonthlyWorkbookBuffer(buffer, file.name);
            const monthlyPayload = monthly.rows.map(row => ({
                state_code: row.stateCode,
                state_name: row.state,
                year: row.year,
                month_no: row.monthNo,
                month_label: row.monthLabel,
                maker: row.maker,
                units: row.units,
                source_file_name: file.name,
            }));

            const { error: monthlyError } = await (adminClient as any)
                .from('vahan_two_wheeler_monthly_uploads')
                .upsert(monthlyPayload, { onConflict: 'state_code,year,month_no,maker' });

            if (monthlyError) {
                return NextResponse.json({ error: monthlyError.message || 'Monthly upload failed' }, { status: 500 });
            }

            return NextResponse.json({
                ok: true,
                kind: 'MONTHLY_OEM',
                year: monthly.year,
                state: monthly.state,
                uploadedRows: monthlyPayload.length,
            });
        } catch (monthlyParseError) {
            return NextResponse.json(
                {
                    error: monthlyParseError instanceof Error ? monthlyParseError.message : 'Unable to parse workbook',
                },
                { status: 400 }
            );
        }
    }

    const upsertRows = parsed.rows.map(row => ({
        state_code: row.stateCode,
        state_name: row.state,
        year: row.year,
        axis: row.axis,
        row_label: row.rowLabel,
        m_cycle_scooter: row.mCycleScooter,
        moped: row.moped,
        motorised_cycle_gt_25cc: row.motorisedCycleGt25cc,
        two_wheeler_total: row.twoWheelerTotal,
        source_file_name: file.name,
    }));

    const { error } = await (adminClient as any)
        .from('vahan_two_wheeler_uploads')
        .upsert(upsertRows, { onConflict: 'state_code,year,axis,row_label' });

    if (error) {
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        year: parsed.year,
        axis: parsed.axis,
        state: parsed.state,
        uploadedRows: upsertRows.length,
    });
}
