'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { MemberEventType } from '@/lib/constants/member-tracking';

const PRESENCE_EVENTS = new Set<MemberEventType>([
    'SESSION_START',
    'PAGE_VIEW',
    'HEARTBEAT',
    'CARD_CLICK',
    'ACTION_CLICK',
    'CATALOG_ACTIVITY',
    'PDP_ACTIVITY',
    'BLOG_ACTIVITY',
    'OCIRCLE_ACTIVITY',
    'EARN_ACTIVITY',
]);

function sanitisePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload || {})) {
        if (v === undefined) continue;
        if (typeof v === 'string') {
            out[k] = v.slice(0, 500);
            continue;
        }
        if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
            out[k] = v;
            continue;
        }
        if (Array.isArray(v)) {
            out[k] = v.slice(0, 20);
            continue;
        }
        if (typeof v === 'object') {
            out[k] = JSON.parse(JSON.stringify(v));
            continue;
        }
    }
    return out;
}

/**
 * Auth-hardened tracker: ignores the client-passed memberId and instead
 * resolves the authenticated user server-side. Silently drops if no session.
 */
export async function trackMemberEvent(
    _memberId: string,
    eventType: MemberEventType,
    payload: Record<string, unknown>
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user?.id) {
            // No valid session — silent drop (not an error, just logged-out state)
            return;
        }

        if (_memberId && _memberId !== user.id) {
            console.warn(
                `[MemberTracker] memberId mismatch — client sent "${_memberId}", ` +
                    `authenticated as "${user.id}". Using authenticated id.`
            );
        }

        const cleanPayload = sanitisePayload(payload);

        await adminClient.from('id_member_events').insert({
            member_id: user.id,
            tenant_id: null,
            event_type: eventType,
            payload: cleanPayload as any,
            created_by: null,
        });

        // Upsert presence via COALESCE RPC — never erases device/url on HEARTBEAT or PAGE_VIEW
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const presenceClient = adminClient as any;
        if (eventType === 'SESSION_END') {
            await presenceClient.from('id_member_presence').delete().eq('member_id', user.id);
        } else if (PRESENCE_EVENTS.has(eventType)) {
            await presenceClient.rpc('upsert_member_presence', {
                p_member_id: user.id,
                p_current_url: (cleanPayload.url as string) ?? null,
                p_device: (cleanPayload.device as string) ?? null,
                p_session_id: (cleanPayload.session_id as string) ?? null,
                p_event_type: eventType,
            });
        }
    } catch {
        // fire-and-forget — never block the user
    }
}

// ─── Anonymous tracking ───────────────────────────────────────────────────────

const ANON_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ANON_ALLOWED_EVENTS = new Set<MemberEventType>([
    'SESSION_START',
    'SESSION_END',
    'PAGE_VIEW',
    'HEARTBEAT',
    'CARD_CLICK',
    'ACTION_CLICK',
    'CATALOG_ACTIVITY',
    'PDP_ACTIVITY',
    'BLOG_ACTIVITY',
    'OCIRCLE_ACTIVITY',
    'EARN_ACTIVITY',
    'REFERRAL_CAPTURED',
    'REFERRAL_SHARED',
]);

function sanitiseUrl(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    // Truncate to 500 chars, keep only pathname+hash (strip ?query= PII)
    const clean = raw.slice(0, 500).split('?')[0];
    return clean || null;
}

/**
 * Tracks events for non-authenticated visitors.
 * Hardened: UUID-format check, event whitelist, URL sanitisation.
 * Uses adminClient only after all validations pass.
 */
export async function trackAnonEvent(
    anonSessionId: string,
    eventType: MemberEventType,
    payload: Record<string, unknown>
) {
    try {
        // Abuse controls — silent drops (never expose reason to caller)
        if (!ANON_UUID_RE.test(anonSessionId)) return;
        if (!ANON_ALLOWED_EVENTS.has(eventType)) return;

        const cleanPayload = sanitisePayload({
            ...payload,
            url: sanitiseUrl(payload.url),
        });

        await adminClient.from('id_member_events').insert({
            member_id: null,
            anon_session_id: anonSessionId,
            tenant_id: null,
            event_type: eventType,
            payload: cleanPayload as any,
            created_by: null,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pc = adminClient as any;
        if (eventType === 'SESSION_END') {
            await pc.from('id_anon_presence').delete().eq('anon_session_id', anonSessionId);
        } else if (PRESENCE_EVENTS.has(eventType)) {
            await pc.rpc('upsert_anon_presence', {
                p_anon_session_id: anonSessionId,
                p_current_url: sanitiseUrl(payload.url),
                p_device: (payload.device as string) ?? null,
                p_session_id: (payload.session_id as string) ?? null,
                p_event_type: eventType,
            });
        }
    } catch {
        // fire-and-forget — never block the user
    }
}

/**
 * Auth-hardened merge: links all anon events/presence to the authenticated user.
 * Returns { ok: true, merged: N } on success; { ok: false, merged: 0 } on any failure.
 * Caller should only rotate the local anon key when ok === true.
 */
export async function mergeAnonSession(anonSessionId: string): Promise<{ ok: boolean; merged: number }> {
    try {
        if (!ANON_UUID_RE.test(anonSessionId)) return { ok: false, merged: 0 };

        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user?.id) return { ok: false, merged: 0 };

        // 1. Claim anon events — cast to any: TS overload doesn't expose { count } on update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: mergeCount, error: updateError } = await (adminClient as any)
            .from('id_member_events')
            .update({ member_id: user.id, anon_session_id: null })
            .eq('anon_session_id', anonSessionId)
            .is('member_id', null)
            .select('*', { count: 'exact', head: true });

        if (updateError) return { ok: false, merged: 0 };

        // 2. Remove anon presence row
        await (adminClient as any).from('id_anon_presence').delete().eq('anon_session_id', anonSessionId);

        return { ok: true, merged: mergeCount ?? 0 };
    } catch {
        return { ok: false, merged: 0 };
    }
}

/**
 * Auth-hardened timeline reader: caller must be authenticated as the
 * requested memberId. Returns [] for unauthenticated or mismatched callers.
 */
export async function getMemberTimeline(memberId: string, limit = 100) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user?.id) return [];

        if (user.id !== memberId) {
            console.warn(
                `[getMemberTimeline] Auth mismatch — requested "${memberId}", ` +
                    `authenticated as "${user.id}". Returning [].`
            );
            return [];
        }

        const { data, error } = await adminClient
            .from('id_member_events')
            .select('id, event_type, payload, created_at')
            .eq('member_id', user.id)
            .in('event_type', ['SESSION_START', 'SESSION_END', 'PAGE_VIEW'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data ?? [];
    } catch {
        return [];
    }
}

// ── Location tracking ─────────────────────────────────────────────────────────

export type GeoPayload = {
    latitude: number;
    longitude: number;
    state: string | null;
    district: string | null;
    taluka: string | null;
    area: string | null; // locality / village / suburb
    pincode: string | null;
};

/**
 * Saves reverse-geocoded location to the authenticated member's id_members row.
 * All fields mapped from MEMBER_LOCATION_FIELDS SOT (src/lib/constants/member-fields.ts).
 * Silently drops if user is unauthenticated.
 */
export async function updateMemberLocation(geo: GeoPayload): Promise<{ ok: boolean }> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user?.id) return { ok: false };

        // Column names sourced from MEMBER_LOCATION_FIELDS SOT
        const update: Record<string, unknown> = {
            latitude: geo.latitude,
            longitude: geo.longitude,
            ...(geo.state && { state: geo.state }),
            ...(geo.district && { district: geo.district }),
            ...(geo.taluka && { taluka: geo.taluka }),
            ...(geo.area && { address: geo.area }), // MEMBER_LOCATION_FIELDS.AREA → 'address'
            ...(geo.pincode && { pincode: geo.pincode }),
            updated_at: new Date().toISOString(),
        };

        const { error } = await adminClient.from('id_members').update(update).eq('id', user.id);

        return { ok: !error };
    } catch {
        return { ok: false };
    }
}
