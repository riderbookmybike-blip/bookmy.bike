const STATE_NAME_TO_CODE: Record<string, string> = {
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

export const DEFAULT_STATE_CODE = 'MH';

export function normalizeStateCode(input?: string | null): string {
    if (!input) return DEFAULT_STATE_CODE;
    const key = String(input).toUpperCase().trim();
    if (STATE_NAME_TO_CODE[key]) return STATE_NAME_TO_CODE[key];
    if (/^[A-Z]{2}$/.test(key)) return key;
    return DEFAULT_STATE_CODE;
}
