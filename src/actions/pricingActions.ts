'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Fetches the district name for a given Indian pincode.
 */
export async function getDistrictFromPincode(pincode: string): Promise<string | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('loc_pincodes')
        .select('district')
        .eq('pincode', pincode)
        .maybeSingle();

    if (error || !data) return null;
    return data.district;
}

/**
 * Fetches the ex-showroom price for a product (item) in a specific district.
 * Falls back to the item's default price if district pricing is unavailable.
 */
export async function getDealerPriceAction(itemId: string, stateCode?: string): Promise<number> {
    const supabase = await createClient();

    // 1. Try to get price from cat_prices (single source of truth)
    const { data: price, error } = await supabase
        .from('cat_prices')
        .select('ex_showroom_price')
        .eq('vehicle_color_id', itemId)
        .eq('state_code', stateCode || 'MH')
        .eq('is_active', true)
        .maybeSingle();

    if (price?.ex_showroom_price) {
        return parseFloat(price.ex_showroom_price);
    }

    // 2. Fallback: Get the base price from cat_items if district price not found
    const { data: item, error: itemError } = await supabase
        .from('cat_items')
        .select('price_base')
        .eq('id', itemId)
        .single();

    if (item?.price_base) {
        return item.price_base;
    }

    return 85000; // Final hardcoded fallback if everything fails
}
