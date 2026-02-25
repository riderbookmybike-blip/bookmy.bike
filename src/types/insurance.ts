import { VehicleType, FormulaComponent, CalculationResultItem } from './registration';

export type InsuranceVariable =
    | 'EX_SHOWROOM'
    | 'IDV' // Insured Declared Value (usually 95% of Ex-Showroom)
    | 'ENGINE_CC'
    | 'BASE_PREMIUM' // Total of OD + TP
    | 'NET_PREMIUM' // Total before GST
    | 'TARGET_COMPONENT';

export interface TenureConfig {
    min: number;
    max: number;
    default: number;
    allowed: number[];
    linkedTo?: 'OD' | 'TP'; // For addons
}

export interface InsuranceRuleTenureConfig {
    od: TenureConfig;
    tp: TenureConfig;
    addons: TenureConfig;
}

export type DiscountPayoutScope = 'ALL' | 'BRAND' | 'VEHICLE_TYPE' | 'MODEL';
export type DiscountPayoutVehicleType = 'SCOOTER' | 'MOTORCYCLE' | 'EV';
export type DiscountPayoutBasis = 'NET_PREMIUM' | 'GROSS_PREMIUM' | 'OD_NET';

export interface DiscountPayoutEntry {
    id: string;
    scope: DiscountPayoutScope;
    brandId?: string;
    brandName?: string;
    vehicleType?: DiscountPayoutVehicleType;
    modelId?: string;
    modelName?: string;
    odDiscount: number;
    payoutPercent: number;
    payoutBasis: DiscountPayoutBasis;
}

export interface InsuranceRule {
    id: string;
    displayId?: string; // Standard 9-char random ID
    ruleName: string;
    stateCode: string;
    insurerName: string;
    vehicleType: VehicleType;
    effectiveFrom: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';

    // Config
    idvPercentage: number; // e.g., 95 for 95%

    // Components
    odComponents: FormulaComponent[]; // Own Damage components
    tpComponents: FormulaComponent[]; // Third Party components
    addons: FormulaComponent[]; // Add-on components (Zero Dep etc)

    gstPercentage: number; // usually 18

    // NCB & Discounts (applied to OD)
    ncbPercentage?: number; // No Claim Bonus — 0, 20, 25, 35, 45, 50
    discountPercentage?: number; // Voluntary/other discount on OD
    discountPayoutConfig?: DiscountPayoutEntry[];

    // Tenure Configuration
    tenureConfig?: InsuranceRuleTenureConfig;

    version: number;
    lastUpdated: string;
}

export interface InsuranceCalculationContext {
    exShowroom: number;
    engineCc: number;
    fuelType: string;

    // Policy Details
    isNewVehicle?: boolean; // Default true
    odTenure?: 1 | 3 | 5; // Default 1
    tpTenure?: 1 | 5; // Default 5 for New
    ncbPercentage?: 0 | 20 | 25 | 35 | 45 | 50; // Default 0

    // Optional manually specified IDV
    customIdv?: number;
}

export interface InsuranceCalculationResult {
    idv: number;
    odBreakdown: CalculationResultItem[];
    tpBreakdown: CalculationResultItem[];
    addonBreakdown: CalculationResultItem[];

    odTotal: number;
    tpTotal: number;
    addonsTotal: number;

    netPremium: number;
    gstAmount: number;
    totalPremium: number;

    // NCB & Discount breakdown
    ncbDiscount?: number;
    discountAmount?: number;

    ruleId: string;

    // Tenure info applied in calculation
    tenures?: {
        od: number;
        tp: number;
        addons: number;
    };
}
