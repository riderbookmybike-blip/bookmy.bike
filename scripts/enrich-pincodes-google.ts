import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const {
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_KEY
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required Supabase environment variables in .env.local');
    process.exit(1);
}

const GOOGLE_MAPS_KEY = NEXT_PUBLIC_GOOGLE_MAPS_KEY;

// Initialize Supabase
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichWithGoogle() {
    console.log('--- Google Geo-Enrichment Started ---');

    if (!GOOGLE_MAPS_KEY) {
        console.error('ERROR: Google Maps API Key is required. Please add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local');
        return;
    }

    // 1. Fetch total count of missing records
    const { count: totalMissing, error: countError } = await supabase
        .from('pincodes')
        .select('*', { count: 'exact', head: true })
        .is('latitude', null);

    if (countError) {
        console.error('Error counting missing pincodes:', countError.message);
        return;
    }

    console.log(`Pincodes missing GPS: ${totalMissing}`);

    if (totalMissing === 0) {
        console.log('No pincodes missing GPS data. Enrichment complete!');
        return;
    }

    // 2. Fetch records in batches to process
    const PAGE_SIZE = 50;
    let successCount = 0;
    let failCount = 0;
    let processedCount = 0;

    console.log(`Starting enrichment in batches of ${PAGE_SIZE}...`);

    // TEST MODE: Only run 10 records
    while (processedCount < (totalMissing || 0)) {
        const { data: batch, error: fetchError } = await supabase
            .from('pincodes')
            .select('pincode, state, city, district')
            .is('latitude', null)
            .limit(PAGE_SIZE);

        if (fetchError) {
            console.error('Error fetching batch:', fetchError.message);
            break;
        }

        if (!batch || batch.length === 0) break;

        for (const record of batch) {
            const { pincode, state, city, district } = record;
            // More specific regional query works better
            const query = `${pincode}, ${city || district || ''}, ${state || ''}, India`.replace(/, ,/g, ',');

            console.log(`[${processedCount + 1}/${totalMissing}] Geocoding ${pincode} (${query})...`);

            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`;
                const res = await fetch(url);
                const data: any = await res.json();

                if (data.status === 'OK' && data.results?.[0]) {
                    const result = data.results[0];
                    const { lat, lng } = result.geometry.location;

                    // Update Supabase
                    const { error: updateError } = await supabase
                        .from('pincodes')
                        .update({
                            latitude: lat,
                            longitude: lng,
                            updated_at: new Date().toISOString()
                        })
                        .eq('pincode', pincode);

                    if (updateError) {
                        console.error(`Failed to update ${pincode}:`, updateError.message);
                        failCount++;
                    } else {
                        console.log(`✅ Success ${pincode}: [${lat}, ${lng}]`);
                        successCount++;
                    }
                } else if (data.status === 'ZERO_RESULTS') {
                    console.warn(`⚠️ No results found for ${pincode}`);
                    // We might want to mark it so we don't keep trying forever, 
                    // but for now, we'll just increment failCount
                    failCount++;
                } else if (data.status === 'OVER_QUERY_LIMIT') {
                    console.error('🛑 Google API Limit Reached. Stopping enrichment.');
                    return;
                } else {
                    console.error(`❌ API Error for ${pincode}:`, data.status, data.error_message || '');
                    failCount++;
                }
            } catch (err) {
                console.error(`❌ Error geocoding ${pincode}:`, err);
                failCount++;
            }

            processedCount++;
            // Throttling to be safe
            await sleep(150);
        }
    }

    console.log('\n--- Enrichment Summary ---');
    console.log(`Total Success: ${successCount}`);
    console.log(`Total Failures: ${failCount}`);
    console.log(`Remaining missing: ${totalMissing - successCount}`);
}

enrichWithGoogle();
