'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createFinanceApplication(data: {
    booking_id: string;
    lender_name: string;
    requested_amount: number;
    notes?: string;
}) {
    const { data: app, error } = await adminClient
        .from('crm_finance')
        .insert({
            booking_id: data.booking_id,
            lender_name: data.lender_name,
            requested_amount: data.requested_amount,
            notes: data.notes,
            status: 'APPLIED',
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/app/[slug]/sales-orders');
    return app;
}

export async function updateFinanceStatus(
    appId: string,
    updates: {
        status?: string;
        approved_amount?: number;
        interest_rate?: number;
        tenure_months?: number;
        notes?: string;
        is_active_closing?: boolean;
        agreement_signed_at?: string | null;
        enach_done_at?: string | null;
        insurance_requested_at?: string | null;
        onboarding_initiated_at?: string | null;
        disbursement_initiated_at?: string | null;
        disbursement_completed_at?: string | null;
    }
) {
    // If setting as active closing, first unset any others for the same booking
    if (updates.is_active_closing) {
        const { data: currentApp } = await adminClient
            .from('crm_finance')
            .select('booking_id')
            .eq('id', appId)
            .single();

        if (currentApp?.booking_id) {
            await adminClient
                .from('crm_finance')
                .update({ is_active_closing: false })
                .eq('booking_id', currentApp.booking_id);
        }
    }

    const { data: updated, error } = await adminClient
        .from('crm_finance')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', appId)
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/app/[slug]/sales-orders');
    return updated;
}

export async function getFinanceApplications(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_finance')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
