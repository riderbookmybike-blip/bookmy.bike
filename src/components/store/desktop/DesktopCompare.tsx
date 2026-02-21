'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    GitCompareArrows,
    Menu,
    Search,
    X,
    Share2,
    Check,
    Filter,
    Trophy,
    Gauge,
    Zap,
    Flame,
    Thermometer,
    Wind,
    RotateCw,
    Cog,
    Disc,
    ShieldCheck,
    ArrowDownUp,
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
    IndianRupee,
    Percent,
    CreditCard,
    Calendar,
    TrendingDown,
    type LucideIcon,
} from 'lucide-react';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { groupProductsByModel } from '@/utils/variantGrouping';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import { slugify } from '@/utils/slugs';
import type { ProductVariant } from '@/types/productMaster';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';

// --- Spec Icon Mapping ---
const SPEC_ICON_MAP: Record<string, LucideIcon> = {
    // Engine
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
    // Transmission
    gears: Cog,
    clutch: Disc,
    // Brakes
    front: Disc,
    rear: Disc,
    abs: ShieldCheck,
    // Suspension
    // Battery / EV
    range: BatteryCharging,
    'charging time': Timer,
    capacity: BatteryCharging,
    'motor power': Zap,
    // Dimensions
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
    // Tyres
    'wheel type': Circle,
    'front wheel size': Circle,
    'rear wheel size': Circle,
    // Features
    bluetooth: Bluetooth,
    'usb charging': Usb,
    navigation: Navigation,
    'console type': Monitor,
    'led headlamp': Lightbulb,
    // Extra
    'fuel type': Flame,
    'body type': Bike,
    segment: Footprints,
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    engine: Gauge,
    transmission: Cog,
    brakes: Disc,
    suspension: ArrowDownUp,
    battery: BatteryCharging,
    dimensions: Ruler,
    tyres: Circle,
    features: Lightbulb,
};

function getSpecIcon(label: string): LucideIcon {
    const key = label.toLowerCase();
    return SPEC_ICON_MAP[key] || CircleDot;
}

function getCategoryIcon(category: string): LucideIcon | null {
    const key = category.toLowerCase();
    return CATEGORY_ICON_MAP[key] || null;
}

// --- Spec Diffing Engine ---

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

function categoryFromKey(key: string): string {
    const first = key.split('.')[0] || key;
    return first.replace(/^./, s => s.toUpperCase());
}

type SpecRow = {
    category: string;
    label: string;
    values: (string | null)[];
    isDifferent: boolean;
};

const SPEC_SYNONYMS: Record<string, string> = {
    'dimensions.curbWeight': 'dimensions.kerbWeight',
    curbWeight: 'kerbWeight',
};

function normalizeFlatSpecs(flat: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(flat)) {
        const canonical = SPEC_SYNONYMS[key] || key;
        if (!result[canonical]) result[canonical] = val;
    }
    return result;
}

function normalizeForCompare(val: string): string {
    let s = val.trim().replace(/\s+/g, ' ').toLowerCase();
    s = s.replace(/(\d+\.\d*?)0+(\s|$)/g, '$1$2').replace(/\.(\s|$)/g, '$1');
    return s;
}

function computeAllSpecs(variants: ProductVariant[]): SpecRow[] {
    if (variants.length === 0) return [];
    const flatSpecs = variants.map(v => {
        const raw = flattenObject((v.specifications || {}) as Record<string, any>);
        return normalizeFlatSpecs(raw);
    });
    const extraFields = ['displacement', 'fuelType', 'bodyType', 'segment'] as const;
    for (let i = 0; i < variants.length; i++) {
        for (const field of extraFields) {
            const val = (variants[i] as any)[field];
            if (val !== null && val !== undefined && val !== '') {
                const canonical = SPEC_SYNONYMS[field] || field;
                if (!flatSpecs[i][canonical]) flatSpecs[i][canonical] = String(val);
            }
        }
    }
    const allKeys = new Set<string>();
    flatSpecs.forEach(fs => Object.keys(fs).forEach(k => allKeys.add(k)));
    const rows: SpecRow[] = [];
    for (const key of allKeys) {
        const values = flatSpecs.map(fs => fs[key] || null);
        const nonNull = values.filter((v): v is string => v !== null && v !== '');
        if (nonNull.length === 0) continue;
        const normalized = nonNull.map(normalizeForCompare);
        const allSame = normalized.every(v => v === normalized[0]);
        const isDifferent = !allSame || nonNull.length < variants.length;
        rows.push({ category: categoryFromKey(key), label: labelFromKey(key), values, isDifferent });
    }
    rows.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
    return rows;
}

// --- Best Value ---
const LOWER_IS_BETTER = new Set(['kerbweight', 'curbweight', 'weight', 'chargingtime']);
const HIGHER_IS_BETTER = new Set([
    'mileage',
    'range',
    'rangekm',
    'fuelcapacity',
    'groundclearance',
    'maxpower',
    'maxtorque',
    'displacement',
    'topspeed',
]);

function extractNumeric(val: string): number | null {
    const match = val.match(/[\d,.]+/);
    if (!match) return null;
    const num = parseFloat(match[0].replace(/,/g, ''));
    return isNaN(num) ? null : num;
}

function findBestValueIndex(row: SpecRow): number | null {
    const labelLower = row.label.toLowerCase().replace(/\s+/g, '');
    const isLowerBetter = LOWER_IS_BETTER.has(labelLower);
    const isHigherBetter = HIGHER_IS_BETTER.has(labelLower);
    if (!isLowerBetter && !isHigherBetter) return null;
    const numerics = row.values.map(v => (v ? extractNumeric(v) : null));
    const validIndices = numerics.map((n, i) => (n !== null ? i : -1)).filter(i => i >= 0);
    if (validIndices.length < 2) return null;
    let bestIdx = validIndices[0];
    for (const idx of validIndices) {
        const current = numerics[idx]!;
        const best = numerics[bestIdx]!;
        if (isLowerBetter && current < best) bestIdx = idx;
        if (isHigherBetter && current > best) bestIdx = idx;
    }
    const bestVal = numerics[bestIdx]!;
    if (validIndices.every(i => i === bestIdx || numerics[i] === bestVal)) return null;
    return bestIdx;
}

// --- Value Formatting ---
const UNIT_MAP: Record<string, string> = {
    'arai mileage': 'km/l',
    mileage: 'km/l',
    'seat height': 'mm',
    'ground clearance': 'mm',
    wheelbase: 'mm',
    'kerb weight': 'kg',
    'fuel capacity': 'L',
    'overall length': 'mm',
    'overall width': 'mm',
    'overall height': 'mm',
};

const NUMERIC_BAR_SPECS = new Set([
    'arai mileage',
    'mileage',
    'seat height',
    'ground clearance',
    'kerb weight',
    'fuel capacity',
    'top speed',
    'max power',
    'max torque',
    'displacement',
    'overall length',
    'overall width',
    'overall height',
    'wheelbase',
]);

function getBarPercent(val: string | null, allValues: (string | null)[]): number | null {
    if (!val) return null;
    const num = extractNumeric(val);
    if (num === null) return null;
    const nums = allValues.map(v => (v ? extractNumeric(v) : null)).filter((n): n is number => n !== null);
    if (nums.length < 2) return null;
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max === min) return 100;
    return Math.round(((num - min) / (max - min)) * 60 + 40); // 40-100% range
}

function formatSpecValue(val: string | null, label: string): React.ReactNode {
    if (!val) return <span className="text-slate-300 dark:text-white/20 italic">—</span>;

    const lower = val.trim().toLowerCase();

    // Boolean → icon
    if (lower === 'true' || lower === 'yes') {
        return (
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
            </div>
        );
    }
    if (lower === 'false' || lower === 'no') {
        return (
            <div className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <X size={12} className="text-red-400 dark:text-red-400/70" />
            </div>
        );
    }

    // Explicit value overrides for cleaner display
    const VALUE_OVERRIDES: Record<string, string> = {
        KICK_AND_ELECTRIC: 'Kick & Electric',
        KICK: 'Kick Start',
        ELECTRIC: 'Electric Start',
        SELF_START: 'Self Start',
        DIGITAL_TFT: 'Digital TFT',
        DIGITAL_LCD: 'Digital LCD',
        DIGITAL: 'Digital',
        ANALOG: 'Analog',
        COMBI_BRAKE: 'Combi Brake',
        SINGLE_CHANNEL_ABS: 'Single Channel ABS',
        DUAL_CHANNEL_ABS: 'Dual Channel ABS',
        DISC_DRUM: 'Disc + Drum',
        DRUM_DRUM: 'Drum + Drum',
        DISC_DISC: 'Disc + Disc',
        TUBELESS: 'Tubeless',
        TUBE_TYPE: 'Tube Type',
        ALLOY: 'Alloy',
        SPOKE: 'Spoke',
        STEEL: 'Steel',
        CVT: 'CVT (Automatic)',
        MANUAL: 'Manual',
        AIR_COOLED: 'Air Cooled',
        LIQUID_COOLED: 'Liquid Cooled',
        OIL_COOLED: 'Oil Cooled',
        TELESCOPIC: 'Telescopic',
        UNDER_BONE: 'Under Bone',
        DIAMOND: 'Diamond',
        SBT: 'Combi Brake',
        CBS: 'Combi Brake',
        ABS: 'ABS',
        NONE: 'None',
    };

    let display = val.trim();
    if (VALUE_OVERRIDES[display]) {
        display = VALUE_OVERRIDES[display];
    } else if (/^[A-Z][A-Z_]+$/.test(display)) {
        // ALL_CAPS or ALLCAPS → Title Case
        display = display
            .split('_')
            .map(w => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
    }

    // Styled number + unit
    const labelLower = label.toLowerCase();
    const unit = UNIT_MAP[labelLower];
    if (unit && /^\d+(\.\d+)?$/.test(display.trim())) {
        return (
            <>
                <span className="font-black">{display}</span>
                <span className="text-[9px] font-medium text-slate-400 ml-0.5">{unit}</span>
            </>
        );
    }

    return display;
}

// --- Pricing helpers (same as catalog) ---
const EMI_FACTORS: Record<number, number> = { 12: 0.091, 24: 0.049, 36: 0.035, 48: 0.028, 60: 0.024 };

function getDisplayPrice(v: ProductVariant): number {
    return v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;
}

function getEmi(v: ProductVariant, downpayment = 15000, tenure = 36): number {
    const loan = Math.max(0, getDisplayPrice(v) - downpayment);
    return Math.max(0, Math.round(loan * (EMI_FACTORS[tenure] ?? EMI_FACTORS[36])));
}

// --- Page Component ---

export default function DesktopCompare() {
    const params = useParams();
    const router = useRouter();
    const makeSlug = (params.make as string) || '';
    const modelSlug = (params.model as string) || '';

    const { items, isLoading } = useSystemCatalogLogic();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDiffOnly, setShowDiffOnly] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [shareTooltip, setShareTooltip] = useState(false);
    // Per-variant selected color image and hex for compact cards
    const [compactColorImages, setCompactColorImages] = useState<Record<string, string>>({});
    const [compactColorHexes, setCompactColorHexes] = useState<Record<string, string>>({});
    // Removed variants
    const [removedVariantIds, setRemovedVariantIds] = useState<Set<string>>(new Set());
    // Editable finance params (shared across all variants) — localStorage-backed
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
    const [isDpEditOpen, setIsDpEditOpen] = useState(false);
    const [dpDraft, setDpDraft] = useState(downpayment);
    const openDpEdit = () => {
        setDpDraft(downpayment);
        setIsDpEditOpen(true);
    };
    const applyDp = (val: number) => {
        setDownpayment(val);
        setIsDpEditOpen(false);
    };
    const [tenure, setTenure] = useState(36);
    const [editingDownpayment, setEditingDownpayment] = useState(false);
    const [editingTenure, setEditingTenure] = useState(false);
    const [dpInputValue, setDpInputValue] = useState('15000');
    const [tenureInputValue, setTenureInputValue] = useState('36');
    const TENURE_OPTIONS = [12, 24, 36, 48, 60];

    // Scroll-morph state
    const [compactMode, setCompactMode] = useState(false);
    const [stickyHeight, setStickyHeight] = useState(0);
    const fullCardsRef = useRef<HTMLDivElement>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);

    // Measure full cards height on mount
    useEffect(() => {
        const el = fullCardsRef.current;
        if (el && stickyHeight === 0) {
            // Wait for cards to render
            const t = setTimeout(() => {
                setStickyHeight(el.offsetHeight);
            }, 500);
            return () => clearTimeout(t);
        }
    }, [items, stickyHeight]);

    // Scroll listener: when scroll anchor goes above viewport → switch to compact
    useEffect(() => {
        const onScroll = () => {
            const anchor = scrollAnchorRef.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            // When the bottom of the scroll-anchor (which reserves full card height)
            // is near/above the viewport header area, switch to compact
            setCompactMode(rect.bottom < 160);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

    const removeVariant = useCallback(
        (id: string) => {
            // Don't allow removing if only 2 variants left
            if (activeVariants.length <= 2) return;
            setRemovedVariantIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
        },
        [activeVariants.length]
    );

    const restoreAllVariants = useCallback(() => {
        setRemovedVariantIds(new Set());
    }, []);

    const allSpecs = useMemo(() => computeAllSpecs(activeVariants), [activeVariants]);

    // Smart sorting: differences first, then decision-important specs, then rest
    const DECISION_SPECS = new Set([
        'mileage',
        'seat height',
        'ground clearance',
        'kerb weight',
        'fuel capacity',
        'headlight',
        'top speed',
        'max power',
        'max torque',
        'displacement',
        'abs',
        'body type',
        'overall length',
        'overall width',
        'overall height',
        'wheelbase',
        'charging time',
        'range',
        'battery capacity',
        'motor power',
        'front brake',
        'rear brake',
        'front suspension',
        'rear suspension',
        'front tyre',
        'rear tyre',
        'type',
        'starting',
    ]);

    // Priority order for "All Specifications" — mileage first, then key decision specs
    const SPEC_PRIORITY: Record<string, number> = {
        'arai mileage': 1,
        mileage: 1,
        'seat height': 2,
        'ground clearance': 3,
        'kerb weight': 4,
        'fuel capacity': 5,
        'top speed': 6,
        'max power': 7,
        'max torque': 8,
        displacement: 9,
        'headlamp type': 10,
        abs: 11,
        'front brake': 12,
        'rear brake': 13,
        'front suspension': 14,
        'rear suspension': 15,
        'overall length': 16,
        'overall width': 17,
        'overall height': 18,
        wheelbase: 19,
        'front tyre': 20,
        'rear tyre': 21,
    };

    const smartSpecs = useMemo(() => {
        const diffSpecs = allSpecs.filter(s => s.isDifferent);
        const restSpecs = allSpecs
            .filter(s => !s.isDifferent)
            .sort((a, b) => {
                const pa = SPEC_PRIORITY[a.label.toLowerCase()] || 999;
                const pb = SPEC_PRIORITY[b.label.toLowerCase()] || 999;
                return pa - pb;
            });
        return { diffSpecs, restSpecs };
    }, [allSpecs]);

    const diffCount = useMemo(() => allSpecs.filter(s => s.isDifferent).length, [allSpecs]);

    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
        } catch {
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#F4B000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        Loading variants...
                    </p>
                </div>
            </div>
        );
    }

    if (!modelGroup || sortedVariants.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg font-black uppercase tracking-widest text-slate-400">Model not found</p>
                    <button
                        onClick={() => router.push('/store/catalog')}
                        className="px-6 py-3 bg-[#F4B000] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        Back to Catalog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d10] transition-colors duration-500">
                {/* Discovery Bar */}
                <div className="page-container pt-4 pb-4">
                    <header className="hidden md:block sticky z-[90] py-0" style={{ top: 'var(--header-h)' }}>
                        <div className="w-full">
                            <div className="rounded-full bg-slate-50/15 dark:bg-[#0b0d10]/25 backdrop-blur-3xl border border-slate-200 dark:border-white/10 shadow-2xl h-14 px-4 flex items-center">
                                <div className="flex items-center gap-3 w-full">
                                    <button
                                        onClick={() => router.push('/store/catalog')}
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white shrink-0"
                                        title="Back to Catalog"
                                    >
                                        <Menu size={16} />
                                    </button>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 w-full bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 h-10">
                                            <Search size={14} className="text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search brand, product, variant"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="flex-1 min-w-0 bg-transparent text-[11px] font-black tracking-widest uppercase focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={handleShare}
                                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-[#F4B000] hover:border-[#F4B000]/30 transition-all shrink-0"
                                            title="Share Comparison"
                                        >
                                            {shareTooltip ? (
                                                <Check size={16} className="text-emerald-500" />
                                            ) : (
                                                <Share2 size={16} />
                                            )}
                                        </button>
                                        {shareTooltip && (
                                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg whitespace-nowrap shadow-xl z-50">
                                                Link Copied!
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                </div>

                {/* ────── Full Cards (normal flow — scrolls away) ────── */}
                <div ref={fullCardsRef} className="page-container pb-4">
                    <div ref={scrollAnchorRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        {activeVariants.map(v => (
                            <ProductCard
                                key={v.id}
                                v={v}
                                viewMode="grid"
                                downpayment={downpayment}
                                tenure={tenure}
                                onEditDownpayment={openDpEdit}
                            />
                        ))}
                    </div>
                </div>

                {/* ────── Sticky Compact Bar + Specs (same parent so sticky persists) ────── */}
                {allSpecs.length > 0 && (
                    <div>
                        {/* Compact bar — sticky, freezes below header */}
                        <div
                            className="sticky z-[50] transition-all duration-500 ease-in-out"
                            style={{
                                top: 'var(--header-h, 80px)',
                                maxHeight: compactMode ? '160px' : '0px',
                                opacity: compactMode ? 1 : 0,
                                overflow: 'hidden',
                            }}
                        >
                            <div className="page-container py-1">
                                <div className="bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-0 py-2">
                                    <div className="flex items-stretch">
                                        {/* Left label column — matches 180px spec key column */}
                                        <div className="w-[180px] shrink-0 flex flex-col items-center justify-center px-3 border-r border-black/[0.04] dark:border-white/5">
                                            <GitCompareArrows size={18} className="text-[#F4B000] mb-1.5" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 text-center leading-tight">
                                                {activeVariants.length} Variants
                                            </span>
                                            {/* Restore all button */}
                                            {removedVariantIds.size > 0 && (
                                                <button
                                                    onClick={restoreAllVariants}
                                                    className="mt-1.5 px-2 py-0.5 rounded-md bg-[#F4B000]/10 text-[#F4B000] text-[7px] font-black uppercase tracking-widest hover:bg-[#F4B000]/20 transition-colors"
                                                    title="Restore removed variants"
                                                >
                                                    +{removedVariantIds.size} back
                                                </button>
                                            )}
                                        </div>
                                        {/* Variant cards grid */}
                                        <div
                                            className="grid gap-1.5 flex-1 px-2"
                                            style={{ gridTemplateColumns: `repeat(${activeVariants.length}, 1fr)` }}
                                        >
                                            {activeVariants.map((v, i) => {
                                                const price = getDisplayPrice(v);
                                                const bCoin = coinsNeededForPrice(price);
                                                const isCheapest = i === 0;
                                                const swatches = (v.availableColors || [])
                                                    .filter(
                                                        c =>
                                                            typeof c?.hexCode === 'string' &&
                                                            c.hexCode.trim().length > 0
                                                    )
                                                    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
                                                const currentImage =
                                                    compactColorImages[v.id] ||
                                                    v.imageUrl ||
                                                    '/images/categories/motorcycle_nobg.png';
                                                const currentHex =
                                                    compactColorHexes[v.id] || swatches[0]?.hexCode || null;
                                                return (
                                                    <div
                                                        key={v.id}
                                                        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                                                            isCheapest
                                                                ? 'border border-[#F4B000]/20'
                                                                : 'border border-transparent'
                                                        }`}
                                                        style={{
                                                            backgroundColor: currentHex
                                                                ? `${currentHex}1A`
                                                                : isCheapest
                                                                  ? 'rgba(244,176,0,0.05)'
                                                                  : 'rgba(248,250,252,0.6)',
                                                        }}
                                                    >
                                                        {/* Remove Button */}
                                                        {activeVariants.length > 2 && (
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    removeVariant(v.id);
                                                                }}
                                                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white text-slate-400 transition-all z-10"
                                                                title="Remove from comparison"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        )}
                                                        <div className="w-14 h-14 shrink-0">
                                                            <img
                                                                src={currentImage}
                                                                alt={v.variant}
                                                                className="w-full h-full object-contain transition-all duration-300"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 truncate leading-tight">
                                                                {v.make} {v.model}
                                                            </p>
                                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white truncate leading-tight mt-0.5">
                                                                {v.variant}
                                                            </p>
                                                            {/* Color Swatches */}
                                                            {swatches.length > 0 && (
                                                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                                    {swatches.map((c, ci) => (
                                                                        <button
                                                                            key={ci}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                if (c.imageUrl) {
                                                                                    setCompactColorImages(prev => ({
                                                                                        ...prev,
                                                                                        [v.id]: c.imageUrl!,
                                                                                    }));
                                                                                }
                                                                                if (c.hexCode) {
                                                                                    setCompactColorHexes(prev => ({
                                                                                        ...prev,
                                                                                        [v.id]: c.hexCode,
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            className={`w-3 h-3 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:scale-125 transition-all duration-200 cursor-pointer relative overflow-hidden ${
                                                                                currentHex === c.hexCode
                                                                                    ? 'ring-1.5 ring-[#F4B000] ring-offset-1'
                                                                                    : ''
                                                                            }`}
                                                                            style={{ background: c.hexCode }}
                                                                            title={c.name}
                                                                        >
                                                                            {c.finish?.toUpperCase() === 'GLOSS' && (
                                                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-white/20 pointer-events-none" />
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="page-container py-6">
                            <div className="bg-white dark:bg-[#0f1115] border border-black/[0.04] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                                {/* ── Financial Comparison Section ── */}
                                <div>
                                    <div className="px-4 py-2.5 border-b border-black/[0.04] dark:border-white/5 bg-gradient-to-r from-[#F4B000]/5 to-transparent">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={12} className="text-[#F4B000]/60" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F4B000]">
                                                Pricing & Finance
                                            </span>
                                        </div>
                                    </div>
                                    {/* 1. On-Road Price */}
                                    <div
                                        className="grid border-b border-black/[0.04] dark:border-white/5"
                                        style={{ gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            <IndianRupee
                                                size={12}
                                                className="text-slate-300 dark:text-white/20 shrink-0"
                                            />
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                On-Road Price
                                            </span>
                                        </div>
                                        {activeVariants.map((v, vIdx) => (
                                            <div
                                                key={vIdx}
                                                className={`px-4 py-3 flex items-center justify-center text-center ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                            >
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                    ₹
                                                    {(v.price?.onRoad || v.price?.exShowroom || 0).toLocaleString(
                                                        'en-IN'
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* 2. Discount / Surge */}
                                    <div
                                        className="grid border-b border-black/[0.04] dark:border-white/5"
                                        style={{ gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            <TrendingDown
                                                size={12}
                                                className="text-slate-300 dark:text-white/20 shrink-0"
                                            />
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                Discount / Surge
                                            </span>
                                        </div>
                                        {activeVariants.map((v, vIdx) => {
                                            const disc = v.price?.discount || 0;
                                            const isDiscount = disc > 0;
                                            const isSurge = disc < 0;
                                            return (
                                                <div
                                                    key={vIdx}
                                                    className={`px-4 py-3 flex items-center justify-center text-center ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                                >
                                                    <span
                                                        className={`text-[11px] font-black ${isDiscount ? 'text-emerald-600' : isSurge ? 'text-red-500' : 'text-slate-400'}`}
                                                    >
                                                        {isDiscount
                                                            ? `−₹${disc.toLocaleString('en-IN')}`
                                                            : isSurge
                                                              ? `+₹${Math.abs(disc).toLocaleString('en-IN')}`
                                                              : '—'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* 3. Offer Price (INR) + B Coin side by side */}
                                    <div
                                        className="grid border-b border-black/[0.04] dark:border-white/5 bg-[#F4B000]/[0.04]"
                                        style={{ gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            <IndianRupee size={12} className="text-[#F4B000]/70 shrink-0" />
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                                Offer Price
                                            </span>
                                        </div>
                                        {activeVariants.map((v, vIdx) => {
                                            const offerPrice = getDisplayPrice(v);
                                            const bCoin = coinsNeededForPrice(offerPrice);
                                            return (
                                                <div
                                                    key={vIdx}
                                                    className={`px-4 py-3 flex items-center justify-center gap-2 text-center ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                                >
                                                    <span className="text-[12px] font-black text-slate-900 dark:text-white">
                                                        ₹{offerPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-[8px] text-slate-300">|</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Logo variant="icon" size={10} />
                                                        <span className="text-[10px] font-black text-[#F4B000] italic">
                                                            {bCoin.toLocaleString('en-IN')}
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* 4. Downpayment (editable, shared) */}
                                    <div
                                        className="grid border-b border-black/[0.04] dark:border-white/5"
                                        style={{ gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            <CreditCard
                                                size={12}
                                                className="text-slate-300 dark:text-white/20 shrink-0"
                                            />
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                Downpayment
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setEditingDownpayment(true);
                                                    setDpInputValue(String(downpayment));
                                                }}
                                                className="ml-auto text-slate-300 hover:text-[#F4B000] transition-colors"
                                                title="Edit downpayment for all variants"
                                            >
                                                <Pencil size={10} />
                                            </button>
                                        </div>
                                        {activeVariants.map((_, vIdx) => (
                                            <div
                                                key={vIdx}
                                                className={`px-4 py-3 flex items-center justify-center text-center ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                            >
                                                {editingDownpayment ? (
                                                    <input
                                                        type="number"
                                                        value={dpInputValue}
                                                        onChange={e => setDpInputValue(e.target.value)}
                                                        onBlur={() => {
                                                            const val = parseInt(dpInputValue);
                                                            if (!isNaN(val) && val >= 0) setDownpayment(val);
                                                            setEditingDownpayment(false);
                                                        }}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                const val = parseInt(dpInputValue);
                                                                if (!isNaN(val) && val >= 0) setDownpayment(val);
                                                                setEditingDownpayment(false);
                                                            }
                                                        }}
                                                        autoFocus={vIdx === 0}
                                                        className="w-20 text-center text-[11px] font-black bg-[#F4B000]/10 border border-[#F4B000]/30 rounded-lg px-2 py-1 outline-none focus:border-[#F4B000]"
                                                    />
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                        ₹{downpayment.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* 5. Tenure (editable, shared) */}
                                    <div
                                        className="grid border-b border-black/[0.04] dark:border-white/5"
                                        style={{ gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            <Calendar
                                                size={12}
                                                className="text-slate-300 dark:text-white/20 shrink-0"
                                            />
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                Tenure
                                            </span>
                                            <button
                                                onClick={() => setEditingTenure(!editingTenure)}
                                                className="ml-auto text-slate-300 hover:text-[#F4B000] transition-colors"
                                                title="Change tenure for all variants"
                                            >
                                                <Pencil size={10} />
                                            </button>
                                        </div>
                                        {activeVariants.map((_, vIdx) => (
                                            <div
                                                key={vIdx}
                                                className={`px-4 py-3 flex items-center justify-center text-center ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                            >
                                                {editingTenure ? (
                                                    <div className="flex gap-1 flex-wrap justify-center">
                                                        {TENURE_OPTIONS.map(t => (
                                                            <button
                                                                key={t}
                                                                onClick={() => {
                                                                    setTenure(t);
                                                                    setEditingTenure(false);
                                                                }}
                                                                className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${
                                                                    tenure === t
                                                                        ? 'bg-[#F4B000] text-black'
                                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-[#F4B000]/20 hover:text-[#F4B000]'
                                                                }`}
                                                            >
                                                                {t}mo
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                        {tenure} months
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* 6. EMI */}
                                    <div
                                        className="grid border-b-2 border-[#F4B000]/20"
                                        style={{ gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)` }}
                                    >
                                        <div className="px-4 py-3 bg-[#F4B000]/[0.06] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                            <CreditCard size={12} className="text-[#F4B000]/70 shrink-0" />
                                            <span className="text-[10px] font-bold text-[#F4B000]">EMI</span>
                                        </div>
                                        {activeVariants.map((v, vIdx) => (
                                            <div
                                                key={vIdx}
                                                className={`px-4 py-3 flex items-center justify-center text-center bg-[#F4B000]/[0.04] ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                            >
                                                <span className="text-[12px] font-black text-[#F4B000]">
                                                    ₹{getEmi(v, downpayment, tenure).toLocaleString('en-IN')}/mo
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Smart Spec Rows ── */}
                                {/* Section 1: What's Different */}
                                {smartSpecs.diffSpecs.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 border-b border-black/[0.04] dark:border-white/5 bg-gradient-to-r from-[#F4B000]/5 to-transparent">
                                            <div className="flex items-center gap-2">
                                                <GitCompareArrows size={12} className="text-[#F4B000]/60" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F4B000]">
                                                    What&apos;s Different
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-[#F4B000]/10 text-[#F4B000] text-[8px] font-black rounded-md">
                                                    {smartSpecs.diffSpecs.length}
                                                </span>
                                            </div>
                                        </div>
                                        {smartSpecs.diffSpecs.map((row, rIdx) => {
                                            const bestIdx = findBestValueIndex(row);
                                            return (
                                                <div
                                                    key={`diff-${rIdx}`}
                                                    className="grid border-b border-black/[0.04] dark:border-white/5 last:border-b-0 bg-[#F4B000]/[0.04] hover:bg-[#F4B000]/[0.08] transition-colors"
                                                    style={{
                                                        gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                    }}
                                                >
                                                    <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                                        {(() => {
                                                            const SpecIcon = getSpecIcon(row.label);
                                                            return (
                                                                <SpecIcon
                                                                    size={12}
                                                                    className="shrink-0 text-[#F4B000]/70"
                                                                />
                                                            );
                                                        })()}
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                                            {row.label}
                                                        </span>
                                                    </div>
                                                    {row.values.map((val, vIdx) => {
                                                        const isBest = bestIdx === vIdx;
                                                        const isUnique =
                                                            val && row.values.filter(v => v === val).length === 1;
                                                        const barPct = NUMERIC_BAR_SPECS.has(row.label.toLowerCase())
                                                            ? getBarPercent(val, row.values)
                                                            : null;
                                                        return (
                                                            <div
                                                                key={vIdx}
                                                                className={`px-4 py-3 flex flex-col items-center justify-center text-center gap-1 ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''} ${isBest ? 'bg-emerald-50/60 dark:bg-emerald-500/[0.06]' : ''}`}
                                                            >
                                                                <span
                                                                    className={`text-[11px] font-semibold ${!val ? 'text-slate-300 dark:text-white/20 italic' : isBest ? 'text-emerald-600 dark:text-emerald-400 font-black' : isUnique ? 'text-[#F4B000] font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                                                                >
                                                                    {isBest && (
                                                                        <Trophy
                                                                            size={10}
                                                                            className="inline mr-1 -mt-0.5"
                                                                        />
                                                                    )}
                                                                    {formatSpecValue(val, row.label)}
                                                                </span>
                                                                {barPct !== null && (
                                                                    <div className="w-full max-w-[80px] h-1 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${isBest ? 'bg-emerald-400' : 'bg-[#F4B000]/40'}`}
                                                                            style={{ width: `${barPct}%` }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Section 2: All Specifications */}
                                {smartSpecs.restSpecs.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 border-b border-black/[0.04] dark:border-white/5 bg-gradient-to-r from-slate-100/60 dark:from-white/[0.02] to-transparent">
                                            <div className="flex items-center gap-2">
                                                <CircleDot size={12} className="text-slate-400" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                                    All Specifications
                                                </span>
                                            </div>
                                        </div>
                                        {smartSpecs.restSpecs.map((row, rIdx) => (
                                            <div
                                                key={`rest-${rIdx}`}
                                                className={`grid border-b border-black/[0.04] dark:border-white/5 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${rIdx % 2 === 1 ? 'bg-slate-50/30 dark:bg-white/[0.008]' : ''}`}
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-3 bg-slate-50/40 dark:bg-white/[0.01] border-r border-black/[0.04] dark:border-white/5 flex items-center gap-1.5">
                                                    {(() => {
                                                        const SpecIcon = getSpecIcon(row.label);
                                                        return (
                                                            <SpecIcon
                                                                size={12}
                                                                className="shrink-0 text-slate-300 dark:text-white/20"
                                                            />
                                                        );
                                                    })()}
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                        {row.label}
                                                    </span>
                                                </div>
                                                {row.values.map((val, vIdx) => {
                                                    const isNumeric =
                                                        val &&
                                                        NUMERIC_BAR_SPECS.has(row.label.toLowerCase()) &&
                                                        extractNumeric(val) !== null;
                                                    return (
                                                        <div
                                                            key={vIdx}
                                                            className={`px-4 py-3 flex flex-col items-center justify-center text-center gap-1 ${vIdx < activeVariants.length - 1 ? 'border-r border-black/[0.04] dark:border-white/5' : ''}`}
                                                        >
                                                            <span
                                                                className={`text-[11px] font-semibold ${!val ? 'text-slate-300 dark:text-white/20 italic' : 'text-slate-700 dark:text-slate-300'}`}
                                                            >
                                                                {formatSpecValue(val, row.label)}
                                                            </span>
                                                            {isNumeric && (
                                                                <div className="w-full max-w-[60px] h-[2px] rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-white/5 dark:via-white/10 dark:to-white/5" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Finance Edit — full-width bottom sheet */}
            {isDpEditOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-end justify-center"
                    onClick={() => setIsDpEditOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <div
                        onClick={e => e.stopPropagation()}
                        className="relative z-10 w-full max-w-2xl mx-auto rounded-t-3xl bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                Finance Settings
                            </h3>
                            <button
                                onClick={() => setIsDpEditOpen(false)}
                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Downpayment */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Downpayment
                                </span>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    ₹{dpDraft.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100000}
                                step={1000}
                                value={dpDraft}
                                onChange={e => setDpDraft(Number(e.target.value))}
                                className="w-full accent-[#F4B000] h-2 rounded-full"
                            />
                            <div className="flex justify-between text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                <span>₹0</span>
                                <span>₹25K</span>
                                <span>₹50K</span>
                                <span>₹75K</span>
                                <span>₹1L</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {[5000, 10000, 15000, 20000, 30000, 50000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setDpDraft(val)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${dpDraft === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-[#F4B000]/30'}`}
                                    >
                                        ₹{val / 1000}K
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tenure */}
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Tenure
                                </span>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    {tenure} months
                                </span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                {[12, 24, 36, 48, 60].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setTenure(val)}
                                        className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${tenure === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-[#F4B000]/30'}`}
                                    >
                                        {val}mo
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => applyDp(dpDraft)}
                            className="w-full py-3 rounded-xl bg-[#F4B000] hover:bg-[#FFD700] text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#F4B000]/20 transition-all hover:-translate-y-0.5"
                        >
                            Apply to All
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
