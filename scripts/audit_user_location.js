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

const phone = '9820760596';

async function deepAudit() {
    console.log('\n--- Deep Audit ---');

    // 1. Fuzzy Lead Search
    const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('*')
        .ilike('customer_phone', `%${phone}%`);

    if (leads && leads.length > 0) {
        console.log(`Found ${leads.length} leads matching *${phone}*:`);
        leads.forEach(l => {
            console.log(`\n[LEAD MATCH]`);
            console.log(`  ID: ${l.id}`);
            console.log(`  Phone: ${l.customer_phone}`);
            console.log(`  Pincode: ${l.customer_pincode}`);
            console.log(`  City: ${l.customer_city}`);
            console.log(`  Owner: ${l.owner_tenant_id}`);
        });
    } else {
        console.log(`No leads found matching *${phone}*`);
    }

    // 2. Audit Price Distribution for a sample SKU to see what districts EXIST
    const { data: skus } = await supabase.from('cat_items').select('id, slug').eq('type', 'SKU').limit(1);
    if (skus && skus[0]) {
        const skuId = skus[0].id;
        console.log(`\nChecking Price Distribution for SKU: ${skus[0].slug} (${skuId})`);

        const { data: prices } = await supabase
            .from('cat_prices')
            .select('district, state_code, ex_showroom_price')
            .eq('vehicle_color_id', skuId);

        if (prices) {
            console.log(`Found ${prices.length} price entries. Districts present:`);
            const districts = prices.map(p => p.district || 'NULL');
            console.log(Array.from(new Set(districts)));
        }
    }

    console.log('\n--- End Deep Audit ---');
}

deepAudit();
