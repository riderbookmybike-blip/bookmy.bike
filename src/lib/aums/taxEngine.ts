import { InsuranceRule, RTORule } from "@/types/booking";

// LOCKED MASTER RULES (Owned by Super Admin)

export const MOCK_INSURANCE_RULES: InsuranceRule[] = [
    {
        id: 'IR-001',
        providerName: 'HDFC Ergo',
        baseRate: 3.5, // 3.5% of Ex-Showroom
        addons: [
            { name: 'Zero Depreciation', cost: 1500 },
            { name: 'Engine Protect', cost: 800 }
        ]
    },
    {
        id: 'IR-002',
        providerName: 'ICICI Lombard',
        baseRate: 3.2,
        addons: [
            { name: 'Zero Depreciation', cost: 1800 }
        ]
    }
];

export const MOCK_RTO_RULES: RTORule[] = [
    {
        state: 'Karnataka',
        roadTaxPercent: 18.2, // High tax state
        registrationFee: 2000
    },
    {
        state: 'Maharashtra',
        roadTaxPercent: 14.0,
        registrationFee: 1500
    },
    {
        state: 'Delhi',
        roadTaxPercent: 8.0,
        registrationFee: 1000
    }
];

export function calculateInsurance(exShowroomPrice: number, ruleId: string = 'IR-001'): number {
    const rule = MOCK_INSURANCE_RULES.find(r => r.id === ruleId);
    if (!rule) return 0;

    const basePremium = exShowroomPrice * (rule.baseRate / 100);
    const addonsCost = rule.addons.reduce((sum, addon) => sum + addon.cost, 0);

    // Returning rounded value
    return Math.round(basePremium + addonsCost);
}

export function calculateRTO(exShowroomPrice: number, state: string = 'Karnataka'): number {
    const rule = MOCK_RTO_RULES.find(r => r.state === state);
    // Fallback to Karnataka if state not found
    const activeRule = rule || MOCK_RTO_RULES[0];

    const tax = exShowroomPrice * (activeRule.roadTaxPercent / 100);
    return Math.round(tax + activeRule.registrationFee);
}
