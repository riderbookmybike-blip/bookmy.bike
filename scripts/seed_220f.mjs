import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BAJAJ_BRAND_ID = '447f6ca7-923c-4522-b99c-22e5264696c3';

const MODEL = {
  brand_id: BAJAJ_BRAND_ID,
  name: 'Pulsar 220F',
  slug: 'pulsar-220f',
  product_type: 'VEHICLE',
  body_type: 'MOTORCYCLE',
  engine_cc: 220,
  fuel_type: 'PETROL',
  emission_standard: 'BS6_STAGE2',
  hsn_code: '871120',
  item_tax_rate: 18,
  position: 10,
  status: 'ACTIVE'
};

const VARIANT = {
  name: 'Standard',
  slug: 'standard',
  position: 1,
  status: 'ACTIVE',
  displacement: 220,
  max_power: '15 kW (20.4 PS) @ 8500 rpm',
  max_torque: '18.55 Nm @ 7000 rpm',
  transmission: 'MANUAL',
  front_brake: 'Disc',
  rear_brake: 'Disc',
  braking_system: 'Single Channel ABS',
  front_suspension: 'Telescopic with anti-friction bush',
  rear_suspension: '5 way adjustable, Nitrox shock absorber',
  fuel_capacity: 15,
  console_type: 'DIGITAL',
  led_headlamp: true,
  bluetooth: true,
  front_tyre: '90/90-17 Tubeless',
  rear_tyre: '120/80-17 Tubeless',
  tyre_type: 'TUBELESS',
  cooling_system: 'OIL-COOLED',
  cylinders: 1
};

const COLORS = [
  { name: 'Black Cherry Red', slug: 'black-cherry-red', hex: '#630606', cdn: 'red' },
  { name: 'Black Ink Blue', slug: 'black-ink-blue', hex: '#002B4A', cdn: 'blue' },
  { name: 'Black Copper Beige', slug: 'black-copper-beige', hex: '#6D5B41', cdn: 'bronze' },
  { name: 'Green Light Copper', slug: 'green-light-copper', hex: '#2A3C2A', cdn: 'green' }
];

async function seed() {
  console.log('Seeding Pulsar 220F...');

  // 1. Check or create Model
  let { data: model } = await supabase.from('cat_models').select('*').eq('slug', MODEL.slug).single();
  if (!model) {
    const { data: newModel, error } = await supabase.from('cat_models').insert(MODEL).select().single();
    if (error) throw error;
    model = newModel;
    console.log('Created Model:', model.id);
  } else {
    console.log('Model exists:', model.id);
    // Update model to ensure it is ACTIVE
    await supabase.from('cat_models').update(MODEL).eq('id', model.id);
  }

  // 2. Check or create Variant
  let { data: variant } = await supabase.from('cat_variants_vehicle').select('*').eq('model_id', model.id).eq('slug', VARIANT.slug).single();
  if (!variant) {
    const { data: newVar, error } = await supabase.from('cat_variants_vehicle').insert({
      ...VARIANT,
      model_id: model.id
    }).select().single();
    if (error) throw error;
    variant = newVar;
    console.log('Created Variant:', variant.id);
  } else {
    console.log('Variant exists:', variant.id);
    await supabase.from('cat_variants_vehicle').update(VARIANT).eq('id', variant.id);
  }

  // 3. Process Colors and SKUs
  for (const c of COLORS) {
    // Check/create Color
    let { data: color } = await supabase.from('cat_colours').select('*').eq('model_id', model.id).eq('name', c.name).single();
    if (!color) {
      const { data: newColor, error } = await supabase.from('cat_colours').insert({
        model_id: model.id,
        name: c.name,
        hex_primary: c.hex,
        finish: 'GLOSS',
        position: 1
      }).select().single();
      if (error) throw error;
      color = newColor;
      console.log('Created Color:', color.id);
    } else {
      console.log('Color exists:', color.id);
    }

    // Check/create SKU
    let { data: sku } = await supabase.from('cat_skus').select('*').eq('slug', c.slug).single();
    if (!sku) {
      const { data: newSku, error } = await supabase.from('cat_skus').insert({
        sku_type: 'VEHICLE',
        brand_id: MODEL.brand_id,
        model_id: model.id,
        vehicle_variant_id: variant.id,
        colour_id: color.id,
        name: `${MODEL.name} ${VARIANT.name} ${color.name}`,
        slug: c.slug,
        status: 'ACTIVE',
        position: 1,
        has_360: true
      }).select().single();
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
