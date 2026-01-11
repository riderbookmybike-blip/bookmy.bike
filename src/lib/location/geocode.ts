// Google Maps Integration Strategy

// Cache key for minimizing API costs
const LOCATION_CACHE_KEY = 'bkmb_user_pincode';

interface GeocodeResult {
    pincode: string | null;
    city: string | null;
    state?: string | null;
    country?: string | null;
    address?: string | null; // Full Formatted Address
    latitude?: number | null;
    longitude?: number | null;
    source: 'CACHE' | 'API' | 'MOCK' | 'ERROR';
}

// ... existing code ...

// 3. Call Google Maps API
try {
    console.log('Fetching location from Google Maps API...');
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
        let city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
        if (!city) city = addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name; // District

        const state = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
        const country = addressComponents.find((c: any) => c.types.includes('country'))?.long_name;

        if (postalCode) {
            const locationData: GeocodeResult = {
                pincode: postalCode,
                city: city || null,
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

return { pincode: null, city: null, source: 'ERROR' };
}
