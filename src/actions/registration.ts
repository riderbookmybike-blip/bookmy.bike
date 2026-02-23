'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type RegistrationInput = {
    bookingId: string;
    tenantId: string;
    registrationNumber?: string;
    rtoReceiptNumber?: string;
    status: string;
    registeredAt?: string;
};

export async function getRegistrationByBooking(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_registration')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertRegistration(input: RegistrationInput) {
    const { data, error } = await adminClient
        .from('crm_registration')
        .upsert(
            {
                booking_id: input.bookingId,
                tenant_id: input.tenantId,
                registration_number: input.registrationNumber,
                rto_receipt_number: input.rtoReceiptNumber,
                status: input.status,
                registered_at: input.registeredAt,
            },
            { onConflict: 'booking_id' }
        )
        .select()
        .single();

    if (error) throw error;

    // Sync back to crm_bookings for backward compatibility
    await adminClient
        .from('crm_bookings')
        .update({
            registration_number: input.registrationNumber,
            rto_receipt_number: input.rtoReceiptNumber,
        })
        .eq('id', input.bookingId);

    return data;
}
