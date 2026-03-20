/**
 * Canonical Cache Tags for BookMyBike
 *
 * Layer model:
 *   Next.js Data Cache (unstable_cache): invalidated by revalidateTag()
 *   Vercel Edge CDN (Cache-Control s-maxage): NOT invalidated by revalidateTag()
 *                                             — use short TTL (60s) + rely on data cache
 */

export const CACHE_TAGS = {
    // Global Catalog
    catalog_global: 'catalog:global',

    // Group tags
    districts: 'catalog:districts',
    rules: 'rules',
    offers: 'offers',
    catalog: 'catalog',
    referral_hot_picks: 'catalog:referral-hot-picks',

    // PDP global (invalidate all PDP data caches)
    pdp_global: 'pdp:global',
};

/**
 * Generates a tag for a specific state catalog.
 * Use alongside CACHE_TAGS.catalog for selective state-level invalidation.
 * e.g. revalidateTag(stateTag('MH')) invalidates only MH catalog data cache.
 */
export const stateTag = (stateCode: string) => `catalog:state:${stateCode.toUpperCase()}`;

/**
 * Generates a tag for a specific variant's PDP data.
 * e.g. revalidateTag(variantTag(variantId)) invalidates only that variant's PDP cache.
 */
export const variantTag = (variantId: string) => `pdp:variant:${variantId}`;

/**
 * Generates a tag for a specific district
 */
export const districtTag = (district: string | number) => `catalog:district:${district}`;

/**
 * Generates a tag for a specific tenant (dealer)
 */
export const tenantTag = (tenantId: string) => `catalog:tenant:${tenantId}`;

/**
 * Generates a tag for specific RTO rules
 */
export const rtoRuleTag = (stateCode: string) => `rules:rto:${stateCode}`;

/**
 * Generates a tag for specific Insurance rules
 */
export const insuranceRuleTag = (stateCode: string) => `rules:insurance:${stateCode}`;
