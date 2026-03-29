import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const MEDIA_ROOT = path.join(process.cwd(), 'public/media/bajaj');

const SKUS = [
    {
        id: 'cf26a9f7-90a2-472c-9033-71d6bd5d45d3',
        colour: 'Ebony Black',
        file: 'Ebony Black.webp',
        storagePath: 'catalog/bajaj/avenger-street-220/standard/ebony-black/00.webp',
    },
    {
        id: 'f05fbf9f-4987-4a2c-9b00-95a60e0fe23c',
        colour: 'Spicy Red',
        file: 'Spicy Red.webp',
        storagePath: 'catalog/bajaj/avenger-street-220/standard/spicy-red/00.webp',
    },
];

async function main() {
    console.log('\n🚀 Avenger Street 220 — Media Upload + Pricing\n');

    for (const sku of SKUS) {
        const localPath = path.join(MEDIA_ROOT, sku.file);
        console.log(`▶ ${sku.colour}`);

        if (!fs.existsSync(localPath)) {
            console.log(`  ⚠️  File not found: ${localPath}`);
            continue;
        }

        const buffer = fs.readFileSync(localPath);
        const { error } = await supabase.storage
            .from('vehicles')
            .upload(sku.storagePath, buffer, { contentType: 'image/webp', upsert: true });

        if (error) {
            console.log(`  ❌ Upload failed: ${error.message}`);
            continue;
        }

        const publicUrl = supabase.storage.from('vehicles').getPublicUrl(sku.storagePath).data.publicUrl;
        console.log(`  ✅ Uploaded → ${publicUrl}`);

        const { error: updateErr } = await supabase
            .from('cat_skus')
            .update({ primary_image: publicUrl })
            .eq('id', sku.id);

        if (updateErr) console.log(`  ❌ DB update failed: ${updateErr.message}`);
        else console.log(`  📌 primary_image updated`);
    }

    // Seed MH pricing
    console.log('\n💰 Seeding MH pricing...');
    const { error: priceErr } = await supabase.from('cat_price_state_mh').upsert(
        [
            {
                sku_id: 'cf26a9f7-90a2-472c-9033-71d6bd5d45d3',
                state_code: 'MH',
                ex_factory: 97488.28,
                ex_factory_gst_amount: 27296.72,
                logistics_charges: 0,
                ex_showroom: 124785,
                gst_rate: 28,
                rto_default_type: 'STATE',
                on_road_price: 155000,
                publish_stage: 'DRAFT',
            },
            {
                sku_id: 'f05fbf9f-4987-4a2c-9b00-95a60e0fe23c',
                state_code: 'MH',
                ex_factory: 97488.28,
                ex_factory_gst_amount: 27296.72,
                logistics_charges: 0,
                ex_showroom: 124785,
                gst_rate: 28,
                rto_default_type: 'STATE',
                on_road_price: 155000,
                publish_stage: 'DRAFT',
            },
        ],
        { onConflict: 'sku_id,state_code' }
    );

    if (priceErr) console.log(`  ❌ Pricing failed: ${priceErr.message}`);
    else console.log('  ✅ MH pricing seeded — ₹1,24,785 ex-showroom');

    console.log('\n✅ Done!\n');
}

main().catch(console.error);
