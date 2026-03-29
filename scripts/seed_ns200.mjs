import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BAJAJ_BRAND_ID = '447f6ca7-923c-4522-b99c-22e5264696c3';

// NS200 Specs Based on Official Bajaj Site
const MODEL = {
  brand_id: BAJAJ_BRAND_ID,
  name: 'Pulsar NS200',
  slug: 'pulsar-ns200',
  product_type: 'VEHICLE',
  body_type: 'MOTORCYCLE',
  engine_cc: 199.5,
  fuel_type: 'PETROL',
  emission_standard: 'BS6_STAGE2',
  hsn_code: '871120',
  item_tax_rate: 18,
  position: 11,
  status: 'ACTIVE'
};

const VARIANT = {
  name: 'DC USD',
  slug: 'dc-usd',
  position: 1,
  status: 'ACTIVE',
  displacement: 199.5,
  max_power: '18 kW (24.5 PS) @ 9750 rpm',
  max_torque: '18.74 Nm @ 8000 rpm',
  transmission: 'MANUAL',
  front_brake: 'Disc (300 mm)',
  rear_brake: 'Disc (230 mm)',
  braking_system: 'Dual Channel ABS',
  front_suspension: 'Upside Down Forks',
  rear_suspension: 'Nitrox mono shock absorber',
  fuel_capacity: 12,
  console_type: 'DIGITAL',
  led_headlamp: true,
  bluetooth: true,
  front_tyre: '100/80-17 Tubeless',
  rear_tyre: '130/70-17 Tubeless',
  tyre_type: 'TUBELESS',
  cooling_system: 'LIQUID-COOLED',
  cylinders: 1
};

const COLORS = [
  { name: 'Glossy Ebony Black', slug: 'glossy-ebony-black', hex: '#18181A' },
  { name: 'Metallic Pearl White', slug: 'metallic-pearl-white', hex: '#F0F0F0' },
  { name: 'Cocktail Wine Red', slug: 'cocktail-wine-red', hex: '#7D181D' },
  { name: 'Pewter Grey', slug: 'pewter-grey', hex: '#7A7D84' }
];

async function seed() {
  console.log(`Seeding ${MODEL.name}...`);

  // 1. Check or create Model
  let { data: model } = await supabase.from('cat_models').select('*').eq('slug', MODEL.slug).single();
  if (!model) {
    const { data: newModel, error } = await supabase.from('cat_models').insert(MODEL).select().single();
    if (error) throw error;
    model = newModel;
    console.log('Created Model:', model.id);
  } else {
    console.log('Model exists:', model.id);
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
        name: `${MODEL.name} ${VARIANT.name} ${c.name}`,
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

  console.log(`${MODEL.name} Seeding Complete!`);
}

seed().catch(console.error);
