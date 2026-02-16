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

            for (const p of prices) {
                const priceColumn = `price_${p.state_code.toLowerCase()}`;
                const resolvedStage =
                    p.publish_stage && allowedStages.has(p.publish_stage.trim().toUpperCase())
                        ? p.publish_stage.trim().toUpperCase()
                        : 'DRAFT';

                // 1. PRIMARY SOT: Read existing price_mh, merge ex_showroom, write back
                const { data: existingRow } = await (adminClient as any)
                    .from('cat_skus_linear')
                    .select(priceColumn)
                    .eq('unit_json->>id', p.vehicle_color_id)
                    .single();

                const existingPrice = existingRow?.[priceColumn] || {};
                const mergedPrice = {
                    ...existingPrice,
                    ex_showroom: p.ex_showroom_price,
                    publish_stage: resolvedStage,
                    ...(p.is_popular !== undefined && { is_popular: p.is_popular }),
                };

                const { error: linearError } = await (adminClient as any)
                    .from('cat_skus_linear')
                    .update({ [priceColumn]: mergedPrice })
                    .eq('unit_json->>id', p.vehicle_color_id);

                if (linearError) {
                    console.error('[savePrices] cat_skus_linear update error:', linearError);
                    return { success: false, error: linearError.message };
                }

                // cat_price_state secondary write REMOVED — cat_skus_linear is now the sole SOT
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
