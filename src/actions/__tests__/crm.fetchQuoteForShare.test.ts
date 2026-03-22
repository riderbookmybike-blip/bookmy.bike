jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
    adminClient: {
        from: jest.fn(),
    },
}));

import { adminClient } from '@/lib/supabase/admin';
import { fetchQuoteForShare } from '../crm';

type QueryBuilder = {
    select: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
};

const makeBuilder = (result: { data: any; error?: any }): QueryBuilder => {
    const builder = {
        select: jest.fn(),
        eq: jest.fn(),
        in: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
        maybeSingle: jest.fn().mockResolvedValue(result),
    } as unknown as QueryBuilder;

    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.in.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.limit.mockReturnValue(builder);
    return builder;
};

describe('fetchQuoteForShare', () => {
    const fromMock = adminClient.from as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves by UUID first and skips display_id fallback when found', async () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const uuidRecord = { id: uuid, display_id: 'XY5R6E2EN' };

        const uuidBuilder = makeBuilder({ data: uuidRecord, error: null });
        fromMock.mockReturnValueOnce(uuidBuilder);

        const out = await fetchQuoteForShare(uuid);

        expect(out).toEqual(uuidRecord);
        expect(fromMock).toHaveBeenCalledTimes(1);
        expect(uuidBuilder.eq).toHaveBeenCalledWith('id', uuid);
        expect(uuidBuilder.maybeSingle).toHaveBeenCalledTimes(1);
    });

    it('falls back to display_id candidates when UUID lookup misses', async () => {
        const input = '550e8400-e29b-41d4-a716-446655440001';
        const displayRecord = { id: 'd9e7836c-3c20-4dd1-9047-f2dce9d4bc0e', display_id: input };

        const uuidBuilder = makeBuilder({ data: null, error: null });
        const displayBuilder = makeBuilder({ data: displayRecord, error: null });

        fromMock.mockReturnValueOnce(uuidBuilder).mockReturnValueOnce(displayBuilder);

        const out = await fetchQuoteForShare(input);

        expect(out).toEqual(displayRecord);
        expect(fromMock).toHaveBeenCalledTimes(2);
        expect(displayBuilder.in).toHaveBeenCalledWith(
            'display_id',
            expect.arrayContaining([input, input.toUpperCase()])
        );
        expect(displayBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('uses display_id lookup only for non-UUID identifiers', async () => {
        const input = 'QT-XY5-R6E-2EN';
        const displayRecord = { id: 'd9e7836c-3c20-4dd1-9047-f2dce9d4bc0e', display_id: 'XY5-R6E-2EN' };

        const displayBuilder = makeBuilder({ data: displayRecord, error: null });
        fromMock.mockReturnValueOnce(displayBuilder);

        const out = await fetchQuoteForShare(input);

        expect(out).toEqual(displayRecord);
        expect(fromMock).toHaveBeenCalledTimes(1);
        expect(displayBuilder.in).toHaveBeenCalledWith(
            'display_id',
            expect.arrayContaining([input, 'QTXY5R6E2EN', 'XY5R6E2EN', 'XY5-R6E-2EN'])
        );
        expect(displayBuilder.eq).not.toHaveBeenCalledWith('id', expect.any(String));
    });
});
