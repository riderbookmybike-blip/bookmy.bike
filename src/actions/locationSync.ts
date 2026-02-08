'use server';

import { adminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/auth/resolver';
import { reverseGeocode } from '@/lib/location/reverseGeocode';
import { getPincodeDetails } from '@/actions/pincode';
import { formatLocationName, mergeAreas, normalizeLocationKey } from '@/lib/location/locationNormalizer';

type LocationSyncInput = {
    latitude: number;
    longitude: number;
    pincode?: string | null;
    state?: string | null;
    district?: string | null;
    taluka?: string | null;
    area?: string | null;
};

export async function syncMemberLocation(input: LocationSyncInput) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'UNAUTHENTICATED' };

    const latitude = Number(input.latitude);
    const longitude = Number(input.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return { success: false, error: 'INVALID_COORDS' };
    }

    let pincode = input.pincode?.toString().replace(/\D/g, '').slice(0, 6) || null;
    if (!pincode || pincode.length !== 6) {
        const reverse = await reverseGeocode(latitude, longitude);
        if (!reverse.success || !reverse.pincode) {
            return { success: false, error: 'PINCODE_NOT_FOUND' };
        }
        pincode = reverse.pincode;
    }

    const pinResult = await getPincodeDetails(pincode);
    const pinData = pinResult.success ? pinResult.data : null;

    const resolvedState = formatLocationName(input.state || pinData?.state || null);
    const resolvedDistrict = formatLocationName(input.district || pinData?.district || null);
    const resolvedTaluka = formatLocationName(input.taluka || pinData?.taluka || null);
    const resolvedArea = formatLocationName(input.area || pinData?.area || null);

    const { data: existingPin } = await adminClient
        .from('loc_pincodes')
        .select('areas, area')
        .eq('pincode', pincode)
        .maybeSingle();

    const existingAreas = Array.isArray(existingPin?.areas) ? (existingPin?.areas as string[]) : [];
    const mergedAreas = mergeAreas(existingAreas, resolvedArea || existingPin?.area || undefined);

    await adminClient.from('loc_pincodes').upsert(
        {
            pincode,
            state: resolvedState,
            district: resolvedDistrict,
            taluka: resolvedTaluka,
            area: resolvedArea || existingPin?.area || null,
            areas: mergedAreas.areas.length > 0 ? mergedAreas.areas : null,
            area_keys: mergedAreas.areaKeys.length > 0 ? mergedAreas.areaKeys : null,
            state_key: resolvedState ? normalizeLocationKey(resolvedState) : null,
            district_key: resolvedDistrict ? normalizeLocationKey(resolvedDistrict) : null,
            taluka_key: resolvedTaluka ? normalizeLocationKey(resolvedTaluka) : null,
            latitude,
            longitude,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'pincode' }
    );

    const { data: member } = await adminClient.from('id_members').select('metadata').eq('id', user.id).maybeSingle();

    const updatedMetadata = {
        ...(member?.metadata || {}),
        location: {
            ...(member?.metadata as any)?.location,
            area: resolvedArea || null,
            areas: mergedAreas.areas.length > 0 ? mergedAreas.areas : null,
            pincode,
        },
    };

    await adminClient
        .from('id_members')
        .update({
            pincode,
            state: resolvedState,
            district: resolvedDistrict,
            taluka: resolvedTaluka,
            latitude,
            longitude,
            metadata: updatedMetadata,
        })
        .eq('id', user.id);

    return {
        success: true,
        data: {
            pincode,
            state: resolvedState,
            district: resolvedDistrict,
            taluka: resolvedTaluka,
            area: resolvedArea,
            latitude,
            longitude,
        },
    };
}
