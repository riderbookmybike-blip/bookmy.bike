
import { PriceSnapshot } from '@/types/pricing';

export const generateMockSnapshot = (product: any, stateCode?: string, rtoCode?: string): PriceSnapshot => {
    return {
        id: 'mock-snap-123',
        productId: product?.id || 'mock-variant match',
        stateCode: stateCode || 'DL',
        rtoCode: rtoCode || 'DL-01',
        exShowroom: 85000,
        rtoCharges: 10000,
        insuranceBase: 5000,
        insuranceAddons: [],
        accessoryBundle: [],
        totalOnRoad: 100000,
        ruleVersion: 'v1',
        calculatedAt: new Date().toISOString()
    };
};
