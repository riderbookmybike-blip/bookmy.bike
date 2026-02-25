/**
 * One-time seed script to populate insurance addon prices
 * for ALL Honda Activa 125 SKUs in cat_price_state_mh.
 *
 * Pricing: Base amount rounded to nearest ₹500 + 18% GST
 *
 * Usage: npx tsx scripts/seed-activa-addons.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

// ── Standard market rates for 125cc scooter (Base rounded to ₹500 + 18% GST) ──
const GST_RATE = 0.18;

const addons = [
    { key: 'zero_depreciation', base: 1000 },
    { key: 'personal_accident_cover', base: 500 },
    { key: 'return_to_invoice', base: 500 },
    { key: 'engine_protector', base: 1000 },
    { key: 'consumables_cover', base: 500 },
    { key: 'roadside_assistance', base: 1000 },
    { key: 'key_protect', base: 500 },
    { key: 'tyre_protect', base: 500 },
    { key: 'pillion_cover', base: 500 },
];

async function main() {
    // 1. Find all Honda models (activa variants)
    const { data: models, error: mErr } = await admin
        .from('cat_models')
        .select('id, name, slug, brand:cat_brands!brand_id(name, slug)')
        .ilike('brand.slug', 'honda');

    if (mErr) {
        console.error('Model fetch error:', mErr.message);
        process.exit(1);
    }

    const hondaModels = (models || []).filter((m: any) => m.brand?.slug === 'honda');
    console.log(
        `Found ${hondaModels.length} Honda models:`,
        hondaModels.map((m: any) => m.name)
    );

    // 2. Get all SKU IDs for these models
    const modelIds = hondaModels.map((m: any) => m.id);
    if (modelIds.length === 0) {
        console.log('No Honda models found. Exiting.');
        return;
    }

    const { data: skus, error: sErr } = await admin
        .from('cat_skus')
        .select('id, name, model_id')
        .in('model_id', modelIds)
        .eq('status', 'ACTIVE');

    if (sErr) {
        console.error('SKU fetch error:', sErr.message);
        process.exit(1);
    }
    const skuIds = (skus || []).map((s: any) => s.id);
    console.log(`Found ${skuIds.length} active SKUs`);

    if (skuIds.length === 0) {
        console.log('No SKUs found. Exiting.');
        return;
    }

    // 3. Get existing price rows
    const { data: priceRows, error: pErr } = await admin
        .from('cat_price_state_mh')
        .select('id, sku_id')
        .in('sku_id', skuIds);

    if (pErr) {
        console.error('Price fetch error:', pErr.message);
        process.exit(1);
    }
    console.log(`Found ${(priceRows || []).length} price rows to update`);

    // 4. Build the update payload
    const addonColumns: Record<string, any> = {};

    for (const addon of addons) {
        const gst = Math.round(addon.base * GST_RATE);
        const total = addon.base + gst;

        addonColumns[`addon_${addon.key}_amount`] = addon.base;
        addonColumns[`addon_${addon.key}_gst_amount`] = gst;
        addonColumns[`addon_${addon.key}_total_amount`] = total;
        addonColumns[`addon_${addon.key}_default`] = false;
    }

    console.log('\nAddon pricing to be set:');
    console.log('─'.repeat(60));
    for (const addon of addons) {
        const gst = Math.round(addon.base * GST_RATE);
        const total = addon.base + gst;
        console.log(`  ${addon.key.padEnd(28)} Base: ₹${addon.base}  GST: ₹${gst}  Total: ₹${total}`);
    }
    console.log('─'.repeat(60));

    // 5. Update each price row
    let updated = 0;
    let skipped = 0;

    for (const row of priceRows || []) {
        const { error: uErr } = await admin.from('cat_price_state_mh').update(addonColumns).eq('id', row.id);

        if (uErr) {
            console.error(`  ✗ Failed to update row ${row.id}: ${uErr.message}`);
            skipped++;
        } else {
            updated++;
        }
    }

    console.log(`\n✅ Updated ${updated} price rows, ${skipped} skipped/failed`);

    // 6. Recalculate ins_gross_premium to include addon defaults (PA Cover is typically default)
    // Note: We're NOT changing ins_gross_premium since it's base TP+OD only
    // Addons are computed client-side on top of base insurance
    console.log('\n📝 Note: ins_gross_premium NOT changed (base TP+OD only).');
    console.log('   Addons are computed client-side from addon_* columns.');
    console.log('\nDone! Refresh the PDP to see all addons.');
}

main().catch(console.error);
