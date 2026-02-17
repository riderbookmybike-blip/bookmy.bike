/**
 * Seed Script: Honda Unicorn → V2 Catalog Tables
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const HONDA = 'dc9d5b00-f90a-4fd5-ada8-304c765af91d';

// 1. Model
const { data: model, error: mErr } = await c.from('cat_models')
    .insert({
        brand_id: HONDA, name: 'Unicorn', slug: 'honda-unicorn',
        product_type: 'VEHICLE', body_type: 'MOTORCYCLE',
        engine_cc: 162.71, fuel_type: 'PETROL', emission_standard: 'BS6',
        hsn_code: '87112029', item_tax_rate: 28, position: 1, status: 'ACTIVE',
    }).select().single();
if (mErr) { console.error('Model:', mErr.message); process.exit(1); }
console.log('✅ Model:', model.name, model.id);

// 2. Variant
const { data: variant, error: vErr } = await c.from('cat_variants_vehicle')
    .insert({
        model_id: model.id, name: 'Standard', slug: 'standard', position: 0, status: 'ACTIVE',
        engine_type: 'Single Cylinder, 4 Stroke, SI', displacement: 162.71,
        transmission: 'MANUAL', start_type: 'ELECTRIC',
        front_brake: 'Disc, 240mm', rear_brake: 'Drum, 130mm', braking_system: 'ABS',
        console_type: 'DIGITAL', led_headlamp: true, led_tail_lamp: true,
        usb_charging: false, bluetooth: false, navigation: false,
        front_tyre: '80/100-18', rear_tyre: '100/90-18', tyre_type: 'Tubeless',
    }).select().single();
if (vErr) { console.error('Variant:', vErr.message); process.exit(1); }
console.log('  ✅ Variant:', variant.name);

// 3. SKUs
const colours = [
    { name: 'Radiant Red Metallic', hex: '#C0392B', image: '/media/honda/unicorn/standard/radiant-red-metallic/main.png' },
    { name: 'Matte Axis Gray Metallic', hex: '#808080', image: '/media/honda/unicorn/standard/matte-axis-gray-metallic/main.png' },
    { name: 'Pearl Igneous Black', hex: '#1C1C1C', image: '/media/honda/unicorn/standard/pearl-igneous-black/main.png' },
];

for (let i = 0; i < colours.length; i++) {
    const col = colours[i];
    const { data: sku, error: sErr } = await c.from('cat_skus').insert({
        sku_type: 'VEHICLE', brand_id: HONDA, model_id: model.id, vehicle_variant_id: variant.id,
        name: col.name, slug: `honda-unicorn-${col.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        sku_code: `HON-UNI-STD-${col.name.replace(/\s+/g, '').slice(0, 6).toUpperCase()}`,
        color_name: col.name, hex_primary: col.hex,
        finish: col.name.includes('Matte') ? 'MATTE' : 'METALLIC',
        primary_image: col.image, price_base: 0, position: i, status: 'ACTIVE',
        is_primary: i === 0, zoom_factor: 1, offset_x: 0, offset_y: 0, is_flipped: false,
        media_shared: false, has_360: false,
    }).select('id, name, sku_code').single();
    if (sErr) { console.error(`    ❌ ${col.name}:`, sErr.message); continue; }
    console.log(`    ✅ ${sku.name} (${sku.sku_code})`);
}

console.log('\n🎉 Honda Unicorn seeded! Model ID:', model.id);
