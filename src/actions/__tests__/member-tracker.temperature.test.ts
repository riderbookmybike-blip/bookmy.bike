import { trackMemberEvent, trackAnonEvent } from '../member-tracker';
import { adminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({
    adminClient: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn().mockResolvedValue({
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-member-uuid' } },
                error: null,
            }),
        },
    }),
}));

describe('Member Tracker - Temperature Escalation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should escalate to HOT internally when visiting a PDP and call upsert first', async () => {
        await trackMemberEvent('test-member-uuid', 'PAGE_VIEW', {
            url: '/store/honda/activa-6g',
            session_id: 'test-session-id',
        });

        expect(adminClient.rpc).toHaveBeenCalledTimes(2);

        // Assert call order: first upsert_member_presence, then escalate_visitor_temperature
        expect(adminClient.rpc).toHaveBeenNthCalledWith(
            1,
            'upsert_member_presence',
            expect.objectContaining({ p_member_id: 'test-member-uuid', p_event_type: 'PAGE_VIEW' })
        );
        expect(adminClient.rpc).toHaveBeenNthCalledWith(
            2,
            'escalate_visitor_temperature',
            expect.objectContaining({
                p_member_id: 'test-member-uuid',
                p_session_id: 'test-session-id',
                p_temp: 'HOT',
            })
        );
    });

    it('should escalate to COLD when visiting catalog', async () => {
        await trackAnonEvent('550e8400-e29b-41d4-a716-446655440000', 'PAGE_VIEW', {
            url: '/store/catalog',
            session_id: '550e8400-e29b-41d4-a716-446655440000',
        });

        expect(adminClient.rpc).toHaveBeenCalledWith(
            'escalate_visitor_temperature',
            expect.objectContaining({
                p_member_id: null,
                p_session_id: '550e8400-e29b-41d4-a716-446655440000',
                p_temp: 'COLD',
            })
        );
    });

    it('should escalate to WARM when clicking a variant card', async () => {
        await trackMemberEvent('test-member-uuid', 'CARD_CLICK', { url: '/store/catalog', session_id: 'test-session' });

        expect(adminClient.rpc).toHaveBeenCalledWith(
            'escalate_visitor_temperature',
            expect.objectContaining({
                p_member_id: 'test-member-uuid',
                p_temp: 'WARM',
            })
        );
    });

    it('should NOT escalate temperature on a generic heartbeat', async () => {
        await trackMemberEvent('test-member-uuid', 'HEARTBEAT', { url: '/store/cart', session_id: 'test-session' });

        // rpc should only be called for upsert_member_presence, not escalate_visitor_temperature
        expect(adminClient.rpc).not.toHaveBeenCalledWith('escalate_visitor_temperature', expect.anything());
    });

    it('should silently handle non-UUID session_id without throwing or breaking tracking', async () => {
        // Here we simulate trackMemberEvent since trackAnonEvent rejects non-UUIDs entirely
        // Even if session_id is weirdly formatted, the trackMemberEvent should still map and insert the event
        await trackMemberEvent('test-member-uuid', 'PAGE_VIEW', {
            url: '/store/catalog',
            session_id: 'not-a-uuid-just-text',
        });

        expect(adminClient.rpc).toHaveBeenCalledTimes(2);
        expect(adminClient.rpc).toHaveBeenNthCalledWith(1, 'upsert_member_presence', expect.anything());
        expect(adminClient.rpc).toHaveBeenNthCalledWith(
            2,
            'escalate_visitor_temperature',
            expect.objectContaining({
                p_session_id: 'not-a-uuid-just-text',
                p_temp: 'COLD',
            })
        );
    });

    it('should escalate to HOT directly on PDP_ACTIVITY event (core bug fix)', async () => {
        // PDP_ACTIVITY is the event fired by MemberTracker.trackSurfaceActivity()
        // when a user navigates to /store/honda/activa-6g — NOT PAGE_VIEW.
        // This test validates the critical fix: PDP_ACTIVITY must trigger HOT escalation.
        await trackMemberEvent('test-member-uuid', 'PDP_ACTIVITY', {
            url: '/store/honda/activa-6g',
            surface: 'pdp',
            session_id: 'test-session-id',
        });

        expect(adminClient.rpc).toHaveBeenCalledWith(
            'escalate_visitor_temperature',
            expect.objectContaining({
                p_member_id: 'test-member-uuid',
                p_temp: 'HOT',
            })
        );
    });

    it('should escalate to COLD on CATALOG_ACTIVITY event', async () => {
        await trackMemberEvent('test-member-uuid', 'CATALOG_ACTIVITY', {
            url: '/store/catalog',
            surface: 'catalog',
            session_id: 'test-session-id',
        });

        expect(adminClient.rpc).toHaveBeenCalledWith(
            'escalate_visitor_temperature',
            expect.objectContaining({
                p_member_id: 'test-member-uuid',
                p_temp: 'COLD',
            })
        );
    });
});
