'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const AUMS_ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'OWNER', 'ADMIN']);

async function assertAumsAdminAccess() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
        throw new Error('UNAUTHORIZED');
    }

    const { data: membership } = await supabase
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = String(membership?.role ?? '').toUpperCase();
    if (!AUMS_ALLOWED_ROLES.has(role)) {
        throw new Error('FORBIDDEN');
    }
}

type GetAllPlatformMembersResult = {
    data: Array<{
        id: string;
        display_id: string | null;
        full_name: string | null;
        primary_phone: string | null;
        created_at: string | null;
    }>;
    metadata: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
};

function normalizeSearchTerm(raw?: string) {
    if (!raw) return '';
    return raw.trim().replace(/[%_,]/g, ' ');
}

export async function getAllPlatformMembers(
    search?: string,
    page: number = 1,
    pageSize: number = 50
): Promise<GetAllPlatformMembersResult> {
    await assertAumsAdminAccess();
    const supabase = await createClient();

    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.floor(pageSize))) : 50;
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let query = adminClient
        .from('id_members')
        .select('id, display_id, full_name, primary_phone, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    const term = normalizeSearchTerm(search);
    if (term) {
        query = query.or(`full_name.ilike.%${term}%,primary_phone.ilike.%${term}%,display_id.ilike.%${term}%`);
    }

    let { data, error, count } = await query;
    if (error) {
        // Fallback to request-scoped client if service-role path fails in a given env.
        const fallback = await supabase
            .from('id_members')
            .select('id, display_id, full_name, primary_phone, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
        data = fallback.data;
        error = fallback.error;
        count = fallback.count;
    }
    if (error) throw error;

    const total = count || 0;
    return {
        data: (data || []) as GetAllPlatformMembersResult['data'],
        metadata: {
            total,
            page: safePage,
            pageSize: safePageSize,
            totalPages: Math.max(1, Math.ceil(total / safePageSize)),
        },
    };
}

export async function getPlatformPresenceSummary() {
    await assertAumsAdminAccess();
    const supabase = await createClient();

    let { data, error } = await (adminClient as any).rpc('aums_presence_summary');
    if (error) {
        const fallback = await (supabase as any).rpc('aums_presence_summary');
        data = fallback.data;
        error = fallback.error;
    }
    if (error) throw error;

    const row = Array.isArray(data) ? (data[0] as any) : null;
    return {
        liveNowCount: Number(row?.live_now_count || 0),
        active1hCount: Number(row?.active_1h_count || 0),
    };
}

export interface PresenceRow {
    member_id: string;
    current_url: string | null;
    device: string | null;
    session_id: string | null;
    event_type: string | null;
    updated_at: string;
}

export async function getPresenceForPage(memberIds: string[]): Promise<PresenceRow[]> {
    await assertAumsAdminAccess();
    const supabase = await createClient();

    const ids = Array.from(new Set((memberIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    // Query id_member_presence directly — consistent with realtime + 10-min UI window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data, error } = await (adminClient as any)
        .from('id_member_presence')
        .select('member_id, current_url, device, session_id, event_type, updated_at')
        .in('member_id', ids);
    if (error) {
        const fallback = await (supabase as any)
            .from('id_member_presence')
            .select('member_id, current_url, device, session_id, event_type, updated_at')
            .in('member_id', ids);
        data = fallback.data;
        error = fallback.error;
    }

    if (error) throw error;
    return (data || []) as PresenceRow[];
}

export type LiveMemberRow = {
    member_id: string; // real UUID for members; anon_session_id for guests
    current_url: string | null;
    device: string | null;
    event_type: string | null;
    updated_at: string;
    session_id: string | null;
    full_name: string | null;
    display_id: string | null;
    primary_phone: string | null;
    session_start_at: string | null;
    first_visit_at: string | null;
    last_visit_at: string | null;
    total_time_ms: number;
    is_anon: boolean; // true = anonymous visitor, false = authenticated member
};

/** Returns all active members (last 60 min) with identity + session + lifetime stats */
export async function getLiveMembersWithDetails(): Promise<LiveMemberRow[]> {
    await assertAumsAdminAccess();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = adminClient as any;
    const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Fetch authenticated member presence + anonymous presence in parallel
    const [{ data: presenceRows, error: presErr }, { data: anonRows }] = await Promise.all([
        pc
            .from('id_member_presence')
            .select('member_id, current_url, device, event_type, session_id, updated_at')
            .gte('updated_at', sixtyMinAgo)
            .neq('event_type', 'SESSION_END')
            .order('updated_at', { ascending: false }),
        pc
            .from('id_anon_presence')
            .select('anon_session_id, current_url, device, event_type, session_id, updated_at')
            .gte('updated_at', sixtyMinAgo)
            .neq('event_type', 'SESSION_END')
            .order('updated_at', { ascending: false }),
    ]);

    if (presErr) throw presErr;

    const memberIds = (presenceRows || []).map((r: any) => r.member_id as string);

    const [membersRes, sessionStartsRes, lifetimeRes] =
        memberIds.length > 0
            ? await Promise.all([
                  adminClient.from('id_members').select('id, full_name, display_id, primary_phone').in('id', memberIds),
                  adminClient
                      .from('id_member_events')
                      .select('member_id, created_at')
                      .in('member_id', memberIds)
                      .eq('event_type', 'SESSION_START')
                      .gte('created_at', sixtyMinAgo)
                      .order('created_at', { ascending: false }),
                  adminClient
                      .from('id_member_events')
                      .select('member_id, event_type, created_at, payload')
                      .in('member_id', memberIds)
                      .in('event_type', ['SESSION_START', 'PAGE_VIEW']),
              ])
            : [{ data: [] }, { data: [] }, { data: [] }];

    const memberMap = new Map((membersRes.data || []).map((m: any) => [m.id, m]));

    // Latest SESSION_START per member (within 60 min) = "Live Since"
    const sessionStartMap = new Map<string, string>();
    for (const e of (sessionStartsRes.data || []) as any[]) {
        if (!sessionStartMap.has(e.member_id)) sessionStartMap.set(e.member_id, e.created_at);
    }

    // Lifetime stats per member
    type Stats = { first: string; last: string; totalMs: number };
    const statsMap = new Map<string, Stats>();
    for (const e of (lifetimeRes.data || []) as any[]) {
        const id = e.member_id as string;
        const s = statsMap.get(id) || { first: e.created_at, last: e.created_at, totalMs: 0 };
        if (e.created_at < s.first) s.first = e.created_at;
        if (e.created_at > s.last) s.last = e.created_at;
        if (e.event_type === 'PAGE_VIEW') s.totalMs += Number(e.payload?.duration_ms) || 0;
        statsMap.set(id, s);
    }

    const memberRows: LiveMemberRow[] = (presenceRows || []).map((p: any) => {
        const m = (memberMap.get(p.member_id) || {}) as any;
        const st = statsMap.get(p.member_id);
        return {
            member_id: p.member_id,
            current_url: p.current_url ?? null,
            device: p.device ?? null,
            event_type: p.event_type ?? null,
            updated_at: p.updated_at,
            session_id: p.session_id ?? null,
            full_name: m.full_name ?? null,
            display_id: m.display_id ?? null,
            primary_phone: m.primary_phone ?? null,
            session_start_at: sessionStartMap.get(p.member_id) ?? null,
            first_visit_at: st?.first ?? null,
            last_visit_at: st?.last ?? null,
            total_time_ms: st?.totalMs ?? 0,
            is_anon: false,
        };
    });

    const guestRows: LiveMemberRow[] = (anonRows || []).map((a: any) => ({
        member_id: a.anon_session_id, // use anon_session_id as the display key
        current_url: a.current_url ?? null,
        device: a.device ?? null,
        event_type: a.event_type ?? null,
        updated_at: a.updated_at,
        session_id: a.session_id ?? null,
        full_name: null,
        display_id: null,
        primary_phone: null,
        session_start_at: null,
        first_visit_at: null,
        last_visit_at: null,
        total_time_ms: 0,
        is_anon: true,
    }));

    // Members first (known users), then guests — both sorted by updated_at desc
    return [...memberRows, ...guestRows].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
}
