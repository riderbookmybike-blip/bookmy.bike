'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type AllotmentInput = {
    bookingId: string;
    tenantId: string;
    vinNumber?: string;
    engineNumber?: string;
    status: string;
    allottedAt?: string;
    metadata?: Record<string, any>;
};

export async function getAllotmentByBooking(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_allotments')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertAllotment(input: AllotmentInput) {
    const { data, error } = await adminClient
        .from('crm_allotments')
        .upsert({
            booking_id: input.bookingId,
            tenant_id: input.tenantId,
            vin_number: input.vinNumber,
            engine_number: input.engineNumber,
            status: input.status,
            allotted_at: input.allottedAt,
            metadata: input.metadata || {}
        }, { onConflict: 'booking_id' })
        .select()
        .single();

    if (error) throw error;

    // Sync back to crm_bookings for backward compatibility
    await adminClient
        .from('crm_bookings')
        .update({
            allotment_status: input.status,
            vin_number: input.vinNumber
        })
        .eq('id', input.bookingId);

    return data;
}
