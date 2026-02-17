/**
 * catalogFetcherV2.ts — V2 Catalog Fetcher
 *
 * Reads from normalized V2 tables (cat_models, cat_variants_*, cat_skus, cat_price_state_mh)
 * using proper relational JOINs. No JSONB unpacking needed.
 *
 * This replaces the legacy V1 hierarchy reconstruction flow.
 */

import { withCache } from '../cache/cache';
import { CACHE_TAGS } from '../cache/tags';
import { adminClient } from '../supabase/admin';
import type { ProductVariant, VehicleSpecifications } from '@/types/productMaster';

// ============================================================
// Core Fetcher — Relational JOINs
// ============================================================

interface RawProductRow {
    // From cat_skus
    sku_id: string;
    sku_code: string | null;
    sku_type: string;
    sku_name: string;
    sku_slug: string;
    sku_status: string;
    sku_position: number;
    is_primary: boolean;
    price_base: number | null;
    hex_primary: string | null;
    hex_secondary: string | null;
    color_name: string | null;
    finish: string | null;
    primary_image: string | null;
    gallery_img_1: string | null;
    gallery_img_2: string | null;
    gallery_img_3: string | null;
    gallery_img_4: string | null;
    gallery_img_5: string | null;
    gallery_img_6: string | null;
    has_360: boolean;
    zoom_factor: number | null;
    is_flipped: boolean;
    offset_x: number | null;
    offset_y: number | null;
    // From cat_models
    model_id: string;
    model_name: string;
    model_slug: string;
    product_type: string;
    body_type: string | null;
    engine_cc: number | null;
    fuel_type: string | null;
    emission_standard: string | null;
    model_status: string;
    // From cat_brands
    brand_id: string;
    brand_name: string;
    brand_slug: string | null;
    logo_svg: string | null;
    // From variant (joined separately)
    variant_id: string;
    variant_name: string;
    variant_slug: string;
    variant_status: string;
    // Vehicle variant specs (nullable — only for VEHICLE type)
    displacement: string | null;
    max_power: string | null;
    max_torque: string | null;
    transmission: string | null;
    mileage: string | null;
    front_brake: string | null;
    rear_brake: string | null;
    braking_system: string | null;
    kerb_weight: string | null;
    seat_height: string | null;
    ground_clearance: string | null;
    fuel_capacity: string | null;
    console_type: string | null;
    bluetooth: boolean | null;
    usb_charging: boolean | null;
    // Pricing (from cat_price_state_mh)
    ex_showroom: number | null;
    on_road_price: number | null;
    rto_state_total: number | null;
    ins_total: number | null;
    publish_stage: string | null;
    is_popular: boolean | null;
    visit_count: number;
}

async function fetchVariantVisitCounts(days: number = 30): Promise<Map<string, number>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await adminClient
        .from('analytics_events')
        .select('page_path')
        .eq('event_type', 'PAGE_VIEW')
        .gte('created_at', since)
        .like('page_path', '/store/%/%/%')
        .limit(20000);

    if (error || !data) {
        if (error) {
            console.warn('[CatalogV2Fetch] Visit count fetch failed:', error.message);
        }
        return new Map();
    }

    const counts = new Map<string, number>();
    for (const row of data as Array<{ page_path: string | null }>) {
        const path = (row.page_path || '').split('?')[0].trim().toLowerCase();
        const parts = path.split('/').filter(Boolean);
        if (parts.length < 4 || parts[0] !== 'store') continue;
        const modelSlug = parts[2];
        const variantSlug = parts[3];
        if (!modelSlug || !variantSlug) continue;
        const key = `${modelSlug}::${variantSlug}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return counts;
}

/**
 * Fetch full catalog using a database view/function that JOINs all V2 tables.
 * Falls back to manual multi-query if view doesn't exist yet.
 */
async function fetchCatalogV2Raw(stateCode: string = 'MH'): Promise<RawProductRow[]> {
    // Strategy: Query cat_skus with embedded joins to models, brands, variants, pricing
    // Since Supabase PostgREST supports foreign key joins, we use nested selects

    const { data: skus, error } = await adminClient
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

    if (error) {
        console.error('[CatalogV2Fetch] Error:', error.message);
        return [];
    }

    if (!skus || skus.length === 0) {
        console.debug('[CatalogV2Fetch] No active SKUs found');
        return [];
    }

    // Fetch pricing for these SKUs
    const skuIds = skus.map((s: any) => s.id);
    const [{ data: pricing }, visitCounts] = await Promise.all([
        adminClient
            .from('cat_price_state_mh')
            .select(
                'sku_id, ex_showroom, on_road_price, rto_total_state, ins_total:ins_gross_premium, publish_stage, is_popular'
            )
            .in('sku_id', skuIds)
            .eq('state_code', stateCode)
            .eq('publish_stage', 'PUBLISHED'),
        fetchVariantVisitCounts(30),
    ]);

    const pricingMap = new Map((pricing || []).map((p: any) => [p.sku_id, p]));

    // Flatten into RawProductRow array
    return skus.map((sku: any) => {
        const model = sku.model;
        const brand = model?.brand;
        const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant;
        const price = pricingMap.get(sku.id);
        const visitKey = `${(model?.slug || '').toLowerCase()}::${(variant?.slug || '').toLowerCase()}`;
        const visitCount = visitCounts.get(visitKey) || 0;

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
            // Model
            model_id: model?.id,
            model_name: model?.name,
            model_slug: model?.slug,
            product_type: model?.product_type,
            body_type: model?.body_type,
            engine_cc: model?.engine_cc,
            fuel_type: model?.fuel_type,
            emission_standard: model?.emission_standard,
            model_status: model?.status,
            // Brand
            brand_id: brand?.id,
            brand_name: brand?.name,
            brand_slug: brand?.slug,
            logo_svg: brand?.logo_svg,
            // Variant
            variant_id: variant?.id,
            variant_name: variant?.name,
            variant_slug: variant?.slug,
            variant_status: variant?.status,
            // Vehicle specs (may be null for non-vehicle)
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
            // Pricing
            ex_showroom: price?.ex_showroom ?? null,
            on_road_price: price?.on_road_price ?? null,
            rto_state_total: price?.rto_total_state ?? null,
            ins_total: price?.ins_total ?? null,
            publish_stage: price?.publish_stage ?? null,
            is_popular: price?.is_popular ?? null,
            visit_count: visitCount,
        } as RawProductRow;
    });
}

// ============================================================
// Mapper — RawProductRow[] → ProductVariant[]
// ============================================================

function mapV2ToProductVariants(rows: RawProductRow[]): ProductVariant[] {
    // Group by model_id + variant_id (same as V1 "family + variant")
    const variantGroups = new Map<
        string,
        {
            model: RawProductRow;
            skus: RawProductRow[];
        }
    >();

    for (const row of rows) {
        const key = `${row.model_id}::${row.variant_id}`;
        if (!variantGroups.has(key)) {
            variantGroups.set(key, { model: row, skus: [] });
        }
        variantGroups.get(key)!.skus.push(row);
    }

    const result: ProductVariant[] = [];

    for (const [, group] of variantGroups) {
        const { model: m, skus } = group;

        // Find primary SKU (or first with image)
        const primarySku = skus.find(s => s.is_primary) || skus.find(s => s.primary_image) || skus[0];
        if (!primarySku) continue;

        // Build available colors from all SKUs in this variant
        const availableColors = skus
            .filter(s => s.hex_primary || s.color_name)
            .map(s => ({
                id: s.sku_id,
                name: s.color_name || s.sku_name || 'Default',
                hexCode: s.hex_primary || '#000000',
                imageUrl: s.primary_image || undefined,
                zoomFactor: s.zoom_factor ?? undefined,
                isFlipped: s.is_flipped || undefined,
                offsetX: s.offset_x ?? undefined,
                offsetY: s.offset_y ?? undefined,
                finish: s.finish || undefined,
            }));

        // Build specifications from variant data
        const specifications: VehicleSpecifications = {
            engine: {
                displacement: m.displacement || undefined,
                maxPower: m.max_power || undefined,
                maxTorque: m.max_torque || undefined,
            },
            transmission: {
                type: m.transmission || 'N/A',
            },
            dimensions: {
                seatHeight: m.seat_height || undefined,
                kerbWeight: m.kerb_weight || undefined,
                curbWeight: m.kerb_weight || undefined,
                fuelCapacity: m.fuel_capacity || undefined,
            },
            features: {
                bluetooth: m.bluetooth ?? undefined,
                abs: m.braking_system || undefined,
            },
        };

        // Build price from cat_price_state_mh
        const exShowroom = primarySku.ex_showroom ?? primarySku.price_base ?? 0;
        const onRoad = primarySku.on_road_price ?? exShowroom;

        // Determine displacement + powerUnit
        const displacement = m.engine_cc ?? undefined;
        const isEV = m.fuel_type === 'EV';

        const variant: ProductVariant = {
            id: primarySku.sku_id,
            type: 'VEHICLE',
            make: m.brand_name || '',
            model: m.model_name || '',
            variant: m.variant_name || '',
            displayName: `${m.model_name} ${m.variant_name}`.trim(),
            label: '',
            slug: `${m.brand_slug || ''}-${m.model_slug || ''}-${m.variant_slug || ''}`.replace(/^-|-$/g, ''),
            modelSlug: m.model_slug || '',
            sku: primarySku.sku_code || primarySku.sku_id,
            status: (m.model_status as any) || 'ACTIVE',
            bodyType: (m.body_type as any) || 'MOTORCYCLE',
            fuelType: (m.fuel_type as any) || 'PETROL',
            displacement,
            powerUnit: isEV ? 'KW' : 'CC',
            segment: m.body_type || '',
            rating: 0,
            popularityScore: Math.max(...skus.map(s => s.visit_count || 0)) + (skus.some(s => s.is_popular) ? 1 : 0),
            price: {
                exShowroom,
                onRoad,
                pricingSource: 'MH',
            },
            skuIds: skus.map(s => s.sku_id),
            specifications,
            availableColors:
                availableColors.length > 0
                    ? availableColors
                    : [
                          {
                              id: primarySku.sku_id,
                              name: primarySku.color_name || 'Default',
                              hexCode: primarySku.hex_primary || '#333333',
                              imageUrl: primarySku.primary_image || undefined,
                          },
                      ],
            imageUrl: primarySku.primary_image || '',
            zoomFactor: primarySku.zoom_factor ?? undefined,
            isFlipped: primarySku.is_flipped || undefined,
            offsetX: primarySku.offset_x ?? undefined,
            offsetY: primarySku.offset_y ?? undefined,
            color: primarySku.color_name || undefined,
        };

        result.push(variant);
    }

    return result;
}

// ============================================================
// Public API — Drop-in replacement for fetchCatalogServerSide
// ============================================================

export async function fetchCatalogV2(stateCode: string = 'MH'): Promise<ProductVariant[]> {
    const rawRows = await withCache(() => fetchCatalogV2Raw(stateCode), ['catalog-v2', stateCode], {
        revalidate: 3600,
        tags: [CACHE_TAGS.catalog, CACHE_TAGS.catalog_global],
    });

    if (!rawRows || rawRows.length === 0) return [];

    return mapV2ToProductVariants(rawRows);
}
