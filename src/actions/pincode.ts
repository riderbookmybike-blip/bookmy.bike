'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client for Writes
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getPincodeDetails(pincode: string) {
    if (!pincode || pincode.length !== 6) {
        return { success: false, error: 'Invalid Pincode' };
    }

    try {
        // 1. Check Database Cache
        const { data: cached, error } = await supabase
            .from('pincodes')
            .select('*')
            .eq('pincode', pincode)
            .single();

        if (cached && !error) {

            return { success: true, data: cached };
        }

        // 2. Fetch from External API (Fallback)

        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const apiData = await res.json();

        if (apiData && apiData[0].Status === 'Success') {
            const details = apiData[0].PostOffice[0]; // Take the first PO for City/District

            const newRecord = {
                pincode: pincode,
                city: details.Block || details.District, // Sometimes Block is better for City
                district: details.District,
                state: details.State,
                country: 'India',
                area: details.Name, // Main PO Name
                latitude: null, // API doesn't allow Lat/Long
                longitude: null
            };

            // 3. Save to Cache
            await supabase.from('pincodes').insert(newRecord);

            return { success: true, data: newRecord };
        } else {
            return { success: false, error: 'Pincode not found.' };
        }

    } catch (error: any) {
        console.error('Pincode Lookup Error:', error.message);
        return { success: false, error: 'Service Unavailable' };
    }
}
