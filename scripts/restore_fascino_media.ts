import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const FASCINO_PRODUCT_ID = 'bc323e6a-8aee-4009-827c-88616c6e374d';

const MAPPING = [
    { variant: 'Disc', color: 'Silver', path: '/media/yamaha/fascino-125-fi-hybrid/disc/silver' },
    { variant: 'Disc', color: 'Vivid Red', path: '/media/yamaha/fascino-125-fi-hybrid/disc/vivid-red' },
    {
        variant: 'Disc',
        color: 'Cool Blue Metallic',
        path: '/media/yamaha/fascino-125-fi-hybrid/disc/cool-blue-metallic',
    },
    { variant: 'Disc', color: 'Dark Matte Blue', path: '/media/yamaha/fascino-125-fi-hybrid/disc/dark-matte-blue' },
    { variant: 'Disc', color: 'Cyan Blue', path: '/media/yamaha/fascino-125-fi-hybrid/disc/cyan-blue' },
    { variant: 'Disc', color: 'Matte Black Special', path: '/media/yamaha/fascino-125-fi-hybrid/disc/metallic-black' },
    { variant: 'Disc', color: 'Metallic White', path: '/media/yamaha/fascino-125-fi-hybrid/disc/metallic-white' },
    { variant: 'Disc', color: 'Matte Copper', path: '/media/yamaha/fascino-125-fi-hybrid/disc/matte-copper' },

    { variant: 'Drum', color: 'Silver', path: '/media/yamaha/fascino-125-fi-hybrid/drum/silver' },
    { variant: 'Drum', color: 'Vivid Red', path: '/media/yamaha/fascino-125-fi-hybrid/drum/vivid-red' },
    {
        variant: 'Drum',
        color: 'Cool Blue Metallic',
        path: '/media/yamaha/fascino-125-fi-hybrid/drum/cool-blue-metallic',
    },
    { variant: 'Drum', color: 'Dark Matte Blue', path: '/media/yamaha/fascino-125-fi-hybrid/drum/dark-matte-blue' },
    { variant: 'Drum', color: 'Cyan Blue', path: '/media/yamaha/fascino-125-fi-hybrid/drum/cyan-blue' },
    { variant: 'Drum', color: 'Metallic Black', path: '/media/yamaha/fascino-125-fi-hybrid/drum/metallic-black' },
    { variant: 'Drum', color: 'Metallic White', path: '/media/yamaha/fascino-125-fi-hybrid/drum/metallic-white' },
    { variant: 'Drum', color: 'Matte Copper', path: '/media/yamaha/fascino-125-fi-hybrid/drum/matte-copper' },

    {
        variant: 'Disc Tft',
        color: 'Matte Black Special',
        path: '/media/yamaha/fascino-125-fi-hybrid/disc-tft/matte-black-special',
    },
];

async function main() {
    console.log('--- RESTORING FASCINO MEDIA ---');

    for (const entry of MAPPING) {
        console.log(`Processing: ${entry.variant} | ${entry.color}`);

        // 1. Find the Unit
        const { data: variant } = await supabase
            .from('cat_items')
            .select('id')
            .eq('parent_id', FASCINO_PRODUCT_ID)
            .eq('name', entry.variant)
            .eq('type', 'VARIANT')
            .single();

        if (!variant) {
            console.error(`  Variant ${entry.variant} not found`);
            continue;
        }

        const { data: unit } = await supabase
            .from('cat_items')
            .select('*')
            .eq('parent_id', variant.id)
            .eq('name', entry.color)
            .eq('type', 'UNIT')
            .single();

        if (!unit) {
            console.error(`  Unit ${entry.color} under ${entry.variant} not found`);
            continue;
        }

        const imageUrl = `${entry.path}/static.webp`;
        const updatedSpecs = {
            ...(unit.specs || {}),
            primary_image: imageUrl,
            gallery: [imageUrl],
            is_360: true,
        };

        console.log(`  Updating UNIT ${unit.id} with image: ${imageUrl}`);
        await supabase
            .from('cat_items')
            .update({
                image_url: imageUrl,
                specs: updatedSpecs,
            })
            .eq('id', unit.id);

        // 2. Update child SKUs
        const { data: skus } = await supabase.from('cat_items').select('*').eq('parent_id', unit.id).eq('type', 'SKU');

        if (skus) {
            for (const sku of skus) {
                console.log(`    Updating SKU ${sku.id} with image: ${imageUrl}`);
                await supabase
                    .from('cat_items')
                    .update({
                        image_url: imageUrl,
                        specs: {
                            ...(sku.specs || {}),
                            primary_image: imageUrl,
                            gallery: [imageUrl],
                        },
                    })
                    .eq('id', sku.id);
            }
        }
    }

    console.log('\nMedia restoration complete!');
}

main().catch(console.error);
