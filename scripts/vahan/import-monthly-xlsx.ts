import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseVahanMonthlyWorkbookFile } from '../../src/lib/server/vahan/parser';

dotenv.config({ path: '.env.local' });

async function main() {
    const inputFiles = process.argv.slice(2);
    if (inputFiles.length === 0) {
        throw new Error('Usage: tsx scripts/vahan/import-monthly-xlsx.ts <xlsx-file-path> [more-files...]');
    }

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

    let totalUploaded = 0;

    for (const file of inputFiles) {
        const resolvedPath = path.resolve(file);
        const parsed = parseVahanMonthlyWorkbookFile(resolvedPath);

        const snapshotDate = new Date().toISOString().split('T')[0];

        const payload = parsed.rows.map((row: any) => ({
            state_code: row.stateCode,
            state_name: row.state,
            rto_code: row.rtoCode,
            rto_name: row.rtoName,
            year: row.year,
            month_no: row.monthNo,
            month_label: row.monthLabel,
            maker: row.maker,
            units: row.units,
            snapshot_date: snapshotDate,
            source_file_name: path.basename(resolvedPath),
        }));

        const { error: permanentError } = await (supabase as any).from('vahan_two_wheeler_monthly_uploads').upsert(
            payload.map((p: any) => {
                const { snapshot_date, ...rest } = p;
                return rest;
            }),
            { onConflict: 'state_code,year,month_no,rto_code,maker' }
        );

        if (permanentError) throw new Error(`Permanent Ledger Upsert failed: ${permanentError.message}`);

        const { error: dailyError } = await (supabase as any)
            .from('vahan_two_wheeler_daily_snapshots')
            .upsert(payload, { onConflict: 'state_code,year,month_no,rto_code,maker,snapshot_date' });

        if (dailyError) throw new Error(`Daily Pacing Upsert failed: ${dailyError.message}`);

        totalUploaded += payload.length;
        console.log(
            `Imported ${payload.length} rows | MONTHLY_OEM | ${parsed.state} | ${parsed.year} | ${path.basename(resolvedPath)}`
        );
    }

    console.log(`✅ Upserted ${totalUploaded} rows into both Permanent and Daily Pacing tables.`);

    // --- AUTO CLEANUP LOGIC ---
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 35); // Keep rolling 35 days
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    console.log(`🧹 Executing 35-Day Auto-Cleanup for Daily Pacing table before ${cutoffStr}...`);
    const { error: cleanupError } = await (supabase as any)
        .from('vahan_two_wheeler_daily_snapshots')
        .delete()
        .lt('snapshot_date', cutoffStr);

    if (cleanupError) {
        console.error('⚠️ Failed to clean up old pacing data:', cleanupError.message);
    } else {
        console.log('✅ Rolling 35-Day window maintained on Daily Pacing table. Old data purged.');
    }
    // --- END AUTO CLEANUP LOGIC ---
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
