'use server';

import { getAuthUser } from '@/lib/auth/resolver';
import { adminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/utils/errorMessage';

const SUPER_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SUPERADMIN', 'OWNER', 'ADMIN', 'MARKETPLACE_ADMIN']);
const OFFER_OVERRIDE_ACTIONS = [
    'SUPER_ADMIN_DEALER_OFFER_OVERRIDE',
    'SUPER_ADMIN_DEALER_OFFER_BULK_OVERRIDE',
    'SUPER_ADMIN_DEALER_OFFER_DEACTIVATE',
] as const;

export interface AdminDealerOfferRow {
    id: string;
    tenantId: string;
    dealershipName: string;
    dealershipSlug: string;
    skuId: string;
    skuName: string;
    skuType: string;
    brandName: string;
    modelName: string;
    stateCode: string;
    offerAmount: number;
    isActive: boolean;
    inclusionType: string;
    tatDays: number | null;
    baseExShowroom: number;
    priceAfterOffer: number;
    updatedAt: string | null;
}

export interface DealerOfferFilterOption {
    id: string;
    label: string;
}

export interface GetAllDealerOffersResult {
    success: boolean;
    message?: string;
    rows: AdminDealerOfferRow[];
    dealerships: DealerOfferFilterOption[];
    brands: DealerOfferFilterOption[];
    models: DealerOfferFilterOption[];
}

export interface DealerOfferOverrideHistoryRow {
    id: string;
    action: string;
    actionLabel: string;
    actorName: string;
    dealerLabel: string;
    skuLabel: string;
    offerDelta: number | null;
    updatedCount: number | null;
    createdAt: string;
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

export async function getAllDealerOffersForAdmin(): Promise<GetAllDealerOffersResult> {
    try {
        const user = await getAuthUser();
        if (!user?.id) {
            return {
                success: false,
                message: 'Authentication required',
                rows: [],
                dealerships: [],
                brands: [],
                models: [],
            };
        }

        const allowed = await isAumsAdmin(user.id);
        if (!allowed) {
            return {
                success: false,
                message: 'Only AUMS super admins can access dealer offer overrides.',
                rows: [],
                dealerships: [],
                brands: [],
                models: [],
            };
        }

        const { data: offerRows, error: offerError } = await adminClient
            .from('cat_price_dealer')
            .select(
                'id, tenant_id, vehicle_color_id, state_code, offer_amount, is_active, inclusion_type, tat_days, updated_at'
            )
            .not('vehicle_color_id', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(5000);

        if (offerError) {
            return {
                success: false,
                message: `Failed to fetch dealer offers: ${getErrorMessage(offerError)}`,
                rows: [],
                dealerships: [],
                brands: [],
                models: [],
            };
        }

        const safeOffers = (offerRows || []).filter(row => row.vehicle_color_id && row.tenant_id);
        if (safeOffers.length === 0) {
            return { success: true, rows: [], dealerships: [], brands: [], models: [] };
        }

        const tenantIds = Array.from(new Set(safeOffers.map(row => String(row.tenant_id))));
        const skuIds = Array.from(new Set(safeOffers.map(row => String(row.vehicle_color_id))));
        const stateCodes = Array.from(new Set(safeOffers.map(row => String(row.state_code || 'MH').toUpperCase())));

        const [tenantRes, skuRes, basePriceRes] = await Promise.all([
            adminClient.from('id_tenants').select('id, name, slug, type').in('id', tenantIds),
            adminClient
                .from('cat_skus')
                .select('id, name, sku_type, brand_id, model_id, cat_brands:brand_id(name), cat_models:model_id(name)')
                .in('id', skuIds),
            adminClient
                .from('cat_price_state_mh')
                .select('sku_id, state_code, ex_showroom')
                .in('sku_id', skuIds)
                .in('state_code', stateCodes),
        ]);

        if (tenantRes.error || skuRes.error || basePriceRes.error) {
            return {
                success: false,
                message: `Failed to resolve offer metadata: ${getErrorMessage(
                    tenantRes.error || skuRes.error || basePriceRes.error
                )}`,
                rows: [],
                dealerships: [],
                brands: [],
                models: [],
            };
        }

        const tenantMap = new Map(
            (tenantRes.data || []).map(tenant => [
                tenant.id,
                {
                    name: String(tenant.name || 'Unknown Dealer'),
                    slug: String(tenant.slug || ''),
                    type: String(tenant.type || '').toUpperCase(),
                },
            ])
        );

        const skuMap = new Map(
            (skuRes.data || []).map(sku => {
                const brand = (sku as any)?.cat_brands?.name || 'Unknown Brand';
                const model = (sku as any)?.cat_models?.name || 'Unknown Model';
                return [
                    sku.id,
                    {
                        name: String(sku.name || sku.id),
                        skuType: String(sku.sku_type || 'UNKNOWN').toUpperCase(),
                        brandName: String(brand),
                        modelName: String(model),
                    },
                ];
            })
        );

        const basePriceMap = new Map<string, number>();
        for (const row of basePriceRes.data || []) {
            basePriceMap.set(
                `${row.sku_id}:${String(row.state_code || '').toUpperCase()}`,
                Number(row.ex_showroom || 0)
            );
        }

        const rows: AdminDealerOfferRow[] = [];
        for (const row of safeOffers) {
            const tenantId = String(row.tenant_id);
            const skuId = String(row.vehicle_color_id);
            const tenant = tenantMap.get(tenantId);
            const sku = skuMap.get(skuId);

            if (!tenant || tenant.type === 'SUPER_ADMIN' || !sku) {
                continue;
            }

            const stateCode = String(row.state_code || 'MH').toUpperCase();
            const offerAmount = Number(row.offer_amount || 0);
            const baseExShowroom = Number(basePriceMap.get(`${skuId}:${stateCode}`) || 0);

            rows.push({
                id: row.id,
                tenantId,
                dealershipName: tenant.name,
                dealershipSlug: tenant.slug,
                skuId,
                skuName: sku.name,
                skuType: sku.skuType,
                brandName: sku.brandName,
                modelName: sku.modelName,
                stateCode,
                offerAmount,
                isActive: row.is_active ?? true,
                inclusionType: String(row.inclusion_type || 'OPTIONAL').toUpperCase(),
                tatDays: row.tat_days,
                baseExShowroom,
                priceAfterOffer: baseExShowroom + offerAmount,
                updatedAt: row.updated_at,
            });
        }

        const dealershipMap = new Map<string, string>();
        const brandMap = new Map<string, string>();
        const modelMap = new Map<string, string>();

        for (const row of rows) {
            dealershipMap.set(row.tenantId, row.dealershipName);
            brandMap.set(row.brandName, row.brandName);
            modelMap.set(row.modelName, row.modelName);
        }

        return {
            success: true,
            rows,
            dealerships: Array.from(dealershipMap.entries())
                .map(([id, label]) => ({ id, label }))
                .sort((a, b) => a.label.localeCompare(b.label)),
            brands: Array.from(brandMap.entries())
                .map(([id, label]) => ({ id, label }))
                .sort((a, b) => a.label.localeCompare(b.label)),
            models: Array.from(modelMap.entries())
                .map(([id, label]) => ({ id, label }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        };
    } catch (error) {
        return {
            success: false,
            message: getErrorMessage(error) || 'Unexpected error while fetching dealer offers',
            rows: [],
            dealerships: [],
            brands: [],
            models: [],
        };
    }
}

function actionLabel(action: string) {
    if (action === 'SUPER_ADMIN_DEALER_OFFER_BULK_OVERRIDE') return 'Bulk Override';
    if (action === 'SUPER_ADMIN_DEALER_OFFER_DEACTIVATE') return 'Disabled';
    return 'Override';
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map(v => String(v || '').trim()).filter(Boolean);
}

export async function getDealerOfferOverrideHistory(
    limit: number = 20
): Promise<{ success: boolean; message?: string; rows: DealerOfferOverrideHistoryRow[] }> {
    try {
        const user = await getAuthUser();
        if (!user?.id) {
            return { success: false, message: 'Authentication required', rows: [] };
        }

        const allowed = await isAumsAdmin(user.id);
        if (!allowed) {
            return {
                success: false,
                message: 'Only AUMS super admins can access override history.',
                rows: [],
            };
        }

        const { data, error } = await adminClient
            .from('audit_logs')
            .select('id, action, metadata, created_at, user_id')
            .in('action', [...OFFER_OVERRIDE_ACTIONS])
            .order('created_at', { ascending: false })
            .limit(Math.min(Math.max(limit, 1), 100));

        if (error) {
            return { success: false, message: `Failed to fetch history: ${getErrorMessage(error)}`, rows: [] };
        }

        const safeRows = data || [];
        const tenantIds = new Set<string>();
        const skuIds = new Set<string>();
        const userIds = new Set<string>();

        for (const row of safeRows) {
            if (row.user_id) userIds.add(String(row.user_id));
            const meta = (row.metadata || {}) as Record<string, unknown>;
            const tenantId = String(meta.tenant_id || '').trim();
            if (tenantId) tenantIds.add(tenantId);
            const bulkIds = asStringArray(meta.tenant_ids);
            for (const id of bulkIds) tenantIds.add(id);
            const skuId = String(meta.sku_id || '').trim();
            if (skuId) skuIds.add(skuId);
        }

        const [tenantRes, skuRes, memberRes] = await Promise.all([
            tenantIds.size
                ? adminClient.from('id_tenants').select('id, name').in('id', Array.from(tenantIds))
                : Promise.resolve({ data: [], error: null } as any),
            skuIds.size
                ? adminClient.from('cat_skus').select('id, name').in('id', Array.from(skuIds))
                : Promise.resolve({ data: [], error: null } as any),
            userIds.size
                ? adminClient.from('id_members').select('id, full_name').in('id', Array.from(userIds))
                : Promise.resolve({ data: [], error: null } as any),
        ]);

        const tenantMap = new Map<string, string>(
            (tenantRes.data || []).map((row: any) => [String(row.id), String(row.name || row.id)])
        );
        const skuMap = new Map<string, string>(
            (skuRes.data || []).map((row: any) => [String(row.id), String(row.name || row.id)])
        );
        const memberMap = new Map<string, string>(
            (memberRes.data || []).map((row: any) => [String(row.id), String(row.full_name || 'Unknown Admin')])
        );

        const rows: DealerOfferOverrideHistoryRow[] = safeRows.map(row => {
            const meta = (row.metadata || {}) as Record<string, unknown>;
            const tenantId = String(meta.tenant_id || '').trim();
            const bulkTenantIds = asStringArray(meta.tenant_ids);
            const skuId = String(meta.sku_id || '').trim();
            const actorName = String(memberMap.get(String(row.user_id || '')) || 'Unknown Admin');

            let dealerLabel = 'Unknown Dealership';
            if (bulkTenantIds.length > 0) {
                const named = bulkTenantIds.map(id => tenantMap.get(id) || id);
                dealerLabel =
                    named.length <= 3 ? named.join(', ') : `${named.slice(0, 3).join(', ')} +${named.length - 3} more`;
            } else if (tenantId) {
                dealerLabel = tenantMap.get(tenantId) || tenantId;
            }

            const skuLabel = String(skuMap.get(skuId) || skuId || 'Unknown SKU');

            return {
                id: String(row.id),
                action: String(row.action || 'UNKNOWN'),
                actionLabel: actionLabel(String(row.action || 'UNKNOWN')),
                actorName,
                dealerLabel,
                skuLabel,
                offerDelta: Number.isFinite(Number(meta.offer_delta)) ? Number(meta.offer_delta) : null,
                updatedCount: Number.isFinite(Number(meta.updated_count)) ? Number(meta.updated_count) : null,
                createdAt: String(row.created_at || ''),
            };
        });

        return { success: true, rows };
    } catch (error) {
        return {
            success: false,
            message: getErrorMessage(error) || 'Unexpected error while loading override history',
            rows: [],
        };
    }
}
