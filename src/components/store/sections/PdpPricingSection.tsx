/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ChevronDown, Zap, Info } from 'lucide-react';
import { coinsNeededForPrice, computeOClubPricing } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import PricingCard from '../Personalize/Cards/PricingCard';

// ─── Types ────────────────────────────────────────────────
export interface PdpPricingSectionProps {
    layout: 'desktop' | 'mobile';
    product: any;
    data: any;
    variantParam: string;
    activeColorConfig: any;
    productImage: string;
    walletCoins?: number | null;
    showOClubPrompt?: boolean;
    isGated?: boolean;
    leadName?: string;
    serviceability?: {
        isServiceable: boolean;
        status: string;
        pincode?: string;
        taluka?: string;
    };
    isOpen?: boolean;
    onToggle?: () => void;
}

// ─── Shared price breakup builder ─────────────────────────
export function buildPriceBreakup(data: any, coinPricing: any, isReferralActive: boolean) {
    const REFERRAL_BONUS = 5000;
    const {
        baseExShowroom,
        regType,
        rtoEstimates,
        rtoBreakdown,
        baseInsurance,
        insuranceBreakdown,
        accessoriesPrice,
        servicesPrice,
        otherCharges,
        colorDiscount,
        colorSurge,
        offersDiscount,
        accessoriesDiscount,
        accessoriesSurge,
        servicesDiscount,
        servicesSurge,
        insuranceAddonsDiscount,
        insuranceAddonsSurge,
        activeAccessories,
        totalSavings: computedTotalSavings,
        totalSurge: computedTotalSurge,
    } = data;

    const totalSavingsBase =
        computedTotalSavings ??
        colorDiscount +
            (offersDiscount < 0 ? Math.abs(offersDiscount) : 0) +
            accessoriesDiscount +
            servicesDiscount +
            insuranceAddonsDiscount;
    const totalSavings = totalSavingsBase + (isReferralActive ? REFERRAL_BONUS : 0);
    const totalSurge = computedTotalSurge ?? 0;

    const savingsHelpLines = [
        colorDiscount > 0 ? `Vehicle Offer: ₹ ${colorDiscount.toLocaleString('en-IN')}` : null,
        offersDiscount < 0 ? `Offers/Plans: ₹ ${Math.abs(offersDiscount).toLocaleString('en-IN')}` : null,
        accessoriesDiscount > 0 ? `Accessories: ₹ ${accessoriesDiscount.toLocaleString('en-IN')}` : null,
        servicesDiscount > 0 ? `Services: ₹ ${servicesDiscount.toLocaleString('en-IN')}` : null,
        insuranceAddonsDiscount > 0 ? `Insurance Add-ons: ₹ ${insuranceAddonsDiscount.toLocaleString('en-IN')}` : null,
        isReferralActive ? `Member Invite: ₹ ${REFERRAL_BONUS.toLocaleString('en-IN')}` : null,
        `Total: ₹ ${totalSavings.toLocaleString('en-IN')}`,
    ].filter(Boolean) as string[];

    const surgeHelpLines = [
        colorSurge > 0 ? `Dealer Surge: ₹ ${colorSurge.toLocaleString('en-IN')}` : null,
        offersDiscount > 0 ? `Offers/Plans: ₹ ${offersDiscount.toLocaleString('en-IN')}` : null,
        accessoriesSurge > 0 ? `Accessories: ₹ ${accessoriesSurge.toLocaleString('en-IN')}` : null,
        servicesSurge > 0 ? `Services: ₹ ${servicesSurge.toLocaleString('en-IN')}` : null,
        insuranceAddonsSurge > 0 ? `Insurance Add-ons: ₹ ${insuranceAddonsSurge.toLocaleString('en-IN')}` : null,
        totalSurge > 0 ? `Total: ₹ ${totalSurge.toLocaleString('en-IN')}` : null,
    ].filter(Boolean) as string[];

    const breakup = [
        { label: 'Ex-Showroom', value: baseExShowroom },
        {
            label: `Registration (${regType})`,
            value: rtoEstimates,
            breakdown: rtoBreakdown,
            comparisonOptions: data?.rtoOptions,
        },
        { label: 'Insurance', value: baseInsurance, breakdown: insuranceBreakdown },
        {
            label: 'Insurance Add-ons',
            value: Math.round((data.insuranceAddonsPrice || 0) + (data.insuranceAddonsDiscount || 0)),
        },
        {
            label: 'Mandatory Accessories',
            value: accessoriesPrice,
            breakdown: (activeAccessories || [])
                .filter((a: any) => a.isMandatory)
                .map((a: any) => ({ label: a.displayName || a.name, amount: a.discountPrice || a.price })),
        },
        {
            label: 'Optional Accessories',
            value: (data.accessoriesPrice || 0) + (data.accessoriesDiscount || 0) - accessoriesPrice,
        },
        { label: 'Services', value: (data.servicesPrice || 0) + (data.servicesDiscount || 0) },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges }] : []),

        ...(totalSavings > 0 || (coinPricing && coinPricing.discount > 0)
            ? [
                  {
                      label: "O' Circle Privileged",
                      value: totalSavings + (coinPricing?.discount || 0),
                      isDeduction: true,
                      helpText: [
                          ...savingsHelpLines.slice(0, -1),
                          ...(coinPricing
                              ? [
                                    `Coins: ₹ ${coinPricing.discount.toLocaleString('en-IN')} (${coinPricing.coinsUsed} coins)`,
                                ]
                              : []),
                          `Total: ₹ ${(totalSavings + (coinPricing?.discount || 0)).toLocaleString('en-IN')}`,
                      ],
                  },
              ]
            : []),
        ...(totalSurge > 0 ? [{ label: 'Surge Charges', value: totalSurge, helpText: surgeHelpLines }] : []),
    ];

    return { breakup, totalSavings, totalSurge, savingsHelpLines, surgeHelpLines };
}

// ─── Component ────────────────────────────────────────────
export function PdpPricingSection({
    layout,
    product,
    data,
    variantParam,
    activeColorConfig,
    productImage,
    walletCoins = null,
    showOClubPrompt = false,
    isGated = false,
    leadName,
    serviceability,
    isOpen,
    onToggle,
}: PdpPricingSectionProps) {
    const { totalOnRoad, isReferralActive } = data;
    const [internalOpen, setInternalOpen] = useState(layout === 'desktop');

    const walletCoinsValue = Number(walletCoins);
    const coinPricing =
        Number.isFinite(walletCoinsValue) && walletCoinsValue > 0
            ? computeOClubPricing(totalOnRoad, walletCoinsValue)
            : null;
    const displayOnRoad = coinPricing?.effectivePrice ?? totalOnRoad;
    const bCoinEquivalent = coinsNeededForPrice(displayOnRoad);

    const { breakup, totalSavings } = buildPriceBreakup(data, coinPricing, isReferralActive);

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
                    totalOnRoad={displayOnRoad}
                    originalPrice={originalPrice}
                    totalSavings={totalSavings}
                    priceBreakup={breakup}
                    productImage={productImage}
                    pricingSource={data.pricingSource}
                    leadName={leadName}
                    serviceability={serviceability}
                    coinPricing={coinPricing}
                    showOClubPrompt={showOClubPrompt}
                    isGated={isGated}
                />
            </div>
        );
    }

    // Mobile: collapsible accordion
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
            <button onClick={handleToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <Zap size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">Pricing</p>
                        <p className="text-[11px] font-semibold font-mono tabular-nums text-slate-600 flex items-center gap-1.5">
                            <span className="leading-none">₹ {displayOnRoad.toLocaleString('en-IN')}</span>
                            <span className="text-slate-300">•</span>
                            <Logo variant="icon" size={10} customColor="#475569" />
                            <span className="leading-none text-slate-600">
                                {bCoinEquivalent.toLocaleString('en-IN')}
                            </span>
                        </p>
                    </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open &&
                (() => {
                    const regularItems = breakup.filter(
                        (item: any) => !item.isInfo && !item.isDeduction && item.value !== 0
                    );
                    const deductionItem = breakup.find((item: any) => item.isDeduction && item.value !== 0);
                    const deductionAmount = deductionItem ? Math.abs(Number(deductionItem.value) || 0) : 0;
                    const grossTotal = regularItems.reduce(
                        (sum: number, item: any) => sum + (Number(item.value) || 0),
                        0
                    );
                    const netPrice = grossTotal - deductionAmount;

                    return (
                        <div className="px-5 pb-5">
                            <div className="border-t border-slate-200/60 pt-4 space-y-2">
                                {/* Line items */}
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

                                {/* O'Circle Privileged deduction */}
                                {deductionItem && (
                                    <div className="flex justify-between items-center text-sm py-1.5 text-green-600">
                                        <span className="flex items-center gap-1.5">
                                            {deductionItem.label}
                                            {deductionItem.helpText && (
                                                <Info className="w-3 h-3 text-green-400 inline cursor-help" />
                                            )}
                                        </span>
                                        <span className="font-mono font-semibold">
                                            −₹ {deductionAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}

                                {/* Net Offer Price */}
                                {deductionAmount > 0 && (
                                    <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-brand-primary/30 bg-brand-primary/5 -mx-5 px-5 rounded-b-3xl">
                                        <span className="uppercase tracking-widest text-[10px] font-black text-brand-primary">
                                            Net Offer Price
                                        </span>
                                        <span className="font-mono font-black text-lg text-brand-primary">
                                            ₹ {netPrice.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
}
