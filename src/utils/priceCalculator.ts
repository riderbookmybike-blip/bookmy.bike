import { LocationContext } from './locationResolver';

export type PriceBreakdown = {
    exShowroom: number;
    rto: number;
    insurance: number;
    otherCharges: number;
    onRoad: number;
    region?: string;
};

// Mock Tax Rates per State/Region
const TAX_RATES: Record<string, { rto: number }> = {
    'Maharashtra': { rto: 0.12 }, // 12%
    'Delhi': { rto: 0.08 },       // 8%
    'Karnataka': { rto: 0.18 },   // 18%
    'DEFAULT': { rto: 0.10 }      // 10%
};

export function computeOnRoadPrice(
    basePrice: number,
    location: LocationContext | null
): PriceBreakdown {
    const state = location?.state || 'DEFAULT';
    const rates = TAX_RATES[state] || TAX_RATES['DEFAULT'];

    const rto = Math.round(basePrice * rates.rto);
    const insurance = Math.round(basePrice * 0.06); // Approx 6% insurance
    const otherCharges = 1500; // Handling/reg charges

    return {
        exShowroom: basePrice,
        rto,
        insurance,
        otherCharges,
        onRoad: basePrice + rto + insurance + otherCharges,
        region: location?.taluka || 'Pan India'
    };
}
