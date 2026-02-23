/**
 * Shared type contracts for DesktopPDP and its extracted sub-components.
 * Centralises previously ad-hoc `any` types used across accordion renderers,
 * pricing cards, and the floating command bar.
 */

/* ── Category IDs ─────────────────────────────────────────────── */

export type CategoryId = 'ACCESSORIES' | 'INSURANCE' | 'REGISTRATION' | 'SERVICES' | 'WARRANTY';

export type HeroTabId = 'GALLERY' | 'PRICING' | 'FINANCE' | 'FINANCE_SUMMARY';

/* ── Config Items (Accessories / Services / Insurance Add-ons) ─ */

export interface ConfigItem {
    id: string;
    name: string;
    displayName?: string;
    description?: string;
    price: number;
    discountPrice?: number;
    isMandatory?: boolean;
    image?: string;
    maxQty?: number;
    productGroup?: string;
    brand?: string;
    variantName?: string;
    inclusionType?: 'BUNDLE' | 'OPTIONAL';
    breakdown?: BreakdownEntry[];
}

export interface BreakdownEntry {
    label: string;
    name?: string;
    amount?: number;
    value?: number;
}

/* ── Insurance ─────────────────────────────────────────────────── */

export type InsuranceItem = ConfigItem;

/* ── Registration ──────────────────────────────────────────────── */

export interface RegistrationOption {
    id: 'STATE' | 'BH' | 'COMPANY';
    name: string;
    price: number;
    description?: string;
    breakdown?: BreakdownEntry[];
}

/* ── Pricing Breakup ───────────────────────────────────────────── */

export interface PricingBreakupRow {
    label: string;
    value: number | string;
    isInfo?: boolean;
    isDeduction?: boolean;
    breakdown?: BreakdownEntry[];
    comparisonOptions?: RegistrationOption[];
    helpText?: string[];
}

/* ── Finance Metrics (shared by footer EMI + FinanceSummaryPanel) */

export interface FinanceCharge {
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    impact: 'UPFRONT' | 'FUNDED';
    calculationBasis?: 'LOAN_AMOUNT' | 'ON_ROAD';
}

export interface FinanceScheme {
    id?: string;
    name?: string;
    interestRate?: number;
    interestType?: 'REDUCING' | 'FLAT';
    charges?: FinanceCharge[];
}

export interface FinanceBank {
    name?: string;
}

export interface InitialFinance {
    bank?: FinanceBank;
    scheme?: FinanceScheme;
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
}

/* ── Color Config ──────────────────────────────────────────────── */

export interface ColorConfig {
    id: string;
    name: string;
    hex: string;
    class?: string;
    image?: string;
    image_url?: string;
    imageUrl?: string;
    gallery_urls?: string[];
    assets?: string[];
    video?: string;
}

/* ── Serviceability ────────────────────────────────────────────── */

export interface ServiceabilityInfo {
    isServiceable: boolean;
    status: string;
    pincode?: string;
    taluka?: string;
}
