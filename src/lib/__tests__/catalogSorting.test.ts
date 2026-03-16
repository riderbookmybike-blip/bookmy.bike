import { safeNum, getCatalogComparator, sortCatalogVehicles } from '../store/catalogSort';
import type { SortKey } from '../store/catalogSort';

// Minimal vehicle factory
function vehicle(overrides: Record<string, unknown> = {}) {
    return {
        popularityScore: 0,
        price: { onRoad: 0, exShowroom: 0 },
        specifications: { engine: {}, dimensions: {} },
        ...overrides,
    };
}

describe('safeNum', () => {
    it('parses a plain number', () => {
        expect(safeNum(42)).toBe(42);
    });

    it('parses a numeric string', () => {
        expect(safeNum('165')).toBe(165);
    });

    it('parses a string with units (e.g. "165mm")', () => {
        expect(safeNum('165mm')).toBe(165);
    });

    it('returns fallback for null', () => {
        expect(safeNum(null, 99)).toBe(99);
    });

    it('returns fallback for undefined', () => {
        expect(safeNum(undefined, 99)).toBe(99);
    });

    it('returns fallback for empty string', () => {
        expect(safeNum('', 99)).toBe(99);
    });

    it('returns fallback for non-numeric string', () => {
        expect(safeNum('abc', 99)).toBe(99);
    });

    it('returns 0 as default fallback', () => {
        expect(safeNum(null)).toBe(0);
    });
});

describe('getCatalogComparator', () => {
    describe('popular sort', () => {
        it('sorts by popularity descending', () => {
            const a = vehicle({ popularityScore: 10 });
            const b = vehicle({ popularityScore: 50 });
            const cmp = getCatalogComparator('popular');
            expect(cmp(a, b)).toBeGreaterThan(0); // b before a
            expect(cmp(b, a)).toBeLessThan(0);
        });
    });

    describe('price sort', () => {
        it('sorts by on-road price ascending', () => {
            const a = vehicle({ price: { onRoad: 80000, exShowroom: 70000 } });
            const b = vehicle({ price: { onRoad: 120000, exShowroom: 100000 } });
            const cmp = getCatalogComparator('price');
            expect(cmp(a, b)).toBeLessThan(0); // a before b (cheaper first)
        });

        it('falls back to exShowroom if onRoad is 0', () => {
            const a = vehicle({ price: { onRoad: 0, exShowroom: 70000 } });
            const b = vehicle({ price: { onRoad: 0, exShowroom: 50000 } });
            const cmp = getCatalogComparator('price');
            expect(cmp(a, b)).toBeGreaterThan(0); // b before a
        });
    });

    describe('mileage sort', () => {
        it('sorts highest mileage first', () => {
            const a = vehicle({ specifications: { engine: { mileage: 45 }, dimensions: {} } });
            const b = vehicle({ specifications: { engine: { mileage: 65 }, dimensions: {} } });
            const cmp = getCatalogComparator('mileage');
            expect(cmp(a, b)).toBeGreaterThan(0); // b (65) before a (45)
        });

        it('handles string mileage with units', () => {
            const a = vehicle({ specifications: { engine: { mileage: '55 km/l' }, dimensions: {} } });
            const b = vehicle({ specifications: { engine: { mileage: '40 km/l' }, dimensions: {} } });
            const cmp = getCatalogComparator('mileage');
            expect(cmp(a, b)).toBeLessThan(0); // a (55) before b (40)
        });

        it('puts missing mileage at bottom (fallback 0 → lowest "best" mileage)', () => {
            const a = vehicle({ specifications: { engine: { mileage: 50 }, dimensions: {} } });
            const b = vehicle({ specifications: { engine: {}, dimensions: {} } });
            const cmp = getCatalogComparator('mileage');
            expect(cmp(a, b)).toBeLessThan(0); // a (50) before b (0)
        });
    });

    describe('seatHeight sort', () => {
        it('sorts lowest seat height first', () => {
            const a = vehicle({ specifications: { engine: {}, dimensions: { seatHeight: 800 } } });
            const b = vehicle({ specifications: { engine: {}, dimensions: { seatHeight: 760 } } });
            const cmp = getCatalogComparator('seatHeight');
            expect(cmp(a, b)).toBeGreaterThan(0); // b (760) before a (800)
        });

        it('puts missing seatHeight at bottom (Infinity fallback)', () => {
            const a = vehicle({ specifications: { engine: {}, dimensions: { seatHeight: 790 } } });
            const b = vehicle({ specifications: { engine: {}, dimensions: {} } });
            const cmp = getCatalogComparator('seatHeight');
            expect(cmp(a, b)).toBeLessThan(0); // a before b (Infinity)
        });

        it('handles null seatHeight', () => {
            const a = vehicle({ specifications: { engine: {}, dimensions: { seatHeight: null } } });
            const b = vehicle({ specifications: { engine: {}, dimensions: { seatHeight: 780 } } });
            const cmp = getCatalogComparator('seatHeight');
            expect(cmp(a, b)).toBeGreaterThan(0); // b before a (a is Infinity)
        });
    });

    describe('kerbWeight sort', () => {
        it('sorts lightest first', () => {
            const a = vehicle({ specifications: { engine: {}, dimensions: { kerbWeight: 130 } } });
            const b = vehicle({ specifications: { engine: {}, dimensions: { kerbWeight: 110 } } });
            const cmp = getCatalogComparator('kerbWeight');
            expect(cmp(a, b)).toBeGreaterThan(0); // b (110) before a (130)
        });

        it('puts missing kerbWeight at bottom (Infinity fallback)', () => {
            const a = vehicle({ specifications: { engine: {}, dimensions: { kerbWeight: 120 } } });
            const b = vehicle({ specifications: { engine: {}, dimensions: {} } });
            const cmp = getCatalogComparator('kerbWeight');
            expect(cmp(a, b)).toBeLessThan(0); // a before b (Infinity)
        });

        it('handles string weight like "135 kg"', () => {
            const a = vehicle({ specifications: { engine: {}, dimensions: { kerbWeight: '135 kg' } } });
            const b = vehicle({ specifications: { engine: {}, dimensions: { kerbWeight: '110 kg' } } });
            const cmp = getCatalogComparator('kerbWeight');
            expect(cmp(a, b)).toBeGreaterThan(0); // b (110) before a (135)
        });
    });
});

describe('sortCatalogVehicles', () => {
    it('returns the same array reference (in-place sort)', () => {
        const arr = [vehicle({ popularityScore: 1 }), vehicle({ popularityScore: 2 })];
        const result = sortCatalogVehicles(arr, 'popular');
        expect(result).toBe(arr);
    });

    it('correctly sorts multiple vehicles by mileage', () => {
        const vehicles = [
            vehicle({ specifications: { engine: { mileage: 40 }, dimensions: {} } }),
            vehicle({ specifications: { engine: { mileage: 65 }, dimensions: {} } }),
            vehicle({ specifications: { engine: {}, dimensions: {} } }),
            vehicle({ specifications: { engine: { mileage: 55 }, dimensions: {} } }),
        ];
        sortCatalogVehicles(vehicles, 'mileage');
        expect(vehicles.map(v => safeNum((v.specifications as any)?.engine?.mileage))).toEqual([65, 55, 40, 0]);
    });

    it('handles empty array', () => {
        const result = sortCatalogVehicles([], 'price');
        expect(result).toEqual([]);
    });

    it('handles unknown sort key gracefully (no-op)', () => {
        const vehicles = [vehicle({ popularityScore: 1 }), vehicle({ popularityScore: 2 })];
        const copy = [...vehicles];
        sortCatalogVehicles(vehicles, 'unknownKey' as SortKey);
        // Should not crash, order may be unchanged
        expect(vehicles.length).toBe(copy.length);
    });
});
