/**
 * storeSot.ts — Shared Store Source-of-Truth Fetch Layer
 *
 * Single canonical set of queries for fetching product data.
 * Both Catalog (catalogFetcherV2.ts) and PDP (page.tsx) should
 * consume these functions to guarantee SOT parity.
 *
 * SOT Rules enforced:
 * 1. All queries use `adminClient` (bypasses RLS).
 * 2. SKU query JOINs `cat_colours!colour_id` and `cat_variants_vehicle`.
 * 3. Images from `primary_image` + `gallery_img_1..6` columns only.
 * 4. Pricing requires `publish_stage='PUBLISHED'`.
 * 5. No synthetic default SKUs.
 */

import { adminClient } from '@/lib/supabase/admin';
import { slugify } from '@/utils/slugs';
import { resolvePricingContext } from '@/lib/server/pricingContext';
import type {
    SotModel,
    SotVariant,
    NormalizedSku,
    SotAsset,
    SotPricingSnapshot,
    PdpSnapshotPayload,
    StoreContext,
    CatalogSnapshotRow,
    DealerDelta,
} from '@/types/storeSot';

// ─── Constants ───────────────────────────────────────────────

/** Optional rollout gate for consumers migrating to Store SOT v2 */
export function isStoreSotV2Enabled(): boolean {
    const flag = String(process.env.NEXT_PUBLIC_STORE_SOT_V2 || '')
        .trim()
        .toLowerCase();
    return flag === '1' || flag === 'true' || flag === 'on' || flag === 'yes';
}

/** Canonical SKU select string — single source for all queries */
export const SKU_SELECT = `
    id,
    name,
    slug,
    sku_type,
    price_base,
    is_primary,
    primary_image,
    gallery_img_1, gallery_img_2, gallery_img_3,
    gallery_img_4, gallery_img_5, gallery_img_6,
    color_name,
    hex_primary,
    hex_secondary,
    finish,
    colour_id,
    vehicle_variant_id,
    colour:cat_colours!colour_id(id, name, hex_primary, hex_secondary, finish),
    vehicle_variant:cat_variants_vehicle!vehicle_variant_id(id, name, slug, status)
`;

/** Canonical pricing select columns */
export const PRICE_SELECT = `
    sku_id, state_code,
    ex_showroom, ex_showroom_basic:ex_factory, ex_showroom_gst_amount:ex_factory_gst_amount, ex_showroom_total:ex_showroom, gst_rate, hsn_code,
    on_road_price,
    rto_default_type,
    rto_registration_fee_state, rto_registration_fee_bh, rto_registration_fee_company,
    rto_smartcard_charges_state, rto_smartcard_charges_bh, rto_smartcard_charges_company,
    rto_postal_charges_state, rto_postal_charges_bh, rto_postal_charges_company,
    rto_roadtax_rate_state, rto_roadtax_rate_bh, rto_roadtax_rate_company,
    rto_roadtax_amount_state, rto_roadtax_amount_bh, rto_roadtax_amount_company,
    rto_roadtaxcess_rate_state:rto_roadtax_cess_rate_state, rto_roadtaxcess_rate_bh:rto_roadtax_cess_rate_bh, rto_roadtaxcess_rate_company:rto_roadtax_cess_rate_company,
    rto_roadtaxcessamount_state:rto_roadtax_cess_amount_state, rto_roadtaxcessamount_bh:rto_roadtax_cess_amount_bh, rto_roadtaxcessamount_company:rto_roadtax_cess_amount_company,
    rto_total_state, rto_total_bh, rto_total_company,
    ins_od_base:ins_own_damage_premium_amount, ins_od_total:ins_own_damage_total_amount, ins_tp_base:ins_liability_only_premium_amount, ins_tp_total:ins_liability_only_total_amount,
    ins_sum_mandatory_insurance, ins_sum_mandatory_insurance_gst_amount, ins_total:ins_gross_premium, ins_gst_rate,
    addon_pa_amount:addon_personal_accident_cover_amount, addon_pa_gstamount:addon_personal_accident_cover_gst_amount, addon_pa_total:addon_personal_accident_cover_total_amount,
    publish_stage,
    published_at, updated_at
`;

/**
 * Extended SKU select for Catalog — includes model/brand/variant JOINs
 * and 360° display fields not needed by PDP.
 */
export const CATALOG_SKU_SELECT = `
    id,
    sku_code,
    sku_type,
    name,
    slug,
    status,
    position,
    is_primary,
    price_base,
    hex_primary,
    hex_secondary,
    color_name,
    finish,
    primary_image,
    gallery_img_1, gallery_img_2, gallery_img_3,
    gallery_img_4, gallery_img_5, gallery_img_6,
    has_360,
    zoom_factor,
    is_flipped,
    offset_x,
    offset_y,
    colour_id,
    colour:cat_colours!colour_id (
        id, name, hex_primary, hex_secondary, finish
    ),
    model:cat_models!model_id (
        id, name, slug, product_type, body_type,
        engine_cc, fuel_type, emission_standard, status,
        brand:cat_brands!brand_id (
            id, name, slug, logo_svg
        )
    ),
    vehicle_variant:cat_variants_vehicle!vehicle_variant_id (
        id, name, slug, status,
        displacement, max_power, max_torque, transmission, mileage,
        front_brake, rear_brake, braking_system,
        kerb_weight, seat_height, ground_clearance, fuel_capacity,
        console_type, bluetooth, usb_charging,
        engine_type, start_type, front_suspension, rear_suspension,
        front_tyre, rear_tyre, tyre_type,
        battery_capacity, range_km, charging_time, motor_power
    ),
    accessory_variant:cat_variants_accessory!accessory_variant_id (
        id, name, slug, status,
        material, weight, finish
    ),
    service_variant:cat_variants_service!service_variant_id (
        id, name, slug, status,
        duration_months, coverage_type, labor_included
    )
`;

/** Slimmed pricing select for Catalog listings (only needs totals) */
export const CATALOG_PRICE_SELECT =
    'sku_id, ex_showroom, on_road_price, rto_total_state, ins_total:ins_gross_premium, publish_stage, is_popular';

// ─── 1. Model Resolution ────────────────────────────────────

export async function resolveModel(makeSlug: string, modelSlug: string): Promise<SotModel | null> {
    const { data: modelRows } = await (adminClient as any)
        .from('cat_models')
        .select('id, brand_id, name, slug, brand:cat_brands!brand_id(name, slug), fuel_type, engine_cc, status')
        .eq('status', 'ACTIVE');

    const candidates = (modelRows || []).filter((m: any) => {
        const mSlug = String(m.slug || '');
        const mNameSlug = slugify(String(m.name || ''));
        const bSlug = String(m.brand?.slug || '');
        const bNameSlug = slugify(String(m.brand?.name || ''));
        const modelMatch = mSlug === modelSlug || mNameSlug === modelSlug || mSlug.endsWith(`-${modelSlug}`);
        const brandMatch = bSlug === makeSlug || bNameSlug === makeSlug || makeSlug === '';
        return modelMatch && brandMatch;
    });

    return candidates[0] || null;
}

// ─── 2. SKU Fetching ─────────────────────────────────────────

/** Normalize raw SKU rows by flattening vehicle_variant fields */
export function normalizeSkus(rawSkus: any[]): NormalizedSku[] {
    return (rawSkus || []).map((sku: any) => {
        const variant = sku.vehicle_variant;
        return {
            ...sku,
            variant_slug: variant?.slug ?? null,
            variant_name: variant?.name ?? null,
            variant_id: variant?.id ?? null,
        };
    });
}

/** Fetch all active SKUs for a model */
export async function fetchModelSkus(modelId: string): Promise<{ skus: NormalizedSku[]; error: any }> {
    const { data, error } = await (adminClient as any)
        .from('cat_skus')
        .select(SKU_SELECT)
        .eq('model_id', modelId)
        .eq('status', 'ACTIVE');

    return { skus: normalizeSkus(data), error };
}

/** Fetch active SKUs scoped to a specific vehicle variant ID */
export async function fetchVariantSkus(variantId: string): Promise<NormalizedSku[]> {
    const { data } = await (adminClient as any)
        .from('cat_skus')
        .select(SKU_SELECT)
        .eq('vehicle_variant_id', variantId)
        .eq('status', 'ACTIVE');

    return normalizeSkus(data);
}

// ─── 3. Variant Resolution ──────────────────────────────────

export async function fetchVehicleVariants(modelId: string): Promise<SotVariant[]> {
    const { data } = await (adminClient as any)
        .from('cat_variants_vehicle')
        .select('id, name, slug, status')
        .eq('model_id', modelId)
        .eq('status', 'ACTIVE');

    return data || [];
}

/** Match a variant from a set of possible slugs */
export function matchVariant(
    variants: SotVariant[],
    possibleSlugs: Set<string>,
    rawVariantSlug: string
): SotVariant | null {
    return (
        variants.find(v => {
            const slug = String(v.slug || '');
            const nameSlug = slugify(String(v.name || ''));
            return possibleSlugs.has(slug) || slug.endsWith(`-${rawVariantSlug}`) || nameSlug === rawVariantSlug;
        }) || null
    );
}

/**
 * Resolve active SKUs for a variant, using a multi-tier fallback:
 * 1. Strict variant-id match (if matchedVariant exists)
 * 2. Slug-matched SKUs
 * 3. Direct variant_id query (last resort)
 * 4. All model SKUs only when variant slug is empty
 */
export async function resolveActiveSkus(
    allModelSkus: NormalizedSku[],
    matchedVariant: SotVariant | null,
    possibleSlugs: Set<string>,
    rawVariantSlug: string
): Promise<NormalizedSku[]> {
    // Tier 1: Strict variant-id match
    let active = matchedVariant?.id
        ? allModelSkus.filter(sku => String(sku.vehicle_variant_id || '') === String(matchedVariant.id))
        : [];

    // Tier 2: Slug-based match
    if (active.length === 0) {
        const slugMatched = allModelSkus.filter(sku => {
            const slug = String(sku.variant_slug || '');
            if (!slug) return false;
            return (
                possibleSlugs.has(slug) ||
                slug.endsWith(`-${rawVariantSlug}`) ||
                slugify(String(sku.variant_name || '')) === rawVariantSlug
            );
        });
        if (slugMatched.length > 0) active = slugMatched;
    }

    // Tier 3: Direct variant_id query (last resort)
    if (active.length === 0 && matchedVariant?.id) {
        active = await fetchVariantSkus(matchedVariant.id);
    }

    // Tier 4: Safety fallback (only when variant slug is missing entirely).
    // For PDP variant routes, never widen to all model SKUs on mismatch.
    if (active.length === 0 && !rawVariantSlug) {
        active = allModelSkus;
    }

    return active;
}

// ─── 4. Pricing Fetch ────────────────────────────────────────

/**
 * Fetch PUBLISHED pricing for a set of SKU IDs.
 * Falls back from provided stateCode to 'MH'.
 * Returns the best matching price row (preferring rto_total_state > 0).
 */
export async function fetchPublishedPricing(
    skuIds: string[],
    stateCode: string
): Promise<{ priceRow: Record<string, any> | null; snapshot: SotPricingSnapshot | null }> {
    if (skuIds.length === 0) return { priceRow: null, snapshot: null };

    // Primary: specific state
    const { data: stateRows } = await (adminClient as any)
        .from('cat_price_state_mh')
        .select(PRICE_SELECT)
        .in('sku_id', skuIds)
        .eq('state_code', stateCode)
        .eq('publish_stage', 'PUBLISHED')
        .order('updated_at', { ascending: false });

    let rows: any[] | null = stateRows || null;

    // Fallback: MH
    if (!rows || rows.length === 0) {
        const { data: fallbackRows } = await (adminClient as any)
            .from('cat_price_state_mh')
            .select(PRICE_SELECT)
            .in('sku_id', skuIds)
            .eq('state_code', 'MH')
            .eq('publish_stage', 'PUBLISHED')
            .order('updated_at', { ascending: false });
        rows = fallbackRows || null;
    }

    const matchingRow = (rows || []).find((row: any) => Number(row.rto_total_state) > 0);
    const priceRow = matchingRow || (rows || [])[0] || null;

    if (!priceRow) return { priceRow: null, snapshot: null };

    const snapshot: SotPricingSnapshot = {
        vehicle_color_id: priceRow.sku_id,
        ex_showroom_price: Number(priceRow.ex_showroom) || 0,
        rto_total: Number(priceRow.rto_total_state) || 0,
        insurance_total: Number(priceRow.ins_total) || 0,
        on_road_price: Number(priceRow.on_road_price) || 0,
        rto: {
            STATE: { total: Number(priceRow.rto_total_state) },
            BH: { total: Number(priceRow.rto_total_bh) },
            COMPANY: { total: Number(priceRow.rto_total_company) },
            default: priceRow.rto_default_type || 'STATE',
        },
        insurance: {
            base_total:
                Number(priceRow.ins_total || 0) ||
                Number(priceRow.ins_sum_mandatory_insurance || 0) +
                    Number(priceRow.ins_sum_mandatory_insurance_gst_amount || 0),
            od: { total: Number(priceRow.ins_od_total) },
            tp: { total: Number(priceRow.ins_tp_total) },
            pa: Number(priceRow.addon_pa_total ?? 0),
        },
        state_code: stateCode,
        district: 'ALL',
        published_at: priceRow.published_at,
    };

    return { priceRow, snapshot };
}

// ─── 5. Color Config Builder ─────────────────────────────────

/** Build gallery assets from primary_image + gallery_img_* columns */
export function buildGalleryAssets(sku: any): SotAsset[] {
    const urls = [
        sku.primary_image,
        sku.gallery_img_1,
        sku.gallery_img_2,
        sku.gallery_img_3,
        sku.gallery_img_4,
        sku.gallery_img_5,
        sku.gallery_img_6,
    ].filter(Boolean);

    return urls.map((url: string, i: number) => ({
        id: `${sku.id}-img-${i}`,
        type: 'IMAGE' as const,
        url,
        is_primary: i === 0,
        position: i,
    }));
}

/** Resolve color name/hex from colour JOIN with SKU fallbacks */
export function resolveColorMeta(sku: any): {
    name: string;
    hex_primary: string;
    hex_secondary: string | null;
    finish: string | null;
} {
    return {
        name: sku.colour?.name ?? sku.color_name ?? sku.name ?? 'Standard',
        hex_primary: sku.colour?.hex_primary ?? sku.hex_primary ?? '#000000',
        hex_secondary: sku.colour?.hex_secondary ?? sku.hex_secondary ?? null,
        finish: sku.colour?.finish ?? sku.finish ?? null,
    };
}

// ─── 6. Store Context ────────────────────────────────────────

export async function resolveStoreContext(input: {
    leadId?: string | null;
    dealerId?: string | null;
    district?: string | null;
    state?: string | null;
    studio?: string | null;
}): Promise<StoreContext> {
    return resolvePricingContext(input);
}

// ─── 7. PDP Snapshot (single SOT payload) ───────────────────

export async function getPdpSnapshot({
    make,
    model,
    variant,
    stateCode,
}: {
    make: string;
    model: string;
    variant: string;
    stateCode: string;
}): Promise<PdpSnapshotPayload> {
    const modelRow = await resolveModel(make, model);
    if (!modelRow?.id) {
        return {
            model: null,
            variant: null,
            skus: [],
            pricing: null,
            pricingRow: null,
            resolvedVariant: null,
            possibleVariantSlugs: new Set(),
        };
    }

    const { skus: allModelSkus } = await fetchModelSkus(modelRow.id);
    const possibleVariantSlugs = new Set([variant, `${model}-${variant}`, `${make}-${model}-${variant}`]);
    const variants = await fetchVehicleVariants(modelRow.id);
    const matchedVariant = matchVariant(variants, possibleVariantSlugs, variant);
    const activeSkus = await resolveActiveSkus(allModelSkus, matchedVariant, possibleVariantSlugs, variant);

    const variantSeed = activeSkus[0] || null;
    const resolvedVariant =
        variantSeed || matchedVariant
            ? {
                  id: String(variantSeed?.variant_id || matchedVariant?.id || ''),
                  name: String(variantSeed?.variant_name || matchedVariant?.name || ''),
                  slug: String(
                      variantSeed?.variant_slug || matchedVariant?.slug || slugify(String(matchedVariant?.name || ''))
                  ),
                  price_base: Number(variantSeed?.price_base || 0),
                  specs: {
                      fuel_type: modelRow?.fuel_type,
                      engine_cc: modelRow?.engine_cc,
                  },
                  brand: {
                      name: modelRow?.brand?.name || make,
                      slug: modelRow?.brand?.slug || slugify(make),
                  },
                  parent: {
                      name: modelRow?.name || model,
                      slug: modelRow?.slug || model,
                  },
              }
            : null;

    const skuIds = activeSkus.map(s => s.id).filter(Boolean);
    const { priceRow, snapshot } = await fetchPublishedPricing(skuIds, stateCode);

    return {
        model: modelRow,
        variant: matchedVariant,
        skus: activeSkus,
        pricing: snapshot,
        pricingRow: priceRow,
        resolvedVariant,
        possibleVariantSlugs,
    };
}

// ─── 8. Dealer Delta ─────────────────────────────────────────

export async function getDealerDelta({
    dealerId,
    stateCode,
    skuIds,
    accessoryIds,
}: {
    dealerId: string | null;
    stateCode: string;
    skuIds: string[];
    accessoryIds?: string[];
}): Promise<DealerDelta> {
    if (!dealerId) {
        return { vehicleOffers: {}, bundleSkuIds: [], accessoryRules: {} };
    }

    const [vehicleRulesRes, bundleRulesRes, accessoryRulesRes] = await Promise.all([
        skuIds.length > 0
            ? (adminClient as any)
                  .from('cat_price_dealer')
                  .select('vehicle_color_id, offer_amount')
                  .in('vehicle_color_id', skuIds)
                  .eq('tenant_id', dealerId)
                  .eq('state_code', stateCode)
                  .eq('is_active', true)
            : Promise.resolve({ data: [] }),
        (adminClient as any)
            .from('cat_price_dealer')
            .select('vehicle_color_id')
            .eq('tenant_id', dealerId)
            .eq('state_code', stateCode)
            .eq('inclusion_type', 'BUNDLE'),
        accessoryIds && accessoryIds.length > 0
            ? (adminClient as any)
                  .from('cat_price_dealer')
                  .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
                  .in('vehicle_color_id', accessoryIds)
                  .eq('tenant_id', dealerId)
                  .eq('state_code', stateCode)
            : Promise.resolve({ data: [] }),
    ]);

    const vehicleOffers: Record<string, number> = {};
    (vehicleRulesRes.data || []).forEach((r: any) => {
        if (r?.vehicle_color_id) {
            vehicleOffers[r.vehicle_color_id] = Number(r.offer_amount || 0);
        }
    });

    const bundleSkuIds = (bundleRulesRes.data || []).map((r: any) => String(r?.vehicle_color_id || '')).filter(Boolean);

    const accessoryRules: DealerDelta['accessoryRules'] = {};
    (accessoryRulesRes.data || []).forEach((r: any) => {
        if (!r?.vehicle_color_id) return;
        accessoryRules[r.vehicle_color_id] = {
            offer: Number(r.offer_amount || 0),
            inclusion: String(r.inclusion_type || 'OPTIONAL'),
            isActive: Boolean(r.is_active),
        };
    });

    return {
        vehicleOffers,
        bundleSkuIds,
        accessoryRules,
    };
}

// ─── 9. Catalog Snapshot ─────────────────────────────────────

export async function getCatalogSnapshot(stateCode: string = 'MH'): Promise<CatalogSnapshotRow[]> {
    const { data: skus, error } = await (adminClient as any)
        .from('cat_skus')
        .select(
            `
            id,
            sku_code,
            sku_type,
            name,
            slug,
            status,
            position,
            is_primary,
            price_base,
            hex_primary,
            hex_secondary,
            color_name,
            finish,
            primary_image,
            gallery_img_1,
            gallery_img_2,
            gallery_img_3,
            gallery_img_4,
            gallery_img_5,
            gallery_img_6,
            has_360,
            zoom_factor,
            is_flipped,
            offset_x,
            offset_y,
            colour_id,
            colour:cat_colours!colour_id (
                id,
                name,
                hex_primary,
                hex_secondary,
                finish
            ),
            model:cat_models!model_id (
                id,
                name,
                slug,
                product_type,
                body_type,
                engine_cc,
                fuel_type,
                emission_standard,
                status,
                brand:cat_brands!brand_id (
                    id,
                    name,
                    slug,
                    logo_svg
                )
            ),
            vehicle_variant:cat_variants_vehicle!vehicle_variant_id (
                id, name, slug, status,
                displacement, max_power, max_torque, transmission, mileage,
                front_brake, rear_brake, braking_system,
                kerb_weight, seat_height, ground_clearance, fuel_capacity,
                console_type, bluetooth, usb_charging,
                engine_type, start_type, front_suspension, rear_suspension,
                front_tyre, rear_tyre, tyre_type,
                battery_capacity, range_km, charging_time, motor_power
            ),
            accessory_variant:cat_variants_accessory!accessory_variant_id (
                id, name, slug, status,
                material, weight, finish
            ),
            service_variant:cat_variants_service!service_variant_id (
                id, name, slug, status,
                duration_months, coverage_type, labor_included
            )
        `
        )
        .eq('status', 'ACTIVE')
        .order('position');

    if (error || !skus || skus.length === 0) {
        if (error) {
            console.error('[StoreSot:getCatalogSnapshot] Error:', error.message);
        }
        return [];
    }

    const skuIds = skus.map((s: any) => s.id);
    const { data: pricing } = await (adminClient as any)
        .from('cat_price_state_mh')
        .select(
            'sku_id, ex_showroom, on_road_price, rto_total_state, ins_total:ins_gross_premium, publish_stage, is_popular'
        )
        .in('sku_id', skuIds)
        .eq('state_code', stateCode)
        .eq('publish_stage', 'PUBLISHED');

    const pricingMap = new Map<string, any>((pricing || []).map((p: any) => [p.sku_id, p]));

    return skus.map((sku: any) => {
        const model = sku.model;
        const brand = model?.brand;
        const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant;
        const price = pricingMap.get(sku.id);

        return {
            sku_id: sku.id,
            sku_code: sku.sku_code,
            sku_type: sku.sku_type,
            sku_name: sku.name,
            sku_slug: sku.slug,
            sku_status: sku.status,
            sku_position: sku.position,
            is_primary: sku.is_primary,
            price_base: sku.price_base,
            hex_primary: sku.colour?.hex_primary ?? sku.hex_primary,
            hex_secondary: sku.colour?.hex_secondary ?? sku.hex_secondary,
            color_name: sku.colour?.name ?? sku.color_name,
            finish: sku.colour?.finish ?? sku.finish,
            primary_image: sku.primary_image,
            gallery_img_1: sku.gallery_img_1,
            gallery_img_2: sku.gallery_img_2,
            gallery_img_3: sku.gallery_img_3,
            gallery_img_4: sku.gallery_img_4,
            gallery_img_5: sku.gallery_img_5,
            gallery_img_6: sku.gallery_img_6,
            has_360: sku.has_360,
            zoom_factor: sku.zoom_factor,
            is_flipped: sku.is_flipped,
            offset_x: sku.offset_x,
            offset_y: sku.offset_y,
            model_id: model?.id,
            model_name: model?.name,
            model_slug: model?.slug,
            product_type: model?.product_type,
            body_type: model?.body_type,
            engine_cc: model?.engine_cc,
            fuel_type: model?.fuel_type,
            emission_standard: model?.emission_standard,
            model_status: model?.status,
            brand_id: brand?.id,
            brand_name: brand?.name,
            brand_slug: brand?.slug,
            logo_svg: brand?.logo_svg,
            variant_id: variant?.id,
            variant_name: variant?.name,
            variant_slug: variant?.slug,
            variant_status: variant?.status,
            displacement: variant?.displacement ?? null,
            max_power: variant?.max_power ?? null,
            max_torque: variant?.max_torque ?? null,
            transmission: variant?.transmission ?? null,
            mileage: variant?.mileage ?? null,
            front_brake: variant?.front_brake ?? null,
            rear_brake: variant?.rear_brake ?? null,
            braking_system: variant?.braking_system ?? null,
            kerb_weight: variant?.kerb_weight ?? null,
            seat_height: variant?.seat_height ?? null,
            ground_clearance: variant?.ground_clearance ?? null,
            fuel_capacity: variant?.fuel_capacity ?? null,
            console_type: variant?.console_type ?? null,
            bluetooth: variant?.bluetooth ?? null,
            usb_charging: variant?.usb_charging ?? null,
            ex_showroom: price?.ex_showroom ?? null,
            on_road_price: price?.on_road_price ?? null,
            rto_state_total: price?.rto_total_state ?? null,
            ins_total: price?.ins_total ?? null,
            publish_stage: price?.publish_stage ?? null,
            is_popular: price?.is_popular ?? null,
        } as CatalogSnapshotRow;
    });
}
