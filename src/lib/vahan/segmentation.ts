export type BrandFuelSegment = 'ICE' | 'EV' | 'MIXED' | 'UNCERTAIN';

export function normalizeFuelBucket(value: unknown): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

export function isEvFuelBucket(value: unknown): boolean {
    const bucket = normalizeFuelBucket(value);
    if (!bucket) return false;
    if (/^NON[\s_-]*EV$/.test(bucket) || /^ICE$/.test(bucket)) return false;
    return bucket.includes('EV') || bucket.includes('ELECTRIC') || bucket.includes('BATTERY') || bucket.includes('BEV');
}

export function reconcileFuelSplit(
    totalUnits: number,
    evUnitsCandidate: number,
    segment: BrandFuelSegment
): { ev_units: number; ice_units: number } {
    const total = Math.max(0, Number(totalUnits || 0));
    const evRaw = Math.max(0, Number(evUnitsCandidate || 0));

    if (segment === 'EV') {
        return { ev_units: total, ice_units: 0 };
    }
    if (segment === 'MIXED') {
        const ev = Math.max(0, Math.min(total, evRaw));
        return { ev_units: ev, ice_units: Math.max(0, total - ev) };
    }
    // ICE / UNCERTAIN defaults to ICE-only to avoid false EV leakage.
    return { ev_units: 0, ice_units: total };
}
