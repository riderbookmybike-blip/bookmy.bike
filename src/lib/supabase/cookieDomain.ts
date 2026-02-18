const BOOKMY_BIKE_DOMAIN = '.bookmy.bike';

function normalizeHostname(hostname: string): string {
    return hostname.trim().toLowerCase().split(':')[0];
}

export function resolveCookieDomain(hostname: string, configuredDomain?: string): string | undefined {
    const normalizedHost = normalizeHostname(hostname);
    const explicitDomain = configuredDomain?.trim();

    if (explicitDomain) {
        return explicitDomain.startsWith('.') ? explicitDomain : `.${explicitDomain}`;
    }

    if (normalizedHost === 'bookmy.bike' || normalizedHost.endsWith('.bookmy.bike')) {
        return BOOKMY_BIKE_DOMAIN;
    }

    return undefined;
}
