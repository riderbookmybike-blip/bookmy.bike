'use server';

import { createClient } from '@/lib/supabase/server';
import { resolvePricingContext } from '@/lib/server/pricingContext';

/**
 * Fetches the district name for a given Indian pincode.
 */
export async function getDistrictFromPincode(pincode: string): Promise<string | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('loc_pincodes').select('district').eq('pincode', pincode).maybeSingle();

    if (error || !data) return null;
    return data.district;
}

/**
 * Fetches the ex-showroom price for a product (item) in a specific district.
 * Falls back to the item's default price if district pricing is unavailable.
 */
export async function getDealerPriceAction(itemId: string, stateCode?: string): Promise<number> {
    const supabase = await createClient();

    // 1. Try to get price from cat_price_state (single source of truth)
    const { data: price, error } = await supabase
        .from('cat_price_state')
        .select('ex_showroom_price')
        .eq('vehicle_color_id', itemId)
        .eq('state_code', stateCode || 'MH')
        .eq('district', 'ALL')
        .eq('is_active', true)
        .maybeSingle();

    if (price?.ex_showroom_price) {
        return Number(price.ex_showroom_price);
    }

    // No fallback: cat_price_state is the sole SOT. If missing, signal no price.
    throw new Error('Price not found in cat_price_state for this SKU/state');
}

/**
 * Server Action to resolve the dealer context based on URL params and location.
 * Used by the client-side useDealerSession hook for deterministic resolution.
 */
export async function getResolvedPricingContextAction(params: {
    leadId?: string | null;
    dealerId?: string | null;
    district?: string | null;
    state?: string | null;
    studio?: string | null;
}) {
    return await resolvePricingContext(params);
}
