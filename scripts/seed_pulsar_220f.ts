import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const MIGRATION = {
    brand_id: '1e1cedce-c4ce-4209-8dcb-c9de3d5b244d', // Bajaj
    model: {
        name: 'Pulsar 220F',
        slug: 'pulsar-220f',
        body_style: 'SPORTS',
        category: 'MOTORCYCLE',
        product_type: 'VEHICLE',
        specs: {
            engine_cc: 220,
            fuel_capacity: 15,
            mileage: 40,
        },
    },
    variant: {
        name: 'Standard',
        slug: 'standard',
        specs: {
            power: '20.4 PS @ 8500 rpm',
            torque: '18.55 Nm @ 7000 rpm',
            brakes_front: 'DISC',
            brakes_rear: 'DISC',
            tyre_front: '90/90-17',
            tyre_rear: '120/80-17',
        },
    },
    colors: [
        { name: 'Black Cherry Red', slug: 'black-cherry-red', hex: '#630606' },
        { name: 'Black Ink Blue', slug: 'black-ink-blue', hex: '#002B4A' },
        { name: 'Black Copper Beige', slug: 'black-copper-beige', hex: '#6D5B41' },
        { name: 'Green Light Copper', slug: 'green-light-copper', hex: '#2A3C2A' },
    ],
};

async function seed() {
    console.log('Seeding Pulsar 220F...');

    // 1. Check or create Model
    let { data: model } = await supabase.from('cat_models').select('*').eq('slug', MIGRATION.model.slug).single();
    if (!model) {
        const { data: newModel, error } = await supabase
            .from('cat_models')
            .insert({
                brand_id: MIGRATION.brand_id,
                name: MIGRATION.model.name,
                slug: MIGRATION.model.slug,
                short_description: MIGRATION.model.name,
                description: `The legendary ${MIGRATION.model.name}.`,
                body_style: MIGRATION.model.body_style,
                category: MIGRATION.model.category,
                product_type: MIGRATION.model.product_type,
                is_active: false,
                specifications: MIGRATION.model.specs,
            })
            .select()
            .single();
        if (error) throw error;
        model = newModel;
        console.log('Created Model:', model.id);
    } else {
        console.log('Model exists:', model.id);
    }

    // 2. Check or create Variant
    const variantSlug = `${model.slug}-${MIGRATION.variant.slug}`;
    let { data: variant } = await supabase.from('cat_variants_vehicle').select('*').eq('slug', variantSlug).single();
    if (!variant) {
        const { data: newVar, error } = await supabase
            .from('cat_variants_vehicle')
            .insert({
                model_id: model.id,
                name: MIGRATION.variant.name,
                slug: variantSlug,
                technical_specifications: MIGRATION.variant.specs,
            })
            .select()
            .single();
        if (error) throw error;
        variant = newVar;
        console.log('Created Variant:', variant.id);
    } else {
        console.log('Variant exists:', variant.id);
    }

    // 3. Process Colors and SKUs
    for (const c of MIGRATION.colors) {
        const colorSlug = `${variant.slug}-${c.slug}`;

        // Check/create Color
        let { data: color } = await supabase.from('cat_colours').select('*').eq('slug', colorSlug).single();
        if (!color) {
            const { data: newColor, error } = await supabase
                .from('cat_colours')
                .insert({
                    variant_id: variant.id,
                    name: c.name,
                    slug: colorSlug,
                    hex_code: c.hex,
                    finish: 'GLOSS',
                })
                .select()
                .single();
            if (error) throw error;
            color = newColor;
            console.log('Created Color:', color.id);
        } else {
            console.log('Color exists:', color.id);
        }

        // Check/create SKU
        let { data: sku } = await supabase.from('cat_skus').select('*').eq('slug', color.slug).single();
        if (!sku) {
            const { data: newSku, error } = await supabase
                .from('cat_skus')
                .insert({
                    model_id: model.id,
                    variant_id: variant.id,
                    color_id: color.id,
                    name: `${MIGRATION.model.name} ${MIGRATION.variant.name} ${color.name}`,
                    slug: color.slug,
                    is_active: false,
                })
                .select()
                .single();
            if (error) throw error;
            sku = newSku;
            console.log('Created SKU:', sku.id);
        } else {
            console.log('SKU exists:', sku.id);
        }
    }

    console.log('Pulsar 220F Seeding Complete!');
}
seed().catch(console.error);
