/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ChevronDown, Zap, Info } from 'lucide-react';
import { computeOClubPricing, coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import PricingCard from '../Personalize/Cards/PricingCard';
import { buildPriceBreakup } from '../Personalize/pdpComputations';
import { REQUIRED_CORE_KEYS } from './pdpParityContract';

// ─── Types ────────────────────────────────────────────────
export interface PdpPricingSectionProps {
    layout: 'desktop' | 'mobile';
    product: any;
    data: any;
    variantParam: string;
    activeColorConfig: any;
    productImage: string;
    walletCoins?: number | null;
    // Pre-computed coin state (optional — if not provided, re-computed via SOT)
    coinPricing?: { effectivePrice: number; discount: number; coinsUsed: number } | null;
    displayOnRoad?: number;
    showOClubPrompt?: boolean;
    isGated?: boolean;
    leadName?: string;
    initialLocation?: any;
    bestOffer?: any; // ← canonical TAT/studio source
    serviceability?: {
        isServiceable: boolean;
        status: string;
        pincode?: string;
        taluka?: string;
    };
    isOpen?: boolean;
    onToggle?: () => void;
}

// Required key labels — used to determine which zero-value rows must still render
const REQUIRED_LABEL_MAP: Record<string, string> = {
    'Ex-Showroom': 'ex_showroom',
    Registration: 'registration',
    Insurance: 'insurance',
    'Insurance Add-ons': 'insurance_addons',
    Accessories: 'accessories',
    Services: 'services',
    Warranty: 'warranty',
    TAT: 'tat',
};
const REQUIRED_LABELS = new Set(Object.keys(REQUIRED_LABEL_MAP));

// ─── Component ────────────────────────────────────────────
export function PdpPricingSection({
    layout,
    product,
    data,
    variantParam,
    activeColorConfig,
    productImage,
    walletCoins = null,
    coinPricing: coinPricingProp,
    displayOnRoad: displayOnRoadProp,
    showOClubPrompt = false,
    isGated = false,
    leadName,
    initialLocation,
    bestOffer,
    serviceability,
    isOpen,
    onToggle,
}: PdpPricingSectionProps) {
    const { totalOnRoad, isReferralActive } = data;
    const [internalOpen, setInternalOpen] = useState(layout === 'desktop');

    // ── Fix 4: Coin SOT enforcement — no local rate=0.01 math ──
    // Always use computeOClubPricing from coin.ts (OCLUB_COIN_VALUE = 1000/13)
    const walletCoinsValue = Number(walletCoins);
    const localCoinPricing =
        coinPricingProp !== undefined
            ? coinPricingProp
            : Number.isFinite(walletCoinsValue) && walletCoinsValue > 0
              ? computeOClubPricing(totalOnRoad, walletCoinsValue)
              : null;

    const localDisplayOnRoad = displayOnRoadProp ?? localCoinPricing?.effectivePrice ?? totalOnRoad;
    const bCoinEquivalent = coinsNeededForPrice(localDisplayOnRoad);

    // ── Fix 5: Canonical breakup — single source for desktop + mobile ──
    // buildPriceBreakup() is the SOT; both shells call this same function.
    const { breakup, totalSavings } = buildPriceBreakup(
        data,
        localCoinPricing,
        isReferralActive,
        initialLocation,
        bestOffer
    );

    const originalPrice =
        (product.mrp || Math.round(data.baseExShowroom * 1.06)) +
        data.rtoEstimates +
        data.baseInsurance +
        data.accessoriesPrice +
        data.servicesPrice +
        (data.otherCharges || 0);

    if (layout === 'desktop') {
        return (
            <div data-parity-section="pricing">
                <PricingCard
                    product={product}
                    variantName={variantParam}
                    activeColor={{ name: activeColorConfig?.name || '', hex: activeColorConfig?.hex || '#000' }}
                    totalOnRoad={localDisplayOnRoad}
                    originalPrice={originalPrice}
                    totalSavings={totalSavings}
                    priceBreakup={breakup}
                    productImage={productImage}
                    pricingSource={data.pricingSource}
                    leadName={leadName}
                    serviceability={serviceability}
                    coinPricing={localCoinPricing}
                    showOClubPrompt={showOClubPrompt}
                    isGated={isGated}
                />
            </div>
        );
    }

    // ── Mobile: collapsible accordion ────────────────────────────────────────
    const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;
    const handleToggle = () => {
        if (onToggle) {
            onToggle();
            return;
        }
        setInternalOpen(prev => !prev);
    };

    return (
        <div
            data-parity-section="pricing"
            className="glass-panel bg-white/90 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
            <button onClick={handleToggle} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <Zap size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black tracking-[0.04em] text-brand-primary leading-tight">
                            Pricing
                        </p>
                        <p className="text-[10px] font-mono tabular-nums text-slate-600 leading-snug mt-0.5">
                            On Road ₹{localDisplayOnRoad.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5 flex items-center gap-1">
                            <Logo variant="icon" size={8} customColor="#94a3b8" />
                            <span>{bCoinEquivalent.toLocaleString('en-IN')} B-coins</span>
                        </p>
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open &&
                (() => {
                    // ── Fix 1: Never drop required keys even when value = ₹0 ──
                    // Filter logic: keep spacers, keep required-label rows regardless of value,
                    // keep non-zero non-spacer rows normally.
                    const regularItems = breakup.filter((item: any) => {
                        if (item.isSpacer) return false; // spacers handled by layout
                        if (item.isDeduction) return false; // handled separately below
                        if (item.isInfo) return false; // handled in info block below
                        if (item.isGrossTotal) return false; // mobile already shows its own grossTotal summary
                        // ── Fix 1 core: required keys always render even at ₹0 ──
                        if (REQUIRED_LABELS.has(item.label)) return true;
                        // Non-required rows: still filter zero values (e.g. optional charges)
                        return item.value !== 0 && item.value !== '';
                    });

                    // ── Fix 3: filter → full deduction set (not just find) ──
                    const deductionItems = breakup.filter(
                        (item: any) => item.isDeduction && (item.value !== 0 || REQUIRED_LABELS.has(item.label))
                    );
                    const totalDeduction = deductionItems.reduce(
                        (sum: number, item: any) => sum + Math.abs(Number(item.value) || 0),
                        0
                    );

                    const grossTotal = regularItems.reduce(
                        (sum: number, item: any) => sum + (Number(item.value) || 0),
                        0
                    );
                    // Net = gross − ALL deductions (O'Circle + Bcoin both counted)
                    const netPrice = Math.max(0, grossTotal - totalDeduction);

                    // ── Fix 2: info rows — TAT, Delivery By, Studio ID, Distance ──
                    const infoItems = breakup.filter(
                        (item: any) => item.isInfo && !item.isSpacer && item.value !== null && item.value !== ''
                    );

                    return (
                        <div className="px-5 pb-5">
                            <div className="border-t border-slate-200/60 pt-4 space-y-2">
                                {/* Line items — required keys always present */}
                                {regularItems.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm py-1.5 text-slate-700"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {item.label}
                                            {item.helpText && (
                                                <Info className="w-3 h-3 text-slate-400 inline cursor-help" />
                                            )}
                                        </span>
                                        <span className="font-mono font-semibold">
                                            ₹ {Math.abs(Number(item.value) || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}

                                {/* Fix 3: ALL deductions — O'Circle + Bcoin Used */}
                                {deductionItems.map((item: any, idx: number) => (
                                    <div
                                        key={`ded-${idx}`}
                                        className="flex justify-between items-center text-sm py-1.5 text-green-600"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {item.label}
                                            {item.helpText && (
                                                <Info className="w-3 h-3 text-green-400 inline cursor-help" />
                                            )}
                                        </span>
                                        <span className="font-mono font-semibold">
                                            −₹ {Math.abs(Number(item.value) || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}

                                {/* Net Offer Price — shown when any deduction present */}
                                {totalDeduction > 0 && (
                                    <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-brand-primary/30 bg-brand-primary/5 -mx-5 px-5 rounded-b-3xl">
                                        <span className="tracking-[0.04em] text-[10px] font-black text-brand-primary">
                                            Net Offer Price
                                        </span>
                                        <span className="font-mono font-black text-lg text-brand-primary">
                                            ₹ {netPrice.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}

                                {/* Fix 2: Info rows — TAT, Delivery By, Studio ID, Distance */}
                                {infoItems.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-200/40 space-y-1.5">
                                        {infoItems.map((item: any, idx: number) => (
                                            <div
                                                key={`info-${idx}`}
                                                className="flex justify-between items-center text-xs py-1 text-slate-500"
                                            >
                                                <span className="tracking-[0.04em] text-[9px] font-semibold text-slate-400">
                                                    {item.caption || item.label}
                                                </span>
                                                <span className="font-mono font-semibold text-slate-600 text-xs">
                                                    {typeof item.value === 'string'
                                                        ? item.value
                                                        : String(item.value ?? '')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
}
