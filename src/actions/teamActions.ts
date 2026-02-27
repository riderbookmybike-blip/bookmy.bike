'use server';

import { adminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/auth/resolver';
import { toAppStorageFormat } from '@/lib/utils/phoneUtils';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { createOrLinkMember } from './members';

// ─── ensureMemberByPhone ─────────────────────────────────
// Idempotent: returns existing member or creates a minimal profile.
// Used for referral auto-creation (referred-by phone unknown).
export async function ensureMemberByPhone(rawPhone: string) {
    const phone = toAppStorageFormat(rawPhone);
    if (!phone || phone.length !== 10) {
        return { success: false as const, message: 'Invalid phone number' };
    }

    // Identity lookup: primary_phone ONLY (see MEMBERSHIP IDENTITY GOVERNANCE in crm.ts)
    const { data: existing } = await adminClient
        .from('id_members')
        .select('id, full_name')
        .eq('primary_phone', phone)
        .maybeSingle();

    if (existing?.id) {
        return {
            success: true as const,
            memberId: existing.id,
            name: existing.full_name,
            created: false,
        };
    }

    // 2. Create via createOrLinkMember (handles auth user + O'Club signup)
    try {
        // Use a system default tenant for marketplace context
        const { data: settings } = await (adminClient
            .from('sys_settings')
            .select('default_owner_tenant_id')
            .single() as any);

        const defaultTenantId = settings?.default_owner_tenant_id;
        if (!defaultTenantId) {
            return { success: false as const, message: 'System configuration missing (default tenant)' };
        }

        const { member } = await createOrLinkMember({
            tenantId: defaultTenantId,
            fullName: 'Member',
            phone,
        });

        if (!member?.id) {
            return { success: false as const, message: 'Failed to create member profile' };
        }

        return {
            success: true as const,
            memberId: member.id,
            name: member.full_name || null,
            created: true,
        };
    } catch (error: unknown) {
        console.error('[ensureMemberByPhone] Error:', error);
        return { success: false as const, message: getErrorMessage(error) };
    }
}

// ─── getMemberWalletCoins ────────────────────────────────
// Fetch B-coin balance for a member (used during quote creation).
export async function getMemberWalletCoins(memberId: string) {
    const { data: wallet } = await adminClient
        .from('oclub_wallets')
        .select('available_system, available_referral, available_sponsored')
        .eq('member_id', memberId)
        .maybeSingle();

    if (!wallet) return 0;
    const w = wallet as any;
    return (w.available_system || 0) + (w.available_referral || 0) + (w.available_sponsored || 0);
}

// ─── addFinancerExecutive ────────────────────────────────
// Adds a financer executive to a financer tenant's team.
// Enforces single-active exclusivity across financer tenants.
export async function addFinancerExecutive(input: { financerTenantId: string; phone: string }) {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
        return { success: false as const, message: 'Authentication required' };
    }

    const phone = toAppStorageFormat(input.phone);
    if (!phone || phone.length !== 10) {
        return { success: false as const, message: 'Invalid phone number' };
    }

    // 1. Verify the target tenant is a BANK type
    const { data: tenant } = await adminClient
        .from('id_tenants')
        .select('type')
        .eq('id', input.financerTenantId)
        .single();

    if (!tenant || tenant.type !== 'BANK') {
        return { success: false as const, message: 'Target tenant is not a financer (BANK)' };
    }

    // 2. Resolve member by phone — primary_phone ONLY (see MEMBERSHIP IDENTITY GOVERNANCE in crm.ts)
    const { data: member } = await adminClient
        .from('id_members')
        .select('id, full_name')
        .eq('primary_phone', phone)
        .maybeSingle();

    if (!member?.id) {
        return {
            success: false as const,
            message: 'No member found with this phone number. User must register first.',
        };
    }

    // 3. Check for existing active FINANCER_EXEC assignment in another financer
    const { data: existingAssignment } = await adminClient
        .from('id_team')
        .select('tenant_id, id_tenants!inner(name)')
        .eq('user_id', member.id)
        .eq('role', 'FINANCER_EXEC')
        .eq('status', 'ACTIVE')
        .neq('tenant_id', input.financerTenantId)
        .maybeSingle();

    if (existingAssignment) {
        const existingName = (existingAssignment as any).id_tenants?.name || 'another financer';
        return {
            success: false as const,
            message: `This person is already assigned as Financer Executive at "${existingName}". They must be removed there first.`,
        };
    }

    // 4. Upsert into id_team (idempotent for re-activation)
    const { error } = await adminClient.from('id_team').upsert(
        {
            user_id: member.id,
            tenant_id: input.financerTenantId,
            role: 'FINANCER_EXEC',
            status: 'ACTIVE',
        },
        { onConflict: 'user_id,tenant_id' }
    );

    if (error) {
        // Handle unique constraint violation (DB-level exclusivity)
        if (error.code === '23505') {
            return {
                success: false as const,
                message:
                    'This person is already assigned as Financer Executive elsewhere (concurrent assignment detected).',
            };
        }
        console.error('[addFinancerExecutive] Insert error:', error);
        return { success: false as const, message: getErrorMessage(error) };
    }

    return {
        success: true as const,
        memberId: member.id,
        memberName: member.full_name,
    };
}
