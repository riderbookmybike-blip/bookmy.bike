const DEFAULT_PUBLIC_BASE_URL = 'https://bookmy.bike';

function normalizeBaseUrl(input?: string | null): string {
    const raw = String(input || '').trim();
    if (!raw) return DEFAULT_PUBLIC_BASE_URL;

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
        const parsed = new URL(withProtocol);
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') return DEFAULT_PUBLIC_BASE_URL;
        return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
    } catch {
        return DEFAULT_PUBLIC_BASE_URL;
    }
}

export function getPublicBaseUrl(): string {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_ROOT_DOMAIN || null);
}

export function buildPublicUrl(path: string): string {
    const normalizedPath = String(path || '/').startsWith('/') ? String(path || '/') : `/${String(path || '')}`;
    return `${getPublicBaseUrl()}${normalizedPath}`;
}
