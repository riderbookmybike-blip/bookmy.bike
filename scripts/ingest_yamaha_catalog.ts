import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Manually load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, serviceKey!);

const YAMAHA_BRAND_ID = 'e0d5b210-2d89-4a81-b369-bc7d3f11265f';

// Helper to get a valid system user
async function getSystemUserId() {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (users?.users?.length) return users.users[0].id;

    // Fallback to querying public.users if auth admin fails (though service key should work)
    const { data: publicUsers } = await supabase.from('users').select('id').limit(1).single();
    return publicUsers?.id;
}

// Master List Definition (Hardcoded from yamaha_catalog_master.md)
const MODELS = [
    // 1. R-Series
    {
        name: 'R3',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 321, max_power: '42.0 PS', weight_kg: 169, cooling: 'Liquid Cooled' },
    },
    {
        name: 'R15M',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 155, max_power: '18.4 PS', weight_kg: 142, features: 'Quick Shifter, TCS, USD Forks' },
    },
    {
        name: 'R15 V4',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 155, max_power: '18.4 PS', weight_kg: 142 },
    },
    {
        name: 'R15S',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 155, max_power: '18.6 PS', weight_kg: 142, seat: 'Unibody Seat' },
    },

    // 2. MT-Series
    {
        name: 'MT-03',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 321, max_power: '42.0 PS', weight_kg: 167 },
    },
    {
        name: 'MT-15 V2',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 155, max_power: '18.4 PS', weight_kg: 139 },
    },

    // 3. FZ-Series
    {
        name: 'FZ-S FI V4',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 149, max_power: '12.4 PS', weight_kg: 136, features: 'TCS, Bluetooth' },
    },
    {
        name: 'FZ-S FI V3',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 149, max_power: '12.4 PS', weight_kg: 135 },
    },
    {
        name: 'FZ-X',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 149, max_power: '12.4 PS', style: 'Neo-Retro' },
    },
    {
        name: 'Fezzer',
        category: 'MOTORCYCLE',
        template: '77D-6B5-D04',
        specs: { engine_cc: 149, max_power: '12.4 PS' },
    }, // Legacy FZ, usually called FZ FI if relevant, but adding as precaution if user meant FZ generic

    // 4. Maxi Scooter
    {
        name: 'Aerox 155',
        category: 'SCOOTER',
        template: 'DA9-279-E2B',
        specs: { engine_cc: 155, max_power: '15.0 PS', cooling: 'Liquid Cooled', wheels: '14-inch' },
    },

    // 5. Normal Scooters
    {
        name: 'Fascino 125',
        category: 'SCOOTER',
        template: 'DA9-279-E2B',
        specs: { engine_cc: 125, max_power: '8.2 PS', weight_kg: 99, tech: 'Hybrid Assist' },
    },
    {
        name: 'RayZR 125',
        category: 'SCOOTER',
        template: 'DA9-279-E2B',
        specs: { engine_cc: 125, max_power: '8.2 PS', weight_kg: 99, tech: 'Hybrid Assist' },
    },
    {
        name: 'RayZR Street Rally',
        category: 'SCOOTER',
        template: 'DA9-279-E2B',
        specs: { engine_cc: 125, max_power: '8.2 PS', features: 'Knuckle Guards, Block Tyres' },
    },
];

async function main() {
    console.log(`Starting ingestion for ${MODELS.length} models...`);

    const systemUserId = await getSystemUserId();
    if (!systemUserId) {
        console.error('Could not find a valid system user ID');
        process.exit(1);
    }
    console.log('Using System User ID:', systemUserId);

    // Fetch existing logic to avoid dupes
    const { data: existing } = await supabase
        .from('cat_items')
        .select('id, slug')
        .eq('brand_id', YAMAHA_BRAND_ID)
        .eq('type', 'FAMILY');

    const existingMap = new Map(existing?.map(x => [x.slug, x.id]));
    const toInsert = [];

    for (const model of MODELS) {
        const slug = model.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        if (existingMap.has(slug)) {
            console.log(`Skipping existing: ${model.name} (${slug}) - ID: ${existingMap.get(slug)}`);
            continue;
        }

        /* 
          Schema for cat_items (FAMILY) 
          id (auto-gen if not provided? No, usually uuid_generate_v4(), but let's see if we need to provide)
          But usually type='FAMILY', name, slug, brand_id, template_id, status='DRAFT'
        */

        toInsert.push({
            name: model.name,
            slug: slug,
            brand_id: YAMAHA_BRAND_ID,
            template_id: await getTemplateId(model.template),
            type: 'FAMILY',
            status: 'ACTIVE',
            specs: model.specs,
            tenant_id: null,
            created_by: systemUserId, // System User UUID
            is_primary: false,
        });
    }

    if (toInsert.length === 0) {
        console.log('No new models to insert.');
        return;
    }

    // Insert batch
    const { data, error } = await supabase.from('cat_items').insert(toInsert).select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log(
            `Successfully inserted ${data.length} models:`,
            data.map(d => d.name)
        );
    }
}

// Helper to resolve template code to ID
const templateCache: Record<string, string> = {};
async function getTemplateId(code: string): Promise<string | null> {
    if (templateCache[code]) return templateCache[code];

    const { data } = await supabase.from('cat_templates').select('id').eq('code', code).single();

    if (data?.id) {
        templateCache[code] = data.id;
        return data.id;
    }
    console.warn(`Template code ${code} not found!`);
    return null;
}

main();
