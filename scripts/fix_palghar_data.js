const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixData() {
    console.log('--- START DATA REMEDIATION ---');

    // 1. COPY PRICES: Mumbai Suburban -> Palghar
    // Get all prices for Mumbai Suburban
    const { data: sourcePrices, error: fetchError } = await supabase
        .from('cat_prices')
        .select('*')
        .eq('district', 'Mumbai Suburban')
        .eq('state_code', 'MH');

    if (fetchError) {
        console.error('Error fetching source prices:', fetchError);
        return;
    }

    console.log(`Found ${sourcePrices.length} source price entries for Mumbai Suburban.`);

    if (sourcePrices.length > 0) {
        // Prepare new entries for Palghar
        const newPrices = sourcePrices.map(p => {
            const { id, created_at, updated_at, ...rest } = p; // Remove system fields
            return {
                ...rest,
                district: 'Palghar',
                // Keep same lat/lng or null, or update if we had coordinates
                latitude: 19.6967, // Approx Palghar Lat
                longitude: 72.7699 // Approx Palghar Lng
            };
        });

        // Check existing Palghar prices to avoid duplicates
        const { data: existingPrices } = await supabase
            .from('cat_prices')
            .select('vehicle_color_id')
            .eq('district', 'Palghar');

        const existingIds = new Set((existingPrices || []).map(p => p.vehicle_color_id));
        const pricesToInsert = newPrices.filter(p => !existingIds.has(p.vehicle_color_id));

        if (pricesToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('cat_prices')
                .insert(pricesToInsert);

            if (insertError) console.error('Error inserting Palghar prices:', insertError);
            else console.log(`Successfully inserted ${pricesToInsert.length} prices for Palghar.`);
        } else {
            console.log('No new prices to insert (all exist).');
        }
    }

    // 2. CHECK FINANCE SCHEMES (Skipping as table name needs verification)
    /*
    console.log('\n--- AUDITING FINANCE SCHEMES ---');
    // ... finance code commented out ...
    */

    const { data: schemes, error: schemeError } = await supabase
        .from('fin_schemes')
        .select('id, name, type, is_active, valid_from, valid_to')
        .eq('is_active', true)
        .or(`tenant_id.eq.${dealerId},tenant_id.is.null`);

    if (schemeError) console.error('Error fetching schemes:', schemeError);
    else {
        console.log(`Found ${schemes.length} active schemes applicable (Global or Dealer-specific):`);
        schemes.forEach(s => console.log(`  - [${s.type}] ${s.name} (${s.id})`));
    }

    console.log('--- END DATA REMEDIATION ---');
}

fixData();
