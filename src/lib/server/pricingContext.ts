import { cookies } from 'next/headers';
import { adminClient } from '@/lib/supabase/admin';

export type PricingSource = 'NONE' | 'EXPLICIT' | 'PRIMARY_LEAD' | 'PRIMARY_STUDIO';

export interface PricingContext {
    dealerId: string | null;
    tenantName: string | null;
    district: string | null;
    stateCode: string;
    source: PricingSource;
}

const STATE_MAP: Record<string, string> = {
    MAHARASHTRA: 'MH',
    KARNATAKA: 'KA',
    DELHI: 'DL',
    GUJARAT: 'GJ',
    TAMIL_NADU: 'TN',
    TELANGANA: 'TS',
    UTTAR_PRADESH: 'UP',
    WEST_BENGAL: 'WB',
    RAJASTHAN: 'RJ',
};

const DEALER_TYPES = ['DEALER', 'DEALERSHIP'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const normalizeStateCode = (state?: string | null, stateCode?: string | null) => {
    const normalize = (value: string) => {
        const key = value.toUpperCase().trim();
        if (STATE_MAP[key]) return STATE_MAP[key];
        if (/^[A-Z]{2}$/.test(key)) return key;
        return 'MH';
    };
    if (stateCode) return normalize(stateCode);
    if (!state) return 'MH';
    return normalize(state);
};

const resolveStateFromCookie = async () => {
    const cookieStore = await cookies();
    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    if (!locationCookie) return 'MH';
    try {
        const data = JSON.parse(locationCookie);
        return normalizeStateCode(data?.state, data?.stateCode);
    } catch {
        return 'MH';
    }
};

const resolveDealerTenantByExplicitParam = async (dealerParam: string) => {
    const candidate = String(dealerParam || '').trim();
    if (!candidate) return null;

    if (UUID_REGEX.test(candidate)) {
        const { data } = await (adminClient as any)
            .from('id_tenants')
            .select('id, name, location')
            .eq('id', candidate)
            .in('type', DEALER_TYPES)
            .maybeSingle();
        if (data?.id) return data;
    }

    const { data: bySlug } = await (adminClient as any)
        .from('id_tenants')
        .select('id, name, location')
        .ilike('slug', candidate.toLowerCase())
        .in('type', DEALER_TYPES)
        .maybeSingle();
    if (bySlug?.id) return bySlug;

    return null;
};

const resolveDealerTenantByStudio = async (studioParam: string) => {
    const studio = String(studioParam || '').trim();
    if (!studio) return null;
    const { data } = await (adminClient as any)
        .from('id_tenants')
        .select('id, name, location')
        .ilike('studio_id', studio.toUpperCase())
        .in('type', DEALER_TYPES)
        .maybeSingle();
    return data?.id ? data : null;
};

const resolveDealerTenantFromLead = async (leadRef: string) => {
    const candidate = String(leadRef || '').trim();
    if (!candidate) return null;

    const isUuid = UUID_REGEX.test(candidate);
    const leadQuery = (adminClient as any).from('crm_leads').select('id, selected_dealer_tenant_id').limit(1);
    const { data: lead } = isUuid
        ? await leadQuery.eq('id', candidate).maybeSingle()
        : await leadQuery.eq('display_id', candidate).maybeSingle();

    const dealerId = String(lead?.selected_dealer_tenant_id || '').trim();
    if (!dealerId) return null;

    const { data: dealer } = await (adminClient as any)
        .from('id_tenants')
        .select('id, name, location')
        .eq('id', dealerId)
        .in('type', DEALER_TYPES)
        .maybeSingle();
    return dealer?.id ? dealer : null;
};

/**
 * Resolve state + explicit dealer context (if any).
 * Priority:
 * 1. explicit dealer query param (?dealer=<uuid|slug>)
 * 2. studio query param (?studio=<studio_id>)
 * 3. lead-selected dealer
 * 4. no dealer context
 */
export async function resolvePricingContext(input?: {
    leadId?: string | null;
    dealerId?: string | null;
    state?: string | null;
    studio?: string | null;
    mode?: string;
}): Promise<PricingContext> {
    const inputStateCode = normalizeStateCode(input?.state || null, null);
    const cookieStateCode = await resolveStateFromCookie();
    const stateCode = input?.state ? inputStateCode : cookieStateCode;

    const explicitDealer = await resolveDealerTenantByExplicitParam(String(input?.dealerId || ''));
    if (explicitDealer?.id) {
        return {
            dealerId: explicitDealer.id,
            tenantName: explicitDealer.name || null,
            district: explicitDealer.location || null,
            stateCode,
            source: 'EXPLICIT',
        };
    }

    const studioDealer = await resolveDealerTenantByStudio(String(input?.studio || ''));
    if (studioDealer?.id) {
        return {
            dealerId: studioDealer.id,
            tenantName: studioDealer.name || null,
            district: studioDealer.location || null,
            stateCode,
            source: 'PRIMARY_STUDIO',
        };
    }

    const leadDealer = await resolveDealerTenantFromLead(String(input?.leadId || ''));
    if (leadDealer?.id) {
        return {
            dealerId: leadDealer.id,
            tenantName: leadDealer.name || null,
            district: leadDealer.location || null,
            stateCode,
            source: 'PRIMARY_LEAD',
        };
    }

    return {
        dealerId: null,
        tenantName: null,
        district: null,
        stateCode,
        source: 'NONE',
    };
}

export const resolveStoreContext = resolvePricingContext;
export const resolveStateOnlyPricingContext = resolvePricingContext;
