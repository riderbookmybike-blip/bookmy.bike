'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS, districtTag } from '@/lib/cache/tags';
import { getAuthUser } from '@/lib/auth/resolver';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { sot_price_seed } from '@/actions/sot_price_seed';

interface PricePayload {
    vehicle_color_id: string; // SKU id (cat_skus.id). Legacy column name.
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
            const seedRows = prices.map(p => {
                const resolvedStage =
                    p.publish_stage && allowedStages.has(p.publish_stage.trim().toUpperCase())
                        ? p.publish_stage.trim().toUpperCase()
                        : 'DRAFT';

                return {
                    sku_id: p.vehicle_color_id,
                    state_code: p.state_code,
                    ex_showroom: p.ex_showroom_price,
                    publish_stage: resolvedStage,
                    is_popular: p.is_popular || false,
                };
            });

            const seedResult = await sot_price_seed(seedRows);
            if (!seedResult.success) {
                console.error('[savePrices] sot_price_seed failed:', seedResult.errors);
                return { success: false, error: seedResult.errors.join(' | ') || 'Price seed failed' };
            }

            for (const p of prices) {
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
            }

            // Push Invalidation: Trigger revalidation for each unique district
            const uniqueDistricts = Array.from(new Set(prices.map(p => p.district || 'ALL')));
            for (const district of uniqueDistricts) {
                revalidateTag(districtTag(district), 'max');
            }
        }

        // Update statuses using adminClient
        if (statusUpdates.length > 0) {
            for (const su of statusUpdates) {
                const { error: statusError } = await (adminClient as any)
                    .from('cat_skus')
                    .update({ status: su.status })
                    .eq('id', su.id);

                if (statusError) {
                    console.error('[savePrices] Status update error:', statusError);
                    return { success: false, error: statusError.message };
                }
            }
            // Push Invalidation: Catalog is global
            revalidateTag(CACHE_TAGS.catalog_global, 'max');
        }

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? getErrorMessage(err) : String(err);
        console.error('[savePrices] Exception:', err);
        return { success: false, error: message };
    }
}
