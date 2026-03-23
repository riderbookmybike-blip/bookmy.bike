import { NextRequest, NextResponse } from 'next/server';
import { markCampaignRecipientByPhone } from '@/lib/campaigns/wa-tracking';

type ParsedEvent = {
    phone: string | null;
    status: string | null;
    timestamp?: string | number | null;
};

function asObject(v: unknown): Record<string, unknown> {
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | null {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return s.length ? s : null;
}

function statusFrom(obj: Record<string, unknown>): string | null {
    return (
        str(obj.status) ||
        str(obj.message_status) ||
        str(obj.delivery_status) ||
        str(obj.event) ||
        str(obj.event_type) ||
        str(obj.eventType) ||
        str(obj.reason) ||
        str(obj.message) ||
        str(obj.description) ||
        str(asObject(obj.data).status) ||
        str(asObject(obj.data).message_status) ||
        str(asObject(obj.data).reason) ||
        str(asObject(obj.data).message) ||
        str(asObject(obj.data).description) ||
        str(asObject(obj.payload).status)
    );
}

function phoneFrom(obj: Record<string, unknown>): string | null {
    return (
        str(obj.customer_number) ||
        str(obj.customerNumber) ||
        str(obj.mobile) ||
        str(obj.phone) ||
        str(obj.number) ||
        str(obj.recipient) ||
        str(obj.destination) ||
        str(obj.to) ||
        str(asObject(obj.data).customer_number) ||
        str(asObject(obj.data).customerNumber) ||
        str(asObject(obj.data).mobile) ||
        str(asObject(obj.data).phone) ||
        str(asObject(obj.data).recipient) ||
        str(asObject(obj.data).destination) ||
        str(asObject(obj.data).to) ||
        str(asObject(obj.payload).customer_number) ||
        str(asObject(obj.payload).customerNumber) ||
        str(asObject(obj.payload).mobile) ||
        str(asObject(obj.payload).phone) ||
        str(asObject(obj.payload).to)
    );
}

function tsFrom(obj: Record<string, unknown>): string | number | null {
    return (
        (typeof obj.timestamp === 'string' || typeof obj.timestamp === 'number'
            ? (obj.timestamp as string | number)
            : null) ||
        (typeof obj.event_time === 'string' || typeof obj.event_time === 'number'
            ? (obj.event_time as string | number)
            : null) ||
        (typeof asObject(obj.data).timestamp === 'string' || typeof asObject(obj.data).timestamp === 'number'
            ? (asObject(obj.data).timestamp as string | number)
            : null)
    );
}

function parseEvents(body: unknown): ParsedEvent[] {
    if (Array.isArray(body)) {
        return body.map(item => {
            const o = asObject(item);
            return { phone: phoneFrom(o), status: statusFrom(o), timestamp: tsFrom(o) };
        });
    }

    const root = asObject(body);
    if (Array.isArray(root.events)) {
        return root.events.map(item => {
            const o = asObject(item);
            return { phone: phoneFrom(o), status: statusFrom(o), timestamp: tsFrom(o) };
        });
    }

    if (Array.isArray(root.data)) {
        return (root.data as unknown[]).map(item => {
            const o = asObject(item);
            return { phone: phoneFrom(o), status: statusFrom(o), timestamp: tsFrom(o) };
        });
    }

    return [{ phone: phoneFrom(root), status: statusFrom(root), timestamp: tsFrom(root) }];
}

function tryParseBody(raw: string): unknown {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
        return JSON.parse(trimmed);
    } catch {
        const params = new URLSearchParams(trimmed);
        const out: Record<string, string> = {};
        for (const [k, v] of params.entries()) out[k] = v;
        // If a nested JSON field exists (common in webhook providers), parse it.
        if (out.data) {
            try {
                out.data = JSON.parse(out.data) as unknown as string;
            } catch {
                // keep raw string
            }
        }
        return out;
    }
}

export async function POST(req: NextRequest) {
    try {
        const configuredSecret = process.env.MSG91_WA_WEBHOOK_SECRET?.trim();
        const authKey = process.env.MSG91_AUTH_KEY?.trim();

        // Validate if either secret is configured
        const expectedKey = configuredSecret || authKey;
        if (expectedKey) {
            const incoming =
                req.headers.get('x-wa-webhook-secret')?.trim() ||
                req.headers.get('x-msg91-secret')?.trim() ||
                req.headers.get('x-authkey')?.trim() ||
                req.headers.get('authkey')?.trim();
            if (!incoming || incoming !== expectedKey) {
                return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
            }
        }

        const raw = await req.text();
        const body = tryParseBody(raw);
        const events = parseEvents(body);

        let delivered = 0;
        let read = 0;
        let failed = 0;
        let clicked = 0;

        for (const ev of events) {
            const phone = ev.phone;
            const status = (ev.status || '').toLowerCase();
            if (!phone || !status) continue;

            if (status.includes('read')) {
                const ok = await markCampaignRecipientByPhone({ phone, event: 'read', timestamp: ev.timestamp });
                if (ok) read++;
                continue;
            }
            if (status.includes('deliver')) {
                const ok = await markCampaignRecipientByPhone({ phone, event: 'delivered', timestamp: ev.timestamp });
                if (ok) delivered++;
                continue;
            }
            if (status.includes('click')) {
                const ok = await markCampaignRecipientByPhone({ phone, event: 'clicked', timestamp: ev.timestamp });
                if (ok) clicked++;
                continue;
            }
            if (
                status.includes('fail') ||
                status.includes('undeliver') ||
                status.includes('rejected') ||
                status.includes('131026') ||
                status.includes('131049')
            ) {
                const ok = await markCampaignRecipientByPhone({ phone, event: 'failed', timestamp: ev.timestamp });
                if (ok) failed++;
            }
        }

        return NextResponse.json({ ok: true, received: events.length, delivered, read, clicked, failed });
    } catch (error) {
        console.error('[WA Webhook] parse/update error:', error);
        return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
    }
}
