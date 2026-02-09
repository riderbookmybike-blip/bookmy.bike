import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Manually load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, serviceKey!);

const AUMS_TENANT_ID = 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5';
const YAMAHA_BRAND_ID = 'e0d5b210-2d89-4a81-b369-bc7d3f11265f';

const FAMILY_SLUG = 'yamaha-fascino125fihybrid';

async function main() {
    console.log('Linking localized assets for Yamaha Fascino 125...');

    // 1. Get Family
    const { data: family, error: familyError } = await supabase
        .from('cat_items')
        .select('id, name')
        .eq('slug', FAMILY_SLUG)
        .eq('type', 'FAMILY')
        .single();

    if (familyError || !family) {
        console.error('Family not found!', familyError);
        return;
    }
    console.log(`Found Family: ${family.name} (${family.id})`);

    // 2. Get Variants
    const { data: variants, error: variantsError } = await supabase
        .from('cat_items')
        .select('id, name, slug')
        .eq('parent_id', family.id)
        .eq('type', 'VARIANT');

    if (variantsError || !variants) {
        console.error('Variants not found!', variantsError);
        return;
    }

    // 3. Update COLOR_DEFS and link SKU assets
    for (const v of variants) {
        console.log(`Processing Variant: ${v.name}`);
        const variantSlug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const { data: colors, error: colorsError } = await supabase
            .from('cat_items')
            .select('id, name, slug, specs')
            .eq('parent_id', v.id)
            .eq('type', 'COLOR_DEF');

        if (colorsError || !colors) {
            console.error(`Colors not found for ${v.name}!`, colorsError);
            continue;
        }

        for (const c of colors) {
            // Local path for static image
            const localStaticPath = `/media/yamaha/fascino-125-fi-hybrid/${variantSlug}/${c.slug}/static.webp`;

            console.log(`Updating COLOR_DEF: ${c.name} with static path ${localStaticPath}`);
            const updatedSpecs = { ...(c.specs as object), image_url: localStaticPath, is_360: true };

            await supabase.from('cat_items').update({ specs: updatedSpecs }).eq('id', c.id);

            // Find SKU under this COLOR_DEF
            const { data: sku } = await supabase
                .from('cat_items')
                .select('id, name')
                .eq('parent_id', c.id)
                .eq('type', 'SKU')
                .single();

            if (sku) {
                console.log(`Linking 360 assets to SKU: ${sku.name}`);

                // Clear existing 360 assets for this SKU
                await supabase.from('cat_assets').delete().eq('item_id', sku.id).eq('type', '360');

                // Link shared 360 frames (40 frames)
                const assetsToInsert = [];
                for (let i = 1; i <= 40; i++) {
                    assetsToInsert.push({
                        item_id: sku.id,
                        type: '360',
                        url: `/media/yamaha/fascino-125-fi-hybrid/shared/360/${i}.webp`,
                        position: i,
                    });
                }

                const { error: assetError } = await supabase.from('cat_assets').insert(assetsToInsert);

                if (assetError) {
                    console.error(`Error linking 360 assets for ${sku.name}:`, assetError);
                }
            }
        }
    }

    console.log('Asset linking complete!');
}

main().catch(console.error);
