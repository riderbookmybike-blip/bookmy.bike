import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching accessories and services...');
    // Fetch all pricing rows to aggregate accessories
    const { data: catPrices, error: priceErr } = await supabase
        .from('cat_price_state_mh')
        .select('id, sku_id, accessories, insurance, services');

    if (priceErr || !catPrices?.length) {
        console.error('Error fetching prices or no prices found', priceErr);
        return;
    }

    let allAccs = new Set<string>();
    let allServices = new Set<string>();

    catPrices.forEach(p => {
        if (p.accessories && Array.isArray(p.accessories)) {
            p.accessories.forEach((a: any) => {
                if (a.name) allAccs.add(`${a.name} (from JSON)`);
            });
        }
        if (p.services && Array.isArray(p.services)) {
            p.services.forEach((s: any) => {
                if (s.name) allServices.add(`${s.name} (from JSON)`);
            });
        }
    });

    console.log(`\n=== UNIQUE ACCESSORIES ===`);
    let idx = 1;
    allAccs.forEach(a => console.log(`${idx++}. ${a}`));

    console.log(`\n=== UNIQUE SERVICES ===`);
    idx = 1;
    allServices.forEach(s => console.log(`${idx++}. ${s}`));
}

main().catch(console.error);
