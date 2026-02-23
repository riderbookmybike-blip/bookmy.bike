'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from '@/lib/utils/errorMessage';

// =============================================================================
// BOOKING STAGE TRANSITION SERVICE
// =============================================================================
// Centralized stage management for crm_bookings.operational_stage.
// Full enum (ordered): QUOTE → BOOKING → PAYMENT → FINANCE → ALLOTMENT → PDI
//   → INSURANCE → REGISTRATION → COMPLIANCE → DELIVERY → DELIVERED → FEEDBACK

const STAGE_ORDER = [
    'QUOTE',
    'BOOKING',
    'PAYMENT',
    'FINANCE',
    'ALLOTMENT',
    'PDI',
    'INSURANCE',
    'REGISTRATION',
    'COMPLIANCE',
    'DELIVERY',
    'DELIVERED',
    'FEEDBACK',
] as const;

type Stage = (typeof STAGE_ORDER)[number];

// Explicit transition matrix: from → [allowed destinations]
// This replaces the +3 forward rule with precise, auditable moves.
const TRANSITION_MATRIX: Record<Stage, Stage[]> = {
    QUOTE: ['BOOKING'],
    BOOKING: ['PAYMENT'],
    PAYMENT: ['FINANCE', 'ALLOTMENT'], // Finance optional: can skip to allotment if cash deal
    FINANCE: ['ALLOTMENT'],
    ALLOTMENT: ['PDI'],
    PDI: ['INSURANCE', 'COMPLIANCE'], // Insurance optional: can skip to compliance
    INSURANCE: ['REGISTRATION', 'COMPLIANCE'], // Registration optional
    REGISTRATION: ['COMPLIANCE'],
    COMPLIANCE: ['DELIVERY'],
    DELIVERY: ['DELIVERED'],
    DELIVERED: ['FEEDBACK'],
    FEEDBACK: [], // Terminal
};

// Backward transitions: each stage can go back exactly one step (undo)
function getPreviousStage(stage: Stage): Stage | null {
    const idx = STAGE_ORDER.indexOf(stage);
    return idx > 0 ? STAGE_ORDER[idx - 1] : null;
}

function isValidTransition(from: Stage, to: Stage): boolean {
    // Forward: check explicit matrix
    if (TRANSITION_MATRIX[from]?.includes(to)) return true;
    // Backward: exactly one step
    if (getPreviousStage(from) === to) return true;
    return false;
}

async function getAuthUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

export async function advanceBookingStage(
    bookingId: string,
    newStage: string,
    reason?: string
): Promise<{ success: boolean; message?: string; warning?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    // Validate newStage is in enum
    if (!STAGE_ORDER.includes(newStage as Stage)) {
        return { success: false, message: `Invalid stage: ${newStage}` };
    }

    const supabase = await createClient();

    try {
        // DB function enforces transition matrix + proof checks + event logging atomically.
        const { data, error } = await supabase.rpc('transition_booking_stage', {
            p_booking_id: bookingId,
            p_to_stage: newStage,
            p_reason: reason || null,
        });

        if (error) {
            console.error('[advanceBookingStage] RPC error:', error);
            return { success: false, message: error.message || 'Failed to update booking stage' };
        }

        const payload = (data || {}) as { success?: boolean; message?: string; warning?: string };
        if (!payload.success) {
            return { success: false, message: payload.message || 'Failed to update booking stage' };
        }

        revalidatePath('/sales-orders');
        revalidatePath('/dashboard');

        return { success: true, message: payload.message, warning: payload.warning };
    } catch (err: unknown) {
        console.error('[advanceBookingStage] Error:', err);
        return { success: false, message: getErrorMessage(err) };
    }
}

// Get stage history for a booking
export async function getBookingStageHistory(bookingId: string) {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
        .from('crm_booking_stage_events')
        .select('*')
        .eq('booking_id', bookingId)
        .order('changed_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('[getBookingStageHistory] Error:', error);
        return [];
    }

    return data || [];
}

// Get allowed next stages from current stage (forward + backward)
export async function getAllowedTransitions(currentStage: string): Promise<string[]> {
    if (!STAGE_ORDER.includes(currentStage as Stage)) return [];

    const forward = TRANSITION_MATRIX[currentStage as Stage] || [];
    const prev = getPreviousStage(currentStage as Stage);
    return prev ? [prev, ...forward] : [...forward];
}
