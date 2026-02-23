'use client';

import React, { useState } from 'react';
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
    max_power: 'Max Power',
    max_torque: 'Max Torque',
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

    // Brakes & Safety
    front_brake_type: 'Front Brake',
    front_brake: 'Front Brake',
    rear_brake_type: 'Rear Brake',
    rear_brake: 'Rear Brake',
    abs_type: 'ABS',
    braking_system: 'Braking System',
    engine_kill_switch: 'Kill Switch',

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
            'cooling_system',
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

function formatValue(key: string, value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);

    const str = String(value);
    const unit = SPEC_UNITS[key];

    // If value already contains the unit, don't append
    if (unit && !str.toLowerCase().includes(unit.toLowerCase())) {
        return `${str} ${unit}`;
    }

    return str;
}

export default function TechSpecsSection({ specs, modelName, variantName }: TechSpecsSectionProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>('engine');

    if (!specs || Object.keys(specs).length === 0) return null;

    // Filter out internal/media keys
    const displaySpecs: Record<string, any> = {};
    for (const [key, value] of Object.entries(specs)) {
        if (!EXCLUDED_KEYS.has(key) && value !== null && value !== undefined && value !== '') {
            displaySpecs[key] = value;
        }
    }

    if (Object.keys(displaySpecs).length === 0) return null;

    // Build grouped categories with actual spec data
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
    const categorizedKeys = new Set(CATEGORY_CONFIG.flatMap(c => c.keys));
    const uncategorized = Object.entries(displaySpecs)
        .filter(([key]) => !categorizedKeys.has(key))
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
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                                            {cat.label}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {cat.items.length} specs
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
                                    <div className="border-t border-slate-200/60 pt-4">
                                        {renderSpecList(cat.items)}
                                    </div>
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
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
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
                                            <span className="text-2xl font-black uppercase tracking-[0.3em] text-slate-400/60 -rotate-90 whitespace-nowrap">
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
