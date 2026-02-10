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
    engine_cc: 'Displacement',
    max_power: 'Max Power',
    max_torque: 'Max Torque',
    engine_type: 'Engine Type',
    cooling_system: 'Cooling',
    compression_ratio: 'Compression Ratio',
    bore: 'Bore',
    stroke: 'Stroke',
    valves_per_cylinder: 'Valves/Cylinder',
    cylinder_count: 'Cylinders',
    mileage: 'Mileage',
    top_speed: 'Top Speed',
    emission_standard: 'Emission',
    starting_method: 'Start Type',
    transmission_type: 'Transmission',
    clutch_type: 'Clutch',
    final_drive: 'Final Drive',

    kerb_weight: 'Kerb Weight',
    seat_height: 'Seat Height',
    ground_clearance: 'Ground Clearance',
    wheelbase: 'Wheelbase',
    chassis_type: 'Chassis',
    tyre_type: 'Tyre Type',
    fuel_capacity: 'Fuel Tank',

    front_brake_type: 'Front Brake',
    rear_brake_type: 'Rear Brake',
    abs_type: 'ABS',
    engine_kill_switch: 'Kill Switch',

    console_type: 'Console',
    bluetooth_support: 'Bluetooth',
    navigation_assist: 'Navigation',
    usb_charging: 'USB Charging',
    riding_modes: 'Riding Modes',
    headlight_type: 'Headlight',
    drl_support: 'DRL',
    wheel_type: 'Wheel Type',

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
    mileage: 'km/l',
    top_speed: 'km/h',
    kerb_weight: 'kg',
    seat_height: 'mm',
    ground_clearance: 'mm',
    wheelbase: 'mm',
    fuel_capacity: 'L',
    range_per_charge: 'km',
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
            'clutch_type',
            'final_drive',
        ],
    },
    {
        id: 'dimensions',
        label: 'Dimensions & Chassis',
        icon: Ruler,
        keys: [
            'kerb_weight',
            'seat_height',
            'ground_clearance',
            'wheelbase',
            'chassis_type',
            'tyre_type',
            'fuel_capacity',
        ],
    },
    {
        id: 'brakes',
        label: 'Brakes & Safety',
        icon: ShieldCheck,
        keys: ['front_brake_type', 'rear_brake_type', 'abs_type', 'engine_kill_switch'],
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
            'riding_modes',
            'headlight_type',
            'drl_support',
            'wheel_type',
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
]);

// Hero stat icons for the top highlight row
const HERO_ICONS: Record<string, any> = {
    engine_cc: Flame,
    max_power: Zap,
    mileage: Droplets,
    top_speed: Wind,
    kerb_weight: Weight,
    fuel_capacity: BarChart3,
    range_per_charge: Battery,
    motor_power: Zap,
};

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
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

    // Hero stats — top 4-6 key specs for the highlight row
    const heroKeys = [
        'engine_cc',
        'max_power',
        'mileage',
        'top_speed',
        'kerb_weight',
        'fuel_capacity',
        'range_per_charge',
        'motor_power',
    ];
    const heroStats = heroKeys
        .filter(key => key in displaySpecs)
        .slice(0, 6)
        .map(key => ({
            key,
            label: SPEC_LABELS[key] || key,
            value: formatValue(key, displaySpecs[key]),
            icon: HERO_ICONS[key] || Gauge,
        }));

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Gauge size={20} className="text-brand-primary" />
                </div>
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                        Technical Specifications
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {modelName} {variantName}
                    </p>
                </div>
            </div>

            {/* Hero Stats Row */}
            {heroStats.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {heroStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i, duration: 0.5 }}
                                className="relative group"
                            >
                                <div className="p-3 md:p-4 rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/60 dark:border-white/5 hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 text-center">
                                    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-brand-primary/20 transition-colors">
                                        <Icon size={16} className="text-brand-primary" />
                                    </div>
                                    <p className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight">
                                        {stat.value}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
                                        {stat.label}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Category Accordion */}
            <div className="space-y-3">
                {groupedCategories.map((cat, catIdx) => {
                    const Icon = cat.icon;
                    const isExpanded = expandedCategory === cat.id;

                    return (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * catIdx, duration: 0.4 }}
                            className="rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/60 dark:border-white/5 overflow-hidden hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                        >
                            {/* Category Header */}
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                                className="w-full px-5 py-4 flex items-center justify-between text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-brand-primary text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-brand-primary'}`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200">
                                            {cat.label}
                                        </span>
                                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                            {cat.items.length} specs
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-primary' : ''}`}
                                />
                            </button>

                            {/* Category Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-5 pb-4 pt-1">
                                            <div className="border-t border-slate-200/60 dark:border-white/5 pt-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                                                    {cat.items.map((item, i) => (
                                                        <div
                                                            key={item.key}
                                                            className={`flex items-center justify-between py-2.5 ${
                                                                i <
                                                                cat.items.length - (cat.items.length % 2 === 0 ? 2 : 1)
                                                                    ? 'border-b border-slate-100 dark:border-white/[0.03]'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                                {item.label}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-800 dark:text-white text-right max-w-[60%] truncate">
                                                                {item.value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
