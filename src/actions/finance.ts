'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function logFinanceEvent(input: {
    financeId: string;
    eventType: string;
    milestone?: string;
    notes?: string | null;
    tenantId?: string | null;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const actorUserId = user?.id || null;
    let actorTenantId: string | null = input.tenantId || null;

    if (!actorTenantId && actorUserId) {
        const { data: team } = await adminClient
            .from('id_team')
            .select('tenant_id')
            .eq('user_id', actorUserId)
            .limit(1)
            .maybeSingle();
        actorTenantId = team?.tenant_id || null;
    }

    await adminClient.from('crm_finance_events').insert({
        finance_id: input.financeId,
        event_type: input.eventType,
        milestone: input.milestone || null,
        notes: input.notes || null,
        actor_user_id: actorUserId,
        actor_tenant_id: actorTenantId,
    });
}

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

    await logFinanceEvent({
        financeId: app.id,
        eventType: 'APPLIED',
        milestone: 'APPLICATION_CREATED',
        notes: data.notes || null,
    });

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

    const { data: beforeRow } = await adminClient
        .from('crm_finance')
        .select('status, notes')
        .eq('id', appId)
        .maybeSingle();

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

    const nextStatus = updated?.status || updates.status || null;
    const prevStatus = beforeRow?.status || null;
    if (nextStatus && nextStatus !== prevStatus) {
        await logFinanceEvent({
            financeId: appId,
            eventType: String(nextStatus).toUpperCase(),
            milestone: 'STATUS_CHANGE',
            notes: updates.notes || null,
        });
    } else if (updates.notes && updates.notes !== beforeRow?.notes) {
        await logFinanceEvent({
            financeId: appId,
            eventType: 'NOTE_UPDATED',
            milestone: 'NOTE',
            notes: updates.notes,
        });
    }

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
