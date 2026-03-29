import { isEvFuelBucket, reconcileFuelSplit } from '@/lib/vahan/segmentation';

describe('vahan segmentation guards', () => {
    test.each([
        ['EV', true],
        ['ELECTRIC(BOV)', true],
        ['PURE EV', true],
        ['BEV', true],
        ['NON-EV', false],
        ['NON EV', false],
        ['ICE', false],
        ['', false],
    ])('isEvFuelBucket(%s) => %s', (bucket, expected) => {
        expect(isEvFuelBucket(bucket)).toBe(expected);
    });

    test('reconcileFuelSplit keeps pure EV brands EV-only', () => {
        expect(reconcileFuelSplit(4960, 132, 'EV')).toEqual({ ev_units: 4960, ice_units: 0 });
    });

    test('reconcileFuelSplit keeps mixed brands bounded by total', () => {
        expect(reconcileFuelSplit(100, 120, 'MIXED')).toEqual({ ev_units: 100, ice_units: 0 });
        expect(reconcileFuelSplit(100, 40, 'MIXED')).toEqual({ ev_units: 40, ice_units: 60 });
    });
});
