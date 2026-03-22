'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

import { toAppStorageFormat, isValidPhone, toE164IN, getPhoneLookupVariants } from '@/lib/utils/phoneUtils';
import { normalizeGeoCoordinates } from '@/lib/location/coordinates';

type ReferralKind = 'MEMBER' | 'TEAM';

type ReferrerSummary = {
    id: string;
    display_id: string | null;
    full_name: string | null;
    role: string | null;
    kind: ReferralKind;
    benefit_eligible: boolean;
};

const resolveReferralKind = (role: string | null | undefined): ReferralKind => {
    return String(role || '')
        .trim()
        .toUpperCase() === 'MEMBER'
        ? 'MEMBER'
        : 'TEAM';
};

const extractSignupReferrerMemberId = (preferences: unknown): string | null => {
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return null;
    const candidate = (preferences as Record<string, unknown>).signup_referrer_member_id;
    if (typeof candidate !== 'string') return null;
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const buildReferrerSummary = (row: any): ReferrerSummary => {
    const kind = resolveReferralKind(row?.role ?? null);
    return {
        id: row?.id,
        display_id: row?.display_id ?? null,
        full_name: row?.full_name ?? null,
        role: row?.role ?? null,
        kind,
        benefit_eligible: kind === 'MEMBER',
    };
};

const toTitleCase = (str: string) =>
    str
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

// MemberProfile type removed as it was unused locally

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

const buildOrFilter = (filters: Array<string | null>) => filters.filter(Boolean).join(',');

export async function findMemberMatch(input: { phone?: string; panNumber?: string; aadhaarNumber?: string }) {
    const cleanPhone = input.phone ? toAppStorageFormat(input.phone) : undefined;
    const validPhone = cleanPhone && isValidPhone(cleanPhone) ? cleanPhone : undefined;
    const phoneVariants = getPhoneLookupVariants(validPhone);

    const orFilter = buildOrFilter([
        ...phoneVariants.flatMap(p => [`primary_phone.eq.${p}`, `phone.eq.${p}`]),
        input.panNumber ? `pan_number.eq.${input.panNumber}` : null,
        input.aadhaarNumber ? `aadhaar_number.eq.${input.aadhaarNumber}` : null,
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

    if (validPhone) {
        const { data: contact, error: contactError } = await adminClient
            .from('id_member_contacts')
            .select('member_id')
            .eq('value', validPhone)
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
    const cleanPhone = toAppStorageFormat(phone);
    if (!isValidPhone(cleanPhone)) {
        throw new Error('Invalid phone number');
    }

    const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existing = list.users.find(u => u.phone === cleanPhone || u.phone?.replace(/\D/g, '').endsWith(cleanPhone));
    if (existing) return existing.id;

    const { data: authUser, error } = await adminClient.auth.admin.createUser({
        phone: `+91${cleanPhone}`, // Supabase Auth requires E.164
        phone_confirm: true,
        user_metadata: {
            full_name: fullName ? toTitleCase(fullName) : undefined,
        },
    });

    if (error) {
        if (error.message.includes('already exists')) {
            const { data: secondList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            const fallback = secondList.users.find(
                u => u.phone === cleanPhone || u.phone?.replace(/\D/g, '').endsWith(cleanPhone)
            );
            return fallback?.id ?? null;
        }
        throw error;
    }

    return authUser.user?.id ?? null;
}

export async function createOrLinkMember(input: MemberCreateInput) {
    if (input.phone && !isValidPhone(input.phone)) {
        throw new Error('Invalid phone number');
    }
    const match = await findMemberMatch({
        phone: input.phone,
        panNumber: input.panNumber,
        aadhaarNumber: input.aadhaarNumber,
    });

    let memberId = match?.id ?? null;

    // Also check if auth user exists and a member with that ID exists
    if (!memberId && input.phone) {
        const authId = await ensureAuthUser(input.phone, input.fullName);
        if (authId) {
            // Check if member already exists with this auth ID
            const { data: existingMember } = await adminClient
                .from('id_members')
                .select('id')
                .eq('id', authId)
                .maybeSingle();

            if (existingMember) {
                memberId = existingMember.id;
            }
        }
    }

    let createdNewMember = false;

    if (!memberId) {
        const authId = await ensureAuthUser(input.phone, input.fullName);

        // Use upsert instead of insert to handle cases where auth user exists but member match failed
        const { data: member, error } = await adminClient
            .from('id_members')
            .upsert(
                {
                    id: authId ?? undefined,
                    full_name: toTitleCase(input.fullName),
                    primary_phone: input.phone ? toAppStorageFormat(input.phone) : undefined,
                    phone: input.phone ? toE164IN(input.phone) : undefined,
                    primary_email: input.email,
                    pan_number: input.panNumber,
                    aadhaar_number: input.aadhaarNumber,
                    tenant_id: input.tenantId,
                    role: 'member',
                },
                {
                    onConflict: 'id', // Primary key conflict handler
                    ignoreDuplicates: false, // Update if exists
                }
            )
            .select('id, display_id, full_name')
            .single();

        if (error) {
            console.error('[createOrLinkMember] Upsert error:', error);
            throw error;
        }

        if (!member?.id) {
            // Fallback: If upsert didn't return data, query by authId
            if (authId) {
                const { data: existingMember } = await adminClient
                    .from('id_members')
                    .select('id, display_id, full_name')
                    .eq('id', authId)
                    .single();

                if (existingMember) {
                    memberId = existingMember.id;
                } else {
                    throw new Error('Member creation failed and fallback query returned no results');
                }
            } else {
                throw new Error('Member creation failed: no member ID returned from upsert');
            }
        } else {
            memberId = member.id;
        }

        if (input.phone) {
            await adminClient.from('id_member_contacts').insert({
                member_id: memberId,
                contact_type: 'PHONE',
                label: 'Primary',
                value: toAppStorageFormat(input.phone),
                is_primary: true,
            });
        }

        if (input.email) {
            await adminClient.from('id_member_contacts').insert({
                member_id: memberId,
                contact_type: 'EMAIL',
                label: 'Primary',
                value: input.email,
                is_primary: true,
            });
        }

        createdNewMember = true;
    } else {
        const updates: Record<string, string | undefined> = {};
        if (input.fullName) updates.full_name = toTitleCase(input.fullName);
        if (input.phone) updates.primary_phone = toAppStorageFormat(input.phone);
        if (input.email) updates.primary_email = input.email;
        if (input.panNumber) updates.pan_number = input.panNumber;
        if (input.aadhaarNumber) updates.aadhaar_number = input.aadhaarNumber;
        if (Object.keys(updates).length) {
            await adminClient.from('id_members').update(updates).eq('id', memberId);
        }
    }

    await adminClient.from('id_member_tenants').upsert(
        {
            member_id: memberId,
            tenant_id: input.tenantId,
            status: 'ACTIVE',
        },
        { onConflict: 'member_id,tenant_id' }
    );

    await adminClient.from('id_member_events').insert({
        member_id: memberId,
        tenant_id: input.tenantId,
        event_type: match ? 'MEMBER_LINKED' : 'MEMBER_CREATED',
        payload: {
            source: 'members_module',
        },
    });

    // Always attempt signup bonus — DB function is idempotent (checks for existing SIGNUP entry)
    try {
        await adminClient.rpc('oclub_credit_signup', { p_member_id: memberId });
    } catch (err) {
        console.error("[createOrLinkMember] O' Circle signup bonus error:", err);
    }

    const { data: member, error: memberError } = await adminClient
        .from('id_members')
        .select('id, display_id, full_name, primary_phone, primary_email, pan_number, aadhaar_number')
        .eq('id', memberId)
        .single();

    if (memberError || !member) {
        console.error('[createOrLinkMember] Final member query failed:', memberError);
        throw new Error(
            'Failed to retrieve member after creation/link: ' + (memberError?.message || 'No data returned')
        );
    }

    return {
        member,
        matchedExisting: !!match,
    };
}

export async function getMembersForTenant(tenantId: string, search?: string, page: number = 1, pageSize: number = 50) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
        .from('id_members')
        .select(
            `
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
            preferences,
            id_member_tenants!inner(tenant_id, status)
        `,
            { count: 'exact' }
        )
        .eq('id_member_tenants.tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,primary_phone.ilike.%${search}%,display_id.ilike.%${search}%`);
    }

    const { data: queryData, error, count: queryCount } = await query;
    let data = queryData;
    let count = queryCount;
    // console.log('getMembersForTenant: query result', { count, dataLength: data?.length, tenantId });
    if (error) {
        console.error('getMembersForTenant: join query error', {
            tenantId,
            search,
            page,
            pageSize,
            error,
        });
        throw error;
    }

    // Fallback: some tenants store primary linkage on id_members.tenant_id only.
    if ((data || []).length === 0) {
        console.warn('getMembersForTenant: join returned 0, trying fallback', { tenantId });
        let fallbackQuery = adminClient
            .from('id_members')
            .select(
                `
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
                preferences,
                id_member_tenants(tenant_id, status)
            `,
                { count: 'exact' }
            )
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            fallbackQuery = fallbackQuery.or(
                `full_name.ilike.%${search}%,primary_phone.ilike.%${search}%,display_id.ilike.%${search}%`
            );
        }

        const fallback = await fallbackQuery;
        // console.log('getMembersForTenant: fallback result', { count: fallback.count, dataLength: fallback.data?.length });
        if (fallback.error) {
            console.error('getMembersForTenant: fallback query error', {
                tenantId,
                search,
                page,
                pageSize,
                error: fallback.error,
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
            count: count || 0,
        });
    } else {
        console.info('getMembersForTenant: join used', {
            tenantId,
            search,
            page,
            pageSize,
            count: count || 0,
        });
    }

    const referrerMemberIds = Array.from(
        new Set(
            (data || [])
                .map((m: any) => extractSignupReferrerMemberId(m.preferences))
                .filter((id): id is string => Boolean(id))
        )
    );

    let referrerMap = new Map<string, ReferrerSummary>();
    if (referrerMemberIds.length > 0) {
        const { data: referrerRows } = await adminClient
            .from('id_members')
            .select('id, display_id, full_name, role')
            .in('id', referrerMemberIds);
        referrerMap = new Map(
            (referrerRows || []).filter((row: any) => row?.id).map((row: any) => [row.id, buildReferrerSummary(row)])
        );
    }

    const members = (data || []).map((m: any) => {
        const referrerMemberId = extractSignupReferrerMemberId(m.preferences);
        const referredBy = referrerMemberId ? referrerMap.get(referrerMemberId) || null : null;
        return {
            ...m,
            referred_by: referredBy,
            referral_benefit_status: referredBy
                ? referredBy.benefit_eligible
                    ? 'ELIGIBLE'
                    : 'BLOCKED_TEAM_REFERRER'
                : null,
            member_status: (m.id_member_tenants?.[0]?.status || m.member_status || 'ACTIVE').toUpperCase(),
            leads_count: m.leads_count || 0,
            bookings_count: m.bookings_count || 0,
            quotes_count: m.quotes_count || 0,
        };
    });

    return {
        data: members,
        metadata: {
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        },
    };
}

export async function getMemberSummaryForTenant(tenantId: string) {
    const { data: initialData, error } = await adminClient
        .from('id_members')
        .select(
            `
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
        `
        )
        .eq('id_member_tenants.tenant_id', tenantId);

    let data = initialData;
    if (error) {
        console.error('getMemberSummaryForTenant: join query error', { tenantId, error });
        // Don't throw, try fallback
    }

    if (!data || data.length === 0) {
        const fallback = await adminClient
            .from('id_members')
            .select(
                `
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
            `
            )
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
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        case '3m':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case '12m':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
            startDate = new Date(0);
            break;
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
            .filter('updated_at', 'gt', 'created_at'),
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
        if (!m.created_at) return;
        const key = m.created_at.split('T')[0];
        if (stats[key]) stats[key].new++;
    });

    revisitedMembers?.forEach(m => {
        if (!m.updated_at) return;
        const key = m.updated_at.split('T')[0];
        if (stats[key]) stats[key].revisited++;
    });

    return Object.values(stats).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMemberFullProfile(memberId: string) {
    const { data: member, error } = await adminClient
        .from('id_members')
        .select(
            'id, display_id, full_name, primary_phone, primary_email, pan_number, aadhaar_number, date_of_birth, role, work_company, work_designation, work_email, work_phone, pincode, state, rto, district, taluka, preferences, created_at, updated_at'
        )
        .eq('id', memberId)
        .maybeSingle();

    let resolvedMember = member;
    if (!resolvedMember && memberId) {
        if (error) {
            console.error('getMemberFullProfile: member lookup by id failed', { memberId, error });
        }
        const { data: memberByDisplay, error: displayError } = await adminClient
            .from('id_members')
            .select(
                'id, display_id, full_name, primary_phone, primary_email, pan_number, aadhaar_number, date_of_birth, role, work_company, work_designation, work_email, work_phone, pincode, state, rto, district, taluka, preferences, created_at, updated_at'
            )
            .eq('display_id', memberId)
            .maybeSingle();
        if (displayError) {
            console.error('getMemberFullProfile: member lookup by display_id failed', { memberId, displayError });
        }
        resolvedMember = memberByDisplay || null;
    }

    if (!resolvedMember) {
        return null;
    }

    const resolvedMemberId = resolvedMember.id;

    const signupReferrerMemberId = extractSignupReferrerMemberId((resolvedMember as any).preferences);
    let referredBy: ReferrerSummary | null = null;
    if (signupReferrerMemberId) {
        const { data: referrerRow } = await adminClient
            .from('id_members')
            .select('id, display_id, full_name, role')
            .eq('id', signupReferrerMemberId)
            .maybeSingle();
        if (referrerRow?.id) {
            referredBy = buildReferrerSummary(referrerRow);
        }
    }

    const { data: referredMembersRows } = await adminClient
        .from('id_members')
        .select('id, display_id, full_name, role, created_at, preferences')
        .contains('preferences', { signup_referrer_member_id: resolvedMemberId })
        .order('created_at', { ascending: false })
        .limit(30);

    const referredMembers = (referredMembersRows || []).map((row: any) => ({
        id: row.id,
        display_id: row.display_id || null,
        full_name: row.full_name || null,
        role: row.role || null,
        kind: resolveReferralKind(row.role),
        created_at: row.created_at || null,
    }));

    const [
        { data: contacts },
        { data: addresses },
        { data: events },
        { data: assets },
        { data: payments },
        { data: leads },
        { data: wallet },
        { data: ledger },
    ] = await Promise.all([
        adminClient
            .from('id_member_contacts')
            .select('*')
            .eq('member_id', resolvedMemberId)
            .order('created_at', { ascending: false }),
        adminClient
            .from('id_member_addresses')
            .select('*')
            .eq('member_id', resolvedMemberId)
            .order('created_at', { ascending: false }),
        adminClient
            .from('id_member_events')
            .select('*')
            .eq('member_id', resolvedMemberId)
            .order('created_at', { ascending: false }),
        adminClient
            .from('id_member_assets')
            .select('*')
            .eq('entity_id', resolvedMemberId)
            .order('created_at', { ascending: false }),
        adminClient
            .from('crm_payments')
            .select('*')
            .eq('member_id', resolvedMemberId)
            .order('created_at', { ascending: false }),
        adminClient
            .from('crm_leads')
            .select('*')
            .eq('customer_id', resolvedMemberId)
            .order('created_at', { ascending: false }),
        adminClient
            .from('oclub_wallets')
            .select(
                'available_system, available_referral, available_sponsored, locked_referral, pending_sponsored, lifetime_earned, lifetime_redeemed, updated_at'
            )
            .eq('member_id', resolvedMemberId)
            .maybeSingle(),
        adminClient
            .from('oclub_coin_ledger')
            .select('id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata, created_at')
            .eq('member_id', resolvedMemberId)
            .order('created_at', { ascending: false })
            .limit(50),
    ]);

    let bookings: any[] = [];
    try {
        const { data: bookingsData, error: bookingsError } = await adminClient
            .from('crm_bookings')
            .select(
                '*, insurance:crm_insurance(*), allotment:crm_allotments(*), registration:crm_registration(*), pdi:crm_pdi(*)'
            )
            .eq('user_id', resolvedMemberId)
            .order('created_at', { ascending: false });
        if (bookingsError) throw bookingsError;
        bookings = bookingsData || [];
    } catch (error) {
        const { data: bookingsFallback } = await adminClient
            .from('crm_bookings')
            .select('*')
            .eq('user_id', resolvedMemberId)
            .order('created_at', { ascending: false });
        bookings = bookingsFallback || [];
    }

    const leadIds = (leads || []).map(l => l.id);
    const { data: quotes } =
        leadIds.length > 0
            ? await adminClient
                  .from('crm_quotes')
                  .select('*')
                  .in('lead_id', leadIds)
                  .order('created_at', { ascending: false })
            : { data: [] };

    const mappedMember = resolvedMember
        ? {
              ...resolvedMember,
              phone: resolvedMember.primary_phone,
              email: resolvedMember.primary_email,
              member_status: (resolvedMember as any).role || 'ACTIVE',
              referred_by: referredBy,
              referral_benefit_status: referredBy
                  ? referredBy.benefit_eligible
                      ? 'ELIGIBLE'
                      : 'BLOCKED_TEAM_REFERRER'
                  : null,
              referred_members_count: referredMembers.length,
          }
        : resolvedMember;

    return {
        member: mappedMember,
        contacts: contacts || [],
        addresses: addresses || [],
        events: events || [],
        assets: assets || [],
        payments: payments || [],
        bookings: bookings || [],
        leads: leads || [],
        quotes: quotes || [],
        wallet: wallet || null,
        oclubLedger: ledger || [],
        referredMembers,
    };
}

export async function addMemberContact(input: MemberContactInput) {
    const { data, error } = await adminClient
        .from('id_member_contacts')
        .insert({
            member_id: input.memberId,
            contact_type: input.contactType,
            label: input.label,
            value:
                input.contactType === 'PHONE' || input.contactType === 'WHATSAPP'
                    ? toAppStorageFormat(input.value)
                    : input.value,
            is_primary: input.isPrimary ?? false,
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
            is_current: input.isCurrent ?? false,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function addMemberEvent(
    memberId: string,
    tenantId: string | null,
    eventType: string,
    payload?: Record<string, unknown>
) {
    const { error } = await adminClient.from('id_member_events').insert({
        member_id: memberId,
        tenant_id: tenantId,
        event_type: eventType,
        payload: (payload || {}) as any,
    });

    if (error) throw error;
}

import { getAuthUser } from '@/lib/auth/resolver';

export async function getSelfMemberProfile() {
    const user = await getAuthUser();
    const supabase = await createClient();
    if (!user) return null;

    const { data: member } = await supabase
        .from('id_members')
        .select(
            'id, display_id, full_name, primary_phone, primary_email, email, pan_number, aadhaar_number, member_status, avatar_url, preferences, created_at, updated_at'
        )
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

export async function getSelfMemberLocation() {
    const user = await getAuthUser();
    const supabase = await createClient();
    if (!user) return null;

    const { data: member } = await supabase
        .from('id_members')
        .select('id, pincode, district, taluka, state, latitude, longitude, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

    return member || null;
}

export async function updateSelfMemberLocation(location: {
    pincode?: string | null;
    district?: string | null;
    taluka?: string | null;
    state?: string | null;
    area?: string | null;
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
}) {
    const user = await getAuthUser();
    const supabase = await createClient();
    if (!user) return { success: false, error: 'UNAUTHENTICATED' };

    const updates: Record<string, unknown> = {};
    if (location.pincode) updates.pincode = location.pincode;
    if (location.district) updates.district = location.district;
    if (location.taluka) updates.taluka = location.taluka;
    if (location.state) updates.state = location.state;
    const coords = normalizeGeoCoordinates(location);
    if (typeof coords.latitude === 'number') updates.latitude = coords.latitude;
    if (typeof coords.longitude === 'number') updates.longitude = coords.longitude;
    if (location.area) {
        const { data: existing } = await supabase
            .from('id_members')
            .select('preferences')
            .eq('id', user.id)
            .maybeSingle();
        const existingPrefs =
            existing && typeof (existing as any).preferences === 'object' && (existing as any).preferences
                ? (existing as any).preferences
                : {};
        updates.preferences = {
            ...existingPrefs,
            location_area: location.area,
        };
    }

    if (Object.keys(updates).length === 0) {
        return { success: false, error: 'NO_UPDATES' };
    }

    const { data, error } = await supabase
        .from('id_members')
        .update(updates)
        .eq('id', user.id)
        .select('id, pincode, district, taluka, state, latitude, longitude')
        .maybeSingle();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL IDENTITY SERVICE — Phase 1
// id_members is the SINGLE SOURCE OF TRUTH for all member business data.
// auth.users is used for OTP/session only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * G1 — Ensure id_members row exists for a given auth user.
 * Called immediately after every OTP success / auth callback.
 * Safe to call on every login — ignoreDuplicates: true never overwrites existing data.
 *
 * @canonical
 */
export async function ensureMemberRow(
    authUserId: string,
    seed?: {
        phone?: string;
        fullName?: string;
    }
): Promise<void> {
    try {
        const insertPayload: Record<string, unknown> = {
            id: authUserId,
            role: 'customer', // production-confirmed default (21,431 / 22,344 rows)
            tenant_id: null, // no forced tenant — assigned organically via CRM/lead flow
        };

        if (seed?.phone) {
            const formatted = toAppStorageFormat(seed.phone);
            if (formatted && isValidPhone(formatted)) {
                insertPayload.primary_phone = formatted;
            }
        }

        if (seed?.fullName?.trim()) {
            insertPayload.full_name = toTitleCase(seed.fullName.trim());
        }

        const { error } = await adminClient
            .from('id_members')
            .upsert(insertPayload, { onConflict: 'id', ignoreDuplicates: true });

        if (error) {
            console.error('[ensureMemberRow] Upsert error:', error.message);
        }
    } catch (err) {
        // Non-fatal — log but don't block login flow
        console.error('[ensureMemberRow] Unexpected error:', err);
    }
}

/**
 * G3 — Canonical write path for self-edits (Profile page, O'Circle, user-facing flows).
 * Uses RLS-enforced client — user can only update their own id_members row.
 * This is the ONLY way profile data should be written from user-facing flows.
 *
 * @canonical
 */
export async function updateSelfMemberCanonical(updates: {
    fullName?: string;
    avatarUrl?: string;
    primaryPhone?: string;
    primaryEmail?: string;
    pincode?: string;
    district?: string;
    taluka?: string;
    state?: string;
    dateOfBirth?: string;
}) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'UNAUTHENTICATED' } as const;

    const sanitized: Record<string, unknown> = {};

    if (updates.fullName?.trim()) {
        sanitized.full_name = toTitleCase(updates.fullName.trim());
    }
    if (updates.avatarUrl !== undefined) {
        sanitized.avatar_url = updates.avatarUrl;
    }
    if (updates.primaryPhone) {
        const formatted = toAppStorageFormat(updates.primaryPhone);
        if (!formatted || !isValidPhone(formatted)) {
            return { success: false, error: 'INVALID_PHONE' } as const;
        }
        sanitized.primary_phone = formatted;
    }
    if (updates.primaryEmail?.trim()) {
        sanitized.primary_email = updates.primaryEmail.trim().toLowerCase();
    }
    if (updates.pincode) sanitized.pincode = updates.pincode;
    if (updates.district) sanitized.district = updates.district;
    if (updates.taluka) sanitized.taluka = updates.taluka;
    if (updates.state) sanitized.state = updates.state;
    if (updates.dateOfBirth) sanitized.date_of_birth = updates.dateOfBirth;

    if (Object.keys(sanitized).length === 0) {
        return { success: false, error: 'NO_UPDATES' } as const;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_members')
        .update(sanitized)
        .eq('id', user.id)
        .select('id, full_name, avatar_url, primary_phone, primary_email, pincode, district, taluka, state')
        .maybeSingle();

    if (error) {
        console.error('[updateSelfMemberCanonical] Update error:', error.message);
        return { success: false, error: error.message } as const;
    }

    // Log the update event for auditability
    try {
        await adminClient.from('id_member_events').insert({
            member_id: user.id,
            tenant_id: null,
            event_type: 'PROFILE_UPDATED',
            payload: { fields: Object.keys(sanitized), source: 'SELF' },
        });
    } catch {
        // Non-fatal — audit log failure should not block the update
    }

    // Revalidate consuming pages so SSR data reflects the update
    try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/profile');
        revalidatePath('/store/ocircle');
    } catch {
        /* non-fatal in non-RSC context */
    }

    return { success: true, data } as const;
}

/**
 * uploadMemberImage — server action that uploads a base64 JPEG to Supabase storage
 * using the adminClient, which bypasses RLS entirely.
 * Returns the public URL on success or an error message.
 */
export async function uploadMemberImage(
    memberId: string,
    base64Jpeg: string,
    variant: 'avatar' | 'cover'
): Promise<{ success: true; url: string } | { success: false; error: string }> {
    if (!memberId) return { success: false, error: 'Member ID missing' };

    // Decode base64 → Buffer
    const buffer = Buffer.from(base64Jpeg, 'base64');
    const fileName = variant === 'avatar' ? `avatar_${Date.now()}.jpg` : `cover_${Date.now()}.jpg`;
    const filePath = `${memberId}/${fileName}`;

    const { error: uploadError } = await adminClient.storage.from('users').upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
    });

    if (uploadError) return { success: false, error: uploadError.message };

    const {
        data: { publicUrl },
    } = adminClient.storage.from('users').getPublicUrl(filePath);

    // Update the member record
    if (variant === 'avatar') {
        const { error: dbErr } = await adminClient
            .from('id_members')
            .update({ avatar_url: publicUrl })
            .eq('id', memberId);
        if (dbErr) return { success: false, error: dbErr.message };
    } else {
        const { data: freshRow } = await adminClient
            .from('id_members')
            .select('preferences')
            .eq('id', memberId)
            .maybeSingle();
        const freshPrefs = (
            freshRow?.preferences && typeof freshRow.preferences === 'object' ? freshRow.preferences : {}
        ) as Record<string, unknown>;
        const { error: dbErr } = await adminClient
            .from('id_members')
            .update({ preferences: { ...freshPrefs, cover_image_url: publicUrl } })
            .eq('id', memberId);
        if (dbErr) return { success: false, error: dbErr.message };
    }

    return { success: true, url: publicUrl };
}
