import { buildCanonicalLeadQuery } from '@/lib/marketplace/leadUrl';

describe('buildCanonicalLeadQuery', () => {
    it('returns changed=false when already canonical', () => {
        const result = buildCanonicalLeadQuery({
            current: { lead: 'LD1234567', dealerSlug: 'dealer-a', financeSlug: 'bank-a', state: 'MH' },
            canonicalLead: 'LD1234567',
            canonicalDealerSlug: 'dealer-a',
            canonicalFinanceSlug: 'bank-a',
        });
        expect(result.changed).toBe(false);
    });

    it('redirects legacy leadId to canonical display id', () => {
        const result = buildCanonicalLeadQuery({
            current: { leadId: 'uuid-value', state: 'MH' },
            canonicalLead: 'LD1234567',
            canonicalDealerSlug: 'dealer-a',
            canonicalFinanceSlug: 'bank-a',
        });
        expect(result.changed).toBe(true);
        expect(result.params.get('lead')).toBe('LD1234567');
        expect(result.params.get('dealerSlug')).toBe('dealer-a');
        expect(result.params.get('financeSlug')).toBe('bank-a');
    });

    it('triggers redirect on dealer slug mismatch', () => {
        const result = buildCanonicalLeadQuery({
            current: { lead: 'LD1234567', dealerSlug: 'dealer-b' },
            canonicalLead: 'LD1234567',
            canonicalDealerSlug: 'dealer-a',
        });
        expect(result.changed).toBe(true);
    });
});
