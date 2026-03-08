'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
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
    Flame,
    Gauge,
    type LucideIcon,
    ChevronLeft,
} from 'lucide-react';
import { useSystemCompareLogic } from '@/hooks/useSystemCompareLogic';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import { useDiscovery } from '@/contexts/DiscoveryContext';
import { flattenObject, formatSpecValue, computeSpecCategories } from '@/hooks/compareUtils';
import { getEmiFactor } from '@/lib/constants/pricingConstants';

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

// --- Main Mobile Component ---
export function MobileCompare() {
    const router = useRouter();

    const { activeVariants, isMixedMode, removeVariantBySlug, downpayment, setDownpayment, tenure, setTenure } =
        useSystemCompareLogic();

    const { pricingMode, setPricingMode } = useDiscovery();

    const allSpecs = useMemo(() => computeSpecCategories(activeVariants), [activeVariants]);

    // Smart Specs — split into "different" vs "same"
    const smartSpecs = useMemo(() => {
        const diffSpecs: typeof allSpecs = [];
        const restSpecs: typeof allSpecs = [];
        let diffCount = 0;

        allSpecs.forEach(cat => {
            const dSpecs: any[] = [];
            const rSpecs: any[] = [];
            cat.specs.forEach(sp => {
                // Use the isDifferent flag pre-calculated in computeSpecRows
                if (sp.isDifferent) {
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
    }, [allSpecs]);

    const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
        const init: any = {};
        smartSpecs.diffSpecs.forEach(c => (init[`diff-${c.name}`] = true));
        smartSpecs.restSpecs.forEach(c => (init[`all-${c.name}`] = false));
        return init;
    });

    const toggleCat = (key: string) => setOpenCats(prev => ({ ...prev, [key]: !prev[key] }));

    const n = activeVariants.length;

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen pb-20 font-sans selection:bg-[#F4B000]/30">
            {/* ── Sticky Header ── */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 pt-safe px-5 py-4 flex items-center gap-3">
                <button
                    onClick={() => window.history.back()}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:bg-slate-100"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-black uppercase tracking-widest text-[#F4B000]">Compare</h1>
                    <p className="text-[10px] font-semibold text-slate-400 tracking-widest leading-none">
                        {isMixedMode ? `COMPARING ${n} MODELS` : `${n} VARIANTS SELECTED`}
                    </p>
                </div>
            </div>

            {/* ── SECTION 1: Full ProductCards (as-is, same as desktop) ── */}
            <div className="px-5 pt-4 space-y-4">
                {activeVariants.map(v => (
                    <ProductCard
                        key={v.id}
                        v={v}
                        viewMode="grid"
                        downpayment={downpayment}
                        tenure={tenure}
                        onEditDownpayment={() => {}}
                        pricingMode={pricingMode}
                        onTogglePricingMode={() => setPricingMode(m => (m === 'cash' ? 'finance' : 'cash'))}
                    />
                ))}
            </div>

            {/* ── Divider ── */}
            <div className="mx-5 my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Side by Side</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* ── SECTION 2: Mini Cards side by side ── */}
            <div className={`grid gap-3 px-5 ${n <= 2 ? 'grid-cols-2' : n === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {activeVariants.map(v => {
                    const price = v.price?.onRoad || v.price?.exShowroom || 0;
                    const emi = Math.round((price - downpayment) * getEmiFactor(tenure));
                    return (
                        <div
                            key={v.id}
                            className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col items-center text-center"
                        >
                            {n > 2 && (
                                <button
                                    onClick={() => removeVariantBySlug(v.slug)}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30 z-10"
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <img
                                src={v.imageUrl || '/images/templates/t3_night.webp'}
                                alt={v.model}
                                className="h-16 object-contain mb-2 drop-shadow-lg"
                            />
                            <p className="text-[11px] font-black uppercase text-slate-900 leading-tight line-clamp-1">
                                {v.model}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate w-full mb-2">{v.variant}</p>
                            <div className="w-full bg-slate-50 rounded-xl border border-slate-100 p-2">
                                <p className="text-[13px] font-black text-slate-900 leading-none">
                                    ₹{Math.round(price / 1000)}K
                                </p>
                                <p className="text-[9px] font-bold text-[#F4B000] mt-0.5 uppercase">
                                    ₹{emi.toLocaleString()}/mo
                                </p>
                            </div>
                        </div>
                    );
                })}
                {/* Add slot — only in mixed-mode (cross-model compare) */}
                {isMixedMode && n < 4 && (
                    <button
                        onClick={() => router.push('/store/catalog')}
                        className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-3 flex flex-col items-center justify-center text-slate-400 hover:border-[#F4B000] hover:text-[#F4B000] transition-colors min-h-[140px]"
                    >
                        <span className="text-3xl font-light mb-1">+</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
                    </button>
                )}
            </div>

            {/* ── SECTION 3: Spec Comparison ── */}
            <div className="px-5 mt-6 space-y-4">
                {/* What's Different */}
                {smartSpecs.diffSpecs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={14} className="text-[#F4B000] animate-pulse" />
                            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#F4B000]">
                                Key Differences
                            </h2>
                            <span className="bg-[#F4B000]/20 text-[#F4B000] px-2 py-0.5 rounded-full text-[9px] font-bold">
                                {smartSpecs.diffCount}
                            </span>
                        </div>

                        {smartSpecs.diffSpecs.map(cat => {
                            const isOpen = openCats[`diff-${cat.name}`];
                            return (
                                <div
                                    key={cat.name}
                                    className="bg-white rounded-2xl border border-slate-200 mb-3 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleCat(`diff-${cat.name}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                                            {cat.name}
                                        </span>
                                        {isOpen ? (
                                            <ChevronUp size={14} className="text-slate-400" />
                                        ) : (
                                            <ChevronDown size={14} className="text-slate-400" />
                                        )}
                                    </button>

                                    {isOpen && (
                                        <div className="divide-y divide-slate-100">
                                            {cat.specs.map(sp => (
                                                <div key={sp.label} className="px-4 py-3">
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                        {sp.label}
                                                    </p>
                                                    <div
                                                        className={`grid gap-2 ${n <= 2 ? 'grid-cols-2' : n === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
                                                    >
                                                        {activeVariants.map((v, vIdx) => {
                                                            const val = sp.values[vIdx] || '—';
                                                            const isMissing = !val || val === '—';
                                                            return (
                                                                <div
                                                                    key={`${v.id}-${sp.label}`}
                                                                    className="bg-slate-50 rounded-xl px-3 py-2 flex flex-col items-center text-center"
                                                                >
                                                                    <p className="text-[8px] font-bold text-slate-400 truncate w-full mb-1">
                                                                        {v.variant}
                                                                    </p>
                                                                    {val === 'Yes' ? (
                                                                        <Check size={14} className="text-[#F4B000]" />
                                                                    ) : val === 'No' ? (
                                                                        <X size={14} className="text-slate-400" />
                                                                    ) : (
                                                                        <span
                                                                            className={`text-[12px] font-black ${isMissing ? 'text-slate-300' : 'text-slate-900'}`}
                                                                        >
                                                                            {val}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* All Specifications */}
                {smartSpecs.restSpecs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">
                                All Specifications
                            </h2>
                        </div>

                        {smartSpecs.restSpecs.map(cat => {
                            const isOpen = openCats[`all-${cat.name}`];
                            return (
                                <div
                                    key={cat.name}
                                    className="bg-white rounded-2xl border border-slate-200 mb-3 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleCat(`all-${cat.name}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
                                            {cat.name}
                                        </span>
                                        {isOpen ? (
                                            <ChevronUp size={14} className="text-slate-400" />
                                        ) : (
                                            <ChevronDown size={14} className="text-slate-400" />
                                        )}
                                    </button>

                                    {isOpen && (
                                        <div className="divide-y divide-slate-100">
                                            {cat.specs.map(sp => {
                                                const val = sp.values[0] || '—';
                                                return (
                                                    <div
                                                        key={sp.label}
                                                        className="px-4 py-3 flex items-center justify-between"
                                                    >
                                                        <p className="text-[10px] font-bold text-slate-500 capitalize">
                                                            {sp.label}
                                                        </p>
                                                        <p className="text-[11px] font-black text-slate-700">{val}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
