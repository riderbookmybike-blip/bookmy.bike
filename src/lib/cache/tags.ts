/**
 * Canonical Cache Tags for BookMyBike
 */

export const CACHE_TAGS = {
    // Global Catalog
    catalog_global: 'catalog:global',

    // Group tags
    districts: 'catalog:districts',
    rules: 'rules',
    offers: 'offers',
    catalog: 'catalog',
};

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
