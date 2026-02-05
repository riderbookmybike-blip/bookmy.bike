'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client for Writes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function getPincodeDetails(pincode: string) {
    if (!pincode || pincode.length !== 6) {
        return { success: false, error: 'Invalid Pincode' };
    }

    try {
        // 1. Check Database Cache (Using authoritative 'loc_pincodes' table)
        const { data: cached, error } = await supabase
            .from('loc_pincodes')
            .select('*')
            .eq('pincode', pincode)
            .maybeSingle();

        if (cached && !error) {
            return { success: true, data: cached };
        }

        // 2. Fetch from External API (Fallback to Grow Database)
        console.log(`Pincode ${pincode} not in DB. Fetching from External API...`);
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const apiData = await res.json();

        if (apiData && apiData[0].Status === 'Success') {
            const details = apiData[0].PostOffice[0];

            // Extract State Code if possible (e.g., MH from Maharashtra)
            const state = details.State;
            // Simple mapping for common states or just take the district code later
            // We'll leave state_code null or set it if we have a mapper.

            const newRecord = {
                pincode: pincode,
                taluka: details.Block || details.District,
                district: details.District,
                state: details.State,
                country: 'India',
                area: details.Name,
                status: 'Deliverable', // Default to deliverable for new discoveries
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // 3. Upsert to loc_pincodes (Strictly no duplicates via onConflict)
            const { error: upsertError } = await supabase
                .from('loc_pincodes')
                .upsert(newRecord, { onConflict: 'pincode' });

            if (upsertError) {
                console.error('Failed to grow location database:', upsertError.message);
            } else {
                console.log(`Location Database Expanded: ${pincode} (${details.District})`);
            }

            return { success: true, data: newRecord };
        } else {
            return { success: false, error: 'Pincode not found.' };
        }
    } catch (error: any) {
        console.error('Pincode Lookup Error:', error.message);
        return { success: false, error: 'Service Unavailable' };
    }
}

export async function getDistrictDetails(districtName: string, stateCode?: string | null) {
    if (!districtName || districtName.length < 2) {
        return { success: false, error: 'Invalid District' };
    }

    try {
        let query = supabase.from('loc_pincodes').select('*').ilike('district', districtName);

        if (stateCode) {
            query = query.eq('state_code', stateCode);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (data && !error) {
            return { success: true, data };
        }

        return { success: false, error: 'District not found in database' };
    } catch (error: any) {
        console.error('District Lookup Error:', error.message);
        return { success: false, error: 'Service Unavailable' };
    }
}
