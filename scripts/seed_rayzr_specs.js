/**
 * RAYZR SPECIFICATION SEEDER (ON-DEMAND)
 * Usage: node scripts/seed_rayzr_specs.js <TARGET_ITEM_ID>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Standardized RayZR Specs
const RAYZR_SPECS = {
    engine_cc: 125,
    max_power: '8.2 PS @ 6500 rpm',
    max_torque: '10.3 Nm @ 5000 rpm',
    kerb_weight: 99,
    fuel_capacity: 5.2,
    transmission: 'V-Belt Automatic',
    brake_front: 'Disc',
    brake_rear: 'Drum',
    tire_front: '90/90-12 Tubeless',
    tire_rear: '110/90-10 Tubeless',
    ground_clearance: 145,
    seat_height: 785,
};

async function seedSpecs(targetId) {
    if (!targetId) {
        console.error('❌ Error: Please provide a TARGET_ITEM_ID');
        process.exit(1);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Supabase environment variables missing.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`--- Seeding RayZR Specs for Item: ${targetId} ---`);

    const { data, error } = await supabase.from('cat_items').update({ specs: RAYZR_SPECS }).eq('id', targetId).select();

    if (error) {
        console.error(`❌ Update failed: ${error.message}`);
    } else {
        console.log(`✅ Successfully seeded specs for: ${data[0]?.name || targetId}`);
        console.log('Specs stored:', JSON.stringify(RAYZR_SPECS, null, 2));
    }
}

const targetId = process.argv[2];
seedSpecs(targetId);
