import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupPriceState() {
    console.log('Starting cleanup of deprecated insurance addons in cat_price_state_mh...');

    const columnsToNull = [
        'addon_key_protect_amount',
        'addon_key_protect_gst_amount',
        'addon_key_protect_total_amount',
        'addon_key_protect_default',
        'addon_keyprotect_amount',
        'addon_keyprotect_gst_amount',
        'addon_keyprotect_total_amount',
        'addon_keyprotect_default',
        'addon_tyre_protect_amount',
        'addon_tyre_protect_gst_amount',
        'addon_tyre_protect_total_amount',
        'addon_tyre_protect_default',
        'addon_tyreprotect_amount',
        'addon_tyreprotect_gst_amount',
        'addon_tyreprotect_total_amount',
        'addon_tyreprotect_default',
        'addon_pillion_cover_amount',
        'addon_pillion_cover_gst_amount',
        'addon_pillion_cover_total_amount',
        'addon_pillion_cover_default',
        'addon_pillion_amount',
        'addon_pillion_gst_amount',
        'addon_pillion_total_amount',
        'addon_pillion_default',
    ];

    const updatePayload: Record<string, null> = {};
    columnsToNull.forEach(col => {
        updatePayload[col] = null;
    });

    const { data, error, count } = await supabase
        .from('cat_price_state_mh')
        .update(updatePayload)
        .not('on_road_price', 'is', null) // Generic filter to Target all rows that have data
        .select('sku_id');

    if (error) {
        console.error('Error cleaning up cat_price_state_mh:', error.message);
    } else {
        console.log(
            `Successfully cleared deprecated addon columns in ${data?.length || 0} rows of cat_price_state_mh.`
        );
    }

    console.log('Cleanup complete.');
}

cleanupPriceState().catch(console.error);
