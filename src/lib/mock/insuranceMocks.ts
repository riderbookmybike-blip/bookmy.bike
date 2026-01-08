import { InsuranceRule } from "@/types/insurance";

export const MOCK_INSURANCE_RULES: InsuranceRule[] = [
    {
        id: 'I-8Z7L6K5CD',
        displayId: '8Z7L6K5CD',
        ruleName: 'Maharashtra HDFC Ergo',
        stateCode: 'MH',
        insurerName: 'HDFC Ergo',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2023-01-01',
        status: 'ACTIVE',
        idvPercentage: 95,
        gstPercentage: 18,
        version: 1,
        lastUpdated: new Date().toISOString(),
        odComponents: [{ id: 'od-1', type: 'PERCENTAGE', label: 'OD Premium', percentage: 1.875, basis: 'IDV' }],
        tpComponents: [{ id: 'tp-1', type: 'SLAB', label: 'TP Premium', ranges: [{ id: 'tp-s1', min: 0, max: null, percentage: 714 }] }],
        addons: [
            { id: 'add-1', type: 'PERCENTAGE', label: 'Zero Depreciation', percentage: 0.15, basis: 'IDV' },
            { id: 'add-2', type: 'PERCENTAGE', label: 'RTI', percentage: 0.1, basis: 'IDV' }
        ]
    },
    {
        id: 'I-9X2V3M1AB',
        displayId: '9X2V3M1AB',
        ruleName: 'Karnataka ICICI Lombard',
        stateCode: 'KA',
        insurerName: 'ICICI Lombard',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2023-06-15',
        status: 'ACTIVE',
        idvPercentage: 95,
        gstPercentage: 18,
        version: 1,
        lastUpdated: new Date().toISOString(),
        odComponents: [{ id: 'od-2', type: 'PERCENTAGE', label: 'OD Premium', percentage: 1.9, basis: 'IDV' }],
        tpComponents: [{ id: 'tp-2', type: 'SLAB', label: 'TP Premium', ranges: [{ id: 'tp-s2', min: 0, max: null, percentage: 714 }] }],
        addons: [{ id: 'add-3', type: 'PERCENTAGE', label: 'Zero Depreciation', percentage: 0.18, basis: 'IDV' }]
    },
    {
        id: 'I-7Y1R9P4WE',
        displayId: '7Y1R9P4WE',
        ruleName: 'Delhi Bajaj Allianz',
        stateCode: 'DL',
        insurerName: 'Bajaj Allianz',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2024-01-01',
        status: 'PENDING',
        idvPercentage: 90,
        gstPercentage: 18,
        version: 1,
        lastUpdated: new Date().toISOString(),
        odComponents: [{ id: 'od-3', type: 'PERCENTAGE', label: 'OD Premium', percentage: 2.1, basis: 'IDV' }],
        tpComponents: [{ id: 'tp-3', type: 'SLAB', label: 'TP Premium', ranges: [{ id: 'tp-s3', min: 0, max: null, percentage: 714 }] }],
        addons: [{ id: 'add-4', type: 'PERCENTAGE', label: 'Consumables', percentage: 0.05, basis: 'IDV' }]
    },
    {
        id: 'I-3Q2W5E8RT',
        displayId: '3Q2W5E8RT',
        ruleName: 'Tamil Nadu Tata AIG',
        stateCode: 'TN',
        insurerName: 'Tata AIG',
        vehicleType: 'FOUR_WHEELER',
        effectiveFrom: '2023-10-20',
        status: 'ACTIVE',
        idvPercentage: 95,
        gstPercentage: 18,
        version: 2,
        lastUpdated: new Date().toISOString(),
        odComponents: [{ id: 'od-4', type: 'PERCENTAGE', label: 'OD Premium', percentage: 2.4, basis: 'IDV' }],
        tpComponents: [{ id: 'tp-4', type: 'SLAB', label: 'TP Premium', ranges: [{ id: 'tp-s4', min: 0, max: null, percentage: 3416 }] }],
        addons: [{ id: 'add-5', type: 'PERCENTAGE', label: 'Zero Depreciation', percentage: 0.25, basis: 'IDV' }]
    }
];
