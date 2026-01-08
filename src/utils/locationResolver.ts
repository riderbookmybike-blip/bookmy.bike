// Mock Pincode Master Data
const PINCODE_MASTER: Record<string, {
    area: string;
    city: string;
    district: string;
    state: string;
    pricing_region_slug: string; // e.g., 'mumbai', 'navi-mumbai'
}> = {
    '400001': { area: 'Fort', city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', pricing_region_slug: 'mumbai' },
    '400050': { area: 'Bandra', city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', pricing_region_slug: 'mumbai' },
    '110001': { area: 'Connaught Place', city: 'New Delhi', district: 'New Delhi', state: 'Delhi', pricing_region_slug: 'delhi' },
    '560001': { area: 'MG Road', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pricing_region_slug: 'bengaluru' },
};

export type LocationContext = {
    pincode: string;
    area: string;
    city: string;
    district: string;
    state: string;
    pricing_region_slug: string;
};

// In-memory cache
const locationCache = new Map<string, LocationContext | null>();

export async function resolveLocation(pincode: string): Promise<LocationContext | null> {
    if (!pincode) return null;

    // Check cache
    if (locationCache.has(pincode)) {
        return locationCache.get(pincode) || null;
    }

    // Mock DB Lookup
    // In real implementation, this would trigger a DB call
    const data = PINCODE_MASTER[pincode];

    if (data) {
        const result: LocationContext = {
            pincode,
            ...data
        };
        locationCache.set(pincode, result);
        return result;
    }

    // Handle unknown pincode (could return null or a default behavior)
    locationCache.set(pincode, null);
    return null;
}
