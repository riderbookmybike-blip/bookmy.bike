/**
 * catalogUtils.ts — Pure utilities for catalog data processing
 * This file is client-side safe and does not use 'use server'.
 */

/**
 * Segregate specs into Model (Structural) and Variant (Feature) levels.
 */
export function segregateSpecs(rawSpecs: Record<string, any>): {
    modelSpecs: Record<string, any>;
    variantSpecs: Record<string, any>;
} {
    const STRUCTURAL_KEYS = [
        // ICE & General
        'engine_cc',
        'max_power',
        'max_torque',
        'fuel_capacity',
        'mileage',
        'seat_height',
        'top_speed',
        'emission_standard',
        'kerb_weight',
        'ground_clearance',
        'rating_avg',
        'engine_type',
        'cooling_system',
        'compression_ratio',
        'bore',
        'stroke',
        'valves_per_cylinder',
        'cylinder_count',
        'wheelbase',
        'transmission_type',
        'clutch_type',
        'final_drive',

        // Electric (EV)
        'battery_capacity',
        'range_per_charge',
        'charging_time',
        'motor_power',
        'motor_type',
        'fast_charging',
        'battery_warranty',
        'motor_warranty',
    ];

    const modelSpecs: Record<string, any> = {};
    const variantSpecs: Record<string, any> = {};

    for (const [key, value] of Object.entries(rawSpecs)) {
        if (STRUCTURAL_KEYS.includes(key)) {
            modelSpecs[key] = value;
        } else {
            variantSpecs[key] = value;
        }
    }

    return { modelSpecs, variantSpecs };
}

/**
 * Categorize a field for UI grouping
 */
export function getCategoryForField(field: string): string {
    const categories: Record<string, string[]> = {
        'Engine & Performance': [
            'engine_cc',
            'max_power',
            'max_torque',
            'engine_type',
            'cooling_system',
            'compression_ratio',
            'bore',
            'stroke',
            'valves_per_cylinder',
            'cylinder_count',
            'mileage',
            'top_speed',
            'emission_standard',
            'starting_method',
            'transmission_type',
        ],
        'Dimensions & Chassis': [
            'kerb_weight',
            'seat_height',
            'ground_clearance',
            'wheelbase',
            'chassis_type',
            'tyre_type',
            'fuel_capacity',
        ],
        'Brakes & Safety': ['front_brake_type', 'rear_brake_type', 'abs_type', 'engine_kill_switch'],
        'Features & Tech': [
            'console_type',
            'bluetooth_support',
            'navigation_assist',
            'usb_charging',
            'riding_modes',
            'headlight_type',
            'drl_support',
            'wheel_type',
        ],
        'Electric (EV)': [
            'battery_capacity',
            'range_per_charge',
            'charging_time',
            'motor_power',
            'motor_type',
            'fast_charging',
            'battery_warranty',
            'motor_warranty',
        ],
    };

    for (const [cat, fields] of Object.entries(categories)) {
        if (fields.includes(field)) return cat;
    }

    return 'General';
}

export function generateSlug(brandSlug: string, name: string): string {
    return `${brandSlug}-${name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
