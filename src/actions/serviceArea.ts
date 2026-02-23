'use server';

import { createClient } from '@/lib/supabase/server';
import { formatLocationName, mergeAreas, normalizeLocationKey } from '@/lib/location/locationNormalizer';

// Hardcoded Serviceable Districts for now
const SERVICEABLE_DISTRICTS = ['MUMBAI', 'MUMBAI SUBURBAN', 'THANE', 'PALGHAR', 'RAIGAD', 'PUNE', 'NASHIK'];

export async function checkServiceability(pincode: string) {
    if (!pincode || pincode.length !== 6) {
        return { isServiceable: false, error: 'Invalid pincode' };
    }

    const supabase = await createClient();

    try {
        // Query the correct table 'loc_pincodes'
        let { data, error } = await supabase
            .from('loc_pincodes')
            .select('status, taluka, area, district, state, rto_code')
            .eq('pincode', pincode)
            .maybeSingle();

        // 1. If not found or missing critical data, try Google Maps
        if (error || !data || !data.taluka || !data.district) {
            // console.log(`[GEO] Local resolution failed for ${pincode}, trying Google Maps...`);
            const googleData = await fetchFromGoogleMaps(pincode);
            if (googleData) {
                // Upsert to local DB for future use
                await upsertLocation({
                    pincode,
                    taluka: googleData.taluka,
                    district: googleData.district,
                    state: googleData.state,
                    area: googleData.area,
                    latitude: googleData.latitude,
                    longitude: googleData.longitude,
                });

                // Use the newly fetched data
                data = {
                    status: data?.status || 'Deliverable',
                    taluka: googleData.taluka || data?.taluka,
                    district: googleData.district || data?.district,
                    state: googleData.state || data?.state,
                    area: googleData.area || data?.area,
                    rto_code: data?.rto_code || null,
                };
            }
        }

        if (!data) {
            return {
                isServiceable: false,
                location: null,
                error: 'Pincode not found even with external resolution',
            };
        }

        // 2. Check strict Status (Deliverable/Not Deliverable)
        let isServiceable = data.status === 'Deliverable';

        // 3. Override: if District is in whitelist, force TRUE
        const districtUpper = data.district?.toUpperCase();
        if (districtUpper && SERVICEABLE_DISTRICTS.includes(districtUpper)) {
            isServiceable = true;
        }

        // 4. Fallback: if Taluka is Mumbai (covers edge cases)
        if (data.taluka?.toUpperCase().includes('MUMBAI')) {
            isServiceable = true;
        }

        const stateCode = data.rto_code ? data.rto_code.substring(0, 2).toUpperCase() : '';

        return {
            isServiceable,
            location: data.area || data.taluka || data.district || 'Unknown',
            status: isServiceable ? 'Deliverable' : 'Not Deliverable',
            district: data.district,
            taluka: data.taluka,
            area: data.area,
            state: data.state,
            stateCode,
        };
    } catch (err) {
        console.error('Serviceability Check Failed:', err);
        return { isServiceable: false, error: 'Check failed' };
    }
}

async function fetchFromGoogleMaps(pincode: string) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
        console.warn('[GEO] No Google Maps API key found in environment');
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&components=country:IN&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const components = result.address_components;

            const findType = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name;

            return {
                taluka: findType('administrative_area_level_3') || findType('locality') || findType('postal_town'),
                district: findType('administrative_area_level_2'),
                state: findType('administrative_area_level_1'),
                area: findType('sublocality_level_1') || findType('neighborhood') || findType('sublocality'),
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
            };
        }
        // console.log(`[GEO] Google Maps status: ${data.status}`);
    } catch (e) {
        console.error('[GEO] Google Maps Geocoding failed:', e);
    }
    return null;
}

export async function bulkUpdateServiceability(pincodes: string[], isServiceable: boolean) {
    const supabase = await createClient();
    const status = isServiceable ? 'Deliverable' : 'Not Deliverable';

    try {
        const { error } = await supabase.from('loc_pincodes').update({ status }).in('pincode', pincodes);

        if (error) throw error;
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err.message };
    }
}

export async function upsertLocation(data: {
    pincode: string;
    area?: string;
    taluka?: string;
    district?: string;
    state?: string;
    stateCode?: string;
    latitude?: number;
    longitude?: number;
}) {
    if (!data.pincode || data.pincode.length !== 6) {
        return { success: false, error: 'Invalid pincode' };
    }

    const supabase = await createClient();

    try {
        const formattedState = formatLocationName(data.state);
        const formattedDistrict = formatLocationName(data.district);
        const formattedTaluka = formatLocationName(data.taluka);
        const formattedArea = formatLocationName(data.area);

        const { data: existing } = await supabase
            .from('loc_pincodes')
            .select('areas, area')
            .eq('pincode', data.pincode)
            .maybeSingle();

        const existingData = existing as any;
        const existingAreas = Array.isArray(existingData?.areas) ? (existingData?.areas as string[]) : [];
        const mergedAreas = mergeAreas(existingAreas, formattedArea || existingData?.area || undefined);

        const { error } = await supabase.from('loc_pincodes').upsert(
            {
                pincode: data.pincode,
                area: formattedArea || existingData?.area || null,
                areas: mergedAreas.areas.length > 0 ? mergedAreas.areas : null,
                area_keys: mergedAreas.areaKeys.length > 0 ? mergedAreas.areaKeys : null,
                taluka: formattedTaluka || null,
                district: formattedDistrict || null,
                state: formattedState || null,
                state_key: formattedState ? normalizeLocationKey(formattedState) : null,
                district_key: formattedDistrict ? normalizeLocationKey(formattedDistrict) : null,
                taluka_key: formattedTaluka ? normalizeLocationKey(formattedTaluka) : null,
                state_code: data.stateCode,
                latitude: data.latitude,
                longitude: data.longitude,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'pincode',
            }
        );

        if (error) throw error;
        return { success: true };
    } catch (err: unknown) {
        console.error('Location Upsert Failed:', err);
        return { success: false, error: err.message };
    }
}
