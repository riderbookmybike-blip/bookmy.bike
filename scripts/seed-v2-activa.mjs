/**
 * Seed Script: Honda Activa → V2 Catalog Tables
 * Source: cat_items legacy data
 * Image policy: SKU-level only, smart crop scale 1
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const HONDA_BRAND_ID = 'dc9d5b00-f90a-4fd5-ada8-304c765af91d';

// ─── 1. Model ───
const { data: model, error: mErr } = await c.from('cat_models')
    .insert({
        brand_id: HONDA_BRAND_ID,
        name: 'Activa',
        slug: 'honda-activa',
        product_type: 'VEHICLE',
        body_type: 'SCOOTER',
        engine_cc: 109.51,
        fuel_type: 'PETROL',
        emission_standard: 'BS6',
        hsn_code: '87112019',
        item_tax_rate: 28,
        position: 0,
        status: 'ACTIVE',
    })
    .select().single();

if (mErr) { console.error('Model failed:', mErr.message); process.exit(1); }
console.log('✅ Model:', model.name, model.id);

// ─── 2. Variants ───
const variantDefs = [
    {
        name: 'Standard',
        slug: 'standard',
        position: 0,
        specs: {
            engine_type: 'Single Cylinder, 4 Stroke',
            displacement: 109.51,
            transmission: 'CVT_AUTOMATIC',
            start_type: 'KICK_AND_ELECTRIC',
            front_brake: 'Drum',
            rear_brake: 'Drum',
            braking_system: 'CBS',
            console_type: 'ANALOG',
            led_headlamp: false,
            led_tail_lamp: false,
            usb_charging: false,
            bluetooth: false,
            navigation: false,
            front_tyre: '90/90-12',
            rear_tyre: '90/100-10',
            tyre_type: 'Tubeless',
        },
        colours: [
            { name: 'Pearl Precious White', hex: '#F5F5F0', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758583082_edwarsyf8.png' },
            { name: 'Rebel Red Metallic', hex: '#B22234', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758637813_1twjssbmj.png' },
            { name: 'Pearl Igneous Black', hex: '#1C1C1C', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758558514_069c2cyrx.png' },
            { name: 'Pearl Siren Blue', hex: '#3B5998', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758618893_8wgu3swjc.png' },
            { name: 'Decent Blue Metallic', hex: '#4682B4', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758415313_b11oo47w8.png' },
            { name: 'Mat Axis Gray Metallic', hex: '#808080', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758532505_uxnbghppc.png' },
        ],
    },
    {
        name: 'Deluxe',
        slug: 'deluxe',
        position: 1,
        specs: {
            engine_type: 'Single Cylinder, 4 Stroke',
            displacement: 109.51,
            transmission: 'CVT_AUTOMATIC',
            start_type: 'KICK_AND_ELECTRIC',
            front_brake: 'Drum',
            rear_brake: 'Drum',
            braking_system: 'CBS',
            console_type: 'DIGITAL_TFT',
            led_headlamp: true,
            led_tail_lamp: true,
            usb_charging: true,
            bluetooth: false,
            navigation: false,
            front_tyre: '90/90-12',
            rear_tyre: '90/100-10',
            tyre_type: 'Tubeless',
        },
        colours: [
            { name: 'Pearl Precious White', hex: '#F5F5F0', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758583082_edwarsyf8.png' },
            { name: 'Decent Blue Metallic', hex: '#4682B4', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758415313_b11oo47w8.png' },
            { name: 'Rebel Red Metallic', hex: '#B22234', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758637813_1twjssbmj.png' },
            { name: 'Pearl Siren Blue', hex: '#3B5998', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758618893_8wgu3swjc.png' },
            { name: 'Mat Axis Gray Metallic', hex: '#808080', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758532505_uxnbghppc.png' },
            { name: 'Pearl Igneous Black', hex: '#1C1C1C', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758558514_069c2cyrx.png' },
        ],
    },
    {
        name: 'Smart',
        slug: 'smart',
        position: 2,
        specs: {
            engine_type: 'Single Cylinder, 4 Stroke',
            displacement: 109.51,
            transmission: 'CVT_AUTOMATIC',
            start_type: 'ELECTRIC',
            front_brake: 'Drum',
            rear_brake: 'Drum',
            braking_system: 'CBS',
            console_type: 'DIGITAL_TFT',
            led_headlamp: true,
            led_tail_lamp: true,
            usb_charging: true,
            bluetooth: true,
            navigation: true,
            front_tyre: '90/90-12',
            rear_tyre: '90/100-10',
            tyre_type: 'Tubeless',
        },
        colours: [
            { name: 'Rebel Red Metallic', hex: '#B22234', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758637813_1twjssbmj.png' },
            { name: 'Decent Blue Metallic', hex: '#4682B4', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758415313_b11oo47w8.png' },
            { name: 'Pearl Siren Blue', hex: '#3B5998', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758618893_8wgu3swjc.png' },
            { name: 'Mat Axis Gray Metallic', hex: '#808080', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758532505_uxnbghppc.png' },
            { name: 'Pearl Precious White', hex: '#F5F5F0', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758583082_edwarsyf8.png' },
            { name: 'Pearl Igneous Black', hex: '#1C1C1C', image: 'https://aytdeqjxxjxbgiyslubx.supabase.co/storage/v1/object/public/vehicles/catalog/1768758558514_069c2cyrx.png' },
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

// ─── 3. SKUs ───
console.log('\n=== SKUs ===');
let pos = 0;
for (const v of insertedVariants) {
    for (let ci = 0; ci < v.colours.length; ci++) {
        const col = v.colours[ci];
        const { data: sku, error: sErr } = await c.from('cat_skus')
            .insert({
                sku_type: 'VEHICLE',
                brand_id: HONDA_BRAND_ID,
                model_id: model.id,
                vehicle_variant_id: v.id,
                name: col.name,
                slug: `honda-activa-${v.slug}-${col.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
                sku_code: `HON-ACT-${v.slug.toUpperCase().slice(0, 4)}-${col.name.replace(/\s+/g, '').slice(0, 6).toUpperCase()}`,
                color_name: col.name,
                hex_primary: col.hex,
                finish: col.name.includes('Mat') ? 'MATTE' : 'METALLIC',
                primary_image: col.image,
                price_base: 0,
                position: pos++,
                status: 'ACTIVE',
                is_primary: (ci === 0 && v.position === 0),
                zoom_factor: 1, offset_x: 0, offset_y: 0, is_flipped: false,
                media_shared: false, has_360: false,
            })
            .select('id, name, sku_code').single();

        if (sErr) { console.error(`    ❌ ${col.name}:`, sErr.message); continue; }
        console.log(`    ✅ ${sku.name} (${sku.sku_code})`);
    }
}

console.log('\n🎉 Honda Activa seeded! Model ID:', model.id);
