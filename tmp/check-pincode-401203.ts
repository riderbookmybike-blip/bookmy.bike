// Script to check and enrich pincode 401203
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function enrichPincode401203() {
    console.log('Checking pincode 401203 in loc_pincodes...');

    const { data: existing } = await supabase.from('loc_pincodes').select('*').eq('pincode', '401203').maybeSingle();

    if (existing) {
        console.log('✅ Pincode exists in database:', existing);
        return existing;
    }

    console.log('❌ Pincode NOT in database. Fetching from API...');

    // Fetch from postal API
    const res = await fetch('https://api.postalpincode.in/pincode/401203');
    const apiData = await res.json();

    if (apiData && apiData[0].Status === 'Success') {
        const details = apiData[0].PostOffice[0];
        console.log('📦 API Response:', details);

        const newRecord = {
            pincode: '401203',
            taluka: details.Block || details.District,
            district: details.District,
            state: details.State,
            country: 'India',
            area: details.Name,
            status: 'Deliverable',
        };

        console.log('💾 Saving to database:', newRecord);

        const { error } = await supabase.from('loc_pincodes').upsert(newRecord, { onConflict: 'pincode' });

        if (error) {
            console.error('❌ Error saving:', error);
        } else {
            console.log('✅ Pincode enriched and saved!');
        }

        return newRecord;
    }
}

// Run it
enrichPincode401203().then(() => console.log('Done!'));
