import type { InsuranceRule, RTORule } from '@/types/booking';

// LOCKED MASTER RULES (Owned by Super Admin)

export const MOCK_INSURANCE_RULES: InsuranceRule[] = [
    {
        id: 'IR-001',
        providerName: 'HDFC Ergo',
        baseRate: 3.5, // 3.5% of Ex-Showroom
        addons: [
            { name: 'Zero Depreciation', cost: 1500 },
            { name: 'Engine Protect', cost: 800 },
        ],
    },
    {
        id: 'IR-002',
        providerName: 'ICICI Lombard',
        baseRate: 3.2,
        addons: [{ name: 'Zero Depreciation', cost: 1800 }],
    },
];

export const MOCK_RTO_RULES: RTORule[] = [
    {
        state: 'Karnataka',
        roadTaxPercent: 18.2, // High tax state
        registrationFee: 2000,
    },
    {
        state: 'Maharashtra',
        roadTaxPercent: 14.0,
        registrationFee: 1500,
    },
    {
        state: 'Delhi',
        roadTaxPercent: 8.0,
        registrationFee: 1000,
    },
];

export type AumsPriceBaselineRow = {
    state_code?: string | null;
    publish_stage?: string | null;
    ex_showroom?: number | string | null;
    rto_total_state?: number | string | null;
    rto_total_bh?: number | string | null;
    rto_total_company?: number | string | null;
    ins_sum_mandatory_insurance?: number | string | null;
    ins_sum_mandatory_insurance_gst_amount?: number | string | null;
    ins_gross_premium?: number | string | null;
    addon_zero_depreciation_total_amount?: number | string | null;
    addon_return_to_invoice_total_amount?: number | string | null;
};

export type AumsSkuPricingBaseline = {
    exShowroom: number;
    rto: number;
    insuranceTp: number;
    zeroDep: number;
    rti: number;
    sourceStateCode: string | null;
    sourcePublishStage: string | null;
};

export type AumsRequestBaselineItem = {
    cost_type: 'EX_SHOWROOM' | 'RTO_REGISTRATION' | 'INSURANCE_TP';
    expected_amount: number;
    description: string;
};

export function toPositiveAmount(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100) / 100;
}

export function selectPreferredPriceRow(
    rows: AumsPriceBaselineRow[] | null | undefined,
    preferredStateCode: string = 'MH'
): AumsPriceBaselineRow | null {
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const stateCode = String(preferredStateCode || 'MH')
        .trim()
        .toUpperCase();
    const activeRows = rows.filter(row => String(row?.publish_stage || '').toUpperCase() === 'PUBLISHED');
    const candidateRows = activeRows.length > 0 ? activeRows : rows;

    return (
        candidateRows.find(
            row =>
                String(row?.state_code || '').toUpperCase() === stateCode && toPositiveAmount(row?.rto_total_state) > 0
        ) ||
        candidateRows.find(row => String(row?.state_code || '').toUpperCase() === stateCode) ||
        candidateRows.find(row => toPositiveAmount(row?.rto_total_state) > 0) ||
        candidateRows[0] ||
        null
    );
}

export function resolveSkuPricingBaseline(
    rows: AumsPriceBaselineRow[] | null | undefined,
    preferredStateCode: string = 'MH'
): AumsSkuPricingBaseline | null {
    const preferredRow = selectPreferredPriceRow(rows, preferredStateCode);
    if (!preferredRow) return null;

    const exShowroom = toPositiveAmount(preferredRow.ex_showroom);
    const rto =
        toPositiveAmount(preferredRow.rto_total_state) ||
        toPositiveAmount(preferredRow.rto_total_bh) ||
        toPositiveAmount(preferredRow.rto_total_company);

    const mandatoryInsurance =
        toPositiveAmount(preferredRow.ins_sum_mandatory_insurance) +
        toPositiveAmount(preferredRow.ins_sum_mandatory_insurance_gst_amount);
    const insuranceTp = mandatoryInsurance > 0 ? mandatoryInsurance : toPositiveAmount(preferredRow.ins_gross_premium);

    return {
        exShowroom,
        rto,
        insuranceTp,
        zeroDep: toPositiveAmount(preferredRow.addon_zero_depreciation_total_amount),
        rti: toPositiveAmount(preferredRow.addon_return_to_invoice_total_amount),
        sourceStateCode: preferredRow.state_code ? String(preferredRow.state_code).toUpperCase() : null,
        sourcePublishStage: preferredRow.publish_stage ? String(preferredRow.publish_stage).toUpperCase() : null,
    };
}

export function buildRequestBaselineItemsFromPricing(
    rows: AumsPriceBaselineRow[] | null | undefined,
    preferredStateCode: string = 'MH'
): AumsRequestBaselineItem[] {
    const baseline = resolveSkuPricingBaseline(rows, preferredStateCode);
    if (!baseline) return [];

    const items: AumsRequestBaselineItem[] = [];
    if (baseline.exShowroom > 0) {
        items.push({
            cost_type: 'EX_SHOWROOM',
            expected_amount: baseline.exShowroom,
            description: 'Auto from SKU pricing',
        });
    }
    if (baseline.rto > 0) {
        items.push({
            cost_type: 'RTO_REGISTRATION',
            expected_amount: baseline.rto,
            description: 'Auto from SKU pricing',
        });
    }
    if (baseline.insuranceTp > 0) {
        items.push({
            cost_type: 'INSURANCE_TP',
            expected_amount: baseline.insuranceTp,
            description: 'Mandatory insurance from SKU pricing',
        });
    }

    return items;
}

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
