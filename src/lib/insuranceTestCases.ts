import { calculateInsurance } from '@/lib/insuranceEngine';
import { InsuranceRule, InsuranceCalculationContext } from '@/types/insurance';

type InsuranceTestResult = {
    name: string;
    pass: boolean;
    expected: number;
    actual: number;
};

const buildRule = (overrides: Partial<InsuranceRule>): InsuranceRule => ({
    id: 'test',
    ruleName: 'Test Rule',
    stateCode: 'NA',
    insurerName: 'Test',
    vehicleType: 'TWO_WHEELER',
    effectiveFrom: '2024-01-01',
    status: 'ACTIVE',
    idvPercentage: 95,
    gstPercentage: 18,
    odComponents: [],
    tpComponents: [],
    addons: [],
    version: 1,
    lastUpdated: new Date().toISOString(),
    ...overrides,
});

export const runInsuranceTests = (): InsuranceTestResult[] => {
    const ctx: InsuranceCalculationContext = {
        exShowroom: 100000,
        engineCc: 110,
        fuelType: 'PETROL',
    };

    const tests: InsuranceTestResult[] = [];

    // Test 1: Fixed TP slab + OD percent
    const rule1 = buildRule({
        idvPercentage: 95,
        odComponents: [{ id: 'od', type: 'PERCENTAGE', label: 'OD', percentage: 2, basis: 'IDV' }],
        tpComponents: [{
            id: 'tp',
            type: 'SLAB',
            label: 'TP',
            slabValueType: 'FIXED',
            ranges: [{ id: 'tp1', min: 0, max: null, amount: 714, percentage: 0 }]
        }],
    });
    const res1 = calculateInsurance(rule1, ctx);
    const expectedNet1 = Math.round(100000 * 0.95 * 0.02) + 714;
    tests.push({
        name: 'Fixed TP + OD % on IDV',
        expected: expectedNet1,
        actual: res1.netPremium,
        pass: res1.netPremium === expectedNet1,
    });

    // Test 2: TP slab percent on Ex-Showroom
    const rule2 = buildRule({
        odComponents: [],
        tpComponents: [{
            id: 'tp',
            type: 'SLAB',
            label: 'TP',
            slabValueType: 'PERCENTAGE',
            basis: 'EX_SHOWROOM',
            ranges: [{ id: 'tp1', min: 0, max: null, percentage: 1.5 }]
        }],
    });
    const res2 = calculateInsurance(rule2, ctx);
    const expectedNet2 = Math.round(100000 * 0.015);
    tests.push({
        name: 'TP % on Ex-Showroom',
        expected: expectedNet2,
        actual: res2.netPremium,
        pass: res2.netPremium === expectedNet2,
    });

    return tests;
};
