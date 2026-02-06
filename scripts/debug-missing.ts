import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_GOOGLE_MAPS_KEY } = process.env;
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const GOOGLE_MAPS_KEY = NEXT_PUBLIC_GOOGLE_MAPS_KEY;

async function debugSpecificPincodes() {
    console.log('--- Debugging Specific Pincodes with NULL District ---');

    // Pincodes from recent warnings
    const targets = ['400704', '416203'];

    for (const pincode of targets) {
        // Fetch current lat/lng from DB
        const { data } = await supabase
            .from('loc_pincodes')
            .select('latitude, longitude')
            .eq('pincode', pincode)
            .single();

        if (!data || !data.latitude || !data.longitude) {
            console.log(`No coordinates for ${pincode}`);
            continue;
        }

        console.log(`\nChecking ${pincode} (${data.latitude}, ${data.longitude})...`);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}&key=${GOOGLE_MAPS_KEY}&language=en`;
        const res = await fetch(url);
        const json: any = await res.json();

        if (json.results && json.results[0]) {
            console.log(JSON.stringify(json.results[0].address_components, null, 2));
        } else {
            console.log('No results from Google API');
        }
    }
}

debugSpecificPincodes();
