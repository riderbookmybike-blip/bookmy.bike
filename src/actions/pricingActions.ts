'use server';

import { createClient } from '@/lib/supabase/server';
import { resolvePricingContext } from '@/lib/server/pricingContext';
import { getDealerDelta } from '@/lib/server/storeSot';

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
    const activeState = (stateCode || 'MH').toUpperCase();
    const { data: priceRow, error } = await supabase
        .from('cat_price_state_mh')
        .select('ex_showroom')
        .eq('sku_id', itemId)
        .eq('state_code', activeState)
        .maybeSingle();

    if (error) throw error;
    if (priceRow?.ex_showroom !== null && priceRow?.ex_showroom !== undefined) {
        return Number(priceRow.ex_showroom);
    }
    throw new Error('Price not found in cat_price_state_mh for this SKU/state');
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

/**
 * Canonical dealer offer lookup for catalog/home surfaces.
 * Uses the same SOT path as PDP (`cat_price_dealer` via `getDealerDelta`)
 * so offer parity remains consistent across pages and devices.
 */
export async function getDealerOfferDeltasAction(params: { dealerId: string; stateCode: string; skuIds: string[] }) {
    const dealerId = String(params.dealerId || '').trim();
    const stateCode = String(params.stateCode || '')
        .trim()
        .toUpperCase();
    const skuIds = Array.from(new Set((params.skuIds || []).map(id => String(id || '').trim()).filter(Boolean)));

    if (!dealerId || !stateCode || skuIds.length === 0) return [];

    const { vehicleOffers } = await getDealerDelta({
        dealerId,
        stateCode,
        skuIds,
    });

    return skuIds
        .map(skuId => {
            const offer = vehicleOffers[skuId];
            if (offer === undefined || offer === null) return null;
            return {
                vehicle_color_id: skuId,
                best_offer: Number(offer || 0),
            };
        })
        .filter(Boolean) as { vehicle_color_id: string; best_offer: number }[];
}
