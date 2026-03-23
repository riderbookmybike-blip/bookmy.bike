import { adminClient } from '@/lib/supabase/admin';

type TrackEvent = 'delivered' | 'read' | 'clicked' | 'signup' | 'login' | 'failed';

function toIso(input?: string | number | Date | null): string {
    if (!input) return new Date().toISOString();
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function normalizePhone10(phone: string | null | undefined): string | null {
    const digits = String(phone || '').replace(/\D/g, '');
    const ten = digits.slice(-10);
    return ten.length === 10 ? ten : null;
}

function eventColumn(
    event: Exclude<TrackEvent, 'failed'>
): 'delivered_at' | 'read_at' | 'clicked_at' | 'signup_at' | 'login_at' {
    switch (event) {
        case 'delivered':
            return 'delivered_at';
        case 'read':
            return 'read_at';
        case 'clicked':
            return 'clicked_at';
        case 'signup':
            return 'signup_at';
        case 'login':
            return 'login_at';
    }
}

async function updateRecipientById(
    recipientId: string,
    event: TrackEvent,
    timestamp?: string | number | Date | null
): Promise<boolean> {
    const payload: Record<string, string> = {};

    if (event === 'failed') {
        payload.send_status = 'FAILED';
    } else {
        const column = eventColumn(event);
        payload[column] = toIso(timestamp);
        if (event === 'read') {
            payload.delivered_at = payload[column];
        }
    }

    const { error } = await adminClient.from('cam_whatsapp_recipients').update(payload).eq('id', recipientId);
    if (error) {
        console.error('[WA Tracking] updateRecipientById error:', error);
        return false;
    }
    return true;
}

export async function markCampaignRecipientByPhone(params: {
    phone: string;
    event: TrackEvent;
    timestamp?: string | number | Date | null;
}): Promise<boolean> {
    const normalized = normalizePhone10(params.phone);
    if (!normalized) return false;

    const phoneDigits = String(params.phone).replace(/\D/g, '');
    const maybeFull = phoneDigits.length >= 10 ? phoneDigits : null;

    const { data, error } = await adminClient
        .from('cam_whatsapp_recipients')
        .select('id')
        .or(
            maybeFull && maybeFull !== normalized
                ? `phone.eq.${normalized},phone.eq.${maybeFull}`
                : `phone.eq.${normalized}`
        )
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[WA Tracking] markCampaignRecipientByPhone lookup error:', error);
        return false;
    }
    if (!data?.id) return false;

    return updateRecipientById(data.id, params.event, params.timestamp);
}

export async function markCampaignRecipientByMember(params: {
    memberId: string;
    event: Extract<TrackEvent, 'signup' | 'login' | 'clicked'>;
    timestamp?: string | number | Date | null;
}): Promise<boolean> {
    const { data, error } = await adminClient
        .from('cam_whatsapp_recipients')
        .select('id')
        .eq('member_id', params.memberId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[WA Tracking] markCampaignRecipientByMember lookup error:', error);
        return false;
    }
    if (!data?.id) return false;

    return updateRecipientById(data.id, params.event, params.timestamp);
}
