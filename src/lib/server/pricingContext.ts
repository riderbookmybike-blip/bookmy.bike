import { createClient } from '../supabase/server';
import { adminClient } from '../supabase/admin';
import { cookies } from 'next/headers';
import { withCache } from '../cache/cache';
import { CACHE_TAGS, districtTag } from '../cache/tags';

export type PricingSource = 'EXPLICIT' | 'TEAM' | 'PRIMARY_DISTRICT' | 'PRIMARY_STATE' | 'PRIMARY_COUNTRY' | 'NONE';

export interface PricingContext {
    dealerId: string | null;
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

const normalizeStateCode = (state?: string | null, stateCode?: string | null) => {
    if (stateCode) return stateCode;
    if (!state) return 'MH';
    const key = state.toUpperCase();
    return STATE_MAP[key] || key.substring(0, 2);
};

/**
 * FETCHERS
 */

async function getRawPrimaryDealer(stateCode: string, district: string) {
    // Use adminClient (no cookies) for cached operations
    const { data } = await (adminClient as any)
        .from('id_primary_dealer_districts')
        .select('tenant_id, district')
        .eq('state_code', stateCode)
        .ilike('district', district)
        .eq('is_active', true)
        .maybeSingle();
    return data || null;
}

async function getDealerLocation(tenantId: string) {
    // Use adminClient (no cookies) for cached operations
    const { data } = await (adminClient as any)
        .from('id_locations')
        .select('district, state')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('type', { ascending: false })
        .limit(1)
        .maybeSingle();
    return data || null;
}

async function getDealerIdByStudioId(studioId: string) {
    // Use adminClient (no cookies) for cached operations
    const { data } = await (adminClient as any)
        .from('id_tenants')
        .select('id')
        .ilike('studio_id', studioId)
        .limit(1)
        .maybeSingle();
    return data?.id || null;
}

export async function resolvePricingContext({
    leadId,
    dealerId,
    district,
    state,
    studio,
}: {
    leadId?: string | null;
    dealerId?: string | null;
    district?: string | null;
    state?: string | null;
    studio?: string | null;
}): Promise<PricingContext> {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const hasExplicitState = Boolean(state);
    let resolvedDistrict = district?.trim() || null;
    let stateCode = normalizeStateCode(state, null);

    // If district is actually a pincode, resolve it to district + state_code
    if (resolvedDistrict && /^\d{6}$/.test(resolvedDistrict)) {
        const { data: pin } = await supabase
            .from('loc_pincodes')
            .select('district, state_code')
            .eq('pincode', resolvedDistrict)
            .maybeSingle();

        if (pin?.district) {
            resolvedDistrict = pin.district;
            stateCode = pin.state_code || stateCode;
        }
    }

    // 1) Location from cookie (if district not explicitly provided)
    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    if (locationCookie) {
        let data: any = null;
        try {
            data = JSON.parse(locationCookie);
        } catch {
            if (/^\d{6}$/.test(locationCookie)) {
                data = { pincode: locationCookie };
            }
        }

        if (data) {
            if (!resolvedDistrict) {
                resolvedDistrict = data.district || data.taluka || data.city || null;
                if (!hasExplicitState) {
                    stateCode = normalizeStateCode(data.state, data.stateCode);
                }
            } else if (!hasExplicitState && (data.state || data.stateCode)) {
                stateCode = normalizeStateCode(data.state, data.stateCode);
            }

            if (!resolvedDistrict && data.pincode) {
                const { data: pin } = await supabase
                    .from('loc_pincodes')
                    .select('district, state_code')
                    .eq('pincode', data.pincode)
                    .maybeSingle();

                if (pin?.district) {
                    resolvedDistrict = pin.district;
                    stateCode = pin.state_code || stateCode;
                }
            }
        }
    }

    // 2) Team session dealer lock (highest priority after explicit)
    let sessionDealerId: string | null = null;
    const dealerSessionCookie = cookieStore.get('bmb_dealer_session')?.value;
    if (dealerSessionCookie) {
        try {
            const sessionData = JSON.parse(decodeURIComponent(dealerSessionCookie));
            if (sessionData?.mode === 'TEAM' && sessionData?.activeTenantId) {
                sessionDealerId = sessionData.activeTenantId;
                if (!resolvedDistrict && sessionData.district) {
                    resolvedDistrict = sessionData.district;
                }
            }
        } catch {
            // ignore parse errors
        }
    }

    // 3) Lead context can override district (primary dealer still applies)
    if (leadId) {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select('customer_pincode')
            .eq('id', leadId)
            .maybeSingle();

        const pincode = lead?.customer_pincode;
        if (pincode) {
            const { data: pin } = await supabase
                .from('loc_pincodes')
                .select('district, state_code')
                .eq('pincode', pincode)
                .maybeSingle();

            if (pin?.district) {
                resolvedDistrict = pin.district;
                stateCode = pin.state_code || stateCode;
            }
        }
    }

    // 4) Resolve dealer (explicit dealer id or studio id)
    let resolvedDealerId: string | null = dealerId || null;
    if (!resolvedDealerId && studio) {
        resolvedDealerId = await getDealerIdByStudioId(studio.trim());
    }

    // Ensure stateCode is aligned to dealer location if a dealer is explicitly resolved
    const applyDealerLocation = async (tenantId: string) => {
        const loc = await getDealerLocation(tenantId);
        if (loc?.state) {
            stateCode = normalizeStateCode(loc.state, null);
        }
        if (!resolvedDistrict && loc?.district) {
            resolvedDistrict = loc.district;
        }
    };

    if (resolvedDealerId) {
        await applyDealerLocation(resolvedDealerId);
        return {
            dealerId: resolvedDealerId,
            district: resolvedDistrict,
            stateCode,
            source: 'EXPLICIT',
        };
    }

    if (sessionDealerId) {
        await applyDealerLocation(sessionDealerId);
        return {
            dealerId: sessionDealerId,
            district: resolvedDistrict,
            stateCode,
            source: 'TEAM',
        };
    }

    if (resolvedDistrict) {
        // Use withCache for primary dealer resolution (District)
        const primaryDistrict = await withCache(
            () => getRawPrimaryDealer(stateCode, resolvedDistrict!),
            ['primary-dealer', stateCode, resolvedDistrict],
            { revalidate: 3600, tags: [CACHE_TAGS.districts, districtTag(resolvedDistrict)] }
        );

        if (primaryDistrict?.tenant_id) {
            return {
                dealerId: primaryDistrict.tenant_id,
                district: resolvedDistrict,
                stateCode,
                source: 'PRIMARY_DISTRICT',
            };
        }
    }

    // Fallback: Primary dealer for the state (district = ALL)
    const primaryState = await withCache(
        () => getRawPrimaryDealer(stateCode, 'ALL'),
        ['primary-dealer', stateCode, 'ALL'],
        { revalidate: 3600, tags: [CACHE_TAGS.districts, districtTag(resolvedDistrict || 'ALL')] }
    );

    if (primaryState?.tenant_id) {
        return {
            dealerId: primaryState.tenant_id,
            district: resolvedDistrict,
            stateCode,
            source: 'PRIMARY_STATE',
        };
    }

    // Final fallback: Primary dealer for the country (state = ALL, district = ALL)
    const primaryCountry = await withCache(() => getRawPrimaryDealer('ALL', 'ALL'), ['primary-dealer', 'ALL', 'ALL'], {
        revalidate: 3600,
        tags: [CACHE_TAGS.districts, districtTag('ALL')],
    });

    if (primaryCountry?.tenant_id) {
        return {
            dealerId: primaryCountry.tenant_id,
            district: resolvedDistrict,
            stateCode,
            source: 'PRIMARY_COUNTRY',
        };
    }

    return {
        dealerId: null,
        district: resolvedDistrict,
        stateCode,
        source: 'NONE',
    };
}
