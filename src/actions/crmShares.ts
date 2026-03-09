'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ── Valid status values (matches DB CHECK constraint: PENDING|APPROVED|REJECTED|REVOKED) ──
type ShareStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
// ── Valid share_type values (matches DB CHECK constraint) ──
type ShareType = 'AUTO_PRIMARY' | 'AUTO_REFERRAL' | 'MANUAL_REQUEST';

async function resolveActorContext(actorTenantId?: string | null) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const actorUserId = user?.id || null;
    let finalActorTenantId = actorTenantId || null;

    if (!finalActorTenantId && actorUserId) {
        const { data: teamMembership } = await adminClient
            .from('id_team')
            .select('tenant_id')
            .eq('user_id', actorUserId)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        finalActorTenantId = teamMembership?.tenant_id || null;
    }

    return { actorUserId, actorTenantId: finalActorTenantId };
}

async function verifyLeadAccess(leadId: string, actorTenantId: string | null): Promise<boolean> {
    if (!actorTenantId) return false;

    // Fast path: actor is the lead owner
    const { data: lead } = await adminClient.from('crm_leads').select('owner_tenant_id').eq('id', leadId).single();

    if (lead?.owner_tenant_id === actorTenantId) {
        return true;
    }

    // Slow path: actor has an explicitly APPROVED share for this lead
    const { data: share } = await adminClient
        .from('crm_dealer_shares')
        .select('id')
        .eq('lead_id', leadId)
        .eq('dealer_tenant_id', actorTenantId)
        .eq('status', 'APPROVED')
        .limit(1)
        .maybeSingle();

    return !!share;
}

async function verifyShareTransitionAccess(shareId: string, actorTenantId: string | null): Promise<boolean> {
    if (!actorTenantId) return false;

    const { data: share } = await adminClient
        .from('crm_dealer_shares')
        .select(
            `
            dealer_tenant_id,
            crm_leads ( owner_tenant_id )
        `
        )
        .eq('id', shareId)
        .single();

    if (!share) return false;

    const ownerTenantId = Array.isArray(share.crm_leads)
        ? share.crm_leads[0]?.owner_tenant_id
        : (share.crm_leads as any)?.owner_tenant_id;

    return actorTenantId === ownerTenantId || actorTenantId === share.dealer_tenant_id;
}

async function logSecurityViolation(
    leadId: string,
    actorUserId: string | null,
    actorTenantId: string | null,
    action: string,
    details: any
) {
    await adminClient.from('crm_lead_events').insert({
        lead_id: leadId,
        event_type: 'SECURITY_VIOLATION',
        actor_user_id: actorUserId,
        actor_tenant_id: actorTenantId,
        notes: `Unauthorized share action attempt: ${action}`,
        changed_value: JSON.stringify(details),
    });
}

export async function requestLeadShareAction(input: {
    leadId: string;
    targetTenantId: string;
    shareType?: ShareType;
    actorTenantId?: string;
}) {
    const { actorUserId, actorTenantId } = await resolveActorContext(input.actorTenantId);

    if (!actorUserId) {
        return { success: false, message: 'Authentication required' };
    }

    const hasAccess = await verifyLeadAccess(input.leadId, actorTenantId);
    if (!hasAccess) {
        await logSecurityViolation(input.leadId, actorUserId, actorTenantId, 'requestLeadShareAction', {
            targetTenantId: input.targetTenantId,
        });
        return { success: false, message: 'Forbidden: You do not have permission to share this lead.' };
    }

    // Insert as PENDING — DB trigger enforces requested_by NOT NULL
    const { data: share, error } = await adminClient
        .from('crm_dealer_shares')
        .insert({
            lead_id: input.leadId,
            dealer_tenant_id: input.targetTenantId,
            status: 'PENDING' satisfies ShareStatus,
            is_primary: false,
            share_type: (input.shareType ?? 'MANUAL_REQUEST') satisfies ShareType,
            requested_by: actorUserId,
        })
        .select('id')
        .single();

    if (error) {
        console.error('requestLeadShareAction error:', error);
        return { success: false, message: error.message || 'Failed to request share' };
    }

    // Log event
    await adminClient.from('crm_lead_events').insert({
        lead_id: input.leadId,
        event_type: 'SHARE_REQUESTED',
        actor_user_id: actorUserId,
        actor_tenant_id: actorTenantId,
        notes: `Share requested to tenant: ${input.targetTenantId}`,
        changed_value: JSON.stringify({
            share_id: share.id,
            target_tenant_id: input.targetTenantId,
            share_type: input.shareType ?? 'MANUAL_REQUEST',
        }),
    });

    return { success: true, shareId: share.id };
}

export async function approveLeadShareAction(input: { shareId: string; leadId: string; actorTenantId?: string }) {
    const { actorUserId, actorTenantId } = await resolveActorContext(input.actorTenantId);

    if (!actorUserId) {
        return { success: false, message: 'Authentication required' };
    }

    const hasAccess = await verifyShareTransitionAccess(input.shareId, actorTenantId);
    if (!hasAccess) {
        await logSecurityViolation(input.leadId, actorUserId, actorTenantId, 'approveLeadShareAction', {
            shareId: input.shareId,
        });
        return { success: false, message: 'Forbidden: You do not have permission to approve this share.' };
    }

    const now = new Date().toISOString();

    const { error } = await adminClient
        .from('crm_dealer_shares')
        .update({
            status: 'APPROVED' satisfies ShareStatus,
            approved_by: actorUserId,
            approved_at: now,
        })
        .eq('id', input.shareId)
        .eq('status', 'PENDING' satisfies ShareStatus);

    if (error) {
        console.error('approveLeadShareAction error:', error);
        return { success: false, message: error.message || 'Failed to approve share' };
    }

    await adminClient.from('crm_lead_events').insert({
        lead_id: input.leadId,
        event_type: 'SHARE_APPROVED',
        actor_user_id: actorUserId,
        actor_tenant_id: actorTenantId,
        notes: `Share request approved.`,
        changed_value: JSON.stringify({ share_id: input.shareId }),
    });

    return { success: true };
}

export async function revokeLeadShareAction(input: {
    shareId: string;
    leadId: string;
    reason?: string;
    actorTenantId?: string;
}) {
    const { actorUserId, actorTenantId } = await resolveActorContext(input.actorTenantId);

    if (!actorUserId) {
        return { success: false, message: 'Authentication required' };
    }

    const hasAccess = await verifyShareTransitionAccess(input.shareId, actorTenantId);
    if (!hasAccess) {
        await logSecurityViolation(input.leadId, actorUserId, actorTenantId, 'revokeLeadShareAction', {
            shareId: input.shareId,
        });
        return { success: false, message: 'Forbidden: You do not have permission to revoke this share.' };
    }

    const now = new Date().toISOString();

    // Only APPROVED shares can be revoked (per DB trigger: APPROVED→REVOKED)
    const { error } = await adminClient
        .from('crm_dealer_shares')
        .update({
            status: 'REVOKED' satisfies ShareStatus,
            revoked_by: actorUserId,
            revoked_at: now,
        })
        .eq('id', input.shareId)
        .eq('status', 'APPROVED' satisfies ShareStatus);

    if (error) {
        console.error('revokeLeadShareAction error:', error);
        return { success: false, message: error.message || 'Failed to revoke share' };
    }

    await adminClient.from('crm_lead_events').insert({
        lead_id: input.leadId,
        event_type: 'SHARE_REVOKED',
        actor_user_id: actorUserId,
        actor_tenant_id: actorTenantId,
        notes: `Share revoked${input.reason ? `: ${input.reason}` : '.'}`,
        changed_value: JSON.stringify({ share_id: input.shareId, reason: input.reason }),
    });

    return { success: true };
}

export async function rejectLeadShareAction(input: {
    shareId: string;
    leadId: string;
    reason?: string;
    actorTenantId?: string;
}) {
    const { actorUserId, actorTenantId } = await resolveActorContext(input.actorTenantId);

    if (!actorUserId) {
        return { success: false, message: 'Authentication required' };
    }

    const hasAccess = await verifyShareTransitionAccess(input.shareId, actorTenantId);
    if (!hasAccess) {
        await logSecurityViolation(input.leadId, actorUserId, actorTenantId, 'rejectLeadShareAction', {
            shareId: input.shareId,
        });
        return { success: false, message: 'Forbidden: You do not have permission to reject this share.' };
    }

    const now = new Date().toISOString();

    // Only PENDING shares can be rejected (per DB trigger: PENDING→REJECTED)
    const { error } = await adminClient
        .from('crm_dealer_shares')
        .update({
            status: 'REJECTED' satisfies ShareStatus,
            rejected_by: actorUserId,
            rejected_at: now,
        })
        .eq('id', input.shareId)
        .eq('status', 'PENDING' satisfies ShareStatus);

    if (error) {
        console.error('rejectLeadShareAction error:', error);
        return { success: false, message: error.message || 'Failed to reject share' };
    }

    await adminClient.from('crm_lead_events').insert({
        lead_id: input.leadId,
        event_type: 'SHARE_REJECTED',
        actor_user_id: actorUserId,
        actor_tenant_id: actorTenantId,
        notes: `Share rejected${input.reason ? `: ${input.reason}` : '.'}`,
        changed_value: JSON.stringify({ share_id: input.shareId, reason: input.reason }),
    });

    return { success: true };
}
