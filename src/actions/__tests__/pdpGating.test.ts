/**
 * Unit tests for assertPdpGating().
 *
 * We mock `process.env`, `checkServiceability`, and keep assertPdpGating pure.
 */

import { assertPdpGating, type GatingResult } from '@/lib/crm/pdpGating';
import * as serviceAreaModule from '../serviceArea';

// ── Mock serviceArea ──────────────────────────────────────────────────────────
jest.mock('../serviceArea', () => ({
    checkServiceability: jest.fn(),
}));

const mockCheck = serviceAreaModule.checkServiceability as jest.MockedFunction<
    typeof serviceAreaModule.checkServiceability
>;

// ── Helper ────────────────────────────────────────────────────────────────────
function setStrictGating(value: string | undefined) {
    if (value === undefined) {
        delete process.env.STRICT_PDP_GATING;
    } else {
        process.env.STRICT_PDP_GATING = value;
    }
}

describe('assertPdpGating', () => {
    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.STRICT_PDP_GATING;
    });

    // ── Case 1: flag off → always ok ─────────────────────────────────────────
    it('(1) flag=false: no-op for unauthenticated + no pincode', async () => {
        setStrictGating('false');
        const result: GatingResult = await assertPdpGating(null, null);
        expect(result.ok).toBe(true);
        expect(mockCheck).not.toHaveBeenCalled();
    });

    // ── Case 2: flag on + unauthenticated → UNAUTHENTICATED ──────────────────
    it('(2) flag=true, authId=null → UNAUTHENTICATED', async () => {
        setStrictGating('true');
        const result = await assertPdpGating(null, null);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.code).toBe('UNAUTHENTICATED');
            expect(result.message).toMatch(/login required/i);
        }
        expect(mockCheck).not.toHaveBeenCalled();
    });

    // ── Case 3: flag on + auth + no pincode → LOCATION_REQUIRED ─────────────
    it('(3) flag=true, auth ok, pincode=null → LOCATION_REQUIRED', async () => {
        setStrictGating('true');
        const result = await assertPdpGating('user-uuid-123', null);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.code).toBe('LOCATION_REQUIRED');
            expect(result.message).toMatch(/pincode/i);
        }
        expect(mockCheck).not.toHaveBeenCalled();
    });

    // ── Case 4: flag on + auth + non-serviceable pincode → NOT_SERVICEABLE ───
    it('(4) flag=true, auth ok, Delhi pincode (110001) → NOT_SERVICEABLE', async () => {
        setStrictGating('true');
        mockCheck.mockResolvedValueOnce({ isServiceable: false } as any);
        const result = await assertPdpGating('user-uuid-123', '110001');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.code).toBe('NOT_SERVICEABLE');
            expect(result.message).toContain('110001');
        }
        expect(mockCheck).toHaveBeenCalledWith('110001');
    });

    // ── Case 5: flag on + auth + serviceable pincode → ok ────────────────────
    it('(5) flag=true, auth ok, Pune pincode (411001) → ok', async () => {
        setStrictGating('true');
        mockCheck.mockResolvedValueOnce({ isServiceable: true } as any);
        const result = await assertPdpGating('user-uuid-123', '411001');
        expect(result.ok).toBe(true);
        expect(mockCheck).toHaveBeenCalledWith('411001');
    });

    // ── Bonus: fail-open on serviceability API error ──────────────────────────
    it('(+) flag=true, serviceability API throws → fail-closed (SERVICEABILITY_UNAVAILABLE)', async () => {
        setStrictGating('true');
        mockCheck.mockRejectedValueOnce(new Error('network timeout'));
        const result = await assertPdpGating('user-uuid-123', '411001');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.code).toBe('SERVICEABILITY_UNAVAILABLE');
            expect(result.message).toMatch(/temporarily unavailable/i);
        }
    });
});
