'use server';

import { getAuthUser } from '@/lib/auth/resolver';
import { adminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/utils/errorMessage';

const SUPER_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SUPERADMIN', 'OWNER', 'ADMIN', 'MARKETPLACE_ADMIN']);

export interface DealerOfferUpdateInput {
    tenantId: string;
    skuId: string;
    stateCode: string;
    offerDelta: number;
    isActive?: boolean;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    tatDays?: number | null;
}

export interface DealerOfferBulkUpdateInput {
    tenantIds: string[];
    skuId: string;
    stateCode: string;
    offerDelta: number;
    isActive?: boolean;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    tatDays?: number | null;
}

export interface DealerOfferUpdateResult {
    success: boolean;
    message?: string;
    updatedCount?: number;
}

export interface DealerOfferDeactivateInput {
    tenantId: string;
    skuId: string;
    stateCode: string;
}

function normalizeRole(role?: string | null) {
    return String(role || '')
        .trim()
        .toUpperCase();
}

async function isAumsAdmin(userId: string) {
    const { data } = await adminClient
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .eq('id_tenants.slug', 'aums')
        .maybeSingle();

    const role = normalizeRole((data as { role?: string } | null)?.role);
    return SUPER_ADMIN_ROLES.has(role);
}

function normalizePayload(input: {
    tenantId: string;
    skuId: string;
    stateCode: string;
    offerDelta: number;
    isActive?: boolean;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    tatDays?: number | null;
}) {
    return {
        tenant_id: input.tenantId,
        vehicle_color_id: input.skuId,
        state_code: String(input.stateCode || 'MH')
            .trim()
            .toUpperCase(),
        offer_amount: Math.trunc(Number(input.offerDelta || 0)),
        is_active: input.isActive ?? true,
        inclusion_type: input.inclusionType || 'OPTIONAL',
        tat_days: input.tatDays ?? 0,
        tat_source: 'MANUAL',
    };
}

async function ensureAumsAdmin() {
    const user = await getAuthUser();
    if (!user?.id) return { ok: false, userId: null, message: 'Authentication required' };
    const allowed = await isAumsAdmin(user.id);
    if (!allowed) {
        return {
            ok: false,
            userId: user.id,
            message: 'Only AUMS super admins can update dealer offers.',
        };
    }
    return { ok: true, userId: user.id, message: '' };
}

export async function updateDealerOffer(input: DealerOfferUpdateInput): Promise<DealerOfferUpdateResult> {
    try {
        if (!input.tenantId || !input.skuId || !input.stateCode) {
            return { success: false, message: 'tenantId, skuId, and stateCode are required.' };
        }

        const auth = await ensureAumsAdmin();
        if (!auth.ok) return { success: false, message: auth.message };

        const payload = normalizePayload(input);
        const { error } = await adminClient.from('cat_price_dealer').upsert(payload, {
            onConflict: 'tenant_id,vehicle_color_id,state_code',
        });

        if (error) {
            return { success: false, message: `Failed to update dealer offer: ${getErrorMessage(error)}` };
        }

        await adminClient.from('audit_logs').insert({
            user_id: auth.userId,
            action: 'SUPER_ADMIN_DEALER_OFFER_OVERRIDE',
            metadata: {
                modified_by_super_admin: true,
                tenant_id: input.tenantId,
                sku_id: input.skuId,
                state_code: String(input.stateCode || '').toUpperCase(),
                offer_delta: Math.trunc(Number(input.offerDelta || 0)),
                is_active: input.isActive ?? true,
                inclusion_type: input.inclusionType || 'OPTIONAL',
                tat_days: input.tatDays ?? 0,
            },
        });

        return { success: true, updatedCount: 1 };
    } catch (error) {
        return {
            success: false,
            message: getErrorMessage(error) || 'Unexpected error while updating dealer offer',
        };
    }
}

export async function updateDealerOfferBulk(input: DealerOfferBulkUpdateInput): Promise<DealerOfferUpdateResult> {
    try {
        if (!input.skuId || !input.stateCode || !Array.isArray(input.tenantIds) || input.tenantIds.length === 0) {
            return { success: false, message: 'tenantIds, skuId, and stateCode are required.' };
        }

        const auth = await ensureAumsAdmin();
        if (!auth.ok) return { success: false, message: auth.message };

        const rows = input.tenantIds
            .map(id => String(id).trim())
            .filter(Boolean)
            .map(tenantId =>
                normalizePayload({
                    tenantId,
                    skuId: input.skuId,
                    stateCode: input.stateCode,
                    offerDelta: input.offerDelta,
                    isActive: input.isActive,
                    inclusionType: input.inclusionType,
                    tatDays: input.tatDays,
                })
            );

        if (rows.length === 0) {
            return { success: false, message: 'No valid tenant IDs provided for bulk update.' };
        }

        const { error } = await adminClient.from('cat_price_dealer').upsert(rows, {
            onConflict: 'tenant_id,vehicle_color_id,state_code',
        });

        if (error) {
            return { success: false, message: `Failed to apply bulk offer update: ${getErrorMessage(error)}` };
        }

        await adminClient.from('audit_logs').insert({
            user_id: auth.userId,
            action: 'SUPER_ADMIN_DEALER_OFFER_BULK_OVERRIDE',
            metadata: {
                modified_by_super_admin: true,
                tenant_ids: rows.map(row => row.tenant_id),
                sku_id: input.skuId,
                state_code: String(input.stateCode || '').toUpperCase(),
                offer_delta: Math.trunc(Number(input.offerDelta || 0)),
                updated_count: rows.length,
            },
        });

        return { success: true, updatedCount: rows.length };
    } catch (error) {
        return {
            success: false,
            message: getErrorMessage(error) || 'Unexpected error while applying bulk offer override',
        };
    }
}

export async function deactivateDealerOffer(input: DealerOfferDeactivateInput): Promise<DealerOfferUpdateResult> {
    try {
        if (!input.tenantId || !input.skuId || !input.stateCode) {
            return { success: false, message: 'tenantId, skuId, and stateCode are required.' };
        }

        const auth = await ensureAumsAdmin();
        if (!auth.ok) return { success: false, message: auth.message };

        const { data: existing } = await adminClient
            .from('cat_price_dealer')
            .select('offer_amount, inclusion_type, tat_days')
            .eq('tenant_id', input.tenantId)
            .eq('vehicle_color_id', input.skuId)
            .eq('state_code', String(input.stateCode || '').toUpperCase())
            .maybeSingle();

        const payload = normalizePayload({
            tenantId: input.tenantId,
            skuId: input.skuId,
            stateCode: input.stateCode,
            offerDelta: Number(existing?.offer_amount || 0),
            isActive: false,
            inclusionType: (existing?.inclusion_type as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') || 'OPTIONAL',
            tatDays: existing?.tat_days ?? 0,
        });

        const { error } = await adminClient.from('cat_price_dealer').upsert(payload, {
            onConflict: 'tenant_id,vehicle_color_id,state_code',
        });
        if (error) {
            return { success: false, message: `Failed to deactivate dealer offer: ${getErrorMessage(error)}` };
        }

        await adminClient.from('audit_logs').insert({
            user_id: auth.userId,
            action: 'SUPER_ADMIN_DEALER_OFFER_DEACTIVATE',
            metadata: {
                modified_by_super_admin: true,
                tenant_id: input.tenantId,
                sku_id: input.skuId,
                state_code: String(input.stateCode || '').toUpperCase(),
                is_active: false,
            },
        });

        return { success: true, updatedCount: 1 };
    } catch (error) {
        return {
            success: false,
            message: getErrorMessage(error) || 'Unexpected error while deactivating dealer offer',
        };
    }
}
