import { shouldSkipDealerContextUpdate, shouldSkipFinanceContextUpdate } from '@/lib/marketplace/dealerSessionGuards';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

const base = {
    dealerId: 'd1',
    financeId: 'f1',
    studioId: null,
    tenantName: null,
    district: 'Pune',
    locked: false,
    source: 'DEFAULT' as const,
};

assert(shouldSkipFinanceContextUpdate(base, 'f1') === true, 'finance same value should skip');
assert(shouldSkipFinanceContextUpdate(base, 'f2') === false, 'finance changed value should not skip');
assert(shouldSkipFinanceContextUpdate(base, null) === false, 'finance clear should not skip when non-null');

assert(shouldSkipDealerContextUpdate(base, 'd1', 'Pune') === true, 'dealer same + district same should skip');
assert(shouldSkipDealerContextUpdate(base, 'd2', 'Pune') === false, 'dealer changed should not skip');
assert(shouldSkipDealerContextUpdate(base, 'd1', 'Mumbai') === false, 'district changed should not skip');

console.log('dealerSessionGuards.test.ts passed');
