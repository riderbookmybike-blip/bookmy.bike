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

/** Flatten variant-level spec columns into a flat Record for product.specs */
const VARIANT_STRUCTURAL_KEYS = new Set(['id', 'name', 'slug', 'status']);
export function flattenVariantSpecs(variant: Record<string, any>): Record<string, any> {
    const specs: Record<string, any> = {};
    for (const [key, value] of Object.entries(variant)) {
        if (VARIANT_STRUCTURAL_KEYS.has(key)) continue;
        if (value === null || value === undefined || value === '') continue;
        specs[key] = value;
    }
    return specs;
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
    colour:cat_colours!colour_id(id, name, hex_primary, hex_secondary, finish, primary_image, media_shared),
    vehicle_variant:cat_variants_vehicle!vehicle_variant_id(
        id, name, slug, status,
        displacement, max_power, max_torque, transmission, mileage_arai,
        front_brake, rear_brake, braking_system,
        kerb_weight, seat_height, ground_clearance, fuel_capacity, wheelbase,
        console_type, bluetooth, usb_charging, navigation,
        engine_type, start_type, num_valves,
        front_suspension, rear_suspension,
        front_tyre, rear_tyre, tyre_type,
        led_headlamp, led_tail_lamp, ride_modes,
        battery_capacity, range_km, charging_time, motor_power,
        cooling_system, cylinders, bore_stroke, compression_ratio, top_speed,
        clutch, overall_length, overall_width, overall_height, chassis_type,
        wheel_type, front_wheel_size, rear_wheel_size,
        headlamp_type, speedometer, tripmeter, clock,
        low_fuel_indicator, low_oil_indicator, low_battery_indicator,
        pillion_seat, pillion_footrest, stand_alarm, pass_light, killswitch,
        warranty_years, warranty_km, service_interval,
        primary_image, media_shared
    )
`;

/** Canonical pricing select columns */
export const PRICE_SELECT = '*';

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
        id, name, hex_primary, hex_secondary, finish, primary_image, media_shared
    ),
    model:cat_models!model_id (
        id, name, slug, product_type, body_type, segment,
        engine_cc, fuel_type, emission_standard, status,
        primary_image, media_shared,
        brand:cat_brands!brand_id (
            id, name, slug, logo_svg
        )
    ),
    vehicle_variant:cat_variants_vehicle!vehicle_variant_id (
        id, name, slug, status,
        displacement, max_power, max_torque, transmission, mileage_arai,
        front_brake, rear_brake, braking_system,
        kerb_weight, seat_height, ground_clearance, fuel_capacity, wheelbase,
        console_type, bluetooth, usb_charging, navigation,
        engine_type, start_type, num_valves,
        front_suspension, rear_suspension,
        front_tyre, rear_tyre, tyre_type,
        led_headlamp, led_tail_lamp, ride_modes,
        battery_capacity, range_km, charging_time, motor_power,
        cooling_system, cylinders, bore_stroke, compression_ratio, top_speed,
        clutch, overall_length, overall_width, overall_height, chassis_type,
        wheel_type, front_wheel_size, rear_wheel_size,
        headlamp_type, speedometer, tripmeter, clock,
        low_fuel_indicator, low_oil_indicator, low_battery_indicator,
        pillion_seat, pillion_footrest, stand_alarm, pass_light, killswitch,
        warranty_years, warranty_km, service_interval,
        primary_image, media_shared
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

const RTO_SUFFIX_BY_TYPE = {
    STATE: 'state',
    BH: 'bh',
    COMPANY: 'company',
} as const;

const VALID_RTO_TYPES = new Set(['STATE', 'BH', 'COMPANY']);

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toCamelCase = (value: string) =>
    value.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');

const normalizeRtoBaseKey = (base: string) => {
    let normalized = base;

    // Normalize historical naming differences.
    normalized = normalized.replace(/^roadtax_/, 'road_tax_');
    normalized = normalized.replace(/^roadtax$/, 'road_tax');
    normalized = normalized.replace(/^road_tax_cess_/, 'cess_');

    return normalized;
};

type RtoTypePayload = {
    total: number;
    fees: Record<string, number>;
    tax: Record<string, number>;
    registrationCharges?: number;
    smartCardCharges?: number;
    postalCharges?: number;
    hypothecationCharges?: number;
    roadTax?: number;
    roadTaxRate?: number;
    cessAmount?: number;
    cessRate?: number;
};

const enrichRtoCompatibilityFields = (payload: RtoTypePayload, key: string, amount: number) => {
    if (key === 'registration_fee') payload.registrationCharges = amount;
    if (key === 'smartcard_charges') payload.smartCardCharges = amount;
    if (key === 'postal_charges') payload.postalCharges = amount;
    if (key === 'hypothecation_charges') payload.hypothecationCharges = amount;
    if (key === 'road_tax_amount') payload.roadTax = amount;
    if (key === 'road_tax_rate') payload.roadTaxRate = amount;
    if (key === 'cess_amount') payload.cessAmount = amount;
    if (key === 'cess_rate') payload.cessRate = amount;
};

const buildRtoTypePayload = (row: Record<string, any>, type: keyof typeof RTO_SUFFIX_BY_TYPE): RtoTypePayload => {
    const suffix = RTO_SUFFIX_BY_TYPE[type];
    const payload: RtoTypePayload = {
        total: toNumber(row[`rto_total_${suffix}`]),
        fees: {},
        tax: {},
    };

    Object.entries(row).forEach(([rawKey, rawValue]) => {
        if (!rawKey.startsWith('rto_')) return;
        if (!rawKey.endsWith(`_${suffix}`)) return;

        const baseRaw = rawKey.slice(4, rawKey.length - `_${suffix}`.length);
        if (baseRaw === 'total' || baseRaw === 'default_type') return;

        const amount = toNumber(rawValue);
        if (amount <= 0) return;

        const base = normalizeRtoBaseKey(baseRaw);
        const camel = toCamelCase(base);
        const isTax = base.includes('tax') || base.includes('cess');
        const target = isTax ? payload.tax : payload.fees;

        target[camel] = amount;
        enrichRtoCompatibilityFields(payload, base, amount);
    });

    return payload;
};

const addonLabelFromKey = (key: string) =>
    key
        .split('_')
        .map(part => {
            if (part === 'pa') return 'PA';
            if (part === 'rsa') return 'RSA';
            return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(' ');

const normalizeAddonBaseKey = (key: string) => {
    const normalized = String(key || '')
        .trim()
        .toLowerCase();
    if (!normalized) return '';
    // Legacy alias columns that represent owner-driver personal accident cover.
    if (/^pa(_cover)?$/.test(normalized) || normalized === 'personal_accident') {
        return 'personal_accident_cover';
    }
    return normalized;
};

const buildInsuranceAddons = (row: Record<string, any>) => {
    const addonBaseKeys = Object.keys(row)
        .filter(key => key.startsWith('addon_') && key.endsWith('_total_amount'))
        .map(key => key.slice('addon_'.length, -'_total_amount'.length));

    const parsedAddons = addonBaseKeys
        .map(baseKey => {
            const canonicalBaseKey = normalizeAddonBaseKey(baseKey);
            const total = toNumber(row[`addon_${baseKey}_total_amount`]);
            const price = toNumber(row[`addon_${baseKey}_amount`]);
            const gst = toNumber(row[`addon_${baseKey}_gst_amount`]);
            const defaultRaw = row[`addon_${baseKey}_default`];
            const isDefault =
                defaultRaw === true ||
                defaultRaw === 'true' ||
                defaultRaw === 1 ||
                defaultRaw === '1' ||
                defaultRaw === 't';

            if (total <= 0 && price <= 0 && gst <= 0) return null;

            return {
                rawBaseKey: String(baseKey || ''),
                canonicalBaseKey,
                price,
                gst,
                total,
                default: isDefault,
            };
        })
        .filter(Boolean) as {
        rawBaseKey: string;
        canonicalBaseKey: string;
        price: number;
        gst: number;
        total: number;
        default: boolean;
    }[];

    const deduped = new Map<
        string,
        {
            rawBaseKey: string;
            canonicalBaseKey: string;
            price: number;
            gst: number;
            total: number;
            default: boolean;
        }
    >();

    for (const addon of parsedAddons) {
        const existing = deduped.get(addon.canonicalBaseKey);
        if (!existing) {
            deduped.set(addon.canonicalBaseKey, addon);
            continue;
        }

        const existingIsLegacyPaAlias = /^pa(_cover)?$/.test(existing.rawBaseKey);
        const candidateIsLegacyPaAlias = /^pa(_cover)?$/.test(addon.rawBaseKey);
        const shouldReplace =
            (existingIsLegacyPaAlias && !candidateIsLegacyPaAlias) ||
            (!existing.default && addon.default) ||
            addon.total > existing.total;

        if (shouldReplace) {
            deduped.set(addon.canonicalBaseKey, addon);
        }
    }

    return Array.from(deduped.values()).map(addon => ({
        id: addon.canonicalBaseKey,
        label: addonLabelFromKey(addon.canonicalBaseKey),
        price: addon.price,
        gst: addon.gst,
        total: addon.total,
        default: addon.default,
    }));
};

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

    const matchingRow = (rows || []).find((row: any) => toNumber(row.rto_total_state) > 0);
    const priceRow = matchingRow || (rows || [])[0] || null;

    if (!priceRow) return { priceRow: null, snapshot: null };

    const defaultRtoTypeRaw = String(priceRow.rto_default_type || 'STATE').toUpperCase();
    const defaultRtoType = VALID_RTO_TYPES.has(defaultRtoTypeRaw) ? defaultRtoTypeRaw : 'STATE';
    const rtoByType = {
        STATE: buildRtoTypePayload(priceRow, 'STATE'),
        BH: buildRtoTypePayload(priceRow, 'BH'),
        COMPANY: buildRtoTypePayload(priceRow, 'COMPANY'),
    };
    const addons = buildInsuranceAddons(priceRow);

    const odTotal = toNumber(priceRow.ins_own_damage_total_amount || priceRow.ins_own_damage_premium_amount);
    const tpTotal = toNumber(priceRow.ins_liability_only_total_amount || priceRow.ins_liability_only_premium_amount);
    const grossInsurance =
        toNumber(priceRow.ins_gross_premium) ||
        toNumber(priceRow.ins_sum_mandatory_insurance) + toNumber(priceRow.ins_sum_mandatory_insurance_gst_amount);

    const selectedRtoTotal = rtoByType[defaultRtoType as keyof typeof rtoByType]?.total || rtoByType.STATE.total || 0;
    const onRoadPrice =
        toNumber(priceRow.on_road_price) || toNumber(priceRow.ex_showroom) + selectedRtoTotal + grossInsurance;

    const snapshot: SotPricingSnapshot = {
        vehicle_color_id: priceRow.sku_id,
        ex_showroom_price: toNumber(priceRow.ex_showroom),
        rto_total: selectedRtoTotal,
        insurance_total: grossInsurance,
        on_road_price: onRoadPrice,
        rto: {
            STATE: rtoByType.STATE,
            BH: rtoByType.BH,
            COMPANY: rtoByType.COMPANY,
            default: defaultRtoType,
        },
        insurance: {
            base_total: grossInsurance,
            od: {
                total: odTotal,
                base: toNumber(priceRow.ins_own_damage_premium_amount),
                gst: toNumber(priceRow.ins_own_damage_gst_amount),
            },
            tp: {
                total: tpTotal,
                base: toNumber(priceRow.ins_liability_only_premium_amount),
                gst: toNumber(priceRow.ins_liability_only_gst_amount),
            },
            pa: toNumber(priceRow.addon_personal_accident_cover_total_amount),
            addons,
            gst_rate: toNumber(priceRow.ins_gst_rate || 18),
        },
        state_code: String(priceRow.state_code || stateCode || 'MH'),
        district: 'ALL',
        published_at: priceRow.published_at,
    };

    return { priceRow, snapshot };
}

// ─── 5. Color Config Builder ─────────────────────────────────

/** Build gallery assets from primary_image + gallery_img_* columns.
 *  Falls back through hierarchy: SKU → Colour → Variant → Model (if media_shared). */
export function buildGalleryAssets(sku: any): SotAsset[] {
    let urls = [
        sku.primary_image,
        sku.gallery_img_1,
        sku.gallery_img_2,
        sku.gallery_img_3,
        sku.gallery_img_4,
        sku.gallery_img_5,
        sku.gallery_img_6,
    ].filter(Boolean);

    // If SKU has no images, fall back through hierarchy
    if (urls.length === 0) {
        const colour = sku.colour;
        if (colour?.primary_image && colour.media_shared) {
            urls = [colour.primary_image];
        } else {
            const variant = sku.vehicle_variant;
            if (variant?.primary_image && variant.media_shared) {
                urls = [variant.primary_image];
            } else {
                const model = sku.model;
                if (model?.primary_image && model.media_shared) {
                    urls = [model.primary_image];
                }
            }
        }
    }

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
                      // NOTE: engine_cc removed — displacement from cat_variants_vehicle is the SOT
                      // Flatten variant-level spec columns from the vehicle_variant JOIN
                      ...(variantSeed?.vehicle_variant ? flattenVariantSpecs(variantSeed.vehicle_variant) : {}),
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
                finish,
                primary_image
            ),
            model:cat_models!model_id (
                id,
                name,
                slug,
                product_type,
                body_type,
                segment,
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
                displacement, max_power, max_torque, transmission, mileage_arai,
                front_brake, rear_brake, braking_system,
                kerb_weight, seat_height, ground_clearance, fuel_capacity, wheelbase,
                console_type, bluetooth, usb_charging, navigation,
                engine_type, start_type, num_valves,
                front_suspension, rear_suspension,
                front_tyre, rear_tyre, tyre_type,
                led_headlamp, led_tail_lamp, ride_modes,
                battery_capacity, range_km, charging_time, motor_power,
                cooling_system, cylinders, bore_stroke, compression_ratio, top_speed,
                clutch, overall_length, overall_width, overall_height, chassis_type,
                wheel_type, front_wheel_size, rear_wheel_size,
                headlamp_type, speedometer, tripmeter, clock,
                low_fuel_indicator, low_oil_indicator, low_battery_indicator,
                pillion_seat, pillion_footrest, stand_alarm, pass_light, killswitch,
                warranty_years, warranty_km, service_interval
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

    // Filter to VEHICLE-type products only — exclude accessories & services from catalog
    const vehicleSkus = skus.filter((s: any) => {
        const productType = String(s.model?.product_type || '').toUpperCase();
        return productType === 'VEHICLE' || productType === '';
    });

    const skuIds = vehicleSkus.map((s: any) => s.id);
    const { data: pricing } = await (adminClient as any)
        .from('cat_price_state_mh')
        .select(
            'sku_id, ex_showroom, on_road_price, rto_total_state, ins_total:ins_gross_premium, publish_stage, is_popular'
        )
        .in('sku_id', skuIds)
        .eq('state_code', stateCode)
        .eq('publish_stage', 'PUBLISHED');

    const pricingMap = new Map<string, any>((pricing || []).map((p: any) => [p.sku_id, p]));

    return vehicleSkus.map((sku: any) => {
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
            segment: model?.segment ?? null,
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
            mileage_arai: variant?.mileage_arai ?? null,
            warranty_years: variant?.warranty_years ?? null,
            warranty_km: variant?.warranty_km ?? null,
            service_interval: variant?.service_interval ?? null,
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
            engine_type: variant?.engine_type ?? null,
            start_type: variant?.start_type ?? null,
            front_suspension: variant?.front_suspension ?? null,
            rear_suspension: variant?.rear_suspension ?? null,
            front_tyre: variant?.front_tyre ?? null,
            rear_tyre: variant?.rear_tyre ?? null,
            tyre_type: variant?.tyre_type ?? null,
            led_headlamp: variant?.led_headlamp ?? null,
            led_tail_lamp: variant?.led_tail_lamp ?? null,
            navigation: variant?.navigation ?? null,
            ride_modes: variant?.ride_modes ?? null,
            num_valves: variant?.num_valves ?? null,
            wheelbase: variant?.wheelbase ?? null,
            // New BikeWale-level columns
            cooling_system: variant?.cooling_system ?? null,
            cylinders: variant?.cylinders ?? null,
            bore_stroke: variant?.bore_stroke ?? null,
            compression_ratio: variant?.compression_ratio ?? null,
            top_speed: variant?.top_speed ?? null,
            clutch: variant?.clutch ?? null,
            overall_length: variant?.overall_length ?? null,
            overall_width: variant?.overall_width ?? null,
            overall_height: variant?.overall_height ?? null,
            chassis_type: variant?.chassis_type ?? null,
            wheel_type: variant?.wheel_type ?? null,
            front_wheel_size: variant?.front_wheel_size ?? null,
            rear_wheel_size: variant?.rear_wheel_size ?? null,
            headlamp_type: variant?.headlamp_type ?? null,
            speedometer: variant?.speedometer ?? null,
            tripmeter: variant?.tripmeter ?? null,
            clock: variant?.clock ?? null,
            low_fuel_indicator: variant?.low_fuel_indicator ?? null,
            low_oil_indicator: variant?.low_oil_indicator ?? null,
            low_battery_indicator: variant?.low_battery_indicator ?? null,
            pillion_seat: variant?.pillion_seat ?? null,
            pillion_footrest: variant?.pillion_footrest ?? null,
            stand_alarm: variant?.stand_alarm ?? null,
            pass_light: variant?.pass_light ?? null,
            killswitch: variant?.killswitch ?? null,
            ex_showroom: price?.ex_showroom ?? null,
            on_road_price: price?.on_road_price ?? null,
            rto_state_total: price?.rto_total_state ?? null,
            ins_total: price?.ins_total ?? null,
            publish_stage: price?.publish_stage ?? null,
            is_popular: price?.is_popular ?? null,
        } as CatalogSnapshotRow;
    });
}
