'use server';

import { createClient } from '@/lib/supabase/client';
import { adminClient } from '@/lib/supabase/admin';
import { randomBytes, createHash } from 'crypto';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';



// Helper: Hash token
function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export async function createInvite(prevState: any, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const tenantId = formData.get('tenantId') as string;

    if (!email || !role || !tenantId) return { success: false, message: 'Missing fields' };

    // 1. Validate permissions (User is Admin of this Tenant)
    // Note: RLS protects the INSERT, but we double check here or trust RLS + Admin Client usage carefully.
    // Ideally, we use the specific user's client to insert, so RLS enforces it.

    // Generate Token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 2. Insert Invite (Using Admin Client to ensure we can write if RLS is tricky, but RLS should allow)
    // Let's try inserting with user's client first? 
    // Actually, RLS policy says "Admins can insert". So user client is best.

    // BUT, we need to ensure the user is actually an admin.
    // Instead of trusting formData tenantId, we should maybe check membership.

    // Let's use Admin Client for the INSERT to guarantee it works, 
    // but Pre-Check membership manually for security.

    const { data: membership } = await adminClient
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

    if (!membership || !['DEALER_OWNER', 'DEALER_ADMIN', 'SUPER_ADMIN'].includes(membership.role)) {
        return { success: false, message: 'Insufficient permissions' };
    }

    const { error } = await adminClient
        .from('invitations')
        .insert({
            tenant_id: tenantId,
            email,
            role,
            token_hash: tokenHash,
            created_by: user.id,
            expires_at: expiresAt.toISOString()
        });

    if (error) {
        console.error('Invite Error:', error);
        return { success: false, message: 'Failed to create invite' };
    }

    // 3. Log Audit
    await logAudit({
        tenantId,
        actorId: user.id,
        action: 'INVITE_CREATED',
        entityType: 'INVITATION',
        entityId: email,
        metadata: { role, tokenHash }
    });

    // 4. Send Email (Stub for now, or real if provider exists)
    // In real app: await sendEmail({ to: email, link: `https://bookmy.bike/invite?token=${rawToken}` })

    // Return the raw token for UI display (since email is stubbed)
    return { success: true, message: 'Invite created', debugToken: rawToken };
}

export async function verifyInviteToken(token: string) {
    const tokenHash = hashToken(token);

    const { data: invite, error } = await adminClient
        .from('invitations')
        .select('*, tenants(name, slug)')
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .eq('status', 'PENDING')
        .single();

    if (error || !invite) return null;
    return invite;
}

export async function acceptInvite(token: string, userId: string) {
    const tokenHash = hashToken(token);

    // 1. Get Invite
    const { data: invite } = await adminClient
        .from('invitations')
        .select('*')
        .eq('token_hash', tokenHash)
        .single();

    if (!invite) return { success: false, message: 'Invalid invite' };

    // 2. Create Membership
    const { error: memberError } = await adminClient
        .from('memberships')
        .insert({
            user_id: userId,
            tenant_id: invite.tenant_id,
            role: invite.role,
            status: 'ACTIVE'
        });

    if (memberError) {
        // Handle constraint violation (already member)
        if (memberError.code === '23505') { // Unique violation
            return { success: true, message: 'Already a member' };
        }
        return { success: false, message: 'Failed to join organization' };
    }

    // 3. Update Invite Status
    await adminClient
        .from('invitations')
        .update({ status: 'ACCEPTED', accepted_by: userId })
        .eq('id', invite.id);

    // 4. Log Audit
    await logAudit({
        tenantId: invite.tenant_id,
        actorId: userId,
        action: 'INVITE_ACCEPTED',
        entityType: 'INVITATION',
        entityId: invite.id,
        metadata: { role: invite.role }
    });

    return { success: true };
}
