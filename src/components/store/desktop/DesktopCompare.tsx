'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    GitCompareArrows,
    Menu,
    Search,
    X,
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
    Share2,
    ImageIcon,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import { DiscoveryBar } from '@/components/store/DiscoveryBar';
import { useSystemCompareLogic } from '@/hooks/useSystemCompareLogic';
import {
    computeSpecRows,
    findBestValueIndex,
    extractNumeric,
    formatSpecValue as formatSpecValuePlain,
    getDisplayPrice,
    getEmi,
    EMI_FACTORS,
    UNIT_MAP,
    NUMERIC_BAR_SPECS,
    getBarPercent,
    type SpecRow,
} from '@/hooks/compareUtils';
import { useDiscovery } from '@/contexts/DiscoveryContext';

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

// Spec utilities are imported from @/hooks/compareUtils

// Desktop-specific formatSpecValue — returns React nodes (icons for booleans, styled units)
function formatSpecValue(val: string | null, label: string): React.ReactNode {
    if (!val) return <span className="text-slate-300 italic">—</span>;

    const lower = val.trim().toLowerCase();

    if (lower === 'true' || lower === 'yes') {
        return (
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check size={12} className="text-emerald-600" />
            </div>
        );
    }
    if (lower === 'false' || lower === 'no') {
        return (
            <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                <X size={12} className="text-red-400" />
            </div>
        );
    }

    // Use shared plain formatter for value display normalization
    const display = formatSpecValuePlain(val);

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

// --- Page Component ---

export default function DesktopCompare() {
    const router = useRouter();

    const {
        makeSlug,
        modelSlug,
        isMixedMode,
        items,
        isLoading,
        needsLocation,
        modelGroup,
        activeVariants,
        sortedVariants,
        removedVariantIds,
        removeVariant,
        restoreAllVariants,
        downpayment,
        setDownpayment,
        tenure,
        setTenure,
    } = useSystemCompareLogic();

    const [searchQuery, setSearchQuery] = useState('');
    const [showDiffOnly, setShowDiffOnly] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [shareTooltip, setShareTooltip] = useState(false);
    // Per-variant selected color image and hex for compact cards
    const [compactColorImages, setCompactColorImages] = useState<Record<string, string>>({});
    const [compactColorHexes, setCompactColorHexes] = useState<Record<string, string>>({});
    // Ripple state for swatch interaction
    const [ripples, setRipples] = useState<Record<string, { color: string; key: number }>>({});
    // Downpayment edit UI state (desktop-specific)
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
    const [editingDownpayment, setEditingDownpayment] = useState(false);
    const [editingTenure, setEditingTenure] = useState(false);
    const [dpInputValue, setDpInputValue] = useState('15000');
    const [tenureInputValue, setTenureInputValue] = useState('36');
    const TENURE_OPTIONS = [12, 24, 36, 48, 60];

    // Scroll-morph state
    const [compactMode, setCompactMode] = useState(false);
    const { pricingMode, setPricingMode } = useDiscovery();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [isPricingExpanded, setIsPricingExpanded] = useState(true);
    const [isDiffExpanded, setIsDiffExpanded] = useState(true);
    const [isAllSpecsExpanded, setIsAllSpecsExpanded] = useState(true);
    const fullCardsRef = useRef<HTMLDivElement>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);

    // compactMode is static — no auto-flip on scroll (user controls view mode manually)

    const allSpecs = useMemo(() => computeSpecRows(activeVariants), [activeVariants]);

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

    const shareMessage = useMemo(() => {
        if (!activeVariants.length) return 'Compare two-wheelers on BookMyBike.';

        const uniqueModels = Array.from(
            new Map(
                activeVariants.map(v => {
                    const modelKey = `${v.make} ${v.model}`.trim();
                    return [modelKey.toLowerCase(), modelKey];
                })
            ).values()
        );

        const sameModelCompare = uniqueModels.length === 1;
        const variantNames = activeVariants
            .map(v => v.variant)
            .filter(Boolean)
            .join(', ');

        const title = sameModelCompare
            ? `Here are the details of ${uniqueModels[0]} variants${variantNames ? `: ${variantNames}` : ''}.`
            : `Here are the details of ${uniqueModels.join(', ')} comparison.`;

        const variantLines = activeVariants.map(v => {
            const price = getDisplayPrice(v);
            const emi = getEmi(v, downpayment, tenure);
            const variantLabel = [v.make, v.model, v.variant].filter(Boolean).join(' ');
            return `- ${variantLabel}: On-road ₹${price.toLocaleString('en-IN')} | EMI ₹${emi.toLocaleString('en-IN')}/mo`;
        });

        return [title, '', ...variantLines, '', 'Shared via BookMyBike'].join('\n');
    }, [activeVariants, downpayment, tenure]);

    const handleShare = async () => {
        const url = window.location.href;
        const textToShare = `${shareMessage}\n\nCompare link: ${url}`;
        try {
            await navigator.clipboard.writeText(textToShare);
        } catch {
            const input = document.createElement('textarea');
            input.value = textToShare;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.focus();
            input.setSelectionRange(0, textToShare.length);
            document.execCommand('copy');
            document.body.removeChild(input);
        }
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#F4B000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        Loading variants...
                    </p>
                </div>
            </div>
        );
    }

    // No location set — show a friendly prompt instead of blank state
    if (needsLocation) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-5 max-w-xs">
                    <div className="w-14 h-14 rounded-full bg-[#F4B000]/10 flex items-center justify-center mx-auto">
                        <Navigation size={24} className="text-[#F4B000]" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[13px] font-black uppercase tracking-widest text-slate-800">
                            Set Your Location
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            We need your city/district to show accurate on-road prices for {makeSlug} {modelSlug}{' '}
                            variants.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/store/catalog')}
                        className="px-6 py-3 bg-[#F4B000] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#FFD700] transition-colors"
                    >
                        Go to Catalog → Set Location
                    </button>
                </div>
            </div>
        );
    }

    if (!isMixedMode && (!modelGroup || sortedVariants.length === 0)) {
        // If items haven't loaded yet (e.g. due to a race between StrictMode abort
        // and the second fetch), keep showing the spinner — don't flash "Model not found".
        if (items.length === 0 || isLoading) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="flex-col items-center gap-4 flex">
                        <div className="w-10 h-10 border-2 border-[#F4B000] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            Loading variants...
                        </p>
                    </div>
                </div>
            );
        }
        // Items are loaded but this make/model genuinely doesn't exist in catalog
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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

    if (activeVariants.length === 0 && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg font-black uppercase tracking-widest text-slate-400">Nothing to compare</p>
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
            <div className="min-h-screen bg-slate-50 transition-colors duration-500">
                {/* Main content with header + cards — same structure as Catalog */}
                <div className="flex-1 store-page-shell">
                    {/* ────── 3D Flip Sticky Header ────── */}
                    <div
                        className="sticky z-[90] w-full transition-all duration-500 ease-in-out"
                        style={{ top: 'var(--header-h)' }}
                    >
                        <div style={{ perspective: '1200px' }}>
                            <motion.div
                                initial={false}
                                animate={{
                                    rotateX: compactMode && allSpecs.length > 0 ? -180 : 0,
                                    height: compactMode && allSpecs.length > 0 ? '104px' : '56px',
                                }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                style={{ transformStyle: 'preserve-3d' }}
                                className="relative w-full"
                            >
                                {/* ── FRONT FACE: Discovery Bar ── */}
                                <div
                                    className="absolute inset-0 w-full"
                                    style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                                >
                                    <DiscoveryBar
                                        disableSticky={true}
                                        onFilterClick={() => router.push('/store/catalog')}
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onShareClick={handleShare}
                                        shareLabel=""
                                        shareActive={shareTooltip}
                                        pricingMode={pricingMode}
                                        onPricingModeChange={setPricingMode}
                                        viewMode={viewMode}
                                        onViewModeChange={setViewMode}
                                    />
                                </div>

                                {/* ── BACK FACE: Mini Compare Cards ── */}
                                <div
                                    className="absolute inset-0 w-full"
                                    style={{
                                        WebkitBackfaceVisibility: 'hidden',
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateX(180deg)',
                                    }}
                                >
                                    {allSpecs.length > 0 && (
                                        <div className="flex flex-col gap-2 h-full">
                                            {/* Column-split sticky header */}
                                            <div
                                                className="grid gap-x-6 w-full"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                {/* 1. Label Card */}
                                                <div className="bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-5 py-4 flex flex-col items-center justify-center h-[96px]">
                                                    <div className="bg-[#F4B000]/10 p-2 rounded-xl mb-1.5">
                                                        <GitCompareArrows size={18} className="text-[#F4B000]" />
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center leading-tight">
                                                        {isMixedMode
                                                            ? `Comparing ${activeVariants.length} Models`
                                                            : `${activeVariants.length} Variants`}
                                                    </span>
                                                </div>

                                                {/* 2. Individual Variant Minicards */}
                                                {activeVariants.map((v, i) => {
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

                                                    const currentHexRaw =
                                                        compactColorHexes[v.id] || swatches[0]?.hexCode || null;
                                                    let currentHex = currentHexRaw
                                                        ? currentHexRaw.replace('#', '').trim()
                                                        : null;
                                                    if (currentHex && currentHex.length === 3) {
                                                        currentHex = currentHex
                                                            .split('')
                                                            .map((c: string) => c + c)
                                                            .join('');
                                                    }
                                                    currentHex =
                                                        currentHex && currentHex.length === 6 ? `#${currentHex}` : null;

                                                    return (
                                                        <motion.div
                                                            key={v.id}
                                                            initial={false}
                                                            className="relative flex items-center gap-4 px-4 py-3 bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] h-[96px] group/minicard overflow-hidden transition-all duration-300"
                                                        >
                                                            {/* ── Background & Watermark Layer (Clipped) ── */}
                                                            <motion.div
                                                                className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0 group-hover/minicard:shadow-[0_12px_48px_-8px_rgba(0,0,0,0.2)] transition-shadow duration-500"
                                                                animate={{
                                                                    background: currentHex
                                                                        ? `linear-gradient(135deg, ${currentHex}26, ${currentHex}0D), rgba(248, 250, 252, 0.85)`
                                                                        : isCheapest
                                                                          ? 'rgba(244,176,0,0.08)'
                                                                          : undefined,
                                                                }}
                                                            >
                                                                {/* Ripple Effect Container */}
                                                                <AnimatePresence>
                                                                    {ripples[v.id] && (
                                                                        <motion.div
                                                                            key={ripples[v.id].key}
                                                                            initial={{ scale: 0, opacity: 0.6 }}
                                                                            animate={{ scale: 3, opacity: 0 }}
                                                                            transition={{
                                                                                duration: 0.8,
                                                                                ease: 'easeOut',
                                                                            }}
                                                                            className="absolute rounded-full pointer-events-none"
                                                                            style={{
                                                                                background: `radial-gradient(circle, ${ripples[v.id].color}66, transparent 70%)`,
                                                                                width: '120px',
                                                                                height: '120px',
                                                                                left: '85%',
                                                                                top: '60%',
                                                                                transform: 'translate(-50%, -50%)',
                                                                                zIndex: 0,
                                                                            }}
                                                                        />
                                                                    )}
                                                                </AnimatePresence>

                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <motion.span
                                                                        className="text-[80px] font-black uppercase tracking-tighter italic text-black whitespace-nowrap leading-none"
                                                                        initial={false}
                                                                        animate={{
                                                                            scale: 1,
                                                                            opacity: 0.08,
                                                                        }}
                                                                        whileHover={{
                                                                            scale: 1.15,
                                                                            opacity: 0.12,
                                                                        }}
                                                                        transition={{
                                                                            duration: 0.6,
                                                                            ease: 'easeOut',
                                                                        }}
                                                                    >
                                                                        {v.make}
                                                                    </motion.span>
                                                                </div>
                                                            </motion.div>

                                                            {/* ── Remove Button ── */}
                                                            {activeVariants.length > 2 && (
                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        removeVariant(v.id);
                                                                    }}
                                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover/minicard:opacity-100 z-30 shadow-sm border border-black/5"
                                                                >
                                                                    <X size={12} strokeWidth={3} />
                                                                </button>
                                                            )}

                                                            {/* ── Image with Pop-out (Outside clipping) ── */}
                                                            <div className="relative w-24 shrink-0 flex flex-col items-center justify-center gap-1 -ml-4 z-20">
                                                                {/* Outer glow shadow (ambient) */}
                                                                <div className="absolute inset-0 bg-white/40 blur-3xl rounded-full scale-125 opacity-0 group-hover/minicard:opacity-100 transition-opacity duration-700" />

                                                                {/* Grounding shadow (focused) */}
                                                                <motion.div
                                                                    className="absolute bottom-2 inset-x-0 h-4 bg-black/20 blur-xl rounded-full scale-x-50 translate-y-3 opacity-0 group-hover/minicard:opacity-100"
                                                                    animate={{
                                                                        scale: [0.5, 0.6, 0.5],
                                                                        opacity: [0, 0.4, 0],
                                                                    }}
                                                                    transition={{
                                                                        duration: 2,
                                                                        repeat: Infinity,
                                                                    }}
                                                                />

                                                                <motion.img
                                                                    layoutId={`compact-img-${v.id}`}
                                                                    src={currentImage}
                                                                    alt={v.variant}
                                                                    className="pointer-events-none relative h-[80px] w-auto object-contain transition-all duration-500 group-hover/minicard:scale-115 group-hover/minicard:-translate-y-2 group-hover/minicard:drop-shadow-[0_15px_30px_rgba(0,0,0,0.25)] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
                                                                />
                                                            </div>

                                                            {/* ── Model name only ── */}
                                                            <div className="flex-1 min-w-0 z-10 text-right">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 truncate leading-none block">
                                                                    {v.model}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    {/* Spacer to maintain flow height for the absolute faces */}
                    <div className="mb-6 hidden md:block" />

                    {/* ────── Full Cards (grid mode only) ────── */}
                    {viewMode === 'grid' && (
                        <div ref={fullCardsRef}>
                            <div ref={scrollAnchorRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pb-4">
                                {activeVariants.map(v => (
                                    <ProductCard
                                        key={v.id}
                                        v={v}
                                        viewMode="grid"
                                        downpayment={downpayment}
                                        tenure={tenure}
                                        onEditDownpayment={openDpEdit}
                                        pricingMode={pricingMode}
                                        onTogglePricingMode={() =>
                                            setPricingMode(m => (m === 'cash' ? 'finance' : 'cash'))
                                        }
                                        isInCompare={!removedVariantIds.has(v.id)}
                                        onCompare={() => removeVariant(v.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ────── Comparison Specifications Section (list mode only) ────── */}
                    {viewMode === 'list' && allSpecs.length > 0 && (
                        <div className="pb-6 space-y-10">
                            <div className="overflow-visible">
                                {/* ── Financial Comparison Section (sticky/frozen in list mode) ── */}
                                <AnimatePresence initial={false}>
                                    {isPricingExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden sticky z-[70] pb-3 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/60"
                                            style={{ top: 'calc(var(--header-h) + 56px)' }}
                                        >
                                            {/* 00. Mini Card Images Row */}
                                            <div
                                                className="grid gap-x-6 mt-4"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-4 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <ImageIcon size={12} className="text-[#F4B000]/70 shrink-0" />
                                                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                        Preview
                                                    </span>
                                                </div>
                                                {activeVariants.map((v, vIdx) => {
                                                    const currentImage = compactColorImages[v.id] || v.imageUrl;
                                                    const swatches = (v.availableColors || [])
                                                        .filter(
                                                            c =>
                                                                typeof c?.hexCode === 'string' &&
                                                                c.hexCode.trim().length > 0
                                                        )
                                                        .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
                                                    const currentHexRaw =
                                                        compactColorHexes[v.id] || swatches[0]?.hexCode || null;
                                                    let hexVal = currentHexRaw
                                                        ? currentHexRaw.replace('#', '').trim()
                                                        : null;
                                                    if (hexVal && hexVal.length === 3)
                                                        hexVal = hexVal
                                                            .split('')
                                                            .map((c: string) => c + c)
                                                            .join('');
                                                    const hexFull = hexVal && hexVal.length === 6 ? `#${hexVal}` : null;

                                                    return (
                                                        <div
                                                            key={vIdx}
                                                            className="relative flex items-center justify-center py-4 border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden"
                                                            style={{
                                                                background: hexFull
                                                                    ? `linear-gradient(135deg, ${hexFull}26, ${hexFull}0D), rgba(248, 250, 252, 0.85)`
                                                                    : 'white',
                                                            }}
                                                        >
                                                            {/* Brand Watermark */}
                                                            <span className="absolute inset-0 flex items-center justify-center text-[60px] font-black uppercase tracking-tighter italic text-black/[0.06] whitespace-nowrap leading-none pointer-events-none select-none">
                                                                {v.make}
                                                            </span>
                                                            {/* Bike Image */}
                                                            <img
                                                                src={currentImage}
                                                                alt={v.variant}
                                                                className="relative z-10 h-[80px] w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* 00b. Model Name Row */}
                                            <div
                                                className="grid gap-x-6 mt-2"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-3 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <Bike size={12} className="text-[#F4B000]/70 shrink-0" />
                                                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                        Model
                                                    </span>
                                                </div>
                                                {activeVariants.map((v, vIdx) => (
                                                    <div
                                                        key={vIdx}
                                                        className="px-4 py-3 flex items-center justify-center text-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                    >
                                                        <span className="text-[11px] font-black tracking-tight text-slate-700">
                                                            {v.model}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 0. Variant */}
                                            <div
                                                className="grid gap-x-6 mt-4"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-4 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <Bike size={12} className="text-[#F4B000]/70 shrink-0" />
                                                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                        Variant
                                                    </span>
                                                </div>
                                                {activeVariants.map((v, vIdx) => (
                                                    <div
                                                        key={vIdx}
                                                        className="px-4 py-4 flex items-center justify-center text-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                    >
                                                        <span className="text-[11px] font-black tracking-tight text-slate-900 break-words text-center leading-tight">
                                                            {v.variant}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 0b. Colours */}
                                            <div
                                                className="grid gap-x-6 mt-2"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-3 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <Circle size={12} className="text-[#F4B000]/70 shrink-0" />
                                                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                        Colours
                                                    </span>
                                                </div>
                                                {activeVariants.map((v, vIdx) => {
                                                    const vSwatches = (v.availableColors || [])
                                                        .filter(
                                                            c =>
                                                                typeof c?.hexCode === 'string' &&
                                                                c.hexCode.trim().length > 0
                                                        )
                                                        .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
                                                    return (
                                                        <div
                                                            key={vIdx}
                                                            className="px-4 py-3 flex items-center justify-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                        >
                                                            {vSwatches.length > 0 ? (
                                                                <div className="flex items-center justify-center flex-wrap gap-1">
                                                                    {vSwatches.map((c, ci) => {
                                                                        let sHex = c.hexCode?.replace('#', '') || '000';
                                                                        if (sHex.length === 3)
                                                                            sHex = sHex
                                                                                .split('')
                                                                                .map(x => x + x)
                                                                                .join('');
                                                                        const sHexFull = `#${sHex}`;
                                                                        const finish = (c.finish || '').toUpperCase();
                                                                        return (
                                                                            <div
                                                                                key={ci}
                                                                                className="relative overflow-hidden w-3.5 h-3.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                                                                                style={{ backgroundColor: sHexFull }}
                                                                                title={`${c.name} (${c.finish || 'Standard'})`}
                                                                            >
                                                                                {finish.includes('GLOSS') && (
                                                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/60 to-white/20" />
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 italic text-[11px]">
                                                                    —
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* 1. Finance / Cash Offer Price (shown first) */}
                                            <div
                                                className="grid gap-x-6 mt-2"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-4 flex flex-col items-start gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <div className="flex items-center gap-2">
                                                        <IndianRupee size={12} className="text-[#F4B000]/70 shrink-0" />
                                                        <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                            {pricingMode === 'finance' ? 'Finance Offer' : 'Cash Offer'}
                                                        </span>
                                                    </div>
                                                    {pricingMode === 'finance' && (
                                                        <div className="flex items-center gap-2 mt-auto">
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setEditingDownpayment(!editingDownpayment);
                                                                    if (!editingDownpayment)
                                                                        setDpInputValue(String(downpayment));
                                                                    setEditingTenure(false);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-colors ${editingDownpayment ? 'bg-[#F4B000]/20 text-[#F4B000]' : 'bg-slate-50 text-slate-300 hover:text-[#F4B000]'}`}
                                                                title="Edit Downpayment"
                                                            >
                                                                <Pencil size={10} />
                                                            </button>
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setEditingTenure(!editingTenure);
                                                                    setEditingDownpayment(false);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-colors ${editingTenure ? 'bg-[#F4B000]/20 text-[#F4B000]' : 'bg-slate-50 text-slate-300 hover:text-[#F4B000]'}`}
                                                                title="Edit Tenure"
                                                            >
                                                                <Calendar size={10} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {activeVariants.map((v, vIdx) => {
                                                    const cashPrice = v.price?.onRoad || v.price?.exShowroom || 0;
                                                    const bCoin = coinsNeededForPrice(cashPrice);
                                                    const emi = getEmi(v, downpayment, tenure);
                                                    return (
                                                        <div
                                                            key={vIdx}
                                                            className="px-4 py-4 flex flex-col items-center justify-center gap-1.5 text-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                        >
                                                            {pricingMode === 'cash' ? (
                                                                (() => {
                                                                    const onRoad =
                                                                        v.price?.onRoad || v.price?.exShowroom || 0;
                                                                    const offerPrice = v.price?.offerPrice || onRoad;
                                                                    const saving = onRoad - offerPrice;
                                                                    const isSaving = saving > 0;
                                                                    const isSurge = saving < 0;
                                                                    return (
                                                                        <>
                                                                            <span className="text-[13px] font-black text-slate-900">
                                                                                ₹{offerPrice.toLocaleString('en-IN')}
                                                                            </span>
                                                                            {isSaving ? (
                                                                                <span className="text-[10px] font-black text-emerald-600">
                                                                                    Save ₹
                                                                                    {saving.toLocaleString('en-IN')}
                                                                                </span>
                                                                            ) : isSurge ? (
                                                                                <span className="text-[10px] font-black text-red-500">
                                                                                    +₹
                                                                                    {Math.abs(saving).toLocaleString(
                                                                                        'en-IN'
                                                                                    )}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                                    No discount
                                                                                </span>
                                                                            )}
                                                                            <div className="flex items-center gap-1">
                                                                                <Logo variant="icon" size={10} />
                                                                                <span className="text-[11px] font-black text-[#F4B000] italic">
                                                                                    {bCoin.toLocaleString('en-IN')}
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <>
                                                                    {editingDownpayment ? (
                                                                        <input
                                                                            type="number"
                                                                            value={dpInputValue}
                                                                            onChange={e =>
                                                                                setDpInputValue(e.target.value)
                                                                            }
                                                                            onBlur={() => {
                                                                                const val = parseInt(dpInputValue);
                                                                                if (!isNaN(val) && val >= 0)
                                                                                    setDownpayment(val);
                                                                                setEditingDownpayment(false);
                                                                            }}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    const val = parseInt(dpInputValue);
                                                                                    if (!isNaN(val) && val >= 0)
                                                                                        setDownpayment(val);
                                                                                    setEditingDownpayment(false);
                                                                                }
                                                                            }}
                                                                            autoFocus={vIdx === 0}
                                                                            className="w-24 text-center text-[12px] font-black bg-[#F4B000]/10 border border-[#F4B000]/30 rounded-lg px-2 py-1 outline-none focus:border-[#F4B000]"
                                                                        />
                                                                    ) : editingTenure ? (
                                                                        <div className="flex gap-1 flex-wrap justify-center">
                                                                            {TENURE_OPTIONS.map(t => (
                                                                                <button
                                                                                    key={t}
                                                                                    onClick={() => {
                                                                                        setTenure(t);
                                                                                        setEditingTenure(false);
                                                                                    }}
                                                                                    className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${
                                                                                        tenure === t
                                                                                            ? 'bg-[#F4B000] text-black'
                                                                                            : 'bg-slate-100 text-slate-500 hover:bg-[#F4B000]/20 hover:text-[#F4B000]'
                                                                                    }`}
                                                                                >
                                                                                    {t}m
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center gap-0.5">
                                                                            <span className="text-[13px] font-black text-[#F4B000]">
                                                                                ₹{emi.toLocaleString('en-IN')} ×{' '}
                                                                                {tenure}mo
                                                                            </span>
                                                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                                                                ₹{downpayment.toLocaleString('en-IN')}{' '}
                                                                                Downpayment
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* 2. On-Road Price (below offer) */}
                                            <div
                                                className="grid gap-x-6 mt-2"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-4 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <IndianRupee size={12} className="text-[#F4B000]/70 shrink-0" />
                                                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                        On-Road Price
                                                    </span>
                                                </div>
                                                {activeVariants.map((v, vIdx) => (
                                                    <div
                                                        key={vIdx}
                                                        className="px-6 py-4 flex items-center justify-center text-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                    >
                                                        <span className="text-[12px] font-black text-slate-900">
                                                            ₹
                                                            {(
                                                                v.price?.onRoad ||
                                                                v.price?.exShowroom ||
                                                                0
                                                            ).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 3. Price Difference (below on-road price) */}
                                            <div
                                                className="grid gap-x-6 mt-2"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                }}
                                            >
                                                <div className="px-4 py-4 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <GitCompareArrows
                                                        size={12}
                                                        className="text-[#F4B000]/70 shrink-0"
                                                    />
                                                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                                        Price Difference
                                                    </span>
                                                </div>
                                                {activeVariants.map((v, vIdx) => {
                                                    const currentPrice = getDisplayPrice(v);
                                                    if (vIdx === 0) {
                                                        return (
                                                            <div
                                                                key={vIdx}
                                                                className="px-6 py-4 flex items-center justify-center text-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                            >
                                                                <span className="text-[11px] font-black text-slate-400">
                                                                    BASE
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    const prevPrice = getDisplayPrice(activeVariants[vIdx - 1]);
                                                    const gap = currentPrice - prevPrice;
                                                    const isGapDrop = gap < 0;
                                                    const isGapSurge = gap > 0;
                                                    return (
                                                        <div
                                                            key={vIdx}
                                                            className="px-6 py-4 flex items-center justify-center text-center bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                        >
                                                            <span
                                                                className={`text-[11px] font-black ${isGapDrop ? 'text-emerald-600' : isGapSurge ? 'text-red-500' : 'text-slate-400'}`}
                                                            >
                                                                {isGapSurge ? '+' : isGapDrop ? '−' : ''}₹
                                                                {Math.abs(gap).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ── Smart Spec Rows ── */}
                                {/* Section 1: What's Different */}
                                {smartSpecs.diffSpecs.length > 0 && (
                                    <AnimatePresence initial={false}>
                                        {isDiffExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden"
                                            >
                                                {smartSpecs.diffSpecs.map((row, rIdx) => {
                                                    const bestIdx = findBestValueIndex(row);
                                                    return (
                                                        <div
                                                            key={`diff-${rIdx}`}
                                                            className="grid gap-x-6 mt-2"
                                                            style={{
                                                                gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                            }}
                                                        >
                                                            <div className="px-4 py-4 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                                {(() => {
                                                                    const SpecIcon = getSpecIcon(row.label);
                                                                    return (
                                                                        <SpecIcon
                                                                            size={12}
                                                                            className="shrink-0 text-[#F4B000]/70"
                                                                        />
                                                                    );
                                                                })()}
                                                                <span className="text-[11px] font-bold tracking-wide text-slate-500 truncate">
                                                                    {row.label}
                                                                </span>
                                                            </div>
                                                            {row.values.map((val, vIdx) => {
                                                                const isBest = bestIdx === vIdx;
                                                                const isUnique =
                                                                    val &&
                                                                    row.values.filter(v => v === val).length === 1;
                                                                const barPct = NUMERIC_BAR_SPECS.has(
                                                                    row.label.toLowerCase()
                                                                )
                                                                    ? getBarPercent(val, row.values)
                                                                    : null;
                                                                return (
                                                                    <div
                                                                        key={vIdx}
                                                                        className={`px-6 py-4 flex flex-col items-center justify-center text-center gap-1 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${isBest ? 'ring-2 ring-emerald-500/20 bg-emerald-50/20' : ''}`}
                                                                    >
                                                                        <span
                                                                            className={`text-[11px] font-semibold ${!val ? 'text-slate-300 italic' : isBest ? 'text-emerald-600 font-black' : isUnique ? 'text-[#F4B000] font-bold' : 'text-slate-700'}`}
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
                                                                            <div className="w-full max-w-[80px] h-1 rounded-full bg-slate-100 overflow-hidden">
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}

                                {/* Section 2: All Specifications */}
                                {smartSpecs.restSpecs.length > 0 && (
                                    <AnimatePresence initial={false}>
                                        {isAllSpecsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden"
                                            >
                                                {smartSpecs.restSpecs.map((row, rIdx) => (
                                                    <div
                                                        key={`rest-${rIdx}`}
                                                        className="grid gap-x-6 mt-2"
                                                        style={{
                                                            gridTemplateColumns: `180px repeat(${activeVariants.length}, 1fr)`,
                                                        }}
                                                    >
                                                        <div className="px-4 py-4 flex items-center gap-2 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                            {(() => {
                                                                const SpecIcon = getSpecIcon(row.label);
                                                                return (
                                                                    <SpecIcon
                                                                        size={12}
                                                                        className="shrink-0 text-[#F4B000]/70"
                                                                    />
                                                                );
                                                            })()}
                                                            <span className="text-[11px] font-bold tracking-wide text-slate-500 truncate">
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
                                                                    className="px-6 py-4 flex flex-col items-center justify-center text-center gap-1 bg-white border border-black/[0.04] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                                                >
                                                                    <span
                                                                        className={`text-[11px] font-semibold ${!val ? 'text-slate-300 italic' : 'text-slate-700'}`}
                                                                    >
                                                                        {formatSpecValue(val, row.label)}
                                                                    </span>
                                                                    {isNumeric && (
                                                                        <div className="w-full max-w-[60px] h-[2px] rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
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
                            className="relative z-10 w-full max-w-2xl mx-auto rounded-t-3xl bg-white border-t border-x border-slate-200 shadow-2xl p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-300"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                                    Finance Settings
                                </h3>
                                <button
                                    onClick={() => setIsDpEditOpen(false)}
                                    className="text-slate-400 hover:text-slate-900"
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
                                    <span className="text-lg font-black text-emerald-600">
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
                                <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest">
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
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${dpDraft === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F4B000]/30'}`}
                                        >
                                            ₹{val / 1000}K
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tenure */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Tenure
                                    </span>
                                    <span className="text-lg font-black text-emerald-600">{tenure} months</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    {[12, 24, 36, 48, 60].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setTenure(val)}
                                            className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${tenure === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F4B000]/30'}`}
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
            </div>
        </>
    );
}
