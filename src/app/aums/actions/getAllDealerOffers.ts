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

const PAGE_SIZE_MAX = 200;
const PAGE_SIZE_DEFAULT = 50;

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

export type DealerOfferStatus = 'ALL' | 'DISCOUNT' | 'SURGE' | 'FLAT' | 'INACTIVE';

export interface GetAllDealerOffersInput {
    page?: number; // 1-indexed, default 1
    pageSize?: number; // default 50, max 200
    tenantId?: string; // filter by dealership UUID ('ALL' = no filter)
    brandName?: string; // post-enrichment filter
    modelName?: string; // post-enrichment filter
    status?: DealerOfferStatus;
}

export interface GetAllDealerOffersResult {
    success: boolean;
    message?: string;
    rows: AdminDealerOfferRow[];
    totalCount: number;
    page: number;
    pageSize: number;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function ensureAumsAdmin() {
    const user = await getAuthUser();
    if (!user?.id) return { ok: false as const, userId: null, message: 'Authentication required' };
    const allowed = await isAumsAdmin(user.id);
    if (!allowed)
        return {
            ok: false as const,
            userId: user.id,
            message: 'Only AUMS super admins can access dealer offer overrides.',
        };
    return { ok: true as const, userId: user.id, message: '' };
}

/**
 * Build a Supabase query for cat_price_dealer with server-side filters applied.
 * Brand/model filters are NOT applied here (those fields live on cat_skus).
 */
function buildOfferQuery(input: GetAllDealerOffersInput) {
    let query = adminClient
        .from('cat_price_dealer')
        .select(
            'id, tenant_id, vehicle_color_id, state_code, offer_amount, is_active, inclusion_type, tat_days, updated_at',
            {
                count: 'exact',
            }
        )
        .not('vehicle_color_id', 'is', null)
        .order('updated_at', { ascending: false });

    // Server-side tenant filter
    const tenantId = input.tenantId?.trim();
    if (tenantId && tenantId !== 'ALL') {
        query = query.eq('tenant_id', tenantId);
    }

    // Server-side status filter (is_active)
    if (input.status === 'INACTIVE') {
        query = query.eq('is_active', false);
    } else if (input.status && input.status !== 'ALL') {
        // DISCOUNT / SURGE / FLAT are all active rows — filter offer_amount post-enrichment
        query = query.eq('is_active', true);
    }

    return query;
}

/**
 * Enrich raw cat_price_dealer rows with tenant, SKU, and base price data.
 * Applies brand/model/offer-amount post-enrichment filters.
 */
async function enrichOfferRows(
    rawRows: Array<{
        id: string;
        tenant_id: unknown;
        vehicle_color_id: unknown;
        state_code: unknown;
        offer_amount: unknown;
        is_active: unknown;
        inclusion_type: unknown;
        tat_days: unknown;
        updated_at: unknown;
    }>,
    input: GetAllDealerOffersInput
): Promise<{ rows: AdminDealerOfferRow[]; error?: string }> {
    const safeRows = rawRows.filter(r => r.vehicle_color_id && r.tenant_id);
    if (safeRows.length === 0) return { rows: [] };

    const tenantIds = Array.from(new Set(safeRows.map(r => String(r.tenant_id))));
    const skuIds = Array.from(new Set(safeRows.map(r => String(r.vehicle_color_id))));
    const stateCodes = Array.from(new Set(safeRows.map(r => String(r.state_code || 'MH').toUpperCase())));

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
            rows: [],
            error: getErrorMessage(tenantRes.error || skuRes.error || basePriceRes.error),
        };
    }

    const tenantMap = new Map(
        (tenantRes.data || []).map(t => [
            t.id,
            {
                name: String(t.name || 'Unknown Dealer'),
                slug: String(t.slug || ''),
                type: String(t.type || '').toUpperCase(),
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
    for (const r of basePriceRes.data || []) {
        basePriceMap.set(`${r.sku_id}:${String(r.state_code || '').toUpperCase()}`, Number(r.ex_showroom || 0));
    }

    const brandFilter = input.brandName?.trim();
    const modelFilter = input.modelName?.trim();

    const rows: AdminDealerOfferRow[] = [];
    for (const row of safeRows) {
        const tenantId = String(row.tenant_id);
        const skuId = String(row.vehicle_color_id);
        const tenant = tenantMap.get(tenantId);
        const sku = skuMap.get(skuId);

        if (!tenant || tenant.type === 'SUPER_ADMIN' || !sku) continue;

        // Post-enrichment brand/model filter
        if (brandFilter && brandFilter !== 'ALL' && sku.brandName !== brandFilter) continue;
        if (modelFilter && modelFilter !== 'ALL' && sku.modelName !== modelFilter) continue;

        const stateCode = String(row.state_code || 'MH').toUpperCase();
        const offerAmount = Number(row.offer_amount || 0);

        // Post-enrichment offer-amount status filter
        const status = input.status;
        if (status === 'DISCOUNT' && offerAmount >= 0) continue;
        if (status === 'SURGE' && offerAmount <= 0) continue;
        if (status === 'FLAT' && offerAmount !== 0) continue;

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
            isActive: (row.is_active as boolean) ?? true,
            inclusionType: String(row.inclusion_type || 'OPTIONAL').toUpperCase(),
            tatDays: row.tat_days as number | null,
            baseExShowroom,
            priceAfterOffer: baseExShowroom + offerAmount,
            updatedAt: row.updated_at as string | null,
        });
    }

    return { rows };
}

// ─── Public Actions ───────────────────────────────────────────────────────────

/**
 * Paginated + server-filtered fetch for the AUMS offer override table.
 * Also returns filter options (fetched from the full unfiltered dataset on first load).
 */
export async function getAllDealerOffersForAdmin(
    input: GetAllDealerOffersInput = {}
): Promise<GetAllDealerOffersResult> {
    const empty = (msg?: string): GetAllDealerOffersResult => ({
        success: !msg,
        message: msg,
        rows: [],
        totalCount: 0,
        page: 1,
        pageSize: PAGE_SIZE_DEFAULT,
        dealerships: [],
        brands: [],
        models: [],
    });

    try {
        const auth = await ensureAumsAdmin();
        if (!auth.ok) return empty(auth.message);

        const page = Math.max(1, Math.trunc(Number(input.page || 1)));
        const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Math.trunc(Number(input.pageSize || PAGE_SIZE_DEFAULT))));
        const offset = (page - 1) * pageSize;

        // Paginated query with server-side tenant + status filter
        const {
            data: rawPage,
            count,
            error: pageError,
        } = await buildOfferQuery(input).range(offset, offset + pageSize - 1);

        if (pageError) return empty(`Failed to fetch dealer offers: ${getErrorMessage(pageError)}`);

        const totalCount = count ?? 0;
        const { rows, error: enrichError } = await enrichOfferRows(rawPage || [], input);
        if (enrichError) return empty(`Failed to resolve offer metadata: ${enrichError}`);

        // Filter options: fetch from the full unfiltered set (only when on page 1 with no filters active,
        // or always — options are cheap since we only pull distinct tenant/sku ids via the enrichment maps)
        // For simplicity: only populate on first page load (caller caches them).
        const dealershipMap = new Map<string, string>();
        const brandMap = new Map<string, string>();
        const modelMap = new Map<string, string>();

        // If this is the first page with no filters, build option lists from current enriched rows.
        // For a comprehensive options list, we do a lightweight separate fetch if needed.
        const shouldFetchOptions =
            page === 1 &&
            (!input.tenantId || input.tenantId === 'ALL') &&
            (!input.brandName || input.brandName === 'ALL') &&
            (!input.modelName || input.modelName === 'ALL') &&
            (!input.status || input.status === 'ALL');
        if (shouldFetchOptions) {
            // Fetch all tenant + sku ids (no paging) just to build dropdown options
            const { data: allRaw } = await adminClient
                .from('cat_price_dealer')
                .select('tenant_id, vehicle_color_id')
                .not('vehicle_color_id', 'is', null)
                .limit(5000);

            if (allRaw && allRaw.length > 0) {
                const allTenantIds = Array.from(new Set(allRaw.map(r => String(r.tenant_id)).filter(Boolean)));
                const allSkuIds = Array.from(new Set(allRaw.map(r => String(r.vehicle_color_id)).filter(Boolean)));

                const [allTenantRes, allSkuRes] = await Promise.all([
                    adminClient.from('id_tenants').select('id, name, type').in('id', allTenantIds),
                    adminClient
                        .from('cat_skus')
                        .select('id, cat_brands:brand_id(name), cat_models:model_id(name)')
                        .in('id', allSkuIds),
                ]);

                for (const t of allTenantRes.data || []) {
                    if (String(t.type || '').toUpperCase() !== 'SUPER_ADMIN') {
                        dealershipMap.set(t.id, String(t.name || t.id));
                    }
                }
                for (const s of allSkuRes.data || []) {
                    const brand = String((s as any)?.cat_brands?.name || '');
                    const model = String((s as any)?.cat_models?.name || '');
                    if (brand) brandMap.set(brand, brand);
                    if (model) modelMap.set(model, model);
                }
            }
        }

        return {
            success: true,
            rows,
            totalCount,
            page,
            pageSize,
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
        return empty(getErrorMessage(error) || 'Unexpected error while fetching dealer offers');
    }
}

/**
 * Full filtered export — no pagination, returns all matching rows across the filtered dataset.
 * Capped at 5000 rows. Used for "Export All (filtered)" CSV download.
 */
export async function getAllDealerOffersForExport(
    input: Omit<GetAllDealerOffersInput, 'page' | 'pageSize'>
): Promise<{ success: boolean; message?: string; rows: AdminDealerOfferRow[] }> {
    try {
        const auth = await ensureAumsAdmin();
        if (!auth.ok) return { success: false, message: auth.message, rows: [] };

        const { data: rawAll, error } = await buildOfferQuery(input).limit(5000);
        if (error) return { success: false, message: `Export failed: ${getErrorMessage(error)}`, rows: [] };

        const { rows, error: enrichError } = await enrichOfferRows(rawAll || [], input);
        if (enrichError) return { success: false, message: `Export enrichment failed: ${enrichError}`, rows: [] };

        return { success: true, rows };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) || 'Unexpected export error', rows: [] };
    }
}

// ─── History ──────────────────────────────────────────────────────────────────

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
        if (!user?.id) return { success: false, message: 'Authentication required', rows: [] };

        const allowed = await isAumsAdmin(user.id);
        if (!allowed)
            return { success: false, message: 'Only AUMS super admins can access override history.', rows: [] };

        const { data, error } = await adminClient
            .from('audit_logs')
            .select('id, action, metadata, created_at, user_id')
            .in('action', [...OFFER_OVERRIDE_ACTIONS])
            .order('created_at', { ascending: false })
            .limit(Math.min(Math.max(limit, 1), 100));

        if (error) return { success: false, message: `Failed to fetch history: ${getErrorMessage(error)}`, rows: [] };

        const safeRows = data || [];
        const tenantIds = new Set<string>();
        const skuIds = new Set<string>();
        const userIds = new Set<string>();

        for (const row of safeRows) {
            if (row.user_id) userIds.add(String(row.user_id));
            const meta = (row.metadata || {}) as Record<string, unknown>;
            const tenantId = String(meta.tenant_id || '').trim();
            if (tenantId) tenantIds.add(tenantId);
            for (const id of asStringArray(meta.tenant_ids)) tenantIds.add(id);
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
            (tenantRes.data || []).map((r: any) => [String(r.id), String(r.name || r.id)])
        );
        const skuMap = new Map<string, string>(
            (skuRes.data || []).map((r: any) => [String(r.id), String(r.name || r.id)])
        );
        const memberMap = new Map<string, string>(
            (memberRes.data || []).map((r: any) => [String(r.id), String(r.full_name || 'Unknown Admin')])
        );

        const rows: DealerOfferOverrideHistoryRow[] = safeRows.map(row => {
            const meta = (row.metadata || {}) as Record<string, unknown>;
            const tenantId = String(meta.tenant_id || '').trim();
            const bulkTenantIds = asStringArray(meta.tenant_ids);
            const skuId = String(meta.sku_id || '').trim();
            const actorName = memberMap.get(String(row.user_id || '')) || 'Unknown Admin';

            const dealerLabel =
                bulkTenantIds.length > 1
                    ? `${bulkTenantIds.length} dealerships`
                    : (tenantMap.get(tenantId) ?? tenantId ?? '—');

            const action = String(row.action || '');
            return {
                id: row.id,
                action,
                actionLabel: actionLabel(action),
                actorName,
                dealerLabel,
                skuLabel: skuMap.get(skuId) ?? skuId ?? '—',
                offerDelta:
                    meta.offer_delta !== undefined && meta.offer_delta !== null ? Number(meta.offer_delta) : null,
                updatedCount: meta.updated_count !== undefined ? Number(meta.updated_count) : null,
                createdAt: String(row.created_at || ''),
            };
        });

        return { success: true, rows };
    } catch (error) {
        return {
            success: false,
            message: getErrorMessage(error) || 'Unexpected error fetching history',
            rows: [],
        };
    }
}
