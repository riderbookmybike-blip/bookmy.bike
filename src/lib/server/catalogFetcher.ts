import { fetchCatalogV2 } from './catalogFetcherV2';
import { ProductVariant } from '@/types/productMaster';

/**
 * Legacy compatibility wrapper.
 * Canonical catalog source is V2 relational flow (cat_skus + cat_models + cat_price_state_mh).
 */
export async function fetchCatalogServerSide(_leadId?: string): Promise<ProductVariant[]> {
    return fetchCatalogV2('MH');
}
