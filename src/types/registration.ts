export type VehicleType = 'TWO_WHEELER' | 'THREE_WHEELER' | 'FOUR_WHEELER';

export type RegistrationType = 'STATE_INDIVIDUAL' | 'BH_SERIES' | 'COMPANY' | 'TEMP';

export type FormulaVariable =
    | 'EX_SHOWROOM'
    | 'INVOICE_BASE'
    | 'ENGINE_CC'
    | 'KW_RATING' // For EVs
    | 'SEATING_CAPACITY'
    | 'GROSS_VEHICLE_WEIGHT'
    | 'PREVIOUS_TAX_TOTAL'
    | 'TARGET_COMPONENT'
    | 'IDV';

export type Operator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_EQUALS' | 'LESS_EQUALS';

export type ComponentType = 'PERCENTAGE' | 'FIXED' | 'CONDITIONAL' | 'SLAB' | 'SWITCH';

export interface SlabRange {
    id: string;
    min: number;
    max: number | null; // null = Infinity
    percentage: number;
    cessPercentage?: number; // Optional Cess on top of the calculated Tax
    applicableFuels?: string[]; // e.g. ['PETROL', 'DIESEL']
    slabBasis?: FormulaVariable; // e.g. 'ENGINE_CC' or 'KW_RATING'
    amount?: number; // Fixed amount for this slab
    meta?: string; // Descriptive text
}

export interface SwitchCase {
    id: string;
    label: string; // "Individual", "Company"
    matchValue: string; // 'STATE_INDIVIDUAL', 'COMPANY'
    block: FormulaComponent[];
}

export interface FormulaComponent {
    id: string;
    type: ComponentType;
    label: string; // "Road Tax", "Smart Card Fee"

    // Percentage
    percentage?: number;
    basis?: FormulaVariable; // Defaults to EX_SHOWROOM if undefined
    targetComponentId?: string; // If basis is TARGET_COMPONENT

    // Fixed
    amount?: number;

    // Conditional (Binary)
    conditionVariable?: string; // 'REG_TYPE', 'FUEL_TYPE', 'ENGINE_CC'
    conditionOperator?: Operator;
    conditionValue?: string | number;

    thenBlock?: FormulaComponent[];
    elseBlock?: FormulaComponent[];

    // Switch (Multi-way)
    switchVariable?: string; // 'REG_TYPE'
    cases?: SwitchCase[];

    // Slab
    slabVariable?: FormulaVariable;
    ranges?: SlabRange[];

    // Alternative Slabs (e.g. for EV based on KW instead of CC)
    secondarySlabs?: {
        id: string;
        label: string; // "EV Slab" or "BH Series Slab"
        slabVariable: FormulaVariable;
        applicableFuels: string[]; // ['EV']
        applicableRegTypes?: string[]; // ['BH_SERIES']
        ranges: SlabRange[];
    }[];

    // Options
    roundingMode?: 'NONE' | 'ROUND' | 'CEIL' | 'FLOOR';
    variantTreatment?: 'NONE' | 'PRO_RATA'; // Controls behavior for BH Series etc.
    isRoadTax?: boolean; // If true, applies State/BH tenure ratio and Company multiplier

    // Inline Fuel Split (Simpler than Switch)
    fuelMatrix?: {
        PETROL?: number;
        DIESEL?: number;
        EV?: number;
        CNG?: number;
    };
}

export interface RegistrationRule {
    id: string;
    displayId?: string; // Standard 9-char random ID
    ruleName: string;
    stateCode: string; // 'MH', 'KA', 'DL'
    vehicleType: VehicleType;
    effectiveFrom: string;
    status: 'ACTIVE' | 'INACTIVE';

    // Smart Variant Config
    stateTenure: number; // e.g. 15
    bhTenure: number; // e.g. 2
    companyMultiplier: number; // e.g. 3 (some states charge 3x for company)

    components: FormulaComponent[];
    version: number;
    lastUpdated: string;
}

export interface CalculationContext {
    exShowroom: number;
    invoiceBase?: number; // Often same as Ex-S but good to have
    engineCc?: number;
    fuelType?: string; // 'PETROL', 'EV'
    regType: RegistrationType; // 'STATE_INDIVIDUAL', 'BH_SERIES'
    kwRating?: number; // For EVs
    seatingCapacity?: number;
    grossVehicleWeight?: number;

    // Injected from Rule for Smart Calculations
    variantConfig?: {
        stateTenure: number;
        bhTenure: number;
        companyMultiplier: number;
    };
}

export interface CalculationResultItem {
    label: string;
    amount: number;
    meta?: string; // "10% of 100000"
    componentId?: string; // For referencing in later calculations
}

export interface CalculationResult {
    breakdown: CalculationResultItem[];
    totalAmount: number;
    ruleId: string;
    ruleVersion: number;
}
