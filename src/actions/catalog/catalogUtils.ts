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

/**
 * Step-down structural keys into the strict { value, unit } format required by cat_skus_linear.
 */
export function normalizeSpecsForLinear(rawSpecs: Record<string, any>): Record<string, any> {
    const specs: Record<string, any> = {};

    const mapping: Record<string, { key: string; unit: string }> = {
        engine_cc: { key: 'cc', unit: 'cc' },
        max_power: { key: 'power_bhp', unit: 'bhp' },
        max_torque: { key: 'torque_nm', unit: 'nm' },
        range_per_charge: { key: 'range_km', unit: 'km' },
        battery_capacity: { key: 'battery_kwh', unit: 'kWh' },
        kerb_weight: { key: 'kerb_weight_kg', unit: 'kg' },
    };

    for (const [legacyKey, config] of Object.entries(mapping)) {
        const val = rawSpecs[legacyKey];
        if (val !== undefined && val !== null) {
            const numeric = typeof val === 'number' ? val : parseFloat(val.toString());
            if (!isNaN(numeric)) {
                specs[config.key] = { value: numeric, unit: config.unit };
            }
        }
    }

    if (rawSpecs.transmission_type) {
        specs.transmission = rawSpecs.transmission_type;
    }

    // Infer finish if it's a color SKU/Unit
    const hasHex = rawSpecs.hex_primary || rawSpecs.hex_code;
    if (hasHex) {
        specs.finish = normalizeFinish(rawSpecs.Color || rawSpecs.color || '', rawSpecs);
    }

    return specs;
}

/**
 * Infer finish (Glossy/Matte) from name or specs.
 */
export function normalizeFinish(name: string, rawSpecs: Record<string, any> = {}): 'GLOSSY' | 'MATTE' {
    const combined = `${name} ${rawSpecs.Finish || ''} ${rawSpecs.finish || ''}`.toUpperCase();
    if (combined.includes('MATTE') || combined.includes('MATT')) return 'MATTE';
    if (combined.includes('GLOSS')) return 'GLOSSY';
    return 'GLOSSY'; // Default to GLOSSY per user preference for rich aesthetics
}

export function generateSlug(_brandSlug: string, name: string): string {
    // NOTE: Brand prefix is NOT included in the slug.
    // The brand is already a separate URL segment: /store/[make]/[slug]
    return name
        .toLowerCase()
        .replace(/\+/g, 'plus')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
