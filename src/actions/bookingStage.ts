'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
        // 1. Fetch current booking
        const { data: booking, error: fetchErr } = await supabase
            .from('crm_bookings')
            .select('id, operational_stage, tenant_id')
            .eq('id', bookingId)
            .single();

        if (fetchErr || !booking) {
            return { success: false, message: 'Booking not found' };
        }

        // 2. Tenant ownership check — verify user belongs to same tenant
        const { data: membership } = await (supabase as any)
            .from('id_memberships')
            .select('tenant_id')
            .eq('user_id', user.id)
            .eq('tenant_id', booking.tenant_id)
            .maybeSingle();

        if (!membership) {
            return { success: false, message: 'You do not have access to this booking' };
        }

        const currentStage = booking.operational_stage as Stage;

        // 3. Validate transition
        if (!isValidTransition(currentStage, newStage as Stage)) {
            const allowed = getAllowedTransitions(currentStage);
            return {
                success: false,
                message: `Cannot transition from ${currentStage} to ${newStage}. Allowed: ${allowed.join(', ') || 'none'}`,
            };
        }

        // 4. Optimistic lock: only update if stage hasn't changed since we read it
        const { data: updated, error: updateErr } = await (supabase as any)
            .from('crm_bookings')
            .update({
                operational_stage: newStage,
                stage_updated_at: new Date().toISOString(),
                stage_updated_by: user.id,
            })
            .eq('id', bookingId)
            .eq('operational_stage', currentStage) // Optimistic lock
            .select('id')
            .maybeSingle();

        if (updateErr) throw updateErr;

        if (!updated) {
            return {
                success: false,
                message: 'Stage was modified by another user. Please refresh and try again.',
            };
        }

        // 5. Write stage event history
        let warning: string | undefined;
        const { error: eventErr } = await (supabase as any).from('crm_booking_stage_events').insert({
            booking_id: bookingId,
            from_stage: currentStage,
            to_stage: newStage,
            reason: reason || null,
            changed_by: user.id,
        });

        if (eventErr) {
            console.error('[advanceBookingStage] Event write failed:', eventErr);
            warning = 'Stage updated but audit event could not be recorded. Contact support.';
        }

        revalidatePath('/sales-orders');
        revalidatePath('/dashboard');

        return { success: true, warning };
    } catch (err: any) {
        console.error('[advanceBookingStage] Error:', err);
        return { success: false, message: err.message };
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
export function getAllowedTransitions(currentStage: string): string[] {
    if (!STAGE_ORDER.includes(currentStage as Stage)) return [];

    const forward = TRANSITION_MATRIX[currentStage as Stage] || [];
    const prev = getPreviousStage(currentStage as Stage);
    return prev ? [prev, ...forward] : [...forward];
}
