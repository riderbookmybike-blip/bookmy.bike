/**
 * Guard test: getEmiFactor invalid tenure fallback
 *
 * Validates that unrecognized tenure values (e.g. 37) fall back to
 * the DEFAULT_EMI_TENURE (36) factor. This is a known risk area since
 * tenure is URL-derived and not range-validated upstream.
 *
 * Run:  npx tsx src/lib/__tests__/pricingConstants.test.ts
 */

import { getEmiFactor, EMI_FACTORS, DEFAULT_EMI_TENURE, IDV_DEPRECIATION_RATE } from '../constants/pricingConstants';

// ── Helpers ──────────────────────────────────────────
function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${msg}`);
        process.exit(1);
    }
    console.log(`✅ PASS: ${msg}`);
}

// ── Tests ────────────────────────────────────────────

// 1. Valid tenures return their exact factor
for (const [tenure, factor] of Object.entries(EMI_FACTORS)) {
    const t = Number(tenure);
    assert(getEmiFactor(t) === factor, `getEmiFactor(${t}) === ${factor}`);
}

// 2. Invalid tenure (37) falls back to 36-month factor
const fallback = EMI_FACTORS[DEFAULT_EMI_TENURE];
assert(getEmiFactor(37) === fallback, `getEmiFactor(37) falls back to ${fallback} (36-month)`);

// 3. Other invalid tenures also fall back
assert(getEmiFactor(0) === fallback, 'getEmiFactor(0) falls back');
assert(getEmiFactor(-1) === fallback, 'getEmiFactor(-1) falls back');
assert(getEmiFactor(99) === fallback, 'getEmiFactor(99) falls back');
assert(getEmiFactor(NaN) === fallback, 'getEmiFactor(NaN) falls back');

// 4. IDV depreciation rate is exactly 0.95
assert(IDV_DEPRECIATION_RATE === 0.95, 'IDV_DEPRECIATION_RATE === 0.95');

// 5. DEFAULT_EMI_TENURE is 36
assert(DEFAULT_EMI_TENURE === 36, 'DEFAULT_EMI_TENURE === 36');

// 6. All EMI factors are positive and < 1
for (const [tenure, factor] of Object.entries(EMI_FACTORS)) {
    assert(factor > 0 && factor < 1, `EMI_FACTORS[${tenure}] = ${factor} is in (0, 1)`);
}

console.log('\n🎉 All pricingConstants guard tests passed.');
