export type DeliveryChargeSlab = {
    minKmInclusive: number;
    maxKmInclusive: number | null;
    charge: number;
};

// Distance slab SOT (requested):
// 0-10km => 500
// 10-30km => 800
// 30-60km => 1000
// 60+km  => 1500
export const DELIVERY_CHARGE_SLABS: DeliveryChargeSlab[] = [
    { minKmInclusive: 0, maxKmInclusive: 10, charge: 500 },
    { minKmInclusive: 10, maxKmInclusive: 30, charge: 800 },
    { minKmInclusive: 30, maxKmInclusive: 60, charge: 1000 },
    { minKmInclusive: 60, maxKmInclusive: null, charge: 1500 },
];

export function getDeliveryChargeByDistance(distanceKm?: number | null): number {
    const distance = Number(distanceKm);
    if (!Number.isFinite(distance) || distance < 0) {
        return 500; // Safe fallback (minimum slab)
    }

    const normalized = Math.max(0, distance);
    for (const slab of DELIVERY_CHARGE_SLABS) {
        if (normalized >= slab.minKmInclusive && (slab.maxKmInclusive === null || normalized <= slab.maxKmInclusive)) {
            return slab.charge;
        }
    }

    return 1500;
}
