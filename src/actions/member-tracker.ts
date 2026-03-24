'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type MemberEventType = 'SESSION_START' | 'SESSION_END' | 'PAGE_VIEW' | 'HEARTBEAT';

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

        await adminClient.from('id_member_events').insert({
            member_id: user.id,
            tenant_id: null,
            event_type: eventType,
            payload: payload as any,
            created_by: null,
        });

        // Upsert presence via COALESCE RPC — never erases device/url on HEARTBEAT or PAGE_VIEW
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const presenceClient = adminClient as any;
        if (eventType === 'SESSION_END') {
            await presenceClient.from('id_member_presence').delete().eq('member_id', user.id);
        } else {
            await presenceClient.rpc('upsert_member_presence', {
                p_member_id: user.id,
                p_current_url: (payload.url as string) ?? null,
                p_device: (payload.device as string) ?? null,
                p_session_id: (payload.session_id as string) ?? null,
                p_event_type: eventType,
            });
        }
    } catch {
        // fire-and-forget — never block the user
    }
}

// ─── Anonymous tracking ───────────────────────────────────────────────────────

const ANON_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ANON_ALLOWED_EVENTS = new Set<MemberEventType>(['SESSION_START', 'SESSION_END', 'PAGE_VIEW', 'HEARTBEAT']);

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

        const cleanPayload = {
            ...payload,
            url: sanitiseUrl(payload.url),
        };

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
        } else {
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
