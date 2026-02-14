import { adminClient } from '@/lib/supabase/admin';

export type AuditAction =
    | 'INVITE_CREATED'
    | 'INVITE_REVOKED'
    | 'INVITE_ACCEPTED'
    | 'MEMBER_ROLE_UPDATED'
    | 'MEMBER_REMOVED'
    | 'SETTINGS_UPDATED'
    | 'OWNERSHIP_TRANSFERRED'
    | 'REGISTRATION_RULE_CREATED'
    | 'REGISTRATION_RULE_UPDATED'
    | 'REGISTRATION_RULE_DELETED';

export type AuditEntityType = 'INVITATION' | 'MEMBERSHIP' | 'TENANT' | 'REGISTRATION_RULE';

interface AuditLogParams {
    tenantId: string;
    actorId: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: any;
    ip?: string;
    userAgent?: string;
}

export async function logAudit(params: AuditLogParams) {
    try {
        const { error } = await adminClient.from('audit_logs' as any).insert({
            tenant_id: params.tenantId,
            actor_id: params.actorId,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId,
            metadata: params.metadata || {},
            ip_address: params.ip,
            user_agent: params.userAgent,
        });

        if (error) {
            console.error('Failed to log audit:', error);
        }
    } catch (err) {
        console.error('Audit Log Exception:', err);
    }
}
