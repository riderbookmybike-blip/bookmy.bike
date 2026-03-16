/**
 * Guard test: getEmiFactor invalid tenure fallback
 *
 * Validates that unrecognized tenure values (e.g. 37) fall back to
 * the DEFAULT_EMI_TENURE (36) factor. This is a known risk area since
 * tenure is URL-derived and not range-validated upstream.
 */

import { getEmiFactor, EMI_FACTORS, DEFAULT_EMI_TENURE, IDV_DEPRECIATION_RATE } from '../constants/pricingConstants';

describe('pricingConstants', () => {
    describe('getEmiFactor', () => {
        it('returns exact factor for each valid tenure', () => {
            for (const [tenure, factor] of Object.entries(EMI_FACTORS)) {
                expect(getEmiFactor(Number(tenure))).toBe(factor);
            }
        });

        it('falls back to 36-month factor for invalid tenure 37', () => {
            const fallback = EMI_FACTORS[DEFAULT_EMI_TENURE];
            expect(getEmiFactor(37)).toBe(fallback);
        });

        it.each([0, -1, 99, NaN])('falls back to default for invalid tenure %s', tenure => {
            const fallback = EMI_FACTORS[DEFAULT_EMI_TENURE];
            expect(getEmiFactor(tenure)).toBe(fallback);
        });
    });

    it('IDV_DEPRECIATION_RATE is exactly 0.95', () => {
        expect(IDV_DEPRECIATION_RATE).toBe(0.95);
    });

    it('DEFAULT_EMI_TENURE is 36', () => {
        expect(DEFAULT_EMI_TENURE).toBe(36);
    });

    it('all EMI factors are positive and less than 1', () => {
        for (const [tenure, factor] of Object.entries(EMI_FACTORS)) {
            expect(factor).toBeGreaterThan(0);
            expect(factor).toBeLessThan(1);
        }
    });
});
