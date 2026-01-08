import { RegistrationRule } from "@/types/registration";

export const MOCK_REGISTRATION_RULES: RegistrationRule[] = [
    {
        id: 'R-7F3QX7M2A',
        displayId: '7F3QX7M2A',
        ruleName: 'MH (Individual)',
        stateCode: 'MH',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2023-01-01',
        status: 'ACTIVE',
        stateTenure: 15,
        bhTenure: 2,
        companyMultiplier: 3,
        components: [], // Empty for brevity in master mock, detailed in local state
        version: 1,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'R-9K3V5B1NX',
        displayId: '9K3V5B1NX',
        ruleName: 'KA (Individual)',
        stateCode: 'KA',
        vehicleType: 'TWO_WHEELER',
        effectiveFrom: '2023-01-01',
        status: 'ACTIVE',
        stateTenure: 15,
        bhTenure: 2,
        companyMultiplier: 3,
        components: [],
        version: 1,
        lastUpdated: new Date().toISOString()
    },
];

export const MOCK_SERVICES_MASTER = [
    { id: 'S-4D9L2K1ZW', displayId: '4D9L2K1ZW', name: 'RTO Handling', type: 'Handling', gst: '18%', price: 'Fixed', value: 1500 },
    { id: 'S-7A2S1X9CV', displayId: '7A2S1X9CV', name: '1 Year AMC', type: 'AMC', gst: '18%', price: 'Fixed', value: 3500 },
    { id: 'S-1B9N4M2QP', displayId: '1B9N4M2QP', name: 'Fastag', type: 'Other', gst: 'Exempt', price: 'Fixed', value: 500 },
];
