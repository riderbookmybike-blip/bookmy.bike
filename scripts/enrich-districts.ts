import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_GOOGLE_MAPS_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const GOOGLE_MAPS_KEY = NEXT_PUBLIC_GOOGLE_MAPS_KEY;

type GeocodeResult = {
    district?: string;
    city?: string;
    state?: string;
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to extract district/city from Google components
function extractLocationDetails(components: any[]): GeocodeResult {
    let district: string | undefined;
    let city: string | undefined;
    let state: string | undefined;

    for (const comp of components) {
        // District is usually level 3 in India (e.g. Palghar, Mumbai City)
        // Level 2 is typically the Division (e.g. Konkan Division)
        if (comp.types.includes('administrative_area_level_3')) {
            district = comp.long_name;
        }
        // Fallback or override if level 3 wasn't found (though loop order matters, so distinct checks needed)
        // Actually, if we found level 3, we keep it. If we haven't found level 3 yet, we might store level 2 temporarily?
        // Better: Store both and pick best at end, or just check types specifically.
    }

    // Scan again cleanly
    for (const comp of components) {
        if (comp.types.includes('administrative_area_level_3')) {
            district = comp.long_name;
        }
        // Fallback: If no Level 3, checking Level 2?
        // User disliked "Konkan Division", so we ignore Division-level names if possible.

        if (comp.types.includes('locality')) {
            city = comp.long_name;
        }
        if (comp.types.includes('administrative_area_level_1')) {
            state = comp.long_name;
        }
    }

    // Critical Fallback for User's "Many NULLs" issue:
    // If District is still missing (failed to find Level 3), but we have a City,
    // and the Level 2 was likely a "Division" (which we ignore),
    // then assume the City is also the District (e.g., Thane, Pune, Mumbai).
    if (!district && city) {
        district = city;
    }

    return { district, city, state };
}

async function enrichDistricts() {
    console.log('--- District Data Enrichment Started ---');

    if (!GOOGLE_MAPS_KEY) {
        console.error('ERROR: Google Maps API Key is required.');
        return;
    }

    // 1. Fetch records with coordinates but missing/unknown district
    // We assume 'Unknown' based on previous checks, but let's check for NULL too
    // Supabase query builder for OR on text columns is tricky without raw filter
    // So we fetch all valid coords and filter in JS if needed, or use specific filter.
    // Let's rely on finding records where district IS NULL.
    // If the previous migration put 'Unknown', we need to check that.

    // First, let's check count of NULL districts
    const { count, error: countError } = await supabase
        .from('loc_pincodes')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null) // Must have coords to reverse lookup
        .is('district', null);

    let targetRecordsCount = count || 0;

    // If 0, check for 'Unknown' (case insensitive) just in case
    if (targetRecordsCount === 0) {
        console.log("No NULL districts found. Checking for 'Unknown'...");
        const { data: unknownData } = await supabase
            .from('loc_pincodes')
            .select('pincode, latitude, longitude')
            .eq('district', 'Unknown')
            .not('latitude', 'is', null);

        if (unknownData && unknownData.length > 0) {
            console.log(`Found ${unknownData.length} records with 'Unknown' district.`);
            targetRecordsCount = unknownData.length;
        } else {
            console.log("No 'Unknown' districts found either.");
        }
    }

    // Now fetch the actual data
    // We'll process in batches manually

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    // Pagination loop
    const PAGE_SIZE = 50;

    while (true) {
        // We'll break when no more data
        // Build query: (district is null OR district = 'Unknown') AND lat is not null
        // To simplify, let's just grab records that look incomplete.
        // Or even better: check 'district' column specifically.

        // Since Supabase .or() syntax can be complex for mixed types, let's just do NULL first, then 'Unknown'

        let { data: batch, error: fetchError } = await supabase
            .from('loc_pincodes')
            .select('pincode, latitude, longitude, district, city')
            .is('district', null)
            .not('latitude', 'is', null)
            .limit(PAGE_SIZE);

        // If we ran out of NULLs, try 'Unknown'
        if (!batch || batch.length === 0) {
            const { data: unknownBatch, error: unknownError } = await supabase
                .from('loc_pincodes')
                .select('pincode, latitude, longitude, district, city')
                .eq('district', 'Unknown')
                .not('latitude', 'is', null)
                .limit(PAGE_SIZE);

            if (unknownError) {
                console.error('Error fetching Unknown batch:', unknownError.message);
                break;
            }
            batch = unknownBatch;
        }

        if (!batch || batch.length === 0) {
            console.log('No more records to enrich.');
            break;
        }

        console.log(`Processing batch of ${batch.length}...`);

        for (const record of batch) {
            const { pincode, latitude, longitude } = record;

            // Skip if somehow coords are missing (schema should prevent this due to query)
            if (!latitude || !longitude) continue;

            try {
                // Reverse Geocode with language=en
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_KEY}&language=en`;
                const res = await fetch(url);
                const data: any = await res.json();

                if (data.status === 'OK' && data.results?.[0]) {
                    const details = extractLocationDetails(data.results[0].address_components);

                    // We primarily want District.
                    // But if City is also missing/unknown, fill that too.
                    const updates: any = {};

                    if (details.district) {
                        updates.district = details.district;
                    }
                    if (details.city && (!record.city || record.city === 'Unknown')) {
                        updates.city = details.city;
                    }

                    if (Object.keys(updates).length > 0) {
                        // Add updated timestamp
                        updates.updated_at = new Date().toISOString();

                        const { error: updateError } = await supabase
                            .from('loc_pincodes')
                            .update(updates)
                            .eq('pincode', pincode);

                        if (updateError) {
                            console.error(`Failed update db for ${pincode}:`, updateError.message);
                            failCount++;
                        } else {
                            console.log(
                                `✅ ${pincode}: District=${updates.district || record.district}, City=${updates.city || record.city}`
                            );
                            successCount++;
                        }
                    } else {
                        console.warn(`⚠️ ${pincode}: No district found in geocode result.`);
                        failCount++;
                        // Optional: mark as 'Not Found' so we don't retry forever?
                    }
                } else {
                    console.error(`❌ API Error for ${pincode}: ${data.status}`);
                    failCount++;
                }
            } catch (e) {
                console.error(`❌ Exception for ${pincode}:`, e);
                failCount++;
            }

            // Throttle
            await sleep(150);
        }

        processedCount += batch.length;

        // Safety break to prevent infinite loops if updates fail
        if (processedCount > 2000) {
            console.log('Processed 2000 records. Pausing for safety.');
            break;
        }
    }

    console.log('\n--- District Enrichment Summary ---');
    console.log(`Total Updated: ${successCount}`);
    console.log(`Failures/NoData: ${failCount}`);
}

enrichDistricts();
