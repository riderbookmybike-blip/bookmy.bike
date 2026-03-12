const KNOWN_BRANDS = ['BAJAJ', 'TVS', 'HERO', 'YAMAHA', 'SUZUKI', 'HONDA'] as const;

const cleanLetters = (value: string) =>
    String(value || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');

const firstThreeLetters = (value: string) => (cleanLetters(value) + 'XXX').slice(0, 3);

function resolveBrandAndDealership(dealerName: string): { brand: string; dealership: string } {
    const upper = String(dealerName || '').toUpperCase();
    const matchedBrand = KNOWN_BRANDS.find(brand => new RegExp(`\\b${brand}\\b`, 'i').test(upper));

    if (matchedBrand) {
        const dealership = upper
            .replace(new RegExp(`\\b${matchedBrand}\\b`, 'ig'), ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return { brand: matchedBrand, dealership: dealership || matchedBrand };
    }

    const words = String(dealerName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const brand = words[0] || '';
    const dealership = words.slice(1).join(' ') || words[0] || '';
    return { brand, dealership };
}

const cleanSlug = (value: string) =>
    String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

function normalizeDealershipFromSlug(brand: string, dealerSlug: string, dealerName: string): string {
    const slug = cleanSlug(dealerSlug);
    const brandSlug = cleanSlug(brand);
    const rawToken = (slug.split('-').filter(Boolean)[0] || '').trim();

    // If slug starts with brand token, skip it and pick next meaningful token.
    const tokens = slug.split('-').filter(Boolean);
    const token =
        tokens.find(t => t !== brandSlug && !t.startsWith(`${brandSlug}`) && !brandSlug.startsWith(t)) ||
        tokens.find(t => t !== brandSlug) ||
        rawToken;

    if (token) return token;

    const { dealership } = resolveBrandAndDealership(dealerName);
    return dealership;
}

export function generateDealerStudioId(dealerName: string, dealerSlug: string, areaName: string): string {
    const { brand, dealership } = resolveBrandAndDealership(dealerName);
    const dealershipFromSlug = normalizeDealershipFromSlug(brand, dealerSlug, dealership);

    const b = firstThreeLetters(brand);
    const d = firstThreeLetters(dealershipFromSlug);
    const a = firstThreeLetters(areaName);

    return `${b[0]}${d[0]}${a[0]}-${b[1]}${d[1]}${a[1]}-${b[2]}${d[2]}${a[2]}`;
}
