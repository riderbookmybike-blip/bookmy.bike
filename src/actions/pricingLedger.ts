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

// Canonical input is SKU IDs (cat_items.id where type='SKU').
// Current publisher works on UNIT IDs (cat_skus_linear.unit_json.id), so we map here.
async function ensureLinearRowForSku(skuId: string, seedExShowroom?: number): Promise<{ ok: boolean; error?: string }> {
    const { data: exists } = await (adminClient as any)
        .from('cat_skus_linear')
        .select('id')
        .eq('id', skuId)
        .maybeSingle();
    if (exists?.id) return { ok: true };

    const { data: sku } = await adminClient
        .from('cat_items')
        .select('id, name, slug, specs, price_base, type, parent_id, brand_id')
        .eq('id', skuId)
        .maybeSingle();
    if (!sku) return { ok: false, error: `SKU not found: ${skuId}` };

    const chain: any[] = [sku];
    let cursor: any = sku;
    for (let i = 0; i < 5; i++) {
        if (!cursor?.parent_id) break;
        const { data: parent } = await adminClient
            .from('cat_items')
            .select('id, name, slug, specs, type, parent_id, category, brand_id')
            .eq('id', cursor.parent_id)
            .maybeSingle();
        if (!parent) break;
        chain.push(parent);
        cursor = parent;
    }

    const variant = chain.find(n => n?.type === 'VARIANT') || sku;
    const product = chain.find(n => n?.type === 'PRODUCT') || variant || sku;
    const typeName = String(product?.category || 'VEHICLE').toUpperCase();
    const brandId = chain.find(n => n?.brand_id)?.brand_id;
    if (!brandId) return { ok: false, error: `Brand not found for SKU ${skuId}` };

    const { data: brand } = await adminClient
        .from('cat_brands')
        .select('id, name, slug')
        .eq('id', brandId)
        .maybeSingle();
    if (!brand) return { ok: false, error: `Brand not found for SKU ${skuId}` };

    const { error: insertError } = await (adminClient as any).from('cat_skus_linear').insert({
        id: (sku as any).id,
        brand_id: (brand as any).id,
        brand_name: (brand as any).name || '',
        brand_json: { id: (brand as any).id, name: (brand as any).name || '', slug: (brand as any).slug || '' },
        product_name: (product as any).name || '',
        product_json: {
            id: (product as any).id,
            name: (product as any).name || '',
            slug: (product as any).slug || '',
            specs: (product as any).specs || {},
        },
        variant_name: (variant as any).name || '',
        variant_json: {
            id: (variant as any).id,
            name: (variant as any).name || '',
            slug: (variant as any).slug || '',
            specs: (variant as any).specs || {},
        },
        // Canonical: unit_json carries sellable SKU identity (legacy field name retained).
        unit_name: (sku as any).name || '',
        unit_json: {
            id: (sku as any).id,
            name: (sku as any).name || '',
            slug: (sku as any).slug || '',
            specs: (sku as any).specs || {},
        },
        type_name: typeName,
        sku_code: (sku as any).slug || (sku as any).id,
        specs: (sku as any).specs || {},
        // Strict mode: no fallback to cat_items.price_base. Seed only from supplied ex-showroom.
        price_base: Number(seedExShowroom) > 0 ? Number(seedExShowroom) : 0,
        // ex_showroom_mh removed from linear table
        checksum_md5: `seed-${(sku as any).id}`,
        status: 'ACTIVE',
    });

    if (insertError) return { ok: false, error: insertError.message };
    return { ok: true };
}

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

    const { data: skuRows, error: skuError } = await adminClient
        .from('cat_items')
        .select('id, parent_id, type')
        .in('id', skuIds);

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
        if (r?.type === 'SKU' && r?.id) validSkuIds.add(r.id);
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

    // Ensure linear rows + ex_showroom preseed (prevents price_base-missing failures in publisher).
    const priceColumn = `price_${stateCode.toLowerCase()}`;
    for (const item of deduped) {
        const ensured = await ensureLinearRowForSku(item.skuId, item.exShowroom);
        if (!ensured.ok) {
            return {
                success: false,
                publishJobId: '',
                results: [],
                totalPublished: 0,
                totalDealersAdjusted: 0,
                notificationsSent: 0,
                errors: [ensured.error || `Failed to ensure linear row for ${item.skuId}`],
            };
        }
        if (item.exShowroom && item.exShowroom > 0) {
            // Seed into MH state table instead of linear column
            if (stateCode.toUpperCase() === 'MH') {
                await (adminClient as any).from('cat_price_mh').upsert(
                    {
                        sku_id: item.skuId,
                        state_code: stateCode,
                        ex_showroom: Number(item.exShowroom),
                        publish_stage: 'DRAFT',
                    },
                    { onConflict: 'sku_id,state_code' }
                );
            }
        }

        // Canonicalize lookup identity for publisher/CRM/runtime:
        // ensure unit_json.id points to SKU id (not parent variant/unit id).
        const { data: linearRow } = await (adminClient as any)
            .from('cat_skus_linear')
            .select('unit_json')
            .eq('id', item.skuId)
            .maybeSingle();
        const unitJson = linearRow?.unit_json || {};
        if (unitJson?.id !== item.skuId) {
            await (adminClient as any)
                .from('cat_skus_linear')
                .update({ unit_json: { ...unitJson, id: item.skuId } })
                .eq('id', item.skuId);
        }
    }

    // Publish with canonical SKU IDs.
    const publishResult = await publishPrices(skuIds, stateCode);
    return publishResult;
}
