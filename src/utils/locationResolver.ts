import { getPincodeDetails } from '@/actions/pincode';
import { slugify } from './slugs';

export type LocationContext = {
    pincode: string;
    area: string;
    taluka: string;
    district: string;
    state: string;
    pricing_region_slug: string;
    lat?: number;
    lng?: number;
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
                taluka: data.taluka || '',
                district: data.district || '',
                state: data.state || '',
                pricing_region_slug: slugify(data.taluka || 'mumbai'),
                lat: data.latitude,
                lng: data.longitude
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
