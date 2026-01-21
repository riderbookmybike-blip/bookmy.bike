/**
 * Calculates the distance between two points on Earth's surface using the Haversine formula.
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Default Hub Location (Mumbai Colaba)
const DEFAULT_HUB = {
    lat: 18.9067,
    lng: 72.8147,
    name: 'Mumbai Colaba'
};

export function getHubLocation() {
    if (typeof window === 'undefined') return DEFAULT_HUB;
    const stored = localStorage.getItem('bkmb_service_hub');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return DEFAULT_HUB;
}

export const HUB_LOCATION = typeof window !== 'undefined' ? getHubLocation() : DEFAULT_HUB;

export const MAX_SERVICEABLE_DISTANCE_KM = 150;
