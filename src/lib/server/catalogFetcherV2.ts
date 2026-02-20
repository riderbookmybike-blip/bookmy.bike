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
import { getCatalogSnapshot } from '@/lib/server/storeSot';

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
    segment: string | null;
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
    mileage_arai: string | null;
    warranty_years: number | null;
    warranty_km: number | null;
    service_interval: string | null;
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
    engine_type: string | null;
    start_type: string | null;
    front_suspension: string | null;
    rear_suspension: string | null;
    front_tyre: string | null;
    rear_tyre: string | null;
    tyre_type: string | null;
    led_headlamp: boolean | null;
    led_tail_lamp: boolean | null;
    navigation: boolean | null;
    ride_modes: string | null;
    num_valves: number | null;
    wheelbase: string | null;
    // New BikeWale-level columns
    cooling_system: string | null;
    cylinders: number | null;
    bore_stroke: string | null;
    compression_ratio: string | null;
    top_speed: number | null;
    clutch: string | null;
    overall_length: number | null;
    overall_width: number | null;
    overall_height: number | null;
    chassis_type: string | null;
    wheel_type: string | null;
    front_wheel_size: string | null;
    rear_wheel_size: string | null;
    headlamp_type: string | null;
    speedometer: string | null;
    tripmeter: string | null;
    clock: boolean | null;
    low_fuel_indicator: boolean | null;
    low_oil_indicator: boolean | null;
    low_battery_indicator: boolean | null;
    pillion_seat: boolean | null;
    pillion_footrest: boolean | null;
    stand_alarm: boolean | null;
    pass_light: boolean | null;
    killswitch: boolean | null;
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
 * Fetch full catalog from shared Store SOT snapshot and enrich with visit counts.
 */
async function fetchCatalogV2Raw(stateCode: string = 'MH'): Promise<RawProductRow[]> {
    const [snapshotRows, visitCounts] = await Promise.all([getCatalogSnapshot(stateCode), fetchVariantVisitCounts(30)]);

    if (!snapshotRows || snapshotRows.length === 0) {
        console.debug('[CatalogV2Fetch] No active SKUs found');
        return [];
    }

    // Flatten into RawProductRow array
    return snapshotRows.map((row: any) => {
        const visitKey = `${(row.model_slug || '').toLowerCase()}::${(row.variant_slug || '').toLowerCase()}`;
        const visitCount = visitCounts.get(visitKey) || 0;

        return {
            ...row,
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

        // Build specifications from variant data — comprehensive mapping
        const specifications: VehicleSpecifications = {
            engine: {
                displacement: m.displacement || undefined,
                type: m.engine_type || undefined,
                maxPower: m.max_power || undefined,
                maxTorque: m.max_torque || undefined,
                numValves: m.num_valves ? String(m.num_valves) : undefined,
                startType: m.start_type || undefined,
                mileage: m.mileage_arai || undefined,
                cooling: m.cooling_system || undefined,
                cylinders: m.cylinders ? String(m.cylinders) : undefined,
                boreStroke: m.bore_stroke || undefined,
                compressionRatio: m.compression_ratio || undefined,
                topSpeed: m.top_speed ? `${m.top_speed} kmph` : undefined,
            },
            transmission: {
                type: m.transmission || 'N/A',
                clutch: m.clutch || undefined,
            },
            brakes: {
                front: m.front_brake || undefined,
                rear: m.rear_brake || undefined,
                abs: m.braking_system || undefined,
            },
            suspension: {
                front: m.front_suspension || undefined,
                rear: m.rear_suspension || undefined,
            },
            dimensions: {
                kerbWeight: m.kerb_weight || undefined,
                seatHeight: m.seat_height || undefined,
                groundClearance: m.ground_clearance || undefined,
                wheelbase: m.wheelbase || undefined,
                fuelCapacity: m.fuel_capacity || undefined,
                overallLength: m.overall_length ? `${m.overall_length} mm` : undefined,
                overallWidth: m.overall_width ? `${m.overall_width} mm` : undefined,
                overallHeight: m.overall_height ? `${m.overall_height} mm` : undefined,
                chassisType: m.chassis_type || undefined,
            },
            tyres: {
                front: m.front_tyre || undefined,
                rear: m.rear_tyre || undefined,
                type: m.tyre_type || undefined,
                wheelType: m.wheel_type || undefined,
                frontWheelSize: m.front_wheel_size || undefined,
                rearWheelSize: m.rear_wheel_size || undefined,
            },
            features: {
                bluetooth: m.bluetooth ?? undefined,
                usbCharging: m.usb_charging ?? undefined,
                navigation: m.navigation ?? undefined,
                consoleType: m.console_type || undefined,
                ledHeadlamp: m.led_headlamp ?? undefined,
                ledTailLamp: m.led_tail_lamp ?? undefined,
                rideModes: m.ride_modes || undefined,
                headlampType: m.headlamp_type || undefined,
                speedometer: m.speedometer || undefined,
                tripmeter: m.tripmeter || undefined,
                clock: m.clock ?? undefined,
                lowFuelIndicator: m.low_fuel_indicator ?? undefined,
                lowOilIndicator: m.low_oil_indicator ?? undefined,
                lowBatteryIndicator: m.low_battery_indicator ?? undefined,
                pillionSeat: m.pillion_seat ?? undefined,
                pillionFootrest: m.pillion_footrest ?? undefined,
                standAlarm: m.stand_alarm ?? undefined,
                passLight: m.pass_light ?? undefined,
                killswitch: m.killswitch ?? undefined,
            },
            warranty: {
                years: m.warranty_years ? `${m.warranty_years} Years` : undefined,
                distance: m.warranty_km ? `${m.warranty_km} km` : undefined,
                serviceInterval: m.service_interval || undefined,
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
            segment: m.segment || m.body_type || '',
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
