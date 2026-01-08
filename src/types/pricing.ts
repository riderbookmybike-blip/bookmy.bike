
export interface PriceSnapshot {
    id: string; // SNAP-UUID
    productId: string; // Link to Variant ID
    stateCode: string; // 'DL', 'MH'
    rtoCode: string; // 'DL-01'

    // Pricing Components
    exShowroom: number;
    rtoCharges: number;
    insuranceBase: number;
    insuranceAddons: string[]; // ['ZeroDep', 'RTI']
    accessoryBundle: string[]; // SKU List

    // Aggregates
    totalOnRoad: number;

    // Meta
    ruleVersion: string; // 'v2024.1'
    calculatedAt: string; // ISO
}
