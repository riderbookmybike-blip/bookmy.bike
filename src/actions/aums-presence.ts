'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const AUMS_ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'OWNER', 'ADMIN']);
const DB_QUERY_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: PromiseLike<T> | T, timeoutMs: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        return await Promise.race<T>([
            Promise.resolve(promise),
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

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
        // Location
        district: string | null;
        taluka: string | null;
        state: string | null;
        // Referral
        referral_code: string | null;
        referrer_name: string | null;
        referrer_display_id: string | null;
        referrer_member_id: string | null;
        // Analytics (from id_member_events via RPC)
        total_sessions: number;
        total_time_ms: number;
        last_active_at: string | null;
        pdp_interests: string[]; // ['Honda Activa 6g', 'TVS Ntorq']
        share_earn_clicks: number;
        referral_link_clicks: number;
        current_temperature: string | null;
        max_temperature: string | null;
        last_pdp_at: string | null;
        last_catalog_at: string | null;
        last_landing_at: string | null;
        has_saved_quote: boolean;
        // O' Circle
        oclub_balance: number;
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
    pageSize: number = 50,
    stateFilter?: string,
    temperatureFilter?: string,
    prioritizeRecent: boolean = true
): Promise<GetAllPlatformMembersResult> {
    await assertAumsAdminAccess();
    const supabase = await createClient();

    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.floor(pageSize))) : 50;
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const SELECT_COLS =
        'id, display_id, full_name, phone, primary_phone, whatsapp, created_at, district, taluka, state, referral_code, last_visit_at, visitor_temperature, current_temperature, max_temperature, last_pdp_at, last_catalog_at, last_landing_at, preferences, quotes_count';

    let query = adminClient.from('id_members').select(SELECT_COLS, { count: 'estimated' }).range(from, to);
    if (prioritizeRecent) {
        query = query
            .order('last_visit_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const term = normalizeSearchTerm(search);
    if (term) {
        query = query.or(`full_name.ilike.%${term}%,primary_phone.ilike.%${term}%,display_id.ilike.%${term}%`);
    }
    if (stateFilter) {
        query = query.ilike('state', stateFilter);
    }
    if (temperatureFilter && temperatureFilter !== 'all') {
        const t = temperatureFilter.toLowerCase();

        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: presenceRows } = await (adminClient as any)
            .from('id_member_presence')
            .select('member_id')
            .gte('updated_at', tenMinsAgo);
        const liveIds = (presenceRows || []).map((r: any) => r.member_id).filter(Boolean);
        const liveList = liveIds.length > 0 ? liveIds.join(',') : '';

        if (t === 'hot') {
            if (liveList) {
                query = query.or(`quotes_count.gt.0,and(current_temperature.eq.HOT,id.in.(${liveList}))`);
            } else {
                query = query.gt('quotes_count', 0);
            }
        } else if (t === 'warm') {
            if (liveList) {
                // WARM: No quotes AND (current_temperature is WARM OR (current_temperature is HOT but NOT live))
                // Note: PostgREST `not.in` string parsing is tricky in OR statements, but we can rewrite as:
                // last_pdp_at is not null, AND NOT hot.
                // Since current_temperature represents highest lifetime intent, if it's HOT/WARM they have last_pdp_at.
                query = query
                    .eq('quotes_count', 0)
                    .or(`current_temperature.eq.WARM,and(current_temperature.eq.HOT,not.id.in.(${liveList}))`);
            } else {
                query = query.eq('quotes_count', 0).in('current_temperature', ['HOT', 'WARM']);
            }
        } else if (t === 'cold') {
            query = query.eq('current_temperature', 'COLD').eq('quotes_count', 0);
        } else if (t === 'live') {
            if (liveIds.length > 0) {
                query = query.in('id', liveIds);
            } else {
                query = query.in('id', ['00000000-0000-0000-0000-000000000000']); // force empty
            }
        }
    }

    const adminResult = await withTimeout<any>(query, DB_QUERY_TIMEOUT_MS, 'getAllPlatformMembers admin query');
    let { data, error, count } = adminResult;
    if (error) {
        let fallbackQuery = supabase.from('id_members').select(SELECT_COLS, { count: 'estimated' }).range(from, to);

        if (prioritizeRecent) {
            fallbackQuery = fallbackQuery
                .order('last_visit_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });
        } else {
            fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
        }

        if (term) {
            fallbackQuery = fallbackQuery.or(
                `full_name.ilike.%${term}%,primary_phone.ilike.%${term}%,display_id.ilike.%${term}%`
            );
        }
        if (stateFilter) {
            fallbackQuery = fallbackQuery.ilike('state', stateFilter);
        }
        if (temperatureFilter && temperatureFilter !== 'all') {
            const t = temperatureFilter.toLowerCase();

            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const { data: presenceRows } = await (adminClient as any)
                .from('id_member_presence')
                .select('member_id')
                .gte('updated_at', tenMinsAgo);
            const liveIds = (presenceRows || []).map((r: any) => r.member_id).filter(Boolean);
            const liveList = liveIds.length > 0 ? liveIds.join(',') : '';

            if (t === 'hot') {
                if (liveList) {
                    fallbackQuery = fallbackQuery.or(
                        `quotes_count.gt.0,and(current_temperature.eq.HOT,id.in.(${liveList}))`
                    );
                } else {
                    fallbackQuery = fallbackQuery.gt('quotes_count', 0);
                }
            } else if (t === 'warm') {
                if (liveList) {
                    fallbackQuery = fallbackQuery
                        .eq('quotes_count', 0)
                        .or(`current_temperature.eq.WARM,and(current_temperature.eq.HOT,not.id.in.(${liveList}))`);
                } else {
                    fallbackQuery = fallbackQuery.eq('quotes_count', 0).in('current_temperature', ['HOT', 'WARM']);
                }
            } else if (t === 'cold') {
                fallbackQuery = fallbackQuery.eq('current_temperature', 'COLD').eq('quotes_count', 0);
            } else if (t === 'live') {
                if (liveIds.length > 0) {
                    fallbackQuery = fallbackQuery.in('id', liveIds);
                } else {
                    fallbackQuery = fallbackQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
                }
            }
        }

        const fallback = await withTimeout<any>(
            fallbackQuery,
            DB_QUERY_TIMEOUT_MS,
            'getAllPlatformMembers fallback query'
        );
        data = fallback.data;
        error = fallback.error;
        count = fallback.count;
    }
    if (error) throw error;

    const rows = data || [];

    // Batch-fetch analytics for this page of members
    let analyticsMap = new Map<
        string,
        {
            total_sessions: number;
            total_time_ms: number;
            last_active_at: string | null;
            pdp_interests: string[];
            share_earn_clicks: number;
            referral_link_clicks: number;
        }
    >();
    // Batch oclub wallet balances
    let oclubMap = new Map<string, number>();
    if (rows.length > 0) {
        const ids = rows.map((r: any) => r.id as string);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [analyticsResult, oclubResult] = await Promise.allSettled([
                withTimeout<any>(
                    (adminClient as any).rpc('get_member_analytics_batch', { p_member_ids: ids }),
                    DB_QUERY_TIMEOUT_MS,
                    'get_member_analytics_batch'
                ),
                withTimeout<any>(
                    (adminClient as any)
                        .from('oclub_wallets')
                        .select('member_id, available_system, available_referral')
                        .in('member_id', ids),
                    DB_QUERY_TIMEOUT_MS,
                    'oclub_wallets_batch'
                ),
            ]);

            if (analyticsResult.status === 'fulfilled') {
                for (const a of (analyticsResult.value?.data || []) as any[]) {
                    analyticsMap.set(a.member_id, {
                        total_sessions: Number(a.total_sessions ?? 0),
                        total_time_ms: Number(a.total_time_ms ?? 0),
                        last_active_at: a.last_active_at ?? null,
                        pdp_interests: Array.isArray(a.pdp_interests) ? a.pdp_interests : [],
                        share_earn_clicks: Number(a.share_earn_clicks ?? 0),
                        referral_link_clicks: Number(a.referral_link_clicks ?? 0),
                    });
                }
            }

            if (oclubResult.status === 'fulfilled') {
                for (const w of (oclubResult.value?.data || []) as any[]) {
                    oclubMap.set(w.member_id, Number(w.available_system ?? 0) + Number(w.available_referral ?? 0));
                }
            }
        } catch {
            // Keep page responsive even if analytics RPC is slow.
        }
    }

    const total = count || 0;
    return {
        data: rows.map((r: any) => {
            const a = analyticsMap.get(r.id) ?? {
                total_sessions: 0,
                total_time_ms: 0,
                last_active_at: null,
                pdp_interests: [],
                share_earn_clicks: 0,
                referral_link_clicks: 0,
            };
            const prefs = r.preferences ?? {};
            return {
                id: r.id,
                display_id: r.display_id ?? null,
                full_name: r.full_name ?? null,
                primary_phone: r.primary_phone ?? r.phone ?? r.whatsapp ?? null,
                created_at: r.created_at ?? null,
                district: r.district ?? null,
                taluka: r.taluka ?? null,
                state: r.state ?? null,
                referral_code: r.referral_code ?? null,
                referrer_name: prefs.signup_referrer_name ?? null,
                referrer_display_id: prefs.signup_referrer_display_id ?? null,
                referrer_member_id: prefs.signup_referrer_member_id ?? null,
                total_sessions: a.total_sessions,
                total_time_ms: a.total_time_ms,
                last_active_at: a.last_active_at ?? r.last_visit_at ?? null,
                pdp_interests: a.pdp_interests,
                share_earn_clicks: a.share_earn_clicks,
                referral_link_clicks: a.referral_link_clicks,
                visitor_temperature: r.visitor_temperature ?? null,
                current_temperature: r.current_temperature ?? r.visitor_temperature ?? null,
                max_temperature: r.max_temperature ?? r.visitor_temperature ?? null,
                last_pdp_at: r.last_pdp_at ?? null,
                last_catalog_at: r.last_catalog_at ?? null,
                last_landing_at: r.last_landing_at ?? null,
                has_saved_quote: (Number(r.quotes_count) || 0) > 0,
                oclub_balance: oclubMap.get(r.id) ?? 0,
            };
        }),
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

export async function getPlatformTemperatureSummary() {
    await assertAumsAdminAccess();

    // Do exact counts globally to bypass the broken RPC and match the new strict definitions.
    // We use a single optimized RPC to prevent 4 concurrent table scans which cause severe UI latency.
    const { data, error } = await (adminClient as any).rpc('get_aums_intent_counts').maybeSingle();

    if (error || !data) {
        console.error('[getPlatformTemperatureSummary] RPC failed:', error);
        return { ALL: 0, HOT: 0, WARM: 0, COLD: 0 };
    }

    const res = data as any;
    return {
        ALL: Number(res.total_all || 0),
        HOT: Number(res.total_hot || 0),
        WARM: Number(res.total_warm || 0),
        COLD: Number(res.total_cold || 0),
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
    member_id: string;
    current_url: string | null;
    device: string | null;
    event_type: string | null;
    updated_at: string;
    session_id: string | null;
    full_name: string | null;
    display_id: string | null;
    primary_phone: string | null;
    created_at: string | null; // member join date
    district: string | null;
    taluka: string | null;
    state: string | null;
    session_start_at: string | null;
    first_visit_at: string | null;
    last_visit_at: string | null;
    total_time_ms: number;
    is_anon: boolean;
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

    const MAX_LIVE_ROWS = 500;
    const boundedPresenceRows = (presenceRows || []).slice(0, MAX_LIVE_ROWS);
    const memberIds: string[] = Array.from(
        new Set(boundedPresenceRows.map((r: any) => String(r?.member_id || '')).filter(Boolean))
    );

    const [membersRes, sessionStartsRes, lifetimeRes] =
        memberIds.length > 0
            ? await Promise.all([
                  adminClient
                      .from('id_members')
                      .select(
                          'id, full_name, display_id, phone, primary_phone, whatsapp, created_at, district, taluka, state'
                      )
                      .in('id', memberIds),
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

    const memberRows: LiveMemberRow[] = boundedPresenceRows.map((p: any) => {
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
            primary_phone: m.primary_phone ?? m.phone ?? m.whatsapp ?? null,
            created_at: m.created_at ?? null,
            district: m.district ?? null,
            taluka: m.taluka ?? null,
            state: m.state ?? null,
            session_start_at: sessionStartMap.get(p.member_id) ?? null,
            first_visit_at: st?.first ?? null,
            last_visit_at: st?.last ?? null,
            total_time_ms: st?.totalMs ?? 0,
            is_anon: false,
        };
    });

    const guestRows: LiveMemberRow[] = (anonRows || []).map((a: any) => ({
        member_id: a.anon_session_id,
        current_url: a.current_url ?? null,
        device: a.device ?? null,
        event_type: a.event_type ?? null,
        updated_at: a.updated_at,
        session_id: a.session_id ?? null,
        full_name: null,
        display_id: null,
        primary_phone: null,
        created_at: null,
        district: null,
        taluka: null,
        state: null,
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
