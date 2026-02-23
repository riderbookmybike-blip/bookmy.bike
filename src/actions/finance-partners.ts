'use server';

import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from '@/lib/utils/errorMessage';

/**
 * Fetches all financer IDs linked to a specific dealer
 */
export async function getDealerFinancers(dealerId: string) {
    try {
        const { data, error } = await adminClient
            .from('dealer_finance_access')
            .select('finance_tenant_id')
            .eq('dealer_tenant_id', dealerId);

        if (error) throw error;
        return { success: true, financerIds: data.map(d => d.finance_tenant_id) };
    } catch (error: unknown) {
        console.error('[getDealerFinancers] Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Toggles a link between a dealer and a financer
 */
export async function toggleDealerFinancer(dealerId: string, financeId: string, active: boolean) {
    try {
        if (active) {
            const { error } = await adminClient.from('dealer_finance_access').upsert(
                {
                    dealer_tenant_id: dealerId,
                    finance_tenant_id: financeId,
                },
                { onConflict: 'dealer_tenant_id,finance_tenant_id' }
            );
            if (error) throw error;
        } else {
            const { error } = await adminClient
                .from('dealer_finance_access')
                .delete()
                .eq('dealer_tenant_id', dealerId)
                .eq('finance_tenant_id', financeId);
            if (error) throw error;
        }

        revalidatePath('/app/[slug]/dashboard/settings/financer', 'page');
        return { success: true };
    } catch (error: unknown) {
        console.error('[toggleDealerFinancer] Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetches all users from a financer team who have access to a dealer
 */
export async function getFinancerTeamAccess(dealerId: string, financeId: string) {
    try {
        // 1. Get the finance team members first from id_team
        const { data: teamMembers, error: teamError } = await adminClient
            .from('id_team')
            .select(
                `
                user_id,
                role,
                id_members (
                    id,
                    full_name,
                    primary_phone,
                    primary_email
                )
            `
            )
            .eq('tenant_id', financeId);

        if (teamError) throw teamError;

        // 2. Get existing access from dealer_finance_user_access
        const { data: accessList, error: accessError } = await adminClient
            .from('dealer_finance_user_access')
            .select('*')
            .eq('dealer_tenant_id', dealerId)
            .eq('finance_tenant_id', financeId);

        if (accessError) throw accessError;

        // 3. Merge data
        const members = teamMembers.map((m: any) => {
            const access = accessList?.find(a => a.user_id === m.user_id);
            return {
                userId: m.user_id,
                name: m.id_members?.full_name,
                phone: m.id_members?.primary_phone,
                email: m.id_members?.primary_email,
                role: m.role,
                crmAccess: !!access?.crm_access,
                isDefault: !!access?.is_default,
            };
        });

        return { success: true, members };
    } catch (error: unknown) {
        console.error('[getFinancerTeamAccess] Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Updates or creates CRM access for a financer staff member
 */
export async function updateFinancerUserAccess(
    dealerId: string,
    financeId: string,
    userId: string,
    crmAccess: boolean
) {
    try {
        if (crmAccess) {
            const { error } = await adminClient.from('dealer_finance_user_access').upsert(
                {
                    dealer_tenant_id: dealerId,
                    finance_tenant_id: financeId,
                    user_id: userId,
                    crm_access: true,
                },
                { onConflict: 'dealer_tenant_id,finance_tenant_id,user_id' }
            );
            if (error) throw error;
        } else {
            const { error } = await adminClient
                .from('dealer_finance_user_access')
                .delete()
                .eq('dealer_tenant_id', dealerId)
                .eq('finance_tenant_id', financeId)
                .eq('user_id', userId);
            if (error) throw error;
        }

        return { success: true };
    } catch (error: unknown) {
        console.error('[updateFinancerUserAccess] Error:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}
