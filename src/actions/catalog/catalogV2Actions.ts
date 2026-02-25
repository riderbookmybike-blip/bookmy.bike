'use server';

import { adminClient } from '@/lib/supabase/admin';
import { calculatePricingBySkuIds } from '@/actions/pricingLedger';

// ============================================================
// Types
// ============================================================

export type ProductType = 'VEHICLE' | 'ACCESSORY' | 'SERVICE';
export type ItemStatus = 'DRAFT' | 'ACTIVE';
export type PublishStage = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CatalogModel {
    id: string;
    brand_id: string;
    name: string;
    slug: string;
    product_type: ProductType;
    body_type: string | null;
    engine_cc: number | null;
    fuel_type: string | null;
    emission_standard: string | null;
    hsn_code: string | null;
    item_tax_rate: number | null;
    position: number;
    status: ItemStatus;
    // Media
    primary_image?: string | null;
    gallery_img_1?: string | null;
    gallery_img_2?: string | null;
    gallery_img_3?: string | null;
    gallery_img_4?: string | null;
    gallery_img_5?: string | null;
    gallery_img_6?: string | null;
    video_url_1?: string | null;
    video_url_2?: string | null;
    pdf_url_1?: string | null;
    zoom_factor?: number | null;
    is_flipped?: boolean;
    offset_x?: number | null;
    offset_y?: number | null;
    media_shared?: boolean;
    created_at: string;
    updated_at: string;
}

export interface CatalogVariantVehicle {
    id: string;
    model_id: string;
    name: string;
    slug: string;
    position: number;
    status: ItemStatus;
    // Engine
    engine_type: string | null;
    displacement: number | null; // NUMERIC(6,1) in DB
    max_power: string | null;
    max_torque: string | null;
    num_valves: number | null;
    transmission: string | null;
    air_filter: string | null;
    mileage: number | null; // NUMERIC(5,1) in DB
    start_type: string | null;
    // Brakes
    front_brake: string | null;
    rear_brake: string | null;
    braking_system: string | null;
    front_suspension: string | null;
    rear_suspension: string | null;
    // Dimensions
    kerb_weight: number | null; // INTEGER in DB
    seat_height: number | null;
    ground_clearance: number | null;
    wheelbase: number | null;
    fuel_capacity: number | null; // NUMERIC(4,1) in DB
    // Electrical
    console_type: string | null;
    led_headlamp: boolean | null;
    led_tail_lamp: boolean | null;
    usb_charging: boolean | null;
    bluetooth: boolean | null;
    navigation: boolean | null; // BOOLEAN in DB (not TEXT)
    ride_modes: string | null;
    // Tyres
    front_tyre: string | null;
    rear_tyre: string | null;
    tyre_type: string | null;
    // EV
    battery_type: string | null;
    battery_capacity: string | null;
    range_km: number | null; // INTEGER in DB
    charging_time: string | null;
    motor_power: string | null;
    // Timestamps
    created_at: string;
    updated_at: string;
    // Media
    primary_image?: string | null;
    gallery_img_1?: string | null;
    gallery_img_2?: string | null;
    gallery_img_3?: string | null;
    gallery_img_4?: string | null;
    gallery_img_5?: string | null;
    gallery_img_6?: string | null;
    video_url_1?: string | null;
    video_url_2?: string | null;
    pdf_url_1?: string | null;
    zoom_factor?: number | null;
    is_flipped?: boolean;
    offset_x?: number | null;
    offset_y?: number | null;
    media_shared?: boolean;
}

export interface CatalogVariantAccessory {
    id: string;
    model_id: string;
    name: string;
    slug: string;
    position: number;
    status: ItemStatus;
    material: string | null;
    weight: number | null;
    finish: string | null;
    created_at: string;
    updated_at: string;
}

export interface CatalogVariantService {
    id: string;
    model_id: string;
    name: string;
    slug: string;
    position: number;
    status: ItemStatus;
    duration_months: number | null;
    coverage_type: string | null;
    labor_included: boolean | null;
    created_at: string;
    updated_at: string;
}

export interface CatalogColour {
    id: string;
    model_id: string;
    name: string;
    hex_primary: string | null;
    hex_secondary: string | null;
    finish: string | null;
    primary_image?: string | null;
    // Gallery
    gallery_img_1?: string | null;
    gallery_img_2?: string | null;
    gallery_img_3?: string | null;
    gallery_img_4?: string | null;
    gallery_img_5?: string | null;
    gallery_img_6?: string | null;
    // Video & PDF
    video_url_1?: string | null;
    video_url_2?: string | null;
    pdf_url_1?: string | null;
    // Display
    zoom_factor?: number | null;
    is_flipped?: boolean;
    offset_x?: number | null;
    offset_y?: number | null;
    is_popular?: boolean;
    media_shared?: boolean;
    position: number;
    created_at: string;
    updated_at: string;
}

export interface CatalogSku {
    id: string;
    sku_code: string | null;
    sku_type: ProductType;
    brand_id: string;
    model_id: string;
    vehicle_variant_id: string | null;
    accessory_variant_id: string | null;
    service_variant_id: string | null;
    colour_id: string | null;
    name: string;
    slug: string;
    status: ItemStatus;
    position: number;
    is_primary: boolean;
    price_base: number | null;
    // Colour (denormalized cache — SOT is cat_colours via colour_id)
    hex_primary: string | null;
    hex_secondary: string | null;
    color_name: string | null;
    finish: string | null;
    // Media
    primary_image: string | null;
    gallery_img_1: string | null;
    gallery_img_2: string | null;
    gallery_img_3: string | null;
    gallery_img_4: string | null;
    gallery_img_5: string | null;
    gallery_img_6: string | null;
    video_url_1: string | null;
    video_url_2: string | null;
    pdf_url_1: string | null;
    has_360: boolean;
    // Display
    zoom_factor: number | null;
    is_flipped: boolean;
    offset_x: number | null;
    offset_y: number | null;
    media_shared: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================
// Helpers
// ============================================================

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/\+/g, 'plus')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function variantFk(type: ProductType): 'vehicle_variant_id' | 'accessory_variant_id' | 'service_variant_id' {
    switch (type) {
        case 'VEHICLE':
            return 'vehicle_variant_id';
        case 'ACCESSORY':
            return 'accessory_variant_id';
        case 'SERVICE':
            return 'service_variant_id';
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryVariantTable(
    action: 'select' | 'insert' | 'update' | 'delete',
    productType: ProductType,
    options: any
): Promise<{ data: any; error: any }> {
    const tables = {
        VEHICLE: 'cat_variants_vehicle' as const,
        ACCESSORY: 'cat_variants_accessory' as const,
        SERVICE: 'cat_variants_service' as const,
    };
    const tableName = tables[productType];

    if (action === 'select') {
        if (options.id) {
            return adminClient.from(tableName).select('*').eq('id', options.id).maybeSingle();
        }
        return adminClient
            .from(tableName)
            .select('*', options.countOnly ? { count: 'exact', head: true } : {})
            .eq('model_id', options.model_id)
            .order('position');
    }
    if (action === 'insert') {
        return adminClient.from(tableName).insert(options.payload).select().single();
    }
    if (action === 'update') {
        return adminClient.from(tableName).update(options.payload).eq('id', options.id).select().single();
    }
    // delete
    return adminClient.from(tableName).delete().eq('id', options.id);
}

// ============================================================
// BRANDS — Read Only (already seeded)
// ============================================================

export async function listBrands() {
    const { data, error } = await adminClient.from('cat_brands').select('*').eq('is_active', true).order('name');

    if (error) throw new Error(`listBrands failed: ${error.message}`);
    return data;
}

// ============================================================
// MODELS — CRUD
// ============================================================

export async function listModels(brandId: string, productType?: ProductType) {
    let query = adminClient.from('cat_models').select('*').eq('brand_id', brandId).order('position');

    if (productType) {
        query = query.eq('product_type', productType);
    }

    const { data, error } = await query;
    if (error) throw new Error(`listModels failed: ${error.message}`);
    return data as CatalogModel[];
}

export async function getModel(id: string) {
    const { data, error } = await adminClient.from('cat_models').select('*').eq('id', id).maybeSingle();

    if (error) throw new Error(`getModel failed: ${error.message}`);
    return data as CatalogModel | null;
}

export async function createModel(payload: {
    brand_id: string;
    name: string;
    product_type: ProductType;
    body_type?: string;
    engine_cc?: number;
    fuel_type?: string;
    emission_standard?: string;
    hsn_code?: string;
    item_tax_rate?: number;
}) {
    // Get next position
    const { count } = await adminClient
        .from('cat_models')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', payload.brand_id)
        .eq('product_type', payload.product_type);

    const { data, error } = await adminClient
        .from('cat_models')
        .insert({
            ...payload,
            slug: slugify(payload.name),
            position: (count ?? 0) + 1,
            status: 'DRAFT',
        })
        .select()
        .single();

    if (error) throw new Error(`createModel failed: ${error.message}`);
    return data as CatalogModel;
}

export async function updateModel(id: string, updates: Partial<CatalogModel>) {
    // Don't allow updating id, created_at
    const { id: _id, created_at: _ca, ...safeUpdates } = updates;

    // Auto-update slug if name changed
    if (safeUpdates.name && !safeUpdates.slug) {
        safeUpdates.slug = slugify(safeUpdates.name);
    }

    const { data, error } = await adminClient
        .from('cat_models')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`updateModel failed: ${error.message}`);
    return data as CatalogModel;
}

export async function deleteModel(id: string) {
    const { error } = await adminClient.from('cat_models').delete().eq('id', id);
    if (error) throw new Error(`deleteModel failed: ${error.message}`);
    return true;
}

// ============================================================
// VARIANTS — CRUD (polymorphic across 3 tables)
// ============================================================

export async function listVariants(modelId: string, productType: ProductType) {
    const { data, error } = await queryVariantTable('select', productType, { model_id: modelId });
    if (error) throw new Error(`listVariants failed: ${error.message}`);
    return data;
}

export async function getVariant(id: string, productType: ProductType) {
    const { data, error } = await queryVariantTable('select', productType, { id });
    if (error) throw new Error(`getVariant failed: ${error.message}`);
    return data;
}

export async function createVariant(
    productType: ProductType,
    payload: {
        model_id: string;
        name: string;
        [key: string]: any; // type-specific fields
    }
) {
    // Get next position
    const { count } = (await queryVariantTable('select', productType, {
        model_id: payload.model_id,
        countOnly: true,
    })) as any;

    const { data, error } = await queryVariantTable('insert', productType, {
        payload: {
            ...payload,
            slug: slugify(payload.name),
            position: (count ?? 0) + 1,
            status: 'DRAFT',
        },
    });

    if (error) throw new Error(`createVariant(${productType}) failed: ${error.message}`);
    return data;
}

export async function updateVariant(id: string, productType: ProductType, updates: Record<string, any>) {
    const { id: _id, created_at: _ca, ...safeUpdates } = updates;

    if (safeUpdates.name && !safeUpdates.slug) {
        safeUpdates.slug = slugify(safeUpdates.name);
    }

    const { data, error } = await queryVariantTable('update', productType, {
        id,
        payload: { ...safeUpdates, updated_at: new Date().toISOString() },
    });

    if (error) throw new Error(`updateVariant(${productType}) failed: ${error.message}`);
    return data;
}

export async function deleteVariant(id: string, productType: ProductType) {
    const { error } = await queryVariantTable('delete', productType, { id });
    if (error) throw new Error(`deleteVariant(${productType}) failed: ${error.message}`);
    return true;
}

export async function reorderVariants(modelId: string, productType: ProductType, orderedIds: string[]) {
    const tables = {
        VEHICLE: 'cat_variants_vehicle' as const,
        ACCESSORY: 'cat_variants_accessory' as const,
        SERVICE: 'cat_variants_service' as const,
    };
    const tableName = tables[productType];
    const updates = orderedIds.map((id, index) =>
        adminClient.from(tableName).update({ position: index }).eq('id', id).eq('model_id', modelId)
    );
    await Promise.all(updates);
    return true;
}

// ============================================================
// SKUs — CRUD
// ============================================================

export async function listSkus(variantId: string, productType: ProductType) {
    const fk = variantFk(productType);
    const { data, error } = await adminClient.from('cat_skus').select('*').eq(fk, variantId).order('position');

    if (error) throw new Error(`listSkus failed: ${error.message}`);
    return data as CatalogSku[];
}

export async function listSkusByModel(modelId: string) {
    const { data, error } = await adminClient.from('cat_skus').select('*').eq('model_id', modelId).order('position');

    if (error) throw new Error(`listSkusByModel failed: ${error.message}`);
    return data as CatalogSku[];
}

export async function getSku(id: string) {
    const { data, error } = await adminClient.from('cat_skus').select('*').eq('id', id).maybeSingle();

    if (error) throw new Error(`getSku failed: ${error.message}`);
    return data as CatalogSku | null;
}

export async function createSku(payload: {
    sku_type: ProductType;
    brand_id: string;
    model_id: string;
    vehicle_variant_id?: string;
    accessory_variant_id?: string;
    service_variant_id?: string;
    colour_id?: string;
    name: string;
    color_name?: string;
    hex_primary?: string;
    hex_secondary?: string;
    finish?: string;
    price_base?: number;
    primary_image?: string;
    is_primary?: boolean;
}) {
    const fk = variantFk(payload.sku_type);
    const variantId = payload.vehicle_variant_id || payload.accessory_variant_id || payload.service_variant_id;

    // Get next position
    const { count } = await adminClient.from('cat_skus').select('*', { count: 'exact', head: true }).eq(fk, variantId!);

    const { data, error } = await adminClient
        .from('cat_skus')
        .insert({
            ...payload,
            slug: slugify(payload.name),
            position: (count ?? 0) + 1,
            status: 'DRAFT',
            is_primary: payload.is_primary ?? count === 0, // First SKU = primary
        })
        .select()
        .single();

    if (error) throw new Error(`createSku failed: ${error.message}`);

    // Compatibility is now managed at variant level via cat_accessory_suitable_for (handled by Studio V2)

    return data as CatalogSku;
}

export async function updateSku(id: string, updates: Partial<CatalogSku>) {
    const { id: _id, created_at: _ca, ...safeUpdates } = updates;

    if (safeUpdates.name && !safeUpdates.slug) {
        safeUpdates.slug = slugify(safeUpdates.name);
    }

    const { data, error } = await adminClient
        .from('cat_skus')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) throw new Error(`updateSku failed: ${error.message}`);
    if (!data) throw new Error(`updateSku failed: SKU ${id} not found`);
    return data as CatalogSku;
}

export async function deleteSku(id: string) {
    // Delete dependent pricing rows first (FK NO ACTION constraint)
    const { error: pricingError } = await adminClient.from('cat_price_state_mh').delete().eq('sku_id', id);
    if (pricingError) throw new Error(`deleteSku pricing cleanup failed: ${pricingError.message}`);

    const { error } = await adminClient.from('cat_skus').delete().eq('id', id);
    if (error) throw new Error(`deleteSku failed: ${error.message}`);
    return true;
}

// ============================================================
// PRICING — CRUD
// ============================================================

export async function getPricing(skuId: string, stateCode: string = 'MH') {
    const { data, error } = await adminClient
        .from('cat_price_state_mh')
        .select('*')
        .eq('sku_id', skuId)
        .eq('state_code', stateCode)
        .maybeSingle();

    if (error) throw new Error(`getPricing failed: ${error.message}`);
    return data;
}

export async function listPricingForModel(modelId: string) {
    // Get all SKU IDs for this model first
    const { data: skus } = await adminClient.from('cat_skus').select('id').eq('model_id', modelId);

    if (!skus || skus.length === 0) return [];

    const skuIds = skus.map(s => s.id);
    const { data, error } = await adminClient
        .from('cat_price_state_mh')
        .select('*')
        .in('sku_id', skuIds)
        .order('state_code');

    if (error) throw new Error(`listPricingForModel failed: ${error.message}`);
    return data;
}

export async function upsertPricing(payload: {
    sku_id: string;
    state_code: string;
    ex_showroom: number;
    // RTO total (canonical)
    rto_total_state?: number;
    // Insurance
    ins_od_base?: number;
    ins_od_gst?: number;
    ins_od_total?: number;
    ins_tp_base?: number;
    ins_tp_gst?: number;
    ins_tp_total?: number;
    ins_total?: number;
    // Metadata
    publish_stage?: string;
    is_popular?: boolean;
    // Computed
    on_road_price?: number;
}) {
    const { ins_od_base, ins_od_gst, ins_od_total, ins_tp_base, ins_tp_gst, ins_tp_total, ...rest } = payload;

    // Ensure required numeric fields default to 0
    const insTotal = payload.ins_total ?? 0;
    const rtoTotal = payload.rto_total_state ?? 0;
    const onRoad = payload.on_road_price ?? payload.ex_showroom + rtoTotal + insTotal;

    const { data, error } = await adminClient
        .from('cat_price_state_mh')
        .upsert(
            {
                id: crypto.randomUUID(),
                ...rest,
                ex_factory: payload.ex_showroom,
                ex_factory_gst_amount: 0,
                logistics_charges: 0,
                logistics_charges_gst_amount: 0,
                ins_own_damage_premium_amount: ins_od_base,
                ins_own_damage_gst_amount: ins_od_gst,
                ins_own_damage_total_amount: ins_od_total,
                ins_liability_only_premium_amount: ins_tp_base,
                ins_liability_only_gst_amount: ins_tp_gst,
                ins_liability_only_total_amount: ins_tp_total,
                ins_gross_premium: insTotal,
                rto_total_state: rtoTotal,
                on_road_price: onRoad,
                publish_stage: payload.publish_stage || 'DRAFT',
            },
            { onConflict: 'sku_id,state_code' }
        )
        .select()
        .single();

    if (error) throw new Error(`upsertPricing failed: ${error.message}`);

    // SOT: ex-showroom seed/update must flow through price engine for accurate RTO + insurance.
    if (payload.ex_showroom > 0) {
        const calcResult = await calculatePricingBySkuIds(
            [{ skuId: payload.sku_id, exShowroom: payload.ex_showroom }],
            payload.state_code
        );
        if (!calcResult.success) {
            throw new Error(`upsertPricing price engine failed: ${calcResult.errors.join(', ')}`);
        }
    }

    return data;
}

// ============================================================
// COLOURS — CRUD (model-level colour pool)
// ============================================================

export async function listColours(modelId: string) {
    const { data, error } = await adminClient.from('cat_colours').select('*').eq('model_id', modelId).order('position');

    if (error) throw new Error(`listColours failed: ${error.message}`);
    return data as CatalogColour[];
}

export async function getColour(id: string) {
    const { data, error } = await adminClient.from('cat_colours').select('*').eq('id', id).maybeSingle();

    if (error) throw new Error(`getColour failed: ${error.message}`);
    return data as CatalogColour | null;
}

export async function createColour(payload: {
    model_id: string;
    name: string;
    hex_primary?: string;
    hex_secondary?: string;
    finish?: string;
}) {
    // Get next position
    const { count } = await adminClient
        .from('cat_colours')
        .select('*', { count: 'exact', head: true })
        .eq('model_id', payload.model_id);

    const { data, error } = await adminClient
        .from('cat_colours')
        .insert({
            ...payload,
            position: count ?? 0,
        })
        .select()
        .single();

    if (error) throw new Error(`createColour failed: ${error.message}`);
    return data as CatalogColour;
}

export async function updateColour(id: string, updates: Partial<CatalogColour>) {
    const { id: _id, created_at: _ca, model_id: _mid, ...safeUpdates } = updates;

    const { data, error } = await adminClient
        .from('cat_colours')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`updateColour failed: ${error.message}`);
    return data as CatalogColour;
}

export async function deleteColour(id: string) {
    // Note: cat_skus.colour_id ON DELETE SET NULL — linked SKUs will have colour_id nulled
    const { error } = await adminClient.from('cat_colours').delete().eq('id', id);
    if (error) throw new Error(`deleteColour failed: ${error.message}`);
    return true;
}

export async function reorderColours(modelId: string, orderedIds: string[]) {
    // Update positions in bulk
    const updates = orderedIds.map((id, index) =>
        adminClient.from('cat_colours').update({ position: index }).eq('id', id).eq('model_id', modelId)
    );
    await Promise.all(updates);
    return true;
}

// ============================================================
// SUITABLE FOR — Junction table (cat_accessory_suitable_for)
// ============================================================

export async function listSuitableFor(variantId: string) {
    const { data, error } = await adminClient
        .from('cat_accessory_suitable_for')
        .select('*, target_brand:cat_brands!target_brand_id(name), target_model:cat_models!target_model_id(name)')
        .eq('variant_id', variantId);

    if (error) throw new Error(`listSuitableFor failed: ${error.message}`);
    return data;
}

export async function addSuitableFor(payload: {
    variant_id: string;
    target_brand_id: string;
    target_model_id?: string;
    target_variant_id?: string;
}) {
    const { data, error } = await adminClient.from('cat_accessory_suitable_for').insert(payload).select().single();

    if (error) throw new Error(`addSuitableFor failed: ${error.message}`);
    return data;
}

export async function removeSuitableFor(id: string) {
    const { error } = await adminClient.from('cat_accessory_suitable_for').delete().eq('id', id);
    if (error) throw new Error(`removeSuitableFor failed: ${error.message}`);
    return true;
}

// ============================================================
// SPECIFICATIONS — Read-only (seeded master data)
// ============================================================

export async function listSpecifications(category?: string) {
    let query = adminClient.from('cat_specifications').select('*').order('category').order('position');

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw new Error(`listSpecifications failed: ${error.message}`);
    return data;
}

// ============================================================
// FULL PRODUCT TREE — For Review/Display
// ============================================================

export async function getFullProductTree(modelId: string) {
    const model = await getModel(modelId);
    if (!model) return null;

    // Get brand
    const { data: brand } = await adminClient.from('cat_brands').select('*').eq('id', model.brand_id).single();

    // Get variants based on product type
    const variants = await listVariants(modelId, model.product_type);

    // Get all SKUs for this model
    const skus = await listSkusByModel(modelId);

    // Get all pricing for this model
    const pricing = await listPricingForModel(modelId);

    // Get all colours for this model
    const colours = await listColours(modelId);

    // Assemble tree
    const fkField = variantFk(model.product_type);
    const variantsWithSkus = (variants || []).map((v: any) => ({
        ...v,
        skus: skus.filter(s => (s as any)[fkField] === v.id),
        pricing: pricing?.filter((p: any) => skus.some(s => (s as any)[fkField] === v.id && s.id === p.sku_id)),
    }));

    return {
        brand,
        model,
        variants: variantsWithSkus,
        colours,
        allSkus: skus,
        allPricing: pricing,
    };
}

// ============================================================
// STATUS TRANSITIONS — Gate Logic
// ============================================================

export async function activateModel(modelId: string): Promise<{ success: boolean; errors: string[] }> {
    const tree = await getFullProductTree(modelId);
    if (!tree) return { success: false, errors: ['Model not found'] };

    const errors: string[] = [];
    const { model, variants, allSkus } = tree;

    // Gate: Model-level required fields
    if (model.product_type === 'VEHICLE') {
        if (!model.engine_cc) errors.push('Missing engine_cc on Model');
        if (!model.fuel_type) errors.push('Missing fuel_type on Model');
        if (!model.body_type) errors.push('Missing body_type on Model');
    }
    if (!model.name) errors.push('Missing name on Model');

    // Gate: At least 1 variant
    if (!variants || variants.length === 0) {
        errors.push('At least 1 Variant required');
    }

    // Gate: At least 1 SKU per variant
    for (const v of variants || []) {
        if (!v.skus || v.skus.length === 0) {
            errors.push(`Variant "${v.name}" has no SKUs`);
        }
    }

    // Gate: At least 1 SKU with primary_image
    const hasAnyImage = allSkus.some(s => s.primary_image);
    if (!hasAnyImage) {
        errors.push('At least 1 SKU must have a primary image');
    }

    if (errors.length > 0) return { success: false, errors };

    // All checks passed — activate
    await updateModel(modelId, { status: 'ACTIVE' } as any);

    // Activate all variants and SKUs
    for (const v of variants || []) {
        await updateVariant(v.id, model.product_type, { status: 'ACTIVE' });
        for (const s of v.skus || []) {
            await updateSku(s.id, { status: 'ACTIVE' } as any);
        }
    }

    return { success: true, errors: [] };
}
