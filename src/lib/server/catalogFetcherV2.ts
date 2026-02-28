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
    booking_count: number;
    visitor_view_count: number;
    visitor_dwell_ms: number;
    dealer_offer: number; // from cat_price_dealer: negative = discount, positive = surge
}

type VisitorSignalMaps = {
    skuViews: Map<string, number>;
    skuDwellMs: Map<string, number>;
    variantViews: Map<string, number>;
    variantDwellMs: Map<string, number>;
};

function normalizeVariantKey(modelSlug?: string | null, variantSlug?: string | null): string | null {
    const model = String(modelSlug || '')
        .trim()
        .toLowerCase();
    const variant = String(variantSlug || '')
        .trim()
        .toLowerCase();
    if (!model || !variant) return null;
    return `${model}::${variant}`;
}

function extractVariantKeyFromPath(pathname?: string | null): string | null {
    const path = (pathname || '').split('?')[0].trim().toLowerCase();
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 4 || parts[0] !== 'store') return null;
    return normalizeVariantKey(parts[2], parts[3]);
}

function appendMetric(map: Map<string, number>, key: string | null, increment: number) {
    if (!key || !Number.isFinite(increment) || increment <= 0) return;
    map.set(key, (map.get(key) || 0) + increment);
}

async function fetchSkuBookingCounts(days: number = 180): Promise<Map<string, number>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await adminClient
        .from('crm_bookings')
        .select('sku_id, color_id, qty, status, is_deleted, created_at')
        .gte('created_at', since)
        .limit(50000);

    if (error || !data) {
        if (error) {
            console.warn('[CatalogV2Fetch] Booking count fetch failed:', error.message);
        }
        return new Map();
    }

    const counts = new Map<string, number>();
    for (const row of data as Array<any>) {
        if (row?.is_deleted === true) continue;
        const status = String(row?.status || '').toUpperCase();
        if (status.includes('CANCEL')) continue;
        if (status.includes('REFUND')) continue;

        const skuId = String(row?.sku_id || row?.color_id || '')
            .trim()
            .toLowerCase();
        if (!skuId) continue;

        const qty = Math.max(1, Number(row?.qty) || 1);
        counts.set(skuId, (counts.get(skuId) || 0) + qty);
    }

    return counts;
}

async function fetchSkuVisitorSignals(days: number = 30): Promise<VisitorSignalMaps> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const [pageViewResult, skuSignalResult] = await Promise.all([
        adminClient
            .from('analytics_events')
            .select('event_type, event_name, page_path, metadata')
            .eq('event_type', 'PAGE_VIEW')
            .gte('created_at', since)
            .like('page_path', '/store/%/%/%')
            .limit(30000),
        adminClient
            .from('analytics_events')
            .select('event_type, event_name, page_path, metadata')
            .eq('event_type', 'INTENT_SIGNAL')
            .in('event_name', ['sku_view', 'sku_dwell'])
            .gte('created_at', since)
            .limit(30000),
    ]);

    if (pageViewResult.error || skuSignalResult.error) {
        if (pageViewResult.error) {
            console.warn('[CatalogV2Fetch] Page-view signal fetch failed:', pageViewResult.error.message);
        }
        if (skuSignalResult.error) {
            console.warn('[CatalogV2Fetch] SKU signal fetch failed:', skuSignalResult.error.message);
        }
        return {
            skuViews: new Map(),
            skuDwellMs: new Map(),
            variantViews: new Map(),
            variantDwellMs: new Map(),
        };
    }

    const data = [...(pageViewResult.data || []), ...(skuSignalResult.data || [])];

    const skuViews = new Map<string, number>();
    const skuDwellMs = new Map<string, number>();
    const variantViews = new Map<string, number>();
    const variantDwellMs = new Map<string, number>();

    for (const row of data as Array<any>) {
        const metadata = row?.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, any>) : {};
        const eventType = String(row?.event_type || '').toUpperCase();
        const eventName = String(row?.event_name || '').toLowerCase();
        const skuId = String(metadata.sku_id || '')
            .trim()
            .toLowerCase();

        const metadataVariantKey = normalizeVariantKey(
            typeof metadata.model_slug === 'string' ? metadata.model_slug : null,
            typeof metadata.variant_slug === 'string' ? metadata.variant_slug : null
        );
        const pathVariantKey = extractVariantKeyFromPath(row?.page_path);
        const variantKey = metadataVariantKey || pathVariantKey;

        const rawDwell = Number(metadata.dwell_ms || metadata.dwellMs || 0);
        const dwellMs = Number.isFinite(rawDwell) ? Math.max(0, rawDwell) : 0;

        const isSkuView = eventName === 'sku_view';
        const isSkuDwell = eventName === 'sku_dwell';
        const isVariantPageView = eventType === 'PAGE_VIEW' && !!pathVariantKey;

        if (isSkuView && skuId) appendMetric(skuViews, skuId, 1);
        if (isSkuDwell && skuId) appendMetric(skuDwellMs, skuId, dwellMs);

        if (isVariantPageView) appendMetric(variantViews, pathVariantKey, 1);
        if (isSkuView && variantKey) appendMetric(variantViews, variantKey, 1);
        if (isSkuDwell && variantKey) appendMetric(variantDwellMs, variantKey, dwellMs);
    }

    return { skuViews, skuDwellMs, variantViews, variantDwellMs };
}

/**
 * Fetch best dealer offer per SKU from cat_price_dealer.
 * Returns a Map of sku_id → offer_amount (negative = discount, positive = surge).
 */
async function fetchDealerOffers(stateCode: string = 'MH'): Promise<Map<string, number>> {
    const { data, error } = await adminClient
        .from('cat_price_dealer')
        .select('vehicle_color_id, offer_amount')
        .eq('state_code', stateCode)
        .eq('is_active', true);

    if (error || !data) {
        if (error) console.warn('[CatalogV2Fetch] Dealer offer fetch failed:', error.message);
        return new Map();
    }

    // Best offer = most negative (biggest discount). If multiple dealers, pick the best for each SKU.
    const bestOffers = new Map<string, number>();
    for (const row of data as Array<any>) {
        const skuId = String(row?.vehicle_color_id || '').trim();
        if (!skuId) continue;
        const amount = Number(row?.offer_amount || 0);
        const existing = bestOffers.get(skuId);
        if (existing === undefined || amount < existing) {
            bestOffers.set(skuId, amount);
        }
    }

    return bestOffers;
}

/**
 * Fetch full catalog from shared Store SOT snapshot and enrich with booking + visitor signals.
 */
async function fetchCatalogV2Raw(stateCode: string = 'MH'): Promise<RawProductRow[]> {
    const [snapshotRows, bookingCounts, visitorSignals, dealerOffers] = await Promise.all([
        getCatalogSnapshot(stateCode),
        fetchSkuBookingCounts(180),
        fetchSkuVisitorSignals(30),
        fetchDealerOffers(stateCode),
    ]);

    if (!snapshotRows || snapshotRows.length === 0) {
        console.debug('[CatalogV2Fetch] No active SKUs found');
        return [];
    }

    // Flatten into RawProductRow array
    return snapshotRows.map((row: any) => {
        const skuId = String(row.sku_id || '')
            .trim()
            .toLowerCase();
        const variantKey = normalizeVariantKey(row.model_slug, row.variant_slug);
        const bookingCount = skuId ? bookingCounts.get(skuId) || 0 : 0;

        const skuVisitorViews = skuId ? visitorSignals.skuViews.get(skuId) || 0 : 0;
        const variantVisitorViews = variantKey ? visitorSignals.variantViews.get(variantKey) || 0 : 0;
        const skuVisitorDwellMs = skuId ? visitorSignals.skuDwellMs.get(skuId) || 0 : 0;
        const variantVisitorDwellMs = variantKey ? visitorSignals.variantDwellMs.get(variantKey) || 0 : 0;
        const visitorViews = skuVisitorViews > 0 ? skuVisitorViews : variantVisitorViews;
        const visitorDwellMs = skuVisitorDwellMs > 0 ? skuVisitorDwellMs : variantVisitorDwellMs;

        return {
            ...row,
            booking_count: bookingCount,
            visitor_view_count: visitorViews,
            visitor_dwell_ms: visitorDwellMs,
            dealer_offer: dealerOffers.get(String(row.sku_id || '').trim()) ?? 0,
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
                headlampType:
                    m.headlamp_type || (m.led_headlamp ? 'LED' : m.led_headlamp === false ? 'Halogen' : undefined),
                tailLampType: m.led_tail_lamp === true ? 'LED' : m.led_tail_lamp === false ? 'Bulb' : undefined,
                rideModes: m.ride_modes || undefined,
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
        const exShowroom = primarySku.ex_showroom ?? 0;
        const onRoad = primarySku.on_road_price ?? exShowroom;

        // Dealer offer from cat_price_dealer (negative = discount, positive = surge)
        const dealerDelta = primarySku.dealer_offer ?? 0;
        const offerPrice = onRoad + dealerDelta; // delta is negative for discounts
        const discount = dealerDelta !== 0 ? -dealerDelta : 0; // positive = savings amount
        const totalSavings = Math.max(0, onRoad - offerPrice);

        // Determine displacement + powerUnit
        const displacement = m.engine_cc ?? undefined;
        const isEV = m.fuel_type === 'EV';
        const bookingCount = skus.reduce((sum, s) => sum + (Number(s.booking_count) || 0), 0);
        const visitorViews = skus.reduce((sum, s) => sum + (Number(s.visitor_view_count) || 0), 0);
        const visitorDwellMs = skus.reduce((sum, s) => sum + (Number(s.visitor_dwell_ms) || 0), 0);
        const dwellMinutes = visitorDwellMs / 60000;
        const bookingPriorityBoost = bookingCount > 0 ? 1_000_000_000 : 0;
        const popularBoost = skus.some(s => s.is_popular) ? 25 : 0;
        const popularityScore =
            bookingPriorityBoost + bookingCount * 1_000_000 + visitorViews * 100 + dwellMinutes + popularBoost;

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
            popularityScore,
            price: {
                exShowroom,
                onRoad,
                offerPrice: dealerDelta !== 0 ? offerPrice : undefined,
                discount: discount > 0 ? discount : undefined,
                rtoTotal: primarySku.rto_state_total ?? undefined,
                insuranceTotal: primarySku.ins_total ?? undefined,
                totalSavings: totalSavings > 0 ? totalSavings : undefined,
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
            trendSignals: {
                bookingCount,
                visitorViews,
                visitorDwellMs,
                rankingSource:
                    bookingCount > 0 ? 'BOOKINGS_FIRST' : visitorViews > 0 ? 'VISITOR_FALLBACK' : 'STATIC_FALLBACK',
            },
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
        revalidate: 300,
        tags: [CACHE_TAGS.catalog, CACHE_TAGS.catalog_global],
    });

    if (!rawRows || rawRows.length === 0) return [];

    return mapV2ToProductVariants(rawRows);
}
