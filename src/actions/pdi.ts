'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type PDIInput = {
    bookingId: string;
    tenantId: string;
    inspectorName?: string;
    status: string;
    inspectionDate?: string;
    notes?: string;
    electricalOk?: boolean;
    bodyOk?: boolean;
    tyreOk?: boolean;
    fuelOk?: boolean;
    brakesOk?: boolean;
};

export async function getPDIByBooking(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('crm_pdi').select('*').eq('booking_id', bookingId).maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertPDI(input: PDIInput) {
    const { data, error } = await adminClient
        .from('crm_pdi')
        .upsert(
            {
                booking_id: input.bookingId,
                tenant_id: input.tenantId,
                inspector_name: input.inspectorName,
                status: input.status,
                inspection_date: input.inspectionDate,
                notes: input.notes,
                electrical_ok: input.electricalOk ?? null,
                body_ok: input.bodyOk ?? null,
                tyre_ok: input.tyreOk ?? null,
                fuel_ok: input.fuelOk ?? null,
                brakes_ok: input.brakesOk ?? null,
            },
            { onConflict: 'booking_id' }
        )
        .select()
        .single();

    if (error) throw error;

    return data;
}
