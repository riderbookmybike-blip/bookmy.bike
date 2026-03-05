import { buildCanonicalLeadQuery } from '@/lib/marketplace/leadUrl';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

const unchanged = buildCanonicalLeadQuery({
    current: { lead: 'LD1234567', dealerSlug: 'dealer-a', financeSlug: 'bank-a', state: 'MH' },
    canonicalLead: 'LD1234567',
    canonicalDealerSlug: 'dealer-a',
    canonicalFinanceSlug: 'bank-a',
});
assert(unchanged.changed === false, 'should not redirect when already canonical');

const fromLegacyLeadId = buildCanonicalLeadQuery({
    current: { leadId: 'uuid-value', state: 'MH' },
    canonicalLead: 'LD1234567',
    canonicalDealerSlug: 'dealer-a',
    canonicalFinanceSlug: 'bank-a',
});
assert(fromLegacyLeadId.changed === true, 'legacy leadId should trigger canonical redirect');
assert(fromLegacyLeadId.params.get('lead') === 'LD1234567', 'lead param should be canonical display id');
assert(fromLegacyLeadId.params.get('dealerSlug') === 'dealer-a', 'dealer slug should be present');
assert(fromLegacyLeadId.params.get('financeSlug') === 'bank-a', 'finance slug should be present');

const dealerMismatch = buildCanonicalLeadQuery({
    current: { lead: 'LD1234567', dealerSlug: 'dealer-b' },
    canonicalLead: 'LD1234567',
    canonicalDealerSlug: 'dealer-a',
});
assert(dealerMismatch.changed === true, 'dealer slug mismatch should trigger redirect');

console.log('leadUrlCanonicalization.test.ts passed');
