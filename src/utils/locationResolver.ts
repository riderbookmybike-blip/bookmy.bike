import { getPincodeDetails } from '@/actions/pincode';
import { slugify } from './slugs';

export type LocationContext = {
    pincode: string;
    area: string;
    city: string;
    district: string;
    state: string;
    pricing_region_slug: string;
};

// In-memory cache for the session/render
const locationCache = new Map<string, LocationContext | null>();

export async function resolveLocation(pincode: string): Promise<LocationContext | null> {
    if (!pincode || pincode.length !== 6) return null;

    // Check cache
    if (locationCache.has(pincode)) {
        return locationCache.get(pincode) || null;
    }

    try {
        const result = await getPincodeDetails(pincode);

        if (result.success && result.data) {
            const data = result.data;
            const locationResult: LocationContext = {
                pincode,
                area: data.area || '',
                city: data.city || '',
                district: data.district || '',
                state: data.state || '',
                pricing_region_slug: slugify(data.city || 'mumbai')
            };
            locationCache.set(pincode, locationResult);
            return locationResult;
        }
    } catch (error) {
        console.error('Error resolving location:', error);
    }

    locationCache.set(pincode, null);
    return null;
}
