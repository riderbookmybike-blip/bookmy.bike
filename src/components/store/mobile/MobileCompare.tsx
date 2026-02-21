'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    Menu,
    Search,
    X,
    Check,
    Zap,
    Thermometer,
    Wind,
    RotateCw,
    Cog,
    Disc,
    ShieldCheck,
    BatteryCharging,
    Timer,
    CircuitBoard,
    Ruler,
    Weight,
    MoveVertical,
    MoveHorizontal,
    ArrowUpDown,
    Footprints,
    Droplet,
    Circle,
    CircleDot,
    Bluetooth,
    Usb,
    Navigation,
    Monitor,
    Lightbulb,
    Bike,
    Fuel,
    Pencil,
    Flame,
    Gauge,
    type LucideIcon,
    ChevronLeft,
} from 'lucide-react';
import type { ProductVariant } from '@/types/productMaster';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel } from '@/utils/variantGrouping';
import { slugify } from '@/utils/slugs';
import { Logo } from '@/components/brand/Logo';

// --- Spec Icon Mapping ---
const SPEC_ICON_MAP: Record<string, LucideIcon> = {
    displacement: Gauge,
    type: Cog,
    'max power': Zap,
    'max torque': RotateCw,
    'num valves': Cog,
    'start type': RotateCw,
    mileage: Fuel,
    'arai mileage': Fuel,
    cooling: Wind,
    cylinders: CircuitBoard,
    'bore stroke': CircleDot,
    'compression ratio': Thermometer,
    'top speed': Gauge,
    gears: Cog,
    clutch: Disc,
    front: Disc,
    rear: Disc,
    abs: ShieldCheck,
    range: BatteryCharging,
    'charging time': Timer,
    capacity: BatteryCharging,
    'motor power': Zap,
    'kerb weight': Weight,
    'curb weight': Weight,
    'seat height': MoveVertical,
    'ground clearance': ArrowUpDown,
    wheelbase: MoveHorizontal,
    'fuel capacity': Droplet,
    'overall length': Ruler,
    'overall width': Ruler,
    'overall height': Ruler,
    'chassis type': CircuitBoard,
    'wheel type': Circle,
    'front wheel size': Circle,
    'rear wheel size': Circle,
    bluetooth: Bluetooth,
    'usb charging': Usb,
    navigation: Navigation,
    'console type': Monitor,
    'led headlamp': Lightbulb,
    'fuel type': Flame,
    'body type': Bike,
    segment: Footprints,
};
function getSpecIcon(label: string): LucideIcon {
    return SPEC_ICON_MAP[label.toLowerCase()] || CircleDot;
}

// --- Spec Extraction Functions ---
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj || typeof obj !== 'object') return result;
    for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, path));
        } else if (val !== null && val !== undefined && val !== '') {
            result[path] = String(val);
        }
    }
    return result;
}

const LABEL_OVERRIDES: Record<string, string> = {
    mileage: 'ARAI Mileage',
    headlampType: 'Headlamp',
    tailLampType: 'Tail Lamp',
    startType: 'Starting',
    consoleType: 'Console',
    usbCharging: 'USB Charging',
    kerbWeight: 'Kerb Weight',
    seatHeight: 'Seat Height',
    groundClearance: 'Ground Clearance',
    fuelCapacity: 'Fuel Capacity',
    topSpeed: 'Top Speed',
    maxPower: 'Max Power',
    maxTorque: 'Max Torque',
    numValves: 'Valves',
    rideModes: 'Ride Modes',
    boreStroke: 'Bore × Stroke',
    compressionRatio: 'Compression Ratio',
    overallLength: 'Length',
    overallWidth: 'Width',
    overallHeight: 'Height',
    chassisType: 'Chassis',
    wheelType: 'Wheel Type',
    frontWheelSize: 'Front Wheel',
    rearWheelSize: 'Rear Wheel',
    lowFuelIndicator: 'Fuel Indicator',
    lowOilIndicator: 'Oil Indicator',
    lowBatteryIndicator: 'Battery Indicator',
    pillionSeat: 'Pillion Seat',
    pillionFootrest: 'Pillion Footrest',
    standAlarm: 'Side Stand Alert',
    passLight: 'Pass Light',
    serviceInterval: 'Service Interval',
    fuelType: 'Fuel',
    bodyType: 'Body Type',
    abs: 'Braking',
    type: 'Type',
    front: 'Front',
    rear: 'Rear',
    cooling: 'Cooling',
};

function labelFromKey(key: string): string {
    const last = key.split('.').pop() || key;
    if (LABEL_OVERRIDES[last]) return LABEL_OVERRIDES[last];
    return last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

function formatSpecValue(val: string): string {
    if (val === 'true' || val === 'yes') return 'Yes';
    if (val === 'false' || val === 'no') return 'No';
    return val;
}

function computeAllSpecs(variants: ProductVariant[]) {
    const allKeys = new Set<string>();
    const vSpecs = variants.map(v => flattenObject(v.specifications || {}));
    vSpecs.forEach(sp => Object.keys(sp).forEach(k => allKeys.add(k)));

    const categories: Record<string, { label: string; key: string }[]> = {
        Engine: [],
        Transmission: [],
        Brakes: [],
        Suspension: [],
        Battery: [],
        Dimensions: [],
        Tyres: [],
        Features: [],
        Other: [],
    };

    Array.from(allKeys).forEach(key => {
        const p = key.toLowerCase();
        let cat = 'Other';
        if (
            p.includes('engine') ||
            p.includes('power') ||
            p.includes('torque') ||
            p.includes('cylinders') ||
            p.includes('valves') ||
            p.includes('stroke') ||
            p.includes('compression') ||
            p.includes('cooling') ||
            p.includes('mileage') ||
            p.includes('speed') ||
            p.includes('fuel system')
        )
            cat = 'Engine';
        else if (p.includes('gear') || p.includes('clutch') || p.includes('transmission')) cat = 'Transmission';
        else if (p.includes('brake') || p.includes('abs') || p.includes('front') || p.includes('rear')) cat = 'Brakes';
        else if (p.includes('suspension') || p.includes('fork') || p.includes('shock')) cat = 'Suspension';
        else if (p.includes('battery') || p.includes('range') || p.includes('charging') || p.includes('motor'))
            cat = 'Battery';
        else if (
            p.includes('weight') ||
            p.includes('height') ||
            p.includes('clearance') ||
            p.includes('wheelbase') ||
            p.includes('length') ||
            p.includes('width') ||
            p.includes('capacity') ||
            p.includes('chassis')
        )
            cat = 'Dimensions';
        else if (p.includes('tyre') || p.includes('wheel')) cat = 'Tyres';
        else if (
            p.includes('headlamp') ||
            p.includes('tail') ||
            p.includes('indicator') ||
            p.includes('console') ||
            p.includes('bluetooth') ||
            p.includes('usb') ||
            p.includes('navigation') ||
            p.includes('seat') ||
            p.includes('stand')
        )
            cat = 'Features';

        categories[cat].push({ label: labelFromKey(key), key });
    });

    const orderedCats = [
        'Engine',
        'Battery',
        'Transmission',
        'Brakes',
        'Suspension',
        'Tyres',
        'Dimensions',
        'Features',
        'Other',
    ];
    return orderedCats
        .map(name => ({
            name,
            specs: categories[name].sort((a, b) => a.label.localeCompare(b.label)),
        }))
        .filter(c => c.specs.length > 0);
}

// --- Main Mobile Component ---
export function MobileCompare() {
    const router = useRouter();
    const params = useParams();

    const makeSlug = (params.make as string) || '';
    const modelSlug = (params.model as string) || '';

    const { items } = useSystemCatalogLogic();
    const [removedVariantIds, setRemovedVariantIds] = useState<Set<string>>(new Set());

    const modelGroup = useMemo(() => {
        if (!items.length) return null;
        const groups = groupProductsByModel(items);
        return (
            groups.find(g => {
                const gMake = slugify(g.make);
                const gModel = slugify(g.model);
                return gMake === makeSlug && (gModel === modelSlug || g.modelSlug === modelSlug);
            }) || null
        );
    }, [items, makeSlug, modelSlug]);

    const sortedVariants = useMemo(() => {
        if (!modelGroup) return [];
        return [...modelGroup.variants].sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
    }, [modelGroup]);

    const activeVariants = useMemo(
        () => sortedVariants.filter(v => !removedVariantIds.has(v.id)),
        [sortedVariants, removedVariantIds]
    );

    const onRemoveVariant = useCallback(
        (slug: string) => {
            if (activeVariants.length <= 2) return;
            const target = activeVariants.find(v => v.slug === slug);
            if (target) {
                setRemovedVariantIds(prev => new Set(prev).add(target.id));
            }
        },
        [activeVariants]
    );

    // Editable finance params — localStorage-backed
    const [downpayment, _setDownpayment] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('bkmb_downpayment');
            if (stored) return parseInt(stored);
        }
        return 15000;
    });
    const setDownpayment = (val: number) => {
        _setDownpayment(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('bkmb_downpayment', String(val));
            window.dispatchEvent(new CustomEvent('bkmb_dp_changed', { detail: val }));
        }
    };

    // For now, hardcode tenure
    const tenure = 36;

    const onEditDownpayment = () => {
        // Simple prompt for mobile edit as fallback, or use a modal later
        const newVal = prompt('Enter new downpayment amount:', downpayment.toString());
        if (newVal && !isNaN(Number(newVal))) setDownpayment(Number(newVal));
    };

    const allSpecs = useMemo(() => computeAllSpecs(activeVariants), [activeVariants]);

    // Smart Specs
    const smartSpecs = useMemo(() => {
        const diffSpecs: typeof allSpecs = [];
        const restSpecs: typeof allSpecs = [];
        let diffCount = 0;

        allSpecs.forEach(cat => {
            const dSpecs: any[] = [];
            const rSpecs: any[] = [];
            cat.specs.forEach(sp => {
                const vals = new Set(
                    activeVariants.map(v =>
                        formatSpecValue(flattenObject(v.specifications || {})[sp.key] || 'N/A').toLowerCase()
                    )
                );
                if (vals.size > 1 && !vals.has('n/a')) {
                    dSpecs.push(sp);
                    diffCount++;
                } else {
                    rSpecs.push(sp);
                }
            });
            if (dSpecs.length) diffSpecs.push({ name: cat.name, specs: dSpecs });
            if (rSpecs.length) restSpecs.push({ name: cat.name, specs: rSpecs });
        });
        return { diffSpecs, restSpecs, diffCount };
    }, [allSpecs, activeVariants]);

    const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
        const init: any = {};
        smartSpecs.diffSpecs.forEach(c => (init[`diff-${c.name}`] = true));
        smartSpecs.restSpecs.forEach(c => (init[`all-${c.name}`] = false));
        return init;
    });

    const toggleCat = (key: string) => setOpenCats(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="bg-[#0b0d10] text-white min-h-screen pb-20 font-sans selection:bg-[#F4B000]/30">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0b0d10]/95 backdrop-blur-xl border-b border-white/5 pt-safe p-4 flex items-center gap-3">
                <button
                    onClick={() => window.history.back()}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/10"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-black uppercase tracking-widest text-[#F4B000]">Compare</h1>
                    <p className="text-[10px] font-semibold text-slate-400 tracking-widest leading-none">
                        {activeVariants.length} VEHICLES SELECTED
                    </p>
                </div>
            </div>

            {/* Sticky Compare Matrix Header (Swipable) */}
            <div className="sticky top-[73px] z-40 bg-[#0b0d10] border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                <div className="flex w-full">
                    {/* Frozen Left Column (Labels) */}
                    <div className="w-[120px] shrink-0 bg-[#0f1115] border-r border-white/10 flex flex-col justify-end p-3 relative z-10 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.6)]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#F4B000] mb-1">
                            Finances
                        </div>
                        <button
                            onClick={onEditDownpayment}
                            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-white/5 border border-white/10 px-2 py-1.5 rounded-lg active:bg-white/10"
                        >
                            <Pencil size={10} />
                            Edit Terms
                        </button>
                    </div>

                    {/* Scrollable Right Columns (Vehicles) */}
                    <div className="flex-1 overflow-x-auto hide-scrollbar flex snap-x snap-mandatory">
                        {activeVariants.map(v => (
                            <div
                                key={v.id}
                                className="w-[180px] shrink-0 snap-center border-r border-white/5 p-3 relative flex flex-col items-center text-center"
                            >
                                {/* Remove Button */}
                                {activeVariants.length > 2 && (
                                    <button
                                        onClick={() => onRemoveVariant(v.slug)}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30 backdrop-blur-md z-10"
                                    >
                                        <X size={12} />
                                    </button>
                                )}

                                <img
                                    src={v.imageUrl || ''}
                                    alt={v.model}
                                    className="h-20 object-contain mb-2 drop-shadow-xl"
                                />
                                <h3 className="text-[12px] font-black uppercase text-white leading-tight line-clamp-1">
                                    {v.model}
                                </h3>
                                <p className="text-[10px] text-slate-400 truncate w-full">{v.variant}</p>

                                <div className="mt-3 w-full bg-white/5 rounded-xl border border-white/10 p-2">
                                    <p className="text-[14px] font-black text-white leading-none">
                                        ₹{(v.price?.onRoad || v.price?.exShowroom || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-[#F4B000] mt-1 uppercase">
                                        ₹{Math.round(((v.price?.onRoad || 0) - downpayment) * 0.035).toLocaleString()}
                                        /mo
                                    </p>
                                </div>
                            </div>
                        ))}
                        {/* Empty Ghost Slot to encourage adding more if < 4 */}
                        {activeVariants.length < 4 && (
                            <div className="w-[180px] shrink-0 snap-center border-r border-white/5 p-3 flex flex-col items-center justify-center">
                                <button
                                    onClick={() => router.push('/store/catalog')}
                                    className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-[#F4B000] transition-colors"
                                >
                                    <Search size={20} className="mb-1" />
                                </button>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-3">
                                    Add Vehicle
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spec Matrix Content Area */}
            <div className="w-full">
                {/* 1. What's Different Section */}
                {smartSpecs.diffSpecs.length > 0 && (
                    <div className="mt-6">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#F4B000] flex items-center gap-2">
                                <Zap size={14} className="animate-pulse" />
                                Key Differences
                                <span className="bg-[#F4B000]/20 text-[#F4B000] px-2 py-0.5 rounded-full text-[9px]">
                                    {smartSpecs.diffCount}
                                </span>
                            </h2>
                        </div>

                        <div className="border-t border-b border-white/5 bg-[#0f1115]">
                            {smartSpecs.diffSpecs.map((cat, idx) => {
                                const isOpen = openCats[`diff-${cat.name}`];
                                return (
                                    <div key={cat.name} className={`${idx > 0 ? 'border-t border-white/5' : ''}`}>
                                        <button
                                            onClick={() => toggleCat(`diff-${cat.name}`)}
                                            className="w-full flex items-center justify-between p-4 bg-white/[0.02]"
                                        >
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                                                {cat.name}
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp size={14} className="text-slate-500" />
                                            ) : (
                                                <ChevronDown size={14} className="text-slate-500" />
                                            )}
                                        </button>

                                        {isOpen && (
                                            <div className="divide-y divide-white/5 border-t border-white/5">
                                                {cat.specs.map(sp => (
                                                    <div key={sp.key} className="flex">
                                                        <div className="w-[120px] shrink-0 bg-black/40 border-r border-white/5 p-3 flex flex-col justify-center">
                                                            <span className="text-[10px] font-bold text-slate-400 capitalize">
                                                                {sp.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 overflow-x-auto hide-scrollbar flex">
                                                            {activeVariants.map(v => {
                                                                const sMap = flattenObject(v.specifications || {});
                                                                const val = formatSpecValue(sMap[sp.key] || 'N/A');
                                                                const isMissing = val === 'N/A';
                                                                return (
                                                                    <div
                                                                        key={`${v.id}-${sp.key}`}
                                                                        className="w-[180px] shrink-0 border-r border-white/5 p-3 flex items-center justify-center text-center"
                                                                    >
                                                                        {val === 'Yes' ? (
                                                                            <Check
                                                                                size={16}
                                                                                className="text-[#F4B000]"
                                                                            />
                                                                        ) : val === 'No' ? (
                                                                            <X size={16} className="text-slate-600" />
                                                                        ) : (
                                                                            <span
                                                                                className={`text-[11px] font-semibold ${isMissing ? 'text-slate-600' : 'text-slate-200'}`}
                                                                            >
                                                                                {val}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {activeVariants.length < 4 && (
                                                                <div className="w-[180px] shrink-0 border-r border-white/5" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. All Specifications Section */}
                {smartSpecs.restSpecs.length > 0 && (
                    <div className="mt-8">
                        <div className="px-4 py-3 flex items-center justify-between border-t border-white/10">
                            <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-300">
                                All Specifications
                            </h2>
                        </div>

                        <div className="border-t border-b border-white/5 bg-[#0f1115]">
                            {smartSpecs.restSpecs.map((cat, idx) => {
                                const isOpen = openCats[`all-${cat.name}`];
                                return (
                                    <div key={cat.name} className={`${idx > 0 ? 'border-t border-white/5' : ''}`}>
                                        <button
                                            onClick={() => toggleCat(`all-${cat.name}`)}
                                            className="w-full flex items-center justify-between p-4 bg-white/[0.02]"
                                        >
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                                                {cat.name}
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp size={14} className="text-slate-500" />
                                            ) : (
                                                <ChevronDown size={14} className="text-slate-500" />
                                            )}
                                        </button>

                                        {isOpen && (
                                            <div className="divide-y divide-white/5 border-t border-white/5">
                                                {cat.specs.map(sp => (
                                                    <div key={sp.key} className="flex">
                                                        <div className="w-[120px] shrink-0 bg-black/40 border-r border-white/5 p-3 flex flex-col justify-center">
                                                            <span className="text-[10px] font-bold text-slate-500 capitalize">
                                                                {sp.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 flex">
                                                            {/* All variants have the same value here by definition */}
                                                            <div className="flex-1 p-3">
                                                                <span className="text-[11px] font-semibold text-slate-400">
                                                                    {formatSpecValue(
                                                                        flattenObject(
                                                                            activeVariants[0].specifications || {}
                                                                        )[sp.key] || 'N/A'
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
