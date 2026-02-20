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

// Allowed transitions: forward by 1 step, or skip only within allowed jumps.
// Backward moves only allowed by 1 step (undo).
function isValidTransition(from: Stage, to: Stage): boolean {
    const fromIdx = STAGE_ORDER.indexOf(from);
    const toIdx = STAGE_ORDER.indexOf(to);
    if (fromIdx === -1 || toIdx === -1) return false;

    // Forward: up to +3 steps (allows skipping optional stages like INSURANCE)
    if (toIdx > fromIdx && toIdx - fromIdx <= 3) return true;

    // Backward: only 1 step (undo/revert)
    if (toIdx === fromIdx - 1) return true;

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
): Promise<{ success: boolean; message?: string }> {
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

        const currentStage = booking.operational_stage as Stage;

        // 2. Validate transition
        if (!isValidTransition(currentStage, newStage as Stage)) {
            return {
                success: false,
                message: `Cannot transition from ${currentStage} to ${newStage}. Only forward (up to 3 steps) or backward (1 step) moves allowed.`,
            };
        }

        // 3. Update operational_stage + timestamps atomically
        const { error: updateErr } = await (supabase as any)
            .from('crm_bookings')
            .update({
                operational_stage: newStage,
                stage_updated_at: new Date().toISOString(),
                stage_updated_by: user.id,
            })
            .eq('id', bookingId);

        if (updateErr) throw updateErr;

        // 4. Write stage event history
        const { error: eventErr } = await (supabase as any).from('crm_booking_stage_events').insert({
            booking_id: bookingId,
            from_stage: currentStage,
            to_stage: newStage,
            reason: reason || null,
            changed_by: user.id,
        });

        if (eventErr) {
            console.error('[advanceBookingStage] Event write failed:', eventErr);
            // Non-fatal: stage was already updated, event is audit-only
        }

        revalidatePath('/sales-orders');
        revalidatePath('/dashboard');

        return { success: true };
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

// Get allowed next stages from current stage
export function getAllowedTransitions(currentStage: string): string[] {
    if (!STAGE_ORDER.includes(currentStage as Stage)) return [];

    return STAGE_ORDER.filter(s => isValidTransition(currentStage as Stage, s));
}
