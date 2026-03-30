import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const { data: items, error } = await supabase
        .from('cat_items')
        .select('id, name, item_type')
        .in('item_type', ['ACCESSORY', 'SERVICE'])
        .eq('status', 'ACTIVE');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${items?.length} items.`);
    items?.forEach((item, idx) => console.log(`${idx + 1}. [${item.item_type}] ${item.name} (${item.id})`));
}

main();
