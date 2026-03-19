'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gauge,
    Zap,
    Ruler,
    ShieldCheck,
    Cpu,
    Battery,
    ChevronDown,
    Flame,
    Wind,
    Bike,
    Droplets,
    Weight,
    BarChart3,
} from 'lucide-react';

interface TechSpecsSectionProps {
    specs: Record<string, any>;
    modelName?: string;
    variantName?: string;
}

// Human-readable labels for spec keys
const SPEC_LABELS: Record<string, string> = {
    // Engine & Performance
    engine_cc: 'Displacement',
    displacement: 'Displacement',
    fuel_type: 'Fuel Type',
    max_power: 'Max Power',
    max_torque: 'Max Torque',
    max_power_sport: 'Max Power (Sport)',
    max_power_urban_rain: 'Max Power (Urban/Rain)',
    max_torque_sport: 'Max Torque (Sport)',
    max_torque_urban_rain: 'Max Torque (Urban/Rain)',
    engine_type: 'Engine Type',
    cooling_system: 'Cooling',
    compression_ratio: 'Compression Ratio',
    bore: 'Bore',
    stroke: 'Stroke',
    bore_stroke: 'Bore × Stroke',
    valves_per_cylinder: 'Valves/Cylinder',
    cylinder_count: 'Cylinders',
    mileage: 'Mileage',
    mileage_arai: 'Mileage (ARAI)',
    top_speed: 'Top Speed',
    emission_standard: 'Emission',
    starting_method: 'Start Type',
    start_type: 'Start Type',
    transmission_type: 'Transmission',
    transmission: 'Transmission',
    clutch_type: 'Clutch',
    clutch: 'Clutch',
    gearbox: 'Gearbox',
    final_drive: 'Final Drive',
    air_filter: 'Air Filter',
    num_valves: 'Valves',
    // Aliases for cat_variants_vehicle column names
    cylinders: 'Cylinders',
    engine_stroke: 'Engine Stroke',
    cam_type: 'Valve Train',
    fuel_system: 'Fuel System',
    valves: 'Valves',

    // Dimensions & Chassis
    kerb_weight: 'Kerb Weight',
    seat_height: 'Seat Height',
    ground_clearance: 'Ground Clearance',
    wheelbase: 'Wheelbase',
    chassis_type: 'Chassis',
    tyre_type: 'Tyre Type',
    tyre_front: 'Front Tyre',
    tyre_rear: 'Rear Tyre',
    tyre_size: 'Tyre Size',
    fuel_capacity: 'Fuel Tank',
    payload: 'Payload',
    front_suspension: 'Front Suspension',
    rear_suspension: 'Rear Suspension',
    vehicle_size: 'Vehicle Size (L×W×H)',
    seat_length: 'Seat Length',
    front_leg_space: 'Front Leg Space',
    ground_reach: 'Ground Reach',
    under_seat_storage: 'Under Seat Storage',
    glove_box: 'Glove Box',
    // Aliases for cat_variants_vehicle column names
    front_tyre: 'Front Tyre',
    rear_tyre: 'Rear Tyre',
    overall_length: 'Overall Length',
    overall_width: 'Overall Width',
    overall_height: 'Overall Height',

    // Brakes & Safety
    front_brake_type: 'Front Brake',
    front_brake: 'Front Brake',
    rear_brake_type: 'Rear Brake',
    rear_brake: 'Rear Brake',
    abs_type: 'Braking System',
    braking_system: 'Braking System',
    engine_kill_switch: 'Kill Switch',
    killswitch: 'Kill Switch',

    // Features & Tech
    console_type: 'Console',
    bluetooth_support: 'Bluetooth',
    navigation_assist: 'Navigation',
    usb_charging: 'USB Charging',
    mobile_charging: 'Mobile Charging',
    riding_modes: 'Riding Modes',
    headlight_type: 'Headlight',
    headlamp: 'Headlamp',
    drl_support: 'DRL',
    led_drl: 'LED DRL',
    wheel_type: 'Wheel Type',
    edition: 'Edition',
    fuel_injection: 'Fuel Injection',
    aho: 'Auto Headlamp On',
    tilt_sensor: 'Tilt Sensor',
    obdi: 'OBD Indicator',
    // Aliases for cat_variants_vehicle column names
    bluetooth: 'Bluetooth',
    navigation: 'Navigation',
    led_headlamp: 'LED Headlamp',
    led_tail_lamp: 'LED Tail Lamp',
    ride_modes: 'Riding Modes',
    headlamp_type: 'Headlamp Type',
    speedometer: 'Speedometer',
    tripmeter: 'Tripmeter',
    clock: 'Clock',
    low_fuel_indicator: 'Low Fuel Indicator',
    low_oil_indicator: 'Low Oil Indicator',
    low_battery_indicator: 'Low Battery Indicator',
    pillion_seat: 'Pillion Seat',
    pillion_footrest: 'Pillion Footrest',
    stand_alarm: 'Stand Alarm',
    pass_light: 'Pass Light',
    warranty_years: 'Warranty (Years)',
    warranty_km: 'Warranty (KM)',
    service_interval: 'Service Interval',

    // Electricals
    ignition_system: 'Ignition System',
    battery: 'Battery',
    brake_lamp: 'Brake Lamp',
    tail_lamp: 'Tail Lamp',
    indicator_lamp: 'Indicator Lamp',
    speedo_lamp: 'Speedo Lamp',
    horn: 'Horn',

    // EV
    battery_capacity: 'Battery',
    range_per_charge: 'Range',
    charging_time: 'Charging Time',
    motor_power: 'Motor Power',
    motor_type: 'Motor Type',
    fast_charging: 'Fast Charging',
    battery_warranty: 'Battery Warranty',
    motor_warranty: 'Motor Warranty',
    range_km: 'Range',
};

// Units for numeric specs
const SPEC_UNITS: Record<string, string> = {
    engine_cc: 'cc',
    displacement: 'cc',
    mileage: 'km/l',
    mileage_arai: 'km/l',
    top_speed: 'km/h',
    kerb_weight: 'kg',
    seat_height: 'mm',
    ground_clearance: 'mm',
    wheelbase: 'mm',
    fuel_capacity: 'L',
    range_per_charge: 'km',
    payload: 'kg',
    seat_length: 'mm',
    front_leg_space: 'mm',
    ground_reach: 'mm',
    under_seat_storage: 'L',
    glove_box: 'L',
    range_km: 'km',
    overall_length: 'mm',
    overall_width: 'mm',
    overall_height: 'mm',
    warranty_km: 'km',
};

// Category config with icons and order
const CATEGORY_CONFIG: {
    id: string;
    label: string;
    icon: any;
    keys: string[];
}[] = [
    {
        id: 'engine',
        label: 'Engine & Performance',
        icon: Gauge,
        keys: [
            'engine_cc',
            'displacement',
            'max_power',
            'max_torque',
            'engine_type',
            'engine_stroke',
            'cam_type',
            'cooling_system',
            'fuel_system',
            'compression_ratio',
            'bore',
            'stroke',
            'bore_stroke',
            'valves_per_cylinder',
            'cylinder_count',
            'mileage',
            'mileage_arai',
            'top_speed',
            'emission_standard',
            'starting_method',
            'start_type',
            'transmission_type',
            'transmission',
            'clutch_type',
            'clutch',
            'gearbox',
            'final_drive',
            'air_filter',
            'num_valves',
            'valves',
            'cylinders',
            'fuel_type',
            'emission_standard',
        ],
    },
    {
        id: 'dimensions',
        label: 'Dimensions & Chassis',
        icon: Ruler,
        keys: [
            'kerb_weight',
            'payload',
            'seat_height',
            'ground_clearance',
            'wheelbase',
            'chassis_type',
            'tyre_type',
            'tyre_front',
            'tyre_rear',
            'tyre_size',
            'fuel_capacity',
            'front_suspension',
            'rear_suspension',
            'vehicle_size',
            'seat_length',
            'front_leg_space',
            'ground_reach',
            'under_seat_storage',
            'glove_box',
            'front_tyre',
            'rear_tyre',
            'overall_length',
            'overall_width',
            'overall_height',
            'front_wheel_size',
            'rear_wheel_size',
        ],
    },
    {
        id: 'brakes',
        label: 'Brakes & Safety',
        icon: ShieldCheck,
        keys: [
            'front_brake_type',
            'front_brake',
            'rear_brake_type',
            'rear_brake',
            'abs_type',
            'braking_system',
            'engine_kill_switch',
            'killswitch',
        ],
    },
    {
        id: 'electricals',
        label: 'Electricals',
        icon: Zap,
        keys: [
            'ignition_system',
            'battery',
            'headlamp',
            'brake_lamp',
            'tail_lamp',
            'indicator_lamp',
            'speedo_lamp',
            'horn',
        ],
    },
    {
        id: 'features',
        label: 'Features & Tech',
        icon: Cpu,
        keys: [
            'console_type',
            'bluetooth_support',
            'navigation_assist',
            'usb_charging',
            'mobile_charging',
            'riding_modes',
            'headlight_type',
            'drl_support',
            'led_drl',
            'wheel_type',
            'edition',
            'fuel_injection',
            'aho',
            'tilt_sensor',
            'obdi',
            'bluetooth',
            'navigation',
            'led_headlamp',
            'led_tail_lamp',
            'ride_modes',
            'headlamp_type',
            'speedometer',
            'tripmeter',
            'clock',
            'low_fuel_indicator',
            'low_oil_indicator',
            'low_battery_indicator',
            'pillion_seat',
            'pillion_footrest',
            'stand_alarm',
            'pass_light',
            'warranty_years',
            'warranty_km',
            'service_interval',
        ],
    },
    {
        id: 'ev',
        label: 'Electric (EV)',
        icon: Battery,
        keys: [
            'battery_capacity',
            'range_per_charge',
            'charging_time',
            'motor_power',
            'motor_type',
            'fast_charging',
            'battery_warranty',
            'motor_warranty',
            'range_km',
        ],
    },
];

// Keys to exclude from rendering (internal/media fields)
const EXCLUDED_KEYS = new Set([
    'primary_image',
    'gallery',
    'gallery_urls',
    'hex_primary',
    'hex_code',
    'hex_secondary',
    'color',
    'video_url',
    'video_urls',
    'image_url',
    'model_attributes',
    'variant_attributes',
    'modelAttrs',
    'variantAttrs',
    'horsepower',
    'body_type',
    // Scraper metadata & internal fields — never render
    'provenance',
    'Provenance',
    'pdf_urls',
    'free_services',
    'warranty',
    'k',
    's',
    'variant',
    'Variant',
    'Finish',
    'finish',
]);

const BRAKING_SYSTEM_LABELS: Record<string, string> = {
    ABS: 'Single Channel',
    DUAL_ABS: 'Dual Channel',
    CBS: 'Not Available',
    SBT: 'Not Available',
};

function formatValue(key: string, value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);

    // ABS System: map enum to human-readable
    if (key === 'braking_system' || key === 'abs_type') {
        return BRAKING_SYSTEM_LABELS[String(value).toUpperCase()] ?? String(value);
    }

    const str = String(value);
    const unit = SPEC_UNITS[key];

    // If value already contains the unit, don't append
    if (unit && !str.toLowerCase().includes(unit.toLowerCase())) {
        return `${str} ${unit}`;
    }

    return str;
}

function extractEngineTypeParts(engineType: string): Record<string, string> {
    const derived: Record<string, string> = {};
    const normalized = engineType.trim();
    if (!normalized) return derived;

    const parts = normalized
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

    for (const part of parts) {
        const lower = part.toLowerCase();

        if (lower.includes('stroke') && !derived.engine_stroke) {
            derived.engine_stroke = part;
            continue;
        }

        if (lower.includes('cylinder') && !derived.cylinders) {
            const compact = lower.replace(/\s+/g, ' ');
            if (compact.includes('single')) derived.cylinders = '1';
            else if (compact.includes('twin') || compact.includes('double')) derived.cylinders = '2';
            else {
                const m = compact.match(/\d+/);
                derived.cylinders = m ? m[0] : part;
            }
            continue;
        }

        if (lower.includes('cooled') && !derived.cooling_system) {
            derived.cooling_system = part;
            continue;
        }

        if ((lower === 'sohc' || lower === 'dohc' || lower.includes('cam')) && !derived.cam_type) {
            derived.cam_type = part;
            continue;
        }

        if ((lower.includes('fi') || lower.includes('injection')) && !derived.fuel_system) {
            derived.fuel_system = part;
            continue;
        }

        if (/\b\d+\s*v\b/i.test(part) && !derived.valves) {
            derived.valves = part;
        }
    }

    return derived;
}

function normalizeModeKey(mode: string): string {
    return mode
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/\//g, '_')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function splitModeWiseMetric(value: string, baseKey: 'max_power' | 'max_torque'): Record<string, string> {
    const out: Record<string, string> = {};
    const parts = value
        .split('/')
        .map(p => p.trim())
        .filter(Boolean);

    if (parts.length < 2) return out;

    for (const part of parts) {
        const modeMatch = part.match(/\(([^)]+)\)\s*$/);
        if (!modeMatch) continue;
        const mode = modeMatch[1].trim();
        const metric = part.replace(/\s*\([^)]+\)\s*$/, '').trim();
        if (!metric) continue;
        const modeKey = normalizeModeKey(mode);
        if (!modeKey) continue;
        out[`${baseKey}_${modeKey}`] = metric;
    }

    return out;
}

export default function TechSpecsSection({ specs, modelName, variantName }: TechSpecsSectionProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Desktop: open 'Brakes & Safety' by default; Mobile: all collapsed
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setActiveCategory('brakes');
        }
    }, []);

    if (!specs || Object.keys(specs).length === 0) return null;

    // Filter out internal/media keys
    const displaySpecs: Record<string, any> = {};
    for (const [key, value] of Object.entries(specs)) {
        if (!EXCLUDED_KEYS.has(key) && value !== null && value !== undefined && value !== '') {
            displaySpecs[key] = value;
        }
    }

    // Split composite engine_type into structured rows where dedicated keys are missing.
    if (typeof displaySpecs.engine_type === 'string') {
        const derived = extractEngineTypeParts(displaySpecs.engine_type);
        for (const [key, value] of Object.entries(derived)) {
            if (
                !(key in displaySpecs) ||
                displaySpecs[key] === null ||
                displaySpecs[key] === undefined ||
                displaySpecs[key] === ''
            ) {
                displaySpecs[key] = value;
            }
        }
    }

    // Split mode-wise performance strings:
    // e.g. "17.55 PS @ 9250 rpm (Sport) / 15.64 PS @ 8650 rpm (Urban/Rain)"
    for (const baseKey of ['max_power', 'max_torque'] as const) {
        const raw = displaySpecs[baseKey];
        if (typeof raw !== 'string') continue;
        const modeWise = splitModeWiseMetric(raw, baseKey);
        if (Object.keys(modeWise).length === 0) continue;
        Object.assign(displaySpecs, modeWise);
        delete displaySpecs[baseKey];
    }

    if (Object.keys(displaySpecs).length === 0) return null;

    // Build grouped categories with actual spec data
    // One row = one key = one value (no label-based merge)
    const groupedCategories = CATEGORY_CONFIG.map(cat => {
        const items = cat.keys
            .filter(key => key in displaySpecs)
            .map(key => ({
                key,
                label: SPEC_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                value: formatValue(key, displaySpecs[key]),
            }));
        return { ...cat, items };
    }).filter(cat => cat.items.length > 0);

    // Collect uncategorized specs into "General"
    // Avoid duplicate keys across categories.
    const categorizedKeys = new Set(CATEGORY_CONFIG.flatMap(c => c.keys));
    const allUsedKeys = new Set(groupedCategories.flatMap(c => c.items.map(i => i.key)));
    const uncategorized = Object.entries(displaySpecs)
        .filter(([key]) => !categorizedKeys.has(key) && !allUsedKeys.has(key))
        .map(([key, value]) => ({
            key,
            label: SPEC_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: formatValue(key, value),
        }));

    if (uncategorized.length > 0) {
        groupedCategories.push({
            id: 'general',
            label: 'General',
            icon: Bike,
            keys: uncategorized.map(u => u.key),
            items: uncategorized,
        });
    }

    // Spec list renderer (shared by both mobile and desktop)
    const renderSpecList = (items: { key: string; label: string; value: string }[]) => (
        <div className="space-y-1">
            {items.map(item => (
                <div
                    key={item.key}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                >
                    <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                    <span className="text-xs font-bold text-slate-800 text-right">{item.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div>
            {/* Mobile: Vertical Accordion */}
            <div className="md:hidden space-y-4">
                {groupedCategories.map(cat => {
                    const Icon = cat.icon;
                    const isOpen = activeCategory === cat.id;
                    return (
                        <div
                            key={cat.id}
                            className="glass-panel bg-white/90 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                        <Icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black tracking-[0.05em] text-brand-primary">
                                            {cat.label}
                                        </p>
                                        <p className="text-[11px] font-semibold text-slate-600 truncate">
                                            {(() => {
                                                const names = cat.items.map((s: any) => s.label).filter(Boolean);
                                                const shown = names.slice(0, 2).join(', ');
                                                const rest = names.length - 2;
                                                return rest > 0 ? `${shown} & +${rest}` : shown;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {isOpen && (
                                <div className="px-5 pb-5">
                                    <div className="border-t border-slate-200/60 pt-4">{renderSpecList(cat.items)}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop: Horizontal Accordion (matching config cards) */}
            <div className="hidden md:flex flex-row gap-4 h-[720px] overflow-visible">
                {groupedCategories.map((cat, idx) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;

                    return (
                        <motion.div
                            key={cat.id}
                            layout
                            custom={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    delay: 0.1 + idx * 0.08,
                                    duration: 0.5,
                                    ease: 'easeOut',
                                },
                            }}
                            onClick={() => setActiveCategory(isActive ? null : cat.id)}
                            className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between shrink-0 lg:shrink
                                ${
                                    isActive
                                        ? 'flex-[3] bg-white border-slate-200 shadow-2xl,0,0,0.5)]'
                                        : 'flex-[0.5] bg-white/40 backdrop-blur-xl border-white/60 hover:bg-white/60 shadow-lg shadow-black/[0.03]'
                                }`}
                        >
                            {/* Header / Category Label */}
                            <div
                                className={`p-6 flex items-center gap-3 transition-colors duration-500 shrink-0 ${isActive ? 'bg-brand-primary/[0.03] border-b border-slate-100' : ''}`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                                    ${isActive ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-slate-200 text-slate-400'}`}
                                >
                                    <Icon size={20} />
                                </div>

                                <div
                                    className={`flex flex-col transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}
                                >
                                    <span className="text-xs font-black tracking-[0.05em] text-brand-primary">
                                        {cat.label}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                                        {cat.items.length} specs
                                    </span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-hidden relative">
                                <AnimatePresence mode="wait">
                                    {isActive ? (
                                        <motion.div
                                            key="content"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4, delay: 0.2 }}
                                            className="absolute inset-0 p-4 pt-2 flex flex-col"
                                        >
                                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-2 px-2 pb-12">
                                                {renderSpecList(cat.items)}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="vertical-label"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <span className="text-[22px] font-bold normal-case tracking-[0.06em] text-slate-400/55 -rotate-90 whitespace-nowrap">
                                                {cat.label}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Bottom Fade (Active state) */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
