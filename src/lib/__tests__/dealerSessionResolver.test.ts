import { resolveSessionLocally, buildSessionFromServerContext } from '@/lib/marketplace/dealerSessionResolver';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const stored = {
    dealerId: 'dealer-abc',
    financeId: 'finance-xyz',
    studioId: null,
    tenantName: 'Rathore Motors',
    district: 'Pune',
};

const noUrlParams = { leadId: null, dealerId: null, studio: null };

// ─── resolveSessionLocally ─────────────────────────────────────────────────────

describe('resolveSessionLocally', () => {
    // Path 1: stored context + no URL overrides → short-circuit restore
    describe('stored context restore path', () => {
        it('returns a STORAGE session when dealerId is stored and no URL params', () => {
            const result = resolveSessionLocally(stored, noUrlParams);

            expect(result).not.toBeNull();
            expect(result!.shortCircuit).toBe(true);
            expect(result!.source).toBe('STORAGE');
            expect(result!.dealerId).toBe('dealer-abc');
            expect(result!.financeId).toBe('finance-xyz');
            expect(result!.tenantName).toBe('Rathore Motors');
            expect(result!.district).toBe('Pune');
            expect(result!.locked).toBe(false);
        });

        it('includes financeId from stored context', () => {
            const result = resolveSessionLocally({ dealerId: 'dealer-abc', financeId: 'finance-xyz' }, noUrlParams);
            expect(result!.financeId).toBe('finance-xyz');
        });

        it('handles null financeId gracefully', () => {
            const result = resolveSessionLocally({ dealerId: 'dealer-abc', financeId: null }, noUrlParams);
            expect(result!.financeId).toBeNull();
        });

        it('handles missing optional fields gracefully', () => {
            const result = resolveSessionLocally({ dealerId: 'dealer-abc' }, noUrlParams);
            expect(result!.studioId).toBeNull();
            expect(result!.tenantName).toBeNull();
            expect(result!.district).toBeNull();
        });
    });

    // Path 2: URL override → requires server resolution (returns null)
    describe('URL override precedence path', () => {
        it('returns null when lead_id is present (server resolution required)', () => {
            const result = resolveSessionLocally(stored, { leadId: 'lead-001', dealerId: null, studio: null });
            expect(result).toBeNull();
        });

        it('returns null when dealer_id URL param is present', () => {
            const result = resolveSessionLocally(stored, { leadId: null, dealerId: 'url-dealer', studio: null });
            expect(result).toBeNull();
        });

        it('returns null when studio URL param is present', () => {
            const result = resolveSessionLocally(stored, { leadId: null, dealerId: null, studio: 'SUZ001' });
            expect(result).toBeNull();
        });

        it('returns null even if stored context exists when any URL param is set', () => {
            const result = resolveSessionLocally(stored, { leadId: 'lead-x', dealerId: 'url-dealer', studio: null });
            expect(result).toBeNull();
        });
    });

    // Path 3: no stored dealerId → requires server resolution
    describe('no stored context path', () => {
        it('returns null when stored context is null', () => {
            expect(resolveSessionLocally(null, noUrlParams)).toBeNull();
        });

        it('returns null when stored dealerId is null', () => {
            expect(resolveSessionLocally({ dealerId: null, financeId: 'f1' }, noUrlParams)).toBeNull();
        });

        it('returns null when stored dealerId is undefined', () => {
            expect(resolveSessionLocally({}, noUrlParams)).toBeNull();
        });

        it('returns null when stored dealerId is empty string', () => {
            expect(resolveSessionLocally({ dealerId: '' }, noUrlParams)).toBeNull();
        });
    });
});

// ─── buildSessionFromServerContext ────────────────────────────────────────────

describe('buildSessionFromServerContext', () => {
    const serverCtx = {
        dealerId: 'server-dealer',
        tenantName: 'Server Dealer Name',
        district: 'Mumbai',
        source: 'NONE',
    };

    // Cookie re-sync: financeId from localStorage is preserved even when server doesn't return one
    it('preserves financeId from stored context (cookie re-sync scenario)', () => {
        const result = buildSessionFromServerContext(serverCtx, stored, noUrlParams);
        expect(result.financeId).toBe('finance-xyz');
    });

    it('uses server dealerId, not stored one', () => {
        const result = buildSessionFromServerContext(serverCtx, stored, noUrlParams);
        expect(result.dealerId).toBe('server-dealer');
    });

    it('sets locked=true when leadId URL param is present', () => {
        const result = buildSessionFromServerContext(serverCtx, stored, {
            leadId: 'lead-007',
            dealerId: null,
            studio: null,
        });
        expect(result.locked).toBe(true);
    });

    it('sets locked=false when no leadId', () => {
        const result = buildSessionFromServerContext(serverCtx, stored, noUrlParams);
        expect(result.locked).toBe(false);
    });

    it('maps EXPLICIT server source to URL source', () => {
        const result = buildSessionFromServerContext({ ...serverCtx, source: 'EXPLICIT' }, stored, noUrlParams);
        expect(result.source).toBe('URL');
    });

    it('maps PRIMARY* server source to PRIMARY source', () => {
        const result = buildSessionFromServerContext({ ...serverCtx, source: 'PRIMARY_DISTRICT' }, stored, noUrlParams);
        expect(result.source).toBe('PRIMARY');
    });

    it('sets source DEFAULT when no stored context and no URL override', () => {
        const result = buildSessionFromServerContext(serverCtx, null, noUrlParams);
        expect(result.source).toBe('DEFAULT');
    });

    it('sets shortCircuit=false always', () => {
        const result = buildSessionFromServerContext(serverCtx, stored, noUrlParams);
        expect(result.shortCircuit).toBe(false);
    });

    it('sets financeId to null when no stored context', () => {
        const result = buildSessionFromServerContext(serverCtx, null, noUrlParams);
        expect(result.financeId).toBeNull();
    });
});
