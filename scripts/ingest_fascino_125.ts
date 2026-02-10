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
const AUMS_TENANT_ID = 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5';
const SCOOTER_TEMPLATE_CODE = 'DA9-279-E2B';

const FASCINO_125 = {
    name: 'Fascino 125 Fi Hybrid',
    slug: 'yamaha-fascino125fihybrid',
    specs: {
        engine_cc: 125,
        max_power: '8.2 PS @ 6500 rpm',
        max_torque: '10.3 Nm @ 5000 rpm',
        kerb_weight: 99,
        fuel_capacity: 5.2,
        seat_height: 780,
        ground_clearance: 145,
        cooling: 'Air Cooled',
        transmission: 'CVT',
    },
    variants: [
        {
            name: 'Disc Tft',
            sku_suffix: 'TFT',
            colors: [
                { name: 'Vivid Red Special', hex: '#E4002B', slug: 'vivid-red-special' },
                { name: 'Matte Black Special', hex: '#000000', slug: 'matte-black-special' },
                { name: 'Dark Matte Blue Special', hex: '#1D2951', slug: 'dark-matte-blue-special' },
                { name: 'Matte Grey Special', hex: '#5A5E62', slug: 'matte-grey-special' },
                { name: 'Matte Copper', hex: '#B87333', slug: 'matte-copper' },
                { name: 'Metallic Light Green', hex: '#90EE90', slug: 'metallic-light-green' },
                { name: 'Silver', hex: '#C0C0C0', slug: 'silver' },
            ],
        },
        {
            name: 'Disc',
            sku_suffix: 'D',
            colors: [
                { name: 'Cyan Blue', hex: '#00A9E0', slug: 'cyan-blue' },
                { name: 'Vivid Red', hex: '#E4002B', slug: 'vivid-red' },
                { name: 'Metallic Black', hex: '#000000', slug: 'metallic-black' },
                { name: 'Cool Blue Metallic', hex: '#4682B4', slug: 'cool-blue-metallic' },
                { name: 'Dark Matte Blue', hex: '#1D2951', slug: 'dark-matte-blue' },
                { name: 'Metallic White', hex: '#FFFFFF', slug: 'metallic-white' },
                { name: 'Silver', hex: '#C0C0C0', slug: 'silver' },
                { name: 'Matte Copper', hex: '#B87333', slug: 'matte-copper' },
            ],
        },
        {
            name: 'Drum',
            sku_suffix: 'DR',
            colors: [
                { name: 'Metallic White', hex: '#FFFFFF', slug: 'metallic-white' },
                { name: 'Cyan Blue', hex: '#00A9E0', slug: 'cyan-blue' },
                { name: 'Vivid Red', hex: '#E4002B', slug: 'vivid-red' },
                { name: 'Metallic Black', hex: '#000000', slug: 'metallic-black' },
                { name: 'Cool Blue Metallic', hex: '#4682B4', slug: 'cool-blue-metallic' },
                { name: 'Dark Matte Blue', hex: '#1D2951', slug: 'dark-matte-blue' },
                { name: 'Silver', hex: '#C0C0C0', slug: 'silver' },
                { name: 'Matte Copper', hex: '#B87333', slug: 'matte-copper' },
            ],
        },
    ],
};

async function getSystemUserId() {
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    return users?.users?.[0]?.id || '00000000-0000-0000-0000-000000000000';
}

async function getTemplateId(code: string) {
    const { data } = await supabase.from('cat_templates').select('id').eq('code', code).single();
    return data?.id;
}

const findUniqueSlug = async (candidate: string, currentId?: string) => {
    let slug = candidate;
    let suffix = 1;
    while (true) {
        const { data: existing } = await supabase.from('cat_items').select('id').eq('slug', slug).maybeSingle();
        if (!existing || existing.id === currentId) return slug;
        suffix += 1;
        slug = `${candidate}-${suffix}`;
    }
};

async function main() {
    console.log('Starting ingestion for Yamaha Fascino 125 Fi Hybrid...');
    const systemUserId = await getSystemUserId();
    const templateId = await getTemplateId(SCOOTER_TEMPLATE_CODE);

    if (!templateId) {
        console.error('Template not found:', SCOOTER_TEMPLATE_CODE);
        return;
    }

    // 1. PRODUCT
    const familySlug = await findUniqueSlug(FASCINO_125.slug);
    const { data: family, error: familyError } = await supabase
        .from('cat_items')
        .upsert(
            {
                name: FASCINO_125.name,
                slug: familySlug,
                type: 'PRODUCT',
                brand_id: YAMAHA_BRAND_ID,
                template_id: templateId,
                status: 'ACTIVE',
                specs: FASCINO_125.specs,
                created_by: systemUserId,
                tenant_id: AUMS_TENANT_ID,
            },
            { onConflict: 'slug' }
        )
        .select()
        .single();

    if (familyError) {
        console.error('Error creating product:', familyError);
        return;
    }
    console.log('Product OK:', family.id);

    // 2. VARIANTS
    for (const v of FASCINO_125.variants) {
        const variantSlug = await findUniqueSlug(`${familySlug}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}`);
        const { data: variant, error: variantError } = await supabase
            .from('cat_items')
            .upsert(
                {
                    name: v.name,
                    slug: variantSlug,
                    type: 'VARIANT',
                    parent_id: family.id,
                    brand_id: YAMAHA_BRAND_ID,
                    template_id: templateId,
                    status: 'ACTIVE',
                    created_by: systemUserId,
                    tenant_id: AUMS_TENANT_ID,
                },
                { onConflict: 'slug' }
            )
            .select()
            .single();

        if (variantError) {
            console.error(`Error creating variant ${v.name}:`, variantError);
            continue;
        }
        console.log(`Variant OK: ${v.name} (${variant.id})`);

        // 3. UNITs & SKUs
        for (const c of v.colors) {
            const colorSlug = await findUniqueSlug(`${variantSlug}-${c.slug}`);
            const { data: colorDef, error: colorDefError } = await supabase
                .from('cat_items')
                .upsert(
                    {
                        name: c.name,
                        slug: colorSlug,
                        type: 'UNIT',
                        parent_id: variant.id,
                        brand_id: YAMAHA_BRAND_ID,
                        template_id: templateId,
                        status: 'ACTIVE',
                        created_by: systemUserId,
                        specs: { hex: c.hex },
                        tenant_id: AUMS_TENANT_ID,
                    },
                    { onConflict: 'slug' }
                )
                .select()
                .single();

            if (colorDefError) {
                console.error(`Error creating unit ${c.name}:`, colorDefError);
                continue;
            }

            const skuCode = `YAM-FASC-${v.sku_suffix}-${c.slug.toUpperCase()}`;
            const skuSlug = await findUniqueSlug(`${familySlug}-${c.slug}`);
            console.log(`Creating SKU: ${skuCode} (${skuSlug})`);

            const { error: skuError } = await supabase.from('cat_items').upsert(
                {
                    name: `${FASCINO_125.name} ${v.name} - ${c.name}`,
                    slug: skuSlug,
                    type: 'SKU',
                    sku_code: skuCode,
                    parent_id: colorDef.id,
                    brand_id: YAMAHA_BRAND_ID,
                    template_id: templateId,
                    status: 'ACTIVE',
                    created_by: systemUserId,
                    tenant_id: AUMS_TENANT_ID,
                },
                { onConflict: 'slug' }
            );

            if (skuError) {
                console.error(`Error creating SKU for ${c.name}:`, skuError);
            }
        }
    }
    console.log('Ingestion Complete.');
}

main();
