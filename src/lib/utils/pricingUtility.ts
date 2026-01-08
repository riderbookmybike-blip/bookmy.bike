import { RegistrationRule, CalculationContext, CalculationResult, RegistrationType } from '@/types/registration';
import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult } from '@/types/insurance';
import { calculateRegistrationCharges } from '@/lib/registrationEngine';

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

    console.log(`[PricingUtility] Calculation for ${type} (${ctx.regType}): Total = ₹${res.totalAmount}`);

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
 * Simplified Insurance Calculation Logic
 */
export function calculateInsurance(exShowroom: number, engineCc: string | number = 110, isComprehensive: boolean = true) {
    const idv = exShowroom * 0.95;
    let cc = typeof engineCc === 'string' ? parseFloat(engineCc.replace(/[^\d.]/g, '')) : engineCc;
    if (isNaN(cc)) cc = 110;

    let tp = 714;
    if (cc > 75 && cc <= 150) tp = 714;
    if (cc > 150 && cc <= 350) tp = 1366;
    if (cc > 350) tp = 2804;

    const items = [
        { label: 'Third Party (TP)', amount: tp }
    ];

    if (isComprehensive) {
        items.unshift({ label: 'Own Damage (OD)', amount: Math.round(idv * 0.015) });
    }

    const netPremium = items.reduce((sum, i) => sum + i.amount, 0);
    const gst = Math.round(netPremium * 0.18);
    items.push({ label: 'GST (18%)', amount: gst });

    return {
        total: netPremium + gst,
        items
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

    const insuranceComp = calculateInsurance(exShowroom, cc, true);
    const insuranceLib = calculateInsurance(exShowroom, cc, false);

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
