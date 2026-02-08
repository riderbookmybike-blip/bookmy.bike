'use server';

/**
 * Reverse Geocoding Utility
 * Converts GPS coordinates to pincode using OpenStreetMap Nominatim API
 */

interface ReverseGeocodeResult {
    success: boolean;
    pincode: string | null;
    error?: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
    try {
        // Validate coordinates
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return { success: false, pincode: null, error: 'Invalid coordinates' };
        }

        // Use OpenStreetMap Nominatim for reverse geocoding
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'BookMyBike/1.0 (contact@bookmy.bike)',
            },
        });

        if (!res.ok) {
            console.error('Nominatim API error:', res.status, res.statusText);
            return { success: false, pincode: null, error: 'Geocoding service unavailable' };
        }

        const data = await res.json();

        // Extract pincode from response
        const pincode = data.address?.postcode || null;

        if (!pincode) {
            console.warn('No pincode found for coordinates:', lat, lon);
            return { success: false, pincode: null, error: 'No pincode found for this location' };
        }

        // Validate pincode format (Indian pincodes are 6 digits)
        const cleanPincode = pincode.replace(/\s+/g, '').slice(0, 6);

        if (!/^\d{6}$/.test(cleanPincode)) {
            console.warn('Invalid pincode format:', pincode);
            return { success: false, pincode: null, error: 'Invalid pincode format' };
        }

        return { success: true, pincode: cleanPincode };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            success: false,
            pincode: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
