import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('=== ACCESSORIES ===');
    const { data: accs, error: e1 } = await supabase
        .from('cat_variants_accessory')
        .select('id, name, type, price, discount');
    if (e1) {
        console.error('Accessory fetch error:', e1);
    } else {
        accs.forEach((d: any, i: number) =>
            console.log(`${i + 1}. ${d.name || d.id} (Type: ${d.type || 'N/A'}, Price: ${d.price || 'N/A'})`)
        );
    }

    console.log('\n=== SERVICES ===');
    const { data: srvs, error: e2 } = await supabase.from('cat_variants_service').select('id, name, type, price');
    if (e2) {
        console.error('Service fetch error:', e2);
    } else {
        srvs.forEach((d: any, i: number) =>
            console.log(`${i + 1}. ${d.name || d.id} (Type: ${d.type || 'N/A'}, Price: ${d.price || 'N/A'})`)
        );
    }

    console.log('\n=== CHECKING IF THEY ARE JUST IN cat_models ===');
    const { data: accModels } = await supabase
        .from('cat_models')
        .select('id, name, product_type')
        .in('product_type', ['ACCESSORY', 'SERVICE', 'SKU_ACCESSORY']);
    if (accModels && accModels.length > 0) {
        accModels.forEach((d, i) => console.log(`${i + 1}. [${d.product_type}] ${d.name}`));
    } else {
        console.log('No models found with product_type ACCESSORY/SERVICE');
    }
}
main();
