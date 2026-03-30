import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const { data: catPrices, error: priceErr } = await supabase
        .from('cat_price_state_mh')
        .select('id, sku_id, accessories_json, services_json')
        .limit(10);

    if (priceErr) {
        console.error(priceErr);
        return;
    }

    console.log(JSON.stringify(catPrices, null, 2));
}

main();
