// Google Maps Integration Strategy

// Cache key for minimizing API costs
const LOCATION_CACHE_KEY = 'bkmb_user_pincode';

interface GeocodeResult {
    pincode: string | null;
    taluka: string | null;
    state?: string | null;
    country?: string | null;
    address?: string | null; // Full Formatted Address
    latitude?: number | null;
    longitude?: number | null;
    source: 'CACHE' | 'API' | 'MOCK' | 'ERROR';
}

/**
 * Smart Geocoding Strategy:
 * 1. Check LocalStorage Cache (Free)
 * 2. If missing, check for Google Maps Key
 * 3. If Key exists, call API (Cost) -> Cache Result
 * 4. If Key missing, use Mock/Fallback (Free)
 */
export async function getSmartPincode(
    lat: number,
    lng: number,
    googleMapsKey?: string
): Promise<GeocodeResult> {
    // 1. Check Cache
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(LOCATION_CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached) as GeocodeResult;
                // Only return if we have valid data (prevent stuck nulls from previous errors)
                if (data.taluka && data.pincode) {

                    return data;
                }
            } catch (e) {
                console.warn('Invalid cache format', e);
                localStorage.removeItem(LOCATION_CACHE_KEY);
            }
        }
    }

    // 2. Mock Fallback (if no key provided)
    if (!googleMapsKey) {
        console.warn('No Google Maps Key provided. Using Mock Location.');
        return { pincode: '400001', taluka: 'Mumbai', source: 'MOCK' };
    }

    // 3. Call Google Maps API
    try {

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`
        );
        const data = await res.json();

        if (data.status === 'OK' && data.results?.[0]) {
            // Extract Pincode
            const result = data.results[0];
            const addressComponents = result.address_components;
            const postalCode = addressComponents.find((c: any) => c.types.includes('postal_code'))?.long_name;
            const formattedAddress = result.formatted_address; // Google's best formatted address

            // Extract City/State (Robust fallback)
            let taluka = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
            if (!taluka) taluka = addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name; // District

            const state = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
            const country = addressComponents.find((c: any) => c.types.includes('country'))?.long_name;

            if (postalCode) {
                const locationData: GeocodeResult = {
                    pincode: postalCode,
                    taluka: taluka || null,
                    state: state || null,
                    country: country || null,
                    address: formattedAddress || null,
                    latitude: lat,
                    longitude: lng,
                    source: 'API'
                };

                // cache it forever (until manual clear)
                localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
                return locationData;
            }
        }

    } catch (error) {
        console.error('Geocoding API failed', error);
    }

    return { pincode: null, taluka: null, source: 'ERROR' };
}
