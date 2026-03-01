'use server';

import { adminClient } from '@/lib/supabase/admin';
import { calculatePricingBySkuIds } from '@/actions/pricingLedger';

export type SotPriceSeedRow = {
    sku_id: string;
    state_code: string;
    ex_showroom: number;
    publish_stage?: string;
    is_popular?: boolean;
};

export type SotPriceSeedResult = {
    success: boolean;
    processed: number;
    calculated: number;
    errors: string[];
};

const ALLOWED_STAGES = new Set(['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'LIVE', 'INACTIVE']);

const normalizeRow = (row: SotPriceSeedRow): SotPriceSeedRow | null => {
    const skuId = String(row?.sku_id || '').trim();
    const stateCode = String(row?.state_code || '')
        .trim()
        .toUpperCase();
    const exShowroom = Number(row?.ex_showroom);

    if (!skuId || !stateCode) return null;
    if (!Number.isFinite(exShowroom)) return null;

    const stageRaw = String(row?.publish_stage || 'DRAFT')
        .trim()
        .toUpperCase();
    const publishStage = ALLOWED_STAGES.has(stageRaw) ? stageRaw : 'DRAFT';

    return {
        sku_id: skuId,
        state_code: stateCode,
        ex_showroom: Math.round(Math.max(0, exShowroom)),
        publish_stage: publishStage,
        is_popular: Boolean(row?.is_popular),
    };
};

/**
 * SOT writer for cat_price_state_mh:
 * 1) Upserts ex-showroom baseline rows
 * 2) Runs price engine per-state to compute RTO/insurance and all derived totals
 */
export async function sot_price_seed(rows: SotPriceSeedRow[]): Promise<SotPriceSeedResult> {
    const normalized = rows.map(normalizeRow).filter(Boolean) as SotPriceSeedRow[];

    if (normalized.length === 0) {
        return {
            success: false,
            processed: 0,
            calculated: 0,
            errors: ['No valid pricing rows provided'],
        };
    }

    const deduped = Array.from(
        new Map(normalized.map(row => [`${row.sku_id}::${row.state_code}`, row])).values()
    ) as SotPriceSeedRow[];
    const skuIds = Array.from(new Set(deduped.map(row => row.sku_id)));

    const upsertPayload = deduped.map(row => {
        const gstRate = Number(row.ex_showroom > 400000 ? 40 : 18); // Simple heuristic for pre-lookup
        const exFactory = Math.round(row.ex_showroom / (1 + gstRate / 100));
        const exGst = row.ex_showroom - exFactory;

        return {
            id: crypto.randomUUID(),
            sku_id: row.sku_id,
            state_code: row.state_code,
            ex_factory: exFactory,
            ex_factory_gst_amount: exGst,
            logistics_charges: 0,
            logistics_charges_gst_amount: 0,
            ex_showroom: row.ex_showroom,
            publish_stage: row.publish_stage || 'DRAFT',
            is_popular: row.is_popular || false,
            updated_at: new Date().toISOString(),
        };
    });

    const { error: upsertError } = await adminClient
        .from('cat_price_state_mh')
        .upsert(upsertPayload, { onConflict: 'sku_id,state_code' });

    if (upsertError) {
        return {
            success: false,
            processed: deduped.length,
            calculated: 0,
            errors: [upsertError.message],
        };
    }

    const byState = new Map<string, Array<{ skuId: string; exShowroom: number }>>();
    for (const row of deduped) {
        if (row.ex_showroom <= 0) continue;
        const key = row.state_code;
        const list = byState.get(key) || [];
        list.push({ skuId: row.sku_id, exShowroom: row.ex_showroom });
        byState.set(key, list);
    }

    const errors: string[] = [];
    let calculated = 0;

    for (const [stateCode, inputs] of byState.entries()) {
        const calcResult = await calculatePricingBySkuIds(inputs, stateCode);
        if (!calcResult.success) {
            errors.push(`Price engine failed for ${stateCode}: ${calcResult.errors.join(', ')}`);
            continue;
        }
        calculated += calcResult.totalPublished;
    }

    const skuHsnMap = new Map<string, string>();
    if (skuIds.length > 0) {
        const { data: skuRows, error: skuLookupError } = await (adminClient as any)
            .from('cat_skus')
            .select('id, model:cat_models!model_id(hsn_code)')
            .in('id', skuIds);

        if (skuLookupError) {
            errors.push(`Failed to resolve SKU model HSN codes: ${skuLookupError.message}`);
        } else {
            for (const row of skuRows || []) {
                const skuId = String((row as any)?.id || '');
                const hsn = String((row as any)?.model?.hsn_code || '').trim();
                if (skuId && hsn) {
                    skuHsnMap.set(skuId, hsn);
                }
            }
        }
    }

    // Preserve caller-supplied stage/popular flags after engine run.
    // publishPrices currently stamps publish_stage='PUBLISHED' internally.
    for (const row of deduped) {
        const modelHsnCode = skuHsnMap.get(row.sku_id);
        const metadataPayload: Record<string, any> = {
            publish_stage: row.publish_stage || 'DRAFT',
            is_popular: row.is_popular || false,
            ins_own_damage_tenure_years: 1,
            ins_liability_only_tenure_years: 5,
            updated_at: new Date().toISOString(),
        };
        if (modelHsnCode) {
            metadataPayload.ins_hsn_code = modelHsnCode;
        }

        const { error: metadataError } = await adminClient
            .from('cat_price_state_mh')
            .update(metadataPayload)
            .eq('sku_id', row.sku_id)
            .eq('state_code', row.state_code);

        if (metadataError) {
            errors.push(
                `Failed to preserve publish metadata for sku=${row.sku_id} state=${row.state_code}: ${metadataError.message}`
            );
        }
    }

    return {
        success: errors.length === 0,
        processed: deduped.length,
        calculated,
        errors,
    };
}
