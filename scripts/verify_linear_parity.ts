import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateParity, logCatalogDrift } from '../src/lib/utils/driftLogger';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyParity() {
    console.log('🚀 Starting V2 SKU ↔ MH Price Parity Verification...');

    const { data: skus, error: skuError } = await supabase
        .from('cat_skus')
        .select('id, sku_code, price_base, status')
        .eq('status', 'ACTIVE');

    if (skuError) throw skuError;

    const skuIds = (skus || []).map(s => s.id);

    const { data: prices, error: priceError } = await supabase
        .from('cat_price_state_mh')
        .select('sku_id, ex_showroom, publish_stage')
        .in('sku_id', skuIds);

    if (priceError) throw priceError;

    console.log(`📊 Data Stats:
   - Active SKUs: ${skus?.length || 0}
   - Price rows (MH): ${prices?.length || 0}`);

    const priceMap = new Map((prices || []).map(p => [p.sku_id, p]));

    // "legacy" side in drift util = expected SKU source (cat_skus)
    const expected = (skus || []).map(s => ({
        id: s.id,
        sku: s.sku_code || s.id,
        displayName: s.sku_code || s.id,
        price: {
            exShowroom: Number(s.price_base || 0),
        },
    }));

    // "linear" side in drift util = derived MH pricing source
    const actual = (skus || []).map(s => {
        const mh = priceMap.get(s.id);
        return {
            id: s.id,
            sku: s.sku_code || s.id,
            displayName: s.sku_code || s.id,
            price: {
                exShowroom: Number(mh?.ex_showroom || 0),
            },
        };
    });

    const report = calculateParity(expected, actual);
    logCatalogDrift(report);

    const missingPriceRows = (skus || []).filter(s => !priceMap.has(s.id));
    if (missingPriceRows.length > 0) {
        console.warn(`⚠️ Missing price rows for ${missingPriceRows.length} active SKUs.`);
    }

    if (report.parityPercentage === 100) {
        console.log('✅ PASS: V2 SKU ↔ MH Price parity verified.');
    } else {
        console.error('❌ FAIL: V2 price drift detected.');
        process.exit(1);
    }
}

verifyParity().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
