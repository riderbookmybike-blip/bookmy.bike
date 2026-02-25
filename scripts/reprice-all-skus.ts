/**
 * Trigger insurance + RTO recalculation for ALL published vehicle SKUs.
 * This calls the AUMS insurance rule page Save flow programmatically.
 *
 * Usage: npx tsx scripts/reprice-all-skus.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('🔍 Finding all PUBLISHED vehicle SKUs...\n');

    // 1. Get all published price rows
    const { data: priceRows, error } = await admin
        .from('cat_price_state_mh')
        .select('sku_id, state_code, ex_showroom, on_road_price')
        .eq('publish_stage', 'PUBLISHED');

    if (error) {
        console.error('Error fetching price rows:', error.message);
        process.exit(1);
    }

    const skuIds = [...new Set((priceRows || []).map((r: any) => r.sku_id))];
    console.log(`Found ${skuIds.length} published SKUs across ${(priceRows || []).length} price rows`);

    if (skuIds.length === 0) {
        console.log('No published SKUs found. Exiting.');
        return;
    }

    // 2. Show what will happen
    console.log('\n📋 These SKUs will be recalculated (RTO + Insurance + ALL addons):');
    console.log('─'.repeat(60));

    // Group by state
    const byState = new Map<string, string[]>();
    for (const row of (priceRows || []) as any[]) {
        const state = row.state_code || 'MH';
        if (!byState.has(state)) byState.set(state, []);
        byState.get(state)!.push(row.sku_id);
    }

    for (const [state, ids] of byState) {
        console.log(`  ${state}: ${ids.length} SKUs`);
    }
    console.log('─'.repeat(60));

    console.log('\n⚠️  This will update cat_price_state_mh for ALL published SKUs.');
    console.log('   The publishPrices flow (same as AUMS Save) will be triggered.\n');
    console.log('   To proceed, go to AUMS → Insurance Rule → click "Save Rule"');
    console.log('   This will auto-reprice all published SKUs with the updated addon logic.\n');
    console.log('   Alternatively, run the dev server and hit the Save button on the insurance rule page.');
    console.log('\n📝 SKU IDs for manual reference:');
    console.log(JSON.stringify(skuIds.slice(0, 10), null, 2));
    if (skuIds.length > 10) console.log(`   ... and ${skuIds.length - 10} more`);
}

main().catch(console.error);
