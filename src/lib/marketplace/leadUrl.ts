export type LeadCanonicalInput = {
    current: Record<string, string | undefined>;
    canonicalLead: string;
    canonicalDealerSlug?: string | null;
    canonicalFinanceSlug?: string | null;
};

export function buildCanonicalLeadQuery(input: LeadCanonicalInput): { changed: boolean; params: URLSearchParams } {
    const { current, canonicalLead, canonicalDealerSlug, canonicalFinanceSlug } = input;

    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(current)) {
        if (value == null) continue;
        if (key === 'leadId' || key === 'lead' || key === 'dealerSlug' || key === 'financeSlug') continue;
        next.set(key, String(value));
    }
    next.set('lead', canonicalLead);
    if (canonicalDealerSlug) next.set('dealerSlug', canonicalDealerSlug);
    if (canonicalFinanceSlug) next.set('financeSlug', canonicalFinanceSlug);

    const changed =
        current.lead !== canonicalLead ||
        Boolean(current.leadId) ||
        (canonicalDealerSlug ? current.dealerSlug !== canonicalDealerSlug : false) ||
        (canonicalFinanceSlug ? current.financeSlug !== canonicalFinanceSlug : false);

    return { changed, params: next };
}
