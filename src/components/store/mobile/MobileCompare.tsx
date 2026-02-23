'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Logo } from '@/components/brand/Logo';
import { useSystemCompareLogic } from '@/hooks/useSystemCompareLogic';
import {
    flattenObject,
    labelFromKey,
    formatSpecValue,
    computeSpecCategories,
    getDisplayPrice,
    getEmi,
    EMI_FACTORS,
} from '@/hooks/compareUtils';

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

// Spec utilities and hook are now imported from shared modules

// --- Main Mobile Component ---
export function MobileCompare() {
    const router = useRouter();

    const { activeVariants, removeVariantBySlug, downpayment, setDownpayment, tenure } = useSystemCompareLogic();

    const onRemoveVariant = removeVariantBySlug;

    const onEditDownpayment = () => {
        const newVal = prompt('Enter new downpayment amount:', downpayment.toString());
        if (newVal && !isNaN(Number(newVal))) setDownpayment(Number(newVal));
    };

    const allSpecs = useMemo(() => computeSpecCategories(activeVariants), [activeVariants]);

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
