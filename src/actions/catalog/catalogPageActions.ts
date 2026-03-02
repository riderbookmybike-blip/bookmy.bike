'use server';

/**
 * Lean server actions for Studio V2 page.tsx ONLY.
 *
 * Kept deliberately minimal — NO imports from sot_price_seed, publishPrices,
 * pricingLedger, or any other heavy chain. This prevents Turbopack from
 * bundling that entire chain into the client synthetic module for page.tsx,
 * which caused the "module factory not available" HMR error.
 *
 * Step components that need writes (createModel, updateSku, etc.) should
 * continue importing directly from catalogV2Actions.
 */

import { adminClient } from '@/lib/supabase/admin';
import type { ProductType, CatalogModel, CatalogColour, CatalogSku } from '@/types/catalog';

// ── Brands ──────────────────────────────────────────────────────────────────

export async function listBrandsForPage() {
    const { data, error } = await adminClient.from('cat_brands').select('*').eq('is_active', true).order('name');
    if (error) throw new Error(`listBrands failed: ${error.message}`);
    return data;
}

// ── Models ───────────────────────────────────────────────────────────────────

export async function getModelById(id: string): Promise<CatalogModel | null> {
    const { data, error } = await adminClient.from('cat_models').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`getModel failed: ${error.message}`);
    return data as CatalogModel | null;
}

// ── Variants ─────────────────────────────────────────────────────────────────

export async function listVariantsForPage(modelId: string, productType: ProductType) {
    const tables = {
        VEHICLE: 'cat_variants_vehicle' as const,
        ACCESSORY: 'cat_variants_accessory' as const,
        SERVICE: 'cat_variants_service' as const,
    };
    const tableName = tables[productType];
    const { data, error } = await adminClient.from(tableName).select('*').eq('model_id', modelId).order('position');
    if (error) throw new Error(`listVariants failed: ${error.message}`);
    return data;
}

// ── Colours ──────────────────────────────────────────────────────────────────

export async function listColoursForPage(modelId: string): Promise<CatalogColour[]> {
    const { data, error } = await adminClient.from('cat_colours').select('*').eq('model_id', modelId).order('position');
    if (error) throw new Error(`listColours failed: ${error.message}`);
    return data as CatalogColour[];
}

// ── SKUs ─────────────────────────────────────────────────────────────────────

export async function listSkusByModelForPage(modelId: string): Promise<CatalogSku[]> {
    const { data, error } = await adminClient.from('cat_skus').select('*').eq('model_id', modelId).order('position');
    if (error) throw new Error(`listSkusByModel failed: ${error.message}`);
    return data as CatalogSku[];
}

// ── Full Product Tree ─────────────────────────────────────────────────────────

export async function getFullProductTreeForPage(modelId: string) {
    const model = await getModelById(modelId);
    if (!model) return null;

    const { data: brand } = await adminClient.from('cat_brands').select('*').eq('id', model.brand_id).single();

    const variants = await listVariantsForPage(modelId, model.product_type as ProductType);
    const colours = await listColoursForPage(modelId);
    const allSkus = await listSkusByModelForPage(modelId);

    return { model, brand, variants, colours, allSkus };
}
