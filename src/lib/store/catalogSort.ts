import { getEmiFactor } from '@/lib/constants/pricingConstants';

/** Shared sort key union — used by UniversalCatalog and MobileFilterDrawer */
export type SortKey = 'popular' | 'price' | 'emi' | 'mileage' | 'seatHeight' | 'kerbWeight';

export const VALID_SORT_KEYS: ReadonlySet<string> = new Set<SortKey>([
    'popular',
    'price',
    'emi',
    'mileage',
    'seatHeight',
    'kerbWeight',
]);

/**
 * Safe numeric extractor — handles null, undefined, empty string, and
 * string spec values like "165mm" by using parseFloat.
 */
export const safeNum = (v: unknown, fallback = 0): number => {
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : fallback;
};

/** Minimal shape needed for catalog sorting */
interface SortableVehicle {
    popularityScore?: number | null;
    price?: {
        onRoad?: number | null;
        exShowroom?: number | null;
    } | null;
    specifications?: {
        engine?: { mileage?: unknown } | null;
        dimensions?: {
            seatHeight?: unknown;
            kerbWeight?: unknown;
        } | null;
    } | null;
}

/**
 * Returns a comparator function for the given sort key.
 * Each comparator is a standard (a, b) => number function suitable for Array.sort.
 */
export function getCatalogComparator(
    sortKey: SortKey,
    downpayment = 0
): (a: SortableVehicle, b: SortableVehicle) => number {
    switch (sortKey) {
        case 'popular':
            return (a, b) => (b.popularityScore || 0) - (a.popularityScore || 0);

        case 'price':
            return (a, b) =>
                (a.price?.onRoad || a.price?.exShowroom || 0) - (b.price?.onRoad || b.price?.exShowroom || 0);

        case 'emi':
            return (a, b) => {
                const aEmi = Math.round(((a.price?.exShowroom || 0) - downpayment) * getEmiFactor(36));
                const bEmi = Math.round(((b.price?.exShowroom || 0) - downpayment) * getEmiFactor(36));
                return aEmi - bEmi;
            };

        case 'mileage':
            // Higher mileage first (best fuel efficiency at top)
            return (a, b) => safeNum(b.specifications?.engine?.mileage) - safeNum(a.specifications?.engine?.mileage);

        case 'seatHeight':
            // Lower seat height first (more accessible for shorter riders)
            return (a, b) =>
                safeNum(a.specifications?.dimensions?.seatHeight, Infinity) -
                safeNum(b.specifications?.dimensions?.seatHeight, Infinity);

        case 'kerbWeight':
            // Lighter first (easier to handle)
            return (a, b) =>
                safeNum(a.specifications?.dimensions?.kerbWeight, Infinity) -
                safeNum(b.specifications?.dimensions?.kerbWeight, Infinity);

        default:
            return () => 0;
    }
}

/**
 * Sorts an array of vehicles in-place by the given sort key.
 * Returns the same array reference for chaining convenience.
 */
export function sortCatalogVehicles<T extends SortableVehicle>(vehicles: T[], sortKey: SortKey, downpayment = 0): T[] {
    return vehicles.sort(getCatalogComparator(sortKey, downpayment));
}
