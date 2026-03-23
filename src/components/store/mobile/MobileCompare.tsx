'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
    LayoutGrid,
    List,
    ImageIcon,
    IndianRupee,
    GitCompareArrows,
    Pencil,
    CreditCard as CreditCardIcon,
    Calendar,
} from 'lucide-react';
import { useSystemCompareLogic } from '@/hooks/useSystemCompareLogic';
import { VariantCompareCardAdapter } from '@/components/store/cards/VehicleCardAdapters';
import { useDiscovery } from '@/contexts/DiscoveryContext';
import { flattenObject, formatSpecValue, computeSpecCategories } from '@/hooks/compareUtils';
import { getEmiFactor } from '@/lib/constants/pricingConstants';
import { useOClubWallet } from '@/hooks/useOClubWallet';
import { discountForCoins } from '@/lib/oclub/coin';

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
    const { availableCoins, isLoggedIn } = useOClubWallet();

    const { activeVariants, isMixedMode, removeVariantBySlug, downpayment, setDownpayment, tenure, setTenure } =
        useSystemCompareLogic();

    const { pricingMode, setPricingMode } = useDiscovery();
    const walletDiscount = isLoggedIn ? discountForCoins(Math.floor(availableCoins / 13) * 13) : 0;
    const getEffectiveCashPrice = (v: any) =>
        Math.max(0, (v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0) - walletDiscount);

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
    const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'list'>('grid');
    const [isXScrolled, setIsXScrolled] = useState(false);
    const listScrollRef = useRef<HTMLDivElement>(null);

    // Listen for CTA events from ShopperBottomNav
    useEffect(() => {
        const onForceList = () => setMobileViewMode('list');
        const onForceGrid = () => setMobileViewMode('grid');
        window.addEventListener('compareForceListView', onForceList);
        window.addEventListener('compareForceGridView', onForceGrid);
        return () => {
            window.removeEventListener('compareForceListView', onForceList);
            window.removeEventListener('compareForceGridView', onForceGrid);
        };
    }, []);

    // ── Derived helpers for the table view ──────────────────────────────────────
    const colTemplate = `120px repeat(${n}, minmax(148px, 1fr))`;
    const stickyLabel = `sticky left-0 z-40 px-2 py-2 flex items-center gap-1.5 bg-white border border-black/[0.04] rounded-xl transition-all duration-200 ${
        isXScrolled
            ? 'shadow-[6px_0_10px_-4px_rgba(0,0,0,0.08)] border-r-black/[0.08]'
            : 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
    }`;
    const valueCell =
        'px-2 py-2 flex items-center justify-center text-center bg-white border border-black/[0.04] rounded-xl min-h-[36px]';

    const fmtVal = (val: string | null, label: string): React.ReactNode => {
        if (!val) return <span className="text-slate-300 italic text-[9px]">—</span>;
        const lower = val.trim().toLowerCase();
        if (lower === 'yes' || lower === 'true')
            return (
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check size={11} className="text-emerald-600" />
                </div>
            );
        if (lower === 'no' || lower === 'false')
            return (
                <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                    <X size={11} className="text-red-400" />
                </div>
            );
        return (
            <span className="text-[10px] font-black text-slate-700 leading-tight">{formatSpecValue(val, label)}</span>
        );
    };

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen pb-20 font-sans">
            {/* ── View mode toggle — desktop only ── */}
            <div className="hidden md:flex justify-end px-4 pt-3">
                <button
                    onClick={() => setMobileViewMode(m => (m === 'grid' ? 'list' : 'grid'))}
                    className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:bg-slate-100 transition-colors shadow-sm"
                >
                    {mobileViewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
                </button>
            </div>

            {/* ── GRID MODE ── */}
            {mobileViewMode === 'grid' && (
                <div className="px-5 pt-4 space-y-4">
                    {activeVariants.map(v => (
                        <VariantCompareCardAdapter
                            key={v.id}
                            variant={v}
                            viewMode="grid"
                            downpayment={downpayment}
                            tenure={tenure}
                            walletCoins={isLoggedIn ? availableCoins : null}
                            showOClubPrompt={!isLoggedIn}
                            onEditDownpayment={() => {}}
                            pricingMode={pricingMode}
                            onTogglePricingMode={() => setPricingMode(m => (m === 'cash' ? 'finance' : 'cash'))}
                        />
                    ))}
                </div>
            )}

            {/* ── LIST MODE: Desktop-identical horizontal table ── */}
            {mobileViewMode === 'list' && (
                <div
                    ref={listScrollRef}
                    className="overflow-x-auto pb-4"
                    onScroll={e => setIsXScrolled(e.currentTarget.scrollLeft > 8)}
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="flex flex-col gap-1 px-3 pt-3" style={{ minWidth: `${120 + n * 150}px` }}>
                        {/* ── Preview Row ── */}
                        <div className="grid gap-x-2 mb-1" style={{ gridTemplateColumns: colTemplate }}>
                            <div className={stickyLabel}>
                                <ImageIcon size={10} className="text-[#F4B000]/70 shrink-0" />
                                <span className="text-[9px] font-black text-slate-500 leading-none">Preview</span>
                            </div>
                            {activeVariants.map((v, vi) => (
                                <div
                                    key={vi}
                                    className="relative flex items-center justify-center bg-white border border-black/[0.04] rounded-xl min-h-[72px] overflow-hidden"
                                >
                                    <span className="absolute inset-0 flex items-center justify-center text-[52px] font-black uppercase italic text-black/[0.05] pointer-events-none select-none leading-none">
                                        {v.make?.[0] || 'B'}
                                    </span>
                                    <img
                                        src={v.imageUrl || '/images/categories/motorcycle_nobg.png'}
                                        alt={v.variant}
                                        className="relative z-10 h-14 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* ── Model Row ── */}
                        <div className="grid gap-x-2" style={{ gridTemplateColumns: colTemplate }}>
                            <div className={stickyLabel}>
                                <Bike size={10} className="text-[#F4B000]/70 shrink-0" />
                                <span className="text-[9px] font-black text-slate-500 leading-none">Model</span>
                            </div>
                            {activeVariants.map((v, vi) => (
                                <div key={vi} className={valueCell}>
                                    <span className="text-[10px] font-black text-slate-700 capitalize leading-tight">
                                        {v.model?.toLowerCase()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── Variant Row ── */}
                        <div className="grid gap-x-2" style={{ gridTemplateColumns: colTemplate }}>
                            <div className={stickyLabel}>
                                <GitCompareArrows size={10} className="text-[#F4B000]/70 shrink-0" />
                                <span className="text-[9px] font-black text-slate-500 leading-none">Variant</span>
                            </div>
                            {activeVariants.map((v, vi) => (
                                <div key={vi} className={valueCell}>
                                    <span className="text-[9px] font-black text-slate-900 uppercase leading-tight">
                                        {v.variant}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── Colours Row ── */}
                        <div className="grid gap-x-2" style={{ gridTemplateColumns: colTemplate }}>
                            <div className={stickyLabel}>
                                <Circle size={10} className="text-[#F4B000]/70 shrink-0" />
                                <span className="text-[9px] font-black text-slate-500 leading-none">Colours</span>
                            </div>
                            {activeVariants.map((v, vi) => {
                                const swatches = (v.availableColors || [])
                                    .filter((c: any) => typeof c?.hexCode === 'string' && c.hexCode.trim().length > 0)
                                    .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));
                                return (
                                    <div key={vi} className={`${valueCell} flex-wrap gap-1`}>
                                        {swatches.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {swatches.map((c: any, ci: number) => (
                                                    <div
                                                        key={ci}
                                                        className="w-3 h-3 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                                                        style={{
                                                            background: c.secondaryHexCode
                                                                ? `linear-gradient(135deg, ${c.hexCode} 50%, ${c.secondaryHexCode} 50%)`
                                                                : c.hexCode,
                                                        }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-slate-300 italic">—</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── On-Road Price Row ── */}
                        <div className="grid gap-x-2 mt-1" style={{ gridTemplateColumns: colTemplate }}>
                            <div className={stickyLabel}>
                                <IndianRupee size={10} className="text-[#F4B000]/70 shrink-0" />
                                <span className="text-[9px] font-black text-slate-500 leading-none">On-Road Price</span>
                            </div>
                            {activeVariants.map((v, vi) => {
                                const price = getEffectiveCashPrice(v);
                                return (
                                    <div key={vi} className={valueCell}>
                                        <span className="text-[10px] font-black text-slate-900 tabular-nums">
                                            ₹{price > 0 ? price.toLocaleString('en-IN') : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── EMI Row ── */}
                        <div className="grid gap-x-2" style={{ gridTemplateColumns: colTemplate }}>
                            <div className={stickyLabel}>
                                <CreditCardIcon size={10} className="text-[#F4B000]/70 shrink-0" />
                                <span className="text-[9px] font-black text-slate-500 leading-none">
                                    EMI/{tenure}mo
                                </span>
                            </div>
                            {activeVariants.map((v, vi) => {
                                const price = getEffectiveCashPrice(v);
                                const emi = price > 0 ? Math.round((price - downpayment) * getEmiFactor(tenure)) : 0;
                                return (
                                    <div key={vi} className={valueCell}>
                                        <span className="text-[10px] font-black text-[#F4B000]">
                                            {emi > 0 ? `₹${emi.toLocaleString()}/mo` : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Spec Rows by Category ── */}
                        {allSpecs.map(cat => (
                            <div key={cat.name}>
                                {/* Category Divider */}
                                <div className="grid gap-x-2 mt-2" style={{ gridTemplateColumns: colTemplate }}>
                                    <div className="sticky left-0 z-40 px-2 py-1.5 flex items-center bg-slate-100 rounded-lg">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                            {cat.name}
                                        </span>
                                    </div>
                                    {activeVariants.map((_, vi) => (
                                        <div key={vi} className="bg-slate-100 rounded-lg" />
                                    ))}
                                </div>

                                {/* Spec Rows */}
                                {cat.specs.map(sp => (
                                    <div
                                        key={sp.label}
                                        className={`grid gap-x-2 mt-0.5 ${sp.isDifferent ? 'ring-1 ring-[#F4B000]/20 rounded-xl' : ''}`}
                                        style={{ gridTemplateColumns: colTemplate }}
                                    >
                                        <div className={`${stickyLabel} ${sp.isDifferent ? 'bg-[#F4B000]/5' : ''}`}>
                                            {React.createElement(
                                                (SPEC_ICON_MAP[sp.label.toLowerCase()] || CircleDot) as any,
                                                { size: 9, className: 'text-[#F4B000]/60 shrink-0' }
                                            )}
                                            <span className="text-[9px] font-black text-slate-500 leading-none capitalize">
                                                {sp.label.toLowerCase()}
                                            </span>
                                        </div>
                                        {sp.values.map((val, vi) => (
                                            <div
                                                key={vi}
                                                className={`${valueCell} ${sp.isDifferent ? 'bg-[#F4B000]/5' : ''}`}
                                            >
                                                {fmtVal(val, sp.label)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
