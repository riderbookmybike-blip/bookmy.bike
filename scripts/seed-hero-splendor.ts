import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const MODEL_ID = '7728cf01-2d27-464b-a0fd-faa13fca53c9';
const BRAND_ID = 'c14237f7-6c98-4b50-9c02-15b6c0d8b3b5';

async function seed() {
    console.log('--- Starting Hero Splendor+ Seeding ---');

    // 1. Fetch existing Colour IDs to be precise
    const { data: dbColors } = await supabase
        .from('cat_colours')
        .select('id, name, hex_primary, hex_secondary, finish')
        .eq('model_id', MODEL_ID);

    const colorPool = new Map(dbColors?.map(c => [c.name, c]));

    // 2. Define the Studio Matrix (From Screenshot)
    const matrix = [
        {
            variantName: 'DRUM BRAKE',
            price: 75219,
            colors: ['BLUE BLACK', 'BLACK HEAVY GREY', 'FORCE SILVER', 'BLACK RED PURPLE', 'SPORTS RED BLACK'],
        },
        {
            variantName: 'I3S',
            price: 76298,
            colors: ['BLACK RED PURPLE', 'SPORTS RED BLACK', 'BLUE BLACK', 'BLACK HEAVY GREY', 'FORCE SILVER'],
        },
        {
            variantName: 'SPECIAL EDITIONS',
            price: 76298,
            colors: ['BLACK AND ACCENT', 'MATT GREY'],
        },
        {
            variantName: '125 MILLION EDITION',
            price: 77681,
            colors: ['INDUSTRIAL DARK GREY'],
        },
    ];

    for (const item of matrix) {
        // a. Get Variant
        const { data: vari, error: vErr } = await supabase
            .from('cat_variants_vehicle')
            .select('id')
            .eq('model_id', MODEL_ID)
            .eq('name', item.variantName)
            .single();

        if (vErr || !vari) {
            console.error(`Variant ${item.variantName} not found:`, vErr?.message);
            continue;
        }

        console.log(`Mapping ${item.colors.length} SKUs for Variant: ${item.variantName} @ ₹${item.price}`);

        for (const colorName of item.colors) {
            const colorData = colorPool.get(colorName);
            if (!colorData) {
                console.error(`Color ${colorName} not found in DB pool.`);
                continue;
            }

            const skuName = `${item.variantName} - ${colorName}`;
            const skuSlug = skuName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            // b. Upsert SKU
            const { data: sku, error: sErr } = await supabase
                .from('cat_skus')
                .upsert(
                    {
                        brand_id: BRAND_ID,
                        model_id: MODEL_ID,
                        vehicle_variant_id: vari.id,
                        colour_id: colorData.id,
                        name: skuName,
                        slug: skuSlug,
                        sku_type: 'VEHICLE',
                        status: 'ACTIVE',
                        price_base: item.price,
                        color_name: colorData.name,
                        hex_primary: colorData.hex_primary,
                        hex_secondary: colorData.hex_secondary,
                        finish: colorData.finish,
                    },
                    { onConflict: 'vehicle_variant_id, colour_id' }
                )
                .select()
                .single();

            if (sErr) {
                console.error(`Error Upserting SKU ${skuName}:`, sErr.message);
                continue;
            }

            // c. Upsert Pricing MH (Mumbai)
            const { error: pErr } = await supabase.from('cat_price_state_mh').upsert(
                {
                    id: uuidv4(),
                    sku_id: sku.id,
                    state_code: 'MH',
                    ex_factory: item.price,
                    ex_factory_gst_amount: 0,
                    ex_showroom: item.price,
                    on_road_price: Math.round(item.price * 1.25),
                    publish_stage: 'PUBLISHED',
                },
                { onConflict: 'sku_id, state_code' }
            );

            if (pErr) console.error(`Error Upserting Price for ${skuName}:`, pErr.message);
        }
    }

    console.log('--- Price Seeding Completed ---');
}

seed();
