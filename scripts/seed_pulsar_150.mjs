import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BAJAJ_BRAND_ID = 'a30ca4bc-0b2a-463d-8d54-a7dd6d376de9'; // bajaj id from DB

const MODEL = {
  brand_id: BAJAJ_BRAND_ID,
  name: 'Pulsar 150',
  slug: 'pulsar-150',
  product_type: 'VEHICLE',
  body_type: 'MOTORCYCLE',
  engine_cc: 149.5,
  fuel_type: 'PETROL',
  emission_standard: 'BS6_STAGE2',
  hsn_code: '871120',
  item_tax_rate: 18,
  position: 12,
  status: 'ACTIVE'
};

const VARIANTS = [
  {
    name: 'Single Disc',
    slug: 'single-disc',
    position: 1,
    status: 'ACTIVE',
    displacement: 149.5,
    max_power: '10.3 kW (14 PS) @ 8500 rpm',
    max_torque: '13.25 Nm @ 6500 rpm',
    transmission: 'MANUAL',
    front_brake: 'Disc (260 mm)',
    rear_brake: 'Drum (130 mm)',
    braking_system: 'Single Channel ABS',
    front_suspension: 'Telescopic',
    rear_suspension: 'Twin shock absorber, gas filled with canister',
    fuel_capacity: 15,
    console_type: 'DIGITAL',
    led_headlamp: false,
    bluetooth: false,
    front_tyre: '80/100-17 Tubeless',
    rear_tyre: '100/90-17 Tubeless',
    tyre_type: 'TUBELESS',
    cooling_system: 'AIR-COOLED',
    cylinders: 1
  },
  {
    name: 'Twin Disc',
    slug: 'twin-disc',
    position: 2,
    status: 'ACTIVE',
    displacement: 149.5,
    max_power: '10.3 kW (14 PS) @ 8500 rpm',
    max_torque: '13.25 Nm @ 6500 rpm',
    transmission: 'MANUAL',
    front_brake: 'Disc (280 mm)',
    rear_brake: 'Disc (230 mm)',
    braking_system: 'Single Channel ABS',
    front_suspension: 'Telescopic',
    rear_suspension: 'Twin shock absorber, gas filled with canister',
    fuel_capacity: 15,
    console_type: 'DIGITAL',
    led_headlamp: false,
    bluetooth: false,
    front_tyre: '90/90-17 Tubeless',
    rear_tyre: '120/80-17 Tubeless',
    tyre_type: 'TUBELESS',
    cooling_system: 'AIR-COOLED',
    cylinders: 1
  }
];

const COLORS = [
  { name: 'Sparkle Black Red', slug: 'sparkle-black-red', hex: '#B20000', finish: 'GLOSS' },
  { name: 'Sparkle Black Blue', slug: 'sparkle-black-blue', hex: '#000080', finish: 'GLOSS' },
  { name: 'Sparkle Black Silver', slug: 'sparkle-black-silver', hex: '#C0C0C0', finish: 'GLOSS' }
];

async function seed() {
  console.log(`Seeding ${MODEL.name}...`);
  const { data: b } = await supabase.from('cat_brands').select('id').ilike('name', 'bajaj').single();
  MODEL.brand_id = b.id;

  // 1. Model
  let { data: model } = await supabase.from('cat_models').select('*').eq('slug', MODEL.slug).single();
  if (!model) {
    const { data: newModel, error } = await supabase.from('cat_models').insert(MODEL).select().single();
    if (error) throw error;
    model = newModel;
    console.log('Created Model:', model.id);
  } else {
    await supabase.from('cat_models').update(MODEL).eq('id', model.id);
  }

  // 2. Variants
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

    // 3. Colors and SKUs
    for (const c of COLORS) {
      // Not all colors might exist for twin disc, but let's seed them all to be safe and hide them if invalid later.

      let { data: color } = await supabase.from('cat_colours').select('*').eq('model_id', model.id).eq('name', c.name).single();
      if (!color) {
        const { data: newColor, error } = await supabase.from('cat_colours').insert({
          model_id: model.id, name: c.name, hex_primary: c.hex, finish: c.finish, position: 1
        }).select().single();
        if (error) throw error;
        color = newColor;
      }

      const skuSlug = `pulsar-150-${v.slug}-${c.slug}`;
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
      }
    }
  }

  console.log(`${MODEL.name} Seeding Complete!`);
}

seed().catch(console.error);
