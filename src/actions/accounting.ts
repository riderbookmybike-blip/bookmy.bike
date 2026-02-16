'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

/**
 * Fetch all bank accounts for the tenant, including primary status.
 */
export async function getBankAccounts(tenantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_bank_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false });

    if (error) {
        console.error('getBankAccounts Error:', error);
        return [];
    }
    return data || [];
}

/**
 * Consolidated fetch for Inflows (crm_receipts) and Outflows (crm_payments).
 * Returns a unified, sorted list for the ledger view.
 */
export async function getUnifiedLedger(tenantId: string, bankAccountId?: string) {
    const supabase = await createClient();

    // Fetch Receipts (Inflow)
    let receiptsQuery = supabase
        .from('crm_receipts')
        .select('*, member:id_members(full_name)')
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false);

    // Fetch Payments (Outflow)
    let paymentsQuery = supabase
        .from('crm_payments')
        .select('*, member:id_members(full_name)')
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false);

    // Filter by bank account if provided (using a custom provider_data check or direct FK if it exists)
    // For now, sorting by date and returning all for the tenant

    const [receiptsRes, paymentsRes] = await Promise.all([
        receiptsQuery.order('created_at', { ascending: false }),
        paymentsQuery.order('created_at', { ascending: false }),
    ]);

    if (receiptsRes.error) console.error('Ledger Receipts Error:', receiptsRes.error);
    if (paymentsRes.error) console.error('Ledger Payments Error:', paymentsRes.error);

    const transactions = [
        ...(receiptsRes.data || []).map((r: any) => ({
            id: r.id,
            type: 'INFLOW',
            amount: Number(r.amount),
            method: r.method,
            status: r.status,
            date: r.created_at,
            displayId: r.display_id,
            description: `Payment from ${r.member?.full_name || 'Customer'}`,
            reference: r.transaction_id,
            isReconciled: r.is_reconciled,
            entityId: r.member_id || r.lead_id,
            source: 'receipts',
        })),
        ...(paymentsRes.data || []).map((p: any) => ({
            id: p.id,
            type: 'OUTFLOW',
            amount: Number(p.amount),
            method: p.method,
            status: p.status,
            date: p.created_at,
            displayId: p.display_id,
            description: p.provider_data?.description || `Payment to ${p.member?.full_name || 'Vendor'}`,
            reference: p.transaction_id,
            isReconciled: p.is_reconciled,
            entityId: p.member_id || p.lead_id,
            source: 'payments',
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return transactions;
}

/**
 * Reconcile a transaction (Receipt or Payment).
 */
export async function reconcileTransaction(id: string, source: 'receipts' | 'payments') {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const table = source === 'receipts' ? 'crm_receipts' : 'crm_payments';

    const { error } = await adminClient
        .from(table)
        .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            reconciled_by: user?.id,
        })
        .eq('id', id);

    if (error) {
        console.error(`Reconcile Error (${source}):`, error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Add a manual accounting entry.
 */
export async function addManualTransaction(data: {
    tenant_id: string;
    type: 'INFLOW' | 'OUTFLOW';
    amount: number;
    method: string;
    description: string;
    date: string;
    bank_account_id?: string;
}) {
    const table = data.type === 'INFLOW' ? 'crm_receipts' : 'crm_payments';

    const { data: inserted, error } = await adminClient
        .from(table)
        .insert({
            tenant_id: data.tenant_id,
            amount: data.amount,
            method: data.method,
            status: 'COMPLETED',
            created_at: data.date,
            provider_data: { description: data.description, manual_entry: true, bank_account_id: data.bank_account_id },
        })
        .select()
        .single();

    if (error) {
        console.error('Add Manual Transaction Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: inserted };
}

/**
 * Creates a new bank account for a tenant.
 */
export async function createBankAccount(data: {
    tenant_id: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    beneficiary_name: string;
    account_type: string;
    is_primary?: boolean;
}) {
    const { data: inserted, error } = await adminClient
        .from('id_bank_accounts')
        .insert({
            ...data,
            is_verified: true, // Auto-verify for now as per developer intent
            verification_status: 'VERIFIED',
        })
        .select()
        .single();

    if (error) {
        console.error('Create Bank Account Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: inserted };
}
