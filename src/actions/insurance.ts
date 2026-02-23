'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type InsuranceInput = {
    bookingId: string;
    tenantId: string;
    providerName?: string;
    policyNumber?: string;
    status: string;
    premiumAmount?: number;
    expiryDate?: string;
};

export async function getInsuranceByBooking(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('crm_insurance').select('*').eq('booking_id', bookingId).maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertInsurance(input: InsuranceInput) {
    const { data, error } = await adminClient
        .from('crm_insurance')
        .upsert(
            {
                booking_id: input.bookingId,
                tenant_id: input.tenantId,
                provider_name: input.providerName,
                policy_number: input.policyNumber,
                status: input.status,
                premium_amount: input.premiumAmount,
                expiry_date: input.expiryDate,
            },
            { onConflict: 'booking_id' }
        )
        .select()
        .single();

    if (error) throw error;

    // Also sync back to crm_bookings for backward compatibility (optional but safer for now)
    await adminClient
        .from('crm_bookings')
        .update({
            insurance_provider: input.providerName,
            insurance_policy_number: input.policyNumber,
        })
        .eq('id', input.bookingId);

    return data;
}
