'use server';

import { adminClient } from '@/lib/supabase/admin';
import { publishPrices } from '@/actions/publishPrices';

interface PublishResultItem {
    success: boolean;
    skuId: string;
    oldOnRoad?: number;
    newOnRoad?: number;
    delta?: number;
    dealersAdjusted?: number;
    error?: string;
}

interface PublishPricesResult {
    success: boolean;
    publishJobId: string;
    results: PublishResultItem[];
    totalPublished: number;
    totalDealersAdjusted: number;
    notificationsSent: number;
    errors: string[];
}

type CalculateInput = string | { skuId: string; exShowroom?: number };

export async function calculatePricingBySkuIds(
    inputs: CalculateInput[],
    stateCode: string
): Promise<PublishPricesResult> {
    if (!Array.isArray(inputs) || inputs.length === 0) {
        return {
            success: false,
            publishJobId: '',
            results: [],
            totalPublished: 0,
            totalDealersAdjusted: 0,
            notificationsSent: 0,
            errors: ['No SKU IDs provided'],
        };
    }

    const normalized = inputs
        .map(input => (typeof input === 'string' ? { skuId: input, exShowroom: undefined } : input))
        .filter(i => !!i?.skuId);
    const deduped = Array.from(new Map(normalized.map(i => [i.skuId, i])).values());
    const skuIds = deduped.map(i => i.skuId);

    const { data: skuRows, error: skuError } = await adminClient.from('cat_skus').select('id').in('id', skuIds);

    if (skuError) {
        return {
            success: false,
            publishJobId: '',
            results: [],
            totalPublished: 0,
            totalDealersAdjusted: 0,
            notificationsSent: 0,
            errors: [skuError.message],
        };
    }

    const validSkuIds = new Set<string>();
    for (const row of skuRows || []) {
        const r = row as any;
        if (r?.id) validSkuIds.add(r.id);
    }
    const missing = skuIds.filter(id => !validSkuIds.has(id));
    if (missing.length > 0) {
        return {
            success: false,
            publishJobId: '',
            results: [],
            totalPublished: 0,
            totalDealersAdjusted: 0,
            notificationsSent: 0,
            errors: [`Invalid/non-SKU IDs passed to calculator: ${missing.join(', ')}`],
        };
    }

    // Ensure draft state rows exist + optional ex_showroom preseed.
    for (const item of deduped) {
        if (item.exShowroom && item.exShowroom > 0) {
            await (adminClient as any).from('cat_price_state_mh').upsert(
                {
                    sku_id: item.skuId,
                    state_code: stateCode,
                    ex_factory: Number(item.exShowroom),
                    ex_factory_gst_amount: 0,
                    logistics_charges: 0,
                    logistics_charges_gst_amount: 0,
                    ex_showroom: Number(item.exShowroom),
                    publish_stage: 'DRAFT',
                },
                { onConflict: 'sku_id,state_code' }
            );
        }
    }

    // Publish with canonical SKU IDs.
    const publishResult = await publishPrices(skuIds, stateCode);
    return publishResult;
}
