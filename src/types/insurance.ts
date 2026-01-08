import { VehicleType, FormulaComponent, CalculationResultItem } from './registration';

export type InsuranceVariable =
    | 'EX_SHOWROOM'
    | 'IDV' // Insured Declared Value (usually 95% of Ex-Showroom)
    | 'ENGINE_CC'
    | 'BASE_PREMIUM' // Total of OD + TP
    | 'NET_PREMIUM'  // Total before GST
    | 'TARGET_COMPONENT';

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
    addons: FormulaComponent[];       // Add-on components (Zero Dep etc)

    gstPercentage: number; // usually 18

    version: number;
    lastUpdated: string;
}

export interface InsuranceCalculationContext {
    exShowroom: number;
    engineCc: number;
    fuelType: string;
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

    ruleId: string;
}
