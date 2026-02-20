/**
 * storeSot.ts — Shared Store Source-of-Truth Types
 *
 * Used by both the Catalog (catalogFetcherV2.ts) and the PDP (page.tsx)
 * to guarantee identical shape of model, variant, SKU, colour, and pricing data.
 */

// ─── Model ───────────────────────────────────────────────────
export interface SotModel {
    id: string;
    name: string;
    slug: string;
    brand_id: string;
    fuel_type: string | null;
    engine_cc: number | null;
    status: string;
    brand: { name: string; slug: string } | null;
}

// ─── Vehicle Variant ─────────────────────────────────────────
export interface SotVariant {
    id: string;
    name: string;
    slug: string;
    status: string;
}

// ─── Colour ──────────────────────────────────────────────────
export interface SotColour {
    id: string;
    name: string;
    hex_primary: string | null;
    hex_secondary: string | null;
    finish: string | null;
}

// ─── SKU (as returned from the canonical query) ──────────────
export interface SotSku {
    id: string;
    name: string;
    slug: string;
    sku_type: string;
    price_base: number;
    is_primary: boolean;
    primary_image: string | null;
    gallery_img_1: string | null;
    gallery_img_2: string | null;
    gallery_img_3: string | null;
    gallery_img_4: string | null;
    gallery_img_5: string | null;
    gallery_img_6: string | null;
    color_name: string | null;
    hex_primary: string | null;
    hex_secondary: string | null;
    finish: string | null;
    colour_id: string | null;
    vehicle_variant_id: string | null;
    colour: SotColour | null;
    vehicle_variant: SotVariant | null;
}

// ─── Normalized SKU (with flattened variant fields) ──────────
export interface NormalizedSku extends SotSku {
    variant_slug: string | null;
    variant_name: string | null;
    variant_id: string | null;
}

// ─── Color Config (passed to client) ─────────────────────────
export interface SotColorConfig {
    id: string;
    skuId: string;
    name: string;
    hex: string;
    image: string | null;
    assets: SotAsset[];
    video: string | null;
    pricingOverride: { exShowroom: number } | undefined;
    dealerOffer: number;
    isPrimary: boolean;
}

export interface SotAsset {
    id: string;
    type: 'IMAGE';
    url: string;
    is_primary: boolean;
    position: number;
}

// ─── Pricing Snapshot ────────────────────────────────────────
export interface SotPricingSnapshot {
    vehicle_color_id: string;
    ex_showroom_price: number;
    rto_total: number;
    insurance_total: number;
    on_road_price: number;
    rto: {
        STATE: {
            total: number;
            fees?: Record<string, number>;
            tax?: Record<string, number>;
            registrationCharges?: number;
            smartCardCharges?: number;
            postalCharges?: number;
            hypothecationCharges?: number;
            roadTax?: number;
            roadTaxRate?: number;
            cessAmount?: number;
            cessRate?: number;
        };
        BH: {
            total: number;
            fees?: Record<string, number>;
            tax?: Record<string, number>;
            registrationCharges?: number;
            smartCardCharges?: number;
            postalCharges?: number;
            hypothecationCharges?: number;
            roadTax?: number;
            roadTaxRate?: number;
            cessAmount?: number;
            cessRate?: number;
        };
        COMPANY: {
            total: number;
            fees?: Record<string, number>;
            tax?: Record<string, number>;
            registrationCharges?: number;
            smartCardCharges?: number;
            postalCharges?: number;
            hypothecationCharges?: number;
            roadTax?: number;
            roadTaxRate?: number;
            cessAmount?: number;
            cessRate?: number;
        };
        default: string;
    };
    insurance: {
        base_total: number;
        od: { total: number; base?: number; gst?: number };
        tp: { total: number; base?: number; gst?: number };
        pa: number;
        addons?: { id: string; label: string; price: number; gst: number; total: number; default: boolean }[];
        gst_rate?: number;
    };
    state_code: string;
    district: string;
    published_at: string | null;
}

// ─── PDP Snapshot (aggregate result) ─────────────────────────
export interface PdpSnapshot {
    model: SotModel | null;
    variant: SotVariant | null;
    skus: NormalizedSku[];
    pricing: SotPricingSnapshot | null;
    /** Full pricing row for server-side breakdown pass-through */
    pricingRow: Record<string, any> | null;
}

// ─── Store Context ───────────────────────────────────────────
export interface StoreContext {
    dealerId: string | null;
    tenantName: string | null;
    district: string | null;
    stateCode: string;
    source: string;
}

// ─── Catalog Snapshot Row (for catalog mapper) ──────────────
export interface CatalogSnapshotRow {
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
    brand_id: string;
    brand_name: string;
    brand_slug: string | null;
    logo_svg: string | null;
    variant_id: string;
    variant_name: string;
    variant_slug: string;
    variant_status: string;
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
    ex_showroom: number | null;
    on_road_price: number | null;
    rto_state_total: number | null;
    ins_total: number | null;
    publish_stage: string | null;
    is_popular: boolean | null;
}

export interface DealerDelta {
    vehicleOffers: Record<string, number>;
    bundleSkuIds: string[];
    accessoryRules: Record<
        string,
        {
            offer: number;
            inclusion: string;
            isActive: boolean;
        }
    >;
}

export interface PdpSnapshotPayload extends PdpSnapshot {
    resolvedVariant: {
        id: string;
        name: string;
        slug: string;
        price_base: number;
        specs: Record<string, any>;
        brand: { name: string; slug?: string };
        parent: { name: string; slug: string };
    } | null;
    possibleVariantSlugs: Set<string>;
}
