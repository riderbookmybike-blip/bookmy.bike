export const REGION_MMRDA = 'MMRDA';

const MMRDA_DISTRICTS = new Set(['MUMBAI CITY', 'MUMBAI SUBURBAN', 'THANE', 'PALGHAR', 'RAIGAD']);

function normalize(value: string): string {
    return String(value || '')
        .trim()
        .toUpperCase();
}

export function resolveRegionFromDistrict(district: string, stateCode: string = 'MH'): string | null {
    if (normalize(stateCode) !== 'MH') return null;
    const d = normalize(district);
    if (!d) return null;
    if (MMRDA_DISTRICTS.has(d)) return REGION_MMRDA;
    return null;
}
