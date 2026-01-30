const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditDealers() {
    console.log('--- Dealer Audit Start ---');

    // 1. Fetch Dealers
    const { data: dealers, error: dealerError } = await supabase
        .from('id_tenants')
        .select('id, name, location, pincode, type')
        .eq('type', 'DEALER');

    if (dealerError) {
        console.error('Error fetching dealers:', dealerError);
        return;
    }

    console.log(`Found ${dealers.length} dealers.`);

    // 2. Fetch Service Areas for each dealer
    for (const dealer of dealers) {
        console.log(`\n\n[DEALER]: ${dealer.name} (${dealer.location})`);
        console.log(`ID: ${dealer.id}`);
        console.log(`Pincode: ${dealer.pincode}`);

        const { data: serviceAreas, error: saError } = await supabase
            .from('id_dealer_service_areas')
            .select('*')
            .eq('tenant_id', dealer.id);

        if (saError) {
            console.error('  Error fetching service areas:', saError);
            continue;
        }

        if (serviceAreas.length === 0) {
            console.log('  -> NO SERVICE AREAS CONFIGURATED');
        } else {
            serviceAreas.forEach(sa => {
                console.log('  -> SA:', JSON.stringify(sa));
            });
        }
    }
    console.log('\n--- Checking Pincode 401203 ---');
    const { data: pinData, error: pinError } = await supabase
        .from('loc_pincodes')
        .select('*')
        .eq('pincode', '401203');

    if (pinError) console.error('Error fetching pincode:', pinError);
    else console.log('Pincode Data:', JSON.stringify(pinData, null, 2));

    console.log('\n--- Checking RPC get_market_best_offers for Palghar ---');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_market_best_offers', {
        p_district_name: 'Palghar',
        p_state_code: 'MH'
    });

    if (rpcError) console.error('RPC Error:', rpcError);
    else console.log('RPC Result (Sample):', JSON.stringify(rpcData ? rpcData.slice(0, 1) : [], null, 2));

    console.log('\n--- Checking cat_prices for Palghar ---');
    const { count: priceCount, error: priceError } = await supabase
        .from('cat_prices')
        .select('*', { count: 'exact', head: true })
        .eq('district', 'Palghar');

    if (priceError) console.error('Price Check Error:', priceError);
    else console.log(`Found ${priceCount} price entries for Palghar.`);

    console.log('\n--- Dealer Audit End ---');
}

auditDealers();
