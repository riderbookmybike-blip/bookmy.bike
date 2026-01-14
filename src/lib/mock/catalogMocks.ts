import { RegistrationRule } from "@/types/registration";

export const MOCK_REGISTRATION_RULES: RegistrationRule[] = [
    {
        id: 'R-7F3QX7M2A',
        displayId: '7F3QX7M2A',
        ruleName: 'Maharashtra (MH)',
        stateCode: 'MH',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2023-01-01',
        status: 'ACTIVE',
        stateTenure: 15,
        bhTenure: 2,
        companyMultiplier: 3,
        components: [
            {
                id: 'c1',
                type: 'PERCENTAGE',
                label: 'Road Tax (Individual)',
                basis: 'EX_SHOWROOM',
                fuelMatrix: {
                    PETROL: 12,
                    CNG: 12,
                    EV: 0
                },
                variantTreatment: 'PRO_RATA',
                isRoadTax: true
            },
            {
                id: 'c2',
                type: 'FIXED',
                label: 'Registration Fee',
                fuelMatrix: {
                    PETROL: 300,
                    CNG: 300,
                    EV: 0
                }
            },
            {
                id: 'c4',
                type: 'FIXED',
                label: 'Smart Card Fee',
                amount: 200, // Common for all fuels
                variantTreatment: 'NONE'
            },
            {
                id: 'c3',
                type: 'PERCENTAGE',
                label: 'Safety Cess',
                percentage: 1,
                basis: 'TARGET_COMPONENT',
                targetComponentId: 'c1', // 1% of Road Tax
                variantTreatment: 'PRO_RATA'
            }
        ],
        version: 1,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'R-9K3V5B1NX',
        displayId: '9K3V5B1NX',
        ruleName: 'Karnataka (KA)',
        stateCode: 'KA',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2023-01-01',
        status: 'ACTIVE',
        stateTenure: 15,
        bhTenure: 2,
        companyMultiplier: 2,
        components: [
            {
                id: 'ka-1',
                type: 'PERCENTAGE',
                label: 'Road Tax (LTT)',
                percentage: 18.2,
                basis: 'EX_SHOWROOM',
                variantTreatment: 'PRO_RATA',
                isRoadTax: true
            },
            {
                id: 'ka-2',
                type: 'FIXED',
                label: 'Registration Fee',
                amount: 1500
            }
        ],
        version: 1,
        lastUpdated: new Date().toISOString()
    },
];

export const MOCK_SERVICES_MASTER = [
    { id: 'S-4D9L2K1ZW', displayId: '4D9L2K1ZW', name: 'RTO Handling', type: 'Handling', gst: '18%', price: 'Fixed', value: 1500 },
    { id: 'S-7A2S1X9CV', displayId: '7A2S1X9CV', name: '1 Year AMC', type: 'AMC', gst: '18%', price: 'Fixed', value: 3500 },
    { id: 'S-1B9N4M2QP', displayId: '1B9N4M2QP', name: 'Fastag', type: 'Other', gst: 'Exempt', price: 'Fixed', value: 500 },
];
