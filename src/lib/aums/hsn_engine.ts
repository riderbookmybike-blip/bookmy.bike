/**
 * HSN Classification & GST Engine (Sept 2025 Update)
 * Source of Truth for Vehicle Tax Categorization
 */

export interface TaxClassification {
    hsnCode: string;
    gstRate: number;
    cessRate: number;
    description: string;
}

/**
 * Resolves HSN and GST based on the 22 Sept 2025 update
 */
export function resolveVehicleTax(fuelType: string, engineCc: number): TaxClassification {
    const fuel = (fuelType || 'PETROL').toUpperCase();
    const cc = Number(engineCc) || 0;

    // 1. Electric Vehicle Classification
    if (fuel === 'ELECTRIC' || fuel === 'EV') {
        return {
            hsnCode: '87116010',
            gstRate: 5,
            cessRate: 0,
            description: 'Electric motorcycles and mopeds',
        };
    }

    // 2. Petrol/ICE Vehicle Classification (Classic categorization)
    if (cc < 50) {
        return {
            hsnCode: '87111010',
            gstRate: 28,
            cessRate: 0,
            description: 'Mopeds and cycles with auxiliary motor < 50cc',
        };
    }

    if (cc >= 50 && cc <= 250) {
        return {
            hsnCode: '87112029',
            gstRate: 28,
            cessRate: 0,
            description: 'Motor cycles > 75cc but <= 250cc',
        };
    }

    if (cc > 250 && cc <= 500) {
        // Post 22 Sept 2025: Higher CC vehicles might have Cess
        // Heuristic: If > 351cc (Royal Enfield 350 is usually 28%, but 350+ enters luxury bracket)
        const cess = cc > 350 ? 12 : 0;
        return {
            hsnCode: '87113020',
            gstRate: 28,
            cessRate: cess,
            description: `Motor cycles > 250cc but <= 500cc ${cess > 0 ? '(Luxury Cess applied)' : ''}`,
        };
    }

    if (cc > 500 && cc <= 800) {
        return {
            hsnCode: '87114010',
            gstRate: 28,
            cessRate: 15,
            description: 'Motor cycles > 500cc but <= 800cc (High Perf)',
        };
    }

    if (cc > 800) {
        return {
            hsnCode: '87115010',
            gstRate: 28,
            cessRate: 22,
            description: 'Superbikes > 800cc',
        };
    }

    // Default Fallback
    return {
        hsnCode: '87112029',
        gstRate: 28,
        cessRate: 0,
        description: 'Auto-resolved General Category',
    };
}

/**
 * Calculates total tax amount for a base price
 */
export function calculateTaxAmount(basePrice: number, gstRate: number, cessRate: number): number {
    const gstAmount = (basePrice * gstRate) / 100;
    const cessAmount = (basePrice * cessRate) / 100;
    return gstAmount + cessAmount;
}
