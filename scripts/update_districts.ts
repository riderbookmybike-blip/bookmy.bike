import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const districts = [
    'Ahmednagar',
    'Mumbai City',
    'Mumbai Suburban',
    'Nashik',
    'Palghar',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Thane',
];

async function run() {
    console.log('Fetching all dealerships...');
    const { data: tenants, error } = await supabaseAdmin
        .from('tenants')
        .select('id, name')
        .in('type', ['DEALER', 'DEALERSHIP']);

    if (error) {
        console.error('Error fetching tenants:', error);
        return;
    }

    if (!tenants || tenants.length === 0) {
        console.log('No dealerships found.');

        // try without type just to log what types exist!
        const { data: tnt } = await supabaseAdmin.from('tenants').select('id, type').limit(5);
        console.log('Sample tenants:', tnt);
        return;
    }

    console.log(`Found ${tenants.length} dealerships. Updating service areas...`);

    const inserts: any[] = [];

    for (const tenant of tenants) {
        for (const dist of districts) {
            inserts.push({
                tenant_id: tenant.id,
                district: dist,
                state_code: 'MH',
                is_active: true,
            });
        }
    }

    // Upsert in chunks to avoid large payload errors
    const chunkSize = 1000;
    for (let i = 0; i < inserts.length; i += chunkSize) {
        const chunk = inserts.slice(i, i + chunkSize);
        const { error: insertError } = await supabaseAdmin
            .from('id_dealer_service_areas')
            .upsert(chunk, { onConflict: 'tenant_id, district' });

        if (insertError) {
            console.error(`Error inserting chunk ${i}:`, insertError);
        } else {
            console.log(`Successfully upserted chunk of size ${chunk.length}`);
        }
    }

    console.log('Done!');
}

run().catch(console.error);
