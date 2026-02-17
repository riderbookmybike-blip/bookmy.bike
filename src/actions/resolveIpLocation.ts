'use server';

import { headers } from 'next/headers';

/**
 * Resolve user location from IP address (server-side only).
 * Uses Vercel's automatic geo headers when deployed.
 * Returns null for local dev (no Vercel headers available).
 */
export async function resolveIpLocation(): Promise<{
    stateCode: string | null;
    district: string | null;
    source: 'vercel-geo' | 'none';
}> {
    try {
        const h = await headers();
        const country = (h.get('x-vercel-ip-country') || '').toUpperCase();
        const region = (h.get('x-vercel-ip-country-region') || '').toUpperCase();

        if (country === 'IN' && region) {
            const stateCode = normalizeStateCode(region);
            if (stateCode) {
                return { stateCode, district: null, source: 'vercel-geo' };
            }
        }

        // India but no region — default MH
        if (country === 'IN') {
            return { stateCode: 'MH', district: null, source: 'vercel-geo' };
        }
    } catch (err) {
        console.error('[resolveIpLocation] Failed:', err);
    }

    return { stateCode: null, district: null, source: 'none' };
}

/** Normalize Indian state name or code to 2-letter code. */
function normalizeStateCode(input: string): string | null {
    const upper = input.trim().toUpperCase();
    if (upper.length <= 2) return upper;

    const map: Record<string, string> = {
        MAHARASHTRA: 'MH',
        KARNATAKA: 'KA',
        DELHI: 'DL',
        GUJARAT: 'GJ',
        'TAMIL NADU': 'TN',
        TELANGANA: 'TS',
        'UTTAR PRADESH': 'UP',
        'WEST BENGAL': 'WB',
        RAJASTHAN: 'RJ',
        'ANDHRA PRADESH': 'AP',
        BIHAR: 'BR',
        CHHATTISGARH: 'CG',
        GOA: 'GA',
        HARYANA: 'HR',
        'HIMACHAL PRADESH': 'HP',
        JHARKHAND: 'JH',
        KERALA: 'KL',
        'MADHYA PRADESH': 'MP',
        MANIPUR: 'MN',
        MEGHALAYA: 'ML',
        MIZORAM: 'MZ',
        NAGALAND: 'NL',
        ODISHA: 'OD',
        PUNJAB: 'PB',
        SIKKIM: 'SK',
        TRIPURA: 'TR',
        UTTARAKHAND: 'UK',
        ASSAM: 'AS',
        'ARUNACHAL PRADESH': 'AR',
        'JAMMU AND KASHMIR': 'JK',
        LADAKH: 'LA',
        PUDUCHERRY: 'PY',
        CHANDIGARH: 'CH',
        LAKSHADWEEP: 'LD',
        'ANDAMAN AND NICOBAR ISLANDS': 'AN',
    };

    return map[upper] || upper.substring(0, 2);
}
