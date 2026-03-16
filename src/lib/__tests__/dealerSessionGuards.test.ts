import { shouldSkipDealerContextUpdate, shouldSkipFinanceContextUpdate } from '@/lib/marketplace/dealerSessionGuards';

const base = {
    dealerId: 'd1',
    financeId: 'f1',
    studioId: null,
    tenantName: null,
    district: 'Pune',
    locked: false,
    source: 'DEFAULT' as const,
};

describe('shouldSkipFinanceContextUpdate', () => {
    it('skips when finance value is unchanged', () => {
        expect(shouldSkipFinanceContextUpdate(base, 'f1')).toBe(true);
    });

    it('does not skip when finance value changes', () => {
        expect(shouldSkipFinanceContextUpdate(base, 'f2')).toBe(false);
    });

    it('does not skip when clearing a non-null finance', () => {
        expect(shouldSkipFinanceContextUpdate(base, null)).toBe(false);
    });
});

describe('shouldSkipDealerContextUpdate', () => {
    it('skips when dealer and district are unchanged', () => {
        expect(shouldSkipDealerContextUpdate(base, 'd1', 'Pune')).toBe(true);
    });

    it('does not skip when dealer changes', () => {
        expect(shouldSkipDealerContextUpdate(base, 'd2', 'Pune')).toBe(false);
    });

    it('does not skip when district changes', () => {
        expect(shouldSkipDealerContextUpdate(base, 'd1', 'Mumbai')).toBe(false);
    });
});
