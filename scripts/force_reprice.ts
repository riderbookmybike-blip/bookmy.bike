import { sot_price_seed } from '@/actions/sot_price_seed';
import { adminClient } from '@/lib/supabase/admin';

async function main() {
    const { data: rows } = await adminClient
        .from('cat_price_state_mh')
        .select('sku_id, state_code, ex_showroom')
        .eq('publish_stage', 'PUBLISHED');

    if (!rows) return;
    console.log(`Repricing ${rows.length} SKUs...`);

    const res = await sot_price_seed(rows);
    console.log(res);
}

main().catch(console.error);
