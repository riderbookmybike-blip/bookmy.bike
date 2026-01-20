
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function analyze() {
    // 1. Get Distinct Statuses
    const { data: statuses } = await adminClient.from('leads').select('status');
    if (statuses) {
        const distinct = [...new Set(statuses.map(s => s.status))];
        console.log('Distinct Statuses found:', distinct);
    }

    // 2. Check for ANY lead with "rich" data (e.g. price_snapshot is not null)
    const { data: richLeads } = await adminClient
        .from('leads')
        .select('*')
        .not('price_snapshot', 'is', null)
        .limit(1);

    if (richLeads && richLeads.length > 0) {
        console.log('--- FOUND RICH LEAD (with price_snapshot) ---');
        console.log('Keys:', Object.keys(richLeads[0]));
        console.log('Sample Data:', JSON.stringify(richLeads[0], null, 2));
    } else {
        console.log('No leads with price_snapshot found.');
    }

    // 3. Check Bookings Table
    try {
        const { data: bookings, error: bookingError } = await adminClient.from('bookings').select('*').limit(1);
        if (bookingError) {
            console.log('Bookings table likely does not exist or error:', bookingError.message);
        } else if (bookings && bookings.length > 0) {
            console.log('--- FOUND BOOKING TABLE DATA ---');
            console.log('Booking Keys:', Object.keys(bookings[0]));
        } else {
            console.log('Bookings table exists but is empty.');
        }
    } catch (e) {
        console.log('Error checking bookings table:', e);
    }

    // 4. Check Raw Import Table (firebase_antigravity)
    console.log('--- CHECKING RAW IMPORT TABLE ---');
    try {
        const { data: collections, error: countError } = await adminClient
            .from('firebase_antigravity')
            .select('root_collection, collection_path')
            .limit(100); // Just get some samples to deduce structure or use .rpc if strictly needed but simpler to just fetch headers if possible.

        // actually a simple group by or distinct is better but lets just fetch distinct roots first via a "fake" distinct by fetching all headers if small, or just trying to guess.
        // Since I can't do complex GROUP BY via simple client easily without RPC, I'll just fetch a few rows.

        const { data: samples } = await adminClient
            .from('firebase_antigravity')
            .select('*')
            .limit(5);

        if (samples && samples.length > 0) {
            console.log('Raw Table Columns:', Object.keys(samples[0]));
            // Check for unique root_collections in these samples
            const roots = [...new Set(samples.map(s => s.root_collection))];
            console.log('Sample Root Collections:', roots);

            // 5. Inspect 'Aapli Collections'
            const { data: aapliSample } = await adminClient
                .from('firebase_antigravity')
                .select('data, collection_path')
                .eq('root_collection', 'Aapli Collections')
                .limit(3);

            if (aapliSample && aapliSample.length > 0) {
                console.log('--- FOUND RAW "Aapli Collections" DATA ---');
                aapliSample.forEach((sample, index) => {
                    console.log(`\nSample ${index + 1} (Path: ${sample.collection_path}):`);
                    const keys = Object.keys(sample.data || {});
                    console.log('Top-level Keys:', keys);

                    // Check for nested booking/lead indicators
                    if (keys.includes('booking_details') || keys.includes('status')) {
                        console.log('Status:', sample.data.status);
                        console.log('Booking Details Keys:', Object.keys(sample.data.booking_details || {}));
                    }

                    // Dump a bit more if it looks interesting
                    if (sample.data.order_details || sample.data.payment_status) {
                        console.log('Order/Payment Found:', JSON.stringify(sample.data, null, 2));
                    }
                });
            }

            // If "bookings" is a root, fetch one
            const { data: bookingSample } = await adminClient
                .from('firebase_antigravity')
                .select('data')
                .eq('root_collection', 'bookings')
                .limit(1);

            if (bookingSample && bookingSample.length > 0) {
                console.log('--- FOUND RAW BOOKING ---');
                // Inspect the JSON data
                const rawData = bookingSample[0].data;
                console.log('Raw Booking Keys:', Object.keys(rawData));
                console.log('Raw Booking Data:', JSON.stringify(rawData, null, 2));
            } else {
                console.log('No raw bookings found in sample check... trying "leads"');
                const { data: leadSample } = await adminClient
                    .from('firebase_antigravity')
                    .select('data')
                    .eq('root_collection', 'leads')
                    .limit(1);

                if (leadSample && leadSample.length > 0) {
                    console.log('--- FOUND RAW LEAD ---');
                    console.log('Raw Lead Keys:', Object.keys(leadSample[0].data));
                }
            }
        } else {
            console.log('firebase_antigravity table is empty or error accessing it.');
        }

    } catch (e) {
        console.log('Error accessing firebase_antigravity:', e);
    }
}

analyze();
