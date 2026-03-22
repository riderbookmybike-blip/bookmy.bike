const QUOTE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isQuoteUuid = (value: string): boolean => QUOTE_UUID_REGEX.test(String(value || '').trim());

export const resolvePublicAppUrl = (): string => {
    const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'https://bookmy.bike';
    return String(raw).trim().replace(/\/+$/, '');
};

export const buildShareIdentifierCandidates = (identifier: string): string[] => {
    const normalized = String(identifier || '').trim();
    if (!normalized) return [];

    const cleanStr = normalized
        .replace(/^QT[-_ ]?/i, '')
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();
    const dashedCandidate =
        cleanStr.length === 9 ? `${cleanStr.slice(0, 3)}-${cleanStr.slice(3, 6)}-${cleanStr.slice(6, 9)}` : null;

    const rawCandidates: Array<string | null> = [
        normalized,
        normalized.toUpperCase(),
        normalized.replace(/[^A-Z0-9]/gi, '').toUpperCase(),
        cleanStr,
        dashedCandidate,
    ];

    return Array.from(new Set(rawCandidates.filter((v): v is string => Boolean(v))));
};
