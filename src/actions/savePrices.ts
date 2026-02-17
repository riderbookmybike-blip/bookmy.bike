'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS, districtTag } from '@/lib/cache/tags';
import { getAuthUser } from '@/lib/auth/resolver';

interface PricePayload {
    vehicle_color_id: string; // SKU id (cat_items.id). Legacy column name.
    state_code: string;
    district: string;
    ex_showroom_price: number;
    is_active: boolean;
    publish_stage?: string; // AUMS status: DRAFT, UNDER_REVIEW, PUBLISHED, LIVE, INACTIVE
    is_popular?: boolean;
    hex_primary?: string;
    hex_secondary?: string;
    color_name?: string;
    finish?: string;
}

interface StatusPayload {
    id: string;
    status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH';
}

async function ensureLinearRowForSku(
    skuId: string,
    seedExShowroom?: number
): Promise<{ success: boolean; error?: string }> {
    const { data: sku, error: skuError } = await adminClient
        .from('cat_items')
        .select('id, name, slug, specs, price_base, type, parent_id, brand_id')
        .eq('id', skuId)
        .maybeSingle();

    if (skuError) return { success: false, error: skuError.message };
    if (!sku) return { success: false, error: `SKU not found: ${skuId}` };

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
    if (!brandId) return { success: false, error: `Brand not found for SKU ${skuId}` };

    const { data: brand } = await adminClient
        .from('cat_brands')
        .select('id, name, slug')
        .eq('id', brandId)
        .maybeSingle();

    if (!brand) return { success: false, error: `Brand not found for SKU ${skuId}` };

    const insertPayload = {
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
        // Canonical: unit_json keeps sellable SKU identity.
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
        // Strict mode: no fallback to cat_items.price_base chain.
        price_base: Number(seedExShowroom) > 0 ? Number(seedExShowroom) : 0,
        checksum_md5: `seed-${(sku as any).id}`,
        status: 'ACTIVE',
    };

    const { error: upsertError } = await (adminClient as any).from('cat_skus_linear').upsert(insertPayload, {
        onConflict: 'id',
        ignoreDuplicates: false,
    });

    if (upsertError) {
        // If conflict on logical key occurs, log specifically
        if (upsertError.code === '23505') {
            console.error('[ensureLinearRowForSku] Logical key conflict for SKU:', skuId, upsertError.message);
        }
        return { success: false, error: upsertError.message };
    }
    return { success: true };
}

export async function savePrices(
    prices: PricePayload[],
    statusUpdates: StatusPayload[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getAuthUser();
        const supabase = await createClient();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Upsert prices using adminClient (bypasses RLS)
        if (prices.length > 0) {
            const allowedStages = new Set(['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'LIVE', 'INACTIVE']);

            for (const p of prices) {
                const priceColumn = `price_${p.state_code.toLowerCase()}`;
                const resolvedStage =
                    p.publish_stage && allowedStages.has(p.publish_stage.trim().toUpperCase())
                        ? p.publish_stage.trim().toUpperCase()
                        : 'DRAFT';

                // Canonical lookup by SKU ID (cat_skus_linear.id)
                // Backward-compatible fallback to UNIT ID (cat_skus_linear.unit_json.id).
                let existingRow: any = null;
                const bySkuRead = await (adminClient as any)
                    .from('cat_skus_linear')
                    .select(`id, ${priceColumn}`)
                    .eq('id', p.vehicle_color_id)
                    .maybeSingle();

                if (bySkuRead.error && bySkuRead.error.code !== 'PGRST116') {
                    console.error('[savePrices] cat_skus_linear read-by-sku error:', bySkuRead.error);
                    return { success: false, error: bySkuRead.error.message };
                }
                existingRow = bySkuRead.data;

                if (!existingRow) {
                    const { data: skuMeta, error: skuMetaError } = await adminClient
                        .from('cat_items')
                        .select('parent_id')
                        .eq('id', p.vehicle_color_id)
                        .maybeSingle();
                    if (skuMetaError) {
                        console.error('[savePrices] cat_items sku->unit lookup error:', skuMetaError);
                        return { success: false, error: skuMetaError.message };
                    }
                    const unitId = (skuMeta as any)?.parent_id;
                    if (unitId) {
                        const byUnitRead = await (adminClient as any)
                            .from('cat_skus_linear')
                            .select(`id, ${priceColumn}`)
                            .eq('unit_json->>id', unitId)
                            .maybeSingle();
                        if (byUnitRead.error && byUnitRead.error.code !== 'PGRST116') {
                            console.error('[savePrices] cat_skus_linear read-by-unit error:', byUnitRead.error);
                            return { success: false, error: byUnitRead.error.message };
                        }
                        existingRow = byUnitRead.data;
                    }
                }

                if (!existingRow) {
                    const ensure = await ensureLinearRowForSku(p.vehicle_color_id, p.ex_showroom_price);
                    if (!ensure.success) {
                        console.error(
                            '[savePrices] ensureLinearRowForSku failed for:',
                            p.vehicle_color_id,
                            ensure.error
                        );
                        return {
                            success: false,
                            error: ensure.error || `Pricing row not found for SKU ${p.vehicle_color_id}`,
                        };
                    }

                    const createdRead = await (adminClient as any)
                        .from('cat_skus_linear')
                        .select(`id, ${priceColumn}`)
                        .eq('id', p.vehicle_color_id)
                        .maybeSingle();

                    if (createdRead.error && createdRead.error.code !== 'PGRST116') {
                        return { success: false, error: createdRead.error.message };
                    }
                    existingRow = createdRead.data;
                    if (!existingRow) {
                        return { success: false, error: `Pricing row bootstrap failed for SKU ${p.vehicle_color_id}` };
                    }
                }

                // SOT: Save to dedicated state-level table with flat columns
                const { error: priceError } = await adminClient.from('cat_price_mh').upsert(
                    {
                        sku_id: p.vehicle_color_id,
                        state_code: p.state_code,
                        ex_showroom: p.ex_showroom_price,
                        publish_stage: resolvedStage,
                        is_popular: p.is_popular || false,
                    },
                    { onConflict: 'sku_id,state_code' }
                );

                if (priceError) {
                    console.error('[savePrices] cat_price_mh upsert error:', priceError);
                    return { success: false, error: priceError.message };
                }

                // Update color metadata in cat_skus if provided
                if (p.color_name || p.hex_primary || p.hex_secondary || p.finish) {
                    const { error: skuUpdateError } = await adminClient
                        .from('cat_skus')
                        .update({
                            color_name: p.color_name,
                            hex_primary: p.hex_primary,
                            hex_secondary: p.hex_secondary,
                            finish: p.finish,
                        })
                        .eq('id', p.vehicle_color_id);

                    if (skuUpdateError) {
                        console.warn('[savePrices] cat_skus update warning:', skuUpdateError);
                        // We don't fail the whole operation if just color metadata fails to sync
                    }
                }

                // NOTE: We no longer sync to cat_skus_linear JSONB here as per user preference.
                // The marketplace will be updated to read from cat_price_mh.
            }

            // Push Invalidation: Trigger revalidation for each unique district
            const uniqueDistricts = Array.from(new Set(prices.map(p => p.district || 'ALL')));
            for (const district of uniqueDistricts) {
                (revalidateTag as any)(districtTag(district));
            }
        }

        // Update statuses using adminClient
        if (statusUpdates.length > 0) {
            for (const su of statusUpdates) {
                const { error: statusError } = await adminClient
                    .from('cat_items')
                    .update({ status: su.status })
                    .eq('id', su.id);

                if (statusError) {
                    console.error('[savePrices] Status update error:', statusError);
                    return { success: false, error: statusError.message };
                }
            }
            // Push Invalidation: Catalog is global
            (revalidateTag as any)(CACHE_TAGS.catalog_global);
        }

        return { success: true };
    } catch (err: any) {
        console.error('[savePrices] Exception:', err);
        return { success: false, error: err.message };
    }
}
