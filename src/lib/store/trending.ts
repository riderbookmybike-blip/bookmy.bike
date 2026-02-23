import type { ProductVariant } from '@/types/productMaster';

type TrendMetrics = {
    bookingCount: number;
    visitorViews: number;
    visitorDwellMs: number;
    popularityScore: number;
    discount: number;
    price: number;
};

const MAX_PRICE_SENTINEL = Number.MAX_SAFE_INTEGER;

function toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getTrendMetrics(item: ProductVariant): TrendMetrics {
    const trendSignals = item.trendSignals || {};
    const bookingCount = Math.max(0, toNumber(trendSignals.bookingCount, 0));
    const visitorViews = Math.max(0, toNumber(trendSignals.visitorViews, 0));
    const visitorDwellMs = Math.max(0, toNumber(trendSignals.visitorDwellMs, 0));
    const popularityScore = Math.max(0, toNumber(item.popularityScore, 0));
    const discount = Math.max(0, toNumber(item.price?.discount, 0));
    const price = toNumber(item.price?.offerPrice ?? item.price?.onRoad ?? item.price?.exShowroom, MAX_PRICE_SENTINEL);

    return {
        bookingCount,
        visitorViews,
        visitorDwellMs,
        popularityScore,
        discount,
        price,
    };
}

function compareTrending(a: ProductVariant, b: ProductVariant): number {
    const aMetrics = getTrendMetrics(a);
    const bMetrics = getTrendMetrics(b);

    const aHasBookings = aMetrics.bookingCount > 0;
    const bHasBookings = bMetrics.bookingCount > 0;
    if (aHasBookings !== bHasBookings) return aHasBookings ? -1 : 1;

    if (aMetrics.bookingCount !== bMetrics.bookingCount) return bMetrics.bookingCount - aMetrics.bookingCount;
    if (aMetrics.visitorDwellMs !== bMetrics.visitorDwellMs) return bMetrics.visitorDwellMs - aMetrics.visitorDwellMs;
    if (aMetrics.visitorViews !== bMetrics.visitorViews) return bMetrics.visitorViews - aMetrics.visitorViews;
    if (aMetrics.popularityScore !== bMetrics.popularityScore)
        return bMetrics.popularityScore - aMetrics.popularityScore;
    if (aMetrics.discount !== bMetrics.discount) return bMetrics.discount - aMetrics.discount;
    if (aMetrics.price !== bMetrics.price) return aMetrics.price - bMetrics.price;

    return (a.displayName || '').localeCompare(b.displayName || '');
}

export function sortByTrending(items: ProductVariant[]): ProductVariant[] {
    return [...(items || [])].sort(compareTrending);
}

export function selectTrendingModels(items: ProductVariant[], limit = 8): ProductVariant[] {
    const sorted = sortByTrending(items || []);
    const selected = new Map<string, ProductVariant>();

    for (const item of sorted) {
        const key = item.modelSlug || `${item.make || ''}::${item.model || ''}`.toLowerCase();
        if (!key) continue;
        if (!selected.has(key)) selected.set(key, item);
        if (selected.size >= limit) break;
    }

    return Array.from(selected.values()).slice(0, limit);
}

export function selectTrendingByBrand(items: ProductVariant[]): Map<string, ProductVariant> {
    const sorted = sortByTrending(items || []);
    const byBrand = new Map<string, ProductVariant>();

    for (const item of sorted) {
        const key = String(item.make || '')
            .trim()
            .toUpperCase();
        if (!key) continue;
        if (!byBrand.has(key)) byBrand.set(key, item);
    }

    return byBrand;
}

export function formatPriceToLakhs(amount: number): string {
    const normalized = Math.max(0, toNumber(amount, 0));
    if (!normalized) return 'N/A';
    return `${(normalized / 100000).toFixed(2)}L`;
}
