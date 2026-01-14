import { RegistrationRule, CalculationContext, CalculationResult, RegistrationType } from '@/types/registration';
import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult } from '@/types/insurance';
import { calculateRegistrationCharges } from '@/lib/registrationEngine';
import { calculateInsurance as calculateInsurancePremium } from '@/lib/insuranceEngine';

/**
 * Real RTO Calculation Logic using the Registration Engine
 */
export function calculateRTO(exShowroom: number, rule: RegistrationRule, type: 'STATE' | 'BH' | 'COMPANY' = 'STATE', engineCc: number = 110) {
    const regTypeMap: Record<string, RegistrationType> = {
        'STATE': 'STATE_INDIVIDUAL',
        'BH': 'BH_SERIES',
        'COMPANY': 'COMPANY'
    };

    const ctx: CalculationContext = {
        exShowroom,
        invoiceBase: exShowroom,
        engineCc: engineCc,
        fuelType: 'PETROL',
        regType: regTypeMap[type],
        variantConfig: {
            stateTenure: rule.stateTenure || 15,
            bhTenure: rule.bhTenure || 2,
            companyMultiplier: rule.companyMultiplier || 2
        }
    };

    const res = calculateRegistrationCharges(rule, ctx);



    return {
        total: res.totalAmount,
        items: res.breakdown.map(b => ({
            label: b.label,
            amount: b.amount,
            detail: b.meta
        }))
    };
}

/**
 * Real Insurance Calculation Logic using the Insurance Engine
 */
export function calculateInsurance(exShowroom: number, engineCc: number = 110, rule?: InsuranceRule) {
    // If no rule provided, use a basic fallback (simulates HDFC ERGO)
    const effectiveRule: InsuranceRule = rule || {
        id: 'fallback-ins',
        ruleName: 'Default Comprehensive',
        stateCode: 'ALL',
        insurerName: 'Generic Insurer',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: new Date().toISOString(),
        status: 'ACTIVE',
        idvPercentage: 95,
        gstPercentage: 18,
        odComponents: [{ id: 'od', type: 'PERCENTAGE', label: 'Own Damage', percentage: 1.5, basis: 'IDV' }],
        tpComponents: [{
            id: 'tp', type: 'SLAB', label: 'Third Party', basis: 'ENGINE_CC', ranges: [
                { id: 'tp1', min: 0, max: 75, amount: 482, percentage: 0 },
                { id: 'tp2', min: 75, max: 150, amount: 714, percentage: 0 },
                { id: 'tp3', min: 150, max: 350, amount: 1366, percentage: 0 },
                { id: 'tp4', min: 350, max: null, amount: 2804, percentage: 0 }
            ]
        }],
        addons: [
            { id: 'zero-dep', type: 'PERCENTAGE', label: 'Zero Depreciation', percentage: 0.2, basis: 'IDV' },
            { id: 'pa-cover', type: 'FIXED', label: 'PA Cover', amount: 375 }
        ],
        version: 1,
        lastUpdated: new Date().toISOString()
    };

    const ctx: InsuranceCalculationContext = {
        exShowroom,
        engineCc,
        fuelType: 'PETROL'
    };

    const res = calculateInsurancePremium(effectiveRule, ctx);

    return {
        total: res.totalPremium,
        idv: res.idv,
        items: [
            ...res.odBreakdown,
            ...res.tpBreakdown,
            ...res.addonBreakdown,
            { label: 'GST (18%)', amount: res.gstAmount }
        ].map(i => ({
            label: i.label,
            amount: i.amount,
            detail: i.meta
        }))
    };
}

/**
 * Calculate On-Road Components for a SKU
 * Supports Color-based Pricing Overrides
 */
export function calculateOnRoad(
    baseExShowroom: number,
    engineCc: string | number,
    rule: RegistrationRule,
    pricingOverride?: { exShowroom?: number; discount?: number; dealerOffer?: number; onRoadOverride?: number }
) {
    // 1. Apply Ex-Showroom Override if present
    const exShowroom = pricingOverride?.exShowroom || baseExShowroom;

    // Parse CC
    const cc = typeof engineCc === 'string'
        ? parseFloat(engineCc.replace(/[^\d.]/g, ''))
        : engineCc;

    const rtoState = calculateRTO(exShowroom, rule, 'STATE', cc);
    const rtoBharat = calculateRTO(exShowroom, rule, 'BH', cc);
    const rtoCompany = calculateRTO(exShowroom, rule, 'COMPANY', cc);

    const insuranceComp = calculateInsurance(exShowroom, cc);
    // For liability only, we could pass a different rule, but for now just using the same engine
    const insuranceLib = calculateInsurance(exShowroom, cc);

    // Calculate Base On-Road (before final override)
    let calculatedOnRoad = exShowroom + rtoState.total + insuranceComp.total;

    // Apply specific discounts if any (Logic: Subtract from total)
    if (pricingOverride?.discount) calculatedOnRoad -= pricingOverride.discount;
    if (pricingOverride?.dealerOffer) calculatedOnRoad -= pricingOverride.dealerOffer;

    // 2. Apply Final Manual Override if present (Winning rule)
    const finalOnRoad = pricingOverride?.onRoadOverride || calculatedOnRoad;

    return {
        exShowroom, // Return the effective ex-showroom
        rtoState,
        rtoBharat,
        rtoCompany,
        insuranceComp,
        insuranceLib,
        onRoadTotal: finalOnRoad,
        appliedOverride: pricingOverride
    };
}
