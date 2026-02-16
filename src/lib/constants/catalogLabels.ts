/**
 * Catalog Hierarchy Labels per Product Type
 *
 * Each product type has its own vocabulary for the catalog levels:
 * - VEHICLE:   Brand → Model → Variant → Colour
 * - ACCESSORY: Brand → Product → Variant → Style
 * - SERVICE:   Brand → Service → Plan → Tier
 *
 * The database table names remain generic (cat_models, cat_variants_*, cat_skus),
 * but the UI displays the correct label based on product_type.
 */
export const HIERARCHY_LABELS = {
    VEHICLE: { model: 'Model', variant: 'Variant', sku: 'Colour' },
    ACCESSORY: { model: 'Product', variant: 'Variant', sku: 'Style' },
    SERVICE: { model: 'Service', variant: 'Plan', sku: 'Tier' },
} as const;

export type ProductType = keyof typeof HIERARCHY_LABELS;

/**
 * Get hierarchy labels for a given product type.
 * Falls back to VEHICLE if unknown type is passed.
 */
export function getHierarchyLabels(productType: string | null | undefined) {
    const key = (productType || 'VEHICLE').toUpperCase() as ProductType;
    return HIERARCHY_LABELS[key] || HIERARCHY_LABELS.VEHICLE;
}

/**
 * Category metadata for the Studio entry points.
 * Replaces the old generic CategoryStep with 3 clear entry points.
 */
export const CATEGORY_CONFIG = {
    VEHICLE: {
        title: 'Vehicle',
        pluralTitle: 'Vehicles',
        addLabel: 'Add Vehicle Model',
        description: 'Bikes, Scooters, and other two-wheeled vehicles',
        icon: 'Bike' as const,
        color: 'blue',
    },
    ACCESSORY: {
        title: 'Accessory',
        pluralTitle: 'Accessories',
        addLabel: 'Add Accessory Product',
        description: 'Helmets, safety gear, and performance parts',
        icon: 'ShieldCheck' as const,
        color: 'amber',
    },
    SERVICE: {
        title: 'Service',
        pluralTitle: 'Services',
        addLabel: 'Add Service',
        description: 'Extended warranty, roadside assistance, and AMC',
        icon: 'Wrench' as const,
        color: 'emerald',
    },
} as const;
