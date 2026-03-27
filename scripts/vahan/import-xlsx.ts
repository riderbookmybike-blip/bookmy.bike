import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { parseVahanWorkbookFile } from '@/lib/server/vahan/parser';

async function main() {
    const inputFile = process.argv[2];
    if (!inputFile) {
        throw new Error('Usage: tsx scripts/vahan/import-xlsx.ts <xlsx-file-path>');
    }

    const resolvedPath = path.resolve(inputFile);
    const parsed = parseVahanWorkbookFile(resolvedPath);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is missing');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const payload = parsed.rows.map(row => ({
        state_code: row.stateCode,
        state_name: row.state,
        year: row.year,
        axis: row.axis,
        row_label: row.rowLabel,
        m_cycle_scooter: row.mCycleScooter,
        moped: row.moped,
        motorised_cycle_gt_25cc: row.motorisedCycleGt25cc,
        two_wheeler_total: row.twoWheelerTotal,
        source_file_name: path.basename(resolvedPath),
    }));

    const { error } = await (supabase as any)
        .from('vahan_two_wheeler_uploads')
        .upsert(payload, { onConflict: 'state_code,year,axis,row_label' });

    if (error) {
        throw new Error(error.message || 'Upsert failed');
    }

    console.log(`Imported ${payload.length} rows | ${parsed.axis} | ${parsed.state} | ${parsed.year}`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
