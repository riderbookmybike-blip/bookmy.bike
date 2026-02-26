'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import {
    validateFinanceLeadDealer,
    validateQuoteDealerContext,
    validateBookingDealerContext,
    validateDealerAuthorization,
} from '@/lib/crm/contextHardening';
import { revalidatePath } from 'next/cache';
import { checkServiceability } from './serviceArea';
import { createOrLinkMember } from './members';
import { toAppStorageFormat } from '@/lib/utils/phoneUtils';
import { isAccessoryCompatible } from '@/lib/catalog/accessoryCompatibility';
import { sendStoreVisitSms } from '@/lib/sms/msg91';

const END_CUSTOMER_ROLES = new Set(['bmb_user', 'member', 'customer']);
const STAFF_SOURCE_HINTS = new Set(['LEADS', 'DEALER_REFERRAL', 'CRM']);

function normalizeRole(role?: string | null) {
    return (role || '').trim().toLowerCase();
}

function isEndCustomerRole(role?: string | null) {
    if (!role) return true;
    return END_CUSTOMER_ROLES.has(normalizeRole(role));
}

function isStaffContextSource(source?: string | null) {
    return STAFF_SOURCE_HINTS.has((source || '').trim().toUpperCase());
}

function normalizeLeadSource(source?: string | null) {
    const normalized = (source || '').trim().toUpperCase();
    if (normalized === 'WEBSITE_PDP') return 'PDP_QUICK_QUOTE';
    return normalized || undefined;
}

function asRecord(value: any): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, any>;
}

function normalizeDealerPayload(rawDealer: any): Record<string, any> | null {
    const dealer = asRecord(rawDealer);
    const dealerId = dealer.dealer_id || dealer.dealerId || dealer.id || dealer.tenant_id || null;
    const studioId = dealer.studio_id || dealer.studioId || null;
    const dealerName = dealer.dealer_name || dealer.dealerName || dealer.name || null;
    if (!dealerId && !studioId && !dealerName) return null;

    return {
        ...dealer,
        dealer_id: dealerId,
        id: dealerId || dealer.id || null,
        studio_id: studioId,
        dealer_name: dealerName,
    };
}

function normalizeCommercialsPayload(rawCommercials: any): Record<string, any> {
    const commercials = asRecord(rawCommercials);
    const pricingSnapshot = asRecord(commercials.pricing_snapshot);
    const normalizedSnapshot: Record<string, any> = {
        ...pricingSnapshot,
        ex_showroom:
            pricingSnapshot.ex_showroom ??
            pricingSnapshot.base_price ??
            commercials.ex_showroom ??
            commercials.base_price ??
            null,
        rto_total: pricingSnapshot.rto_total ?? commercials.rto_total ?? commercials.rto ?? 0,
        insurance_total: pricingSnapshot.insurance_total ?? commercials.insurance_total ?? commercials.insurance ?? 0,
        grand_total: pricingSnapshot.grand_total ?? commercials.grand_total ?? commercials.onRoad ?? null,
        color_name: pricingSnapshot.color_name ?? commercials.color_name ?? commercials.color ?? null,
    };

    const normalizedDealer = normalizeDealerPayload(normalizedSnapshot.dealer || commercials.dealer);
    if (normalizedDealer) {
        normalizedSnapshot.dealer = normalizedDealer;
    }

    return {
        ...commercials,
        dealer: normalizedDealer || commercials.dealer || null,
        pricing_snapshot: normalizedSnapshot,
    };
}

type ActorContext = {
    actorUserId: string | null;
    actorTenantId: string | null;
};

async function resolveActorContext(preferredTenantId?: string | null): Promise<ActorContext> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const actorUserId = user?.id || null;
    let actorTenantId = preferredTenantId || null;

    if (!actorTenantId && actorUserId) {
        const { data: teamMembership } = await adminClient
            .from('id_team')
            .select('tenant_id')
            .eq('user_id', actorUserId)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        actorTenantId = teamMembership?.tenant_id || null;
    }

    return { actorUserId, actorTenantId };
}

function normalizeEventChangedValue(changedValue?: unknown): string | null {
    if (changedValue === undefined || changedValue === null) return null;

    if (typeof changedValue === 'string') {
        const normalized = changedValue.trim();
        return normalized.length > 0 ? normalized.slice(0, 500) : null;
    }

    try {
        return JSON.stringify(changedValue).slice(0, 500);
    } catch {
        return String(changedValue).slice(0, 500);
    }
}

async function logLeadEvent(input: {
    leadId: string;
    eventType: string;
    notes?: string | null;
    changedValue?: unknown;
    actorUserId?: string | null;
    actorTenantId?: string | null;
}) {
    if (!input.leadId) return;

    const normalizedType = (input.eventType || '').trim().toUpperCase();
    if (!normalizedType) return;

    const context =
        input.actorUserId !== undefined || input.actorTenantId !== undefined
            ? {
                  actorUserId: input.actorUserId || null,
                  actorTenantId: input.actorTenantId || null,
              }
            : await resolveActorContext(input.actorTenantId || null);

    const { error } = await adminClient.from('crm_lead_events').insert({
        lead_id: input.leadId,
        event_type: normalizedType,
        actor_user_id: context.actorUserId,
        actor_tenant_id: context.actorTenantId,
        notes: input.notes || null,
        changed_value: normalizeEventChangedValue(input.changedValue),
    });

    if (error) {
        console.error('logLeadEvent Error:', error);
    }
}

// --- CUSTOMER PROFILES ---

// function getOrCreateCustomerProfile removed - using createOrLinkMember from members.ts instead

export async function updateMemberProfile(
    memberId: string,
    updates: {
        fullName?: string;
        primaryPhone?: string;
        whatsapp?: string;
        primaryEmail?: string;
        email?: string;
        dob?: string;
        pincode?: string;
        taluka?: string;
        district?: string;
        state?: string;
        currentAddress1?: string;
        currentAddress2?: string;
        currentAddress3?: string;
        aadhaarAddress1?: string;
        aadhaarAddress2?: string;
        aadhaarAddress3?: string;
        workAddress1?: string;
        workAddress2?: string;
        workAddress3?: string;
        workCompany?: string;
        workDesignation?: string;
        workEmail?: string;
        workPhone?: string;
        phonesJson?: any[];
        emailsJson?: any[];
        addressesJson?: any[];
    }
) {
    const supabase = await createClient();
    const payload: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.primaryPhone) payload.primary_phone = toAppStorageFormat(updates.primaryPhone);
    if (updates.whatsapp) payload.whatsapp = toAppStorageFormat(updates.whatsapp);
    if (updates.primaryEmail) payload.primary_email = updates.primaryEmail;
    if (updates.email) payload.email = updates.email;
    if (updates.dob) payload.date_of_birth = updates.dob;
    if (updates.pincode) payload.pincode = updates.pincode;
    if (updates.taluka) payload.taluka = updates.taluka;
    if (updates.district) payload.district = updates.district;
    if (updates.state) payload.state = updates.state;

    if (updates.currentAddress1) payload.current_address1 = updates.currentAddress1;
    if (updates.currentAddress2) payload.current_address2 = updates.currentAddress2;
    if (updates.currentAddress3) payload.current_address3 = updates.currentAddress3;

    if (updates.aadhaarAddress1) payload.aadhaar_address1 = updates.aadhaarAddress1;
    if (updates.aadhaarAddress2) payload.aadhaar_address2 = updates.aadhaarAddress2;
    if (updates.aadhaarAddress3) payload.aadhaar_address3 = updates.aadhaarAddress3;

    if (updates.workAddress1) payload.work_address1 = updates.workAddress1;
    if (updates.workAddress2) payload.work_address2 = updates.workAddress2;
    if (updates.workAddress3) payload.work_address3 = updates.workAddress3;

    if (updates.workCompany) payload.work_company = updates.workCompany;
    if (updates.workDesignation) payload.work_designation = updates.workDesignation;
    if (updates.workEmail) payload.work_email = updates.workEmail;
    if (updates.workEmail) payload.work_email = updates.workEmail;
    if (updates.workPhone) payload.work_phone = toAppStorageFormat(updates.workPhone);

    if (updates.phonesJson) payload.phones_json = updates.phonesJson;
    if (updates.emailsJson) payload.emails_json = updates.emailsJson;
    if (updates.addressesJson) payload.addresses_json = updates.addressesJson;

    const { error } = await supabase.from('id_members').update(payload).eq('id', memberId);

    if (error) {
        console.error('updateMemberProfile Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
}

export async function updateMemberAvatar(memberId: string, avatarUrl: string) {
    'use server';
    try {
        // Update id_members table
        const { error: memberError } = await adminClient
            .from('id_members')
            .update({ avatar_url: avatarUrl })
            .eq('id', memberId);

        if (memberError) {
            console.error('updateMemberAvatar: id_members error:', memberError);
        }

        // Also sync to Supabase Auth metadata
        try {
            await adminClient.auth.admin.updateUserById(memberId, {
                user_metadata: { avatar_url: avatarUrl },
            });
        } catch (authErr) {
            // Member may not be auth user (CRM-only member) - that's OK
            console.warn('updateMemberAvatar: auth sync skipped:', authErr);
        }

        return { success: true };
    } catch (error) {
        console.error('updateMemberAvatar Error:', error);
        return { success: false, error: String(error) };
    }
}

export async function checkExistingCustomer(phone: string) {
    const cleanPhone = toAppStorageFormat(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
        return { data: null, memberId: null };
    }

    // Search id_members by whatsapp OR primary_phone
    const { data: profile, error } = await adminClient
        .from('id_members')
        .select(
            `
            id,
            full_name, 
            aadhaar_pincode, 
            date_of_birth,
            whatsapp,
            primary_phone
        `
        )
        .or(`whatsapp.eq.${cleanPhone},primary_phone.eq.${cleanPhone}`)
        .maybeSingle();

    if (error) {
        console.error('Error checking existing customer:', error);
        return { data: null, memberId: null };
    }

    if (profile) {
        const hasActiveDelivery = await hasMemberActiveDelivery(profile.id);

        // Fetch B-coin wallet balance for pricing snapshot
        let walletCoins = 0;
        const { data: wallet } = await adminClient
            .from('oclub_wallets')
            .select('available_system, available_referral, available_sponsored')
            .eq('member_id', profile.id)
            .maybeSingle();
        if (wallet) {
            const w = wallet as any;
            walletCoins = (w.available_system || 0) + (w.available_referral || 0) + (w.available_sponsored || 0);
        }

        return {
            data: {
                name: profile.full_name,
                pincode: profile.aadhaar_pincode,
                dob: profile.date_of_birth,
            },
            memberId: profile.id,
            hasActiveDelivery,
            walletCoins,
        };
    }

    return { data: null, memberId: null, hasActiveDelivery: false, walletCoins: 0 };
}

const REPEAT_DELIVERY_BOOKING_STATUSES = ['ACTIVE', 'CONFIRMED', 'BOOKED', 'DELIVERED'] as const;

async function hasMemberActiveDelivery(memberId: string): Promise<boolean> {
    const { data, error } = await adminClient
        .from('crm_bookings')
        .select('id')
        .eq('is_deleted', false)
        .eq('user_id', memberId)
        .in('status', [...REPEAT_DELIVERY_BOOKING_STATUSES])
        .limit(1);

    if (error) {
        console.error('hasMemberActiveDelivery Error:', error);
        return false;
    }
    return (data || []).length > 0;
}

type LeadLocationProfile = {
    pincode: string;
    area: string | null;
    taluka: string | null;
    district: string | null;
    state: string | null;
    state_code: string | null;
    is_serviceable: boolean;
    serviceability_status: string | null;
    resolved_at: string;
};

function normalizeLeadLocationProfile(raw: any): LeadLocationProfile | null {
    if (!raw || typeof raw !== 'object') return null;
    const pincode = String(raw.pincode || '').trim();
    if (!/^\d{6}$/.test(pincode)) return null;

    return {
        pincode,
        area: raw.area || null,
        taluka: raw.taluka || null,
        district: raw.district || null,
        state: raw.state || null,
        state_code: raw.state_code || raw.stateCode || null,
        is_serviceable: raw.is_serviceable === true || raw.isServiceable === true,
        serviceability_status: raw.serviceability_status || raw.status || null,
        resolved_at: raw.resolved_at || raw.resolvedAt || new Date().toISOString(),
    };
}

function extractLeadLocationProfile(utmData: any): LeadLocationProfile | null {
    const normalizedUtm = utmData && typeof utmData === 'object' ? utmData : {};
    return normalizeLeadLocationProfile((normalizedUtm as any).location_profile);
}

export async function resolveLeadPincodeLocationAction(pincode: string) {
    const normalized = (pincode || '').replace(/\D/g, '');
    if (normalized.length !== 6) {
        return { success: false, message: 'Invalid pincode' };
    }

    const result = await checkServiceability(normalized);
    const locationProfile: LeadLocationProfile = {
        pincode: normalized,
        area: result?.area || null,
        taluka: result?.taluka || null,
        district: result?.district || null,
        state: result?.state || null,
        state_code: result?.stateCode || null,
        is_serviceable: !!result?.isServiceable,
        serviceability_status: result?.status || null,
        resolved_at: new Date().toISOString(),
    };

    return { success: true, location: locationProfile };
}

type LeadReferrerLookup = {
    memberId: string;
    name: string | null;
    phone: string | null;
    referralCode: string | null;
};

async function findLeadReferrerByCodeOrPhone(input: {
    referralCode?: string;
    referralPhone?: string;
}): Promise<LeadReferrerLookup | null> {
    const code = (input.referralCode || '').trim().toUpperCase();
    const normalizedPhone = toAppStorageFormat(input.referralPhone || '');

    if (!code && (!normalizedPhone || normalizedPhone.length !== 10)) {
        return null;
    }

    if (code) {
        const { data } = await adminClient
            .from('id_members')
            .select('id, full_name, referral_code, primary_phone, whatsapp')
            .eq('referral_code', code)
            .maybeSingle();

        if (data?.id) {
            return {
                memberId: data.id,
                name: data.full_name || null,
                phone: data.primary_phone || data.whatsapp || null,
                referralCode: data.referral_code || null,
            };
        }
    }

    if (normalizedPhone && normalizedPhone.length === 10) {
        const { data } = await adminClient
            .from('id_members')
            .select('id, full_name, referral_code, primary_phone, whatsapp')
            .or(`primary_phone.eq.${normalizedPhone},whatsapp.eq.${normalizedPhone}`)
            .maybeSingle();

        if (data?.id) {
            return {
                memberId: data.id,
                name: data.full_name || null,
                phone: data.primary_phone || data.whatsapp || null,
                referralCode: data.referral_code || null,
            };
        }
    }

    return null;
}

export async function resolveLeadReferrerAction(input: { referralCode?: string; referralPhone?: string }) {
    const referralCode = (input.referralCode || '').trim();
    const referralPhone = toAppStorageFormat(input.referralPhone || '');
    const match = await findLeadReferrerByCodeOrPhone({
        referralCode,
        referralPhone,
    });

    if (!referralCode && !referralPhone) {
        return { success: true, match: null };
    }

    return {
        success: true,
        match,
    };
}

// --- LEADS ---

const LEAD_INDEX_DEFAULT_PAGE_SIZE = 20;
const LEAD_INDEX_MAX_PAGE_SIZE = 100;
const LEAD_SEARCH_MAX_LENGTH = 60;

export type LeadSlaBucket = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'UNSCHEDULED' | 'CLEAR';

export type LeadIndexRow = {
    id: string;
    displayId: string;
    customerId?: string | null;
    customerName: string;
    phone: string;
    pincode?: string | null;
    taluka?: string | null;
    district?: string | null;
    state?: string | null;
    area?: string | null;
    dob?: string | null;
    status: string;
    source: string;
    interestModel?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    intentScore?: string;
    referralSource?: string | null;
    events_log?: any[];
    openTaskCount: number;
    nextFollowUpAt: string | null;
    slaBucket: LeadSlaBucket;
    lastActivityAt: string | null;
};

export type LeadIndexFilters = {
    search?: string;
    status?: string;
    intent?: string;
    sla?: LeadSlaBucket | 'ALL';
};

export type LeadIndexKpis = {
    totalLeads: number;
    hotLeads: number;
    qualifiedLeads: number;
    inPipeline: number;
    overdueFollowUps: number;
    dueTodayFollowUps: number;
};

export type LeadIndexPagination = {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
};

export type LeadIndexResponse = {
    success: boolean;
    rows: LeadIndexRow[];
    pagination: LeadIndexPagination;
    kpis: LeadIndexKpis;
    message?: string;
};

function normalizeLeadDisplayId(lead: any) {
    const rawDisplayId = String(lead?.display_id || lead?.displayId || '').trim();
    if (rawDisplayId) return rawDisplayId;

    const id = String(lead?.id || '');
    if (!id) return '---';
    const last9 = id.replace(/-/g, '').slice(-9).toUpperCase();
    return `${last9.slice(0, 3)}-${last9.slice(3, 6)}-${last9.slice(6, 9)}`;
}

function normalizeLeadSearch(search?: string) {
    if (!search) return '';
    return search
        .trim()
        .slice(0, LEAD_SEARCH_MAX_LENGTH)
        .replace(/[%*,]+/g, ' ')
        .replace(/\s+/g, ' ');
}

function startOfDay(input: Date) {
    const d = new Date(input);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(input: Date) {
    const d = new Date(input);
    d.setHours(23, 59, 59, 999);
    return d;
}

function parseDateValue(value: unknown): Date | null {
    if (!value || typeof value !== 'string') return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function deriveLeadSla(utmData: any): {
    slaBucket: LeadSlaBucket;
    openTaskCount: number;
    nextFollowUpAt: string | null;
} {
    const moduleData = utmData && typeof utmData === 'object' ? ((utmData as any).module_data as any) || {} : {};
    const tasks = Array.isArray(moduleData.tasks) ? (moduleData.tasks as any[]) : [];
    const openTasks = tasks.filter(task => task && task.completed !== true);
    const dueDates = openTasks.map(task => parseDateValue(task?.due_date)).filter(Boolean) as Date[];

    if (openTasks.length === 0) {
        return { slaBucket: 'CLEAR', openTaskCount: 0, nextFollowUpAt: null };
    }

    if (dueDates.length === 0) {
        return { slaBucket: 'UNSCHEDULED', openTaskCount: openTasks.length, nextFollowUpAt: null };
    }

    const nextDate = dueDates.reduce((earliest, current) =>
        current.getTime() < earliest.getTime() ? current : earliest
    );
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const upcomingThreshold = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    let slaBucket: LeadSlaBucket = 'UPCOMING';
    if (nextDate.getTime() < todayStart.getTime()) slaBucket = 'OVERDUE';
    else if (nextDate.getTime() <= todayEnd.getTime()) slaBucket = 'DUE_TODAY';
    else if (nextDate.getTime() > upcomingThreshold.getTime()) slaBucket = 'CLEAR';

    return {
        slaBucket,
        openTaskCount: openTasks.length,
        nextFollowUpAt: nextDate.toISOString(),
    };
}

function mapCrmLeadToIndexRow(lead: any): LeadIndexRow {
    const utmData = (lead.utm_data as any) || {};
    const referralData = (lead.referral_data as any) || {};
    const locationProfile = extractLeadLocationProfile(utmData);
    const sla = deriveLeadSla(utmData);

    const createdAt = lead.created_at || null;
    const updatedAt = lead.updated_at || null;
    const lastActivityAt = updatedAt || createdAt;

    return {
        id: lead.id,
        displayId: normalizeLeadDisplayId(lead),
        customerId: lead.customer_id || null,
        customerName: lead.customer_name || 'Lead',
        phone: lead.customer_phone || '—',
        pincode: lead.customer_pincode || null,
        taluka: lead.customer_taluka || null,
        district: locationProfile?.district || null,
        state: locationProfile?.state || null,
        area: locationProfile?.area || null,
        dob: lead.customer_dob || null,
        status: lead.status || 'NEW',
        source: lead.source || utmData.utm_source || 'WEBSITE',
        interestModel: lead.interest_model || null,
        created_at: createdAt,
        updated_at: updatedAt,
        intentScore: lead.intent_score || 'COLD',
        referralSource:
            lead.referred_by_name ||
            referralData.resolved_referrer_name ||
            referralData.input_name ||
            referralData.input_phone ||
            referralData.referred_by_name ||
            referralData.source,
        events_log: lead.events_log || [],
        openTaskCount: sla.openTaskCount,
        nextFollowUpAt: sla.nextFollowUpAt,
        slaBucket: sla.slaBucket,
        lastActivityAt,
    };
}

function matchesSlaFilter(row: LeadIndexRow, filter?: LeadSlaBucket | 'ALL') {
    if (!filter || filter === 'ALL') return true;
    return row.slaBucket === filter;
}

function applyLeadBaseFilters(
    query: any,
    input: {
        tenantId?: string;
        status?: string;
        intent?: string;
        search?: string;
    }
) {
    let next = query.eq('is_deleted', false);

    if (input.tenantId && input.tenantId !== 'undefined') {
        next = next.or(`owner_tenant_id.eq.${input.tenantId},selected_dealer_tenant_id.eq.${input.tenantId}`);
    }

    const status = (input.status || '').trim().toUpperCase();
    if (status && status !== 'ALL' && status !== 'ACTIVE') {
        next = next.eq('status', status);
    } else {
        next = next.neq('status', 'JUNK');
    }

    const intent = (input.intent || '').trim().toUpperCase();
    if (intent && intent !== 'ALL') {
        next = next.eq('intent_score', intent);
    }

    const search = normalizeLeadSearch(input.search);
    if (search) {
        next = next.or(
            [
                `customer_name.ilike.%${search}%`,
                `customer_phone.ilike.%${search}%`,
                `interest_model.ilike.%${search}%`,
                `display_id.ilike.%${search}%`,
            ].join(',')
        );
    }

    return next;
}

function applyLeadTenantScope(query: any, tenantId?: string) {
    if (tenantId && tenantId !== 'undefined') {
        return query.or(`owner_tenant_id.eq.${tenantId},selected_dealer_tenant_id.eq.${tenantId}`);
    }
    return query;
}

function applyTaskTenantScope(query: any, tenantId?: string) {
    if (tenantId && tenantId !== 'undefined') {
        return query.eq('tenant_id', tenantId);
    }
    return query;
}

function defaultLeadIndexResponse(page = 1, pageSize = LEAD_INDEX_DEFAULT_PAGE_SIZE): LeadIndexResponse {
    return {
        success: false,
        rows: [],
        pagination: {
            page,
            pageSize,
            totalRows: 0,
            totalPages: 0,
            hasPrev: false,
            hasNext: false,
        },
        kpis: {
            totalLeads: 0,
            hotLeads: 0,
            qualifiedLeads: 0,
            inPipeline: 0,
            overdueFollowUps: 0,
            dueTodayFollowUps: 0,
        },
    };
}

export async function getLeadIndexAction(input: {
    tenantId?: string;
    page?: number;
    pageSize?: number;
    filters?: LeadIndexFilters;
}): Promise<LeadIndexResponse> {
    const page = Math.max(1, Number.isFinite(input?.page) ? Number(input.page) : 1);
    const rawPageSize = Number.isFinite(input?.pageSize) ? Number(input.pageSize) : LEAD_INDEX_DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(LEAD_INDEX_MAX_PAGE_SIZE, Math.max(5, rawPageSize));
    const filters = input?.filters || {};
    const status = (filters.status || 'ALL').toUpperCase();
    const intent = (filters.intent || 'ALL').toUpperCase();
    const slaFilter = ((filters.sla || 'ALL').toUpperCase() as LeadSlaBucket | 'ALL') || 'ALL';
    const search = filters.search || '';

    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let rows: LeadIndexRow[] = [];
    let totalRows = 0;

    if (slaFilter === 'ALL') {
        const baseQuery = applyLeadBaseFilters(
            supabase.from('crm_leads').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
            {
                tenantId: input.tenantId,
                status,
                intent,
                search,
            }
        );

        const { data, error, count } = await baseQuery.range(from, to);
        if (error) {
            console.error('getLeadIndexAction query error:', error);
            return {
                ...defaultLeadIndexResponse(page, pageSize),
                message: getErrorMessage(error),
            };
        }

        rows = (data || []).map(mapCrmLeadToIndexRow);
        totalRows = count || 0;
    } else {
        const baseQuery = applyLeadBaseFilters(
            supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
            {
                tenantId: input.tenantId,
                status,
                intent,
                search,
            }
        );

        const { data, error } = await baseQuery;
        if (error) {
            console.error('getLeadIndexAction SLA query error:', error);
            return {
                ...defaultLeadIndexResponse(page, pageSize),
                message: getErrorMessage(error),
            };
        }

        const filtered = ((data || []) as any[])
            .map(mapCrmLeadToIndexRow)
            .filter((row: LeadIndexRow) => matchesSlaFilter(row, slaFilter));
        totalRows = filtered.length;
        rows = filtered.slice(from, to + 1);
    }

    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    const totalKpiQuery = applyLeadBaseFilters(
        supabase.from('crm_leads').select('id', { count: 'exact', head: true }),
        {
            tenantId: input.tenantId,
            status: 'ALL',
            intent: 'ALL',
        }
    );
    const hotKpiQuery = applyLeadBaseFilters(supabase.from('crm_leads').select('id', { count: 'exact', head: true }), {
        tenantId: input.tenantId,
        status: 'ALL',
        intent: 'HOT',
    });
    const qualifiedKpiQuery = applyLeadTenantScope(
        supabase
            .from('crm_leads')
            .select('id', { count: 'exact', head: true })
            .eq('is_deleted', false)
            .neq('status', 'JUNK')
            .neq('status', 'NEW'),
        input.tenantId
    );
    const pipelineKpiQuery = applyLeadTenantScope(
        supabase
            .from('crm_leads')
            .select('id', { count: 'exact', head: true })
            .eq('is_deleted', false)
            .in('status', ['QUOTE', 'BOOKING']),
        input.tenantId
    );
    const overdueSlaKpiQuery = applyTaskTenantScope(
        supabase
            .from('crm_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('linked_type', 'LEAD')
            .neq('status', 'DONE')
            .lt('due_date', todayStart),
        input.tenantId
    );
    const dueTodaySlaKpiQuery = applyTaskTenantScope(
        supabase
            .from('crm_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('linked_type', 'LEAD')
            .neq('status', 'DONE')
            .gte('due_date', todayStart)
            .lte('due_date', todayEnd),
        input.tenantId
    );

    const [
        totalKpiResult,
        hotKpiResult,
        qualifiedKpiResult,
        pipelineKpiResult,
        overdueSlaKpiResult,
        dueTodaySlaKpiResult,
    ] = await Promise.all([
        totalKpiQuery,
        hotKpiQuery,
        qualifiedKpiQuery,
        pipelineKpiQuery,
        overdueSlaKpiQuery,
        dueTodaySlaKpiQuery,
    ]);

    if (totalKpiResult.error) console.error('getLeadIndexAction total KPI error:', totalKpiResult.error);
    if (hotKpiResult.error) console.error('getLeadIndexAction hot KPI error:', hotKpiResult.error);
    if (qualifiedKpiResult.error) console.error('getLeadIndexAction qualified KPI error:', qualifiedKpiResult.error);
    if (pipelineKpiResult.error) console.error('getLeadIndexAction pipeline KPI error:', pipelineKpiResult.error);
    if (overdueSlaKpiResult.error)
        console.error('getLeadIndexAction overdue SLA KPI error:', overdueSlaKpiResult.error);
    if (dueTodaySlaKpiResult.error)
        console.error('getLeadIndexAction due-today SLA KPI error:', dueTodaySlaKpiResult.error);

    const totalPages = totalRows === 0 ? 0 : Math.ceil(totalRows / pageSize);

    return {
        success: true,
        rows,
        pagination: {
            page,
            pageSize,
            totalRows,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
        },
        kpis: {
            totalLeads: totalKpiResult.count || 0,
            hotLeads: hotKpiResult.count || 0,
            qualifiedLeads: qualifiedKpiResult.count || 0,
            inPipeline: pipelineKpiResult.count || 0,
            overdueFollowUps: overdueSlaKpiResult.count || 0,
            dueTodayFollowUps: dueTodaySlaKpiResult.count || 0,
        },
    };
}

export async function getLeads(tenantId?: string, status?: string) {
    const supabase = await createClient();
    const query = applyLeadBaseFilters(
        supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
        {
            tenantId,
            status: status || 'ALL',
            intent: 'ALL',
            search: '',
        }
    );
    const { data, error } = await query;
    if (error) {
        console.error('getLeads query error:', error);
        return [];
    }
    return ((data || []) as any[]).map(mapCrmLeadToIndexRow);
}

export async function getLeadById(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('crm_leads').select('*').eq('id', leadId).single();
    if (error) {
        console.error('getLeadById Error:', error);
        return null;
    }
    if (!data) return null;

    return {
        ...mapCrmLeadToIndexRow(data),
        raw: data,
    };
}

export type LeadEventRecord = {
    id: string;
    lead_id: string;
    event_type: string;
    notes: string | null;
    changed_value: string | null;
    actor_user_id: string | null;
    actor_tenant_id: string | null;
    created_at: string;
    actor_name?: string | null;
};

export async function getLeadEventsAction(
    leadId: string,
    limit = 120
): Promise<{ success: boolean; events: LeadEventRecord[]; message?: string }> {
    if (!leadId) {
        return { success: false, events: [], message: 'Lead ID is required' };
    }

    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 120;

    const { data, error } = await adminClient
        .from('crm_lead_events')
        .select('id, lead_id, event_type, notes, changed_value, actor_user_id, actor_tenant_id, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error) {
        console.error('getLeadEventsAction Error:', error);
        return { success: false, events: [], message: getErrorMessage(error) };
    }

    const events = (data || []) as LeadEventRecord[];
    const actorIds = Array.from(
        new Set(events.map(event => event.actor_user_id).filter((value): value is string => !!value))
    );

    let actorNameMap = new Map<string, string>();
    if (actorIds.length > 0) {
        const { data: members } = await adminClient.from('id_members').select('id, full_name').in('id', actorIds);
        for (const member of members || []) {
            if (member.id && member.full_name) {
                actorNameMap.set(member.id, member.full_name);
            }
        }
    }

    return {
        success: true,
        events: events.map(event => ({
            ...event,
            actor_name: event.actor_user_id ? actorNameMap.get(event.actor_user_id) || null : null,
        })),
    };
}

type LeadModuleNote = {
    id: string;
    body: string;
    created_at: string;
    created_by: string | null;
    created_by_name?: string | null;
    attachments?: LeadNoteAttachment[];
};

type LeadNoteAttachment = {
    path: string;
    name: string;
    file_type: string | null;
    size: number | null;
};

type LeadModuleTask = {
    id: string;
    title: string;
    due_date: string | null;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
    created_by: string | null;
    crm_task_id?: string | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assigned_to_name?: string | null;
};

function readLeadModuleData(utmData: any): { notes: LeadModuleNote[]; tasks: LeadModuleTask[] } {
    const moduleData = utmData && typeof utmData === 'object' ? (utmData.module_data as any) || {} : {};
    const notes = Array.isArray(moduleData.notes) ? (moduleData.notes as LeadModuleNote[]) : [];
    const tasks = Array.isArray(moduleData.tasks) ? (moduleData.tasks as LeadModuleTask[]) : [];
    return { notes, tasks };
}

function mergeLeadModuleData(
    utmData: any,
    updates: Partial<{ notes: LeadModuleNote[]; tasks: LeadModuleTask[] }>
): Record<string, any> {
    const safeUtmData = utmData && typeof utmData === 'object' ? { ...utmData } : {};
    const moduleData =
        safeUtmData.module_data && typeof safeUtmData.module_data === 'object' ? safeUtmData.module_data : {};
    safeUtmData.module_data = {
        ...moduleData,
        ...(updates.notes ? { notes: updates.notes } : {}),
        ...(updates.tasks ? { tasks: updates.tasks } : {}),
    };
    return safeUtmData;
}

function buildLeadModuleEvent(input: {
    type: string;
    title: string;
    description: string;
    actorId: string | null;
    metadata?: Record<string, any>;
}) {
    return {
        type: input.type,
        title: input.title,
        description: input.description,
        actor_id: input.actorId,
        timestamp: new Date().toISOString(),
        ...(input.metadata ? { metadata: input.metadata } : {}),
    };
}

async function updateCrmLeadCompat(
    leadId: string,
    payload: Record<string, any>,
    updatedAtIso?: string
): Promise<{ success: boolean; message?: string }> {
    const toErrMsg = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (err instanceof Error) return err.message;
        if (typeof err === 'object' && 'message' in (err as Record<string, unknown>)) {
            return String((err as Record<string, unknown>).message || 'Unknown error');
        }
        return String(err);
    };

    const withUpdatedAt = {
        ...payload,
        updated_at: updatedAtIso || new Date().toISOString(),
    };

    const firstAttempt = await adminClient
        .from('crm_leads')
        .update(withUpdatedAt as any)
        .eq('id', leadId);
    if (!firstAttempt.error) {
        return { success: true };
    }

    const errMsg = String(toErrMsg(firstAttempt.error) || '');
    const isUpdatedAtSchemaIssue =
        errMsg.includes("'updated_at'") ||
        errMsg.toLowerCase().includes('updated_at column') ||
        errMsg.toLowerCase().includes('schema cache');

    if (!isUpdatedAtSchemaIssue) {
        return { success: false, message: toErrMsg(firstAttempt.error) };
    }

    const fallbackAttempt = await adminClient
        .from('crm_leads')
        .update(payload as any)
        .eq('id', leadId);
    if (fallbackAttempt.error) {
        return { success: false, message: toErrMsg(fallbackAttempt.error) };
    }

    return { success: true };
}

export async function updateLeadAction(input: {
    leadId: string;
    customer_name?: string;
    customer_phone?: string;
    customer_pincode?: string;
    customer_dob?: string;
    customer_taluka?: string;
    interest_model?: string;
    interest_text?: string;
}) {
    const user = await getAuthUser();
    if (!user?.id) {
        return { success: false, message: 'Authentication required' };
    }

    const { leadId, ...fields } = input;
    // Remove undefined fields
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined) payload[k] = v;
    }

    if (Object.keys(payload).length === 0) {
        return { success: false, message: 'No fields to update' };
    }

    // Sanitize phone if provided
    if (payload.customer_phone) {
        const sanitized = toAppStorageFormat(payload.customer_phone);
        if (!sanitized || sanitized.length !== 10) {
            return { success: false, message: 'Invalid phone number' };
        }
        payload.customer_phone = sanitized;
    }

    const { data: existing, error: fetchError } = await adminClient
        .from('crm_leads')
        .select('events_log')
        .eq('id', leadId)
        .maybeSingle();

    if (fetchError || !existing) {
        return { success: false, message: fetchError?.message || 'Lead not found' };
    }

    const now = new Date().toISOString();
    const existingEvents = Array.isArray((existing as any).events_log) ? ((existing as any).events_log as any[]) : [];

    const editEvent = buildLeadModuleEvent({
        type: 'LEAD_EDITED',
        title: 'Lead Details Updated',
        description: `Fields updated: ${Object.keys(payload).join(', ')}`,
        actorId: user.id,
        metadata: { updated_fields: Object.keys(payload) },
    });

    const updateResult = await updateCrmLeadCompat(
        leadId,
        { ...payload, events_log: [editEvent, ...existingEvents] },
        now
    );

    if (!updateResult.success) {
        return { success: false, message: updateResult.message || 'Failed to update lead' };
    }

    await logLeadEvent({
        leadId,
        eventType: 'LEAD_EDITED',
        notes: `Updated: ${Object.keys(payload).join(', ')}`,
        changedValue: JSON.stringify(payload),
        actorUserId: user.id,
    });

    return { success: true };
}

export async function updateLeadIntentScoreAction(input: {
    leadId: string;
    intentScore: 'HOT' | 'WARM' | 'COLD' | 'JUNK';
}) {
    const user = await getAuthUser();
    if (!user?.id) {
        return { success: false, message: 'Authentication required' };
    }

    const validScores = ['HOT', 'WARM', 'COLD', 'JUNK'];
    if (!validScores.includes(input.intentScore)) {
        return { success: false, message: 'Invalid intent score' };
    }

    const { data: leadData, error: fetchError } = await adminClient
        .from('crm_leads')
        .select('intent_score, events_log')
        .eq('id', input.leadId)
        .maybeSingle();

    if (fetchError || !leadData) {
        return { success: false, message: fetchError?.message || 'Lead not found' };
    }

    const previousScore = (leadData as any).intent_score || 'COLD';
    if (previousScore === input.intentScore) {
        return { success: true, message: 'Score unchanged' };
    }

    const now = new Date().toISOString();
    const existingEvents = Array.isArray((leadData as any).events_log) ? ((leadData as any).events_log as any[]) : [];
    const scoreEvent = buildLeadModuleEvent({
        type: 'INTENT_SCORE_CHANGED',
        title: 'Intent Score Updated',
        description: `Score changed from ${previousScore} to ${input.intentScore}`,
        actorId: user.id,
        metadata: { previous: previousScore, current: input.intentScore },
    });

    const updateResult = await updateCrmLeadCompat(
        input.leadId,
        {
            intent_score: input.intentScore,
            events_log: [scoreEvent, ...existingEvents],
        },
        now
    );

    if (!updateResult.success) {
        return { success: false, message: updateResult.message || 'Failed to update score' };
    }

    revalidatePath('/app/[slug]/leads');
    return { success: true };
}

export async function getLeadModuleStateAction(
    leadId: string
): Promise<{ success: boolean; notes: LeadModuleNote[]; tasks: LeadModuleTask[]; message?: string }> {
    const user = await getAuthUser();
    if (!user?.id) {
        return { success: false, notes: [], tasks: [], message: 'Authentication required' };
    }

    const { data, error } = await adminClient.from('crm_leads').select('utm_data').eq('id', leadId).maybeSingle();
    if (error || !data) {
        return { success: false, notes: [], tasks: [], message: getErrorMessage(error) || 'Lead not found' };
    }

    const { notes, tasks } = readLeadModuleData((data as any).utm_data);
    return { success: true, notes, tasks };
}

export async function addLeadNoteAction(input: { leadId: string; body: string; attachments?: LeadNoteAttachment[] }) {
    const user = await getAuthUser();
    if (!user?.id) {
        return { success: false, message: 'Authentication required' };
    }

    const body = input.body.trim();
    if (!body) {
        return { success: false, message: 'Note text is required' };
    }

    const normalizedAttachments = (Array.isArray(input.attachments) ? input.attachments : [])
        .filter(attachment => attachment && typeof attachment.path === 'string' && attachment.path.length > 0)
        .slice(0, 10)
        .map(attachment => ({
            path: attachment.path,
            name: attachment.name || 'attachment',
            file_type: attachment.file_type || null,
            size: typeof attachment.size === 'number' ? attachment.size : null,
        }));

    const { data, error } = await adminClient
        .from('crm_leads')
        .select('utm_data, events_log, customer_id, owner_tenant_id')
        .eq('id', input.leadId)
        .maybeSingle();

    if (error || !data) {
        return { success: false, message: getErrorMessage(error) || 'Lead not found' };
    }

    const now = new Date().toISOString();
    const note: LeadModuleNote = {
        id: `NOTE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        body,
        created_at: now,
        created_by: user.id,
        created_by_name:
            ((user as any)?.user_metadata?.full_name as string | undefined) ||
            ((user as any)?.user_metadata?.name as string | undefined) ||
            ((user as any)?.email as string | undefined) ||
            null,
        attachments: normalizedAttachments,
    };

    const { notes } = readLeadModuleData((data as any).utm_data);
    const nextNotes = [note, ...notes];
    const nextUtmData = mergeLeadModuleData((data as any).utm_data, { notes: nextNotes });
    const existingEvents = Array.isArray((data as any).events_log) ? ((data as any).events_log as any[]) : [];
    const nextEvents = [
        buildLeadModuleEvent({
            type: 'NOTE_ADDED',
            title: 'Lead Note Added',
            description: body,
            actorId: user.id,
            metadata: { note_id: note.id, attachment_count: normalizedAttachments.length },
        }),
        ...existingEvents,
    ];

    const updateResult = await updateCrmLeadCompat(
        input.leadId,
        {
            utm_data: nextUtmData,
            events_log: nextEvents,
        },
        now
    );

    if (!updateResult.success) {
        return { success: false, message: updateResult.message || 'Lead update failed' };
    }

    if (normalizedAttachments.length > 0 && (data as any)?.customer_id) {
        const memberId = (data as any).customer_id as string;
        const ownerTenantId = (data as any).owner_tenant_id as string | null;
        const assetRows = normalizedAttachments.map(attachment => ({
            entity_id: memberId,
            tenant_id: ownerTenantId,
            path: attachment.path,
            file_type: attachment.file_type,
            purpose: 'LEAD_NOTE_ATTACHMENT',
            metadata: {
                source: 'LEAD_NOTE',
                lead_id: input.leadId,
                note_id: note.id,
                originalName: attachment.name,
                size: attachment.size,
                created_by: user.id,
            },
            updated_at: now,
            uploaded_by: user.id,
        }));

        const { error: assetInsertError } = await adminClient.from('id_member_assets').insert(assetRows as any);
        if (assetInsertError) {
            console.error('addLeadNoteAction attachment asset insert error:', assetInsertError);
        }
    }

    revalidatePath('/app/[slug]/leads');
    return { success: true, note };
}

export async function addLeadTaskAction(input: {
    leadId: string;
    title: string;
    dueDate?: string | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}) {
    const user = await getAuthUser();
    if (!user?.id) {
        return { success: false, message: 'Authentication required' };
    }

    const title = input.title.trim();
    if (!title) {
        return { success: false, message: 'Task title is required' };
    }

    const { data, error } = await adminClient
        .from('crm_leads')
        .select('utm_data, events_log, owner_tenant_id')
        .eq('id', input.leadId)
        .maybeSingle();

    if (error || !data) {
        return { success: false, message: getErrorMessage(error) || 'Lead not found' };
    }

    const now = new Date().toISOString();
    const parsedDueDate = parseDateValue(input.dueDate || '');
    const normalizedDueDate = parsedDueDate ? parsedDueDate.toISOString() : null;

    const { data: crmTask, error: crmTaskError } = await adminClient
        .from('crm_tasks')
        .insert({
            tenant_id: (data as any).owner_tenant_id || null,
            linked_type: 'LEAD',
            linked_id: input.leadId,
            title,
            description: 'Lead follow-up task',
            status: 'OPEN',
            primary_assignee_id: user.id,
            assignee_ids: [user.id],
            due_date: normalizedDueDate,
            created_by: user.id,
            updated_at: now,
        })
        .select('id')
        .maybeSingle();

    if (crmTaskError) {
        console.error('addLeadTaskAction crm_tasks sync error:', crmTaskError);
    }

    const task: LeadModuleTask = {
        id: `TASK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        due_date: normalizedDueDate,
        completed: false,
        completed_at: null,
        created_at: now,
        created_by: user.id,
        crm_task_id: (crmTask as any)?.id || null,
        priority: input.priority || 'MEDIUM',
        assigned_to_name: (user as any).user_metadata?.full_name || user.email || null,
    };

    const { tasks } = readLeadModuleData((data as any).utm_data);
    const nextTasks = [task, ...tasks];
    const nextUtmData = mergeLeadModuleData((data as any).utm_data, { tasks: nextTasks });
    const existingEvents = Array.isArray((data as any).events_log) ? ((data as any).events_log as any[]) : [];
    const nextEvents = [
        buildLeadModuleEvent({
            type: 'TASK_ADDED',
            title: 'Lead Task Added',
            description: title,
            actorId: user.id,
            metadata: {
                task_id: task.id,
                crm_task_id: task.crm_task_id || null,
                due_date: task.due_date,
            },
        }),
        ...existingEvents,
    ];

    const updateResult = await updateCrmLeadCompat(
        input.leadId,
        {
            utm_data: nextUtmData,
            events_log: nextEvents,
        },
        now
    );

    if (!updateResult.success) {
        if ((crmTask as any)?.id) {
            const { error: rollbackError } = await adminClient
                .from('crm_tasks')
                .delete()
                .eq('id', (crmTask as any).id);
            if (rollbackError) {
                console.error('addLeadTaskAction crm_tasks rollback error:', rollbackError);
            }
        }
        return { success: false, message: updateResult.message || 'Lead update failed' };
    }

    revalidatePath('/app/[slug]/leads');
    return { success: true, task };
}

export async function toggleLeadTaskAction(input: { leadId: string; taskId: string; completed: boolean }) {
    const user = await getAuthUser();
    if (!user?.id) {
        return { success: false, message: 'Authentication required' };
    }

    const { data, error } = await adminClient
        .from('crm_leads')
        .select('utm_data, events_log')
        .eq('id', input.leadId)
        .maybeSingle();

    if (error || !data) {
        return { success: false, message: getErrorMessage(error) || 'Lead not found' };
    }

    const now = new Date().toISOString();
    const { tasks } = readLeadModuleData((data as any).utm_data);
    const targetTask = tasks.find(task => task.id === input.taskId);
    if (!targetTask) {
        return { success: false, message: 'Task not found' };
    }

    const nextTasks = tasks.map(task =>
        task.id === input.taskId
            ? {
                  ...task,
                  completed: input.completed,
                  completed_at: input.completed ? now : null,
              }
            : task
    );

    const nextUtmData = mergeLeadModuleData((data as any).utm_data, { tasks: nextTasks });
    const existingEvents = Array.isArray((data as any).events_log) ? ((data as any).events_log as any[]) : [];
    const nextEvents = [
        buildLeadModuleEvent({
            type: input.completed ? 'TASK_COMPLETED' : 'TASK_REOPENED',
            title: input.completed ? 'Lead Task Completed' : 'Lead Task Reopened',
            description: targetTask.title,
            actorId: user.id,
            metadata: { task_id: targetTask.id },
        }),
        ...existingEvents,
    ];

    const updateResult = await updateCrmLeadCompat(
        input.leadId,
        {
            utm_data: nextUtmData,
            events_log: nextEvents,
        },
        now
    );

    if (!updateResult.success) {
        return { success: false, message: updateResult.message || 'Lead update failed' };
    }

    if (targetTask.crm_task_id) {
        const { error: crmTaskSyncError } = await adminClient
            .from('crm_tasks')
            .update({
                status: input.completed ? 'DONE' : 'OPEN',
                updated_at: now,
            })
            .eq('id', targetTask.crm_task_id);
        if (crmTaskSyncError) {
            console.error('toggleLeadTaskAction crm_tasks sync error:', crmTaskSyncError);
        }
    }

    revalidatePath('/app/[slug]/leads');
    return { success: true };
}

export async function getCustomerHistory(customerId: string) {
    const supabase = await createClient();

    // Fetch leads
    const { data: leads } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('is_deleted', false)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    // Fetch quotes
    const { data: quotes } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('is_deleted', false)
        .eq('lead_id', leads?.[0]?.id || '') // Simplification for now, better to link quotes to customer_id too later
        .order('created_at', { ascending: false });

    // Fetch bookings
    const { data: bookings } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('is_deleted', false)
        .in('lead_id', leads?.map(l => l.id) || [])
        .order('created_at', { ascending: false });

    return {
        leads: leads || [],
        quotes: quotes || [],
        bookings: bookings || [],
    };
}

export async function getCatalogModels() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('cat_models').select('name').eq('status', 'ACTIVE');

    if (error) {
        console.error('Error fetching catalog models:', error);
        return [];
    }
    return (data as any[]).map(i => i.name);
}

// Helper to format text as Title Case
function toTitleCase(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

export async function createLeadAction(data: {
    customer_name: string;
    customer_phone: string;
    customer_pincode?: string;
    customer_dob?: string;
    customer_taluka?: string;
    customer_id?: string; // If provided, use directly (for logged-in users)
    interest_model?: string;
    interest_text?: string;
    model?: string;
    owner_tenant_id?: string;
    selected_dealer_id?: string;
    source?: string;
    referred_by_code?: string;
    referred_by_phone?: string;
    referred_by_name?: string;
    organisation?: string;
}) {
    const normalizedSource = normalizeLeadSource(data.source);
    const interestModel = data.interest_model || data.model || 'GENERAL_ENQUIRY';
    const interestText = (data.interest_text || '').trim();
    const referredByCodeInput = (data.referred_by_code || '').trim().toUpperCase();
    const referredByPhoneInput = toAppStorageFormat(data.referred_by_phone || '') || '';
    const referredByNameInput = (data.referred_by_name || '').trim();
    const isCrmManualSource = normalizedSource === 'CRM_MANUAL';
    const authUser = await getAuthUser();
    let actorIsStaff = false;

    // Strict sanitation
    const strictPhone = toAppStorageFormat(data.customer_phone);
    if (!strictPhone || strictPhone.length !== 10) {
        return { success: false, message: 'Invalid customer phone number' };
    }

    // console.log('[DEBUG] createLeadAction triggered by client:', data.customer_phone, 'Sanitized:', strictPhone);

    try {
        // Handle owner_tenant_id fallback
        let effectiveOwnerId = data.owner_tenant_id;
        let isStrict = true; // Default to strict

        const { data: settings } = await (adminClient
            .from('sys_settings')
            .select('default_owner_tenant_id, unified_context_strict_mode')
            .single() as any);

        if (settings) {
            if (!effectiveOwnerId) {
                effectiveOwnerId = settings.default_owner_tenant_id;
            }
            if (settings.unified_context_strict_mode === false) {
                isStrict = false;
            }
        }

        if (!effectiveOwnerId) {
            console.error('[DEBUG] No owner tenant identified');
            return { success: false, message: 'No owner tenant identified for lead creation' };
        }

        // Finance Partner Ownership Swap:
        // When a BANK tenant creates a lead and selects a dealer,
        // the DEALER becomes the owner and the BANK gets shared access.
        let financeTenantId: string | null = null;
        if (data.selected_dealer_id && effectiveOwnerId !== data.selected_dealer_id) {
            const { data: creatorTenant } = await adminClient
                .from('id_tenants')
                .select('type')
                .eq('id', effectiveOwnerId)
                .single();

            if (creatorTenant?.type === 'BANK') {
                // console.log('[DEBUG] Finance partner lead swap: dealer becomes owner, bank gets shared access');
                financeTenantId = effectiveOwnerId; // store bank as shared partner
                effectiveOwnerId = data.selected_dealer_id; // dealer becomes owner
            }
        }

        // Hardening: Enforce dealer selection for finance simulation
        const validation = validateFinanceLeadDealer(data.source, data.selected_dealer_id, {
            unified_context_strict_mode: isStrict,
        });
        if (!validation.success) {
            return validation;
        }

        if (authUser?.id) {
            const { data: actorMember } = await adminClient
                .from('id_members')
                .select('role')
                .eq('id', authUser.id)
                .maybeSingle();
            actorIsStaff = !isEndCustomerRole(actorMember?.role);
        }

        let customerId: string;

        // If customer_id is provided (logged-in user), use it directly
        if (data.customer_id) {
            // console.log('[DEBUG] Using provided customer_id:', data.customer_id);
            customerId = data.customer_id;
            if (effectiveOwnerId) {
                const { error: tenantLinkError } = await adminClient.from('id_member_tenants').upsert(
                    {
                        member_id: customerId,
                        tenant_id: effectiveOwnerId,
                        status: 'ACTIVE',
                    },
                    { onConflict: 'member_id,tenant_id' }
                );
                if (tenantLinkError) {
                    console.error('[DEBUG] id_member_tenants upsert failed:', tenantLinkError);
                }
            }
        } else {
            // Create/Link member for anonymous or new users
            // console.log('[DEBUG] Step 1: createOrLinkMember...');
            const { member } = await createOrLinkMember({
                tenantId: effectiveOwnerId,
                fullName: data.customer_name,
                phone: strictPhone,
                // Pass other details if createOrLinkMember supports them, otherwise they might be lost or need separate update
                // createOrLinkMember only takes basic input.
                // We might need to update extra fields if they are critical.
            });

            if (!member?.id) {
                console.error('[DEBUG] createOrLinkMember returned null or invalid member');
                return { success: false, message: 'Failed to create or link customer profile' };
            }
            customerId = member.id;
        }

        // console.log('[DEBUG] Step 1 Complete. CustomerId:', customerId);

        // Guardrail: staff should not accidentally create a lead mapped to their own team profile.
        // Allow marketplace quick-quote/test paths, while keeping CRM/staff flows protected.
        const isMarketplaceQuickQuote = normalizedSource === 'PDP_QUICK_QUOTE' || normalizedSource === 'STORE_PDP';
        if (
            isStrict &&
            authUser?.id &&
            customerId === authUser.id &&
            (actorIsStaff || isStaffContextSource(data.source)) &&
            !isMarketplaceQuickQuote
        ) {
            return {
                success: false,
                message:
                    'Lead creation blocked: customer is mapped to your team account. Use customer phone/details and retry.',
            };
        }

        const normalizedPincode = (data.customer_pincode || '').replace(/\D/g, '').slice(0, 6);
        const nowIso = new Date().toISOString();
        let locationProfile: LeadLocationProfile | null = null;
        let status = 'NEW';
        let isServiceable: boolean | null = null;

        if (normalizedPincode.length === 6) {
            const serviceabilityResult = await checkServiceability(normalizedPincode);
            isServiceable = !!serviceabilityResult?.isServiceable;
            if (isServiceable === false) {
                status = 'JUNK';
            }
            locationProfile = {
                pincode: normalizedPincode,
                area: serviceabilityResult?.area || null,
                taluka: serviceabilityResult?.taluka || null,
                district: serviceabilityResult?.district || null,
                state: serviceabilityResult?.state || null,
                state_code: serviceabilityResult?.stateCode || null,
                is_serviceable: isServiceable,
                serviceability_status: serviceabilityResult?.status || null,
                resolved_at: nowIso,
            };
        }

        const resolvedTaluka = (data.customer_taluka || '').trim() || locationProfile?.taluka || null;

        // Update member with collected profile fields (without wiping existing values)
        const memberUpdate: Record<string, any> = {};
        if (data.customer_dob) memberUpdate.date_of_birth = data.customer_dob;
        if (normalizedPincode.length === 6) {
            memberUpdate.pincode = normalizedPincode;
            memberUpdate.aadhaar_pincode = normalizedPincode;
        }
        if (resolvedTaluka) memberUpdate.taluka = resolvedTaluka;
        if (locationProfile?.district) memberUpdate.district = locationProfile.district;
        if (locationProfile?.state) memberUpdate.state = locationProfile.state;
        if (data.customer_name) memberUpdate.full_name = data.customer_name;
        if (data.organisation) memberUpdate.work_company = data.organisation;

        if (Object.keys(memberUpdate).length > 0) {
            await adminClient.from('id_members').update(memberUpdate).eq('id', customerId);
        }

        // console.log('[DEBUG] Step 1 Complete. CustomerId:', customerId);
        const hasActiveDelivery = await hasMemberActiveDelivery(customerId);
        const referralBenefitEligible = !hasActiveDelivery;
        const hasReferralInput = Boolean(referredByCodeInput || referredByPhoneInput || referredByNameInput);
        const resolvedReferrer = hasReferralInput
            ? await findLeadReferrerByCodeOrPhone({
                  referralCode: referredByCodeInput,
                  referralPhone: referredByPhoneInput,
              })
            : null;

        if (resolvedReferrer?.memberId && resolvedReferrer.memberId === customerId) {
            return { success: false, message: 'Self referral is not allowed' };
        }

        const referralContext = hasReferralInput
            ? {
                  input_code: referredByCodeInput || null,
                  input_phone: referredByPhoneInput || null,
                  input_name: referredByNameInput || null,
                  resolved: !!resolvedReferrer?.memberId,
                  resolved_referrer_member_id: resolvedReferrer?.memberId || null,
                  resolved_referrer_name: resolvedReferrer?.name || null,
                  resolved_referrer_phone: resolvedReferrer?.phone || null,
                  resolved_referrer_code: resolvedReferrer?.referralCode || null,
                  referrer_type: resolvedReferrer?.memberId ? 'MEMBER' : 'EXTERNAL',
                  repeat_delivery_member: hasActiveDelivery,
                  referral_bonus_eligible: referralBenefitEligible,
                  referral_bonus_reason: referralBenefitEligible ? null : 'REPEAT_ACTIVE_DELIVERY',
                  captured_at: nowIso,
                  captured_by: authUser?.id || null,
              }
            : null;

        // 1.5. Prevent duplicate active leads for same customer (by id OR phone)
        const { data: existingLeadCandidates, error: existingLeadError } = await adminClient
            .from('crm_leads')
            .select(
                'id, status, customer_id, customer_phone, selected_dealer_tenant_id, referred_by_id, referred_by_name, utm_source, utm_data'
            )
            .eq('is_deleted', false)
            .eq('owner_tenant_id', effectiveOwnerId)
            .or(`customer_id.eq.${customerId},customer_phone.eq.${strictPhone}`)
            .not('status', 'in', '("CLOSED")')
            .order('created_at', { ascending: false })
            .limit(20);

        if (existingLeadError) {
            console.error('[DEBUG] Existing lead check failed:', existingLeadError);
        }

        const candidateLeads = (existingLeadCandidates || []) as Array<{
            id: string;
            status: string;
            selected_dealer_tenant_id: string | null;
            customer_id: string | null;
            customer_phone: string | null;
            utm_source: string | null;
            referred_by_id: string | null;
            referred_by_name: string | null;
            utm_data: any;
        }>;

        const existingLead = data.selected_dealer_id
            ? candidateLeads.find(l => l.selected_dealer_tenant_id === data.selected_dealer_id) ||
              candidateLeads[0] ||
              null
            : candidateLeads[0] || null;

        if (existingLead) {
            const nowIso = new Date().toISOString();
            const duplicateEvent = {
                type: 'DUPLICATE_LEAD_ATTEMPT',
                at: nowIso,
                attempted_by: authUser?.id || null,
                attempted_phone: strictPhone,
                attempted_name: data.customer_name || null,
                attempted_interest: interestText || interestModel,
                attempted_location: locationProfile,
                attempted_referral: referralContext,
                referral_locked: true,
                source: normalizedSource || 'UNKNOWN',
                note: 'Active lead exists; reusing lead for quote creation.',
            };

            const duplicateUpdatePayload: Record<string, any> = {
                interest_model: interestModel,
                interest_text: interestText || interestModel,
                ...(data.customer_name ? { customer_name: data.customer_name } : {}),
                ...(data.customer_dob ? { customer_dob: data.customer_dob } : {}),
                ...(normalizedPincode.length === 6
                    ? {
                          customer_pincode: normalizedPincode,
                          is_serviceable: isServiceable,
                      }
                    : {}),
                ...(resolvedTaluka ? { customer_taluka: resolvedTaluka } : {}),
                ...(normalizedSource ? { source: normalizedSource } : {}),
                utm_source: normalizedSource || existingLead.utm_source || 'MANUAL',
                // Backfill location_profile into utm_data for existing leads
                ...(locationProfile
                    ? {
                          utm_data: {
                              ...(existingLead.utm_data && typeof existingLead.utm_data === 'object'
                                  ? existingLead.utm_data
                                  : {}),
                              location_profile: locationProfile,
                          },
                      }
                    : {}),
            };
            // Backfill dealer lock on legacy leads when reusing under an explicit dealer context.
            if (data.selected_dealer_id && !existingLead.selected_dealer_tenant_id) {
                duplicateUpdatePayload.selected_dealer_tenant_id = data.selected_dealer_id;
            }
            const duplicateUpdateResult = await updateCrmLeadCompat(existingLead.id, duplicateUpdatePayload, nowIso);
            if (!duplicateUpdateResult.success) {
                return {
                    success: false,
                    message: duplicateUpdateResult.message || 'Failed to refresh existing lead',
                };
            }

            try {
                await adminClient.from('catalog_audit_log').insert({
                    table_name: 'crm_leads',
                    record_id: existingLead.id,
                    action: 'DUPLICATE_ATTEMPT',
                    new_data: {
                        attempted_by: authUser?.id || null,
                        attempted_phone: strictPhone,
                        attempted_name: data.customer_name || null,
                        source: normalizedSource || 'UNKNOWN',
                        owner_tenant_id: effectiveOwnerId,
                        duplicate_event: duplicateEvent,
                    },
                    actor_id: authUser?.id || null,
                    created_at: nowIso,
                    actor_label: 'APP',
                });
            } catch (auditError) {
                console.error('[DEBUG] catalog_audit_log insert failed:', auditError);
            }

            await logLeadEvent({
                leadId: existingLead.id,
                eventType: 'DUPLICATE_ATTEMPT',
                notes: 'Duplicate lead attempt captured and existing lead reused.',
                changedValue: {
                    source: normalizedSource || 'UNKNOWN',
                    attempted_interest: interestText || interestModel,
                },
                actorUserId: authUser?.id || null,
                actorTenantId: effectiveOwnerId || null,
            });

            return {
                success: true,
                leadId: existingLead.id,
                memberId: existingLead.customer_id || customerId,
                duplicate: true,
            };
        }

        if (isCrmManualSource && referralBenefitEligible && !hasReferralInput) {
            return {
                success: false,
                message: 'Referral is mandatory for new lead. Enter referral code or referrer contact.',
            };
        }

        if (
            isCrmManualSource &&
            referralBenefitEligible &&
            hasReferralInput &&
            !resolvedReferrer?.memberId &&
            !referredByPhoneInput &&
            !referredByNameInput
        ) {
            return {
                success: false,
                message: 'Referral code not found. Add referrer phone or name to continue.',
            };
        }

        const { data: lead, error } = await adminClient
            .from('crm_leads')
            .insert({
                customer_id: customerId,
                customer_name: data.customer_name,
                customer_phone: strictPhone,
                customer_pincode: normalizedPincode.length === 6 ? normalizedPincode : null,
                customer_taluka: resolvedTaluka,
                customer_dob: data.customer_dob || null,
                interest_model: interestModel,
                interest_text: interestText || interestModel,
                interest_variant: data.model === 'GENERAL_ENQUIRY' ? null : null,
                owner_tenant_id: effectiveOwnerId,
                selected_dealer_tenant_id: financeTenantId || data.selected_dealer_id || null,
                referred_by_id: resolvedReferrer?.memberId || null,
                referred_by_name: resolvedReferrer?.name || referredByNameInput || null,
                status: status,
                is_serviceable: isServiceable,
                source: normalizedSource || 'WALKIN',
                utm_data: locationProfile ? { location_profile: locationProfile } : null,
                utm_source: normalizedSource || 'MANUAL',
                utm_medium: status === 'JUNK' ? 'AUTO_SEGREGATED' : null,
                utm_campaign: status === 'JUNK' ? 'UNSERVICEABLE_PINCODE' : null,
                utm_term: normalizedPincode.length === 6 ? normalizedPincode : null,
                utm_content: locationProfile
                    ? `${locationProfile.district || ''}|${locationProfile.state || ''}|${locationProfile.taluka || ''}`
                    : null,
                intent_score: status === 'JUNK' ? 'COLD' : 'WARM',
            })
            .select()
            .single();

        if (error) {
            console.error('[DEBUG] crm_leads insertion failed:', error);
            return { success: false, message: getErrorMessage(error) };
        }

        let referralBonusApplied = false;
        if (resolvedReferrer?.memberId && referralBenefitEligible) {
            try {
                await adminClient.rpc(
                    'oclub_credit_referral' as any,
                    {
                        p_referrer_id: resolvedReferrer.memberId,
                        p_lead_id: lead.id,
                        p_referred_member_id: customerId,
                    } as any
                );
                referralBonusApplied = true;
            } catch (referralCreditError) {
                console.error('[DEBUG] oclub_credit_referral failed:', referralCreditError);
            }
        }

        if (referralContext) {
            const finalizedReferralData = {
                ...referralContext,
                referral_bonus_applied: referralBonusApplied,
                referral_bonus_status: referralBenefitEligible
                    ? resolvedReferrer?.memberId
                        ? referralBonusApplied
                            ? 'LOCKED'
                            : 'ERROR'
                        : 'PENDING_EXTERNAL_REFERRER'
                    : 'NOT_APPLICABLE_REPEAT_DELIVERY',
            };
            try {
                await adminClient.from('catalog_audit_log').insert({
                    table_name: 'crm_leads',
                    record_id: lead.id,
                    action: 'REFERRAL_CONTEXT_CAPTURED',
                    new_data: finalizedReferralData,
                    actor_id: authUser?.id || null,
                    created_at: new Date().toISOString(),
                    actor_label: 'APP',
                });
            } catch (referralAuditError) {
                console.error('[DEBUG] referral context audit insert failed:', referralAuditError);
            }
        }

        await logLeadEvent({
            leadId: lead.id,
            eventType: 'LEAD_CREATED',
            notes: `Lead created from ${normalizedSource || 'WALKIN'} source`,
            changedValue: {
                status,
                intent_score: status === 'JUNK' ? 'COLD' : 'WARM',
            },
            actorUserId: authUser?.id || null,
            actorTenantId: effectiveOwnerId || null,
        });

        // PDP quick-quote flows immediately create a quote that sends the same SMS.
        // Skip lead-level SMS there to avoid MSG91 duplicate rejection (error 311).
        const shouldSendLeadSms = normalizedSource !== 'PDP_QUICK_QUOTE' && normalizedSource !== 'STORE_PDP';
        if (shouldSendLeadSms) {
            sendStoreVisitSms({
                phone: data.customer_phone,
                name: data.customer_name,
            }).catch(err => console.error('[SMS] Lead creation SMS failed:', err));
        }

        // console.log('[DEBUG] Lead created successfully:', lead.id);
        revalidatePath('/app/[slug]/leads', 'page');
        return { success: true, leadId: lead.id, memberId: customerId };
    } catch (error) {
        console.error('[DEBUG] Lead creation process CRASHED:', error);
        return {
            success: false,
            message:
                error instanceof Error
                    ? getErrorMessage(error)
                    : (error as any)?.message || (typeof error === 'string' ? error : 'Unknown error'),
        };
    }
}

// --- BACKFILL: Location Profile for Existing Leads ---

export async function backfillLeadLocationsAction() {
    const BATCH_SIZE = 100;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
        // Fetch leads with pincode but missing location_profile in utm_data
        const { data: leads, error } = await adminClient
            .from('crm_leads')
            .select('id, customer_pincode, utm_data')
            .not('customer_pincode', 'is', null)
            .neq('customer_pincode', '')
            .order('created_at', { ascending: false })
            .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
            console.error('[BACKFILL] Query error:', error);
            break;
        }

        if (!leads || leads.length === 0) {
            hasMore = false;
            break;
        }

        // Filter to only leads missing location_profile
        const needsBackfill = leads.filter((lead: any) => {
            const utmData = lead.utm_data && typeof lead.utm_data === 'object' ? lead.utm_data : null;
            return !utmData?.location_profile?.district;
        });

        for (const lead of needsBackfill) {
            const pincode = String((lead as any).customer_pincode || '').replace(/\D/g, '');
            if (pincode.length !== 6) {
                totalSkipped++;
                continue;
            }

            try {
                const serviceabilityResult = await checkServiceability(pincode);
                if (!serviceabilityResult?.district) {
                    totalSkipped++;
                    continue;
                }

                const locationProfile: LeadLocationProfile = {
                    pincode,
                    area: serviceabilityResult.area || null,
                    taluka: serviceabilityResult.taluka || null,
                    district: serviceabilityResult.district || null,
                    state: serviceabilityResult.state || null,
                    state_code: serviceabilityResult.stateCode || null,
                    is_serviceable: !!serviceabilityResult.isServiceable,
                    serviceability_status: serviceabilityResult.status || null,
                    resolved_at: new Date().toISOString(),
                };

                const existingUtmData =
                    (lead as any).utm_data && typeof (lead as any).utm_data === 'object' ? (lead as any).utm_data : {};

                const { error: updateError } = await adminClient
                    .from('crm_leads')
                    .update({
                        utm_data: {
                            ...existingUtmData,
                            location_profile: locationProfile,
                        },
                    } as any)
                    .eq('id', (lead as any).id);

                if (updateError) {
                    console.error(`[BACKFILL] Update failed for lead ${(lead as any).id}:`, updateError);
                    totalFailed++;
                } else {
                    totalUpdated++;
                }
            } catch (err) {
                console.error(`[BACKFILL] Error processing lead ${(lead as any).id}:`, err);
                totalFailed++;
            }
        }

        totalSkipped += leads.length - needsBackfill.length;
        offset += BATCH_SIZE;

        if (leads.length < BATCH_SIZE) {
            hasMore = false;
        }
    }

    // console.log(`[BACKFILL] Complete: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalFailed} failed`);
    return {
        success: true,
        updated: totalUpdated,
        skipped: totalSkipped,
        failed: totalFailed,
    };
}

// --- QUOTES ---

export async function getQuotes(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_quotes')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getQuotes Error:', error);
        return [];
    }

    // Resolve customer names via adminClient (bypasses crm_leads RLS)
    const leadIds = [...new Set(data.map((q: any) => q.lead_id).filter(Boolean))];
    let leadNameMap: Record<string, string> = {};
    if (leadIds.length > 0) {
        const { data: leads } = await adminClient.from('crm_leads').select('id, customer_name').in('id', leadIds);
        if (leads) {
            leadNameMap = Object.fromEntries(leads.map((l: any) => [l.id, l.customer_name]));
        }
    }

    return data.map((q: any) => ({
        id: q.id,
        displayId: q.display_id || `QT-${q.id.slice(0, 4).toUpperCase()}`,
        customerName: leadNameMap[q.lead_id] || 'N/A',
        productName: q.snap_variant || 'Custom Quote',
        productSku: q.variant_id || 'N/A',
        price: q.on_road_price || 0,
        status: q.status,
        date: q.created_at ? q.created_at.split('T')[0] : '',
        vehicleBrand: q.snap_brand || '',
        vehicleModel: q.snap_model || '',
        vehicleVariant: q.snap_variant || '',
        vehicleColor: q.snap_color || '',
    }));
}

export async function getQuotesForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getQuotesForLead Error:', error);
        return [];
    }
    return data || [];
}

export async function getQuotesForMember(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getQuotesForMember Error:', error);
        return [];
    }
    return data || [];
}

export async function getBookingsForMember(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('user_id', memberId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getBookingsForMember Error:', error);
        return [];
    }
    return data || [];
}

import { getAuthUser } from '@/lib/auth/resolver';
import { getErrorMessage } from '@/lib/utils/errorMessage';

type QuoteSmsStatus = {
    attempted: boolean;
    state: 'SENT' | 'FAILED' | 'SKIPPED';
    message?: string;
    reason?: string;
    phone?: string;
};

export async function createQuoteAction(data: {
    tenant_id?: string;
    lead_id?: string;
    member_id?: string; // Direct member ID (for logged-in users)
    variant_id: string;
    color_id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commercials: Record<string, any>;
    store_url?: string;
    source?: 'STORE_PDP' | 'LEADS';
}): Promise<{ success: boolean; data?: any; message?: string; smsStatus?: QuoteSmsStatus }> {
    const user = await getAuthUser();
    const isGuestMarketplaceQuote = !user && data.source === 'STORE_PDP' && !!data.lead_id;
    if (!user && !isGuestMarketplaceQuote) {
        return {
            success: false,
            message: 'Authentication required to generate a quote.',
        };
    }
    const supabase = await createClient();
    const { data: settings } = await supabase
        .from('sys_settings')
        .select('unified_context_strict_mode, default_owner_tenant_id')
        .single();
    const isStrict = settings?.unified_context_strict_mode !== false; // Active by default
    let resolvedTenantId = (data.tenant_id || '').trim() || null;

    const createdBy = user?.id || null;
    let actorMember: { id: string; role: string | null } | null = null;
    if (createdBy) {
        const { data: actorMemberData } = await supabase
            .from('id_members')
            .select('id, role')
            .eq('id', createdBy)
            .maybeSingle();
        actorMember = actorMemberData;
    }
    const actorIsStaff = !!createdBy && !isEndCustomerRole(actorMember?.role);

    // Prefer explicit member_id or lead-linked customer_id (avoid using staff auth IDs)
    let memberId: string | null = data.member_id || null;
    let leadReferrerId: string | null = null;
    let leadCustomerPhone: string | null = null;
    let leadCustomerName: string | null = null;

    const comms: any = normalizeCommercialsPayload(data.commercials);

    if (data.lead_id) {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select(
                'customer_id, customer_name, customer_phone, referred_by_id, selected_dealer_tenant_id, owner_tenant_id'
            )
            .eq('is_deleted', false)
            .eq('id', data.lead_id)
            .maybeSingle();

        if (lead) {
            leadCustomerPhone = lead.customer_phone || null;
            leadCustomerName = lead.customer_name || null;
            if (!resolvedTenantId) {
                resolvedTenantId = lead.selected_dealer_tenant_id || lead.owner_tenant_id || null;
            }

            // Hardening: Enforce dealer context matching
            const contextValidation = await validateQuoteDealerContext(
                supabase,
                data.lead_id!,
                resolvedTenantId || '',
                {
                    unified_context_strict_mode: isStrict,
                }
            );
            if (!contextValidation.success) {
                return contextValidation;
            }

            // Only use lead's customer_id if we don't already have a member_id
            if (!memberId && lead.customer_id) {
                memberId = lead.customer_id;
            }

            // Guardrail: team users should not create lead-based quotes against their own staff profile.
            if (actorIsStaff && createdBy && lead.customer_id && lead.customer_id === createdBy && !data.member_id) {
                return {
                    success: false,
                    message:
                        'Quote creation blocked: selected lead is mapped to your team profile. Open the correct customer lead.',
                };
            }
            leadReferrerId = lead.referred_by_id || null;
        }
    }

    if (!resolvedTenantId) {
        resolvedTenantId = settings?.default_owner_tenant_id || null;
    }
    if (!resolvedTenantId) {
        return {
            success: false,
            message: 'Quote creation blocked: tenant context is missing.',
        };
    }

    let dealer = normalizeDealerPayload(comms.pricing_snapshot?.dealer || comms.dealer);
    if (!dealer) {
        const { data: tenant } = await supabase
            .from('id_tenants')
            .select('id, name, studio_id')
            .eq('id', resolvedTenantId)
            .maybeSingle();
        if (tenant) {
            dealer = normalizeDealerPayload({
                dealer_id: tenant.id,
                dealer_name: tenant.name,
                studio_id: tenant.studio_id,
            });
        }
    }
    if (dealer) {
        comms.dealer = dealer;
        comms.pricing_snapshot = {
            ...asRecord(comms.pricing_snapshot),
            dealer,
        };
    }

    const snap = asRecord(comms.pricing_snapshot);
    const missing: string[] = [];
    if (!comms.label && (!comms.brand || !comms.model || !comms.variant)) missing.push('vehicle_label');
    if (!snap || Object.keys(snap).length === 0) missing.push('pricing_snapshot');
    if (!(snap.ex_showroom || comms.ex_showroom || comms.base_price)) missing.push('ex_showroom');
    if (snap.rto_total === undefined || snap.rto_total === null) missing.push('rto_total');
    if (snap.insurance_total === undefined || snap.insurance_total === null) missing.push('insurance_total');
    if (!dealer?.dealer_id && !dealer?.studio_id && !dealer?.id) missing.push('dealer');
    if (!comms.color_name && !comms.color && !data.color_id) missing.push('color');

    if (missing.length > 0) {
        return {
            success: false,
            message: `Quote creation blocked: missing ${missing.join(', ')}.`,
        };
    }

    data.commercials = comms;

    if (!memberId && actorMember && isEndCustomerRole(actorMember.role)) {
        memberId = actorMember.id;
    }

    // Final hard guard: team users cannot create quotes for themselves in any flow.
    if (actorIsStaff && createdBy && memberId && memberId === createdBy) {
        return {
            success: false,
            message: 'Quote creation blocked: team members cannot generate quotes for their own account.',
        };
    }

    // Extract flat fields for analytics - handling Multiple naming conventions
    // Note: comms is already defined above
    const onRoadPrice = Math.round(comms.grand_total || comms.onRoad || 0);
    const exShowroom = Math.round(comms.base_price || comms.exShowroom || comms.ex_showroom || 0);
    const pricingSnapshot = comms?.pricing_snapshot || {};
    const rtoAmount = Math.round(Number(pricingSnapshot?.rto_total ?? pricingSnapshot?.rto?.total ?? comms.rto ?? 0));
    const insuranceAmount = Math.round(
        Number(pricingSnapshot?.insurance_total ?? pricingSnapshot?.insurance?.total ?? comms.insurance ?? 0)
    );
    const accessoriesAmount = Math.round(Number(pricingSnapshot?.accessories_total ?? comms.accessories_total ?? 0));

    const vehicleSkuId = data.color_id || data.variant_id;

    const { data: quote, error } = await adminClient
        .from('crm_quotes')
        .insert({
            tenant_id: resolvedTenantId,
            lead_id: data.lead_id,
            member_id: memberId,
            lead_referrer_id: leadReferrerId,
            quote_owner_id: createdBy || null,
            variant_id: data.variant_id,
            color_id: data.color_id,
            vehicle_sku_id: vehicleSkuId, // Use SKU (color) when available
            vehicle_image: comms.image_url || comms.image || null,

            // Flat Columns (analytics + redundancy)
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: insuranceAmount,
            rto_amount: rtoAmount,
            accessories_amount: accessoriesAmount,

            // Snapshot Redundancy — survives even if commercials JSONB corrupts
            snap_brand: comms.brand || '',
            snap_model: comms.model || '',
            snap_variant: comms.variant || '',
            snap_color: comms.color_name || comms.color || '',
            snap_dealer_name: dealer?.dealer_name || '',
            commercials: comms,

            status: 'DRAFT',
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error('Create Quote Logic Failure:', {
            code: error.code,
            message: getErrorMessage(error),
            details: error.details,
            hint: error.hint,
            context: { tenant_id: resolvedTenantId, lead_id: data.lead_id, sku: data.variant_id },
        });
        return { success: false, message: getErrorMessage(error) };
    }

    await logQuoteEvent(quote.id, 'Quote Created', null, isGuestMarketplaceQuote ? 'customer' : 'team', {
        source: data.source || 'CRM',
        finance_mode:
            (data.commercials as any)?.finance?.scheme_id || (data.commercials as any)?.finance?.bank_id
                ? 'LOAN'
                : 'CASH',
    });

    // Supersede older quotes for same Lead + SKU (one SKU = one active quote per lead)
    if (data.lead_id && vehicleSkuId) {
        await adminClient
            .from('crm_quotes')
            .update({ status: 'SUPERSEDED', updated_at: new Date().toISOString() })
            .eq('lead_id', data.lead_id)
            .eq('vehicle_sku_id', vehicleSkuId)
            .neq('id', quote.id)
            .not('status', 'in', '("CONVERTED","BOOKING","BOOKED")');
    }

    const finance = (data.commercials as any)?.finance || null;
    if (finance?.scheme_id || finance?.bank_id) {
        const { data: attempt, error: financeError } = await adminClient
            .from('crm_quote_finance_attempts')
            .insert({
                quote_id: quote.id,
                tenant_id: resolvedTenantId,
                bank_id: finance.bank_id || null,
                bank_name: finance.bank_name || null,
                scheme_id: finance.scheme_id || null,
                scheme_code: finance.scheme_code || null,
                ltv: finance.ltv || null,
                roi: finance.roi || null,
                tenure_months: finance.tenure_months || null,
                down_payment: finance.down_payment || null,
                loan_amount: finance.loan_amount || null,
                loan_addons: finance.loan_addons || null,
                processing_fee: finance.processing_fee || null,
                charges_breakup: finance.charges_breakup || [],
                emi: finance.emi || null,
                status: finance.status || 'IN_PROCESS',
                created_by: createdBy || null,
            })
            .select('id')
            .single();

        if (financeError) {
            console.error('Finance attempt create failed:', financeError);
        } else if (attempt?.id) {
            await adminClient
                .from('crm_quotes')
                .update({
                    finance_mode: 'LOAN',
                    active_finance_id: attempt.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', quote.id);
        }
    } else {
        await adminClient
            .from('crm_quotes')
            .update({
                finance_mode: 'CASH',
                updated_at: new Date().toISOString(),
            })
            .eq('id', quote.id);
    }

    // 2. Sync Lead Status to 'QUOTE'
    if (data.lead_id) {
        const { error: leadUpdateError } = await adminClient
            .from('crm_leads')
            .update({
                status: 'QUOTE',
                updated_at: new Date().toISOString(),
            })
            .eq('id', data.lead_id);

        if (leadUpdateError) {
            console.error('Critical: Lead status sync failed after quote creation:', leadUpdateError);
        } else {
            await logLeadEvent({
                leadId: data.lead_id,
                eventType: 'LEAD_STATUS_UPDATED',
                notes: 'Lead moved to QUOTE stage after quote creation',
                changedValue: 'QUOTE',
                actorUserId: createdBy,
                actorTenantId: resolvedTenantId,
            });
            revalidatePath(`/app/[slug]/leads`);
        }
    }

    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile'); // Transaction Registry

    // Messaging is NOT auto-triggered on quote creation.
    // Team member explicitly chooses to share via WhatsApp or SMS after quote is saved.

    return { success: true, data: quote };
}

export async function acceptQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Accept Quote Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }

    // Log timeline event
    await logQuoteEvent(id, 'Quote Approved', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

export async function confirmQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    // In later phases, this will perform a SKU lockdown check
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Confirm Quote Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }

    // Log timeline event
    await logQuoteEvent(id, 'Quote Confirmed', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

export async function lockQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'DENIED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Lock Quote Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }
    await logQuoteEvent(id, 'Quote Denied', 'Team Member', 'team', { source: 'CRM' });
    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

export async function cancelQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Cancel Quote Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }
    await logQuoteEvent(id, 'Quote Canceled', 'Customer', 'customer', { source: 'CUSTOMER' });
    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

// --- BOOKINGS & SALES ORDERS ---

export async function getBookings(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_bookings')
        .select('*, member:id_members!user_id(full_name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('[getBookings] Error:', error);
        // Fallback: try without join if the FK fails
        const fallback = await supabase
            .from('crm_bookings')
            .select('*')
            .eq('is_deleted', false)
            .eq(tenantId ? 'tenant_id' : 'is_deleted', tenantId || false)
            .order('created_at', { ascending: false });

        if (fallback.error || !fallback.data) return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return fallback.data.map((b: any) => {
            const v = b.vehicle_details || {};
            const c = b.customer_details || {};
            return {
                id: b.id,
                displayId: b.display_id || `SO-${b.id.slice(0, 4).toUpperCase()}`,
                quoteId: b.quote_id,
                quoteDisplayId: b.quote_id ? `QT-${b.quote_id.slice(0, 4).toUpperCase()}` : '',
                customer: c.full_name || c.name || c.customer_name || 'N/A',
                brand: v.brand || 'N/A',
                model: v.model || 'N/A',
                variant: v.variant || 'N/A',
                price: b.grand_total || 0,
                status: b.status || 'BOOKED',
                date: b.created_at ? b.created_at.split('T')[0] : '',
                currentStage: b.operational_stage || b.current_stage || null,
            };
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((b: any) => {
        const v = b.vehicle_details || {};
        const c = b.customer_details || {};
        const memberName = b.member?.full_name;

        return {
            id: b.id,
            displayId: b.display_id || `SO-${b.id.slice(0, 4).toUpperCase()}`,
            quoteId: b.quote_id,
            quoteDisplayId: b.quote_id ? `QT-${b.quote_id.slice(0, 4).toUpperCase()}` : '',
            customer: memberName || c.full_name || c.name || c.customer_name || 'N/A',
            brand: v.brand || 'N/A',
            model: v.model || 'N/A',
            variant: v.variant || 'N/A',
            price: b.grand_total || 0,
            status: b.status || 'BOOKED',
            date: b.created_at ? b.created_at.split('T')[0] : '',
            currentStage: b.operational_stage || b.current_stage || null,
        };
    });
}

export async function getBookingForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('lead_id', leadId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) {
        console.error('getBookingForLead Error:', error);
        return null;
    }
    return data;
}

export async function getBookingById(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('is_deleted', false)
        .single();

    if (error) {
        console.error('getBookingById Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    return { success: true, booking: data };
}

type BookingFeedbackRecord = {
    id: string;
    booking_id: string;
    member_id: string | null;
    tenant_id: string | null;
    nps_score: number | null;
    delivery_rating: number | null;
    staff_rating: number | null;
    review_text: string | null;
    created_at: string;
    updated_at: string;
};

function normalizeOptionalScore(
    value: number | string | null | undefined,
    min: number,
    max: number
): { value: number | null; error?: string } {
    if (value === null || value === undefined || value === '') return { value: null };
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return { value: null, error: 'Invalid numeric score' };
    const rounded = Math.round(parsed);
    if (rounded < min || rounded > max) {
        return { value: null, error: `Score must be between ${min} and ${max}` };
    }
    return { value: rounded };
}

export async function getBookingFeedbackAction(
    bookingId: string
): Promise<{ success: boolean; data?: BookingFeedbackRecord | null; message?: string }> {
    if (!bookingId) return { success: false, message: 'Booking is required' };

    const { data, error } = await (adminClient as any)
        .from('crm_feedback')
        .select('*')
        .eq('booking_id', bookingId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('getBookingFeedbackAction Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }

    return { success: true, data: (data as BookingFeedbackRecord | null) || null };
}

export async function upsertBookingFeedbackAction(input: {
    bookingId: string;
    npsScore?: number | string | null;
    deliveryRating?: number | string | null;
    staffRating?: number | string | null;
    reviewText?: string | null;
    autoAdvanceStage?: boolean;
}) {
    const user = await getAuthUser();
    if (!user?.id) return { success: false, message: 'Authentication required' };

    const supabase = await createClient();
    const { data: bookingRow, error: bookingError } = await (adminClient as any)
        .from('crm_bookings')
        .select('id, tenant_id, user_id, lead_id, quote_id, operational_stage')
        .eq('is_deleted', false)
        .eq('id', input.bookingId)
        .maybeSingle();
    const booking = bookingRow as {
        id: string;
        tenant_id: string | null;
        user_id: string | null;
        lead_id: string | null;
        quote_id: string | null;
        operational_stage: string | null;
    } | null;

    if (bookingError || !booking) {
        return { success: false, message: bookingError?.message || 'Booking not found' };
    }

    const nps = normalizeOptionalScore(input.npsScore, 1, 10);
    if (nps.error) return { success: false, message: nps.error };
    const delivery = normalizeOptionalScore(input.deliveryRating, 1, 5);
    if (delivery.error) return { success: false, message: delivery.error };
    const staff = normalizeOptionalScore(input.staffRating, 1, 5);
    if (staff.error) return { success: false, message: staff.error };
    const reviewText = (input.reviewText || '').trim();

    if (!reviewText && nps.value === null && delivery.value === null && staff.value === null) {
        return { success: false, message: 'Provide at least one feedback field before saving.' };
    }

    const payload = {
        booking_id: booking.id,
        member_id: booking.user_id || null,
        tenant_id: booking.tenant_id || null,
        nps_score: nps.value,
        delivery_rating: delivery.value,
        staff_rating: staff.value,
        review_text: reviewText || null,
        updated_at: new Date().toISOString(),
    };

    const { data: existing } = await (adminClient as any)
        .from('crm_feedback')
        .select('id')
        .eq('booking_id', input.bookingId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    let saved: BookingFeedbackRecord | null = null;
    if (existing?.id) {
        const { data: updated, error: updateError } = await (adminClient as any)
            .from('crm_feedback')
            .update(payload)
            .eq('id', existing.id)
            .select('*')
            .single();
        if (updateError) return { success: false, message: updateError.message };
        saved = updated as BookingFeedbackRecord;
    } else {
        const { data: inserted, error: insertError } = await (adminClient as any)
            .from('crm_feedback')
            .insert(payload)
            .select('*')
            .single();
        if (insertError) return { success: false, message: insertError.message };
        saved = inserted as BookingFeedbackRecord;
    }

    await logLeadEvent({
        leadId: booking.lead_id || '',
        eventType: 'FEEDBACK_CAPTURED',
        notes: 'Booking feedback captured',
        changedValue: {
            nps_score: nps.value,
            delivery_rating: delivery.value,
            staff_rating: staff.value,
        },
        actorUserId: user.id,
        actorTenantId: booking.tenant_id || null,
    });

    if (booking.quote_id) {
        await logQuoteEvent(booking.quote_id, 'Feedback Captured', null, 'team', {
            source: 'BOOKING',
            nps_score: nps.value,
            delivery_rating: delivery.value,
            staff_rating: staff.value,
        });
    }

    let stageTransition: { success: boolean; message?: string; warning?: string } | null = null;
    const shouldAdvance = input.autoAdvanceStage !== false;
    if (shouldAdvance && booking.operational_stage === 'DELIVERED') {
        const { data: stageData, error: stageError } = await supabase.rpc('transition_booking_stage', {
            p_booking_id: input.bookingId,
            p_to_stage: 'FEEDBACK',
            p_reason: 'feedback_submitted',
        });

        if (stageError) {
            stageTransition = { success: false, message: stageError.message };
        } else {
            const stagePayload = (stageData || {}) as { success?: boolean; message?: string; warning?: string };
            stageTransition = {
                success: stagePayload.success === true,
                message: stagePayload.message,
                warning: stagePayload.warning,
            };
        }
    } else if (booking.operational_stage !== 'FEEDBACK') {
        stageTransition = {
            success: false,
            warning: 'Stage not advanced. Booking must be in DELIVERED stage before FEEDBACK.',
        };
    } else {
        stageTransition = { success: true, message: 'Booking already in FEEDBACK stage.' };
    }

    revalidatePath('/app/[slug]/sales-orders');
    revalidatePath('/app/[slug]/leads');

    return {
        success: true,
        data: saved,
        stageTransition,
    };
}

export async function createBookingFromQuote(quoteId: string) {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    const supabase = await createClient();

    // Fetch strict mode setting
    const { data: settings } = await (adminClient
        .from('sys_settings')
        .select('unified_context_strict_mode')
        .single() as any);
    const isStrict = settings?.unified_context_strict_mode !== false;

    // Fetch authorized tenants for the user
    const { data: userMemberships } = await supabase
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE');
    const authorizedTenantIds = ((userMemberships as any[]) ?? [])
        .map((m: { tenant_id: string | null }) => m.tenant_id)
        .filter((id): id is string => Boolean(id));

    // Hardening: Enforce dealer context for booking creation
    const contextValidation = await validateBookingDealerContext(supabase, quoteId, authorizedTenantIds, {
        unified_context_strict_mode: isStrict,
    });
    if (!contextValidation.success) {
        return contextValidation;
    }

    try {
        const { data: bookingId, error: rpcError } = await adminClient.rpc('create_booking_from_quote', {
            quote_id: quoteId,
        });

        if (rpcError) {
            console.error('[createBookingFromQuote] RPC Error:', rpcError);
            return { success: false, message: rpcError.message };
        }

        if (!bookingId) {
            return { success: false, message: 'Booking creation failed: No ID returned' };
        }

        const bookingIdValue = bookingId as string;
        let requisitionResult:
            | {
                  status: 'CREATED';
                  request_id: string;
                  display_id?: string;
              }
            | {
                  status: 'NONE';
              }
            | {
                  status: 'ERROR';
                  message?: string;
              } = { status: 'NONE' };

        const { data: booking, error: bookingError } = await adminClient
            .from('crm_bookings')
            .select('*')
            .eq('id', bookingIdValue)
            .eq('is_deleted', false)
            .single();

        if (bookingError) {
            console.error('[createBookingFromQuote] Fetch Booking Error:', bookingError);
            return { success: false, message: bookingError.message };
        }

        // INV-004: Non-blocking shortage check — auto-creates requisition if needed
        try {
            const { bookingShortageCheck } = await import('@/actions/inventory');
            const shortageResult = await bookingShortageCheck(bookingIdValue);
            if (shortageResult.status === 'SHORTAGE_CREATED') {
                requisitionResult = {
                    status: 'CREATED',
                    request_id: shortageResult.request_id,
                    display_id: shortageResult.display_id,
                };
            }
            if (shortageResult.status === 'ERROR') {
                requisitionResult = { status: 'ERROR', message: shortageResult.message };
            }
        } catch (shortageErr) {
            // Non-blocking: booking succeeds even if shortage check fails
            console.error('[createBookingFromQuote] Shortage check failed (non-blocking):', shortageErr);
            requisitionResult = { status: 'ERROR', message: getErrorMessage(shortageErr) || 'Shortage check failed' };
        }

        revalidatePath('/app/[slug]/sales-orders');
        revalidatePath('/profile');

        return { success: true, data: booking, requisition: requisitionResult };
    } catch (err: unknown) {
        console.error('[createBookingFromQuote] CRITICAL CRASH:', err);
        return { success: false, message: `Server Error: ${getErrorMessage(err) || String(err)}` };
    }
}

export async function confirmSalesOrder(bookingId: string): Promise<{ success: boolean; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    const supabase = await createClient();

    // Fetch strict mode setting
    const { data: settings } = await (adminClient
        .from('sys_settings')
        .select('unified_context_strict_mode')
        .single() as any);
    const isStrict = settings?.unified_context_strict_mode !== false;

    // Fetch booking to verify tenant
    const { data: booking } = await supabase.from('crm_bookings').select('tenant_id').eq('id', bookingId).single();

    if (!booking) return { success: false, message: 'Booking not found' };

    // Hardening: Verify authorization for this dealer
    if (!booking.tenant_id) {
        return { success: false, message: 'Booking tenant missing' };
    }
    const authValidation = await validateDealerAuthorization(supabase, user.id, booking.tenant_id, {
        unified_context_strict_mode: isStrict,
    });
    if (!authValidation.success) {
        return authValidation;
    }

    const { error } = await supabase
        .from('crm_bookings')
        .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

    if (error) {
        console.error('Confirm Sales Order Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }

    revalidatePath('/app/[slug]/sales-orders');
    revalidatePath('/profile');
    return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateBookingStage(id: string, stage: string, statusUpdates: Record<string, any>) {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    const supabase = await createClient();

    // Fetch strict mode setting
    const { data: settings } = await (adminClient
        .from('sys_settings')
        .select('unified_context_strict_mode')
        .single() as any);
    const isStrict = settings?.unified_context_strict_mode !== false;

    // Fetch booking to verify tenant
    const { data: booking } = await supabase.from('crm_bookings').select('tenant_id').eq('id', id).single();

    if (!booking) return { success: false, message: 'Booking not found' };

    // Hardening: Verify authorization for this dealer
    if (!booking.tenant_id) {
        return { success: false, message: 'Booking tenant missing' };
    }
    const authValidation = await validateDealerAuthorization(supabase, user.id, booking.tenant_id, {
        unified_context_strict_mode: isStrict,
    });
    if (!authValidation.success) {
        return authValidation;
    }

    const { error } = await supabase
        .from('crm_bookings')
        .update({
            current_stage: stage,
            ...statusUpdates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Update Booking Stage Error:', error);
        return { success: false, message: getErrorMessage(error) };
    }
    revalidatePath('/app/[slug]/sales-orders');
    return { success: true };
}

// --- MEMBER DOCUMENTS ---

export async function getMemberDocuments(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_assets')
        .select('*')
        .eq('entity_id', memberId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching member documents:', error);
        return [];
    }

    return data || [];
}

export async function uploadMemberDocumentAction(data: {
    memberId: string;
    tenantId: string;
    path: string;
    fileType: string;
    purpose: string;
    metadata?: any;
}) {
    const supabase = await createClient();
    const { data: asset, error } = await supabase
        .from('id_member_assets')
        .insert({
            entity_id: data.memberId,
            tenant_id: data.tenantId,
            path: data.path,
            file_type: data.fileType,
            purpose: data.purpose,
            metadata: data.metadata || {},
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error inserting member document:', error);
        throw error;
    }

    return asset;
}

type LegacyMemberDocument = {
    id: string;
    member_id: string | null;
    name: string;
    category: string | null;
    label: string | null;
    file_type: string | null;
    file_path: string;
    file_size: number | null;
    created_at: string | null;
    updated_at: string | null;
    metadata?: Record<string, any>;
};

function mapMemberAssetToLegacyDocument(asset: any): LegacyMemberDocument {
    const metadata =
        asset?.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
            ? (asset.metadata as Record<string, any>)
            : {};
    const pathParts = String(asset?.path || '').split('/');
    const fallbackName = pathParts[pathParts.length - 1] || 'document';
    const category = (metadata.category as string | undefined) || asset?.purpose || 'MEMBER_DOCUMENT';
    const label = (metadata.label as string | undefined) || (metadata.category as string | undefined) || category;
    const fileSizeRaw = metadata.file_size ?? metadata.size ?? null;
    const fileSize = typeof fileSizeRaw === 'number' ? fileSizeRaw : null;

    return {
        id: asset?.id,
        member_id: asset?.entity_id || null,
        name: (metadata.name as string | undefined) || (metadata.originalName as string | undefined) || fallbackName,
        category,
        label,
        file_type: asset?.file_type || null,
        file_path: asset?.path,
        file_size: fileSize,
        created_at: asset?.created_at || null,
        updated_at: asset?.updated_at || null,
        metadata,
    };
}

export async function uploadMemberDocument(data: {
    memberId: string;
    name: string;
    filePath: string;
    fileType: string;
    category: string;
    label?: string;
    fileSize?: number;
}) {
    const supabase = await createClient();
    const { data: member } = await supabase
        .from('id_members')
        .select('tenant_id')
        .eq('id', data.memberId)
        .maybeSingle();
    const purpose = (data.category || 'MEMBER_DOCUMENT').trim();
    const { data: asset, error } = await supabase
        .from('id_member_assets')
        .insert({
            entity_id: data.memberId,
            tenant_id: member?.tenant_id || null,
            path: data.filePath,
            file_type: data.fileType,
            purpose,
            metadata: {
                source: 'CRM_MEMBER_DOCUMENT_COMPAT',
                name: data.name,
                originalName: data.name,
                category: data.category,
                label: data.label || data.category,
                file_size: data.fileSize || null,
            },
            updated_at: new Date().toISOString(),
            uploaded_by: null,
        })
        .select('*')
        .single();

    if (error) {
        console.error('uploadMemberDocument Error:', error);
        throw error;
    }

    return mapMemberAssetToLegacyDocument(asset);
}

export async function getCrmMemberDocuments(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_assets')
        .select('*')
        .eq('entity_id', memberId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getCrmMemberDocuments Error:', error);
        return [];
    }

    return ((data as any[]) || []).map(mapMemberAssetToLegacyDocument);
}

export async function deleteCrmMemberDocument(documentId: string) {
    const supabase = await createClient();

    // Get the file path first
    const { data: doc, error: fetchError } = await supabase
        .from('id_member_assets')
        .select('path')
        .eq('id', documentId)
        .single();

    if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        throw fetchError;
    }

    // Delete from storage
    if (doc?.path && !String(doc.path).startsWith('/uploads/')) {
        const bucketRemovals = await Promise.allSettled([
            supabase.storage.from('documents').remove([doc.path]),
            supabase.storage.from('member-documents').remove([doc.path]),
        ]);
        for (const result of bucketRemovals) {
            if (result.status === 'fulfilled' && result.value.error) {
                console.error('Error removing file from storage:', result.value.error);
            }
        }
    }

    const { error } = await supabase.from('id_member_assets').delete().eq('id', documentId);

    if (error) {
        console.error('deleteCrmMemberDocument Error:', error);
        throw error;
    }
}

export async function deleteMemberDocumentAction(documentId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('id_member_assets').delete().eq('id', documentId);

    if (error) {
        console.error('Error deleting member document:', error);
        throw error;
    }
}

export async function updateMemberDocumentAction(
    id: string,
    updates: {
        path?: string;
        purpose?: string;
        file_type?: string;
        metadata?: any;
    }
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_assets')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating member document:', error);
        throw error;
    }
    return data;
}

export async function getSignedUrlAction(path: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60); // 60 seconds expiry

    if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
    }

    return data.signedUrl;
}

export async function getMemberDocumentUrl(path: string) {
    const supabase = await createClient();
    if (path.startsWith('/uploads/')) {
        return path;
    }
    const primary = await supabase.storage.from('documents').createSignedUrl(path, 3600); // 1 hour expiry
    if (!primary.error) return primary.data.signedUrl;

    const fallback = await supabase.storage.from('member-documents').createSignedUrl(path, 3600);
    if (fallback.error) {
        console.error('Error creating signed URL:', fallback.error);
        return null;
    }

    return fallback.data.signedUrl;
}

export async function getQuotePdpUrl(quoteId: string) {
    const supabase = await createClient();

    // 1. Fetch Quote to get variant_id
    const { data: quote, error: quoteError } = await supabase
        .from('crm_quotes')
        .select('variant_id, lead_id')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (quoteError || !quote || !quote.variant_id) {
        console.error('getQuotePdpUrl Error: Quote not found', quoteError);
        return { success: false, error: 'Quote or Variant not found' };
    }

    // 2. Resolve slugs from canonical V2 tables first
    const { data: skuRow } = await (supabase as any)
        .from('cat_skus')
        .select(
            `
            id,
            model:cat_models!model_id(slug, brand:cat_brands!brand_id(slug)),
            vehicle_variant:cat_variants_vehicle!vehicle_variant_id(slug),
            accessory_variant:cat_variants_accessory!accessory_variant_id(slug),
            service_variant:cat_variants_service!service_variant_id(slug)
        `
        )
        .eq('id', quote.variant_id)
        .maybeSingle();

    const modelSlug = skuRow?.model?.slug;
    const brandSlug = skuRow?.model?.brand?.slug;
    const variantSlug =
        skuRow?.vehicle_variant?.slug || skuRow?.accessory_variant?.slug || skuRow?.service_variant?.slug;

    if (brandSlug && modelSlug && variantSlug) {
        return { success: true, url: `/app/${brandSlug}/${modelSlug}/${variantSlug}/quote` };
    }

    return { success: false, error: 'Variant slugs not found in canonical catalog' };
}

// --- QUOTE EDITOR DASHBOARD ACTIONS ---

export interface QuoteEditorData {
    id: string;
    displayId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    validUntil: string | null;
    leadId?: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    expectedDelivery: string | null;
    studioId: string | null;
    studioName: string | null;
    tenantId: string | null;
    district: string | null;
    customer: {
        name: string;
        phone: string;
        email: string | null;
        leadSource: string | null;
    };
    customerProfile?: {
        memberId?: string | null;
        fullName?: string | null;
        primaryPhone?: string | null;
        whatsapp?: string | null;
        primaryEmail?: string | null;
        email?: string | null;
        currentAddress?: string | null;
        currentAddress1?: string | null;
        currentAddress2?: string | null;
        currentAddress3?: string | null;
        aadhaarAddress?: string | null;
        workAddress?: string | null;
        workCompany?: string | null;
        workDesignation?: string | null;
        workIndustry?: string | null;
        workProfile?: string | null;
        workPincode?: string | null;
        workTaluka?: string | null;
        workDistrict?: string | null;
        workState?: string | null;
        aadhaarAddress1?: string | null;
        aadhaarAddress2?: string | null;
        aadhaarAddress3?: string | null;
        workAddress1?: string | null;
        workAddress2?: string | null;
        workAddress3?: string | null;
        taluka?: string | null;
        district?: string | null;
        state?: string | null;
        pincode?: string | null;
        dob?: string | null;
        ownershipType?: string | null;
        avatarUrl?: string | null;
    } | null;
    referral?: {
        referredByName?: string | null;
        referredById?: string | null;
        referralData?: any;
    } | null;
    vehicle: {
        brand: string;
        model: string;
        variant: string;
        color: string;
        colorHex: string;
        imageUrl: string | null;
        skuId: string;
    };
    pricing: {
        exShowroom: number;
        exShowroomGstRate?: number;
        rtoType: 'STATE' | 'BH' | 'COMPANY';
        rtoBreakdown: { label: string; amount: number }[];
        rtoTotal: number;
        insuranceOD: number;
        insuranceTP: number;
        insuranceAddons: {
            id: string;
            name: string;
            amount: number;
            basePrice?: number;
            discountPrice?: number | null;
            selected: boolean;
            breakdown?: any;
        }[];
        insuranceGST: number;
        insuranceTotal: number;
        insuranceProvider?: string | null;
        accessories: {
            id: string;
            name: string;
            price: number;
            basePrice?: number;
            discountPrice?: number | null;
            qty?: number;
            selected: boolean;
        }[];
        accessoriesTotal: number;
        services: {
            id: string;
            name: string;
            price: number;
            basePrice?: number;
            discountPrice?: number | null;
            qty?: number;
            selected: boolean;
        }[];
        servicesTotal: number;
        insuranceGstRate: number;
        dealerDiscount: number;
        colorDelta?: number;
        offersDelta?: number;
        managerDiscount: number;
        managerDiscountNote: string | null;
        onRoadTotal: number;
        finalTotal: number;
        rtoOptions?: any[];
        insuranceRequiredItems?: any[];
        offersItems?: any[];
        warrantyItems?: any[];
        referralApplied?: boolean;
        referralBonus?: number;
    };
    financeMode?: 'CASH' | 'LOAN';
    delivery?: {
        serviceable?: boolean | null;
        pincode?: string | null;
        taluka?: string | null;
        district?: string | null;
        stateCode?: string | null;
        delivery_tat_days?: number | null;
        checked_at?: string | null;
    } | null;
    finance?: {
        id?: string | null;
        status?: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        selection_logic?: string | null;
        scheme_interest_rate?: number | null;
        scheme_interest_type?: string | null;
        ltv?: number | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[] | null;
        emi?: number | null;
        approvedDownPayment?: number | null;
        approvedAmount?: number | null;
        approvedAddOns?: number | null;
        approvedProcessingFee?: number | null;
        approvedChargesBreakup?: any[] | null;
        approvedAddonsBreakup?: any[] | null;
        approvedEmi?: number | null;
        approvedScheme?: string | null;
        approvedTenure?: number | null;
        approvedIrr?: number | null;
        approvedMarginMoney?: number | null;
        approvedGrossLoan?: number | null;
    } | null;
    financeAttempts?: {
        id: string;
        status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[] | null;
        emi?: number | null;
        createdAt?: string | null;
    }[];
    timeline: { event: string; timestamp: string; actor: string | null; actorType: 'customer' | 'team' }[];
}

export async function getQuoteById(
    quoteId: string
): Promise<{ success: boolean; data?: QuoteEditorData; error?: string }> {
    const supabase = await createClient();

    // Fetch quote with related data
    const { data: quote, error } = await supabase
        .from('crm_quotes')
        .select(
            `
            *,
            lead:crm_leads!quotes_lead_id_fkey(id, customer_name, customer_phone, utm_data, events_log, customer_id, referral_data, referred_by_name, referred_by_id)
        `
        )
        .eq('id', quoteId)
        .eq('is_deleted', false)
        .single();

    if (error || !quote) {
        console.error('getQuoteById Error:', error);
        return { success: false, error: getErrorMessage(error) || 'Quote not found' };
    }

    // Cast to any since we just added new columns that aren't in generated types yet
    const q = quote as any;

    const commercials: any = q.commercials || {};
    const pricingSnapshot: any = commercials.pricing_snapshot || {};
    const dealerFromPricing = pricingSnapshot?.dealer || commercials?.dealer || null;

    // Fetch high-fidelity pricing from canonical state pricing table
    const pricingClient = await createClient();
    let highFidelityPricing = null;
    const colorId = q.color_id || q.vehicle_sku_id || pricingSnapshot?.color_id;
    const stateCode = commercials.location?.state_code || pricingSnapshot?.location?.state_code;
    const district = commercials.location?.district || pricingSnapshot?.location?.district;

    if (colorId && stateCode) {
        const { data: priceRow } = await pricingClient
            .from('cat_price_state_mh')
            .select(
                `
                gst_rate, hsn_code, ins_gst_rate,
                rto_registration_fee_state, rto_smartcard_charges_state, rto_postal_charges_state, rto_roadtax_amount_state, rto_roadtax_cess_amount_state, rto_total_state,
                rto_registration_fee_bh, rto_smartcard_charges_bh, rto_postal_charges_bh, rto_roadtax_amount_bh, rto_roadtax_cess_amount_bh, rto_total_bh,
                rto_registration_fee_company, rto_smartcard_charges_company, rto_postal_charges_company, rto_roadtax_amount_company, rto_roadtax_cess_amount_company, rto_total_company,
                ins_own_damage_total_amount, ins_liability_only_total_amount
                `
            )
            .eq('sku_id', colorId)
            .eq('state_code', stateCode)
            .maybeSingle();
        if (priceRow) {
            highFidelityPricing = {
                gst_rate: Number((priceRow as any).gst_rate || 0),
                hsn_code: (priceRow as any).hsn_code,
                rto: {
                    STATE: {
                        registrationFee: Number((priceRow as any).rto_registration_fee_state || 0),
                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_state || 0),
                        postalCharges: Number((priceRow as any).rto_postal_charges_state || 0),
                        roadTax: Number((priceRow as any).rto_roadtax_amount_state || 0),
                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_state || 0),
                        total: Number((priceRow as any).rto_total_state || 0),
                    },
                    BH: {
                        registrationFee: Number((priceRow as any).rto_registration_fee_bh || 0),
                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_bh || 0),
                        postalCharges: Number((priceRow as any).rto_postal_charges_bh || 0),
                        roadTax: Number((priceRow as any).rto_roadtax_amount_bh || 0),
                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_bh || 0),
                        total: Number((priceRow as any).rto_total_bh || 0),
                    },
                    COMPANY: {
                        registrationFee: Number((priceRow as any).rto_registration_fee_company || 0),
                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_company || 0),
                        postalCharges: Number((priceRow as any).rto_postal_charges_company || 0),
                        roadTax: Number((priceRow as any).rto_roadtax_amount_company || 0),
                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_company || 0),
                        total: Number((priceRow as any).rto_total_company || 0),
                    },
                },
                insurance: {
                    gst_rate: Number((priceRow as any).ins_gst_rate || 18),
                    od: { total: Number((priceRow as any).ins_own_damage_total_amount || 0) },
                    tp: { total: Number((priceRow as any).ins_liability_only_total_amount || 0) },
                },
            };
        }
    }

    const missing: string[] = [];
    if (!commercials.label && (!commercials.brand || !commercials.model || !commercials.variant)) {
        missing.push('vehicle_label');
    }
    if (!commercials.color_name && !commercials.color && !q.color_id && !q.vehicle_sku_id) {
        missing.push('color');
    }
    if (!pricingSnapshot || Object.keys(pricingSnapshot).length === 0) {
        missing.push('pricing_snapshot');
    }
    if (!(pricingSnapshot?.ex_showroom || commercials.ex_showroom || commercials.base_price)) {
        missing.push('ex_showroom');
    }
    if (pricingSnapshot?.rto_total === undefined || pricingSnapshot?.rto_total === null) {
        missing.push('rto_total');
    }
    if (pricingSnapshot?.insurance_total === undefined || pricingSnapshot?.insurance_total === null) {
        missing.push('insurance_total');
    }
    if (!dealerFromPricing?.dealer_id && !dealerFromPricing?.studio_id && !dealerFromPricing?.id && !q.studio_id) {
        missing.push('dealer');
    }

    if (missing.length > 0) {
        return {
            success: false,
            error: `Quote data incomplete: ${missing.join(', ')}. Please re-create this quote.`,
        };
    }

    // Build timeline from lead events + quote events
    const timeline: {
        event: string;
        timestamp: string;
        actor: string | null;
        actorType: 'customer' | 'team';
        source?: string | null;
        reason?: string | null;
    }[] = [];

    timeline.push({
        event: 'Quote Created',
        timestamp: q.created_at || new Date().toISOString(),
        actor: null,
        actorType: 'team',
        source: 'SYSTEM',
    });

    if (q.reviewed_at) {
        timeline.push({
            event: q.status === 'IN_REVIEW' ? 'In Review' : 'Manager Reviewed',
            timestamp: q.reviewed_at,
            actor: q.reviewed_by,
            actorType: 'team',
            source: 'CRM',
        });
    }

    // Add stored timeline events from commercials
    if (commercials.timeline && Array.isArray(commercials.timeline)) {
        commercials.timeline.forEach((ev: any) => {
            timeline.push({
                event: ev.event,
                timestamp: ev.timestamp,
                actor: ev.actor,
                actorType: ev.actorType || 'team',
                source: ev.source || null,
                reason: ev.reason || null,
            });
        });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const baseData = {
        id: q.id,
        displayId: q.display_id || `QT-${q.id.slice(0, 8).toUpperCase()}`,
        status: q.status || 'DRAFT',
        createdAt: q.created_at || new Date().toISOString(),
        updatedAt: q.updated_at || new Date().toISOString(),
        validUntil: q.valid_until,
        leadId: q.lead_id || null,
        reviewedBy: q.reviewed_by,
        reviewedAt: q.reviewed_at,
        expectedDelivery: q.expected_delivery,
        studioId: q.studio_id || dealerFromPricing?.studio_id || dealerFromPricing?.dealer_id || null,
        studioName: dealerFromPricing?.dealer_name || dealerFromPricing?.name || null,
        district: pricingSnapshot?.location?.district || null,
        financeMode: q.finance_mode || (commercials.finance?.mode as any) || 'CASH',
        tenantId: q.tenant_id || null,
        delivery: commercials.delivery || null,
    };

    // Fetch Member Profile (single query to avoid slow duplicate fetches)
    let customerProfile: any = null;
    const leadPhoneRaw = q.lead?.customer_phone || '';
    const leadPhoneDigits = toAppStorageFormat(leadPhoneRaw);
    const leadPhone = leadPhoneDigits; // Keep for conditional checks

    // Construct robust search variations
    const phoneSearchVariations = new Set<string>();
    if (leadPhoneRaw) phoneSearchVariations.add(leadPhoneRaw.trim());
    if (leadPhoneDigits) phoneSearchVariations.add(leadPhoneDigits);
    if (leadPhoneDigits.length > 10) phoneSearchVariations.add(leadPhoneDigits.slice(-10));
    // Add common formatted versions if we have a clean 10-digit number
    if (leadPhoneDigits.length === 10) {
        phoneSearchVariations.add(`+91${leadPhoneDigits}`);
        phoneSearchVariations.add(`+91 ${leadPhoneDigits}`);
    }
    const leadEmail = null;

    const resolvedMemberId = q.member_id || q.lead?.customer_id || null;

    if (resolvedMemberId || leadPhone) {
        const { data: member } = await adminClient
            .from('id_members')
            .select(
                [
                    'id',
                    'full_name',
                    'primary_phone',
                    'whatsapp',
                    'primary_email',
                    'email',
                    'current_address1',
                    'current_address2',
                    'current_address3',
                    'aadhaar_address1',
                    'aadhaar_address2',
                    'aadhaar_address3',
                    'work_address1',
                    'work_address2',
                    'work_address3',
                    'work_company',
                    'work_designation',
                    'work_email',
                    'work_phone',
                    'taluka',
                    'district',
                    'state',
                    'pincode',
                    'date_of_birth',
                    'avatar_url',
                ].join(', ')
            )
            .eq('id', resolvedMemberId || '')
            .maybeSingle();

        let resolvedMember: any = member;

        if (!resolvedMember && phoneSearchVariations.size > 0) {
            const { data: memberByContact } = await adminClient
                .from('id_members')
                .select(
                    [
                        'id',
                        'full_name',
                        'primary_phone',
                        'whatsapp',
                        'primary_email',
                        'email',
                        'current_address1',
                        'current_address2',
                        'current_address3',
                        'aadhaar_address1',
                        'aadhaar_address2',
                        'aadhaar_address3',
                        'work_address1',
                        'work_address2',
                        'work_address3',
                        'work_company',
                        'work_designation',
                        'work_email',
                        'work_phone',
                        'taluka',
                        'district',
                        'state',
                        'pincode',
                        'aadhaar_pincode',
                        'date_of_birth',
                        'avatar_url',
                    ].join(', ')
                )
                .or(
                    Array.from(phoneSearchVariations)
                        .flatMap(p => [`primary_phone.eq.${p}`, `whatsapp.eq.${p}`])
                        // Escaping commas if necessary, though typical phone chars are safe
                        .join(',')
                )
                .limit(1)
                .maybeSingle();
            resolvedMember = memberByContact || null;

            if (resolvedMember && q.lead?.id && !q.lead?.customer_id) {
                await supabase.from('crm_leads').update({ customer_id: resolvedMember.id }).eq('id', q.lead.id);
            }

            if (resolvedMember && q.id && !q.member_id) {
                await supabase.from('crm_quotes').update({ member_id: resolvedMember.id }).eq('id', q.id);
            }
        }

        if (resolvedMember) {
            const currentAddress = [
                resolvedMember.current_address1,
                resolvedMember.current_address2,
                resolvedMember.current_address3,
            ]
                .filter(Boolean)
                .join(', ');
            const aadhaarAddress = [
                resolvedMember.aadhaar_address1,
                resolvedMember.aadhaar_address2,
                resolvedMember.aadhaar_address3,
            ]
                .filter(Boolean)
                .join(', ');
            const workAddress = [
                resolvedMember.work_address1,
                resolvedMember.work_address2,
                resolvedMember.work_address3,
            ]
                .filter(Boolean)
                .join(', ');

            customerProfile = {
                memberId: resolvedMember.id,
                fullName: resolvedMember.full_name,
                primaryPhone: resolvedMember.primary_phone,
                whatsapp: resolvedMember.whatsapp,
                primaryEmail: resolvedMember.primary_email,
                email: resolvedMember.email,
                dob: resolvedMember.date_of_birth,
                pincode: resolvedMember.pincode || resolvedMember.aadhaar_pincode,
                taluka: resolvedMember.taluka,
                district: resolvedMember.district,
                state: resolvedMember.state,
                currentAddress: currentAddress || null,
                aadhaarAddress: aadhaarAddress || null,
                workAddress: workAddress || null,
                currentAddress1: resolvedMember.current_address1,
                currentAddress2: resolvedMember.current_address2,
                currentAddress3: resolvedMember.current_address3,
                aadhaarAddress1: resolvedMember.aadhaar_address1,
                aadhaarAddress2: resolvedMember.aadhaar_address2,
                aadhaarAddress3: resolvedMember.aadhaar_address3,
                workAddress1: resolvedMember.work_address1,
                workAddress2: resolvedMember.work_address2,
                workAddress3: resolvedMember.work_address3,
                workCompany: resolvedMember.work_company,
                workDesignation: resolvedMember.work_designation,
                workEmail: resolvedMember.work_email,
                workPhone: resolvedMember.work_phone,
                avatarUrl: resolvedMember.avatar_url || null,
            };
        }
    }

    // Resolve vehicle image: fallback to cat_skus if not stored on quote
    let vehicleImageUrl = q.vehicle_image || commercials.image_url || null;
    if (!vehicleImageUrl) {
        const skuId = q.vehicle_sku_id || q.color_id || q.variant_id;
        if (skuId) {
            const { data: catItem } = await (adminClient as any)
                .from('cat_skus')
                .select('image_url')
                .eq('id', skuId)
                .single();
            vehicleImageUrl = catItem?.image_url || null;
        }
    }

    const result: QuoteEditorData = {
        ...baseData,
        customer: {
            name: q.lead?.customer_name || 'N/A',
            phone: q.lead?.customer_phone || 'N/A',
            email: null,
            leadSource: q.lead?.utm_data?.utm_source || 'WEBSITE',
        },
        customerProfile,
        referral: q.lead
            ? {
                  referredByName: q.lead?.referred_by_name || null,
                  referredById: q.lead?.referred_by_id || null,
                  referralData: q.lead?.referral_data || null,
              }
            : null,
        vehicle: {
            brand: commercials.brand || 'N/A',
            model: commercials.model || 'N/A',
            variant: commercials.variant || 'N/A',
            color: commercials.color_name || commercials.color || 'N/A',
            colorHex: commercials.color_hex || '#000000',
            imageUrl: vehicleImageUrl,
            skuId: q.vehicle_sku_id || q.color_id || q.variant_id || '',
        },
        pricing: {
            exShowroom: parseInt(q.ex_showroom_price) || commercials.ex_showroom || commercials.base_price || 0,
            exShowroomGstRate: highFidelityPricing?.gst_rate
                ? Math.round(
                      Number(highFidelityPricing.gst_rate) * (Number(highFidelityPricing.gst_rate) < 1 ? 100 : 1)
                  )
                : 28,
            rtoType: pricingSnapshot.rto_type || commercials.rto_type || 'STATE',
            rtoBreakdown: (() => {
                const type = pricingSnapshot.rto_type || commercials.rto_type || 'STATE';
                const highFidelityRto = (highFidelityPricing as any)?.rto?.[type];

                if (highFidelityRto && typeof highFidelityRto === 'object') {
                    return Object.entries(highFidelityRto)
                        .filter(([key]) => key !== 'total' && key !== 'id')
                        .map(([key, val]) => ({
                            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                            amount: Number(val) || 0,
                        }));
                }
                return pricingSnapshot.rto_breakdown || [];
            })(),
            rtoTotal: pricingSnapshot.rto_total || 0,
            insuranceTP: (() => {
                // Priority 1: Flat key from new marketplace snapshots
                const flatTp = pricingSnapshot.insurance_tp ?? commercials.insurance_tp;
                if (flatTp !== undefined && flatTp !== null && Number(flatTp) > 0) return Number(flatTp);
                // Priority 2: SOT object format {base, gst, total}
                const objTp = pricingSnapshot.insurance?.tp;
                if (objTp && typeof objTp === 'object' && 'total' in objTp) return Number(objTp.total || 0);
                if (typeof objTp === 'number' && objTp > 0) return objTp;
                // Priority 3: commercials insurance object
                const commObjTp = commercials.insurance?.tp;
                if (commObjTp && typeof commObjTp === 'object' && 'total' in commObjTp)
                    return Number(commObjTp.total || 0);
                if (typeof commObjTp === 'number' && commObjTp > 0) return commObjTp;
                return 0;
            })(),
            insuranceOD: (() => {
                // Priority 1: Flat key from new marketplace snapshots
                const flatOd = pricingSnapshot.insurance_od ?? commercials.insurance_od;
                if (flatOd !== undefined && flatOd !== null && Number(flatOd) > 0) return Number(flatOd);
                // Priority 2: SOT object format {base, gst, total}
                const objOd = pricingSnapshot.insurance?.od;
                if (objOd && typeof objOd === 'object' && 'total' in objOd) return Number(objOd.total || 0);
                if (typeof objOd === 'number' && objOd > 0) return objOd;
                // Priority 3: commercials insurance object
                const commObjOd = commercials.insurance?.od;
                if (commObjOd && typeof commObjOd === 'object' && 'total' in commObjOd)
                    return Number(commObjOd.total || 0);
                if (typeof commObjOd === 'number' && commObjOd > 0) return commObjOd;
                // Priority 4: Back-calculate from total (legacy quotes)
                const insTotal = Number(pricingSnapshot.insurance_total || pricingSnapshot.insurance_base || 0);
                if (insTotal > 0) {
                    // Get TP we already resolved (re-resolve without this closure)
                    const resolvedTp = Number(
                        pricingSnapshot.insurance_tp ??
                            commercials.insurance_tp ??
                            (pricingSnapshot.insurance?.tp && typeof pricingSnapshot.insurance.tp === 'object'
                                ? pricingSnapshot.insurance.tp.total
                                : pricingSnapshot.insurance?.tp) ??
                            0
                    );
                    // OD = base premium - TP (insurance_base is pre-GST total of OD+TP+GST)
                    const baseBeforeGst = Math.round(insTotal / 1.18);
                    return Math.max(0, baseBeforeGst - resolvedTp);
                }
                return 0;
            })(),
            insuranceAddons: (pricingSnapshot.insurance_addon_items || pricingSnapshot.insurance_addons || []).map(
                (a: any) => {
                    const breakdown = a.breakdown || a.breakup || null;
                    const baseFromBreakdown = Array.isArray(breakdown)
                        ? breakdown.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0)
                        : null;
                    const basePrice = a.basePrice ?? baseFromBreakdown ?? a.price ?? a.amount ?? 0;
                    const discountPrice = a.discountPrice ?? null;
                    const finalAmount = discountPrice ?? a.price ?? a.amount ?? 0;
                    return {
                        id: a.id || a,
                        name: a.name || a,
                        amount: finalAmount,
                        basePrice,
                        discountPrice,
                        selected: a.selected !== undefined ? a.selected : true,
                        breakdown,
                    };
                }
            ),
            insuranceGST: (() => {
                // Priority 1: Flat key from new marketplace snapshots
                const flatGst = pricingSnapshot.insurance_gst;
                if (flatGst !== undefined && flatGst !== null && Number(flatGst) > 0) return Number(flatGst);
                // Priority 2: SOT object — sum OD GST + TP GST
                const odObj = pricingSnapshot.insurance?.od;
                const tpObj = pricingSnapshot.insurance?.tp;
                if (odObj && typeof odObj === 'object' && 'gst' in odObj) {
                    return Number(odObj.gst || 0) + Number(tpObj?.gst || 0);
                }
                // Priority 3: Single gst field on insurance
                const gstField = pricingSnapshot.insurance?.gst;
                if (typeof gstField === 'number' && gstField > 0) return gstField;
                // Priority 4: Back-calculate from total
                const insTotal = Number(pricingSnapshot.insurance_total || 0);
                if (insTotal > 0) return insTotal - Math.round(insTotal / 1.18);
                return 0;
            })(),
            insuranceTotal: pricingSnapshot.insurance_total || 0,
            insuranceProvider: (await (async () => {
                const existing =
                    pricingSnapshot.insurance_provider ||
                    pricingSnapshot.insurance?.insurer ||
                    commercials.insurance_provider;
                if (existing) return existing;

                // Fallback to cat_ins_rules lookup
                const { data: rule } = await adminClient
                    .from('cat_ins_rules')
                    .select('insurer_name')
                    .eq('state_code', commercials.location?.state_code || 'ALL')
                    .limit(1)
                    .maybeSingle();
                return rule?.insurer_name || null;
            })()) as string | null,
            accessories: (pricingSnapshot.accessory_items || pricingSnapshot.accessories || []).map((a: any) => ({
                id: a.id || a,
                name: a.name || 'Accessory',
                price: a.discountPrice || a.price || 0,
                basePrice: a.price || 0,
                discountPrice: a.discountPrice || null,
                image: a.image || a.image_url || null,
                qty: Number(a.qty || 1),
                selected: true,
            })),
            accessoriesTotal: pricingSnapshot.accessories_total || 0,
            services: (pricingSnapshot.service_items || pricingSnapshot.services || []).map((s: any) => ({
                id: s.id || s,
                name: s.name || 'Service',
                price: s.discountPrice || s.price || 0,
                basePrice: s.price || 0,
                discountPrice: s.discountPrice || null,
                qty: Number(s.qty || 1),
                selected: true,
            })),
            servicesTotal: pricingSnapshot.services_total || 0,
            insuranceGstRate: Number(pricingSnapshot.insurance_gst_rate || 18),
            colorDelta: Number(pricingSnapshot.color_delta || 0),
            offersDelta: Number(pricingSnapshot.offers_delta || 0),
            dealerDiscount: (() => {
                const explicit = parseInt(q.discount_amount) || commercials.dealer_discount || 0;
                const hasColorDelta = Number(pricingSnapshot.color_delta || 0) !== 0;
                if (explicit) return explicit;
                if (hasColorDelta) return 0;
                return pricingSnapshot?.dealer?.offer || 0;
            })(),
            managerDiscount: parseInt(q.manager_discount) || 0,
            managerDiscountNote: q.manager_discount_note || null,
            onRoadTotal: pricingSnapshot.grand_total || parseInt(q.on_road_price) || commercials.grand_total || 0,
            finalTotal:
                (pricingSnapshot.grand_total || parseInt(q.on_road_price) || commercials.grand_total || 0) +
                (parseInt(q.manager_discount) || 0),
            rtoOptions: pricingSnapshot.rto_options || [],
            insuranceRequiredItems: pricingSnapshot.insurance_required_items || [],
            offersItems: pricingSnapshot.offers_items || [],
            warrantyItems: pricingSnapshot.warranty_items || [],
            referralApplied: pricingSnapshot.referral_applied || false,
            referralBonus: pricingSnapshot.referral_bonus || 0,
        },
        finance: null,
        timeline,
    };

    const resolveBankName = async (bankId?: string | null, currentName?: string | null) => {
        const normalized = (currentName || '').trim();
        if (!bankId) return normalized || null;
        if (normalized && normalized.toLowerCase() !== 'new financier') return normalized;
        const { data: bank } = await adminClient.from('id_tenants').select('name').eq('id', bankId).maybeSingle();
        return bank?.name || normalized || null;
    };

    const normalizeCharges = (charges: any[] = []) => {
        return (charges || []).map(c => ({
            label: c.label || c.name || 'Charge',
            amount: Number(c.amount ?? c.value ?? 0),
            impact: c.impact || undefined,
            type: c.type || undefined,
            calculationBasis: c.calculationBasis || undefined,
            taxStatus: c.taxStatus || undefined,
            taxRate: c.taxRate || undefined,
        }));
    };

    const splitCharges = (charges: any[] = []) => {
        const normalized = normalizeCharges(charges);
        const upfront = normalized.filter(c => !c.impact || c.impact === 'UPFRONT');
        const funded = normalized.filter(c => c.impact === 'FUNDED');
        const upfrontTotal = upfront.reduce((sum, c) => sum + (c.amount || 0), 0);
        const fundedTotal = funded.reduce((sum, c) => sum + (c.amount || 0), 0);
        return { upfront, funded, upfrontTotal, fundedTotal };
    };

    if (q.active_finance_id) {
        const { data: attempt } = await supabase
            .from('crm_quote_finance_attempts')
            .select('*')
            .eq('id', q.active_finance_id)
            .eq('is_deleted', false)
            .maybeSingle();
        if (attempt) {
            const { upfront, funded, upfrontTotal, fundedTotal } = splitCharges(
                typeof attempt.charges_breakup === 'string'
                    ? JSON.parse(attempt.charges_breakup)
                    : (attempt.charges_breakup as unknown as any[]) || []
            );
            const resolvedBankName = await resolveBankName(attempt.bank_id, attempt.bank_name);
            result.finance = {
                id: attempt.id,
                status: attempt.status as any,
                bankId: attempt.bank_id,
                bankName: resolvedBankName,
                schemeId: attempt.scheme_id,
                schemeCode: attempt.scheme_code,
                selection_logic: (commercials.finance as any)?.selection_logic || null,
                scheme_interest_rate: (commercials.finance as any)?.scheme_interest_rate || null,
                scheme_interest_type: (commercials.finance as any)?.scheme_interest_type || null,
                ltv: attempt.ltv,
                roi: attempt.roi,
                tenureMonths: attempt.tenure_months,
                downPayment: attempt.down_payment,
                loanAmount: attempt.loan_amount,
                loanAddons: attempt.loan_addons ?? fundedTotal,
                processingFee: upfrontTotal || attempt.processing_fee,
                approvedProcessingFee: upfrontTotal || attempt.processing_fee,
                chargesBreakup: upfront,
                approvedChargesBreakup: upfront,
                emi: attempt.emi,
                approvedEmi: attempt.emi,
                approvedAmount: attempt.loan_amount,
                approvedDownPayment: attempt.down_payment,
                approvedAddOns: attempt.loan_addons ?? fundedTotal,
                approvedScheme: attempt.scheme_code,
                approvedTenure: attempt.tenure_months,
                approvedIrr: attempt.roi,
                approvedMarginMoney: 0,
                approvedAddonsBreakup: funded,
                approvedGrossLoan: (attempt.loan_amount || 0) + (attempt.loan_addons ?? fundedTotal ?? 0),
            };
        }
    } else if (commercials.finance || pricingSnapshot.finance_bank_name || pricingSnapshot.finance_bank_id) {
        const financeCharges =
            (commercials.finance?.charges_breakup as any[]) || (pricingSnapshot.finance_charges_breakup as any[]) || [];
        const { upfront, funded, upfrontTotal, fundedTotal } = splitCharges(financeCharges);
        const resolvedBankName = await resolveBankName(
            commercials.finance?.bank_id || pricingSnapshot.finance_bank_id || null,
            commercials.finance?.bank_name || pricingSnapshot.finance_bank_name || null
        );
        result.finance = {
            bankId: commercials.finance?.bank_id || pricingSnapshot.finance_bank_id || null,
            bankName: resolvedBankName,
            schemeId: commercials.finance?.scheme_id || pricingSnapshot.finance_scheme_id || null,
            schemeCode:
                commercials.finance?.scheme_code ||
                commercials.finance?.scheme_name ||
                pricingSnapshot.finance_scheme_name ||
                pricingSnapshot.finance_scheme_code ||
                pricingSnapshot.finance_scheme_id ||
                null,
            selection_logic: commercials.finance?.selection_logic || null,
            scheme_interest_rate: commercials.finance?.scheme_interest_rate || null,
            scheme_interest_type:
                commercials.finance?.scheme_interest_type || pricingSnapshot.finance_interest_type || null,
            ltv: commercials.finance?.ltv ?? pricingSnapshot.finance_ltv ?? null,
            roi: commercials.finance?.roi ?? pricingSnapshot.finance_roi ?? null,
            tenureMonths:
                commercials.finance?.tenure_months ??
                pricingSnapshot.finance_tenure ??
                pricingSnapshot.emi_tenure ??
                null,
            downPayment: commercials.finance?.down_payment ?? pricingSnapshot.down_payment ?? null,
            approvedDownPayment: commercials.finance?.down_payment ?? pricingSnapshot.down_payment ?? 0,
            loanAmount: commercials.finance?.loan_amount ?? pricingSnapshot.finance_loan_amount ?? null,
            approvedAmount: commercials.finance?.loan_amount ?? pricingSnapshot.finance_loan_amount ?? 0,
            loanAddons:
                commercials.finance?.loan_addons ??
                pricingSnapshot.finance_funded_addons ??
                pricingSnapshot.finance_loan_addons ??
                null,
            approvedAddOns:
                commercials.finance?.loan_addons ??
                pricingSnapshot.finance_funded_addons ??
                pricingSnapshot.finance_loan_addons ??
                fundedTotal ??
                0,
            processingFee:
                commercials.finance?.processing_fee ??
                pricingSnapshot.finance_upfront_charges ??
                pricingSnapshot.finance_processing_fees ??
                null,
            approvedProcessingFee:
                commercials.finance?.processing_fee ??
                pricingSnapshot.finance_upfront_charges ??
                pricingSnapshot.finance_processing_fees ??
                upfrontTotal ??
                0,
            chargesBreakup: upfront,
            approvedChargesBreakup: upfront,
            emi: commercials.finance?.emi ?? pricingSnapshot.finance_emi ?? null,
            approvedEmi: commercials.finance?.emi ?? pricingSnapshot.finance_emi ?? 0,
            approvedScheme:
                commercials.finance?.scheme_code ||
                commercials.finance?.scheme_name ||
                pricingSnapshot.finance_scheme_name ||
                pricingSnapshot.finance_scheme_code ||
                pricingSnapshot.finance_scheme_id ||
                '',
            approvedTenure:
                commercials.finance?.tenure_months ?? pricingSnapshot.finance_tenure ?? pricingSnapshot.emi_tenure ?? 0,
            approvedIrr: commercials.finance?.roi ?? pricingSnapshot.finance_roi ?? 0,
            approvedMarginMoney: commercials.finance?.margin_money ?? 0,
            approvedAddonsBreakup: funded,
            approvedGrossLoan:
                (commercials.finance?.loan_amount ?? pricingSnapshot.finance_loan_amount ?? 0) +
                (commercials.finance?.loan_addons ??
                    pricingSnapshot.finance_funded_addons ??
                    pricingSnapshot.finance_loan_addons ??
                    fundedTotal ??
                    0),
        };
    }

    const { data: financeAttemptsRaw } = await supabase
        .from('crm_quote_finance_attempts')
        .select(
            'id, status, bank_id, bank_name, scheme_id, scheme_code, roi, tenure_months, down_payment, loan_amount, loan_addons, processing_fee, charges_breakup, emi, created_at'
        )
        .eq('quote_id', quoteId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (financeAttemptsRaw && financeAttemptsRaw.length > 0) {
        const resolvedAttempts = await Promise.all(
            financeAttemptsRaw.map(async attempt => ({
                id: attempt.id,
                status: attempt.status as any,
                bankId: attempt.bank_id || null,
                bankName: await resolveBankName(attempt.bank_id, attempt.bank_name),
                schemeId: attempt.scheme_id || null,
                schemeCode: attempt.scheme_code || null,
                roi: attempt.roi ?? null,
                tenureMonths: attempt.tenure_months ?? null,
                downPayment: attempt.down_payment ?? null,
                loanAmount: attempt.loan_amount ?? null,
                loanAddons: attempt.loan_addons ?? null,
                processingFee: attempt.processing_fee ?? null,
                chargesBreakup:
                    typeof attempt.charges_breakup === 'string'
                        ? JSON.parse(attempt.charges_breakup)
                        : (attempt.charges_breakup as unknown as any[]) || [],
                emi: attempt.emi ?? null,
                createdAt: attempt.created_at || null,
            }))
        );
        result.financeAttempts = resolvedAttempts;
    } else {
        result.financeAttempts = [];
    }

    return { success: true, data: result };
}

export async function updateQuoteManagerDiscount(
    quoteId: string,
    managerDiscount: number,
    note?: string
): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Get current quote
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('on_road_price, commercials')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    // Update with manager discount
    const { error } = await supabase
        .from('crm_quotes')
        .update({
            manager_discount: managerDiscount,
            manager_discount_note: note || null,
            reviewed_by: user?.id || null,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

    if (error) {
        console.error('updateQuoteManagerDiscount Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    // Log timeline event
    await logQuoteEvent(quoteId, `Manager Discount Updated: ₹${managerDiscount}`, 'Manager', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function markQuoteInReview(quoteId: string): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('status, quote_owner_id')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    if (quote.status !== 'DRAFT') {
        return { success: true };
    }

    const updatePayload: Record<string, any> = {
        status: 'IN_REVIEW',
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (!quote.quote_owner_id && user?.id) {
        updatePayload.quote_owner_id = user.id;
    }

    const { error } = await supabase.from('crm_quotes').update(updatePayload).eq('id', quoteId);

    if (error) {
        console.error('markQuoteInReview Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    await logQuoteEvent(quoteId, 'Quote Opened - In Review', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function setQuoteFinanceMode(
    quoteId: string,
    mode: 'CASH' | 'LOAN'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ finance_mode: mode, updated_at: new Date().toISOString() })
        .eq('id', quoteId);
    if (error) {
        console.error('setQuoteFinanceMode Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
    await logQuoteEvent(quoteId, `Finance Mode Set: ${mode}`, 'Team Member', 'team', { source: 'CRM' });
    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function getQuoteFinanceAttempts(quoteId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quote_finance_attempts')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getQuoteFinanceAttempts Error:', error);
        return [];
    }
    return data || [];
}

export async function createQuoteFinanceAttempt(
    quoteId: string,
    payload: {
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        ltv?: number | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[];
        emi?: number | null;
    }
) {
    const user = await getAuthUser();
    const supabase = await createClient();
    const { data: quote } = await supabase
        .from('crm_quotes')
        .select('tenant_id')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    const { data, error } = await supabase
        .from('crm_quote_finance_attempts')
        .insert({
            quote_id: quoteId,
            tenant_id: quote?.tenant_id || null,
            bank_id: payload.bankId || null,
            bank_name: payload.bankName || null,
            scheme_id: payload.schemeId || null,
            scheme_code: payload.schemeCode || null,
            ltv: payload.ltv || null,
            roi: payload.roi || null,
            tenure_months: payload.tenureMonths || null,
            down_payment: payload.downPayment || null,
            loan_amount: payload.loanAmount || null,
            loan_addons: payload.loanAddons || null,
            processing_fee: payload.processingFee || null,
            charges_breakup: JSON.stringify(payload.chargesBreakup || []),
            emi: payload.emi || null,
            status: 'IN_PROCESS',
            created_by: user?.id || null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('createQuoteFinanceAttempt Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    await supabase
        .from('crm_quotes')
        .update({ active_finance_id: data.id, finance_mode: 'LOAN', updated_at: new Date().toISOString() })
        .eq('id', quoteId);

    await logQuoteEvent(quoteId, 'New Finance Attempt Created', 'Team Member', 'team', { source: 'CRM' });
    revalidatePath('/app/[slug]/quotes');
    return { success: true, id: data.id };
}

export async function updateQuoteFinanceAttempt(
    attemptId: string,
    payload: {
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[];
        emi?: number | null;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quote_finance_attempts')
        .update({
            bank_id: payload.bankId ?? null,
            bank_name: payload.bankName ?? null,
            scheme_id: payload.schemeId ?? null,
            scheme_code: payload.schemeCode ?? null,
            roi: payload.roi ?? null,
            tenure_months: payload.tenureMonths ?? null,
            down_payment: payload.downPayment ?? null,
            loan_amount: payload.loanAmount ?? null,
            loan_addons: payload.loanAddons ?? null,
            processing_fee: payload.processingFee ?? null,
            charges_breakup: JSON.stringify(payload.chargesBreakup || []),
            emi: payload.emi ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .eq('is_deleted', false);

    if (error) {
        console.error('updateQuoteFinanceAttempt Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
}

export async function setQuoteActiveFinanceAttempt(quoteId: string, attemptId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ active_finance_id: attemptId, finance_mode: 'LOAN', updated_at: new Date().toISOString() })
        .eq('id', quoteId)
        .eq('is_deleted', false);

    if (error) {
        console.error('setQuoteActiveFinanceAttempt Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    await logQuoteEvent(quoteId, 'Primary Finance Attempt Updated', 'Team Member', 'team', { source: 'CRM' });
    return { success: true };
}

export async function updateQuoteFinanceStatus(
    attemptId: string,
    status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED'
) {
    const supabase = await createClient();
    const { data: attempt, error: fetchError } = await supabase
        .from('crm_quote_finance_attempts')
        .select('id, quote_id')
        .eq('id', attemptId)
        .eq('is_deleted', false)
        .single();
    if (fetchError || !attempt) {
        return { success: false, error: 'Attempt not found' };
    }

    const { error } = await supabase
        .from('crm_quote_finance_attempts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', attemptId);
    if (error) {
        console.error('updateQuoteFinanceStatus Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    await logQuoteEvent(attempt.quote_id as string, `Finance Status: ${status}`, 'Team Member', 'team', {
        source: 'CRM',
    });

    if (status === 'DOC_PENDING') {
        await createTask({
            tenantId: null,
            linkedType: 'QUOTE',
            linkedId: attempt.quote_id as string,
            title: 'Collect Finance Documents',
            description: 'Document collection required for finance processing.',
        });
    }

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function createTask(input: {
    tenantId: string | null;
    linkedType: 'LEAD' | 'QUOTE' | 'BOOKING';
    linkedId: string;
    title: string;
    description?: string | null;
    assigneeIds?: string[];
    primaryAssigneeId?: string | null;
}) {
    const user = await getAuthUser();
    const supabase = await createClient();
    const primaryAssigneeId = input.primaryAssigneeId || user?.id || null;
    const assigneeIds =
        input.assigneeIds && input.assigneeIds.length > 0
            ? input.assigneeIds
            : primaryAssigneeId
              ? [primaryAssigneeId]
              : [];

    const { error } = await supabase.from('crm_tasks').insert({
        tenant_id: input.tenantId || null,
        linked_type: input.linkedType,
        linked_id: input.linkedId,
        title: input.title,
        description: input.description || null,
        status: 'OPEN',
        primary_assignee_id: primaryAssigneeId,
        assignee_ids: assigneeIds,
        created_by: user?.id || null,
    });

    if (error) {
        console.error('createTask Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
    return { success: true };
}

export async function getTasksForEntity(linkedType: 'LEAD' | 'QUOTE' | 'BOOKING', linkedId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('linked_type', linkedType)
        .eq('linked_id', linkedId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getTasksForEntity Error:', error);
        return [];
    }
    return data || [];
}

export async function updateTaskStatus(taskId: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);
    if (error) {
        console.error('updateTaskStatus Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
    return { success: true };
}

// Auto-segregate stale leads: >15 days since last activity, unless future tasks exist
export async function autoJunkInactiveLeads(days = 15) {
    const supabase = await adminClient;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('is_deleted', false)
        .neq('status', 'JUNK');

    if (leadsError) {
        console.error('autoJunkInactiveLeads lead fetch error:', leadsError);
        return { success: false, error: leadsError.message };
    }

    const { data: tasks, error: tasksError } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('linked_type', 'LEAD')
        .in(
            'linked_id',
            (leads || []).map((l: any) => l.id)
        );

    if (tasksError) {
        console.error('autoJunkInactiveLeads task fetch error:', tasksError);
        return { success: false, error: tasksError.message };
    }

    const tasksByLead = new Map<string, any[]>();
    (tasks || []).forEach((t: any) => {
        const arr = tasksByLead.get(t.linked_id) || [];
        arr.push(t);
        tasksByLead.set(t.linked_id, arr);
    });

    const hasFutureTask = (task: any) => {
        const candidates = [task.due_at, task.due_date, task.scheduled_at, task.scheduled_for, task.reminder_at].filter(
            Boolean
        );
        if (candidates.length === 0) return false;
        return candidates.some((d: any) => new Date(d).getTime() > Date.now());
    };

    const staleLeadIds: string[] = [];
    (leads || []).forEach((lead: any) => {
        const lastActivity = lead.updated_at || lead.last_activity_at || lead.last_activity || lead.created_at;
        if (!lastActivity) return;
        if (new Date(lastActivity) >= cutoff) return;

        const leadTasks = tasksByLead.get(lead.id) || [];
        if (leadTasks.some(t => t.status !== 'DONE' && hasFutureTask(t))) return;

        staleLeadIds.push(lead.id);
    });

    if (staleLeadIds.length > 0) {
        const { error: updateError } = await supabase
            .from('crm_leads')
            .update({
                status: 'JUNK',
                updated_at: new Date().toISOString(),
                auto_segregated: true,
                segregation_reason: `No activity for ${days} days`,
            })
            .in('id', staleLeadIds);

        if (updateError) {
            console.error('autoJunkInactiveLeads update error:', updateError);
            return { success: false, error: updateError.message };
        }
    }

    return { success: true, junked: staleLeadIds.length };
}

export async function getTeamMembersForTenant(tenantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_team')
        .select('id, user_id, role, display_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE');

    if (error) {
        console.error('getTeamMembersForTenant Error:', error);
        return [];
    }

    const userIds = (data || []).map(m => m.user_id).filter(Boolean) as string[];
    let memberNameMap = new Map<string, string>();
    if (userIds.length > 0) {
        const { data: members } = await supabase.from('id_members').select('id, full_name').in('id', userIds);
        (members || []).forEach(m => {
            if (m.id && m.full_name) memberNameMap.set(m.id, m.full_name);
        });
    }

    // Deduplicate by user_id
    const seen = new Set<string>();
    return (data || [])
        .filter(m => {
            if (!m.user_id || seen.has(m.user_id)) return false;
            seen.add(m.user_id);
            return true;
        })
        .map(m => ({
            id: m.user_id,
            teamId: m.id,
            role: m.role,
            displayId: m.display_id,
            name: memberNameMap.get((m.user_id || '') as string) || m.display_id || m.role || 'Team Member',
        }));
}

export async function updateQuotePricing(
    quoteId: string,
    updates: {
        rtoType?: 'STATE' | 'BH' | 'COMPANY';
        rtoTotal?: number;
        rtoBreakdown?: { label: string; amount: number }[];
        rtoOptions?: any[];
        insuranceAddons?: any[]; // Allow full objects
        insuranceTotal?: number;
        insuranceOD?: number;
        insuranceTP?: number;
        insuranceGST?: number;
        accessories?: any[]; // Allow full objects
        accessoriesTotal?: number;
        services?: any[]; // Allow full objects
        servicesTotal?: number;
        grandTotal?: number; // On-road total
        managerDiscount?: number;
        managerDiscountNote?: string;
    }
): Promise<{ success: boolean; error?: string; newQuoteId?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Get current quote
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select(
            'id, status, commercials, lead_id, tenant_id, member_id, lead_referrer_id, quote_owner_id, variant_id, color_id, vehicle_sku_id, finance_mode, active_finance_id, discount_amount, manager_discount, manager_discount_note, created_by'
        )
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    const commercials = (quote.commercials as any) || {};
    const pricingSnapshot = commercials.pricing_snapshot || {};

    // Update pricing snapshot with new selections
    const updatedPricingSnapshot = {
        ...pricingSnapshot,
        rto_type: updates.rtoType || pricingSnapshot.rto_type,
        rto_total: updates.rtoTotal !== undefined ? updates.rtoTotal : pricingSnapshot.rto_total,
        rto_breakdown: updates.rtoBreakdown !== undefined ? updates.rtoBreakdown : pricingSnapshot.rto_breakdown,
        rto_options: updates.rtoOptions !== undefined ? updates.rtoOptions : pricingSnapshot.rto_options,
        insurance_addons: updates.insuranceAddons || pricingSnapshot.insurance_addons,
        insurance_addon_items: updates.insuranceAddons || pricingSnapshot.insurance_addon_items, // Dual save for compatibility
        insurance_total:
            updates.insuranceTotal !== undefined ? updates.insuranceTotal : pricingSnapshot.insurance_total,
        insurance_od: updates.insuranceOD !== undefined ? updates.insuranceOD : pricingSnapshot.insurance_od,
        insurance_tp: updates.insuranceTP !== undefined ? updates.insuranceTP : pricingSnapshot.insurance_tp,
        insurance_gst: updates.insuranceGST !== undefined ? updates.insuranceGST : pricingSnapshot.insurance_gst,
        accessories: updates.accessories || pricingSnapshot.accessories,
        accessory_items: updates.accessories || pricingSnapshot.accessory_items,
        accessories_total:
            updates.accessoriesTotal !== undefined ? updates.accessoriesTotal : pricingSnapshot.accessories_total,
        services: updates.services || pricingSnapshot.services,
        service_items: updates.services || pricingSnapshot.service_items,
        services_total: updates.servicesTotal !== undefined ? updates.servicesTotal : pricingSnapshot.services_total,
        grand_total: updates.grandTotal !== undefined ? updates.grandTotal : pricingSnapshot.grand_total,
    };

    const updatedCommercials = {
        ...commercials,
        grand_total: updates.grandTotal !== undefined ? updates.grandTotal : commercials.grand_total, // Update root commercial total too
        pricing_snapshot: updatedPricingSnapshot,
    };

    const normalizeItems = (items: any[] | null | undefined) => {
        if (!Array.isArray(items)) return [];
        return items
            .map(item => {
                if (item === null || item === undefined) return '';
                if (typeof item === 'string' || typeof item === 'number') return String(item);
                const id = item.id || item.sku_id || item.code || item.name || '';
                const amount = item.amount ?? item.price ?? item.discountPrice ?? '';
                return `${id}:${amount}`;
            })
            .filter(Boolean)
            .sort();
    };
    const normalizeRtoBreakdown = (items: any[] | null | undefined) => {
        if (!Array.isArray(items)) return [];
        return items
            .map(item => {
                if (!item) return '';
                const label = item.label || item.name || '';
                const amount = item.amount ?? item.price ?? 0;
                return `${label}:${Number(amount)}`;
            })
            .filter(Boolean)
            .sort();
    };
    const isEqualArray = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    const toNumber = (value: any) => Number(value ?? 0);

    const originalInsuranceItems = normalizeItems(
        pricingSnapshot.insurance_addon_items || pricingSnapshot.insurance_addons || []
    );
    const updatedInsuranceItems = normalizeItems(
        updatedPricingSnapshot.insurance_addon_items || updatedPricingSnapshot.insurance_addons || []
    );
    const originalAccessories = normalizeItems(pricingSnapshot.accessory_items || pricingSnapshot.accessories || []);
    const updatedAccessories = normalizeItems(
        updatedPricingSnapshot.accessory_items || updatedPricingSnapshot.accessories || []
    );
    const originalServices = normalizeItems(pricingSnapshot.service_items || pricingSnapshot.services || []);
    const updatedServices = normalizeItems(
        updatedPricingSnapshot.service_items || updatedPricingSnapshot.services || []
    );
    const originalRtoBreakdown = normalizeRtoBreakdown(pricingSnapshot.rto_breakdown || []);
    const updatedRtoBreakdown = normalizeRtoBreakdown(updatedPricingSnapshot.rto_breakdown || []);

    const rtoChanged = (pricingSnapshot.rto_type || '') !== (updatedPricingSnapshot.rto_type || '');
    const rtoTotalChanged = toNumber(pricingSnapshot.rto_total) !== toNumber(updatedPricingSnapshot.rto_total);
    const rtoBreakdownChanged = !isEqualArray(originalRtoBreakdown, updatedRtoBreakdown);
    const insuranceItemsChanged = !isEqualArray(originalInsuranceItems, updatedInsuranceItems);
    const accessoriesChanged = !isEqualArray(originalAccessories, updatedAccessories);
    const servicesChanged = !isEqualArray(originalServices, updatedServices);
    const insuranceTotalChanged =
        toNumber(pricingSnapshot.insurance_total) !== toNumber(updatedPricingSnapshot.insurance_total);
    const accessoriesTotalChanged =
        toNumber(pricingSnapshot.accessories_total) !== toNumber(updatedPricingSnapshot.accessories_total);
    const servicesTotalChanged =
        toNumber(pricingSnapshot.services_total) !== toNumber(updatedPricingSnapshot.services_total);
    const grandTotalChanged = toNumber(pricingSnapshot.grand_total) !== toNumber(updatedPricingSnapshot.grand_total);

    const nonManagerChanged =
        rtoChanged ||
        rtoTotalChanged ||
        rtoBreakdownChanged ||
        insuranceItemsChanged ||
        accessoriesChanged ||
        servicesChanged ||
        insuranceTotalChanged ||
        accessoriesTotalChanged ||
        servicesTotalChanged ||
        grandTotalChanged;
    const managerChanged = updates.managerDiscount !== undefined || updates.managerDiscountNote !== undefined;

    if (!nonManagerChanged) {
        if (!managerChanged) {
            return { success: true };
        }
        const updatePayload: any = {
            updated_at: new Date().toISOString(),
        };
        updatePayload.manager_discount = updates.managerDiscount ?? quote.manager_discount ?? 0;
        updatePayload.manager_discount_note =
            updates.managerDiscountNote !== undefined
                ? updates.managerDiscountNote
                : quote.manager_discount_note || null;
        updatePayload.reviewed_by = user?.id || null;
        updatePayload.reviewed_at = new Date().toISOString();
        // Sync on_road_price so sidebar cards stay in sync
        if (updates.grandTotal !== undefined) {
            updatePayload.on_road_price = Math.round(updates.grandTotal);
        }

        const { error } = await supabase.from('crm_quotes').update(updatePayload).eq('id', quoteId);
        if (error) {
            console.error('updateQuotePricing Error:', error);
            return { success: false, error: getErrorMessage(error) };
        }

        await logQuoteEvent(
            quoteId,
            `Manager Discount Adjusted to ₹${updatePayload.manager_discount}`,
            'Manager',
            'team',
            {
                source: 'CRM',
            }
        );

        revalidatePath('/app/[slug]/quotes');
        return { success: true };
    }

    const onRoadPrice = Math.round(toNumber(updatedPricingSnapshot.grand_total ?? updatedCommercials.grand_total));
    const exShowroom = Math.round(
        toNumber(updatedPricingSnapshot.ex_showroom ?? updatedCommercials.ex_showroom ?? updatedCommercials.base_price)
    );
    const rtoAmount = Math.round(
        toNumber(updatedPricingSnapshot.rto_total ?? updatedPricingSnapshot.rto?.total ?? updatedCommercials.rto)
    );
    const insuranceAmount = Math.round(
        toNumber(
            updatedPricingSnapshot.insurance_total ??
                updatedPricingSnapshot.insurance?.total ??
                updatedCommercials.insurance
        )
    );
    const accessoriesAmount = Math.round(toNumber(updatedPricingSnapshot.accessories_total));

    const vehicleSkuId = quote.vehicle_sku_id || quote.color_id || quote.variant_id || null;

    const { data: newQuote, error: insertError } = await supabase
        .from('crm_quotes')
        .insert({
            tenant_id: quote.tenant_id,
            lead_id: quote.lead_id,
            member_id: quote.member_id,
            lead_referrer_id: quote.lead_referrer_id,
            quote_owner_id: quote.quote_owner_id || user?.id || null,
            variant_id: quote.variant_id,
            color_id: quote.color_id,
            vehicle_sku_id: vehicleSkuId,
            commercials: updatedCommercials,
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: insuranceAmount,
            rto_amount: rtoAmount,
            accessories_amount: accessoriesAmount,
            discount_amount: quote.discount_amount ?? null,
            manager_discount: updates.managerDiscount ?? quote.manager_discount ?? null,
            manager_discount_note:
                updates.managerDiscountNote !== undefined
                    ? updates.managerDiscountNote
                    : quote.manager_discount_note || null,
            finance_mode: quote.finance_mode || null,
            active_finance_id: null,
            status: 'DRAFT',
            created_by: user?.id || quote.created_by || null,
        })
        .select()
        .single();

    if (insertError || !newQuote) {
        console.error('updateQuotePricing Insert Error:', insertError);
        return { success: false, error: insertError?.message || 'Failed to create new quote' };
    }

    // Supersede at VARIANT level — all open quotes for same variant get superseded
    // regardless of colour. Only quotes converted to booking are exempt.
    const skuId = newQuote.vehicle_sku_id || quote.vehicle_sku_id || quote.color_id || quote.variant_id;
    if (skuId) {
        const supersedeUpdate: any = {
            status: 'SUPERSEDED',
            updated_at: new Date().toISOString(),
        };

        let supersedeQuery = supabase.from('crm_quotes').update(supersedeUpdate).neq('id', newQuote.id);
        supersedeQuery = supersedeQuery.eq('vehicle_sku_id', skuId);
        supersedeQuery = supersedeQuery.not('status', 'in', '("CONVERTED","BOOKING")');
        if (quote.lead_id) {
            supersedeQuery = supersedeQuery.eq('lead_id', quote.lead_id);
        } else if (quote.member_id) {
            supersedeQuery = supersedeQuery.eq('member_id', quote.member_id);
        } else {
            supersedeQuery = supersedeQuery.eq('id', quoteId);
        }
        await supersedeQuery;
    }

    await logQuoteEvent(newQuote.id, 'Quote Revised (New Quote)', 'Team Member', 'team', {
        source: 'CRM',
        voided_quote_id: quoteId,
    });

    revalidatePath('/app/[slug]/quotes');
    return { success: true, newQuoteId: newQuote.id };
}

export async function sendQuoteToCustomer(quoteId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('crm_quotes')
        .update({
            status: 'SENT',
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

    if (error) {
        console.error('sendQuoteToCustomer Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    // Log timeline event
    await logQuoteEvent(quoteId, 'Quote Sent to Customer', 'Team Member', 'team', { source: 'CRM' });

    // Send WhatsApp template (fire-and-forget, don't block the response)
    (async () => {
        try {
            const { sendQuoteDossierWhatsApp } = await import('@/lib/sms/msg91-whatsapp');

            // Fetch quote with customer and pricing data
            const { data: quoteData } = await supabase
                .from('crm_quotes')
                .select(
                    `
                    *, display_id, on_road_price, ex_showroom_price, rto_amount, insurance_amount, accessories_amount,
                    manager_discount, commercials,
                    customer:customer_id(full_name, primary_phone, whatsapp),
                    lead:lead_id(customer_name, customer_phone)
                `
                )
                .eq('id', quoteId)
                .single();

            if (!quoteData) return;

            const q = quoteData as any;
            const commercials = q.commercials || {};
            const pricingSnapshot = commercials.pricing_snapshot || {};
            const phone = q.customer?.primary_phone || q.customer?.whatsapp || q.lead?.customer_phone;
            if (!phone) return;

            const fmt = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
            const displayId = q.display_id ? formatDisplayId(q.display_id) : quoteId.slice(0, 8);
            const exShowroom = q.ex_showroom_price || commercials.base_price || 0;
            const rto = q.rto_amount || pricingSnapshot.rto_total || 0;
            const insurance = q.insurance_amount || pricingSnapshot.insurance_total || 0;
            const accessories = q.accessories_amount || pricingSnapshot.accessories_total || 0;
            const services = pricingSnapshot.services_total || 0;
            const platformDiscount =
                Math.abs(Number(pricingSnapshot.platform_discount || 0)) +
                Math.abs(Number(pricingSnapshot.dealer_discount || 0));
            const managerDiscount = q.manager_discount || 0;
            const totalDiscount = platformDiscount + managerDiscount;
            const onRoad = q.on_road_price || commercials.grand_total || 0;
            const dossierUrl = `https://bookmy.bike/q/${displayId}`;

            await sendQuoteDossierWhatsApp({
                phone,
                brand: commercials.brand || '',
                model: commercials.model || '',
                variant: commercials.variant || '',
                color: commercials.color_name || commercials.color || '',
                quoteId: displayId,
                exShowroom: fmt(exShowroom),
                rto: fmt(rto),
                insurance: fmt(insurance),
                accessories: fmt(accessories),
                services: fmt(services),
                warranty: fmt(0),
                oCircleDiscount: totalDiscount > 0 ? `-${fmt(totalDiscount)}` : fmt(0),
                onRoadPrice: fmt(onRoad),
                youSave: totalDiscount > 0 ? fmt(totalDiscount) : fmt(0),
                oCircleCoins: Math.round(onRoad / 10).toLocaleString('en-IN'),
                dossierUrl,
            });

            await logQuoteEvent(quoteId, 'Quote WhatsApp Sent', 'System', 'team', {
                source: 'MSG91_WHATSAPP',
                phone,
                template: 'bike_quote_summary',
            });
        } catch (err) {
            console.error('[WhatsApp] sendQuoteToCustomer WhatsApp failed:', err);
        }
    })();

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

/**
 * Share a quote via SMS (explicit user action).
 * Sends the dossier link via MSG91 SMS Flow API.
 */
export async function shareQuoteViaSms(quoteId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
        const { data: quoteData } = await supabase
            .from('crm_quotes')
            .select(
                `
                *, display_id, commercials,
                customer:customer_id(full_name, primary_phone, whatsapp),
                lead:lead_id(customer_name, customer_phone)
            `
            )
            .eq('id', quoteId)
            .single();

        if (!quoteData) return { success: false, error: 'Quote not found' };

        const q = quoteData as any;
        const phone = q.customer?.primary_phone || q.customer?.whatsapp || q.lead?.customer_phone;
        const name = q.customer?.full_name || q.lead?.customer_name || 'Customer';

        if (!phone) return { success: false, error: 'No recipient phone number' };

        const displayId = q.display_id ? formatDisplayId(q.display_id) : quoteId.slice(0, 8);
        const dossierUrl = `https://www.bookmy.bike/?q=${q.display_id || displayId}`;

        const result = await sendStoreVisitSms({ phone, name, storeUrl: dossierUrl });

        if (result.success) {
            await logQuoteEvent(quoteId, 'Quote SMS Sent', 'Team Member', 'team', {
                source: 'MSG91_SMS',
                phone,
            });
            // Update status to SENT if still DRAFT
            await supabase
                .from('crm_quotes')
                .update({ status: 'SENT', updated_at: new Date().toISOString() })
                .eq('id', quoteId)
                .in('status', ['DRAFT']);

            revalidatePath('/app/[slug]/quotes');
            return { success: true };
        }

        return { success: false, error: result.message || 'SMS send failed' };
    } catch (err) {
        console.error('[SMS] shareQuoteViaSms failed:', err);
        return { success: false, error: err instanceof Error ? err.message : 'SMS send failed' };
    }
}

/**
 * Share a quote via WhatsApp (explicit user action).
 * Sends the bike_quote_summary template via MSG91 WhatsApp API.
 */
export async function shareQuoteViaWhatsApp(quoteId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
        const { sendQuoteDossierWhatsApp } = await import('@/lib/sms/msg91-whatsapp');

        const { data: quoteData } = await supabase
            .from('crm_quotes')
            .select(
                `
                *, display_id, on_road_price, ex_showroom_price, rto_amount, insurance_amount, accessories_amount,
                manager_discount, commercials,
                customer:customer_id(full_name, primary_phone, whatsapp),
                lead:lead_id(customer_name, customer_phone)
            `
            )
            .eq('id', quoteId)
            .single();

        if (!quoteData) return { success: false, error: 'Quote not found' };

        const q = quoteData as any;
        const commercials = q.commercials || {};
        const pricingSnapshot = commercials.pricing_snapshot || {};
        const phone = q.customer?.primary_phone || q.customer?.whatsapp || q.lead?.customer_phone;

        if (!phone) return { success: false, error: 'No recipient phone number' };

        const fmt = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
        const displayId = q.display_id ? formatDisplayId(q.display_id) : quoteId.slice(0, 8);
        const exShowroom = q.ex_showroom_price || commercials.base_price || 0;
        const rto = q.rto_amount || pricingSnapshot.rto_total || 0;
        const insurance = q.insurance_amount || pricingSnapshot.insurance_total || 0;
        const accessories = q.accessories_amount || pricingSnapshot.accessories_total || 0;
        const services = pricingSnapshot.services_total || 0;
        const platformDiscount =
            Math.abs(Number(pricingSnapshot.platform_discount || 0)) +
            Math.abs(Number(pricingSnapshot.dealer_discount || 0));
        const managerDiscount = q.manager_discount || 0;
        const totalDiscount = platformDiscount + managerDiscount;
        const onRoad = q.on_road_price || commercials.grand_total || 0;
        const dossierUrl = `https://bookmy.bike/q/${displayId}`;

        const result = await sendQuoteDossierWhatsApp({
            phone,
            brand: commercials.brand || '',
            model: commercials.model || '',
            variant: commercials.variant || '',
            color: commercials.color_name || commercials.color || '',
            quoteId: displayId,
            exShowroom: fmt(exShowroom),
            rto: fmt(rto),
            insurance: fmt(insurance),
            accessories: fmt(accessories),
            services: fmt(services),
            warranty: fmt(0),
            oCircleDiscount: totalDiscount > 0 ? `-${fmt(totalDiscount)}` : fmt(0),
            onRoadPrice: fmt(onRoad),
            youSave: totalDiscount > 0 ? fmt(totalDiscount) : fmt(0),
            oCircleCoins: Math.round(onRoad / 10).toLocaleString('en-IN'),
            dossierUrl,
        });

        if (result.success) {
            await logQuoteEvent(quoteId, 'Quote WhatsApp Sent', 'Team Member', 'team', {
                source: 'MSG91_WHATSAPP',
                template: 'bike_quote_summary',
                phone,
            });
            // Update status to SENT if still DRAFT
            await supabase
                .from('crm_quotes')
                .update({ status: 'SENT', updated_at: new Date().toISOString() })
                .eq('id', quoteId)
                .in('status', ['DRAFT']);

            revalidatePath('/app/[slug]/quotes');
            return { success: true };
        }

        return { success: false, error: result.message || 'WhatsApp send failed' };
    } catch (err) {
        console.error('[WhatsApp] shareQuoteViaWhatsApp failed:', err);
        return { success: false, error: err instanceof Error ? err.message : 'WhatsApp send failed' };
    }
}

export async function getQuoteMarketplaceUrl(
    quoteId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = await createClient();

    // Fetch quote with vehicle details
    const { data: quoteData, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (error || !quoteData) {
        return { success: false, error: 'Quote not found' };
    }

    // Cast to any since studio_id is a new column
    const quote = quoteData as any;

    // Get variant details for URL
    const skuId = quote.color_id || quote.variant_id;
    if (!skuId) {
        return { success: false, error: 'No SKU ID found' };
    }

    const { data: sku, error: skuError } = await (supabase as any)
        .from('cat_skus')
        .select(
            `
            id,
            model:cat_models!model_id(slug, brand:cat_brands!brand_id(slug)),
            vehicle_variant:cat_variants_vehicle!vehicle_variant_id(slug),
            accessory_variant:cat_variants_accessory!accessory_variant_id(slug),
            service_variant:cat_variants_service!service_variant_id(slug)
        `
        )
        .eq('id', skuId)
        .maybeSingle();

    if (skuError || !sku) {
        return { success: false, error: 'SKU not found' };
    }

    const brandSlug = sku.model?.brand?.slug;
    const modelSlug = sku.model?.slug;
    const variantSlug = sku.vehicle_variant?.slug || sku.accessory_variant?.slug || sku.service_variant?.slug;
    if (!brandSlug || !modelSlug || !variantSlug) {
        return { success: false, error: 'Variant not found' };
    }

    const commercials = quote.commercials || {};
    const colorSlug = commercials.color_name?.toLowerCase().replace(/\s+/g, '-') || '';

    // Build URL with studioId (required)
    const params = new URLSearchParams({
        quoteId,
        color: colorSlug,
        studioId: quote.studio_id || '',
    });

    const url = `/store/${brandSlug}/${modelSlug}/${variantSlug}?${params.toString()}`;
    return { success: true, url };
}

export async function getQuoteByDisplayId(
    displayId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    // We use adminClient to allow public dossier access via valid displayId without login barriers
    const supabase = adminClient;
    const rawDisplayId = String(displayId || '').trim();
    const normalizedDisplayId = rawDisplayId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const dashedDisplayId =
        normalizedDisplayId.length >= 6 ? (normalizedDisplayId.match(/.{1,3}/g)?.join('-') ?? normalizedDisplayId) : '';
    const displayIdCandidates = Array.from(
        new Set([rawDisplayId, rawDisplayId.toUpperCase(), normalizedDisplayId, dashedDisplayId].filter(Boolean))
    );

    if (displayIdCandidates.length === 0) {
        return { success: false, error: 'Quote not found' };
    }

    const { data: quotes, error } = await supabase
        .from('crm_quotes')
        .select(
            `
            *,
            customer:id_members!crm_quotes_member_id_fkey (*),
            lead:crm_leads!quotes_lead_id_fkey (*)
        `
        )
        .in('display_id', displayIdCandidates)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('getQuoteByDisplayId Error:', error);
        return { success: false, error: JSON.stringify(error) };
    }

    const quote = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] : null;
    if (!quote) {
        return { success: false, error: 'Quote not found' };
    }

    // Map to a unified format for the dossier
    const commercials: any = (quote.commercials as any) || {};
    const pricingSnapshot: any = commercials.pricing_snapshot || {};

    // Fetch high-fidelity pricing from canonical state pricing table
    let highFidelityPricing = null;
    const selectedVehicleSkuId =
        quote.vehicle_sku_id || quote.color_id || quote.variant_id || pricingSnapshot?.color_id;
    const colorId = selectedVehicleSkuId;
    const stateCode =
        pricingSnapshot?.location?.state_code ||
        pricingSnapshot?.location?.stateCode ||
        commercials?.location?.state_code ||
        commercials?.location?.stateCode;

    if (colorId && stateCode) {
        const { data: priceRow } = await supabase
            .from('cat_price_state_mh')
            .select(
                `
                gst_rate, hsn_code, ins_gst_rate,
                rto_registration_fee_state, rto_smartcard_charges_state, rto_postal_charges_state, rto_roadtax_amount_state, rto_roadtax_cess_amount_state, rto_total_state,
                rto_registration_fee_bh, rto_smartcard_charges_bh, rto_postal_charges_bh, rto_roadtax_amount_bh, rto_roadtax_cess_amount_bh, rto_total_bh,
                rto_registration_fee_company, rto_smartcard_charges_company, rto_postal_charges_company, rto_roadtax_amount_company, rto_roadtax_cess_amount_company, rto_total_company,
                ins_own_damage_total_amount, ins_liability_only_total_amount
                `
            )
            .eq('sku_id', colorId)
            .eq('state_code', stateCode)
            .maybeSingle();
        if (priceRow) {
            highFidelityPricing = {
                gst_rate: Number((priceRow as any).gst_rate || 0),
                hsn_code: (priceRow as any).hsn_code,
                rto: {
                    STATE: {
                        registrationFee: Number((priceRow as any).rto_registration_fee_state || 0),
                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_state || 0),
                        postalCharges: Number((priceRow as any).rto_postal_charges_state || 0),
                        roadTax: Number((priceRow as any).rto_roadtax_amount_state || 0),
                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_state || 0),
                        total: Number((priceRow as any).rto_total_state || 0),
                    },
                    BH: {
                        registrationFee: Number((priceRow as any).rto_registration_fee_bh || 0),
                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_bh || 0),
                        postalCharges: Number((priceRow as any).rto_postal_charges_bh || 0),
                        roadTax: Number((priceRow as any).rto_roadtax_amount_bh || 0),
                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_bh || 0),
                        total: Number((priceRow as any).rto_total_bh || 0),
                    },
                    COMPANY: {
                        registrationFee: Number((priceRow as any).rto_registration_fee_company || 0),
                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_company || 0),
                        postalCharges: Number((priceRow as any).rto_postal_charges_company || 0),
                        roadTax: Number((priceRow as any).rto_roadtax_amount_company || 0),
                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_company || 0),
                        total: Number((priceRow as any).rto_total_company || 0),
                    },
                },
                insurance: {
                    gst_rate: Number((priceRow as any).ins_gst_rate || 18),
                    od: { total: Number((priceRow as any).ins_own_damage_total_amount || 0) },
                    tp: { total: Number((priceRow as any).ins_liability_only_total_amount || 0) },
                },
            };
        }
    }

    // Resolve finance if active
    let activeFinance = null;
    if (quote.active_finance_id) {
        const { data: finance } = await supabase
            .from('crm_quote_finance_attempts')
            .select('*')
            .eq('id', quote.active_finance_id)
            .eq('is_deleted', false)
            .maybeSingle();
        activeFinance = finance;
    }

    // Resolve SKU image and specs if not in commercials
    let resolvedImageUrl =
        commercials.image_url ||
        commercials.image ||
        commercials.imageUrl ||
        commercials.pricing_snapshot?.imageUrl ||
        commercials.pricing_snapshot?.image_url ||
        null;
    if (typeof resolvedImageUrl === 'string') {
        const normalized = resolvedImageUrl.trim().toLowerCase();
        if (!normalized || normalized === 'null' || normalized === 'undefined') {
            resolvedImageUrl = null;
        }
    }
    let vehicleSpecs = commercials.specs || commercials.pricing_snapshot?.specs || {};

    const resolveHex = (val: any) => {
        if (!val) return null;
        // If it's a simple string
        if (typeof val === 'string') return val.startsWith('#') ? val : `#${val}`;
        // If it's a Sitecore/AUMS object { value: "#..." }
        if (val?.value && typeof val.value === 'string') return val.value.startsWith('#') ? val.value : `#${val.value}`;
        return null;
    };

    let itemHex =
        resolveHex(commercials.color_hex) ||
        resolveHex(commercials.colorHex) ||
        resolveHex(commercials.hex_code) ||
        resolveHex(commercials.hex_primary) ||
        resolveHex(pricingSnapshot?.color_hex) ||
        resolveHex(pricingSnapshot?.colorHex) ||
        resolveHex(pricingSnapshot?.hex_code) ||
        resolveHex(pricingSnapshot?.hex_primary) ||
        resolveHex(vehicleSpecs?.color_hex) ||
        resolveHex(vehicleSpecs?.colorHex) ||
        resolveHex(vehicleSpecs?.hex_primary) ||
        resolveHex(vehicleSpecs?.hex_code) ||
        resolveHex(vehicleSpecs?.ColorHexCode) ||
        resolveHex(vehicleSpecs?.fields?.ColorHexCode) ||
        null;

    const normalizeSuitabilityTag = (value: string) =>
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const COLOR_WORDS = new Set([
        'black',
        'white',
        'silver',
        'grey',
        'gray',
        'red',
        'blue',
        'green',
        'yellow',
        'orange',
        'gold',
        'brown',
        'maroon',
        'navy',
        'beige',
        'cream',
        'copper',
        'bronze',
        'teal',
        'purple',
        'pink',
    ]);

    const COLOR_MODIFIERS = new Set([
        'matte',
        'gloss',
        'glossy',
        'metallic',
        'pearl',
        'satin',
        'chrome',
        'carbon',
        'gunmetal',
        'midnight',
    ]);

    const extractColorFromName = (name: string) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return { baseName: name, color: '' };

        const parts = trimmed.split(/\s+/);
        if (parts.length === 0) return { baseName: name, color: '' };

        const last = parts[parts.length - 1];
        const lastNorm = normalizeSuitabilityTag(last);
        const second = parts.length > 1 ? parts[parts.length - 2] : '';
        const secondNorm = normalizeSuitabilityTag(second);

        if (COLOR_WORDS.has(lastNorm)) {
            if (second && COLOR_MODIFIERS.has(secondNorm)) {
                return {
                    baseName: parts.slice(0, -2).join(' ').trim(),
                    color: `${second} ${last}`,
                };
            }
            return {
                baseName: parts.slice(0, -1).join(' ').trim(),
                color: last,
            };
        }

        return { baseName: name, color: '' };
    };

    const stripColorFromName = (name: string, color: string) => {
        if (!name || !color) return name;
        const colorNorm = normalizeSuitabilityTag(color);
        if (!colorNorm) return name;

        const suffixPattern = new RegExp(`\\s*${escapeRegExp(color)}\\s*$`, 'i');
        if (suffixPattern.test(name)) {
            return name.replace(suffixPattern, '').trim();
        }

        return name;
    };

    const resolveProductIdentity = async (skuId?: string | null) => {
        const resolved = {
            brand: '',
            model: '',
            variant: '',
            brandId: '',
            modelId: '',
            variantId: '',
        };
        if (!skuId) return resolved;

        // Try as SKU first
        const { data: sku } = await (supabase as any)
            .from('cat_skus')
            .select('id, name, vehicle_variant_id')
            .eq('id', skuId)
            .maybeSingle();

        if (sku?.vehicle_variant_id) {
            const { data: variant } = await (supabase as any)
                .from('cat_variants_vehicle')
                .select('id, name, model_id')
                .eq('id', sku.vehicle_variant_id)
                .maybeSingle();
            if (variant?.name) resolved.variant = variant.name;
            if (variant?.id) resolved.variantId = variant.id;

            if (variant?.model_id) {
                const { data: model } = await (supabase as any)
                    .from('cat_models')
                    .select('id, name, brand_id')
                    .eq('id', variant.model_id)
                    .maybeSingle();
                if (model?.name) resolved.model = model.name;
                if (model?.id) resolved.modelId = model.id;
                if (model?.brand_id) {
                    const { data: brand } = await supabase
                        .from('cat_brands')
                        .select('id, name')
                        .eq('id', model.brand_id)
                        .maybeSingle();
                    if (brand?.name) resolved.brand = brand.name;
                    if (brand?.id) resolved.brandId = brand.id;
                }
            }
            return resolved;
        }

        // Try as variant
        const { data: variant } = await (supabase as any)
            .from('cat_variants_vehicle')
            .select('id, name, model_id')
            .eq('id', skuId)
            .maybeSingle();
        if (variant?.name) {
            resolved.variant = variant.name;
            resolved.variantId = variant.id || '';
            if (variant.model_id) {
                const { data: model } = await (supabase as any)
                    .from('cat_models')
                    .select('id, name, brand_id')
                    .eq('id', variant.model_id)
                    .maybeSingle();
                if (model?.name) resolved.model = model.name;
                if (model?.id) resolved.modelId = model.id;
                if (model?.brand_id) {
                    const { data: brand } = await supabase
                        .from('cat_brands')
                        .select('id, name')
                        .eq('id', model.brand_id)
                        .maybeSingle();
                    if (brand?.name) resolved.brand = brand.name;
                    if (brand?.id) resolved.brandId = brand.id;
                }
            }
        }

        return resolved;
    };

    const parseRtoData = (val: any): { total: number; breakdown: any[] } | null => {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number') return { total: val, breakdown: [] };
        if (typeof val === 'object' && 'total' in val) {
            const b = [
                { label: 'Road Tax', amount: val.roadTax },
                { label: 'Reg. Charges', amount: val.registrationCharges },
                { label: 'Smart Card', amount: val.smartCardCharges },
                { label: 'Hypothecation', amount: val.hypothecationCharges },
                { label: 'Postal Charges', amount: val.postalCharges },
                { label: 'Cess', amount: val.cessAmount },
            ].filter(x => x.amount > 0);
            return { total: val.total, breakdown: b };
        }
        return null;
    };

    const toDefinedObject = (obj: Record<string, any>) => {
        const out: Record<string, any> = {};
        Object.entries(obj || {}).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            if (typeof value === 'string' && value.trim() === '') return;
            if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return;
            out[key] = value;
        });
        return out;
    };

    const buildVariantSpecs = (variantItem: any) => {
        const engine = toDefinedObject({
            displacement: variantItem.displacement,
            power: variantItem.max_power,
            torque: variantItem.max_torque,
            type: variantItem.engine_type,
        });
        const performance = toDefinedObject({
            mileage: variantItem.mileage,
            rangeKm: variantItem.range_km,
            rideModes: variantItem.ride_modes,
        });
        const transmission = toDefinedObject({
            type: variantItem.transmission,
            startType: variantItem.start_type,
        });
        const dimensions = toDefinedObject({
            weight: variantItem.kerb_weight,
            seatHeight: variantItem.seat_height,
            groundClearance: variantItem.ground_clearance,
            wheelbase: variantItem.wheelbase,
            fuelCapacity: variantItem.fuel_capacity,
        });
        const brakes = toDefinedObject({
            front: variantItem.front_brake,
            rear: variantItem.rear_brake,
            abs: variantItem.braking_system,
        });
        const chassis = toDefinedObject({
            suspensionFront: variantItem.front_suspension,
            suspensionRear: variantItem.rear_suspension,
        });

        return toDefinedObject({
            displacement: variantItem.displacement,
            engine_cc: variantItem.displacement,
            max_power: variantItem.max_power,
            max_torque: variantItem.max_torque,
            transmission_type: variantItem.transmission,
            gearbox: variantItem.transmission,
            mileage: variantItem.mileage,
            fuel_capacity: variantItem.fuel_capacity,
            front_brake: variantItem.front_brake,
            front_brake_type: variantItem.front_brake,
            rear_brake: variantItem.rear_brake,
            rear_brake_type: variantItem.rear_brake,
            braking_system: variantItem.braking_system,
            tyre_type: variantItem.tyre_type,
            kerb_weight: variantItem.kerb_weight,
            seat_height: variantItem.seat_height,
            wheelbase: variantItem.wheelbase,
            ground_clearance: variantItem.ground_clearance,
            front_suspension: variantItem.front_suspension,
            rear_suspension: variantItem.rear_suspension,
            front_tyre: variantItem.front_tyre,
            rear_tyre: variantItem.rear_tyre,
            start_type: variantItem.start_type,
            engine_type: variantItem.engine_type,
            motor_power: variantItem.motor_power,
            battery_type: variantItem.battery_type,
            battery_capacity: variantItem.battery_capacity,
            charging_time: variantItem.charging_time,
            range_km: variantItem.range_km,
            ride_modes: variantItem.ride_modes,
            air_filter: variantItem.air_filter,
            num_valves: variantItem.num_valves,
            console_type: variantItem.console_type,
            bluetooth: variantItem.bluetooth,
            navigation: variantItem.navigation,
            usb_charging: variantItem.usb_charging,
            led_headlamp: variantItem.led_headlamp,
            led_tail_lamp: variantItem.led_tail_lamp,
            engine,
            performance,
            transmission,
            dimensions,
            brakes,
            chassis,
        });
    };

    const buildModelSpecs = (modelItem: any) =>
        toDefinedObject({
            engine_cc: modelItem.engine_cc,
            fuel_type: modelItem.fuel_type,
            body_type: modelItem.body_type,
            emission_standard: modelItem.emission_standard,
            hsn_code: modelItem.hsn_code,
            item_tax_rate: modelItem.item_tax_rate,
        });

    const itemId = selectedVehicleSkuId as string | null;
    if ((!resolvedImageUrl || Object.keys(vehicleSpecs).length === 0 || !itemHex) && itemId) {
        let variantIdForLookup: string | null = null;
        let modelIdForLookup: string | null = null;
        let skuSpecs: any = {};

        const { data: skuItem } = await (supabase as any)
            .from('cat_skus')
            .select(
                'id, model_id, vehicle_variant_id, primary_image, gallery_img_1, gallery_img_2, gallery_img_3, gallery_img_4, gallery_img_5, gallery_img_6, video_url_1, video_url_2, hex_primary, color_name, finish'
            )
            .eq('id', itemId)
            .maybeSingle();

        if (skuItem) {
            variantIdForLookup = skuItem.vehicle_variant_id || null;
            modelIdForLookup = skuItem.model_id || null;

            const gallery = [
                skuItem.primary_image,
                skuItem.gallery_img_1,
                skuItem.gallery_img_2,
                skuItem.gallery_img_3,
                skuItem.gallery_img_4,
                skuItem.gallery_img_5,
                skuItem.gallery_img_6,
            ].filter(Boolean);

            if (!resolvedImageUrl && gallery.length > 0) {
                resolvedImageUrl = gallery[0];
            }

            skuSpecs = toDefinedObject({
                hex_primary: skuItem.hex_primary,
                color_name: skuItem.color_name,
                finish: skuItem.finish,
                primary_image: skuItem.primary_image,
                gallery: gallery,
                video_urls: [skuItem.video_url_1, skuItem.video_url_2].filter(Boolean),
            });

            if (!itemHex) {
                itemHex = resolveHex(skuItem.hex_primary) || null;
            }
        } else {
            // Fallback: treat item id as vehicle variant id
            variantIdForLookup = itemId;
        }

        let modelSpecs: any = {};
        let variantSpecs: any = {};
        if (variantIdForLookup) {
            const { data: variantItem } = await (supabase as any)
                .from('cat_variants_vehicle')
                .select(
                    'id, model_id, displacement, max_power, max_torque, transmission, mileage, fuel_capacity, front_brake, rear_brake, braking_system, tyre_type, kerb_weight, seat_height, wheelbase, ground_clearance, front_suspension, rear_suspension, front_tyre, rear_tyre, start_type, engine_type, motor_power, battery_type, battery_capacity, charging_time, range_km, ride_modes, air_filter, num_valves, console_type, bluetooth, navigation, usb_charging, led_headlamp, led_tail_lamp'
                )
                .eq('id', variantIdForLookup)
                .maybeSingle();

            if (variantItem) {
                variantSpecs = buildVariantSpecs(variantItem);
                if (!modelIdForLookup) modelIdForLookup = variantItem.model_id || null;
            }
        }

        if (modelIdForLookup) {
            const { data: modelItem } = await (supabase as any)
                .from('cat_models')
                .select('id, brand_id, engine_cc, fuel_type, body_type, emission_standard, hsn_code, item_tax_rate')
                .eq('id', modelIdForLookup)
                .maybeSingle();
            if (modelItem) {
                modelSpecs = buildModelSpecs(modelItem);
            }
        }

        vehicleSpecs = {
            ...vehicleSpecs,
            ...modelSpecs,
            ...variantSpecs,
            ...skuSpecs,
        };

        if (!itemHex) {
            const s = vehicleSpecs as any;
            itemHex =
                resolveHex(s?.color_hex) ||
                resolveHex(s?.colorHex) ||
                resolveHex(s?.hex_primary) ||
                resolveHex(s?.hex_code) ||
                resolveHex(s?.hexCode) ||
                resolveHex(s?.ColorHexCode) ||
                resolveHex(s?.fields?.ColorHexCode);
        }
    }

    const hexCode = itemHex || null;

    const selectedSkuId = selectedVehicleSkuId || null;
    const identity = await resolveProductIdentity(selectedSkuId);
    const productMake = commercials.brand || identity.brand || '';
    const productModel = commercials.model || identity.model || '';
    const productVariant = commercials.variant || identity.variant || '';
    const productBrandId = identity.brandId || '';
    const productModelId = identity.modelId || '';
    const productVariantId = identity.variantId || '';

    const dealerId =
        pricingSnapshot?.dealer?.id || pricingSnapshot?.dealer_id || commercials?.dealer_id || quote.studio_id || null;

    // Fetch dealership location for dossier display
    let dealerLocationData: { district: string; state: string; name: string } | null = null;
    const tenantIdForLocation = quote.tenant_id || dealerId;
    if (tenantIdForLocation) {
        const { data: tenantRow } = await supabase
            .from('id_tenants')
            .select('name, location, pincode')
            .eq('id', tenantIdForLocation)
            .maybeSingle();
        if (tenantRow) {
            dealerLocationData = {
                district: (tenantRow as any).location || '',
                state: stateCode === 'MH' ? 'Maharashtra' : stateCode || '',
                name: (tenantRow as any).name || '',
            };
        }
    }

    // PDP Options: Accessories + Services
    const { data: accessorySkus } = await (supabase as any)
        .from('cat_skus')
        .select(
            `
            id, name, price_base, primary_image, color_name, finish, status, sku_type,
            brand:cat_brands!brand_id(name),
            model:cat_models!model_id(id, name),
            accessory_variant:cat_variants_accessory!accessory_variant_id(id, name, slug, status)
            `
        )
        .eq('sku_type', 'ACCESSORY')
        .eq('status', 'ACTIVE');

    const accessorySkuIds = (accessorySkus || []).map((a: any) => a.id).filter(Boolean);
    const accessoryVariantIds = (accessorySkus || []).map((a: any) => a.accessory_variant?.id).filter(Boolean);

    const { data: compatRows } =
        accessoryVariantIds.length > 0
            ? await (supabase as any)
                  .from('cat_accessory_suitable_for')
                  .select('variant_id, is_universal, target_brand_id, target_model_id, target_variant_id')
                  .in('variant_id', accessoryVariantIds)
            : ({ data: [] } as any);

    // Build variant→compat map, then fan out to SKU-level
    const variantCompatMap = new Map<string, any[]>();
    (compatRows || []).forEach((row: any) => {
        if (!variantCompatMap.has(row.variant_id)) variantCompatMap.set(row.variant_id, []);
        variantCompatMap.get(row.variant_id)!.push(row);
    });

    const suitableForMap = new Map<string, any[]>();
    (accessorySkus || []).forEach((a: any) => {
        const variantId = a.accessory_variant?.id;
        if (variantId && variantCompatMap.has(variantId)) {
            suitableForMap.set(a.id, variantCompatMap.get(variantId)!);
        }
    });

    const accessoriesData = (accessorySkus || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        price_base: a.price_base,
        image_url: a.primary_image,
        category: 'ACCESSORY',
        brand: a.brand,
        inclusion_type: 'OPTIONAL',
        specs: {
            suitable_for: '',
            color: a.color_name || '',
            finish: a.finish || '',
            max_qty: 1,
        },
        __compat: suitableForMap.get(a.id) || [],
        __variant_name: a.accessory_variant?.name || '',
        __product_name: a.model?.name || '',
    }));

    const { data: servicesData } = await supabase.from('cat_services').select('*').eq('status', 'ACTIVE');

    const accessoryIds = (accessoriesData || []).map((a: any) => a.id);
    const accessoryRules: Map<string, { offer: number; inclusion: string; isActive: boolean }> = new Map();
    const bundleIdsForDealer: Set<string> = new Set();

    if (accessoryIds.length > 0 && dealerId && stateCode) {
        const { data: rules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
            .in('vehicle_color_id', accessoryIds)
            .eq('tenant_id', dealerId)
            .eq('state_code', stateCode);

        rules?.forEach((r: any) => {
            accessoryRules.set(r.vehicle_color_id, {
                offer: Number(r.offer_amount),
                inclusion: r.inclusion_type,
                isActive: r.is_active,
            });
        });

        const { data: bundleRules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id')
            .eq('tenant_id', dealerId)
            .eq('state_code', stateCode)
            .eq('inclusion_type', 'BUNDLE');

        bundleRules?.forEach((r: any) => {
            if (r.vehicle_color_id) bundleIdsForDealer.add(r.vehicle_color_id);
        });
    }

    const pdpAccessories = (accessoriesData || [])
        .filter((a: any) => {
            const compatRows = Array.isArray(a.__compat) ? a.__compat : [];
            const compatible = isAccessoryCompatible({
                compatibilityRows: compatRows,
                suitableFor: a.specs?.suitable_for,
                brand: productMake,
                model: productModel,
                variant: productVariant,
                brandId: productBrandId,
                modelId: productModelId,
                variantIds: [productVariantId, selectedSkuId],
            });
            if (!compatible) return false;

            const rule = accessoryRules.get(a.id);
            if (rule && rule.isActive === false) return false;
            return true;
        })
        .map((a: any) => {
            const rule = accessoryRules.get(a.id);
            const offer = rule ? rule.offer : 0;
            const basePrice = Number(a.price_base) || 0;

            // offer_amount is a DELTA/adjustment to the MRP (price_base):
            //   offer < 0 => discount (e.g., MRP 850 + offer -551 = sell price 299)
            //   offer > 0 => surge/markup
            //   offer = 0 => sell at MRP (no discount)
            let mrp = basePrice;
            let discountPrice = basePrice;
            if (offer !== 0) {
                discountPrice = basePrice + offer; // delta applied to MRP
                if (discountPrice < 0) discountPrice = 0; // safety clamp
            }
            if (mrp === 0) mrp = discountPrice;

            const inclusionType =
                rule?.inclusion ||
                (bundleIdsForDealer.has(a.id) ? 'BUNDLE' : undefined) ||
                a.inclusion_type ||
                'OPTIONAL';
            const isMandatory = inclusionType === 'MANDATORY';

            let colorLabel = a.specs?.color || a.specs?.colour || a.specs?.finish || a.specs?.shade || '';
            let nameBase = a.name;

            if (!colorLabel) {
                const inferred = extractColorFromName(a.name);
                colorLabel = inferred.color;
                nameBase = inferred.baseName || a.name;
            } else {
                nameBase = stripColorFromName(a.name, colorLabel);
            }

            const accessoryName = nameBase || a.name;
            const displayName = [a.brand?.name, a.name].filter(Boolean).join(' ');
            const descriptionLabel = [accessoryName, colorLabel].filter(Boolean).join(' ');

            return {
                id: a.id,
                name: a.name,
                displayName,
                description: descriptionLabel,
                suitableFor: a.specs?.suitable_for || '',
                price: mrp,
                discountPrice,
                maxQty: 1,
                isMandatory,
                inclusionType,
                category: a.category || 'OTHERS',
                brand: a.brand?.name || null,
                subCategory: null,
                image: a.image_url || null,
            };
        });

    const pdpServices = (servicesData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        discountPrice: Number(s.discount_price),
        maxQty: s.max_qty,
        isMandatory: s.is_mandatory,
        durationMonths: s.duration_months,
    }));

    // PDP Options: Registration + Insurance
    const rtoJson: any = (highFidelityPricing as any)?.rto;
    const rtoByType = {
        STATE: parseRtoData(rtoJson?.STATE),
        BH: parseRtoData(rtoJson?.BH),
        COMPANY: parseRtoData(rtoJson?.COMPANY),
    };

    let pdpRtoOptions: any[] = [];
    if (rtoJson) {
        pdpRtoOptions = [
            {
                id: 'STATE',
                name: 'State Registration',
                price: rtoByType.STATE?.total ?? 0,
                description: 'Standard RTO charges for your state.',
                breakdown: rtoByType.STATE?.breakdown || [],
            },
            {
                id: 'BH',
                name: 'Bharat Series (BH)',
                price: rtoByType.BH?.total ?? 0,
                description: 'For frequent interstate travel.',
                breakdown: rtoByType.BH?.breakdown || [],
            },
            {
                id: 'COMPANY',
                name: 'Company Registration',
                price: rtoByType.COMPANY?.total ?? 0,
                description: 'Corporate entity registration.',
                breakdown: rtoByType.COMPANY?.breakdown || [],
            },
        ];
    } else if (Array.isArray(pricingSnapshot?.rto_options)) {
        pdpRtoOptions = pricingSnapshot.rto_options;
    }

    const insuranceJson: any = (highFidelityPricing as any)?.insurance;
    const insuranceGstRate = Number(
        insuranceJson?.gst_rate ?? pricingSnapshot?.insurance_gst_rate ?? pricingSnapshot?.insurance_gst ?? 18
    );
    const odData = insuranceJson?.od;
    const tpData = insuranceJson?.tp;
    const odWithGst = typeof odData === 'object' ? Number(odData?.total || 0) : Number(odData || 0);
    const tpWithGst = typeof tpData === 'object' ? Number(tpData?.total || 0) : Number(tpData || 0);

    let pdpInsuranceRequiredItems: any[] = [];
    if (insuranceJson || pricingSnapshot?.insurance_required_items) {
        // Back-calculate base & GST from GST-inclusive totals
        const gstMultiplier = insuranceGstRate / 100;
        const tpBase =
            typeof tpData === 'object' && tpData?.base
                ? Number(tpData.base)
                : Math.round(tpWithGst / (1 + gstMultiplier));
        const tpGst = typeof tpData === 'object' && tpData?.gst ? Number(tpData.gst) : tpWithGst - tpBase;
        const odBase =
            typeof odData === 'object' && odData?.base
                ? Number(odData.base)
                : Math.round(odWithGst / (1 + gstMultiplier));
        const odGst = typeof odData === 'object' && odData?.gst ? Number(odData.gst) : odWithGst - odBase;

        pdpInsuranceRequiredItems = [
            {
                id: 'insurance-tp',
                name: 'Liability Only (5 Years Cover)',
                price: tpWithGst,
                description: 'Mandatory',
                isMandatory: true,
                breakdown: [
                    { label: 'Base Premium', amount: tpBase },
                    { label: `GST (${insuranceGstRate}%)`, amount: tpGst },
                ],
            },
            {
                id: 'insurance-od',
                name: 'Comprehensive (1 Year Cover)',
                price: odWithGst,
                description: 'Mandatory',
                isMandatory: true,
                breakdown: [
                    { label: 'Base Premium', amount: odBase },
                    { label: `GST (${insuranceGstRate}%)`, amount: odGst },
                ],
            },
        ];
    }

    const normalizeAddonKey = (val: any) =>
        String(val || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const jsonAddons = (insuranceJson?.addons || []) as {
        id: string;
        label: string;
        price: number;
        gst: number;
        total: number;
        default: boolean;
    }[];

    let ruleAddons: any[] = [];
    if (stateCode) {
        const { data: insuranceRuleData } = await supabase
            .from('cat_ins_rules')
            .select('*')
            .eq('status', 'ACTIVE')
            .eq('vehicle_type', 'TWO_WHEELER')
            .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
            .order('state_code', { ascending: false })
            .limit(1);

        const insuranceRule: any = insuranceRuleData?.[0];
        const baseExShowroom = quote.ex_showroom_price || commercials.base_price || 0;
        ruleAddons =
            insuranceRule?.addons?.map((a: any) => {
                const inclusionType = a.inclusion_type || a.inclusionType || 'OPTIONAL';
                const baseAmount =
                    a.type === 'FIXED'
                        ? a.amount || 0
                        : Math.round(
                              ((a.percentage || 0) * (a.basis === 'EX_SHOWROOM' ? baseExShowroom : 100000)) / 100
                          );
                const priceWithGst = Math.round(baseAmount + (baseAmount * insuranceGstRate) / 100);
                const gstAmount = Math.max(0, priceWithGst - baseAmount);

                return {
                    id: a.id,
                    name: a.label,
                    price: priceWithGst,
                    description: a.type === 'PERCENTAGE' ? `${a.percentage}% of ${a.basis}` : 'Fixed Coverage',
                    discountPrice: null,
                    isMandatory: inclusionType === 'MANDATORY',
                    inclusionType,
                    breakdown: [
                        { label: 'Base Premium', amount: baseAmount },
                        { label: `GST (${insuranceGstRate}%)`, amount: gstAmount },
                    ],
                };
            }) || [];
    }

    const ruleAddonIndex = new Map<string, any>();
    ruleAddons.forEach(a => {
        ruleAddonIndex.set(normalizeAddonKey(a.id), a);
        ruleAddonIndex.set(normalizeAddonKey(a.name), a);
    });

    const mappedJsonAddons = jsonAddons.map(addon => {
        const addonTotal = Number(addon.total ?? (addon.price || 0) + (addon.gst || 0));
        const ruleMatch =
            ruleAddonIndex.get(normalizeAddonKey(addon.id)) || ruleAddonIndex.get(normalizeAddonKey(addon.label));
        const resolvedPrice = addonTotal > 0 ? addonTotal : Number(ruleMatch?.price || addonTotal || 0);
        const resolvedBreakdown =
            addonTotal > 0
                ? [
                      { label: 'Base Premium', amount: addon.price },
                      { label: `GST (${insuranceGstRate}%)`, amount: addon.gst },
                  ]
                : ruleMatch?.breakdown || [
                      { label: 'Base Premium', amount: addon.price },
                      { label: `GST (${insuranceGstRate}%)`, amount: addon.gst },
                  ];
        const resolvedInclusionType = addon.default ? 'BUNDLE' : ruleMatch?.inclusionType || 'OPTIONAL';

        return {
            id: addon.id,
            name: addon.label,
            price: resolvedPrice,
            description: 'Coverage',
            discountPrice: null,
            isMandatory: addon.default === true || ruleMatch?.isMandatory,
            inclusionType: resolvedInclusionType,
            breakdown: resolvedBreakdown,
        };
    });

    const jsonAddonIds = new Set(mappedJsonAddons.map(a => a.id));
    const missingRuleAddons = ruleAddons.filter(a => !jsonAddonIds.has(a.id));
    const pdpInsuranceAddons = [...mappedJsonAddons, ...missingRuleAddons];
    const alternativeVariantId = identity.variantId || quote.variant_id || '';

    return {
        success: true,
        data: {
            ...quote,
            customer: {
                name: quote.customer?.full_name || quote.lead?.customer_name || 'Valued Customer',
                phone: quote.customer?.primary_phone || quote.lead?.customer_phone || '',
                email: quote.customer?.primary_email || (quote.lead as any)?.customer_email || null,
            },
            vehicle: {
                brand: commercials.brand || identity.brand || '',
                model: commercials.model || identity.model || '',
                variant: commercials.variant || identity.variant || '',
                color: commercials.color_name || commercials.color || vehicleSpecs?.color_name || '',
                hexCode,
                imageUrl: resolvedImageUrl,
                skuId: selectedSkuId,
                specs: vehicleSpecs,
                keySpecs: [
                    {
                        label: 'Displacement',
                        value:
                            vehicleSpecs.engine_cc || vehicleSpecs.displacement
                                ? `${vehicleSpecs.engine_cc || vehicleSpecs.displacement} cc`
                                : '',
                    },
                    { label: 'Kerb Weight', value: vehicleSpecs.kerb_weight ? `${vehicleSpecs.kerb_weight} kg` : '' },
                    { label: 'Saddle Height', value: vehicleSpecs.seat_height ? `${vehicleSpecs.seat_height} mm` : '' },
                    { label: 'Transmission', value: vehicleSpecs.gearbox || '' },
                    { label: 'Front Brake', value: vehicleSpecs.front_brake_type || vehicleSpecs.front_brake || '' },
                    { label: 'Rear Brake', value: vehicleSpecs.rear_brake_type || vehicleSpecs.rear_brake || '' },
                    { label: 'Tyre Type', value: vehicleSpecs.tyre_type || '' },
                ].filter(s => s.value),
                // Priority fields for quick access in PDF/Dossier
                engine_cc: vehicleSpecs.engine_cc || vehicleSpecs.displacement || '',
                kerb_weight: vehicleSpecs.kerb_weight || '',
                seat_height: vehicleSpecs.seat_height || '',
                gearbox: vehicleSpecs.gearbox || '',
                mileage: vehicleSpecs.mileage || vehicleSpecs.mileage_arai || '',
                top_speed: vehicleSpecs.top_speed || '',
                fuel_capacity: vehicleSpecs.fuel_capacity || '',
                front_brake: vehicleSpecs.front_brake_type || vehicleSpecs.front_brake || '',
                rear_brake: vehicleSpecs.rear_brake_type || vehicleSpecs.rear_brake || '',
                tyre_type: vehicleSpecs.tyre_type || '',
            },
            alternativeBikes: alternativeVariantId ? await getAlternativeRecommendations(alternativeVariantId) : [],
            pdpOptions: {
                accessories: pdpAccessories,
                services: pdpServices,
                insuranceAddons: pdpInsuranceAddons,
                insuranceRequiredItems: pdpInsuranceRequiredItems,
                rtoOptions: pdpRtoOptions,
                warrantyItems: vehicleSpecs?.warranty || pricingSnapshot?.warranty_items || [],
            },
            pricing: {
                exShowroom: quote.ex_showroom_price || commercials.base_price || 0,
                exShowroomGstRate: highFidelityPricing?.gst_rate
                    ? Math.round(
                          Number(highFidelityPricing.gst_rate) * (Number(highFidelityPricing.gst_rate) < 1 ? 100 : 1)
                      )
                    : pricingSnapshot?.gst_rate
                      ? Math.round(Number(pricingSnapshot.gst_rate) * (Number(pricingSnapshot.gst_rate) < 1 ? 100 : 1))
                      : 28,
                exShowroomBasePrice: pricingSnapshot?.ex_showroom_base_price,
                exShowroomGstAmount: pricingSnapshot?.ex_showroom_gst_amount,
                rtoTotal: quote.rto_amount || pricingSnapshot?.rto_total || 0,
                rtoBreakdown: (() => {
                    const type = pricingSnapshot?.rto_type || commercials?.rto_type || 'STATE';
                    const highFidelityRto = (highFidelityPricing as any)?.rto?.[type];
                    if (highFidelityRto && typeof highFidelityRto === 'object') {
                        return Object.entries(highFidelityRto)
                            .filter(([key]) => key !== 'total' && key !== 'id')
                            .map(([key, val]) => ({
                                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                                amount: Number(val) || 0,
                            }));
                    }
                    return pricingSnapshot?.rto_breakdown || [];
                })(),
                rtoType: pricingSnapshot?.rto_type || null,
                rtoOptions: pricingSnapshot?.rto_options || [],
                insuranceBase: pricingSnapshot?.insurance_base || 0,
                insuranceTP: pricingSnapshot?.insurance_tp || 0,
                insuranceOD: pricingSnapshot?.insurance_od || 0,
                insuranceGst: pricingSnapshot?.insurance_gst || 0,
                insuranceTotal: quote.insurance_amount || pricingSnapshot?.insurance_total || 0,
                insuranceAddons: pricingSnapshot?.insurance_addon_items || pricingSnapshot?.insurance_addons || [],
                insuranceRequired: pricingSnapshot?.insurance_required_items || [],
                accessoriesTotal: quote.accessories_amount || pricingSnapshot?.accessories_total || 0,
                accessories: pricingSnapshot?.accessory_items || pricingSnapshot?.accessories || [],
                servicesTotal: pricingSnapshot?.services_total || 0,
                services: pricingSnapshot?.service_items || pricingSnapshot?.services || [],
                dealerDiscount: pricingSnapshot?.dealer_discount || 0,
                colorDelta: pricingSnapshot?.color_delta || 0,
                offersDelta: pricingSnapshot?.offers_delta || 0,
                totalSavings: pricingSnapshot?.total_savings || 0,
                totalSurge: pricingSnapshot?.total_surge || 0,
                managerDiscount: quote.manager_discount || 0,
                referralApplied: pricingSnapshot?.referral_applied || false,
                referralBonus: pricingSnapshot?.referral_bonus || 0,
                onRoadTotal: pricingSnapshot?.grand_total || quote.on_road_price || commercials.grand_total || 0,
                finalTotal: quote.on_road_price || commercials.grand_total || 0,
                warrantyItems: pricingSnapshot?.warranty_items || [],
                allAccessories: pricingSnapshot?.accessories || [],
                allServices: pricingSnapshot?.services || [],
                allInsuranceAddons: pricingSnapshot?.insurance_addons || [],
                allOffers: pricingSnapshot?.offers || [],
                dealer: pricingSnapshot?.dealer || null,
                dealerLocation: dealerLocationData || null,
            },
            finance: activeFinance
                ? {
                      mode: quote.finance_mode,
                      bankName: activeFinance.bank_name || commercials.finance?.bank_name || null,
                      status: activeFinance.status || commercials.finance?.status || null,
                      schemeCode: activeFinance.scheme_code || commercials.finance?.scheme_code || null,
                      schemeName: commercials.finance?.scheme_name || null,
                      selectionLogic: commercials.finance?.selection_logic || null,
                      source: commercials.finance?.source || null,
                      bank: activeFinance.bank_name || commercials.finance?.bank_name || null,
                      scheme:
                          activeFinance.scheme_code ||
                          commercials.finance?.scheme_name ||
                          commercials.finance?.scheme_code ||
                          null,
                      ltv: activeFinance.ltv ?? commercials.finance?.ltv ?? null,
                      roi: activeFinance.roi ?? commercials.finance?.roi ?? null,
                      tenure: activeFinance.tenure_months ?? commercials.finance?.tenure_months ?? null,
                      tenureMonths: activeFinance.tenure_months ?? commercials.finance?.tenure_months ?? null,
                      emi: activeFinance.emi ?? commercials.finance?.emi ?? null,
                      downPayment: activeFinance.down_payment ?? commercials.finance?.down_payment ?? null,
                      loanAmount: activeFinance.loan_amount ?? commercials.finance?.loan_amount ?? null,
                      loanAddons: activeFinance.loan_addons ?? commercials.finance?.loan_addons ?? null,
                      processingFee: activeFinance.processing_fee ?? commercials.finance?.processing_fee ?? null,
                      upfrontCharges:
                          commercials.finance?.processing_fee ??
                          commercials.pricing_snapshot?.finance_upfront_charges ??
                          0,
                      fundedAddons:
                          commercials.finance?.loan_addons ?? commercials.pricing_snapshot?.finance_funded_addons ?? 0,
                      chargesBreakup:
                          commercials.finance?.charges_breakup ||
                          commercials.pricing_snapshot?.finance_charges_breakup ||
                          [],
                  }
                : null,
        },
    };
}

export async function logQuoteEvent(
    quoteId: string,
    event: string,
    actor?: string | null,
    actorType: 'customer' | 'team' = 'team',
    details?: { source?: string; reason?: string; [key: string]: any }
) {
    const supabase = await createClient();

    // Fetch quote first to get tenant_id and commercials
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('tenant_id, commercials')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        console.error('logQuoteEvent Error: Quote not found', fetchError);
        return { success: false, error: 'Quote not found' };
    }

    const tenantId = quote.tenant_id;
    const commercials = (quote.commercials as any) || {};
    const timeline = commercials.timeline || [];

    // Auto-resolve actor metadata
    let resolvedActor = actor;
    let actorOrg: string | null = null;
    let actorDesignation: string | null = null;

    if (actorType === 'team') {
        try {
            const user = await getAuthUser();
            if (user) {
                // If it's a generic actor name, resolve to real name
                if (!resolvedActor || resolvedActor === 'Team Member' || resolvedActor === 'System') {
                    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
                    resolvedActor = fullName || user.email?.split('@')[0] || 'System';
                }

                if (tenantId) {
                    // Fetch organization name and user role in parallel if possible, or sequentially
                    const [tenantRes, teamRes] = await Promise.all([
                        adminClient.from('id_tenants').select('name').eq('id', tenantId).single(),
                        adminClient
                            .from('id_team')
                            .select('role')
                            .eq('tenant_id', tenantId)
                            .eq('user_id', user.id)
                            .single(),
                    ]);

                    if (tenantRes.data) actorOrg = tenantRes.data.name;
                    if (teamRes.data) actorDesignation = teamRes.data.role;
                }
            }
        } catch (e) {
            console.error('Error resolving actor metadata:', e);
        }
    }

    // Add new event
    const newEvent = {
        event,
        timestamp: new Date().toISOString(),
        actor: resolvedActor || 'System',
        actorType,
        actorOrg,
        actorDesignation,
        source: details?.source || null,
        reason: details?.reason || null,
    };

    const updatedCommercials = {
        ...commercials,
        timeline: [...timeline, newEvent],
    };

    const { error: updateError } = await supabase
        .from('crm_quotes')
        .update({ commercials: updatedCommercials })
        .eq('id', quoteId);

    if (updateError) {
        console.error('logQuoteEvent Error: Update failed', updateError);
        return { success: false, error: updateError.message };
    }

    const actorContext = await resolveActorContext(tenantId || null);
    const eventType = event
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_');
    const eventNotes = (() => {
        if (!details) return null;
        const parts = Object.entries(details)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => {
                if (typeof value === 'string') return `${key}:${value}`;
                try {
                    return `${key}:${JSON.stringify(value)}`;
                } catch {
                    return `${key}:${String(value)}`;
                }
            });
        if (parts.length === 0) return null;
        return parts.join(' | ').slice(0, 500);
    })();

    const { error: quoteEventError } = await adminClient.from('crm_quote_events').insert({
        quote_id: quoteId,
        event_type: eventType || 'EVENT',
        actor_tenant_id: actorContext.actorTenantId || tenantId || null,
        actor_user_id: actorContext.actorUserId,
        notes: eventNotes,
    });

    if (quoteEventError) {
        console.error('logQuoteEvent Error: crm_quote_events insert failed', quoteEventError);
    }

    return { success: true };
}

export async function getBookingsForLead(leadId: string) {
    const supabase = await createClient();
    const { data: quotes, error: quoteError } = await supabase
        .from('crm_quotes')
        .select('id')
        .eq('lead_id', leadId)
        .eq('is_deleted', false);

    if (quoteError) {
        console.error('getBookingsForLead quote fetch Error:', quoteError);
        return [];
    }

    const quoteIds = (quotes || []).map((q: any) => q.id);
    if (quoteIds.length === 0) return [];

    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('is_deleted', false)
        .in('quote_id', quoteIds)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getBookingsForLead Error:', error);
        return [];
    }
    return data || [];
}

export async function getReceiptsForEntity(leadId?: string | null, memberId?: string | null) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_payments')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (leadId && memberId) {
        query = query.or(`lead_id.eq.${leadId},member_id.eq.${memberId}`);
    } else if (leadId) {
        query = query.eq('lead_id', leadId);
    } else if (memberId) {
        query = query.eq('member_id', memberId);
    } else {
        return [];
    }

    const { data, error } = await query;
    if (error) {
        console.error('getReceiptsForEntity Error:', error);
        return [];
    }
    return data || [];
}

// Alias: QuoteEditorWrapper uses getPaymentsForEntity
export const getPaymentsForEntity = getReceiptsForEntity;

export async function getReceiptsForTenant(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_payments')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getReceiptsForTenant Error:', error);
        return [];
    }
    return data || [];
}

export async function getReceiptById(receiptId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_payments')
        .select('*')
        .eq('id', receiptId)
        .eq('is_deleted', false)
        .single();

    if (error) {
        console.error('getReceiptById Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }

    return { success: true, receipt: data };
}

export async function updateReceipt(receiptId: string, updates: Record<string, any>) {
    const { data: existing, error: fetchError } = await adminClient
        .from('crm_payments')
        .select('is_reconciled')
        .eq('id', receiptId)
        .maybeSingle();

    if (fetchError) {
        return { success: false, error: fetchError.message };
    }

    if ((existing as any)?.is_reconciled) {
        return { success: false, error: 'Receipt already reconciled' };
    }

    const { error } = await adminClient
        .from('crm_payments')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', receiptId);

    if (error) {
        return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
}

export async function reconcileReceipt(receiptId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { error } = await adminClient
        .from('crm_payments')
        .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            reconciled_by: userId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', receiptId);

    if (error) {
        return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
}

export async function getBankSchemes(bankId: string) {
    try {
        const { data, error } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', bankId)
            .eq('type', 'BANK')
            .single();

        if (error || !data?.config) {
            console.error('[getBankSchemes] Error:', getErrorMessage(error) || 'No config found');
            return [];
        }

        const schemes = (data.config as any)?.schemes || [];
        return schemes.filter((s: any) => s.isActive !== false);
    } catch (error: unknown) {
        console.error('[getBankSchemes] Fatal:', getErrorMessage(error));
        return [];
    }
}

// --- ACCOUNTING ---

export async function getBankAccounts(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase.from('id_bank_accounts').select('*').order('is_primary', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getBankAccounts Error:', error);
        return [];
    }
    return data || [];
}

export async function getAccountingData(tenantId: string) {
    const supabase = await createClient();

    // 1. Fetch unified payments ledger
    const { data: receipts, error: receiptsError } = await supabase
        .from('crm_payments')
        .select('*, member:id_members(full_name)')
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
    if (receiptsError) {
        console.error('getAccountingData Error:', receiptsError);
    }

    // 2. Map unified ledger to inflow/outflow transactions
    const transactions = (receipts || [])
        .map((p: any) => {
            const flowRaw = String(p.provider_data?.flow || p.provider_data?.type || 'INFLOW').toUpperCase();
            const isOutflow = flowRaw === 'OUTFLOW' || flowRaw === 'DEBIT';
            return {
                id: p.id,
                type: isOutflow ? 'OUTFLOW' : 'INFLOW',
                amount: p.amount,
                method: p.method,
                status: p.status,
                date: p.created_at,
                displayId: p.display_id,
                description: isOutflow
                    ? p.provider_data?.description || `Payment to ${p.member?.full_name || 'Vendor'}`
                    : `Payment from ${p.member?.full_name || 'Customer'}`,
                entityId: p.lead_id || p.member_id,
            };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        transactions,
        receiptsCount: receipts?.length || 0,
        paymentsCount: receipts?.length || 0,
    };
}

/**
 * Fetches dealership info for the PDF quote.
 */
export async function getDealershipInfo(tenantId: string) {
    const { data, error } = await adminClient
        .from('id_tenants')
        .select('name, location, phone, email, studio_id, display_id')
        .eq('id', tenantId)
        .maybeSingle();

    if (error || !data) {
        console.error('Error fetching dealership info:', error);
        return null;
    }

    return {
        name: data.name,
        address: data.location,
        phone: data.phone,
        email: data.email,
        studioId: data.studio_id || data.display_id || 'BMB-STD-01',
    };
}

/**
 * Lists all dealership-type tenants for assignment.
 */
export async function getDealerships() {
    const { data, error } = await adminClient
        .from('id_tenants')
        .select('id, name, location, studio_id, display_id')
        .eq('type', 'DEALER')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching dealerships:', error);
        return [];
    }

    return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        location: d.location,
        studioId: d.studio_id || d.display_id || null,
    }));
}

/**
 * Reassigns a quote to a different dealership.
 * Updates tenant_id, studio_id, and commercials.dealer.
 */
export async function reassignQuoteDealership(
    quoteId: string,
    dealerTenantId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Fetch dealer info
        const { data: dealer, error: dealerError } = await adminClient
            .from('id_tenants')
            .select('id, name, location, studio_id, display_id')
            .eq('id', dealerTenantId)
            .single();

        if (dealerError || !dealer) {
            return { success: false, error: 'Dealership not found' };
        }

        // 2. Fetch current quote commercials
        const { data: quote, error: quoteError } = await adminClient
            .from('crm_quotes')
            .select('commercials')
            .eq('is_deleted', false)
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            return { success: false, error: 'Quote not found' };
        }

        const commercials = (quote as any).commercials || {};
        const studioId = dealer.studio_id || dealer.display_id || null;

        // 3. Update commercials.dealer + commercials.pricing_snapshot.dealer
        const updatedCommercials = {
            ...commercials,
            dealer: {
                ...(commercials.dealer || {}),
                dealer_id: dealer.id,
                dealer_name: dealer.name,
                name: dealer.name,
                studio_id: studioId,
                location: dealer.location,
            },
            pricing_snapshot: {
                ...(commercials.pricing_snapshot || {}),
                dealer: {
                    ...(commercials.pricing_snapshot?.dealer || {}),
                    dealer_id: dealer.id,
                    dealer_name: dealer.name,
                    name: dealer.name,
                    id: dealer.id,
                    studio_id: studioId,
                },
            },
        };

        // 4. Atomic update: tenant_id and commercials
        const { error: updateError } = await adminClient
            .from('crm_quotes')
            .update({
                tenant_id: dealer.id,
                commercials: updatedCommercials,
            })
            .eq('id', quoteId);

        if (updateError) {
            console.error('reassignQuoteDealership Error:', updateError);
            return { success: false, error: updateError.message };
        }

        // 5. Log the event
        await logQuoteEvent(quoteId, `Dealership changed to ${dealer.name}`, null, 'team');

        return { success: true };
    } catch (error: unknown) {
        console.error('reassignQuoteDealership Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetches 3 alternative products for recommendations.
 * Checks cat_recommendations table first, fallbacks to similarity logic.
 */
export async function getAlternativeRecommendations(variantId: string) {
    const hydrateVariants = async (variantIds: string[]) => {
        const ids = Array.from(new Set((variantIds || []).filter(Boolean)));
        if (ids.length === 0) return [];

        const [{ data: variants }, { data: variantSkus }] = await Promise.all([
            adminClient.from('cat_variants_vehicle').select('id, name').in('id', ids),
            (adminClient as any)
                .from('cat_skus')
                .select('id, vehicle_variant_id, primary_image, price_base, is_primary')
                .eq('sku_type', 'VEHICLE')
                .eq('status', 'ACTIVE')
                .in('vehicle_variant_id', ids),
        ]);

        const bestSkuByVariant = new Map<string, any>();
        (variantSkus || []).forEach((sku: any) => {
            const key = sku.vehicle_variant_id;
            if (!key) return;
            const current = bestSkuByVariant.get(key);
            if (!current) {
                bestSkuByVariant.set(key, sku);
                return;
            }
            if (sku.is_primary && !current.is_primary) {
                bestSkuByVariant.set(key, sku);
                return;
            }
            if (!current.primary_image && sku.primary_image) {
                bestSkuByVariant.set(key, sku);
            }
        });

        return (variants || []).map((variant: any) => {
            const sku = bestSkuByVariant.get(variant.id);
            return {
                id: variant.id,
                name: variant.name,
                brand: '',
                price: Number(sku?.price_base || 0),
                image: sku?.primary_image || null,
            };
        });
    };

    // 1. Check persistent recommendations
    const { data: persistent, error: persistentError } = await (adminClient as any)
        .from('cat_recommendations')
        .select('recommended_variant_id, position')
        .eq('source_variant_id', variantId)
        .order('position', { ascending: true })
        .limit(3);

    if (!persistentError && persistent && persistent.length > 0) {
        const orderedIds = (persistent as any[]).map(p => p.recommended_variant_id).filter(Boolean);
        const hydrated = await hydrateVariants(orderedIds);
        const hydratedMap = new Map(hydrated.map((item: any) => [item.id, item]));
        return orderedIds
            .map(id => hydratedMap.get(id))
            .filter(Boolean)
            .slice(0, 3);
    }

    // 2. Fallback: Get current variant model
    const { data: current, error: currentError } = await (adminClient as any)
        .from('cat_variants_vehicle')
        .select('id, model_id')
        .eq('id', variantId)
        .single();

    if (currentError || !current || !current.model_id) {
        console.error('Error fetching current variant for alternatives:', currentError);
        return [];
    }

    // 3. Fetch sibling variants from same model and hydrate from primary vehicle SKUs
    const { data: siblingVariants, error: siblingError } = await (adminClient as any)
        .from('cat_variants_vehicle')
        .select('id')
        .eq('model_id', current.model_id)
        .neq('id', variantId)
        .limit(20);

    if (siblingError) {
        console.error('Error fetching sibling variants:', siblingError);
        return [];
    }

    const siblingIds = (siblingVariants || []).map((v: any) => v.id).filter(Boolean);
    if (siblingIds.length === 0) return [];

    const [currentHydrated] = await hydrateVariants([variantId]);
    const hydratedSiblings = await hydrateVariants(siblingIds);

    const currentPrice = Number(currentHydrated?.price || 0);
    let filtered = hydratedSiblings;
    if (currentPrice > 0) {
        const minPrice = currentPrice * 0.8;
        const maxPrice = currentPrice * 1.2;
        filtered = hydratedSiblings.filter((item: any) => item.price >= minPrice && item.price <= maxPrice);
    }

    if (filtered.length === 0) filtered = hydratedSiblings;
    return filtered.slice(0, 3);
}
