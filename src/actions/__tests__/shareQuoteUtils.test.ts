import { buildShareIdentifierCandidates, isQuoteUuid, resolvePublicAppUrl } from '../shareQuoteUtils';

describe('shareQuoteUtils', () => {
    describe('isQuoteUuid', () => {
        it('returns true for valid UUID', () => {
            expect(isQuoteUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        });

        it('returns false for display id', () => {
            expect(isQuoteUuid('XY5R6E2EN')).toBe(false);
            expect(isQuoteUuid('XY5-R6E-2EN')).toBe(false);
        });
    });

    describe('buildShareIdentifierCandidates', () => {
        it('builds robust candidates for compact display id', () => {
            const out = buildShareIdentifierCandidates('xy5r6e2en');
            expect(out).toEqual(expect.arrayContaining(['xy5r6e2en', 'XY5R6E2EN', 'XY5-R6E-2EN']));
        });

        it('normalizes QT prefixed references', () => {
            const out = buildShareIdentifierCandidates('QT-xy5-r6e-2en');
            expect(out).toEqual(expect.arrayContaining(['QT-xy5-r6e-2en', 'XY5R6E2EN', 'XY5-R6E-2EN']));
        });
    });

    describe('resolvePublicAppUrl', () => {
        const oldNextPublic = process.env.NEXT_PUBLIC_APP_URL;
        const oldPublic = process.env.PUBLIC_APP_URL;

        afterEach(() => {
            if (oldNextPublic === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
            else process.env.NEXT_PUBLIC_APP_URL = oldNextPublic;

            if (oldPublic === undefined) delete process.env.PUBLIC_APP_URL;
            else process.env.PUBLIC_APP_URL = oldPublic;
        });

        it('prioritizes NEXT_PUBLIC_APP_URL and trims trailing slash', () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://preview.bookmy.bike/';
            process.env.PUBLIC_APP_URL = 'https://fallback.bookmy.bike';
            expect(resolvePublicAppUrl()).toBe('https://preview.bookmy.bike');
        });

        it('falls back to PUBLIC_APP_URL', () => {
            delete process.env.NEXT_PUBLIC_APP_URL;
            process.env.PUBLIC_APP_URL = 'https://staging.bookmy.bike/';
            expect(resolvePublicAppUrl()).toBe('https://staging.bookmy.bike');
        });
    });
});
