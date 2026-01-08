import { PriceSnapshot } from "@/types/pricing";
import { ProductVariant } from "@/types/productMaster";

/**
 * Mock Pricing Engine
 * Simulates the separation of concerns:
 * - Product Master (Immutable Specs)
 * - Pricing Engine (Dynamic, Context-Aware)
 */

import { MOCK_REGISTRATION_RULES } from "@/lib/mock/catalogMocks";
import { MOCK_INSURANCE_RULES } from "@/lib/mock/insuranceMocks";

export const generateMockSnapshot = (
    product: ProductVariant,
    stateCode: string = 'DL',
    rtoCode: string = 'DL-01'
): PriceSnapshot => {

    // 1. Base Price (From Product Master - Mock)
    const isPremium = product.make === 'Royal Enfield';
    const exShowroom = isPremium ? 190000 : 85000;

    // 2. RTO Calculation (From Registration Master)
    // Find rule for state, default to first if not found
    const rtoRule = MOCK_REGISTRATION_RULES.find(r => r.stateCode === stateCode)
        || MOCK_REGISTRATION_RULES[0];

    // Parse value (e.g. "12%") or use numericValue if available in improved mock
    let rtoRate = 0.10; // Default
    if ((rtoRule as any).numericValue) {
        rtoRate = (rtoRule as any).numericValue;
    } else if (rtoRule.ruleName?.includes('%')) {
        rtoRate = parseFloat(rtoRule.ruleName) / 100;
    } else if (rtoRule.stateCode === 'MH') {
        rtoRate = 0.12; // Static fallback for demo
    } else if (rtoRule.stateCode === 'KA') {
        rtoRate = 0.18; // Static fallback for demo
    }

    const rtoCharges = Math.ceil(exShowroom * rtoRate) + 500; // + Fees

    // 3. Insurance Calculation (From Insurance Master)
    const insRule = MOCK_INSURANCE_RULES.find(r => r.stateCode === stateCode)
        || MOCK_INSURANCE_RULES[0];

    let insuranceBase = 2000;
    // Simple extraction for demo snapshots
    if ((insRule as any).baseRate) {
        insuranceBase = (insRule as any).baseRate;
    } else if (insRule.tpComponents?.[0]?.ranges?.[0]?.percentage) {
        insuranceBase = insRule.tpComponents[0].ranges[0].percentage;
    }

    // Add OD Component
    const odRate = insRule.odComponents?.[0]?.percentage ? insRule.odComponents[0].percentage / 100 : 0.015;
    insuranceBase += Math.ceil(exShowroom * odRate);

    // 4. Total
    const totalOnRoad = exShowroom + rtoCharges + insuranceBase;

    return {
        id: `SNAP-${crypto.randomUUID().slice(0, 8)}`,
        productId: product.id,
        stateCode,
        rtoCode: rtoRule.id, // usage of Master ID
        exShowroom,
        rtoCharges,
        insuranceBase,
        insuranceAddons: [], // Could be fetched from Services
        accessoryBundle: [],
        totalOnRoad,
        ruleVersion: `RTO:${rtoRule.id}|INS:${insRule.id}`, // Traceability
        calculatedAt: new Date().toISOString()
    };
};

export const getPriceSnapshot = async (productId: string, rtoCode: string): Promise<PriceSnapshot> => {
    // Simulate API Latency
    // In real app, this queries the Snapshot Table
    return new Promise((resolve) => {
        setTimeout(() => {
            // we need the product to generate? In a real lookup we just need ID.
            // For mock generator we need the product details.
            // We'll create a dummy wrapper or import MOCK_PRODUCTS if needed. 
            // For now, let's just return a generic implementation or we need to access the store.
            // To keep this pure, let's assume the caller handles the object, 
            // OR we import MOCK logic here. Let's do the latter for the Mock Engine.

            // Simulating a "Find or Create" logic
            resolve({
                id: `SNAP-RETRIEVED-${Date.now()}`,
                productId,
                stateCode: rtoCode.split('-')[0],
                rtoCode,
                exShowroom: 90000,
                rtoCharges: 9000,
                insuranceBase: 5000,
                insuranceAddons: ['ZeroDep'],
                accessoryBundle: [],
                totalOnRoad: 104000,
                ruleVersion: 'v2025.1.OFFLINE',
                calculatedAt: new Date().toISOString()
            });
        }, 300);
    });
};
