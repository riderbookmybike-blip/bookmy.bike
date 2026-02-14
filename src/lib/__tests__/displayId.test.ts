// @ts-nocheck
/**
 * Display ID Generator Tests
 */

import { generateDisplayId, validateDisplayId, parseDisplayId, formatDisplayId } from '../displayId';

describe('Display ID Generator', () => {
    test('generates 9-character ID', () => {
        const id = generateDisplayId();
        expect(id).toHaveLength(9);
    });

    test('only uses allowed characters', () => {
        const allowedChars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        const id = generateDisplayId();

        for (const char of id) {
            expect(allowedChars).toContain(char);
        }
    });

    test('excludes confusing characters', () => {
        const confusingChars = ['0', 'O', 'I', '1', 'L'];
        const id = generateDisplayId();

        for (const char of confusingChars) {
            expect(id).not.toContain(char);
        }
    });

    test('generates unique IDs', () => {
        const ids = new Set();
        const count = 10000;

        for (let i = 0; i < count; i++) {
            ids.add(generateDisplayId());
        }

        // Should have no duplicates
        expect(ids.size).toBe(count);
    });

    test('validates correct ID', () => {
        const id = generateDisplayId();
        expect(validateDisplayId(id)).toBe(true);
    });

    test('rejects invalid length', () => {
        expect(validateDisplayId('ABC')).toBe(false);
        expect(validateDisplayId('ABCDEFGHIJ')).toBe(false);
    });

    test('rejects invalid characters', () => {
        expect(validateDisplayId('ABC0EFGHI')).toBe(false); // Contains 0
        expect(validateDisplayId('ABCOEFGHI')).toBe(false); // Contains O
        expect(validateDisplayId('ABC1EFGHI')).toBe(false); // Contains 1
    });

    test('rejects invalid checksum', () => {
        const id = generateDisplayId();
        const tampered = id.substring(0, 8) + 'X'; // Change checksum
        expect(validateDisplayId(tampered)).toBe(false);
    });

    test('parses timestamp correctly', () => {
        const id = generateDisplayId();
        const parsedDate = parseDisplayId(id);

        expect(parsedDate).toBeInstanceOf(Date);

        // Should be within ~12 days of now
        const now = new Date();
        const diffDays = Math.abs(now.getTime() - parsedDate!.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeLessThan(12);
    });

    test('formats with prefix', () => {
        const id = generateDisplayId();
        const formatted = formatDisplayId(id, 'LEAD');
        expect(formatted).toBe(`LEAD #${id}`);
    });

    test('formats without prefix', () => {
        const id = generateDisplayId();
        const formatted = formatDisplayId(id);
        expect(formatted).toBe(id);
    });

    test('performance: generates 1000 IDs quickly', () => {
        const start = Date.now();

        for (let i = 0; i < 1000; i++) {
            generateDisplayId();
        }

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(100); // Should take < 100ms
    });
});
