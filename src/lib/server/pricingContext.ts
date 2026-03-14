import { cookies } from 'next/headers';

export type PricingSource = 'NONE';

export interface PricingContext {
    dealerId: null;
    tenantName: null;
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

/**
 * Resolve state code only (for RTO/pricing).
 * No dealer and no primary dealer.
 * Client-side RPC handles best-offer resolution (200km radius).
 */
export async function resolvePricingContext(_input?: {
    leadId?: string | null;
    dealerId?: string | null;
    state?: string | null;
    studio?: string | null;
    mode?: string;
}): Promise<PricingContext> {
    const cookieStore = await cookies();
    let stateCode = 'MH';

    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    if (locationCookie) {
        try {
            const data = JSON.parse(locationCookie);
            if (data?.stateCode || data?.state) {
                stateCode = normalizeStateCode(data.state, data.stateCode);
            }
        } catch {
            // ignore bad cookie
        }
    }

    return {
        dealerId: null,
        tenantName: null,
        stateCode,
        source: 'NONE',
    };
}

export const resolveStoreContext = resolvePricingContext;
export const resolveStateOnlyPricingContext = resolvePricingContext;
