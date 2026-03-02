/**
 * Shared Catalog Types
 *
 * These are plain TypeScript types (no 'use server' / 'use client' directive)
 * so they can be safely imported by both server action files and client components
 * without creating a mixed module boundary that breaks Turbopack HMR.
 */

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
    engine_type: string | null;
    displacement: number | null;
    max_power: string | null;
    max_torque: string | null;
    num_valves: number | null;
    transmission: string | null;
    air_filter: string | null;
    mileage: number | null;
    start_type: string | null;
    front_brake: string | null;
    rear_brake: string | null;
    braking_system: string | null;
    front_suspension: string | null;
    rear_suspension: string | null;
    kerb_weight: number | null;
    seat_height: number | null;
    ground_clearance: number | null;
    wheelbase: number | null;
    fuel_capacity: number | null;
    console_type: string | null;
    led_headlamp: boolean | null;
    led_tail_lamp: boolean | null;
    usb_charging: boolean | null;
    bluetooth: boolean | null;
    navigation: boolean | null;
    ride_modes: string | null;
    front_tyre: string | null;
    rear_tyre: string | null;
    tyre_type: string | null;
    battery_type: string | null;
    battery_capacity: string | null;
    range_km: number | null;
    charging_time: string | null;
    motor_power: string | null;
    created_at: string;
    updated_at: string;
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
    video_url_1: string | null;
    video_url_2: string | null;
    pdf_url_1: string | null;
    has_360: boolean;
    zoom_factor: number | null;
    is_flipped: boolean;
    offset_x: number | null;
    offset_y: number | null;
    media_shared: boolean;
    created_at: string;
    updated_at: string;
}
