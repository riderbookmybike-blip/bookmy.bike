'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS, districtTag } from '@/lib/cache/tags';
import { getAuthUser } from '@/lib/auth/resolver';

interface PricePayload {
    vehicle_color_id: string;
    state_code: string;
    district: string;
    ex_showroom_price: number;
    is_active: boolean;
    publish_stage?: string; // AUMS status: DRAFT, UNDER_REVIEW, PUBLISHED, LIVE, INACTIVE
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
            const priceRecords = prices.map(p => ({
                vehicle_color_id: p.vehicle_color_id,
                state_code: p.state_code,
                district: p.district || 'ALL',
                ex_showroom_price: p.ex_showroom_price,
                is_active: p.is_active,
                ...(p.publish_stage && { publish_stage: p.publish_stage }),
                updated_at: new Date().toISOString(),
            }));

            const { error: priceError } = await adminClient.from('cat_price_state').upsert(priceRecords as any, {
                onConflict: 'vehicle_color_id,state_code,district',
            });

            if (priceError) {
                console.error('[savePrices] Price upsert error:', priceError);
                return { success: false, error: priceError.message };
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
