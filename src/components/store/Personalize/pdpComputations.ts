/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 7: Pure computation helpers extracted from DesktopPDP.
 * All functions are side-effect-free and independently testable.
 */

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
