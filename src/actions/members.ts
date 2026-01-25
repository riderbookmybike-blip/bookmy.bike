'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const toTitleCase = (str: string) =>
    str
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export type MemberProfile = {
    member: any;
    contacts: any[];
    addresses: any[];
    assets: any[];
    events: any[];
    payments: any[];
    bookings: any[];
    leads: any[];
    quotes: any[];
};

export type MemberCreateInput = {
    tenantId: string;
    fullName: string;
    phone?: string;
    email?: string;
    panNumber?: string;
    aadhaarNumber?: string;
};

export type MemberAddressInput = {
    memberId: string;
    label: string;
    line1?: string;
    line2?: string;
    line3?: string;
    taluka?: string;
    state?: string;
    country?: string;
    pincode?: string;
    isCurrent?: boolean;
};

export type MemberContactInput = {
    memberId: string;
    contactType: 'PHONE' | 'WHATSAPP' | 'EMAIL';
    label?: string;
    value: string;
    isPrimary?: boolean;
};

const buildOrFilter = (filters: Array<string | null>) =>
    filters.filter(Boolean).join(',');

export async function findMemberMatch(input: {
    phone?: string;
    panNumber?: string;
    aadhaarNumber?: string;
}) {
    const orFilter = buildOrFilter([
        input.phone ? `primary_phone.eq.${input.phone}` : null,
        input.panNumber ? `pan_number.eq.${input.panNumber}` : null,
        input.aadhaarNumber ? `aadhaar_number.eq.${input.aadhaarNumber}` : null
    ]);

    if (orFilter) {
        const { data: member, error } = await adminClient
            .from('id_members')
            .select('id, full_name, display_id, primary_phone, pan_number, aadhaar_number')
            .or(orFilter)
            .maybeSingle();

        if (error) throw error;
        if (member) return member;
    }

    if (input.phone) {
        const { data: contact, error: contactError } = await adminClient
            .from('id_member_contacts')
            .select('member_id')
            .eq('value', input.phone)
            .in('contact_type', ['PHONE', 'WHATSAPP'])
            .maybeSingle();

        if (contactError) throw contactError;
        if (contact?.member_id) {
            const { data: member } = await adminClient
                .from('id_members')
                .select('id, full_name, display_id, primary_phone, pan_number, aadhaar_number')
                .eq('id', contact.member_id)
                .maybeSingle();

            if (member) return member;
        }
    }

    return null;
}

async function ensureAuthUser(phone?: string, fullName?: string) {
    if (!phone) return null;

    const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existing = list.users.find(u => u.phone === phone || u.phone === `+91${phone}`);
    if (existing) return existing.id;

    const { data: authUser, error } = await adminClient.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: {
            full_name: fullName ? toTitleCase(fullName) : undefined
        }
    });

    if (error) {
        if (error.message.includes('already exists')) {
            const { data: secondList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            const fallback = secondList.users.find(u => u.phone === phone || u.phone === `+91${phone}`);
            return fallback?.id ?? null;
        }
        throw error;
    }

    return authUser.user?.id ?? null;
}

export async function createOrLinkMember(input: MemberCreateInput) {
    const match = await findMemberMatch({
        phone: input.phone,
        panNumber: input.panNumber,
        aadhaarNumber: input.aadhaarNumber
    });

    let memberId = match?.id ?? null;

    if (!memberId) {
        const authId = await ensureAuthUser(input.phone, input.fullName);
        const { data: member, error } = await adminClient
            .from('id_members')
            .insert({
                id: authId ?? undefined,
                full_name: toTitleCase(input.fullName),
                primary_phone: input.phone,
                primary_email: input.email,
                pan_number: input.panNumber,
                aadhaar_number: input.aadhaarNumber,
                tenant_id: input.tenantId,
                role: 'BMB_USER'
            })
            .select('id, display_id, full_name')
            .single();

        if (error) throw error;
        memberId = member.id;

        if (input.phone) {
            await adminClient.from('id_member_contacts').insert({
                member_id: memberId,
                contact_type: 'PHONE',
                label: 'Primary',
                value: input.phone,
                is_primary: true
            });
        }

        if (input.email) {
            await adminClient.from('id_member_contacts').insert({
                member_id: memberId,
                contact_type: 'EMAIL',
                label: 'Primary',
                value: input.email,
                is_primary: true
            });
        }
    } else {
        const updates: Record<string, string | undefined> = {};
        if (input.fullName) updates.full_name = toTitleCase(input.fullName);
        if (input.phone) updates.primary_phone = input.phone;
        if (input.email) updates.primary_email = input.email;
        if (input.panNumber) updates.pan_number = input.panNumber;
        if (input.aadhaarNumber) updates.aadhaar_number = input.aadhaarNumber;
        if (Object.keys(updates).length) {
            await adminClient.from('id_members').update(updates).eq('id', memberId);
        }
    }

    await adminClient.from('id_member_tenants').upsert({
        member_id: memberId,
        tenant_id: input.tenantId,
        status: 'ACTIVE'
    }, { onConflict: 'member_id,tenant_id' });

    await adminClient.from('id_member_events').insert({
        member_id: memberId,
        tenant_id: input.tenantId,
        event_type: match ? 'MEMBER_LINKED' : 'MEMBER_CREATED',
        payload: {
            source: 'members_module'
        }
    });

    const { data: member } = await adminClient
        .from('id_members')
        .select('id, display_id, full_name, primary_phone, primary_email, pan_number, aadhaar_number, member_status, joined_at, last_visit_at')
        .eq('id', memberId)
        .single();

    return {
        member,
        matchedExisting: !!match
    };
}

export async function getMembersForTenant(tenantId: string, search?: string, page: number = 1, pageSize: number = 50) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
        .from('id_members')
        .select(`
            id, 
            display_id, 
            full_name, 
            created_at, 
            updated_at, 
            taluka, 
            rto, 
            leads_count,
            bookings_count,
            quotes_count,
            primary_phone,
            primary_email,
            id_member_tenants!inner(tenant_id, status)
        `, { count: 'exact' })
        .eq('id_member_tenants.tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,primary_phone.ilike.%${search}%,display_id.ilike.%${search}%`);
    }

    let { data, error, count } = await query;
    console.log('getMembersForTenant: query result', { count, dataLength: data?.length, tenantId });
    if (error) {
        console.error('getMembersForTenant: join query error', {
            tenantId,
            search,
            page,
            pageSize,
            error
        });
        throw error;
    }

    // Fallback: some tenants store primary linkage on id_members.tenant_id only.
    if ((data || []).length === 0) {
        console.warn('getMembersForTenant: join returned 0, trying fallback', { tenantId });
        let fallbackQuery = adminClient
            .from('id_members')
            .select(`
                id, 
                display_id, 
                full_name, 
                created_at, 
                updated_at, 
                taluka, 
                rto, 
                leads_count,
                bookings_count,
                quotes_count,
                primary_phone,
                primary_email,
                id_member_tenants(tenant_id, status)
            `, { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            fallbackQuery = fallbackQuery.or(`full_name.ilike.%${search}%,primary_phone.ilike.%${search}%,display_id.ilike.%${search}%`);
        }

        const fallback = await fallbackQuery;
        console.log('getMembersForTenant: fallback result', { count: fallback.count, dataLength: fallback.data?.length });
        if (fallback.error) {
            console.error('getMembersForTenant: fallback query error', {
                tenantId,
                search,
                page,
                pageSize,
                error: fallback.error
            });
            throw fallback.error;
        }
        data = fallback.data;
        count = fallback.count;
        console.warn('getMembersForTenant: fallback used', {
            tenantId,
            search,
            page,
            pageSize,
            count: count || 0
        });
    } else {
        console.info('getMembersForTenant: join used', {
            tenantId,
            search,
            page,
            pageSize,
            count: count || 0
        });
    }

    const members = (data || []).map((m: any) => ({
        ...m,
        member_status: (m.id_member_tenants?.[0]?.status || m.member_status || 'ACTIVE').toUpperCase(),
        leads_count: m.leads_count || 0,
        bookings_count: m.bookings_count || 0,
        quotes_count: m.quotes_count || 0
    }));

    return {
        data: members,
        metadata: {
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize)
        }
    };
}

export async function getMemberSummaryForTenant(tenantId: string) {
    let { data, error } = await adminClient
        .from('id_members')
        .select(`
            id, 
            leads_count, 
            quotes_count, 
            bookings_count, 
            created_at, 
            updated_at, 
            last_visit_at, 
            primary_phone, 
            primary_email, 
            rto, 
            district,
            id_member_tenants!inner(tenant_id, status)
        `)
        .eq('id_member_tenants.tenant_id', tenantId);

    if (error) {
        console.error('getMemberSummaryForTenant: join query error', { tenantId, error });
        // Don't throw, try fallback
    }

    if (!data || data.length === 0) {
        const fallback = await adminClient
            .from('id_members')
            .select(`
                id, 
                leads_count, 
                quotes_count, 
                bookings_count, 
                created_at, 
                updated_at, 
                last_visit_at, 
                primary_phone, 
                primary_email, 
                rto, 
                district,
                taluka,
                id_member_tenants!inner(tenant_id, status)
            `)
            .eq('tenant_id', tenantId);

        if (fallback.error) {
            console.error('getMemberSummaryForTenant: fallback query error', { tenantId, error: fallback.error });
            throw fallback.error;
        }
        data = fallback.data;
        console.warn('getMemberSummaryForTenant: fallback used', { tenantId, count: data?.length || 0 });
    } else {
        console.info('getMemberSummaryForTenant: join used', { tenantId, count: data?.length || 0 });
    }

    return data || [];
}

export async function getMemberAnalytics(tenantId: string, timeframe: '7d' | '30d' | '3m' | '12m' | 'all' = '7d') {
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '3m': startDate.setMonth(now.getMonth() - 3); break;
        case '12m': startDate.setFullYear(now.getFullYear() - 1); break;
        case 'all': startDate = new Date(0); break;
    }

    // Fetch creations and updates
    const [{ data: newMembers }, { data: revisitedMembers }] = await Promise.all([
        adminClient
            .from('id_members')
            .select('created_at')
            .eq('tenant_id', tenantId)
            .gte('created_at', startDate.toISOString()),
        adminClient
            .from('id_members')
            .select('updated_at')
            .eq('tenant_id', tenantId)
            .gte('updated_at', startDate.toISOString())
            .filter('updated_at', 'gt', 'created_at')
    ]);

    // Group by date
    const stats: Record<string, { date: string; new: number; revisited: number }> = {};

    // Initialize day buckets
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90; // Approx
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        stats[key] = { date: key, new: 0, revisited: 0 };
    }

    newMembers?.forEach(m => {
        const key = m.created_at.split('T')[0];
        if (stats[key]) stats[key].new++;
    });

    revisitedMembers?.forEach(m => {
        const key = m.updated_at.split('T')[0];
        if (stats[key]) stats[key].revisited++;
    });

    return Object.values(stats).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMemberFullProfile(memberId: string) {
    const { data: member, error } = await adminClient
        .from('id_members')
        .select('*')
        .eq('id', memberId)
        .single();

    if (error) throw error;

    const [
        { data: contacts },
        { data: addresses },
        { data: events },
        { data: assets },
        { data: payments },
        { data: bookings },
        { data: leads }
    ] = await Promise.all([
        adminClient.from('id_member_contacts').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
        adminClient.from('id_member_addresses').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
        adminClient.from('id_member_events').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
        adminClient.from('id_member_assets').select('*').eq('entity_id', memberId).order('created_at', { ascending: false }),
        adminClient.from('crm_payments').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
        adminClient.from('crm_bookings').select('*, insurance:crm_insurance(*), allotment:crm_allotments(*), registration:crm_registration(*), pdi:crm_pdi(*)').eq('user_id', memberId).order('created_at', { ascending: false }),
        adminClient.from('crm_leads').select('*').eq('customer_id', memberId).order('created_at', { ascending: false })
    ]);

    const leadIds = (leads || []).map(l => l.id);
    const { data: quotes } = leadIds.length > 0
        ? await adminClient.from('crm_quotes').select('*').in('lead_id', leadIds).order('created_at', { ascending: false })
        : { data: [] };

    return {
        member,
        contacts: contacts || [],
        addresses: addresses || [],
        events: events || [],
        assets: assets || [],
        payments: payments || [],
        bookings: bookings || [],
        leads: leads || [],
        quotes: quotes || []
    };
}

export async function addMemberContact(input: MemberContactInput) {
    const { data, error } = await adminClient
        .from('id_member_contacts')
        .insert({
            member_id: input.memberId,
            contact_type: input.contactType,
            label: input.label,
            value: input.value,
            is_primary: input.isPrimary ?? false
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function addMemberAddress(input: MemberAddressInput) {
    const { data, error } = await adminClient
        .from('id_member_addresses')
        .insert({
            member_id: input.memberId,
            label: input.label,
            line1: input.line1,
            line2: input.line2,
            line3: input.line3,
            taluka: input.taluka,
            state: input.state,
            country: input.country,
            pincode: input.pincode,
            is_current: input.isCurrent ?? false
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function addMemberEvent(memberId: string, tenantId: string | null, eventType: string, payload?: Record<string, unknown>) {
    const { error } = await adminClient
        .from('id_member_events')
        .insert({
            member_id: memberId,
            tenant_id: tenantId,
            event_type: eventType,
            payload: payload || {}
        });

    if (error) throw error;
}

export async function getSelfMemberProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabase
        .from('id_members')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (!member) return null;

    const { data: contacts } = await supabase
        .from('id_member_contacts')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

    const { data: addresses } = await supabase
        .from('id_member_addresses')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

    const { data: assets } = await supabase
        .from('id_member_assets')
        .select('*')
        .eq('entity_id', user.id)
        .order('created_at', { ascending: false });

    return { member, contacts: contacts || [], addresses: addresses || [], assets: assets || [] };
}
