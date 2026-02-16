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

    // 1. Try to get price from cat_skus_linear.price_mh (single source of truth)
    const priceColumn = `price_${(stateCode || 'mh').toLowerCase()}`;
    const { data: linearRow, error } = await supabase
        .from('cat_skus_linear')
        .select(priceColumn)
        .eq('unit_json->>id', itemId)
        .maybeSingle();

    const priceMh = (linearRow as any)?.[priceColumn];
    if (priceMh?.ex_showroom) {
        return Number(priceMh.ex_showroom);
    }

    // No fallback: cat_skus_linear is the sole SOT. If missing, signal no price.
    throw new Error('Price not found in cat_skus_linear for this SKU/state');
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
