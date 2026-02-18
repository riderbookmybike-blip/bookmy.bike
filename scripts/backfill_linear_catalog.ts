import { adminClient } from '../src/lib/supabase/admin';
import { randomUUID } from 'crypto';

const DEFAULT_STATE_CODE = process.env.BACKFILL_STATE_CODE || 'MH';

async function backfillV2PricingRows() {
    console.log(`🚀 Starting V2 pricing backfill: cat_skus -> cat_price_state_mh (${DEFAULT_STATE_CODE})`);

    const { data: skus, error: skuError } = await adminClient
        .from('cat_skus')
        .select('id, sku_code, price_base, status')
        .eq('status', 'ACTIVE');

    if (skuError) {
        console.error('Error fetching active SKUs:', skuError);
        return;
    }

    if (!skus || skus.length === 0) {
        console.log('No active SKUs found. Nothing to backfill.');
        return;
    }

    const skuIds = skus.map(s => s.id);
    const { data: existingRows, error: existingError } = await adminClient
        .from('cat_price_state_mh')
        .select('sku_id')
        .eq('state_code', DEFAULT_STATE_CODE)
        .in('sku_id', skuIds);

    if (existingError) {
        console.error('Error fetching existing price rows:', existingError);
        return;
    }

    const existingSkuSet = new Set((existingRows || []).map(r => r.sku_id));
    const missing = skus.filter(s => !existingSkuSet.has(s.id));

    console.log(`📦 Active SKUs: ${skus.length}`);
    console.log(`✅ Existing price rows (${DEFAULT_STATE_CODE}): ${existingSkuSet.size}`);
    console.log(`🛠️ Missing rows to create: ${missing.length}`);

    if (missing.length === 0) {
        console.log('Nothing to backfill. All active SKUs already have MH pricing rows.');
        return;
    }

    const payload = missing.map(s => {
        const exShowroom = Number(s.price_base || 0);
        return {
            id: randomUUID(),
            sku_id: s.id,
            state_code: DEFAULT_STATE_CODE,
            ex_factory: exShowroom,
            ex_factory_gst_amount: 0,
            logistics_charges: 0,
            logistics_charges_gst_amount: 0,
            ex_showroom: exShowroom,
            publish_stage: 'DRAFT',
            is_popular: false,
        };
    });

    const { error: upsertError } = await adminClient.from('cat_price_state_mh').upsert(payload, {
        onConflict: 'sku_id,state_code',
    });

    if (upsertError) {
        console.error('❌ Backfill failed:', upsertError);
        return;
    }

    console.log(`✅ Backfill complete. Created/ensured ${payload.length} rows.`);
}

backfillV2PricingRows().catch(err => {
    console.error('Backfill script failed:', err);
    process.exit(1);
});
