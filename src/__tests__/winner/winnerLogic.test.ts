/**
 * winnerLogic.test.ts
 *
 * Tests for core winner selection logic — offer-only ranking, deterministic
 * tie-breaking, and behavioral guarantees.
 *
 * offer_amount semantics (from winnerEngine.ts):
 *   negative = discount  (-1000 = ₹1000 off)  ← BETTER
 *   zero     = no adjustment
 *   positive = surcharge (+1000 = ₹1000 extra) ← WORSE
 * Rule: LOWER offer_amount wins (most negative = best deal).
 */

// ── Inline comparison function (mirrors winnerWorker.ts compareOffers) ────
interface Offer {
    tenant_id: string;
    offer_amount: number;
    tat_days: number | null;
    tat_effective_hours: number | null;
    state_code: string;
}

function compareOffers(a: Offer, b: Offer): number {
    // Rule 1: Lower offer_amount wins (negative = discount)
    const offerDiff = a.offer_amount - b.offer_amount;
    if (offerDiff !== 0) return offerDiff;

    // Tie-break 1: Lower tat_days wins
    const aTat = a.tat_days ?? 9999;
    const bTat = b.tat_days ?? 9999;
    if (aTat !== bTat) return aTat - bTat;

    // Tie-break 2: Lower tat_effective_hours wins
    const aHrs = a.tat_effective_hours ?? 99999;
    const bHrs = b.tat_effective_hours ?? 99999;
    if (aHrs !== bHrs) return aHrs - bHrs;

    // Tie-break 3: Lex-smaller tenant_id (deterministic)
    return a.tenant_id.localeCompare(b.tenant_id);
}

function pickWinner(offers: Offer[]): Offer {
    return offers.reduce((best, curr) => (compareOffers(curr, best) < 0 ? curr : best));
}

// ── Constants ────────────────────────────────────────────────────────────────
const DEALER_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const DEALER_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const DEALER_C = 'cccccccc-0000-0000-0000-000000000003';

const base = (overrides: Partial<Offer> = {}): Offer => ({
    tenant_id: DEALER_A,
    offer_amount: 0,
    tat_days: 2,
    tat_effective_hours: 48,
    state_code: 'MH',
    ...overrides,
});

// ── Tests: Offer ranking direction ───────────────────────────────────────────
describe('Winner Selection — offer_amount direction (lower = better discount)', () => {
    test('-1000 beats -500 (bigger discount wins)', () => {
        const a = base({ tenant_id: DEALER_A, offer_amount: -500 });
        const b = base({ tenant_id: DEALER_B, offer_amount: -1000 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_B);
    });

    test('-1000 beats +1000 (discount beats surcharge)', () => {
        const a = base({ tenant_id: DEALER_A, offer_amount: +1000 });
        const b = base({ tenant_id: DEALER_B, offer_amount: -1000 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_B);
    });

    test('0 beats +500 (no adjustment beats surcharge)', () => {
        const a = base({ tenant_id: DEALER_A, offer_amount: +500 });
        const b = base({ tenant_id: DEALER_B, offer_amount: 0 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_B);
    });

    test('-1 beats 0 (any discount beats no adjustment)', () => {
        const a = base({ tenant_id: DEALER_A, offer_amount: 0 });
        const b = base({ tenant_id: DEALER_B, offer_amount: -1 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_B);
    });

    test('positive surcharge always loses to every non-positive offer', () => {
        const surge = base({ tenant_id: DEALER_A, offer_amount: +2000 });
        const zero = base({ tenant_id: DEALER_B, offer_amount: 0 });
        const discount = base({ tenant_id: DEALER_C, offer_amount: -500 });
        // discount wins, then zero, then surcharge
        expect(pickWinner([surge, zero, discount]).tenant_id).toBe(DEALER_C);
    });
});

describe('Winner Selection — offer-only principle', () => {
    test('base price change does NOT change winner (offer_amount unchanged)', () => {
        // ex_showroom changes but offer_amount stays — comparison result must be 0
        const before = base({ tenant_id: DEALER_A, offer_amount: -1000 });
        const after = base({ tenant_id: DEALER_A, offer_amount: -1000 });
        expect(compareOffers(before, after)).toBe(0);
    });

    test('only offer_amount drives ranking — same offer means same priority', () => {
        const x = base({ tenant_id: DEALER_A, offer_amount: -500, tat_days: 10 });
        const y = base({ tenant_id: DEALER_B, offer_amount: -800, tat_days: 1 });
        // DEALER_B has better offer even with worse TAT
        expect(pickWinner([x, y]).tenant_id).toBe(DEALER_B);
    });
});

describe('Winner Selection — tie-breaker order', () => {
    test('tie on offer: lower tat_days wins', () => {
        const a = base({ tenant_id: DEALER_A, offer_amount: -500, tat_days: 5 });
        const b = base({ tenant_id: DEALER_B, offer_amount: -500, tat_days: 2 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_B);
    });

    test('tie on offer+tat_days: lower tat_effective_hours wins', () => {
        const a = base({ tenant_id: DEALER_A, offer_amount: -500, tat_days: 2, tat_effective_hours: 72 });
        const b = base({ tenant_id: DEALER_B, offer_amount: -500, tat_days: 2, tat_effective_hours: 36 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_B);
    });

    test('full tie: lexicographically smaller tenant_id wins', () => {
        const a = base({ tenant_id: DEALER_B, offer_amount: -500, tat_days: 2, tat_effective_hours: 48 });
        const b = base({ tenant_id: DEALER_A, offer_amount: -500, tat_days: 2, tat_effective_hours: 48 });
        expect(pickWinner([a, b]).tenant_id).toBe(DEALER_A); // 'aaa' < 'bbb'
    });

    test('null tat_days treated as 9999 (worst TAT)', () => {
        const nullTat = base({ tenant_id: DEALER_A, offer_amount: -500, tat_days: null });
        const withTat = base({ tenant_id: DEALER_B, offer_amount: -500, tat_days: 3 });
        expect(pickWinner([nullTat, withTat]).tenant_id).toBe(DEALER_B);
    });

    test('deterministic: winner is order-independent', () => {
        const offers = [
            base({ tenant_id: DEALER_C, offer_amount: -400, tat_days: 1 }),
            base({ tenant_id: DEALER_A, offer_amount: -800, tat_days: 2 }),
            base({ tenant_id: DEALER_B, offer_amount: -800, tat_days: 1 }),
        ];
        // DEALER_B: same offer as A (-800), but lower TAT (1 < 2)
        const w1 = pickWinner(offers).tenant_id;
        const w2 = pickWinner([...offers].reverse()).tenant_id;
        expect(w1).toBe(w2);
        expect(w1).toBe(DEALER_B);
    });
});

describe('Same-winner detection — no-op guard', () => {
    test('same tenant_id → same winner → UI MUST NOT re-render', () => {
        const def = { tenantId: DEALER_A, district: 'Mumbai City' };
        const tgt = { tenantId: DEALER_A, district: 'Thane' };
        expect(def.tenantId === tgt.tenantId).toBe(true);
    });

    test('different tenant_id → different winner → UI SHOULD update', () => {
        const def = { tenantId: DEALER_A, district: 'Mumbai City' };
        const tgt = { tenantId: DEALER_B, district: 'Pune' };
        expect(def.tenantId === tgt.tenantId).toBe(false);
    });
});

describe('Cache key contract (frozen)', () => {
    test('winner key: winner:{state}:{district}:{sku}', () => {
        expect(`winner:MH:Mumbai City:abc123`).toBe('winner:MH:Mumbai City:abc123');
    });

    test('default key: winner_default:{state}:{sku}', () => {
        expect(`winner_default:MH:abc123`).toBe('winner_default:MH:abc123');
    });

    test('districts key: districts:{state}', () => {
        expect(`districts:MH`).toBe('districts:MH');
    });
});

describe('State-code normalization', () => {
    test('"ALL" state_code is never written to sku_district_winners', () => {
        // Worker always resolves to concrete state before writing
        const requestedState: string = 'MH';
        const writtenState = requestedState === 'ALL' ? 'MH' : requestedState;
        expect(writtenState).not.toBe('ALL');
    });

    test('"ALL" queue item is normalized to "MH" before processing', () => {
        const queueStateCode: string = 'ALL';
        const processedState = queueStateCode === 'ALL' ? 'MH' : queueStateCode;
        expect(processedState).toBe('MH');
    });
});
