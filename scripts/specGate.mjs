/**
 * Vehicle spec gate for seed scripts.
 * Enforces:
 * - only allowlisted keys
 * - value type/format checks per key
 */

const NUMBER_KEYS = new Set([
    'displacement',
    'num_valves',
    'mileage',
    'mileage_arai',
    'kerb_weight',
    'seat_height',
    'ground_clearance',
    'wheelbase',
    'fuel_capacity',
    'battery_capacity',
    'range_km',
    'overall_length',
    'overall_width',
    'overall_height',
    'warranty_years',
    'warranty_km',
    'cylinders',
]);

const BOOLEAN_KEYS = new Set([
    'led_headlamp',
    'led_tail_lamp',
    'usb_charging',
    'bluetooth',
    'navigation',
    'pillion_seat',
    'pillion_footrest',
    'stand_alarm',
    'pass_light',
    'killswitch',
    'low_fuel_indicator',
    'low_oil_indicator',
    'low_battery_indicator',
]);

const ENUM_RULES = {
    transmission: new Set(['MANUAL', 'CVT_AUTOMATIC', 'AUTOMATIC']),
    start_type: new Set(['KICK', 'ELECTRIC', 'KICK_AND_ELECTRIC', 'ELECTRIC_AND_KICK', 'SELF_START']),
    braking_system: new Set(['ABS', 'CBS', 'SBT', 'COMBI_BRAKE', 'SINGLE_CHANNEL_ABS', 'DUAL_CHANNEL_ABS']),
    console_type: new Set(['ANALOG', 'DIGITAL', 'DIGITAL_TFT', 'DIGITAL_LCD', 'SEMI_DIGITAL_ANALOG']),
    tyre_type: new Set(['Tubeless', 'Tube Type', 'TUBELESS', 'TUBE_TYPE']),
};

const TEXT_KEYS = new Set([
    'engine_type',
    'max_power',
    'max_torque',
    'air_filter',
    'front_brake',
    'rear_brake',
    'front_suspension',
    'rear_suspension',
    'front_tyre',
    'rear_tyre',
    'ride_modes',
    'headlamp_type',
    'service_interval',
    'cooling_system',
    'bore_stroke',
    'compression_ratio',
    'top_speed',
    'clutch',
    'chassis_type',
    'wheel_type',
    'front_wheel_size',
    'rear_wheel_size',
    'speedometer',
    'tripmeter',
    'clock',
]);

export const ALLOWED_VEHICLE_SPEC_KEYS = new Set([
    ...NUMBER_KEYS,
    ...BOOLEAN_KEYS,
    ...Object.keys(ENUM_RULES),
    ...TEXT_KEYS,
]);

const TRIPLE_METRIC_REGEX =
    /^[\d,.]+\s*PS\s*\/\s*[\d,.]+\s*kW\s*\/\s*[\d,.]+\s*bhp(?:\s*@\s*[\d,.]+\s*rpm)?([\s\S]*)?$/i;

const MODE_WISE_METRIC_REGEX =
    /^.+\s*\/\s*.+(?:\s*\/\s*.+)*$/i;

const SIMPLE_METRIC_REGEX = /^\d+(?:\.\d+)?\s*[A-Za-z%]+(?:\s*@\s*\d+(?:\.\d+)?\s*rpm)?$/i;

const isNullish = v => v === null || v === undefined || v === '';

function assertKeyAllowed(key, context) {
    if (!ALLOWED_VEHICLE_SPEC_KEYS.has(key)) {
        throw new Error(`[SpecGate] Unknown spec key "${key}" in ${context}. Add explicit approval/mapping first.`);
    }
}

function assertNumber(key, value, context) {
    if (isNullish(value)) return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return;
    throw new Error(`[SpecGate] Invalid number for "${key}" in ${context}: ${JSON.stringify(value)}`);
}

function assertBoolean(key, value, context) {
    if (isNullish(value)) return;
    if (typeof value === 'boolean') return;
    throw new Error(`[SpecGate] Invalid boolean for "${key}" in ${context}: ${JSON.stringify(value)}`);
}

function assertEnum(key, value, context) {
    if (isNullish(value)) return;
    const normalized = String(value).trim();
    if (ENUM_RULES[key].has(normalized)) return;
    throw new Error(
        `[SpecGate] Invalid enum for "${key}" in ${context}: ${JSON.stringify(value)}. Allowed: ${Array.from(
            ENUM_RULES[key]
        ).join(', ')}`
    );
}

function assertText(key, value, context) {
    if (isNullish(value)) return;
    if (typeof value !== 'string') {
        throw new Error(`[SpecGate] Invalid text for "${key}" in ${context}: ${JSON.stringify(value)}`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error(`[SpecGate] Empty text for "${key}" in ${context}`);
    }
}

function assertMetric(key, value, context) {
    if (isNullish(value)) return;
    if (typeof value !== 'string') {
        throw new Error(`[SpecGate] Invalid metric for "${key}" in ${context}: ${JSON.stringify(value)}`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error(`[SpecGate] Empty metric for "${key}" in ${context}`);
    }
    if (TRIPLE_METRIC_REGEX.test(trimmed)) return;
    if (MODE_WISE_METRIC_REGEX.test(trimmed)) return;
    if (SIMPLE_METRIC_REGEX.test(trimmed)) return;
    throw new Error(
        `[SpecGate] Invalid metric format for "${key}" in ${context}: ${JSON.stringify(
            value
        )}. Expected "9.38 PS / 6.9 kW / 9.25 bhp @ 7500 rpm" or simple "PS/bhp" for legacy.`
    );
}

export function enforceVehicleSpecGate(specs, context = 'seed') {
    if (!specs || typeof specs !== 'object') {
        throw new Error(`[SpecGate] Specs payload must be an object in ${context}.`);
    }

    const out = {};

    for (const [key, value] of Object.entries(specs)) {
        assertKeyAllowed(key, context);

        if (key === 'max_power' || key === 'max_torque') {
            assertMetric(key, value, context);
        } else if (NUMBER_KEYS.has(key)) {
            assertNumber(key, value, context);
        } else if (BOOLEAN_KEYS.has(key)) {
            assertBoolean(key, value, context);
        } else if (ENUM_RULES[key]) {
            assertEnum(key, value, context);
        } else if (TEXT_KEYS.has(key)) {
            assertText(key, value, context);
        }

        out[key] = typeof value === 'string' ? value.trim() : value;
    }

    return out;
}

