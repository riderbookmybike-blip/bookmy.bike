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

    const { data, error, count } = await query;
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

    const { data, error } = await (adminClient as any).rpc('aums_presence_summary');
    if (error) throw error;

    const row = Array.isArray(data) ? (data[0] as any) : null;
    return {
        liveNowCount: Number(row?.live_now_count || 0),
        active1hCount: Number(row?.active_1h_count || 0),
    };
}

type PresenceRow = {
    member_id: string;
    current_url: string | null;
    device: string | null;
    session_id: string | null;
    event_type: string | null;
    updated_at: string;
};

export type { PresenceRow };

export async function getPresenceForPage(memberIds: string[]): Promise<PresenceRow[]> {
    await assertAumsAdminAccess();

    const ids = Array.from(new Set((memberIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    // Query id_member_presence directly — consistent with realtime + 10-min UI window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
        .from('id_member_presence')
        .select('member_id, current_url, device, session_id, event_type, updated_at')
        .in('member_id', ids);

    if (error) throw error;
    return (data || []) as PresenceRow[];
}
