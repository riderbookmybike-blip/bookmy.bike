/**
 * Seed Script: TVS Ronin → V2 Catalog Tables
 * Source: TVS OEM Booking Page + Bikewale
 * Variants: Base, Mid, Top
 * Colours: 7 total (3 Base + 2 Mid + 2 Top)
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TVS_BRAND_ID = 'aff9a671-6e98-4d7e-8af1-b7823238a00e';

// ─── 1. Model ───
const { data: model, error: mErr } = await c.from('cat_models')
    .insert({
        brand_id: TVS_BRAND_ID,
        name: 'Ronin',
        slug: 'tvs-ronin',
        product_type: 'VEHICLE',
        body_type: 'MOTORCYCLE',
        engine_cc: 225.9,
        fuel_type: 'PETROL',
        emission_standard: 'BS6',
        hsn_code: '87112029',
        item_tax_rate: 28,
        position: 3,
        status: 'ACTIVE',
    })
    .select().single();

if (mErr) { console.error('Model failed:', mErr.message); process.exit(1); }
console.log('✅ Model:', model.name, model.id);

// ─── 2. Colours (model-level pool) ───
const colourDefs = [
    { name: 'Lightning Black', hex_primary: '#1C1C1C', finish: 'GLOSS', position: 0 },
    { name: 'Magma Red', hex_primary: '#C62828', finish: 'GLOSS', position: 1 },
    { name: 'Agonda', hex_primary: '#E8E4D8', finish: 'MATTE', position: 2 },
    { name: 'Glacier Silver', hex_primary: '#B0BEC5', finish: 'GLOSS', position: 3 },
    { name: 'Charcoal Ember', hex_primary: '#4E4E4E', finish: 'GLOSS', position: 4 },
    { name: 'Midnight Blue', hex_primary: '#1A237E', finish: 'GLOSS', position: 5 },
    { name: 'Nimbus Grey', hex_primary: '#757575', finish: 'GLOSS', position: 6 },
];

console.log('\n=== Colours ===');
const insertedColours = {};
for (const cDef of colourDefs) {
    const { data: colour, error: cErr } = await c.from('cat_colours')
        .insert({ model_id: model.id, name: cDef.name, hex_primary: cDef.hex_primary, finish: cDef.finish, position: cDef.position })
        .select().single();
    if (cErr) { console.error(`  ❌ ${cDef.name}:`, cErr.message); continue; }
    console.log(`  ✅ ${colour.name} (${colour.id.slice(0, 8)})`);
    insertedColours[cDef.name] = colour;
}

// ─── 3. Variants ───
const sharedSpecs = {
    engine_type: 'Single Cylinder, 4 Stroke, Oil Cooled',
    displacement: 225.9,
    max_power: '20.4 PS @ 7750 rpm',
    max_torque: '19.93 Nm @ 3750 rpm',
    num_valves: 4,
    transmission: 'MANUAL',
    mileage_arai: 42,
    start_type: 'ELECTRIC',
    front_brake: 'Disc',
    rear_brake: 'Disc',
    front_suspension: '41mm USD Fork',
    rear_suspension: 'Monoshock, 7-step adjustable preload',
    seat_height: 795,
    ground_clearance: 181,
    fuel_capacity: 14,
    front_tyre: '110/70-17',
    rear_tyre: '130/70-17',
    tyre_type: 'Tubeless',
    console_type: 'DIGITAL',
    led_headlamp: true,
    led_tail_lamp: true,
    usb_charging: true,
    bluetooth: true,
    navigation: false,
    ride_modes: 'Urban, Rain',
};

const variantDefs = [
    {
        name: 'Base',
        slug: 'base',
        position: 0,
        specs: {
            ...sharedSpecs,
            braking_system: 'ABS',
            kerb_weight: 160,
        },
        colours: [
            { name: 'Lightning Black', price: 126751 },
            { name: 'Magma Red', price: 129051 },
            { name: 'Agonda', price: 131048 },
        ],
    },
    {
        name: 'Mid',
        slug: 'mid',
        position: 1,
        specs: {
            ...sharedSpecs,
            braking_system: 'ABS',
            kerb_weight: 160,
        },
        colours: [
            { name: 'Glacier Silver', price: 148115 },
            { name: 'Charcoal Ember', price: 149415 },
        ],
    },
    {
        name: 'Top',
        slug: 'top',
        position: 2,
        specs: {
            ...sharedSpecs,
            braking_system: 'ABS',
            kerb_weight: 159,
        },
        colours: [
            { name: 'Midnight Blue', price: 160217 },
            { name: 'Nimbus Grey', price: 160217 },
        ],
    },
];

console.log('\n=== Variants ===');
const insertedVariants = [];

for (const vDef of variantDefs) {
    const { data: variant, error: vErr } = await c.from('cat_variants_vehicle')
        .insert({ model_id: model.id, name: vDef.name, slug: vDef.slug, position: vDef.position, status: 'ACTIVE', ...vDef.specs })
        .select().single();

    if (vErr) { console.error(`  ❌ ${vDef.name}:`, vErr.message); continue; }
    console.log(`  ✅ ${variant.name} (${variant.id.slice(0, 8)})`);
    insertedVariants.push({ ...variant, colours: vDef.colours });
}

// ─── 4. SKUs (Variant × Colour) ───
console.log('\n=== SKUs ===');
let pos = 0;
const skuIds = [];

for (const v of insertedVariants) {
    for (let ci = 0; ci < v.colours.length; ci++) {
        const col = v.colours[ci];
        const colourRecord = insertedColours[col.name];
        const colSlug = col.name.toLowerCase().replace(/\s+/g, '-');

        const { data: sku, error: sErr } = await c.from('cat_skus')
            .insert({
                sku_type: 'VEHICLE',
                brand_id: TVS_BRAND_ID,
                model_id: model.id,
                vehicle_variant_id: v.id,
                colour_id: colourRecord?.id || null,
                name: `Ronin ${v.name} - ${col.name}`,
                slug: `tvs-ronin-${v.slug}-${colSlug}`,
                sku_code: `TVS-RON-${v.slug.toUpperCase()}-${col.name.replace(/\s+/g, '').slice(0, 5).toUpperCase()}`,
                color_name: col.name,
                hex_primary: colourRecord?.hex_primary || null,
                hex_secondary: colourRecord?.hex_secondary || null,
                finish: colourRecord?.finish || 'GLOSS',
                price_base: col.price,
                position: pos++,
                status: 'ACTIVE',
                is_primary: (ci === 0 && v.position === 0),
                zoom_factor: 1, offset_x: 0, offset_y: 0, is_flipped: false,
                media_shared: false, has_360: false,
            })
            .select('id, name, sku_code, price_base').single();

        if (sErr) { console.error(`    ❌ ${col.name}:`, sErr.message); continue; }
        console.log(`    ✅ ${sku.name} (${sku.sku_code}) ₹${sku.price_base}`);
        skuIds.push({ id: sku.id, price: col.price });
    }
}

// ─── 5. Pricing (MH) ───
console.log('\n=== Pricing (MH) ===');
for (const sku of skuIds) {
    const { error: pErr } = await c.from('cat_price_state_mh')
        .insert({
            sku_id: sku.id,
            state_code: 'MH',
            ex_showroom: sku.price,
            ex_factory: sku.price,
            publish_stage: 'DRAFT',
        });

    if (pErr) { console.error(`    ❌ Price ${sku.id.slice(0, 8)}:`, pErr.message); continue; }
    console.log(`    ✅ ₹${sku.price}`);
}

console.log('\n🎉 TVS Ronin seeded! Model ID:', model.id);
console.log(`   Variants: ${insertedVariants.length}`);
console.log(`   Colours: ${Object.keys(insertedColours).length}`);
console.log(`   SKUs: ${skuIds.length}`);
console.log(`   Pricing: ${skuIds.length} MH entries`);

console.log('\n=== Compute RTO + Insurance (MH) ===');
const reprice = spawnSync('npx', ['tsx', 'scripts/reprice_model_rows.ts', '--model=Ronin', '--state=MH', '--apply'], {
    stdio: 'inherit',
});

if (reprice.status !== 0) {
    console.warn('\n⚠️  Ronin seeded, but compute-only repricing failed.');
    console.warn('    Run manually: npx tsx scripts/reprice_model_rows.ts --model=Ronin --state=MH --apply');
} else {
    console.log('✅ RTO + Insurance computed for Ronin MH pricing rows');
}
