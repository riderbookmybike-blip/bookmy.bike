'use server';

import { createClient } from '@/lib/supabase/server';

// Hardcoded Serviceable Districts for now
const SERVICEABLE_DISTRICTS = ['MUMBAI', 'MUMBAI SUBURBAN', 'THANE', 'PALGHAR', 'RAIGAD', 'PUNE', 'NASHIK'];

export async function checkServiceability(pincode: string) {
    if (!pincode || pincode.length !== 6) {
        return { isServiceable: false, error: 'Invalid pincode' };
    }

    const supabase = await createClient();

    try {
        // Query the correct table 'loc_pincodes'
        const { data, error } = await supabase
            .from('loc_pincodes')
            .select('status, taluka, area, district, state, rto_code')
            .eq('pincode', pincode)
            .single();

        if (error || !data) {
            return {
                isServiceable: false,
                location: null,
                error: 'Pincode not found',
            };
        }

        // 1. Check strict Status (Deliverable/Not Deliverable)
        let isServiceable = data.status === 'Deliverable';

        // 2. Override: if District is in whitelist, force TRUE
        const districtUpper = data.district?.toUpperCase();
        if (districtUpper && SERVICEABLE_DISTRICTS.includes(districtUpper)) {
            isServiceable = true;
        }

        // 3. Fallback: if Taluka is Mumbai (covers edge cases)
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

export async function bulkUpdateServiceability(pincodes: string[], isServiceable: boolean) {
    const supabase = await createClient();
    const status = isServiceable ? 'Deliverable' : 'Not Deliverable';

    try {
        const { error } = await supabase.from('loc_pincodes').update({ status }).in('pincode', pincodes);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
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
        const { error } = await supabase.from('loc_pincodes').upsert(
            {
                pincode: data.pincode,
                area: data.area,
                taluka: data.taluka,
                district: data.district,
                state: data.state,
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
    } catch (err: any) {
        console.error('Location Upsert Failed:', err);
        return { success: false, error: err.message };
    }
}
