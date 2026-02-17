/**
 * Seed Script: TVS XL 100 → V2 Catalog Tables
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TVS = 'aff9a671-6e98-4d7e-8af1-b7823238a00e';

// Helper: extract image URL from legacy items
const { data: legacyItems } = await c.from('cat_items')
    .select('id, name, type, parent_id, specs, image_url, position')
    .eq('brand_id', TVS).order('position');

const xlProduct = legacyItems.find(i => i.name === 'Xl 100' && i.type === 'PRODUCT');
const legacyVariants = legacyItems.filter(i => i.parent_id === xlProduct.id && i.type === 'VARIANT');

// 1. Model
const { data: model, error: mErr } = await c.from('cat_models').insert({
    brand_id: TVS, name: 'XL 100', slug: 'tvs-xl-100',
    product_type: 'VEHICLE', body_type: 'MOPED',
    engine_cc: 99.7, fuel_type: 'PETROL', emission_standard: 'BS6',
    hsn_code: '87112011', item_tax_rate: 18, position: 2, status: 'ACTIVE',
}).select().single();
if (mErr) { console.error('Model:', mErr.message); process.exit(1); }
console.log('✅ Model:', model.name, model.id);

// 2. Variants — map legacy specs to normalized columns
let skuPos = 0;
for (let vi = 0; vi < legacyVariants.length; vi++) {
    const lv = legacyVariants[vi];
    const sp = lv.specs || {};

    // Parse numeric values
    const parseNum = (v) => { const n = parseFloat(String(v)); return isNaN(n) ? null : n; };

    const variantPayload = {
        model_id: model.id,
        name: lv.name,
        slug: lv.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        position: vi,
        status: 'ACTIVE',
        engine_type: sp.engine_type || 'Single Cylinder, 4 Stroke',
        displacement: parseNum(sp.displacement) || 99.7,
        max_power: sp.max_power || null,
        max_torque: sp.max_torque || null,
        num_valves: parseNum(sp.num_valves) || null,
        transmission: 'MANUAL',
        start_type: lv.name.includes('I-touchstart') ? 'ELECTRIC' : 'KICK',
        air_filter: sp.air_filter || null,
        mileage: parseNum(sp.mileage) || null,
        front_brake: sp.front_brake || 'Drum',
        rear_brake: sp.rear_brake || 'Drum',
        braking_system: 'SBT',
        front_suspension: sp.front_suspension || null,
        rear_suspension: sp.rear_suspension || null,
        kerb_weight: parseNum(sp.kerb_weight) || null,
        ground_clearance: parseNum(sp.ground_clearance) || null,
        wheelbase: parseNum(sp.wheelbase) || null,
        fuel_capacity: parseNum(sp.fuel_capacity) || null,
        console_type: 'ANALOG',
        led_headlamp: sp.led_drl === 'Yes',
        led_tail_lamp: false,
        usb_charging: false,
        bluetooth: false,
        navigation: false,
        front_tyre: sp.front_tyre || null,
        rear_tyre: sp.rear_tyre || null,
        tyre_type: sp.tyre_type === 'Tube Type' ? 'Tube Type' : 'Tubeless',
    };

    const { data: variant, error: vErr } = await c.from('cat_variants_vehicle')
        .insert(variantPayload).select().single();

    if (vErr) { console.error(`  ❌ ${lv.name}:`, vErr.message); continue; }
    console.log(`  ✅ Variant: ${variant.name}`);

    // 3. SKUs for this variant
    const legacySkus = legacyItems.filter(i => i.parent_id === lv.id);
    for (let si = 0; si < legacySkus.length; si++) {
        const ls = legacySkus[si];
        const colName = ls.name.charAt(0).toUpperCase() + ls.name.slice(1).toLowerCase();
        const hexMap = { GREEN: '#2D572C', BLACK: '#1A1A1A', BLUE: '#2C5AA0', RED: '#C0392B', 'MINERAL PURPLE': '#6A4C93', 'LUSTER GOLD': '#C5A35A', 'MINT BLUE': '#6CB4C0', 'DELIGHT BLUE': '#5B9BD5', 'BEAVER BROWN': '#8B6914', GREY: '#7A7D82' };

        const { data: sku, error: sErr } = await c.from('cat_skus').insert({
            sku_type: 'VEHICLE', brand_id: TVS, model_id: model.id, vehicle_variant_id: variant.id,
            name: colName,
            slug: `tvs-xl100-${variant.slug}-${colName.toLowerCase().replace(/\s+/g, '-')}`,
            sku_code: `TVS-XL100-${variant.slug.slice(0, 5).toUpperCase()}-${ls.name.replace(/\s+/g, '').slice(0, 5).toUpperCase()}`,
            color_name: colName, hex_primary: hexMap[ls.name] || '#888888',
            finish: 'GLOSS', primary_image: ls.image_url || null,
            price_base: 0, position: skuPos++, status: 'ACTIVE',
            is_primary: (vi === 0 && si === 0),
            zoom_factor: 1, offset_x: 0, offset_y: 0, is_flipped: false,
            media_shared: false, has_360: false,
        }).select('id, name, sku_code').single();

        if (sErr) { console.error(`    ❌ ${colName}:`, sErr.message); continue; }
        console.log(`    ✅ ${sku.name} (${sku.sku_code})`);
    }
}

console.log('\n🎉 TVS XL 100 seeded! Model ID:', model.id);
