import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '../src/utils/slugs';

// ─── Environment Setup ─────────────────────────────────────────

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ─── Configuration ────────────────────────────────────────────

const BRAND_ID = 'aff9a671-6e98-4d7e-8af1-b7823238a00e'; // TVS
const TENANT_ID = 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5'; // AUMS
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const RAIDER_DATA = {
    model: {
        name: 'Raider 125',
        slug: 'tvs-raider-125',
        engine_cc: 124.8,
        fuel_type: 'PETROL' as const,
        status: 'ACTIVE',
    },
    variants: [
        {
            name: 'Drum',
            slug: 'drum',
            price: 82050,
            specs: {
                front_brake: 'Drum 130mm',
                rear_brake: 'Drum 130mm',
                braking_system: 'SBT',
                console_type: 'Digital',
            },
            colors: ['Wicked Black', 'Striking Red'],
        },
        {
            name: 'Single Seat',
            slug: 'single-seat',
            price: 88050,
            specs: {
                front_brake: 'Disc 240mm',
                rear_brake: 'Drum 130mm',
                braking_system: 'SBT',
                console_type: 'Digital',
            },
            colors: ['Wicked Black', 'Striking Red'],
        },
        {
            name: 'Split Seat',
            slug: 'split-seat',
            price: 91550,
            specs: {
                front_brake: 'Disc 240mm',
                rear_brake: 'Drum 130mm',
                braking_system: 'SBT',
                console_type: 'Digital',
                max_torque: '11.75 Nm @ 6000 rpm',
            },
            colors: ['Wicked Black', 'Striking Red', 'Blazing Blue', 'Fiery Yellow'],
        },
        {
            name: 'iGO',
            slug: 'igo',
            price: 91550,
            specs: {
                front_brake: 'Disc 240mm',
                rear_brake: 'Drum 130mm',
                braking_system: 'SBT',
                console_type: 'Digital',
                max_torque: '11.75 Nm @ 6000 rpm',
            },
            colors: ['Nardo Grey', 'New Wicked Black'],
        },
        {
            name: 'SSE',
            slug: 'sse',
            price: 92650,
            specs: {
                front_brake: 'Disc 240mm',
                rear_brake: 'Drum 130mm',
                braking_system: 'SBT',
                console_type: 'Digital',
            },
            colors: ['Deadpool', 'Wolverine', 'Iron Man', 'Black Panther'],
        },
        {
            name: 'SXC DD',
            slug: 'sxc-dd',
            price: 95725,
            specs: {
                front_brake: 'Disc 240mm',
                rear_brake: 'Disc 240mm',
                braking_system: 'Single Channel ABS',
                console_type: 'Digital',
                navigation: true,
                bluetooth: true,
            },
            colors: ['Fiery Yellow', 'Forza Blue', 'Wicked Black', 'Red & Metallic Silver'],
        },
        {
            name: 'TFT DD',
            slug: 'tft-dd',
            price: 97650,
            specs: {
                front_brake: 'Disc 240mm',
                rear_brake: 'Disc 240mm',
                braking_system: 'Single Channel ABS',
                console_type: 'TFT',
                navigation: true,
                bluetooth: true,
            },
            colors: ['Fiery Yellow', 'Forza Blue', 'Wicked Black', 'Red & Metallic Silver'],
        },
    ],
    common_specs: {
        engine_type: 'Air and Oil Cooled Single Cylinder, SI',
        displacement: '124.8',
        max_power: '11.38 PS @ 7500 rpm',
        max_torque: '11.2 Nm @ 6000 rpm',
        transmission: 'Manual',
        start_type: 'Self Start',
        kerb_weight: 123,
        seat_height: 780,
        ground_clearance: 180,
        fuel_capacity: '10',
        tyre_type: 'Tubeless',
        front_suspension: 'Telescopic',
        rear_suspension: 'Monoshock, 5-step adjustable Gas charged',
        led_headlamp: true,
        led_tail_lamp: true,
        emission_norm: 'BS6 Phase 2',
    },
};

const COLORS = [
    { name: 'Wicked Black', hex: '#0A0A0A', slug: 'wicked-black' },
    { name: 'New Wicked Black', hex: '#0F0F0F', slug: 'new-wicked-black' },
    { name: 'Striking Red', hex: '#D11D1D', slug: 'striking-red' },
    { name: 'Blazing Blue', hex: '#1D4ED8', slug: 'blazing-blue' },
    { name: 'Fiery Yellow', hex: '#FACC15', slug: 'fiery-yellow' },
    { name: 'Forza Blue', hex: '#2563EB', slug: 'forza-blue' },
    { name: 'Nardo Grey', hex: '#7C7C7C', slug: 'nardo-grey' },
    { name: 'Red & Metallic Silver', hex: '#8E9191', slug: 'red-metallic-silver' },
    { name: 'Deadpool', hex: '#800000', slug: 'deadpool' },
    { name: 'Wolverine', hex: '#B5A642', slug: 'wolverine' },
    { name: 'Iron Man', hex: '#FFD700', slug: 'iron-man' },
    { name: 'Black Panther', hex: '#2F2F2F', slug: 'black-panther' },
];

async function main() {
    console.log('🚀 Starting TVS Raider 125 Onboarding...');

    // 1. Create Model
    const { data: model, error: modelError } = await supabase
        .from('cat_models')
        .upsert(
            {
                brand_id: BRAND_ID,
                name: RAIDER_DATA.model.name,
                slug: RAIDER_DATA.model.slug,
                engine_cc: RAIDER_DATA.model.engine_cc,
                fuel_type: RAIDER_DATA.model.fuel_type,
                status: RAIDER_DATA.model.status,
                product_type: 'VEHICLE',
                body_type: 'MOTORCYCLE',
            },
            { onConflict: 'brand_id,product_type,slug' }
        )
        .select()
        .single();

    if (modelError) {
        console.error('❌ Error creating model:', modelError);
        return;
    }
    console.log(`✅ Model OK: ${model.name} (${model.id})`);

    // 2. Create Colors (Model-Specific as per index cat_colours_model_id_name_key)
    const colorMap = new Map();
    for (const c of COLORS) {
        const { data: color, error: colorError } = await supabase
            .from('cat_colours')
            .upsert(
                {
                    model_id: model.id,
                    name: c.name,
                    hex_primary: c.hex,
                    // Slug is not in the unique index but let's keep it for URLs
                    // hex_secondary, finish etc could be added here
                },
                { onConflict: 'model_id,name' }
            )
            .select()
            .single();

        if (colorError) {
            console.error(`❌ Error creating color ${c.name}:`, colorError);
            continue;
        }
        colorMap.set(c.name, color.id);
    }
    console.log(`✅ Colors OK: ${colorMap.size} colors created.`);

    // 3. Create Variants and SKUs
    for (const v of RAIDER_DATA.variants) {
        // Variant
        const variantSlug = v.slug; // Should be model-scoped
        const { data: variant, error: variantError } = await supabase
            .from('cat_variants_vehicle')
            .upsert(
                {
                    model_id: model.id,
                    name: v.name,
                    slug: variantSlug,
                    status: 'ACTIVE',
                    ...RAIDER_DATA.common_specs,
                    ...v.specs,
                },
                { onConflict: 'model_id,slug' }
            )
            .select()
            .single();

        if (variantError) {
            console.error(`❌ Error creating variant ${v.name}:`, variantError);
            continue;
        }
        console.log(`✅ Variant OK: ${v.name} (${variant.id})`);

        // SKUs and Pricing
        for (const colorName of v.colors) {
            const colorId = colorMap.get(colorName);
            if (!colorId) {
                console.warn(`⚠️ Color ID not found for: ${colorName}`);
                continue;
            }

            const colorSlug = colorName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const skuSlug = colorSlug;
            const skuCode = `TVS-RDR125-${v.slug.toUpperCase()}-${colorSlug.toUpperCase()}`;

            const { data: sku, error: skuError } = await supabase
                .from('cat_skus')
                .upsert(
                    {
                        model_id: model.id,
                        vehicle_variant_id: variant.id,
                        colour_id: colorId,
                        brand_id: BRAND_ID,
                        name: colorName,
                        slug: skuSlug,
                        sku_code: skuCode,
                        sku_type: 'VEHICLE',
                        status: 'ACTIVE',
                        color_name: colorName,
                        hex_primary: COLORS.find(c => c.name === colorName)?.hex || '#000000',
                    },
                    { onConflict: 'sku_code' }
                )
                .select()
                .single();

            if (skuError) {
                console.error(`❌ Error creating SKU ${colorName} for variant ${v.name}:`, skuError);
                continue;
            }
            console.log(`   📦 SKU OK: ${sku.name} (${sku.id})`);

            // Pricing - Mumbai (MH)
            const gstRate = 18;
            const exFactory = Number((v.price / (1 + gstRate / 100)).toFixed(2));
            const exFactoryGst = Number((v.price - exFactory).toFixed(2));

            const { error: priceError } = await supabase.from('cat_price_state_mh').upsert(
                {
                    id: uuidv4(),
                    sku_id: sku.id,
                    state_code: 'MH',
                    ex_showroom: v.price,
                    ex_factory: exFactory,
                    ex_factory_gst_amount: exFactoryGst,
                    publish_stage: 'PUBLISHED',
                    gst_rate: gstRate,
                    rto_default_type: 'STATE',
                    // Crude estimate for RTO/Insurance for initial population
                    on_road_price: Math.round(v.price * 1.15),
                },
                { onConflict: 'sku_id,state_code' }
            );

            if (priceError) {
                console.error(`   ❌ Error creating price for ${sku.name}:`, priceError);
            } else {
                console.log(`   💰 Price OK: ₹${v.price} (Ex-Showroom Mumbai)`);
            }
        }
    }

    console.log('\n🏁 TVS Raider 125 Ingestion Complete!');
}

main();
