import { POST } from '../route';

const fromMock = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
    adminClient: {
        from: (...args: unknown[]) => fromMock(...args),
    },
}));

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) => ({
            status: init?.status ?? 200,
            body,
        }),
    },
}));

type SelectBuilder = {
    select: jest.Mock;
    in: jest.Mock;
    eq: jest.Mock;
    is: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
};

type UpdateBuilder = {
    update: jest.Mock;
    eq: jest.Mock;
};

function makeSelectBuilder(result: { data: { id: string } | null; error: { message: string } | null }): SelectBuilder {
    const b = {} as SelectBuilder;
    b.select = jest.fn().mockReturnValue(b);
    b.in = jest.fn().mockReturnValue(b);
    b.eq = jest.fn().mockReturnValue(b);
    b.is = jest.fn().mockReturnValue(b);
    b.order = jest.fn().mockReturnValue(b);
    b.limit = jest.fn().mockReturnValue(b);
    b.maybeSingle = jest.fn().mockResolvedValue(result);
    return b;
}

function makeUpdateBuilder(
    result: { error: { message: string } | null },
    payloadSink: Array<Record<string, unknown>>
): UpdateBuilder {
    return {
        update: jest.fn().mockImplementation((payload: Record<string, unknown>) => {
            payloadSink.push(payload);
            return {
                eq: jest.fn().mockResolvedValue(result),
            };
        }),
        eq: jest.fn(),
    };
}

function makeReq(body: unknown, secret = 'test-secret') {
    return {
        json: async () => body,
        nextUrl: {
            searchParams: new URLSearchParams(`secret=${secret}`),
        },
        headers: {
            get: () => null,
        },
    } as any;
}

describe('MSG91 webhook route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.MSG91_WEBHOOK_SECRET = 'test-secret';
    });

    test('updates delivered_at for matched phone variants and enforces null-only idempotency check', async () => {
        const updates: Array<Record<string, unknown>> = [];
        const selectBuilder = makeSelectBuilder({ data: { id: 'row-1' }, error: null });
        const updateBuilder = makeUpdateBuilder({ error: null }, updates);

        fromMock.mockReturnValueOnce(selectBuilder).mockReturnValueOnce(updateBuilder);

        const res = await POST(
            makeReq({
                to: '919876543210',
                status: 'delivered',
                timestamp: '2026-03-24T12:00:00.000Z',
            })
        );

        expect(selectBuilder.in).toHaveBeenCalledWith('phone', ['9876543210', '919876543210', '+919876543210']);
        expect(selectBuilder.is).toHaveBeenCalledWith('delivered_at', null);
        expect(updates).toEqual([{ delivered_at: '2026-03-24T12:00:00.000Z' }]);
        expect((res as unknown as { body: { delivered: number } }).body.delivered).toBe(1);
    });

    test('marks failed-family statuses as FAILED without delivered/read null-check', async () => {
        const updates: Array<Record<string, unknown>> = [];
        const selectBuilder = makeSelectBuilder({ data: { id: 'row-2' }, error: null });
        const updateBuilder = makeUpdateBuilder({ error: null }, updates);

        fromMock.mockReturnValueOnce(selectBuilder).mockReturnValueOnce(updateBuilder);

        const res = await POST(
            makeReq({
                phone: '9876543210',
                status: 'bounced',
                timestamp: '2026-03-24T12:05:00.000Z',
            })
        );

        expect(selectBuilder.is).not.toHaveBeenCalled();
        expect(updates).toEqual([{ send_status: 'FAILED' }]);
        expect((res as unknown as { body: { failed: number } }).body.failed).toBe(1);
    });

    test('skips unknown statuses safely', async () => {
        const res = await POST(
            makeReq({
                to: '919876543210',
                status: 'submitted',
            })
        );

        expect(fromMock).not.toHaveBeenCalled();
        expect((res as unknown as { body: { skipped: number; processed: number } }).body).toMatchObject({
            processed: 1,
            skipped: 1,
        });
    });
});
