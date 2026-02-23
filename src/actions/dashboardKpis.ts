'use server';

import { adminClient } from '@/lib/supabase/admin';

export interface DashboardKpis {
    leads: { total: number; newToday: number };
    quotes: { total: number; pending: number };
    bookings: { total: number; value: number };
    deliveries: { total: number; pdiReady: number };
    receipts: { total: number; todayValue: number };
    insurance: { total: number; pending: number };
}

export interface PlatformKpis extends DashboardKpis {
    activeDealers: number;
    activeFinanciers: number;
    totalMembers: number;
}

export interface DashboardSkuTrendRow {
    skuId: string;
    label: string;
    bookingCount: number;
    visitorViews: number;
    visitorDwellMs: number;
}

export interface DashboardSkuTrends {
    updatedAt: string;
    lookbackDays: {
        bookings: number;
        visitors: number;
    };
    topBooked: DashboardSkuTrendRow[];
    topDwell: DashboardSkuTrendRow[];
}

export interface DealerStageCounts {
    quote: number;
    booking: number;
    payment: number;
    finance: number;
    allotment: number;
    pdi: number;
    insurance: number;
    registration: number;
    compliance: number;
    delivery: number;
    delivered: number;
    feedback: number;
}

export interface DealerCrmInsights {
    generatedAt: string;
    commercial: {
        avgQuoteValue: number;
        avgBookingValue: number;
    };
    operations: {
        openPipelineCount: number;
        closedCount: number;
        stageCounts: DealerStageCounts;
        paymentPendingCount: number;
        paymentClearedCount: number;
        financeDisbursedCount: number;
        financeDisbursedAmount: number;
        allotmentPendingCount: number;
        pdiPendingCount: number;
        insurancePendingCount: number;
        feedbackCapturedCount: number;
        feedbackPendingCount: number;
        avgNps: number | null;
    };
    wallet: {
        cashInCaptured: number;
        cashInPending: number;
        inventoryValue: number;
        inventoryAvailableCount: number;
        inventoryAllocatedCount: number;
        inventorySoldCount: number;
        procurementCommitted: number;
        procurementReceivedValue: number;
        procurementPendingValue: number;
        netCashPosition: number;
        payoutPressurePct: number | null;
    };
}

function asRecord(value: unknown): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, any>;
}

function cleanSkuId(value: unknown): string | null {
    const skuId = String(value || '')
        .trim()
        .toLowerCase();
    return skuId || null;
}

function composeSkuLabel(params: {
    skuName?: string | null;
    colorName?: string | null;
    modelName?: string | null;
    brandName?: string | null;
    variantName?: string | null;
}): string {
    const brand = String(params.brandName || '').trim();
    const model = String(params.modelName || '').trim();
    const variant = String(params.variantName || '').trim();
    const color = String(params.colorName || '').trim();
    const skuName = String(params.skuName || '').trim();

    const base = [brand, model, variant].filter(Boolean).join(' ').trim() || skuName || 'Unnamed SKU';
    return color ? `${base} (${color})` : base;
}

async function resolveSkuLabels(skuIds: string[]): Promise<Map<string, string>> {
    const labels = new Map<string, string>();
    if (skuIds.length === 0) return labels;

    const { data: skuRows } = await adminClient
        .from('cat_skus')
        .select('id, name, color_name, model_id, vehicle_variant_id, accessory_variant_id, service_variant_id')
        .in('id', skuIds as any);

    const skus = (skuRows || []) as Array<any>;
    if (skus.length === 0) return labels;

    const modelIds = Array.from(new Set(skus.map(s => s.model_id).filter(Boolean)));
    const vehicleVariantIds = Array.from(new Set(skus.map(s => s.vehicle_variant_id).filter(Boolean)));
    const accessoryVariantIds = Array.from(new Set(skus.map(s => s.accessory_variant_id).filter(Boolean)));
    const serviceVariantIds = Array.from(new Set(skus.map(s => s.service_variant_id).filter(Boolean)));

    const [modelsRes, vehicleVariantsRes, accessoryVariantsRes, serviceVariantsRes] = await Promise.all([
        modelIds.length > 0
            ? adminClient
                  .from('cat_models')
                  .select('id, name, brand_id')
                  .in('id', modelIds as any)
            : Promise.resolve({ data: [] as any[] }),
        vehicleVariantIds.length > 0
            ? adminClient
                  .from('cat_variants_vehicle')
                  .select('id, name')
                  .in('id', vehicleVariantIds as any)
            : Promise.resolve({ data: [] as any[] }),
        accessoryVariantIds.length > 0
            ? adminClient
                  .from('cat_variants_accessory')
                  .select('id, name')
                  .in('id', accessoryVariantIds as any)
            : Promise.resolve({ data: [] as any[] }),
        serviceVariantIds.length > 0
            ? adminClient
                  .from('cat_variants_service')
                  .select('id, name')
                  .in('id', serviceVariantIds as any)
            : Promise.resolve({ data: [] as any[] }),
    ]);

    const models = (modelsRes.data || []) as Array<any>;
    const brandIds = Array.from(new Set(models.map(m => m.brand_id).filter(Boolean)));
    const brandsRes =
        brandIds.length > 0
            ? await adminClient
                  .from('cat_brands')
                  .select('id, name')
                  .in('id', brandIds as any)
            : { data: [] as any[] };

    const modelMap = new Map<string, any>(models.map(m => [String(m.id), m]));
    const brandMap = new Map<string, any>((brandsRes.data || []).map((b: any) => [String(b.id), b]));
    const variantMap = new Map<string, any>(
        [
            ...((vehicleVariantsRes.data || []) as any[]),
            ...((accessoryVariantsRes.data || []) as any[]),
            ...((serviceVariantsRes.data || []) as any[]),
        ].map(v => [String(v.id), v])
    );

    for (const sku of skus) {
        const skuId = cleanSkuId(sku.id);
        if (!skuId) continue;

        const model = sku.model_id ? modelMap.get(String(sku.model_id)) : null;
        const brand = model?.brand_id ? brandMap.get(String(model.brand_id)) : null;
        const variantId = sku.vehicle_variant_id || sku.accessory_variant_id || sku.service_variant_id || null;
        const variant = variantId ? variantMap.get(String(variantId)) : null;

        labels.set(
            skuId,
            composeSkuLabel({
                skuName: sku.name,
                colorName: sku.color_name,
                modelName: model?.name,
                brandName: brand?.name,
                variantName: variant?.name,
            })
        );
    }

    return labels;
}

/**
 * Fetch top booked SKUs and top dwell-time SKUs.
 * `tenantId` provided => dealership scoped view; omitted => global (AUMS).
 */
export async function getDashboardSkuTrends(tenantId?: string | null, limit: number = 5): Promise<DashboardSkuTrends> {
    const bookingLookbackDays = 120;
    const visitorLookbackDays = 30;
    const bookingsSince = new Date(Date.now() - bookingLookbackDays * 24 * 60 * 60 * 1000).toISOString();
    const visitorsSince = new Date(Date.now() - visitorLookbackDays * 24 * 60 * 60 * 1000).toISOString();

    const bookingQuery = adminClient
        .from('crm_bookings')
        .select('sku_id, color_id, qty, status, is_deleted, created_at')
        .gte('created_at', bookingsSince)
        .limit(50000);
    const scopedBookingQuery = tenantId ? bookingQuery.eq('tenant_id', tenantId) : bookingQuery;

    const [bookingsRes, visitorRes] = await Promise.all([
        scopedBookingQuery,
        adminClient
            .from('analytics_events')
            .select('event_name, metadata, created_at')
            .eq('event_type', 'INTENT_SIGNAL')
            .in('event_name', ['sku_view', 'sku_dwell'])
            .gte('created_at', visitorsSince)
            .limit(60000),
    ]);

    const bookingCountMap = new Map<string, number>();
    const visitorViewMap = new Map<string, number>();
    const visitorDwellMap = new Map<string, number>();

    for (const row of (bookingsRes.data || []) as any[]) {
        if (row?.is_deleted === true) continue;
        const status = String(row?.status || '').toUpperCase();
        if (status.includes('CANCEL') || status.includes('REFUND')) continue;

        const skuId = cleanSkuId(row?.sku_id || row?.color_id);
        if (!skuId) continue;
        const qty = Math.max(1, Number(row?.qty) || 1);
        bookingCountMap.set(skuId, (bookingCountMap.get(skuId) || 0) + qty);
    }

    const visitorRows = (visitorRes.data || []) as any[];
    const tenantScopedLeadIds = new Set<string>();
    const rowsWithLeadContext: Array<{
        skuId: string;
        eventName: string;
        dwellMs: number;
        leadId: string | null;
    }> = [];

    for (const row of visitorRows) {
        const metadata = asRecord(row?.metadata);
        const skuId = cleanSkuId(metadata.sku_id);
        if (!skuId) continue;

        const eventName = String(row?.event_name || '').toLowerCase();
        const leadIdRaw = String(metadata.lead_id || '').trim();
        const leadId = leadIdRaw || null;
        if (leadId) tenantScopedLeadIds.add(leadId);

        const rawDwellMs = Number(metadata.dwell_ms || metadata.dwellMs || 0);
        const dwellMs = Number.isFinite(rawDwellMs) ? Math.max(0, rawDwellMs) : 0;

        rowsWithLeadContext.push({ skuId, eventName, dwellMs, leadId });
    }

    let leadTenantMap = new Map<string, string>();
    if (tenantId && tenantScopedLeadIds.size > 0) {
        const leadIds = Array.from(tenantScopedLeadIds);
        const { data: leadRows } = await adminClient
            .from('crm_leads')
            .select('id, tenant_id, owner_tenant_id, selected_dealer_tenant_id')
            .in('id', leadIds as any);

        leadTenantMap = new Map<string, string>(
            ((leadRows || []) as any[])
                .map((lead: any) => {
                    const resolvedTenant =
                        lead.selected_dealer_tenant_id || lead.tenant_id || lead.owner_tenant_id || null;
                    if (!lead.id || !resolvedTenant) return null;
                    return [String(lead.id), String(resolvedTenant)] as [string, string];
                })
                .filter(Boolean) as Array<[string, string]>
        );
    }

    for (const row of rowsWithLeadContext) {
        if (tenantId) {
            if (!row.leadId) continue;
            if (leadTenantMap.get(row.leadId) !== String(tenantId)) continue;
        }

        if (row.eventName === 'sku_view') {
            visitorViewMap.set(row.skuId, (visitorViewMap.get(row.skuId) || 0) + 1);
        } else if (row.eventName === 'sku_dwell') {
            visitorDwellMap.set(row.skuId, (visitorDwellMap.get(row.skuId) || 0) + row.dwellMs);
        }
    }

    const skuIdUniverse = Array.from(
        new Set([...bookingCountMap.keys(), ...visitorViewMap.keys(), ...visitorDwellMap.keys()])
    );
    const labelMap = await resolveSkuLabels(skuIdUniverse);

    const rows: DashboardSkuTrendRow[] = skuIdUniverse.map(skuId => ({
        skuId,
        label: labelMap.get(skuId) || skuId,
        bookingCount: bookingCountMap.get(skuId) || 0,
        visitorViews: visitorViewMap.get(skuId) || 0,
        visitorDwellMs: visitorDwellMap.get(skuId) || 0,
    }));

    const topBooked = [...rows]
        .filter(r => r.bookingCount > 0 || r.visitorDwellMs > 0 || r.visitorViews > 0)
        .sort((a, b) => {
            if (a.bookingCount !== b.bookingCount) return b.bookingCount - a.bookingCount;
            if (a.visitorDwellMs !== b.visitorDwellMs) return b.visitorDwellMs - a.visitorDwellMs;
            if (a.visitorViews !== b.visitorViews) return b.visitorViews - a.visitorViews;
            return a.label.localeCompare(b.label);
        })
        .slice(0, Math.max(1, limit));

    const topDwell = [...rows]
        .filter(r => r.visitorDwellMs > 0 || r.bookingCount > 0 || r.visitorViews > 0)
        .sort((a, b) => {
            if (a.visitorDwellMs !== b.visitorDwellMs) return b.visitorDwellMs - a.visitorDwellMs;
            if (a.bookingCount !== b.bookingCount) return b.bookingCount - a.bookingCount;
            if (a.visitorViews !== b.visitorViews) return b.visitorViews - a.visitorViews;
            return a.label.localeCompare(b.label);
        })
        .slice(0, Math.max(1, limit));

    return {
        updatedAt: new Date().toISOString(),
        lookbackDays: {
            bookings: bookingLookbackDays,
            visitors: visitorLookbackDays,
        },
        topBooked,
        topDwell,
    };
}

const PAYMENT_SETTLED_STATUSES = new Set(['CAPTURED', 'PAID', 'SUCCESS', 'COMPLETED', 'SETTLED', 'RECONCILED']);
const INSURANCE_DONE_STATUSES = new Set(['COMPLETED', 'ACTIVE', 'ISSUED']);

const STAGE_RANK: Record<string, number> = {
    QUOTE: 0,
    BOOKING: 1,
    PAYMENT: 2,
    FINANCE: 3,
    ALLOTMENT: 4,
    PDI: 5,
    INSURANCE: 6,
    REGISTRATION: 7,
    COMPLIANCE: 8,
    DELIVERY: 9,
    DELIVERED: 10,
    FEEDBACK: 11,
};

function normalizeToken(value: unknown): string {
    return String(value || '')
        .trim()
        .toUpperCase();
}

function toSafeNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function roundTo(value: number, digits: number = 1): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function isPaymentSettled(status: string, isReconciled?: boolean | null): boolean {
    if (isReconciled) return true;
    return PAYMENT_SETTLED_STATUSES.has(status);
}

function emptyStageCounts(): DealerStageCounts {
    return {
        quote: 0,
        booking: 0,
        payment: 0,
        finance: 0,
        allotment: 0,
        pdi: 0,
        insurance: 0,
        registration: 0,
        compliance: 0,
        delivery: 0,
        delivered: 0,
        feedback: 0,
    };
}

/**
 * Deep CRM diagnostics for dealership command deck:
 * pipeline stages, payment/disbursal signal, and wallet/procurement pressure.
 */
export async function getDealerCrmInsights(tenantId: string): Promise<DealerCrmInsights> {
    const [quoteValuesRes, bookingRowsRes, paymentRowsRes, financeRowsRes, feedbackRowsRes, stockRowsRes, poItemsRes] =
        await Promise.all([
            adminClient.from('crm_quotes').select('on_road_price, is_deleted').eq('tenant_id', tenantId).limit(50000),
            adminClient
                .from('crm_bookings')
                .select(
                    'id, grand_total, is_deleted, operational_stage, status, payment_status, allotment_status, pdi_status, insurance_status'
                )
                .eq('tenant_id', tenantId)
                .limit(50000),
            adminClient
                .from('crm_payments')
                .select('amount, status, is_reconciled, is_deleted')
                .eq('tenant_id', tenantId)
                .limit(50000),
            adminClient
                .from('crm_quote_finance_attempts')
                .select('status, loan_amount, is_deleted')
                .eq('tenant_id', tenantId)
                .limit(50000),
            (adminClient as any)
                .from('crm_feedback')
                .select('booking_id, nps_score')
                .eq('tenant_id', tenantId)
                .limit(50000),
            adminClient
                .from('inv_stock')
                .select(
                    `
                    status,
                    po:inv_purchase_orders (total_po_value)
                `
                )
                .eq('tenant_id', tenantId)
                .limit(50000),
            adminClient
                .from('inv_purchase_orders')
                .select('total_po_value, po_status')
                .eq('tenant_id', tenantId)
                .limit(50000),
        ]);

    const quoteRows = ((quoteValuesRes.data || []) as any[]).filter(row => row?.is_deleted !== true);
    const bookingRows = ((bookingRowsRes.data || []) as any[]).filter(row => row?.is_deleted !== true);
    const paymentRows = ((paymentRowsRes.data || []) as any[]).filter(row => row?.is_deleted !== true);
    const financeRows = ((financeRowsRes.data || []) as any[]).filter(row => row?.is_deleted !== true);
    const feedbackRows = ((feedbackRowsRes.data || []) as any[]) || [];
    const stockRows = ((stockRowsRes.data || []) as any[]) || [];
    const poRows = ((poItemsRes.data || []) as any[]) || [];

    const quoteValues = quoteRows.map(row => toSafeNumber(row?.on_road_price)).filter(value => value > 0);
    const avgQuoteValue =
        quoteValues.length > 0
            ? Math.round(quoteValues.reduce((sum, value) => sum + value, 0) / quoteValues.length)
            : 0;

    const bookingValues = bookingRows.map(row => toSafeNumber(row?.grand_total)).filter(value => value > 0);
    const avgBookingValue =
        bookingValues.length > 0
            ? Math.round(bookingValues.reduce((sum, value) => sum + value, 0) / bookingValues.length)
            : 0;

    const stageCounts = emptyStageCounts();
    let paymentPendingCount = 0;
    let paymentClearedCount = 0;
    let allotmentPendingCount = 0;
    let pdiPendingCount = 0;
    let insurancePendingCount = 0;

    const deliveredRank = STAGE_RANK.DELIVERED;
    const paymentRank = STAGE_RANK.PAYMENT;
    const allotmentRank = STAGE_RANK.ALLOTMENT;
    const pdiRank = STAGE_RANK.PDI;

    for (const row of bookingRows) {
        const stage = normalizeToken(row?.operational_stage || row?.current_stage || row?.status);
        const stageRank = STAGE_RANK[stage] ?? -1;
        const paymentStatus = normalizeToken(row?.payment_status);
        const allotmentStatus = normalizeToken(row?.allotment_status);
        const pdiStatus = normalizeToken(row?.pdi_status);
        const insuranceStatus = normalizeToken(row?.insurance_status);

        if (stage === 'QUOTE') stageCounts.quote += 1;
        else if (stage === 'BOOKING') stageCounts.booking += 1;
        else if (stage === 'PAYMENT') stageCounts.payment += 1;
        else if (stage === 'FINANCE') stageCounts.finance += 1;
        else if (stage === 'ALLOTMENT') stageCounts.allotment += 1;
        else if (stage === 'PDI') stageCounts.pdi += 1;
        else if (stage === 'INSURANCE') stageCounts.insurance += 1;
        else if (stage === 'REGISTRATION') stageCounts.registration += 1;
        else if (stage === 'COMPLIANCE') stageCounts.compliance += 1;
        else if (stage === 'DELIVERY') stageCounts.delivery += 1;
        else if (stage === 'DELIVERED') stageCounts.delivered += 1;
        else if (stage === 'FEEDBACK') stageCounts.feedback += 1;

        if (stageRank >= paymentRank) {
            if (isPaymentSettled(paymentStatus)) paymentClearedCount += 1;
            else paymentPendingCount += 1;
        }

        if (stageRank >= allotmentRank && stageRank < deliveredRank && allotmentStatus !== 'HARD_LOCK') {
            allotmentPendingCount += 1;
        }

        if (stageRank >= pdiRank && stageRank < deliveredRank && pdiStatus !== 'PASSED') {
            pdiPendingCount += 1;
        }

        if (stageRank >= pdiRank && stageRank < deliveredRank && !INSURANCE_DONE_STATUSES.has(insuranceStatus)) {
            insurancePendingCount += 1;
        }
    }

    const closedCount = stageCounts.delivered + stageCounts.feedback;
    const openPipelineCount = Math.max(bookingRows.length - closedCount, 0);

    let financeDisbursedCount = 0;
    let financeDisbursedAmount = 0;
    for (const row of financeRows) {
        const status = normalizeToken(row?.status);
        if (status !== 'DISBURSED') continue;
        financeDisbursedCount += 1;
        financeDisbursedAmount += toSafeNumber(row?.loan_amount);
    }

    let cashInCaptured = 0;
    let cashInPending = 0;
    for (const row of paymentRows) {
        const amount = toSafeNumber(row?.amount);
        const status = normalizeToken(row?.status);
        const isReconciled = Boolean(row?.is_reconciled);
        if (isPaymentSettled(status, isReconciled)) cashInCaptured += amount;
        else cashInPending += amount;
    }

    let inventoryValue = 0;
    let inventoryAvailableCount = 0;
    let inventoryAllocatedCount = 0;
    let inventorySoldCount = 0;
    for (const row of stockRows) {
        const status = normalizeToken(row?.status);
        const unitValue = toSafeNumber(row?.po?.total_po_value);

        if (status === 'AVAILABLE') inventoryAvailableCount += 1;
        else if (status === 'SOFT_LOCKED' || status === 'HARD_LOCKED') inventoryAllocatedCount += 1;
        else if (status === 'SOLD') inventorySoldCount += 1;

        if (status !== 'SOLD') inventoryValue += unitValue;
    }

    let procurementCommitted = 0;
    let procurementReceivedValue = 0;
    for (const row of poRows) {
        const poValue = toSafeNumber(row?.total_po_value);
        const status = normalizeToken(row?.po_status);

        procurementCommitted += poValue;
        if (status === 'RECEIVED') {
            procurementReceivedValue += poValue;
        }
    }

    const procurementPendingValue = Math.max(procurementCommitted - procurementReceivedValue, 0);
    const netCashPosition = cashInCaptured - procurementCommitted;
    const payoutPressurePct = cashInCaptured > 0 ? roundTo((procurementPendingValue / cashInCaptured) * 100, 1) : null;

    const feedbackBookingIds = new Set<string>();
    let npsCount = 0;
    let npsTotal = 0;
    for (const row of feedbackRows) {
        const bookingId = String(row?.booking_id || '').trim();
        if (bookingId) feedbackBookingIds.add(bookingId);
        const nps = toSafeNumber(row?.nps_score);
        if (nps > 0) {
            npsTotal += nps;
            npsCount += 1;
        }
    }

    const feedbackCapturedCount = feedbackBookingIds.size;
    const feedbackPendingCount = Math.max(stageCounts.delivered + stageCounts.feedback - feedbackCapturedCount, 0);
    const avgNps = npsCount > 0 ? roundTo(npsTotal / npsCount, 1) : null;

    return {
        generatedAt: new Date().toISOString(),
        commercial: {
            avgQuoteValue,
            avgBookingValue,
        },
        operations: {
            openPipelineCount,
            closedCount,
            stageCounts,
            paymentPendingCount,
            paymentClearedCount,
            financeDisbursedCount,
            financeDisbursedAmount: Math.round(financeDisbursedAmount),
            allotmentPendingCount,
            pdiPendingCount,
            insurancePendingCount,
            feedbackCapturedCount,
            feedbackPendingCount,
            avgNps,
        },
        wallet: {
            cashInCaptured: Math.round(cashInCaptured),
            cashInPending: Math.round(cashInPending),
            inventoryValue: Math.round(inventoryValue),
            inventoryAvailableCount,
            inventoryAllocatedCount,
            inventorySoldCount,
            procurementCommitted: Math.round(procurementCommitted),
            procurementReceivedValue: Math.round(procurementReceivedValue),
            procurementPendingValue: Math.round(procurementPendingValue),
            netCashPosition: Math.round(netCashPosition),
            payoutPressurePct,
        },
    };
}

/**
 * Fetch live KPI counts for a DEALER dashboard.
 * Uses lightweight count queries with head:true for performance.
 */
export async function getDealerDashboardKpis(tenantId: string): Promise<DashboardKpis> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [
        leadsTotal,
        leadsToday,
        quotesTotal,
        quotesPending,
        bookingsTotal,
        bookingsValue,
        deliveriesTotal,
        pdiReady,
        receiptsTotal,
        receiptsToday,
        insuranceTotal,
        insurancePending,
    ] = await Promise.all([
        // Leads
        adminClient.from('crm_leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient
            .from('crm_leads')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', today),
        // Quotes
        adminClient.from('crm_quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient
            .from('crm_quotes')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('status', ['DRAFT', 'IN_REVIEW', 'SENT']),
        // Bookings (sales orders with stage BOOKING or later)
        adminClient.from('crm_bookings').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient.from('crm_bookings').select('grand_total').eq('tenant_id', tenantId),
        // Deliveries
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'DELIVERED'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'PDI'),
        // Payments ledger (previously receipts)
        adminClient.from('crm_payments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient
            .from('crm_payments')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', today),
        // Insurance (Using COMPLIANCE as the operational stage for insurance tracking)
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'COMPLIANCE'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'COMPLIANCE')
            .neq('status', 'COMPLETED'),
    ]);

    // Calculate booking value from grand_total
    const totalBookingValue = (bookingsValue.data || []).reduce(
        (sum: number, row: any) => sum + (row.grand_total || 0),
        0
    );

    return {
        leads: { total: leadsTotal.count || 0, newToday: leadsToday.count || 0 },
        quotes: { total: quotesTotal.count || 0, pending: quotesPending.count || 0 },
        bookings: { total: bookingsTotal.count || 0, value: totalBookingValue },
        deliveries: { total: deliveriesTotal.count || 0, pdiReady: pdiReady.count || 0 },
        receipts: { total: receiptsTotal.count || 0, todayValue: receiptsToday.count || 0 },
        insurance: { total: insuranceTotal.count || 0, pending: insurancePending.count || 0 },
    };
}

/**
 * Fetch live KPI counts for the AUMS (platform admin) dashboard.
 */
export async function getPlatformDashboardKpis(): Promise<PlatformKpis> {
    const today = new Date().toISOString().slice(0, 10);

    const [
        leadsTotal,
        leadsToday,
        quotesTotal,
        quotesPending,
        bookingsTotal,
        bookingsValue,
        deliveriesTotal,
        pdiReady,
        receiptsTotal,
        receiptsToday,
        insuranceTotal,
        insurancePending,
        activeDealers,
        activeFinanciers,
        totalMembers,
    ] = await Promise.all([
        adminClient.from('crm_leads').select('*', { count: 'exact', head: true }),
        adminClient.from('crm_leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
        adminClient.from('crm_quotes').select('*', { count: 'exact', head: true }),
        adminClient
            .from('crm_quotes')
            .select('*', { count: 'exact', head: true })
            .in('status', ['DRAFT', 'IN_REVIEW', 'SENT']),
        adminClient.from('crm_bookings').select('*', { count: 'exact', head: true }),
        adminClient.from('crm_bookings').select('grand_total'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('operational_stage', 'DELIVERED'),
        adminClient.from('crm_bookings').select('*', { count: 'exact', head: true }).eq('operational_stage', 'PDI'),
        adminClient.from('crm_payments').select('*', { count: 'exact', head: true }),
        adminClient.from('crm_payments').select('*', { count: 'exact', head: true }).gte('created_at', today),
        // Insurance (Using COMPLIANCE as the operational stage for insurance tracking)
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('operational_stage', 'COMPLIANCE'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('operational_stage', 'COMPLIANCE')
            .neq('status', 'COMPLETED'),
        adminClient
            .from('id_tenants')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'DEALER')
            .eq('status', 'ACTIVE'),
        adminClient
            .from('id_tenants')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'BANK')
            .eq('status', 'ACTIVE'),
        adminClient.from('id_members').select('*', { count: 'exact', head: true }),
    ]);

    const totalBookingValue = (bookingsValue.data || []).reduce(
        (sum: number, row: any) => sum + (row.grand_total || 0),
        0
    );

    return {
        leads: { total: leadsTotal.count || 0, newToday: leadsToday.count || 0 },
        quotes: { total: quotesTotal.count || 0, pending: quotesPending.count || 0 },
        bookings: { total: bookingsTotal.count || 0, value: totalBookingValue },
        deliveries: { total: deliveriesTotal.count || 0, pdiReady: pdiReady.count || 0 },
        receipts: { total: receiptsTotal.count || 0, todayValue: receiptsToday.count || 0 },
        insurance: { total: insuranceTotal.count || 0, pending: insurancePending.count || 0 },
        activeDealers: activeDealers.count || 0,
        activeFinanciers: activeFinanciers.count || 0,
        totalMembers: totalMembers.count || 0,
    };
}
