import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

/**
 * MSG91 WhatsApp Delivery Webhook
 *
 * MSG91 sends a POST callback for each status change:
 *   sent → delivered → read → clicked (button/link)
 *
 * Configure in MSG91 Dashboard → Settings → Webhook:
 *   URL: https://your-domain.com/api/webhooks/msg91-wa?secret=MSG91_WEBHOOK_SECRET
 *   Events: outbound_report (delivered, read, failed)
 *
 * Expected payload shapes (MSG91 v2):
 * {
 *   "requestId": "string",
 *   "to": "919876543210",
 *   "status": "delivered" | "read" | "sent" | "failed",
 *   "timestamp": "2026-03-23T10:22:00.000Z"
 * }
 *
 * MSG91 may also send an array wrapped payload:
 * { "data": [...] }
 *
 * ENV:
 *   MSG91_WEBHOOK_SECRET — shared secret to validate incoming requests
 */

interface Msg91WaEvent {
    requestId?: string;
    to?: string;
    phone?: string; // some versions use "phone"
    mobile?: string; // some versions use "mobile"
    status?: string;
    timestamp?: string;
    report?: Array<{ status?: string }>;
}

function normalizePhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    // Accept 91XXXXXXXXXX or 10-digit; normalize to last 10
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 10) return digits;
    return null;
}

function extractEvents(body: unknown): Msg91WaEvent[] {
    if (!body || typeof body !== 'object') return [];
    const b = body as Record<string, unknown>;

    // Array at top level
    if (Array.isArray(b)) return b as Msg91WaEvent[];

    // { data: [...] } wrapper
    if (Array.isArray(b['data'])) return b['data'] as Msg91WaEvent[];

    // Single event object
    if (b['to'] || b['phone'] || b['mobile']) return [b as Msg91WaEvent];

    return [];
}

export async function POST(req: NextRequest) {
    // ── Secret validation ────────────────────────────────────────────────────
    const secret = process.env.MSG91_WEBHOOK_SECRET;
    if (secret) {
        const qSecret = req.nextUrl.searchParams.get('secret');
        const hSecret = req.headers.get('x-webhook-secret');
        if (qSecret !== secret && hSecret !== secret) {
            console.warn('[WA Webhook] Unauthorized — secret mismatch');
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
    }

    const events = extractEvents(body);
    if (events.length === 0) {
        // MSG91 sometimes sends a ping/test with empty body — ack it
        return NextResponse.json({ received: true, processed: 0 });
    }

    let delivered = 0,
        read = 0,
        failed = 0,
        skipped = 0;

    for (const event of events) {
        const rawPhone = event.to || event.phone || event.mobile || '';
        const phone = normalizePhone(rawPhone);
        const status = (event.status || '').toLowerCase();
        const ts = event.timestamp || new Date().toISOString();

        if (!phone || !status) {
            skipped++;
            continue;
        }

        // Map MSG91 status → column/state
        let updateCol: 'delivered_at' | 'read_at' | 'failed' | null = null;
        if (status === 'delivered') updateCol = 'delivered_at';
        else if (status === 'read') updateCol = 'read_at';
        else if (status === 'failed' || status === 'undelivered' || status === 'rejected' || status === 'bounced')
            updateCol = 'failed';
        else {
            skipped++;
            continue;
        }

        // Find the most recent SENT row for this phone (exact match against common clean DB formats)
        let query = adminClient
            .from('cam_whatsapp_recipients')
            .select('id')
            .in('phone', [phone, `91${phone}`, `+91${phone}`])
            .eq('send_status', 'SENT');

        // Only update delivered/read if not already set (for idempotency)
        if (updateCol !== 'failed') {
            query = query.is(updateCol, null);
        }

        const { data: latestRow, error: fetchError } = await query
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError || !latestRow) {
            skipped++;
            continue;
        }

        const updatePayload = updateCol === 'failed' ? { send_status: 'FAILED' } : { [updateCol]: ts };

        const { error } = await adminClient
            .from('cam_whatsapp_recipients')
            .update(updatePayload)
            .eq('id', latestRow.id);

        if (error) {
            console.error('[WA Webhook] DB update error:', { phone, status, error: error.message });
            skipped++;
            continue;
        }

        if (updateCol === 'delivered_at') delivered++;
        else if (updateCol === 'read_at') read++;
        else failed++;
    }

    console.log(
        `[WA Webhook] Processed ${events.length} events → delivered:${delivered} read:${read} failed:${failed} skipped:${skipped}`
    );

    return NextResponse.json({
        received: true,
        processed: events.length,
        delivered,
        read,
        failed,
        skipped,
    });
}

// MSG91 sometimes sends a GET request to verify the endpoint is live
export async function GET(req: NextRequest) {
    const secret = process.env.MSG91_WEBHOOK_SECRET;
    const qSecret = req.nextUrl.searchParams.get('secret');
    if (secret && qSecret !== secret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, service: 'msg91-wa-webhook' });
}
