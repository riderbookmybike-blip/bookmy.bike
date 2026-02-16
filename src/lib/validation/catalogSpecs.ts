import { z } from 'zod';

/**
 * Strict schema for catalog specs to prevent key drift (e.g., cc vs cubiccapacity).
 * Adjust allowed keys/units as product lines evolve.
 */
const unitValue = z.object({
    value: z.number().nonnegative(),
    unit: z.string(),
});

export const specsSchema = z
    .object({
        cc: unitValue.extend({ unit: z.literal('cc') }).optional(),
        power_bhp: unitValue.extend({ unit: z.literal('bhp') }).optional(),
        torque_nm: unitValue.extend({ unit: z.literal('nm') }).optional(),
        range_km: unitValue.extend({ unit: z.literal('km') }).optional(),
        battery_kwh: unitValue.extend({ unit: z.literal('kWh') }).optional(),
        transmission: z.string().optional(),
        kerb_weight_kg: unitValue.extend({ unit: z.literal('kg') }).optional(),
        finish: z.enum(['GLOSSY', 'MATTE']).optional(),
    })
    .strict();

export const gallerySchema = z
    .array(z.object({ url: z.string().min(1), alt: z.string().min(1).optional() }))
    .max(20, 'Gallery limited to 20 items to avoid JSON bloat');

export const catalogLinearRowSchema = z.object({
    sku_code: z.string().min(1),
    brand_name: z.string().min(1),
    type_name: z.string().min(1),
    product_name: z.string().min(1),
    variant_name: z.string().min(1),
    unit_name: z.string().min(1),
    price_base: z.number().nonnegative(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'UPCOMING']),
    specs: specsSchema,
    gallery: gallerySchema.optional(),
});

export type CatalogLinearRow = z.infer<typeof catalogLinearRowSchema>;

/**
 * Helper to validate and strip unknown keys; use before writing to DB.
 */
export function validateCatalogRow(row: unknown): CatalogLinearRow {
    return catalogLinearRowSchema.parse(row);
}

/**
 * Postgres-side safeguard (add as CHECK in migration):
 *
 *  CHECK (
 *    jsonb_path_exists(specs, '$.cc.unit ? (@ == "cc")') AND
 *    jsonb_path_exists(specs, '$.power_bhp.unit ? (@ == "bhp")') AND
 *    jsonb_array_length(gallery) <= 20
 *  )
 */
