const KNOWN_BRANDS = ['BAJAJ', 'TVS', 'HERO', 'YAMAHA', 'SUZUKI', 'HONDA'] as const;

const cleanLetters = (value: string) =>
    String(value || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');

const firstThreeLetters = (value: string) => (cleanLetters(value) + 'XXX').slice(0, 3);
const firstTwoDigits = (value: string) =>
    String(value || '')
        .replace(/\D/g, '')
        .slice(0, 2);
const thirdAndFourthDigits = (value: string) =>
    String(value || '')
        .replace(/\D/g, '')
        .slice(2, 4);

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

export function generateDealerStudioId(dealerName: string, dealerSlug: string, pincodeLike: string): string {
    const { brand, dealership } = resolveBrandAndDealership(dealerName);
    const dealershipFromSlug = normalizeDealershipFromSlug(brand, dealerSlug, dealership);

    const d = firstThreeLetters(dealershipFromSlug);
    const brandLetters = (cleanLetters(brand) + 'XX').slice(0, 2);
    const pin12 = (firstTwoDigits(pincodeLike) + '00').slice(0, 2);
    const pin34 = (thirdAndFourthDigits(pincodeLike) + '00').slice(0, 2);

    // Format: [Brand1 + Pin1Pin2]-[Brand2 + Dealer1Dealer2]-[Pin3Pin4 + Dealer3]
    // Example pattern: H40-ERA-00U
    return `${brandLetters[0]}${pin12}-${brandLetters[1]}${d[0]}${d[1]}-${pin34}${d[2]}`;
}
