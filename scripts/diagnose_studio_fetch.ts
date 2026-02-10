import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, serviceKey!);

const FAMILY_ID = '44b1597b-c7c4-45aa-9af1-7404c8f132b2';

async function diagnose() {
    console.log('--- Diagnosing Fetch Logic for Product:', FAMILY_ID);

    // 1. Try RPC
    console.log('\nTesting get_item_descendants_tree RPC...');
    const { data: items, error: rpcError } = await supabase.rpc('get_item_descendants_tree', { root_id: FAMILY_ID });

    if (rpcError) {
        console.error('RPC Error:', rpcError.message);
    } else {
        console.log(`RPC returned ${items?.length || 0} items.`);
        if (items) {
            items.forEach((i: any) => console.log(` - [${i.type}] ${i.name} (ID: ${i.id})`));
        }
    }

    // 2. Try Fallback Logic
    console.log('\nTesting Fallback Select Logic...');
    const { data: lvl1, error: l1Error } = await supabase.from('cat_items').select('*').eq('parent_id', FAMILY_ID);
    if (l1Error) console.error('L1 Error:', l1Error.message);

    const lvl1Ids = lvl1?.map(i => i.id) || [];
    console.log(`L1 (Variants) found: ${lvl1?.length || 0} items. IDs:`, lvl1Ids);

    const { data: lvl2, error: l2Error } =
        lvl1Ids.length > 0
            ? await supabase.from('cat_items').select('*').in('parent_id', lvl1Ids)
            : { data: [], error: null };

    if (l2Error) console.error('L2 Error:', l2Error.message);
    console.log(`L2 (Colors) found: ${lvl2?.length || 0} items.`);

    const lvl2Ids = lvl2?.map(i => i.id) || [];
    const { data: lvl3, error: l3Error } =
        lvl2Ids.length > 0
            ? await supabase.from('cat_items').select('*').in('parent_id', lvl2Ids)
            : { data: [], error: null };

    if (l3Error) console.error('L3 Error:', l3Error.message);
    console.log(`L3 (SKUs) found: ${lvl3?.length || 0} items.`);

    const finalItems = [...(lvl1 || []), ...(lvl2 || []), ...(lvl3 || [])];
    const variants = finalItems.filter(i => i.type === 'VARIANT');
    const colors = finalItems.filter(i => i.type === 'UNIT');

    console.log('\nFinal Results:');
    console.log(`- Filtered Variants: ${variants.length}`);
    console.log(`- Filtered Colors: ${colors.length}`);
}

diagnose();
