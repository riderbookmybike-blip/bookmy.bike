import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type BackfillEvent = {
    phone10: string;
    event: 'delivered' | 'read' | 'failed' | 'clicked';
    ts: string;
    reason: string | null;
};

function usageAndExit(): never {
    console.error(
        'Usage: npx tsx scripts/backfill_wa_campaign_status.ts --campaign <campaign_id> --csv <path_to_msg91_csv>'
    );
    process.exit(1);
}

function arg(name: string): string | null {
    const i = process.argv.indexOf(name);
    if (i === -1) return null;
    return process.argv[i + 1] ?? null;
}

function normalizePhone10(input: string): string | null {
    const d = String(input || '').replace(/\D/g, '');
    const ten = d.slice(-10);
    return ten.length === 10 ? ten : null;
}

function parseDate(input: string): string {
    const raw = String(input || '').trim();
    if (!raw) return new Date().toISOString();
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    // MSG91 often exports "YYYY-MM-DD HH:mm:ss" without timezone.
    const d2 = new Date(raw.replace(' ', 'T') + '+05:30');
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
    return new Date().toISOString();
}

function classifyEvent(reason: string): 'delivered' | 'read' | 'failed' | 'clicked' | null {
    const r = reason.toLowerCase();
    if (!r) return null;
    if (r.includes('read')) return 'read';
    if (r.includes('click')) return 'clicked';
    if (r.includes('delivered')) return 'delivered';
    if (
        r.includes('undeliver') ||
        r.includes('rejected') ||
        r.includes('failed') ||
        r.includes('131049') ||
        r.includes('131026')
    ) {
        return 'failed';
    }
    return null;
}

function hasValue(v: unknown): boolean {
    return String(v ?? '').trim().length > 0;
}

async function loadCsvEvents(csvPath: string): Promise<BackfillEvent[]> {
    if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);
    const rows: BackfillEvent[] = [];

    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row: Record<string, string>) => {
                // Handle multiple possible header variants from MSG91 exports
                const phoneRaw =
                    row['Customer Number'] ||
                    row['customer_number'] ||
                    row['customerNumber'] ||
                    row['To'] ||
                    row['to'] ||
                    row['Mobile'] ||
                    row['mobile'] ||
                    '';

                const reasonRaw =
                    row['Reason'] ||
                    row['reason'] ||
                    row['Status'] ||
                    row['status'] ||
                    row['Message Status'] ||
                    row['message_status'] ||
                    row['Delivery Report'] ||
                    row['delivery_report'] ||
                    row['Failure Reason'] ||
                    row['failure_reason'] ||
                    '';

                const dateRaw = row['Date/Time'] || row['Date Time'] || row['date_time'] || row['created_at'] || '';
                const deliveredAtRaw = row['Delivered At'] || row['delivered_at'] || '';
                const readAtRaw = row['Read At'] || row['read_at'] || '';
                const clickedRaw = row['Clicked'] || row['clicked'] || '';
                const failureReasonRaw = row['Failure Reason'] || row['failure_reason'] || '';
                const deliveryReportRaw = row['Delivery Report'] || row['delivery_report'] || '';

                const phone10 = normalizePhone10(phoneRaw);
                const reason = String(reasonRaw || '').trim();
                if (!phone10) return;

                // Strongest signals first: explicit delivered/read timestamps in export
                if (hasValue(deliveredAtRaw)) {
                    rows.push({
                        phone10,
                        event: 'delivered',
                        ts: parseDate(String(deliveredAtRaw)),
                        reason: reason || null,
                    });
                }
                if (hasValue(readAtRaw)) {
                    rows.push({
                        phone10,
                        event: 'read',
                        ts: parseDate(String(readAtRaw)),
                        reason: reason || null,
                    });
                }

                // Clicked column can be boolean-ish/text-ish
                const clickedNorm = String(clickedRaw || '')
                    .trim()
                    .toLowerCase();
                if (clickedNorm === '1' || clickedNorm === 'true' || clickedNorm === 'yes') {
                    rows.push({
                        phone10,
                        event: 'clicked',
                        ts: parseDate(dateRaw),
                        reason: reason || null,
                    });
                }

                // Failure via delivery report / failure reason
                const failText = `${deliveryReportRaw || ''} ${failureReasonRaw || ''} ${reason || ''}`.trim();
                const failEvent = classifyEvent(failText);
                if (failEvent === 'failed') {
                    rows.push({
                        phone10,
                        event: 'failed',
                        ts: parseDate(dateRaw),
                        reason: failText || null,
                    });
                }
            })
            .on('end', () => resolve())
            .on('error', reject);
    });

    return rows;
}

async function run() {
    const campaignId = arg('--campaign');
    const csvPath = arg('--csv');
    if (!campaignId || !csvPath) usageAndExit();

    const absCsv = path.resolve(process.cwd(), csvPath);
    console.log('[backfill] campaign:', campaignId);
    console.log('[backfill] csv:', absCsv);

    const events = await loadCsvEvents(absCsv);
    if (!events.length) {
        console.log('[backfill] no actionable rows found in CSV');
        return;
    }

    // Keep latest event per phone/event to avoid noisy duplicates in logs export
    const latest = new Map<string, BackfillEvent>();
    for (const e of events) {
        const k = `${e.phone10}:${e.event}`;
        const prev = latest.get(k);
        if (!prev || new Date(e.ts).getTime() >= new Date(prev.ts).getTime()) latest.set(k, e);
    }

    let updatedDelivered = 0;
    let updatedRead = 0;
    let updatedClicked = 0;
    let updatedFailed = 0;

    for (const e of latest.values()) {
        const { data: recipient, error: findError } = await supabase
            .from('cam_whatsapp_recipients')
            .select('id, send_status, delivered_at, read_at, clicked_at')
            .eq('campaign_id', campaignId)
            .eq('phone', e.phone10)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (findError || !recipient?.id) continue;

        const patch: Record<string, string> = {};
        if (e.event === 'delivered' && !recipient.delivered_at) {
            patch.delivered_at = e.ts;
            updatedDelivered++;
        } else if (e.event === 'read' && !recipient.read_at) {
            patch.read_at = e.ts;
            patch.delivered_at = recipient.delivered_at || e.ts;
            updatedRead++;
        } else if (e.event === 'clicked' && !recipient.clicked_at) {
            patch.clicked_at = e.ts;
            updatedClicked++;
        } else if (e.event === 'failed' && recipient.send_status !== 'FAILED') {
            patch.send_status = 'FAILED';
            updatedFailed++;
        }

        if (Object.keys(patch).length > 0) {
            await supabase.from('cam_whatsapp_recipients').update(patch).eq('id', recipient.id);
        }
    }

    const { count: failedCount } = await supabase
        .from('cam_whatsapp_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('send_status', 'FAILED');

    await supabase
        .from('cam_whatsapp_campaigns')
        .update({ failed_count: failedCount || 0 })
        .eq('id', campaignId);

    console.log('[backfill] done');
    console.log('[backfill] delivered updates:', updatedDelivered);
    console.log('[backfill] read updates:', updatedRead);
    console.log('[backfill] clicked updates:', updatedClicked);
    console.log('[backfill] failed updates:', updatedFailed);
    console.log('[backfill] campaign failed_count synced:', failedCount || 0);
}

run().catch(err => {
    console.error('[backfill] error:', err);
    process.exit(1);
});
