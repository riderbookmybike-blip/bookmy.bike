// Google Maps Integration Strategy

// Cache key for minimizing API costs
const LOCATION_CACHE_KEY = 'bkmb_user_pincode';

interface GeocodeResult {
    pincode: string | null;
    city: string | null;
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
            console.log('Location retrieved from cache (Zero Cost)');
            return { pincode: cached, city: null, source: 'CACHE' };
        }
    }

    // 2. Mock Fallback (if no key provided)
    if (!googleMapsKey) {
        console.warn('No Google Maps Key provided. Using Mock Location.');
        return { pincode: '400001', city: 'Mumbai', source: 'MOCK' };
    }

    // 3. Call Google Maps API
    try {
        console.log('Fetching location from Google Maps API...');
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`
        );
        const data = await res.json();

        if (data.status === 'OK' && data.results?.[0]) {
            // Extract Pincode
            const addressComponents = data.results[0].address_components;
            const postalCode = addressComponents.find((c: any) => c.types.includes('postal_code'))?.long_name;

            if (postalCode) {
                // cache it forever (until manual clear)
                localStorage.setItem(LOCATION_CACHE_KEY, postalCode);
                return { pincode: postalCode, city: null, source: 'API' };
            }
        }

    } catch (error) {
        console.error('Geocoding API failed', error);
    }

    return { pincode: null, city: null, source: 'ERROR' };
}
