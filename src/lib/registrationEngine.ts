import { RegistrationRule, CalculationContext, CalculationResult } from '@/types/registration';

export function calculateRegistrationCharges(rule: RegistrationRule, ctx: CalculationContext): CalculationResult {
    // Determine tenure and multipliers
    let rate = 0.08; // Default 8%

    if (ctx.regType === 'BH_SERIES') {
        rate = 0.08;
    } else if (ctx.regType === 'COMPANY') {
        rate = 0.20;
    } else {
        rate = 0.10;
    }

    // Base Road Tax
    // Fix: Handle undefined invoiceBase
    const baseValue = ctx.invoiceBase || ctx.exShowroom;
    const baseRoadTax = Math.round(baseValue * rate);

    const breakdown = [
        { label: 'Road Tax', amount: baseRoadTax, meta: `${(rate * 100)}% of Invoice` },
        { label: 'Registration Fees', amount: 300, meta: 'Fixed' },
        { label: 'HSRP Charges', amount: 800, meta: 'Plate + Sticker' },
        { label: 'Smart Card Fee', amount: 200, meta: 'Issue Charge' },
        { label: 'Postal Charges', amount: 50, meta: 'Speed Post' },
    ];

    const totalAmount = breakdown.reduce((sum, i) => sum + i.amount, 0);

    return {
        totalAmount,
        breakdown,
        // Fix: Added missing required fields, Removed invalid tenureYears
        ruleId: rule.id,
        ruleVersion: rule.version || 1
    };
}
