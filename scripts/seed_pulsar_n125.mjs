import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BAJAJ_BRAND_ID = 'a30ca4bc-0b2a-463d-8d54-a7dd6d376de9'; 

const MODEL = {
  brand_id: BAJAJ_BRAND_ID,
  name: 'Pulsar N125',
  slug: 'pulsar-n125',
  product_type: 'VEHICLE',
  body_type: 'MOTORCYCLE',
  engine_cc: 124.59,
  fuel_type: 'PETROL',
  emission_standard: 'BS6_STAGE2',
  hsn_code: '871120',
  item_tax_rate: 18,
  position: 13,
  status: 'ACTIVE'
};

const VARIANTS = [
  {
    name: 'LED Disc',
    slug: 'led-disc',
    position: 1,
    status: 'ACTIVE',
    displacement: 124.59,
    max_power: '8.83 kW (12 PS) @ 8500 rpm',
    max_torque: '11 Nm @ 6000 rpm',
    transmission: 'MANUAL',
    front_brake: 'Disc (240 mm)',
    rear_brake: 'Drum (130 mm)',
    braking_system: 'CBS',
    front_suspension: 'Telescopic',
    rear_suspension: 'Mono shock',
    fuel_capacity: 9.5,
    console_type: 'DIGITAL',
    led_headlamp: true,
    bluetooth: false,
    front_tyre: '80/100-17 Tubeless',
    rear_tyre: '100/90-17 Tubeless',
    tyre_type: 'TUBELESS',
    cooling_system: 'AIR-COOLED',
    cylinders: 1
  },
  {
    name: 'LED Disc BT',
    slug: 'led-disc-bt',
    position: 2,
    status: 'ACTIVE',
    displacement: 124.59,
    max_power: '8.83 kW (12 PS) @ 8500 rpm',
    max_torque: '11 Nm @ 6000 rpm',
    transmission: 'MANUAL',
    front_brake: 'Disc (240 mm)',
    rear_brake: 'Drum (130 mm)',
    braking_system: 'CBS',
    front_suspension: 'Telescopic',
    rear_suspension: 'Mono shock',
    fuel_capacity: 9.5,
    console_type: 'DIGITAL',
    led_headlamp: true,
    bluetooth: true,
    front_tyre: '80/100-17 Tubeless',
    rear_tyre: '110/80-17 Tubeless', // wider rear tyre on BT
    tyre_type: 'TUBELESS',
    cooling_system: 'AIR-COOLED',
    cylinders: 1
  }
];

const COLORS_BASE = [
  { name: 'Pearl Metallic White', slug: 'pearl-metallic-white', hex: '#FFFFFF', finish: 'MATTE' },
  { name: 'Ebony Black', slug: 'ebony-black', hex: '#000000', finish: 'MATTE' },
  { name: 'Caribbean Blue', slug: 'caribbean-blue', hex: '#0D54A3', finish: 'MATTE' },
  { name: 'Cocktail Wine Red', slug: 'cocktail-wine-red', hex: '#90020B', finish: 'MATTE' },
];

const COLORS_TOP = [
  { name: 'Purple Fury', slug: 'purple-fury', hex: '#6450D9', finish: 'MATTE' },
  { name: 'Cocktail Wine Red', slug: 'cocktail-wine-red', hex: '#90020B', finish: 'MATTE' },
  { name: 'Citrus Rush', slug: 'citrus-rush', hex: '#93C70B', finish: 'MATTE' },
];

async function seed() {
  console.log(`Seeding ${MODEL.name}...`);
  const { data: b } = await supabase.from('cat_brands').select('id').ilike('name', 'bajaj').single();
  MODEL.brand_id = b.id;

  let { data: model } = await supabase.from('cat_models').select('*').eq('slug', MODEL.slug).single();
  if (!model) {
    const { data: newModel, error } = await supabase.from('cat_models').insert(MODEL).select().single();
    if (error) throw error;
    model = newModel;
    console.log('Created Model:', model.id);
  } else {
    await supabase.from('cat_models').update(MODEL).eq('id', model.id);
  }

  for (const v of VARIANTS) {
    let { data: variant } = await supabase.from('cat_variants_vehicle').select('*').eq('model_id', model.id).eq('slug', v.slug).single();
    if (!variant) {
      const { data: newVar, error } = await supabase.from('cat_variants_vehicle').insert({ ...v, model_id: model.id }).select().single();
      if (error) throw error;
      variant = newVar;
      console.log('Created Variant:', variant.name);
    } else {
      await supabase.from('cat_variants_vehicle').update(v).eq('id', variant.id);
    }

    const targetColors = v.slug === 'led-disc' ? COLORS_BASE : COLORS_TOP;

    for (const c of targetColors) {
      let { data: color } = await supabase.from('cat_colours').select('*').eq('model_id', model.id).eq('name', c.name).single();
      if (!color) {
        const { data: newColor, error } = await supabase.from('cat_colours').insert({
          model_id: model.id, name: c.name, hex_primary: c.hex, finish: c.finish, position: 1
        }).select().single();
        if (error) throw error;
        color = newColor;
      }

      const skuSlug = `pulsar-n125-${v.slug}-${c.slug}`;
      const skuName = `${v.name} ${c.name}`;
      let { data: sku } = await supabase.from('cat_skus').select('*').eq('slug', skuSlug).single();
      if (!sku) {
        const { data: newSku, error } = await supabase.from('cat_skus').insert({
          sku_type: 'VEHICLE',
          brand_id: MODEL.brand_id,
          model_id: model.id,
          vehicle_variant_id: variant.id,
          colour_id: color.id,
          name: skuName,
          slug: skuSlug,
          color_name: c.name,
          hex_primary: c.hex,
          status: 'ACTIVE',
          position: 1,
          has_360: false
        }).select().single();
        if (error) throw error;
        console.log(`Created SKU: ${skuName}`);
      }
    }
  }
  console.log(`${MODEL.name} Seeding Complete!`);
}

seed().catch(console.error);
