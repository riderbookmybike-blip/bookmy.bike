/**
 * Pure dealer-session resolution logic.
 *
 * Extracted from `useDealerSession` so it can be unit-tested in a Node
 * environment without mounting the React hook.
 */

export interface StoredDealerContext {
    dealerId?: string | null;
    financeId?: string | null;
    studioId?: string | null;
    tenantName?: string | null;
    district?: string | null;
}

export interface UrlOverrideParams {
    leadId?: string | null;
    dealerId?: string | null;
    studio?: string | null;
}

export interface ResolvedDealerSession {
    dealerId: string | null;
    financeId: string | null;
    studioId: string | null;
    tenantName: string | null;
    district: string | null;
    locked: boolean;
    source: 'URL' | 'STORAGE' | 'PRIMARY' | 'DEFAULT' | 'NONE';
    /** True when this result should be applied immediately (without a server call). */
    shortCircuit: boolean;
}

/**
 * Decides whether to restore from `localStorage` without hitting the server,
 * or whether a URL override requires a full server resolution.
 *
 * Returns `shortCircuit: true` when the stored context is sufficient.
 */
export function resolveSessionLocally(
    storedContext: StoredDealerContext | null,
    urlParams: UrlOverrideParams
): ResolvedDealerSession | null {
    const hasUrlOverride = !!(urlParams.leadId || urlParams.dealerId || urlParams.studio);

    // MANUAL SELECTION PERSISTENCE PATH
    // Has stored dealerId and no URL forcing a different context → restore stored.
    if (!hasUrlOverride && storedContext?.dealerId) {
        return {
            dealerId: storedContext.dealerId,
            financeId: storedContext.financeId ?? null,
            studioId: storedContext.studioId ?? null,
            tenantName: storedContext.tenantName ?? null,
            district: storedContext.district ?? null,
            locked: false,
            source: 'STORAGE',
            shortCircuit: true,
        };
    }

    // Needs server resolution — caller should call getResolvedPricingContextAction.
    return null;
}

/**
 * Builds the final `DealerSession` from a server-resolved context,
 * merged with the locally-stored `financeId`.
 */
export function buildSessionFromServerContext(
    serverContext: {
        dealerId: string | null;
        tenantName: string | null;
        district: string | null;
        source: string;
    },
    storedContext: StoredDealerContext | null,
    urlParams: UrlOverrideParams
): ResolvedDealerSession {
    const source: ResolvedDealerSession['source'] =
        serverContext.source === 'EXPLICIT' || serverContext.source.startsWith('PRIMARY')
            ? serverContext.source === 'EXPLICIT'
                ? 'URL'
                : 'PRIMARY'
            : storedContext && !urlParams.leadId && !urlParams.dealerId
              ? 'STORAGE'
              : 'DEFAULT';

    return {
        dealerId: serverContext.dealerId,
        financeId: storedContext?.financeId ?? null,
        studioId: null,
        tenantName: serverContext.tenantName,
        district: serverContext.district,
        locked: !!urlParams.leadId,
        source,
        shortCircuit: false,
    };
}
