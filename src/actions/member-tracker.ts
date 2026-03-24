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
