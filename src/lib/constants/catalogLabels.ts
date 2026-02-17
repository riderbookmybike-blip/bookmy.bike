/**
 * Catalog Hierarchy Labels per Product Type
 *
 * DATABASE & CODE level — canonical naming (universal):
 *   cat_brands → cat_models → cat_variants_* → cat_colours → cat_skus
 *   Variables: brand, model, variant, colour, sku
 *
 * UI/DISPLAY level — type-specific labels (user-facing):
 *   VEHICLE:   Brand → Model → Variant → Colour Pool → SKU (Variant × Colour)
 *   ACCESSORY: Brand → Product → Variant → Sub-Variant
 *   SERVICE:   Brand → Service → Plan → Tier
 *
 * Colour Pool is defined at the Model level (cat_colours).
 * SKU Matrix is universal: Variant × SKU
 * - Vehicle:   Disc SmartXonnect × Starlight Blue Gloss = SKU
 * - Accessory: Half Face × Blue = SKU  (or Standard × Activa = SKU)
 * - Service:   Gold Plan × 2 Years = SKU
 */
export const HIERARCHY_LABELS = {
    VEHICLE: { model: 'Model', variant: 'Variant', pool: 'Colour', sku: 'SKU' },
    ACCESSORY: { model: 'Product', variant: 'Variant', pool: 'Sub-Variant', sku: 'Sub-Variant' },
    SERVICE: { model: 'Service', variant: 'Plan', pool: 'Tier', sku: 'Tier' },
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
 * Used in BrandStep (merged category selector) and Products listing page.
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
