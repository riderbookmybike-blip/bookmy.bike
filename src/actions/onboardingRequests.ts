'use server';

import { adminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/auth/resolver';
import { getErrorMessage } from '@/lib/utils/errorMessage';

type RequestScope = 'FINANCER_TEAM' | 'DEALERSHIP_TEAM';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type TenantLite = { id: string; name: string; slug: string | null };

export interface OnboardingRequestRow {
    requestId: string;
    status: RequestStatus;
    submittedAt: string | null;
    updatedAt: string | null;
    fullName: string;
    phone: string;
    email: string | null;
    pincode: string | null;
    userId: string | null;
    financeTenantIds: string[];
    dealershipTenantIds: string[];
    financeTenants: TenantLite[];
    dealershipTenants: TenantLite[];
    requestedScopes: RequestScope[];
    crmAccessRequested: boolean;
    raw: any;
}

function isPrivilegedRole(role?: string | null) {
    const normalized = String(role || '')
        .trim()
        .toUpperCase();
    if (!normalized) return false;
    return (
        normalized === 'OWNER' ||
        normalized === 'ADMIN' ||
        normalized === 'SUPER_ADMIN' ||
        normalized.endsWith('_ADMIN')
    );
}

async function resolveActorRoleForTenant(userId: string, tenantId: string) {
    const { data } = await adminClient
        .from('id_team')
        .select('role, status')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE')
        .maybeSingle();
    return data || null;
}

async function isAumsAdmin(userId: string) {
    const { data } = await adminClient
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .eq('id_tenants.slug', 'aums')
        .maybeSingle();
    return !!data && isPrivilegedRole((data as any).role);
}

function parseRequestRow(row: any): OnboardingRequestRow | null {
    const payload = (row?.new_data || {}) as any;
    if (!payload?.request_id) return null;

    return {
        requestId: String(payload.request_id),
        status: (String(payload.status || 'PENDING').toUpperCase() as RequestStatus) || 'PENDING',
        submittedAt: payload.submitted_at || row?.created_at || null,
        updatedAt: payload.updated_at || null,
        fullName: String(payload.full_name || ''),
        phone: String(payload.phone || ''),
        email: payload.email ? String(payload.email) : null,
        pincode: payload.pincode ? String(payload.pincode) : null,
        userId: payload.user_id ? String(payload.user_id) : null,
        financeTenantIds: Array.isArray(payload.finance_tenant_ids)
            ? payload.finance_tenant_ids.map((id: unknown) => String(id || '')).filter(Boolean)
            : [],
        dealershipTenantIds: Array.isArray(payload.dealership_tenant_ids)
            ? payload.dealership_tenant_ids.map((id: unknown) => String(id || '')).filter(Boolean)
            : [],
        requestedScopes: Array.isArray(payload.requested_scopes)
            ? (payload.requested_scopes
                  .map((scope: unknown) => String(scope || '').toUpperCase())
                  .filter(Boolean) as RequestScope[])
            : ['FINANCER_TEAM', 'DEALERSHIP_TEAM'],
        financeTenants: [],
        dealershipTenants: [],
        crmAccessRequested: payload.crm_access_requested === false ? false : true,
        raw: row,
    };
}

function canTenantReviewRequest(tenantId: string, req: OnboardingRequestRow) {
    return req.financeTenantIds.includes(tenantId) || req.dealershipTenantIds.includes(tenantId);
}

async function ensureTeamMembership(userId: string, tenantId: string, fallbackRole: string) {
    const { data: existing } = await adminClient
        .from('id_team')
        .select('id, role, status')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

    if (!existing?.id) {
        const { error } = await adminClient.from('id_team').insert({
            user_id: userId,
            tenant_id: tenantId,
            role: fallbackRole,
            status: 'ACTIVE',
        });
        if (error) throw new Error(error.message);
        return;
    }

    if (String(existing.status || '').toUpperCase() !== 'ACTIVE') {
        const { error } = await adminClient.from('id_team').update({ status: 'ACTIVE' }).eq('id', existing.id);
        if (error) throw new Error(error.message);
    }
}

async function enforceSingleFinancerMembership(userId: string, allowedFinanceTenantId: string) {
    if (!userId || !allowedFinanceTenantId) return;
    const { data: activeFinanceTeams, error } = await adminClient
        .from('id_team')
        .select('id, tenant_id, id_tenants!inner(type)')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');
    if (error) throw new Error(error.message);

    const deactivateIds = (activeFinanceTeams || [])
        .filter((row: any) => String(row?.id_tenants?.type || '').toUpperCase() === 'BANK')
        .filter((row: any) => String(row?.tenant_id || '') !== allowedFinanceTenantId)
        .map((row: any) => String(row?.id || ''))
        .filter(Boolean);

    if (deactivateIds.length === 0) return;
    const { error: deactivateError } = await adminClient
        .from('id_team')
        .update({ status: 'INACTIVE' })
        .in('id', deactivateIds);
    if (deactivateError) throw new Error(deactivateError.message);
}

async function syncDealerFinanceCrmAccess(
    userId: string,
    financeTenantIds: string[],
    dealershipTenantIds: string[],
    crmAccess: boolean
) {
    if (!userId || financeTenantIds.length === 0 || dealershipTenantIds.length === 0) return;
    for (const financeTenantId of financeTenantIds) {
        for (const dealerTenantId of dealershipTenantIds) {
            if (crmAccess) {
                const { data: existing, error: existingError } = await adminClient
                    .from('dealer_finance_user_access')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('finance_tenant_id', financeTenantId)
                    .eq('dealer_tenant_id', dealerTenantId)
                    .maybeSingle();
                if (existingError) throw new Error(existingError.message);

                if (existing?.id) {
                    const { error: updateError } = await adminClient
                        .from('dealer_finance_user_access')
                        .update({ crm_access: true })
                        .eq('id', existing.id);
                    if (updateError) throw new Error(updateError.message);
                } else {
                    const { error: insertError } = await adminClient.from('dealer_finance_user_access').insert({
                        user_id: userId,
                        finance_tenant_id: financeTenantId,
                        dealer_tenant_id: dealerTenantId,
                        crm_access: true,
                    });
                    if (insertError) throw new Error(insertError.message);
                }
            } else {
                const { error: deleteError } = await adminClient
                    .from('dealer_finance_user_access')
                    .delete()
                    .eq('user_id', userId)
                    .eq('finance_tenant_id', financeTenantId)
                    .eq('dealer_tenant_id', dealerTenantId);
                if (deleteError) throw new Error(deleteError.message);
            }
        }
    }
}

export async function getOnboardingRequestsAction(params?: { tenantId?: string; status?: RequestStatus | 'ALL' }) {
    try {
        const user = await getAuthUser();
        if (!user?.id)
            return { success: false, message: 'Authentication required', rows: [] as OnboardingRequestRow[] };

        const tenantId = String(params?.tenantId || '').trim() || null;
        const requestedStatus = String(params?.status || 'PENDING').toUpperCase() as RequestStatus | 'ALL';

        const aumsAdmin = await isAumsAdmin(user.id);
        if (!aumsAdmin) {
            if (!tenantId)
                return { success: false, message: 'Tenant context required', rows: [] as OnboardingRequestRow[] };
            const actorMembership = await resolveActorRoleForTenant(user.id, tenantId);
            if (!actorMembership || !isPrivilegedRole((actorMembership as any).role)) {
                return {
                    success: false,
                    message: 'You are not authorized to review onboarding requests.',
                    rows: [] as OnboardingRequestRow[],
                };
            }
        }

        let query = adminClient
            .from('catalog_audit_log')
            .select('*')
            .eq('table_name', 'team_access_requests')
            .order('created_at', { ascending: false })
            .limit(300);

        const { data, error } = await query;
        if (error) throw error;

        const parsed = (data || []).map(parseRequestRow).filter(Boolean) as OnboardingRequestRow[];
        const allTenantIds = Array.from(
            new Set(
                parsed
                    .flatMap(row => [...row.financeTenantIds, ...row.dealershipTenantIds])
                    .map(id => String(id || '').trim())
                    .filter(Boolean)
            )
        );
        const tenantNameMap = new Map<string, TenantLite>();
        if (allTenantIds.length > 0) {
            const { data: tenants } = await adminClient
                .from('id_tenants')
                .select('id, name, slug')
                .in('id', allTenantIds);
            for (const tenant of tenants || []) {
                tenantNameMap.set(String((tenant as any).id), {
                    id: String((tenant as any).id),
                    name: String((tenant as any).name || 'Unknown tenant'),
                    slug: ((tenant as any).slug as string | null) || null,
                });
            }
        }

        const parsedWithNames = parsed.map(row => ({
            ...row,
            financeTenants: row.financeTenantIds.map(id => tenantNameMap.get(id) || { id, name: id, slug: null }),
            dealershipTenants: row.dealershipTenantIds.map(id => tenantNameMap.get(id) || { id, name: id, slug: null }),
        }));
        const scoped = aumsAdmin
            ? parsedWithNames
            : parsedWithNames.filter(req => (tenantId ? canTenantReviewRequest(tenantId, req) : false));
        const filtered = requestedStatus === 'ALL' ? scoped : scoped.filter(req => req.status === requestedStatus);

        return { success: true, rows: filtered };
    } catch (error) {
        return { success: false, message: getErrorMessage(error), rows: [] as OnboardingRequestRow[] };
    }
}

export async function reviewOnboardingRequestAction(input: {
    requestId: string;
    tenantId?: string;
    decision: 'APPROVE' | 'REJECT';
    reason?: string;
    crmAccess?: boolean;
}) {
    try {
        const user = await getAuthUser();
        if (!user?.id) return { success: false, message: 'Authentication required' };
        const requestId = String(input.requestId || '').trim();
        if (!requestId) return { success: false, message: 'Request ID required' };

        const { data: row, error } = await adminClient
            .from('catalog_audit_log')
            .select('*')
            .eq('table_name', 'team_access_requests')
            .eq('record_id', requestId)
            .maybeSingle();
        if (error || !row) return { success: false, message: error?.message || 'Request not found' };

        const parsed = parseRequestRow(row);
        if (!parsed) return { success: false, message: 'Malformed request payload' };

        const tenantId = String(input.tenantId || '').trim() || null;
        const aumsAdmin = await isAumsAdmin(user.id);
        if (!aumsAdmin) {
            if (!tenantId) return { success: false, message: 'Tenant context required' };
            const actorMembership = await resolveActorRoleForTenant(user.id, tenantId);
            if (!actorMembership || !isPrivilegedRole((actorMembership as any).role)) {
                return { success: false, message: 'You are not authorized to review this request.' };
            }
            if (!canTenantReviewRequest(tenantId, parsed)) {
                return { success: false, message: 'This request does not belong to your tenant scope.' };
            }
        }

        const now = new Date().toISOString();
        const nextStatus: RequestStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const finalCrmAccess = input.crmAccess === false ? false : true;
        const currentPayload = (row.new_data || {}) as Record<string, unknown>;
        const reviewHistoryRaw = currentPayload.review_history;
        const reviewHistory = Array.isArray(reviewHistoryRaw)
            ? ([...reviewHistoryRaw] as any[])
            : reviewHistoryRaw && typeof reviewHistoryRaw === 'object'
              ? ([reviewHistoryRaw] as any[])
              : [];
        reviewHistory.unshift({
            decision: nextStatus,
            reviewed_by: user.id,
            reviewed_tenant_id: tenantId,
            reviewed_at: now,
            reason: input.reason || null,
        });

        const updatedPayload = {
            ...currentPayload,
            status: nextStatus,
            updated_at: now,
            reviewed_by: user.id,
            reviewed_tenant_id: tenantId,
            review_reason: input.reason || null,
            crm_access_granted: nextStatus === 'APPROVED' ? finalCrmAccess : null,
            review_history: reviewHistory,
        };

        const { error: updateError } = await adminClient
            .from('catalog_audit_log')
            .update({
                new_data: updatedPayload,
                actor_id: user.id,
                actor_label: 'REVIEW',
            })
            .eq('id', row.id);
        if (updateError) return { success: false, message: updateError.message };

        if (nextStatus === 'APPROVED' && parsed.userId) {
            for (const financeTenantId of parsed.financeTenantIds) {
                await ensureTeamMembership(parsed.userId, financeTenantId, 'FINANCER_EXEC');
            }
            if (parsed.financeTenantIds.length > 0) {
                await enforceSingleFinancerMembership(parsed.userId, parsed.financeTenantIds[0]);
            }
            for (const dealerTenantId of parsed.dealershipTenantIds) {
                await ensureTeamMembership(parsed.userId, dealerTenantId, 'STAFF');
            }
            await syncDealerFinanceCrmAccess(
                parsed.userId,
                parsed.financeTenantIds,
                parsed.dealershipTenantIds,
                finalCrmAccess
            );
        }

        const notifyTenantIds = Array.from(new Set([...parsed.financeTenantIds, ...parsed.dealershipTenantIds]));
        if (notifyTenantIds.length > 0) {
            await adminClient.from('notifications').insert(
                notifyTenantIds.map(tid => ({
                    tenant_id: tid,
                    type: 'ONBOARDING_REQUEST_REVIEWED',
                    title: `Onboarding Request ${nextStatus}`,
                    message: `${parsed.fullName} request is ${nextStatus.toLowerCase()}.`,
                    metadata: {
                        request_id: parsed.requestId,
                        status: nextStatus,
                        reviewed_by: user.id,
                        reviewed_tenant_id: tenantId,
                    },
                }))
            );
        }

        return { success: true, status: nextStatus };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
}
