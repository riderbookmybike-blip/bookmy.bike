export const normalizeLocationKey = (value?: string | null): string => {
    if (!value) return '';
    return value
        .toString()
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
};

export const formatLocationName = (value?: string | null): string | null => {
    if (!value) return null;
    const cleaned = value.toString().replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;
    return cleaned
        .toLowerCase()
        .split(' ')
        .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
};

export const mergeAreas = (existing: string[] = [], incoming?: string | null) => {
    const normalizedExisting = existing.filter(Boolean);
    const incomingName = formatLocationName(incoming);
    if (!incomingName) {
        return {
            areas: normalizedExisting,
            areaKeys: normalizedExisting.map(normalizeLocationKey).filter(Boolean),
        };
    }
    const nextAreas = [...normalizedExisting, incomingName];
    const areaKeys = Array.from(new Set(nextAreas.map(normalizeLocationKey).filter(Boolean)));
    const dedupedAreas: string[] = [];
    const seen = new Set<string>();
    nextAreas.forEach(area => {
        const key = normalizeLocationKey(area);
        if (key && !seen.has(key)) {
            seen.add(key);
            dedupedAreas.push(area);
        }
    });
    return { areas: dedupedAreas, areaKeys };
};
