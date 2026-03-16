'use server';

import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { getAuthUser } from '@/lib/auth/resolver';

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
        // 1. Get finance team members from id_team (primary source)
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
            .eq('tenant_id', financeId)
            .eq('status', 'ACTIVE');

        if (teamError) throw teamError;

        // 2. Fallback/augment from finance tenant config.team (AUMS-managed roster)
        const { data: financeTenant, error: financeTenantError } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', financeId)
            .maybeSingle();
        if (financeTenantError) throw financeTenantError;

        const configTeam = Array.isArray((financeTenant as any)?.config?.team)
            ? (financeTenant as any).config.team
            : [];
        const configTeamUserIds: string[] = Array.from(
            new Set(configTeam.map((member: any) => String(member?.id || '').trim()).filter((id: string) => !!id))
        );

        const idTeamUserIdSet = new Set((teamMembers || []).map((m: any) => String(m.user_id || '')));
        const missingUserIds: string[] = configTeamUserIds.filter(id => !idTeamUserIdSet.has(id));

        let missingMembers: any[] = [];
        if (missingUserIds.length > 0) {
            const { data: missingMemberRows, error: missingMemberError } = await adminClient
                .from('id_members')
                .select('id, full_name, primary_phone, primary_email')
                .in('id', missingUserIds);
            if (missingMemberError) throw missingMemberError;

            const missingMap = new Map((missingMemberRows || []).map((row: any) => [String(row.id), row]));
            missingMembers = missingUserIds
                .map((id: string) => {
                    const profile = missingMap.get(id);
                    const configProfile = configTeam.find((m: any) => String(m?.id || '') === id);
                    if (!profile && !configProfile) return null;
                    return {
                        user_id: id,
                        role: configProfile?.designation || configProfile?.role || 'FINANCER_EXEC',
                        id_members: {
                            id,
                            full_name: profile?.full_name || configProfile?.name || null,
                            primary_phone: profile?.primary_phone || configProfile?.phone || null,
                            primary_email: profile?.primary_email || configProfile?.email || null,
                        },
                    };
                })
                .filter(Boolean);
        }

        const mergedTeamMembers = [...(teamMembers || []), ...missingMembers];

        // 3. Get existing access from dealer_finance_user_access
        const { data: accessList, error: accessError } = await adminClient
            .from('dealer_finance_user_access')
            .select('*')
            .eq('dealer_tenant_id', dealerId)
            .eq('finance_tenant_id', financeId);

        if (accessError) throw accessError;

        // 4. Merge data
        const members = mergedTeamMembers.map((m: any) => {
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

        const dedupedMembers = Array.from(
            new Map(members.filter((m: any) => m?.userId).map((m: any) => [String(m.userId), m])).values()
        );

        return { success: true, members: dedupedMembers };
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

/**
 * Returns dealership options a logged-in finance user can operate on.
 * Source of truth: dealer_finance_user_access (granted by dealership).
 */
export async function getFinanceUserDealerOptions(financeId: string) {
    try {
        const user = await getAuthUser();
        if (!user?.id) return { success: false, error: 'Authentication required', dealers: [] as any[] };
        if (!financeId) return { success: true, dealers: [] as any[] };

        const { data: links, error: linkError } = await adminClient
            .from('dealer_finance_user_access')
            .select('dealer_tenant_id')
            .eq('finance_tenant_id', financeId)
            .eq('user_id', user.id)
            .eq('crm_access', true);

        if (linkError) throw linkError;

        const dealerIds = Array.from(
            new Set((links || []).map((row: any) => String(row.dealer_tenant_id || '')).filter(Boolean))
        );
        if (dealerIds.length === 0) {
            return { success: true, dealers: [] as any[] };
        }

        const { data: dealers, error: dealerError } = await adminClient
            .from('id_tenants')
            .select('id, name')
            .in('id', dealerIds)
            .eq('type', 'DEALER')
            .eq('status', 'ACTIVE')
            .order('name', { ascending: true });

        if (dealerError) throw dealerError;

        return { success: true, dealers: (dealers || []) as Array<{ id: string; name: string }> };
    } catch (error: unknown) {
        console.error('[getFinanceUserDealerOptions] Error:', error);
        return { success: false, error: getErrorMessage(error), dealers: [] as any[] };
    }
}
