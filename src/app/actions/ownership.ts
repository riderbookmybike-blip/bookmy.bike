'use server';

import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { can } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export async function transferOwnership(targetUserId: string, tenantId: string) {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 2. Verify Current Membership & Role (Must be DEALER_OWNER)
    const { data: currentMembership, error: fetchError } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

    if (fetchError || !currentMembership) {
        throw new Error('Membership not found');
    }

    if (currentMembership.role !== 'DEALER_OWNER' && currentMembership.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied: Only Owners can transfer ownership.');
    }

    // 3. Verify Target User Membership (Must belong to same tenant)
    const { data: targetMembership } = await supabase
        .from('memberships')
        .select('status, role')
        .eq('user_id', targetUserId)
        .eq('tenant_id', tenantId)
        .single();

    if (!targetMembership) throw new Error('Target user is not a member of this organization.');
    if (targetMembership.status !== 'ACTIVE') throw new Error('Target user is not active.');

    // 4. Perform Transfer (Transaction-like)
    // Downgrade Current Owner -> DEALER_ADMIN
    const { error: downgradeError } = await supabase
        .from('memberships')
        .update({ role: 'DEALER_ADMIN' })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

    if (downgradeError) throw new Error('Failed to downgrade current owner.');

    // Upgrade Target -> DEALER_OWNER
    const { error: upgradeError } = await supabase
        .from('memberships')
        .update({ role: 'DEALER_OWNER' })
        .eq('user_id', targetUserId)
        .eq('tenant_id', tenantId);

    if (upgradeError) {
        // Rollback attempt (best effort)
        await supabase
            .from('memberships')
            .update({ role: 'DEALER_OWNER' })
            .eq('user_id', user.id)
            .eq('tenant_id', tenantId);
        throw new Error('Failed to upgrade target user.');
    }

    // 5. Audit Log
    await logAudit({
        tenantId: tenantId,
        actorId: user.id,
        action: 'OWNERSHIP_TRANSFERRED',
        entityType: 'MEMBERSHIP',
        entityId: targetUserId,
        metadata: { from: user.id, to: targetUserId }
    });

    revalidatePath('/dashboard/settings/team');
    return { success: true };
}
