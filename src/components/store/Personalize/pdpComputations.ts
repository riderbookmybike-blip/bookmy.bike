/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 7: Pure computation helpers extracted from DesktopPDP.
 * All functions are side-effect-free and independently testable.
 */

// ── O-Club coin SOT (single source — never inline the math) ─────────────────
import { computeOClubPricing, coinsNeededForPrice } from '@/lib/oclub/coin';

// ── EMI Calculation ────────────────────────────────────────────

export interface FinanceScheme {
    interestRate?: number;
    interestType?: 'REDUCING' | 'FLAT';
    charges?: FinanceCharge[];
    name?: string;
}

export interface FinanceCharge {
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    impact: 'UPFRONT' | 'FUNDED';
    calculationBasis?: 'LOAN_AMOUNT' | 'ON_ROAD';
    value: number;
}

export interface FinanceMetricsInput {
    scheme: FinanceScheme | null | undefined;
    displayOnRoad: number;
    userDownPayment: number;
    loanAmount: number;
    totalOnRoad: number;
    emiTenure: number;
}

export interface FinanceMetrics {
    monthlyEmi: number;
    netLoan: number;
    grossLoan: number;
    totalUpfront: number;
    totalFunded: number;
    marginMoney: number;
    totalInterest: number;
    totalOutflow: number;
    annualInterest: number;
    interestType: string;
    upfrontCharges: FinanceCharge[];
    fundedCharges: FinanceCharge[];
}

/**
 * Compute all finance metrics from scheme + pricing inputs.
 * Used by both footer EMI display and the FinanceSummaryPanel.
 */
export function computeFinanceMetrics(input: FinanceMetricsInput): FinanceMetrics {
    const { scheme, displayOnRoad, userDownPayment, loanAmount, totalOnRoad, emiTenure } = input;

    const annualInterest = scheme?.interestRate ? scheme.interestRate / 100 : 0;
    const interestType = scheme?.interestType || 'REDUCING';
    const allCharges: FinanceCharge[] = (scheme?.charges || []) as FinanceCharge[];

    const calcAmt = (charge: FinanceCharge): number => {
        if (charge.type === 'PERCENTAGE') {
            const basis = charge.calculationBasis === 'LOAN_AMOUNT' ? loanAmount : totalOnRoad;
            return Math.round(basis * (charge.value / 100));
        }
        return charge.value || 0;
    };

    const upfrontCharges = allCharges.filter(c => c.impact === 'UPFRONT');
    const fundedCharges = allCharges.filter(c => c.impact === 'FUNDED');

    const totalUpfront = upfrontCharges.reduce((s, c) => s + calcAmt(c), 0);
    const totalFunded = fundedCharges.reduce((s, c) => s + calcAmt(c), 0);

    const netLoan = Math.max(0, displayOnRoad - (userDownPayment || 0));
    const grossLoan = netLoan + totalFunded + totalUpfront;
    const marginMoney = (userDownPayment || 0) + totalUpfront;

    let monthlyEmi: number;
    if (interestType === 'FLAT') {
        const totalInt = grossLoan * annualInterest * (emiTenure / 12);
        monthlyEmi = Math.round((grossLoan + totalInt) / emiTenure);
    } else {
        const r = annualInterest / 12;
        if (r === 0) {
            monthlyEmi = Math.round(grossLoan / emiTenure);
        } else {
            monthlyEmi = Math.round((grossLoan * r * Math.pow(1 + r, emiTenure)) / (Math.pow(1 + r, emiTenure) - 1));
        }
    }

    const totalInterest = Math.max(0, Math.round(monthlyEmi * emiTenure - grossLoan));
    const totalOutflow = Math.round((userDownPayment || 0) + totalUpfront + monthlyEmi * emiTenure);

    return {
        monthlyEmi,
        netLoan,
        grossLoan,
        totalUpfront,
        totalFunded,
        marginMoney,
        totalInterest,
        totalOutflow,
        annualInterest,
        interestType,
        upfrontCharges,
        fundedCharges,
    };
}

// ── Savings & Surge Lines ──────────────────────────────────────

export interface SavingsInput {
    colorDiscount: number;
    offersDiscount: number;
    accessoriesDiscount: number;
    servicesDiscount: number;
    insuranceAddonsDiscount: number;
    isReferralActive: boolean;
    referralBonus: number;
    totalSavings: number;
}

export function buildSavingsHelpLines(input: SavingsInput): string[] {
    const {
        colorDiscount,
        offersDiscount,
        accessoriesDiscount,
        servicesDiscount,
        insuranceAddonsDiscount,
        isReferralActive,
        referralBonus,
        totalSavings,
    } = input;

    return [
        colorDiscount > 0 ? `Vehicle Offer: ₹${colorDiscount.toLocaleString('en-IN')}` : null,
        offersDiscount < 0 ? `Offers/Plans: ₹${Math.abs(offersDiscount).toLocaleString('en-IN')}` : null,
        accessoriesDiscount > 0 ? `Accessories: ₹${accessoriesDiscount.toLocaleString('en-IN')}` : null,
        servicesDiscount > 0 ? `Services: ₹${servicesDiscount.toLocaleString('en-IN')}` : null,
        insuranceAddonsDiscount > 0 ? `Insurance Add-ons: ₹${insuranceAddonsDiscount.toLocaleString('en-IN')}` : null,
        isReferralActive ? `Member Invite: ₹${referralBonus.toLocaleString('en-IN')}` : null,
        `Total: ₹${totalSavings.toLocaleString('en-IN')}`,
    ].filter(Boolean) as string[];
}

export interface SurgeInput {
    colorSurge: number;
    offersDiscount: number;
    accessoriesSurge: number;
    servicesSurge: number;
    insuranceAddonsSurge: number;
    totalSurge: number;
}

export function buildSurgeHelpLines(input: SurgeInput): string[] {
    const { colorSurge, offersDiscount, accessoriesSurge, servicesSurge, insuranceAddonsSurge, totalSurge } = input;

    return [
        colorSurge > 0 ? `Dealer Surge: ₹${colorSurge.toLocaleString('en-IN')}` : null,
        offersDiscount > 0 ? `Offers/Plans: ₹${offersDiscount.toLocaleString('en-IN')}` : null,
        accessoriesSurge > 0 ? `Accessories: ₹${accessoriesSurge.toLocaleString('en-IN')}` : null,
        servicesSurge > 0 ? `Services: ₹${servicesSurge.toLocaleString('en-IN')}` : null,
        insuranceAddonsSurge > 0 ? `Insurance Add-ons: ₹${insuranceAddonsSurge.toLocaleString('en-IN')}` : null,
        totalSurge > 0 ? `Total: ₹${totalSurge.toLocaleString('en-IN')}` : null,
    ].filter(Boolean) as string[];
}

// ── Product Image Resolver ─────────────────────────────────────

export function resolveProductImage(activeColorConfig: any, bodyType?: string): string {
    if (activeColorConfig?.image) return activeColorConfig.image;
    if (activeColorConfig?.image_url) return activeColorConfig.image_url;
    if (activeColorConfig?.imageUrl) return activeColorConfig.imageUrl;
    if (activeColorConfig?.gallery_urls?.length > 0) return activeColorConfig.gallery_urls[0];

    switch (bodyType) {
        case 'SCOOTER':
            return '/images/categories/scooter_nobg.webp';
        case 'MOTORCYCLE':
            return '/images/categories/motorcycle_nobg.webp';
        case 'MOPED':
            return '/images/categories/moped_nobg.webp';
        default:
            return '/images/hero-bike.webp';
    }
}

// ── Interest Rate Formatter ───────────────────────────────────

export function formatInterestRate(rate: number): string {
    if (rate === 0) return '0%';
    const pct = rate * 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2-A: Canonical Compute Layer
// All functions below are pure (no side-effects) and shared by BOTH Desktop
// and Mobile shells.  These are the single source of truth for PDP pricing
// math; any divergence from this file is a parity bug.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────

export interface PriceBreakupRow {
    label: string;
    value: number | string;
    caption?: string;
    isSpacer?: boolean;
    isDeduction?: boolean;
    isInfo?: boolean;
    helpText?: string[];
    breakdown?: { label: string; amount: number }[];
    comparisonOptions?: any;
}

export interface PriceBreakupResult {
    breakup: PriceBreakupRow[];
    totalSavings: number;
    totalSurge: number;
    savingsHelpLines: string[];
    surgeHelpLines: string[];
}

/** Canonical TAT label — shared by all three render paths */
export function buildTatLabel(winnerTatDays: number | null): string {
    if (winnerTatDays !== null && Number.isFinite(winnerTatDays) && winnerTatDays >= 0) {
        if (winnerTatDays === 0) return 'SAME DAY DELIVERY';
        if (winnerTatDays === 1) return '1 DAY';
        return `${winnerTatDays} DAYS`;
    }
    return 'ETA UPDATING';
}

/** Canonical delivery-by label */
export function buildDeliveryByLabel(winnerTatDays: number | null): string | null {
    if (winnerTatDays === null || !Number.isFinite(winnerTatDays) || winnerTatDays < 0) return null;
    const now = new Date();
    const by = new Date(now);
    by.setDate(by.getDate() + winnerTatDays);
    const datePart = by.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return winnerTatDays === 0 ? `Today, ${datePart}` : datePart;
}

// ── buildPriceBreakup() ────────────────────────────────────────
//
// PROMOTED from PdpPricingSection.tsx (was duplicated / had wrong TAT source).
// Now reads TAT from `bestOffer` (canonical) instead of `data` directly.
// PdpPricingSection.tsx must remove its local copy and import this function.

export function buildPriceBreakup(
    data: any,
    coinPricing: any,
    isReferralActive: boolean,
    initialLocation?: any,
    bestOffer?: any // ← canonical TAT/studio source (F1 fix)
): PriceBreakupResult {
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
        colorDiscount = 0,
        colorSurge = 0,
        offersDiscount = 0,
        accessoriesDiscount = 0,
        accessoriesSurge = 0,
        servicesDiscount = 0,
        servicesSurge = 0,
        insuranceAddonsDiscount = 0,
        insuranceAddonsSurge = 0,
        selectedAccessories = [],
        quantities = {},
        activeAccessories = [],
        warrantyItems = [],
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

    const savingsHelpLines: string[] = [
        colorDiscount > 0 ? `Vehicle Offer: ₹ ${colorDiscount.toLocaleString('en-IN')}` : null,
        offersDiscount < 0 ? `Offers/Plans: ₹ ${Math.abs(offersDiscount).toLocaleString('en-IN')}` : null,
        accessoriesDiscount > 0 ? `Accessories: ₹ ${accessoriesDiscount.toLocaleString('en-IN')}` : null,
        servicesDiscount > 0 ? `Services: ₹ ${servicesDiscount.toLocaleString('en-IN')}` : null,
        insuranceAddonsDiscount > 0 ? `Insurance Add-ons: ₹ ${insuranceAddonsDiscount.toLocaleString('en-IN')}` : null,
        isReferralActive ? `Member Invite: ₹ ${REFERRAL_BONUS.toLocaleString('en-IN')}` : null,
        `Total: ₹ ${totalSavings.toLocaleString('en-IN')}`,
    ].filter(Boolean) as string[];

    const surgeHelpLines: string[] = [
        colorSurge > 0 ? `Dealer Surge: ₹ ${colorSurge.toLocaleString('en-IN')}` : null,
        offersDiscount > 0 ? `Offers/Plans: ₹ ${offersDiscount.toLocaleString('en-IN')}` : null,
        accessoriesSurge > 0 ? `Accessories: ₹ ${accessoriesSurge.toLocaleString('en-IN')}` : null,
        servicesSurge > 0 ? `Services: ₹ ${servicesSurge.toLocaleString('en-IN')}` : null,
        insuranceAddonsSurge > 0 ? `Insurance Add-ons: ₹ ${insuranceAddonsSurge.toLocaleString('en-IN')}` : null,
        totalSurge > 0 ? `Total: ₹ ${totalSurge.toLocaleString('en-IN')}` : null,
    ].filter(Boolean) as string[];

    // ── TAT from bestOffer (canonical source — F1 fix) ──
    const tatRaw =
        (bestOffer as any)?.delivery_tat_days ??
        (bestOffer as any)?.deliveryTatDays ??
        (bestOffer as any)?.tat_days ??
        null;
    const winnerTatDays = tatRaw !== null && tatRaw !== undefined ? Number(tatRaw) : null;
    const deliveryTatLabel = buildTatLabel(winnerTatDays);
    const deliveryByLabel = buildDeliveryByLabel(winnerTatDays);
    const studioIdLabel =
        (bestOffer as any)?.studio_id || (bestOffer as any)?.studioId || (bestOffer as any)?.studio || null;
    const studioDistanceKm = Number.isFinite(Number((bestOffer as any)?.distance_km))
        ? Number((bestOffer as any)?.distance_km)
        : null;

    const breakup: PriceBreakupRow[] = [
        // Group 1: Charges
        { label: 'Ex-Showroom', value: baseExShowroom, caption: 'Factory List Price' },
        {
            label: 'Registration',
            value: rtoEstimates,
            caption: `${(initialLocation?.state || initialLocation?.district || 'STATE').toUpperCase()} • Road Tax & Fees ${regType === 'COMPANY' ? 'Company' : regType === 'BH' ? 'Bharat Series' : 'Individual'}`,
            breakdown: rtoBreakdown,
            comparisonOptions: data?.rtoOptions,
        },
        {
            label: 'Insurance',
            value: baseInsurance,
            caption: 'Comprehensive (1+5 Years)',
            breakdown: insuranceBreakdown,
        },
        {
            label: 'Insurance Add-ons',
            value: Math.round((data.insuranceAddonsPrice || 0) + (data.insuranceAddonsDiscount || 0)),
            caption: 'Zero Dep & RSA Benefits',
        },
        {
            label: 'Accessories',
            value: accessoriesPrice,
            caption: 'Custom Selection',
            breakdown: (activeAccessories as any[])
                .filter((a: any) => (selectedAccessories as string[]).includes(a.id))
                .map((a: any) => ({
                    label: a.displayName || a.name,
                    amount: (a.discountPrice || a.price) * ((quantities as any)[a.id] || 1),
                })),
        },
        {
            label: 'Services',
            value: (data.servicesPrice || 0) + (data.servicesDiscount || 0),
            caption: 'RSA & Maintenance Pak',
        },
        {
            label: 'Warranty',
            value: 0,
            caption:
                warrantyItems?.length > 0
                    ? `${(warrantyItems as any[]).map((w: any) => `${Math.round(w.days / 365)}Y / ${w.km.toLocaleString()}K`).join(' + ')}`
                    : 'Manufacturer Standard',
        },
        ...(otherCharges > 0 ? [{ label: 'Other Charges', value: otherCharges, caption: 'Handling & Fees' }] : []),

        // Spacer → Group 2
        { label: '', value: '', isSpacer: true },

        // Group 2: Discounts / Surge
        ...(totalSavings > 0
            ? [
                  {
                      label: "O' Circle Privileged",
                      value: totalSavings,
                      caption: 'Exclusive Member Benefit',
                      isDeduction: true,
                      helpText: [...savingsHelpLines],
                  },
              ]
            : []),
        ...(coinPricing && coinPricing.discount > 0
            ? [
                  {
                      label: `Bcoin Used - ${coinPricing.coinsUsed}`,
                      value: coinPricing.discount,
                      caption: 'Loyalty Points Applied',
                      isDeduction: true,
                  },
              ]
            : []),
        ...(totalSurge > 0
            ? [{ label: 'Surge Charges', value: totalSurge, caption: 'Demand Adjustments', helpText: surgeHelpLines }]
            : []),

        // Spacer → Group 3
        { label: '', value: '', isSpacer: true },

        // Group 3: Delivery Info
        { label: 'TAT', value: deliveryTatLabel, caption: 'Operational Timeline', isInfo: true },
        ...(deliveryByLabel
            ? [{ label: 'Delivery By', value: deliveryByLabel, caption: 'Est. Handover', isInfo: true }]
            : []),
        ...(studioIdLabel
            ? [
                  {
                      label: 'Studio ID',
                      value: String(studioIdLabel).toUpperCase(),
                      caption: 'Dispatch Node',
                      isInfo: true,
                  },
              ]
            : []),
        ...(studioDistanceKm !== null
            ? [
                  {
                      label: 'Distance',
                      value: `${studioDistanceKm.toFixed(1)} km away`,
                      caption: 'Logistics Proximity',
                      isInfo: true,
                  },
              ]
            : []),
    ];

    return { breakup, totalSavings, totalSurge, savingsHelpLines, surgeHelpLines };
}

// ── buildPdpCommonState() ──────────────────────────────────────
//
// Single compute hub consumed by DesktopPDP, MobilePDP, and
// PdpPricingSection.  Call once per render; pass result to child
// components and ParitySnapshot.

export interface PdpCommonStateInput {
    data: any;
    bestOffer?: any;
    walletCoins: number | null;
}

export interface PdpCommonState {
    // Coin / on-road
    coinPricing: { effectivePrice: number; discount: number; coinsUsed: number } | null;
    displayOnRoad: number;
    bCoinEquivalent: number;
    // Savings & surge
    totalSavings: number;
    totalSurge: number;
    savingsHelpLines: string[];
    surgeHelpLines: string[];
    // Delivery (all from bestOffer — canonical source)
    winnerTatDays: number | null;
    deliveryTatLabel: string;
    deliveryByLabel: string | null;
    studioIdLabel: string | null;
    dealerIdLabel: string | null;
    studioDistanceKm: number | null;
    // Finance
    financeMetrics: FinanceMetrics;
    footerEmi: number;
}

export function buildPdpCommonState(input: PdpCommonStateInput): PdpCommonState {
    const { data, bestOffer, walletCoins } = input;
    const { totalOnRoad = 0, isReferralActive = false, emiTenure = 0, loanAmount = 0, initialFinance } = data;

    const REFERRAL_BONUS = 5000;

    // ── Coin pricing — canonical SOT: computeOClubPricing from coin.ts ──
    const walletCoinsValue = Number(walletCoins);
    let coinPricing: PdpCommonState['coinPricing'] = null;
    if (Number.isFinite(walletCoinsValue) && walletCoinsValue > 0) {
        coinPricing = computeOClubPricing(totalOnRoad, walletCoinsValue);
    }
    const displayOnRoad = coinPricing?.effectivePrice ?? totalOnRoad;

    // bCoinEquivalent — canonical: OCLUB_COIN_VALUE = 1000/13, NOT ₹1/coin
    const bCoinEquivalent = coinsNeededForPrice(displayOnRoad);

    // ── Savings & surge ──
    const {
        colorDiscount = 0,
        offersDiscount = 0,
        accessoriesDiscount = 0,
        servicesDiscount = 0,
        insuranceAddonsDiscount = 0,
        colorSurge = 0,
        accessoriesSurge = 0,
        servicesSurge = 0,
        insuranceAddonsSurge = 0,
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

    const savingsHelpLines: string[] = [
        colorDiscount > 0 ? `Vehicle Offer: ₹${colorDiscount.toLocaleString('en-IN')}` : null,
        offersDiscount < 0 ? `Offers/Plans: ₹${Math.abs(offersDiscount).toLocaleString('en-IN')}` : null,
        accessoriesDiscount > 0 ? `Accessories: ₹${accessoriesDiscount.toLocaleString('en-IN')}` : null,
        servicesDiscount > 0 ? `Services: ₹${servicesDiscount.toLocaleString('en-IN')}` : null,
        insuranceAddonsDiscount > 0 ? `Insurance Add-ons: ₹${insuranceAddonsDiscount.toLocaleString('en-IN')}` : null,
        isReferralActive ? `Member Invite: ₹${REFERRAL_BONUS.toLocaleString('en-IN')}` : null,
        `Total: ₹${totalSavings.toLocaleString('en-IN')}`,
    ].filter(Boolean) as string[];

    const surgeHelpLines: string[] = [
        colorSurge > 0 ? `Dealer Surge: ₹${colorSurge.toLocaleString('en-IN')}` : null,
        offersDiscount > 0 ? `Offers/Plans: ₹${offersDiscount.toLocaleString('en-IN')}` : null,
        accessoriesSurge > 0 ? `Accessories: ₹${accessoriesSurge.toLocaleString('en-IN')}` : null,
        servicesSurge > 0 ? `Services: ₹${servicesSurge.toLocaleString('en-IN')}` : null,
        insuranceAddonsSurge > 0 ? `Insurance Add-ons: ₹${insuranceAddonsSurge.toLocaleString('en-IN')}` : null,
        totalSurge > 0 ? `Total: ₹${totalSurge.toLocaleString('en-IN')}` : null,
    ].filter(Boolean) as string[];

    // ── Delivery (canonical bestOffer source) ──
    const tatRaw =
        (bestOffer as any)?.delivery_tat_days ??
        (bestOffer as any)?.deliveryTatDays ??
        (bestOffer as any)?.tat_days ??
        null;
    const winnerTatDays = tatRaw !== null && tatRaw !== undefined ? Number(tatRaw) : null;
    const deliveryTatLabel = buildTatLabel(winnerTatDays);
    const deliveryByLabel = buildDeliveryByLabel(winnerTatDays);
    const studioIdLabel =
        (bestOffer as any)?.studio_id || (bestOffer as any)?.studioId || (bestOffer as any)?.studio || null;
    const dealerIdLabel =
        (bestOffer as any)?.dealerId || (bestOffer as any)?.dealer_id || (bestOffer as any)?.dealer?.id || null;
    const studioDistanceKm = Number.isFinite(Number((bestOffer as any)?.distance_km))
        ? Number((bestOffer as any)?.distance_km)
        : null;

    // ── Finance ──
    const financeMetrics = computeFinanceMetrics({
        scheme: initialFinance?.scheme,
        displayOnRoad,
        userDownPayment: data.userDownPayment || 0,
        loanAmount,
        totalOnRoad,
        emiTenure,
    });
    const footerEmi = financeMetrics.monthlyEmi;

    return {
        coinPricing,
        displayOnRoad,
        bCoinEquivalent,
        totalSavings,
        totalSurge,
        savingsHelpLines,
        surgeHelpLines,
        winnerTatDays,
        deliveryTatLabel,
        deliveryByLabel,
        studioIdLabel,
        dealerIdLabel,
        studioDistanceKm,
        financeMetrics,
        footerEmi,
    };
}

// ── buildCommandBarState() ─────────────────────────────────────
//
// Pure function shared by BOTH FloatingCommandBar (Desktop) and
// PdpCommandBar (Mobile/Unified).  Eliminates the inline compute
// drift between the two bars (F2 fix).

export interface CommandBarStateInput {
    displayOnRoad: number;
    totalOnRoad: number;
    totalSavings: number;
    coinPricing: { discount: number; coinsUsed: number } | null;
    footerEmi: number;
    emiTenure: number;
    isGated: boolean;
    serviceability?: { isServiceable: boolean; status: string } | null;
}

export interface CommandBarState {
    displayOnRoad: number;
    bCoinEquivalent: number;
    /** O'Circle savings only */
    totalSavings: number;
    /** O'Circle + bcoin combined — shown as strikethrough base in bar */
    combinedSavings: number;
    /** Effective "from" price before savings (for strikethrough display) */
    strikethroughPrice: number;
    footerEmi: number;
    emiTenure: number;
    isShareMode: boolean;
    isDisabled: boolean;
    primaryLabel: string;
}

export function buildCommandBarState(input: CommandBarStateInput): CommandBarState {
    const { displayOnRoad, totalOnRoad, totalSavings, coinPricing, footerEmi, emiTenure, isGated, serviceability } =
        input;

    const bCoinEquivalent = coinsNeededForPrice(displayOnRoad); // canonical: OCLUB_COIN_VALUE = 1000/13
    const bCoinDiscount = coinPricing?.discount ?? 0;
    const combinedSavings = Math.max(0, totalSavings + bCoinDiscount);
    const strikethroughPrice = Math.max(displayOnRoad, totalOnRoad + combinedSavings);

    const isShareMode = isGated;
    const isServiceabilityBlocked = serviceability?.status === 'SET' && !serviceability?.isServiceable;
    const isDisabled = !isShareMode && isServiceabilityBlocked;
    const primaryLabel = isDisabled ? 'NOT SERVICEABLE' : isShareMode ? 'SHARE QUOTE' : 'GET QUOTE';

    return {
        displayOnRoad,
        bCoinEquivalent,
        totalSavings,
        combinedSavings,
        strikethroughPrice,
        footerEmi,
        emiTenure,
        isShareMode,
        isDisabled,
        primaryLabel,
    };
}
