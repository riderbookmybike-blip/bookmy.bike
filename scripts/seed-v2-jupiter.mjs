/**
 * Seed Script: TVS Jupiter → V2 Catalog Tables
 * 
 * Writes to: cat_models, cat_variants_vehicle, cat_skus
 * Source: cat_items legacy data (specs JSONB → normalized columns)
 * 
 * Image policy: SKU-level only, smart crop scale 1
 * Status: ACTIVE or INACTIVE only (no DRAFT — DB constraint)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TVS_BRAND_ID = 'aff9a671-6e98-4d7e-8af1-b7823238a00e';
const DRY_RUN = process.argv.includes('--dry-run');

// ─── 1. Create Model ───
const modelPayload = {
    brand_id: TVS_BRAND_ID,
    name: 'Jupiter',
    slug: 'tvs-jupiter',
    product_type: 'VEHICLE',
    body_type: 'SCOOTER',
    engine_cc: 113.3,
    fuel_type: 'PETROL',
    emission_standard: 'BS6',
    hsn_code: '87112019',
    item_tax_rate: 28,
    position: 0,
    status: 'ACTIVE',
};

console.log('=== STEP 1: Create Model ===');
console.log(JSON.stringify(modelPayload, null, 2));

if (DRY_RUN) { console.log('[DRY RUN] Skipping inserts.'); process.exit(0); }

const { data: model, error: modelErr } = await c.from('cat_models')
    .insert(modelPayload)
    .select()
    .single();

if (modelErr) { console.error('Model insert failed:', modelErr.message); process.exit(1); }
console.log('✅ Model created:', model.id);

// ─── 2. Create Variants ───
const variantDefs = [
    {
        name: 'Drum',
        slug: 'drum',
        position: 0,
        specs: { engine_type: 'Single Cylinder, 4 Stroke', displacement: 113.3, max_power: '5.9 kW @ 6500 rpm', max_torque: '9.2 Nm @ 5000 rpm', num_valves: 2, transmission: 'CVT_AUTOMATIC', mileage: null, start_type: 'ELECTRIC', air_filter: 'Paper Filter', front_brake: 'Drum, 130 mm', rear_brake: 'Drum, 130 mm', braking_system: 'SBT', front_suspension: 'Telescopic Hydraulic', rear_suspension: 'Twin Tube Emulsion Type', kerb_weight: 105, seat_height: null, ground_clearance: 163, wheelbase: 1275, fuel_capacity: 5.1, console_type: 'ANALOG', led_headlamp: true, led_tail_lamp: true, usb_charging: false, bluetooth: false, navigation: false, front_tyre: '90/90 - 12 - 54J', rear_tyre: '90/90 - 12 - 54J', tyre_type: 'Tubeless' },
        colours: [
            { name: 'Starlight Blue Gloss', hex: '#4A90D9', image: '/media/tvs/jupiter/smartxonnect-drum/starlight-blue-gloss/primary.webp' },
            { name: 'Meteor Red Gloss', hex: '#C43A31', image: '/media/tvs/jupiter/drum/red/primary.webp' },
            { name: 'Lunar White Gloss', hex: '#F0F0F0', image: '/media/tvs/jupiter/drum/white/primary.webp' },
        ],
    },
    {
        name: 'Drum Alloy',
        slug: 'drum-alloy',
        position: 1,
        specs: { engine_type: 'Single Cylinder, 4 Stroke', displacement: 113.3, max_power: '5.9 KW @ 6500 rpm', max_torque: '9.2 Nm @ 5000 rpm', num_valves: 2, transmission: 'CVT_AUTOMATIC', mileage: null, start_type: 'ELECTRIC', air_filter: 'Paper Filter', front_brake: 'Drum, 130 mm', rear_brake: 'Drum, 130 mm', braking_system: 'SBT', front_suspension: 'Telescopic Hydraulic', rear_suspension: 'Twin Tube Emulsion Type', kerb_weight: 105, seat_height: null, ground_clearance: 163, wheelbase: 1275, fuel_capacity: 5.1, console_type: 'ANALOG', led_headlamp: true, led_tail_lamp: true, usb_charging: false, bluetooth: false, navigation: false, front_tyre: '90/90 - 12 - 54J', rear_tyre: '90/90 - 12 - 54J', tyre_type: 'Tubeless' },
        colours: [
            { name: 'Twilight Purple Gloss', hex: '#6A4C93', image: '/media/tvs/jupiter/drum-alloy/twilight-purple-new/primary.webp' },
            { name: 'Titanium Grey Matte', hex: '#7A7D82', image: '/media/tvs/jupiter/drum/grey/primary.webp' },
        ],
    },
    {
        name: 'Drum SmartXonnect',
        slug: 'drum-smartxonnect',
        position: 2,
        specs: { engine_type: 'Single Cylinder, 4 Stroke', displacement: 113.3, max_power: '5.9 KW', max_torque: '9.8 Nm', num_valves: 2, transmission: 'CVT_AUTOMATIC', mileage: null, start_type: 'ELECTRIC', air_filter: 'Paper Filter', front_brake: 'Drum, 130 mm', rear_brake: 'Drum, 130 mm', braking_system: 'SBT', front_suspension: 'Telescopic Hydraulic', rear_suspension: 'Twin Tube Emulsion Type', kerb_weight: 105, seat_height: null, ground_clearance: 163, wheelbase: 1275, fuel_capacity: 5.1, console_type: 'DIGITAL', led_headlamp: true, led_tail_lamp: true, usb_charging: true, bluetooth: true, navigation: true, front_tyre: '90/90 - 12 - 54J', rear_tyre: '90/90 - 12 - 54J', tyre_type: 'Tubeless' },
        colours: [
            { name: 'Starlight Blue Gloss', hex: '#4A90D9', image: '/media/tvs/jupiter/smartxonnect-drum/starlight-blue-gloss/primary.webp' },
        ],
    },
    {
        name: 'Disc SmartXonnect',
        slug: 'disc-smartxonnect',
        position: 3,
        specs: { engine_type: 'Single Cylinder, 4 Stroke', displacement: 113.3, max_power: '5.9 kW @ 6500 rpm', max_torque: '9.8 Nm @ 5000 rpm', num_valves: 2, transmission: 'CVT_AUTOMATIC', mileage: null, start_type: 'ELECTRIC', air_filter: 'Paper Filter', front_brake: 'Disc, 220 mm', rear_brake: 'Drum, 130 mm', braking_system: 'CBS', front_suspension: 'Telescopic Hydraulic', rear_suspension: 'Twin Tube Emulsion Type', kerb_weight: 106, seat_height: null, ground_clearance: 163, wheelbase: 1275, fuel_capacity: 5.1, console_type: 'DIGITAL', led_headlamp: true, led_tail_lamp: true, usb_charging: true, bluetooth: true, navigation: true, front_tyre: '90/90 - 12 - 54J', rear_tyre: '90/90 - 12 - 54J', tyre_type: 'Tubeless' },
        colours: [
            { name: 'Galactic Copper Matte', hex: '#B87333', image: '/media/tvs/jupiter/smartxonnect-disc/galactic-copper-matte/primary.webp' },
            { name: 'Dawn Blue Matte', hex: '#4169A4', image: '/media/tvs/jupiter/smartxonnect-disc/dawn-blue-matte/primary.webp' },
        ],
    },
    {
        name: 'Special Edition',
        slug: 'special-edition',
        position: 4,
        specs: { engine_type: 'Single Cylinder, 4 Stroke', displacement: 113.3, max_power: '5.9 KW', max_torque: '9.8 Nm', num_valves: 2, transmission: 'CVT_AUTOMATIC', mileage: null, start_type: 'ELECTRIC', air_filter: 'Paper Filter', front_brake: 'Disc, 220 mm', rear_brake: 'Drum, 130 mm', braking_system: 'SBT', front_suspension: 'Telescopic Hydraulic', rear_suspension: 'Twin Tube Emulsion Type', kerb_weight: 106, seat_height: null, ground_clearance: 163, wheelbase: 1275, fuel_capacity: 5.1, console_type: 'DIGITAL', led_headlamp: true, led_tail_lamp: true, usb_charging: true, bluetooth: true, navigation: true, front_tyre: '90/90 - 12 - 54J', rear_tyre: '90/90 - 12 - 54J', tyre_type: 'Tubeless' },
        colours: [
            { name: 'Stardust Black', hex: '#1A1A1A', image: null },
        ],
    },
];

console.log('\n=== STEP 2: Create Variants ===');
const insertedVariants = [];

for (const vDef of variantDefs) {
    const variantPayload = {
        model_id: model.id,
        name: vDef.name,
        slug: vDef.slug,
        position: vDef.position,
        status: 'ACTIVE',
        ...vDef.specs,
    };

    const { data: variant, error: vErr } = await c.from('cat_variants_vehicle')
        .insert(variantPayload)
        .select()
        .single();

    if (vErr) { console.error(`Variant "${vDef.name}" failed:`, vErr.message); continue; }
    console.log(`  ✅ Variant: ${variant.name} (${variant.id.slice(0, 8)})`);
    insertedVariants.push({ ...variant, colours: vDef.colours });
}

// ─── 3. Create SKUs (Colours) ───
console.log('\n=== STEP 3: Create SKUs (Colours) ===');
let skuPos = 0;

for (const v of insertedVariants) {
    for (let ci = 0; ci < v.colours.length; ci++) {
        const colour = v.colours[ci];
        const skuPayload = {
            sku_type: 'VEHICLE',
            brand_id: TVS_BRAND_ID,
            model_id: model.id,
            vehicle_variant_id: v.id,
            name: colour.name,
            slug: `tvs-jupiter-${v.slug}-${colour.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
            sku_code: `TVS-JUP-${v.slug.toUpperCase().slice(0, 6)}-${colour.name.replace(/\s+/g, '').slice(0, 6).toUpperCase()}`,
            color_name: colour.name,
            hex_primary: colour.hex,
            finish: colour.name.includes('Matte') ? 'MATTE' : colour.name.includes('Gloss') ? 'GLOSS' : 'METALLIC',
            primary_image: colour.image,
            price_base: 0,
            position: skuPos++,
            status: 'ACTIVE',
            is_primary: (ci === 0 && v.position === 0),
            zoom_factor: 1,
            offset_x: 0,
            offset_y: 0,
            is_flipped: false,
            media_shared: false,
            has_360: false,
        };

        const { data: sku, error: sErr } = await c.from('cat_skus')
            .insert(skuPayload)
            .select('id, name, sku_code')
            .single();

        if (sErr) { console.error(`  SKU "${colour.name}" failed:`, sErr.message); continue; }
        console.log(`    ✅ SKU: ${sku.name} (${sku.sku_code}) → ${sku.id.slice(0, 8)}`);
    }
}

console.log('\n🎉 TVS Jupiter seeded successfully into V2 tables!');
console.log('Model ID:', model.id);
