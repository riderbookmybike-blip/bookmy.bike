'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type PDIInput = {
    bookingId: string;
    tenantId: string;
    inspectorName?: string;
    status: string;
    checklist?: any[];
    inspectionDate?: string;
    notes?: string;
    metadata?: Record<string, any>;
};

export async function getPDIByBooking(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_pdi')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertPDI(input: PDIInput) {
    const { data, error } = await adminClient
        .from('crm_pdi')
        .upsert({
            booking_id: input.bookingId,
            tenant_id: input.tenantId,
            inspector_name: input.inspectorName,
            status: input.status,
            checklist: input.checklist || [],
            inspection_date: input.inspectionDate,
            notes: input.notes,
            metadata: input.metadata || {}
        }, { onConflict: 'booking_id' })
        .select()
        .single();

    if (error) throw error;

    // Sync back to crm_bookings for backward compatibility
    await adminClient
        .from('crm_bookings')
        .update({
            pdi_status: input.status
        })
        .eq('id', input.bookingId);

    return data;
}
