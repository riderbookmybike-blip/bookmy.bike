import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Database } from '../src/types/supabase';

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
const supabase = createClient<Database>(supabaseUrl!, serviceKey!);
const AUMS_TENANT_ID = 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5';
const YAMAHA_BRAND_ID = 'e0d5b210-2d89-4a81-b369-bc7d3f11265f';
const VEHICLE_TEMPLATE_ID = '4e890adb-666a-4a5f-aca6-b1bda9279e2b';

const MODEL_NAME = 'RayZR Street Rally'; // Matches ingest script

const COLORS = [
    {
        name: 'Matte Grey Metallic',
        slug: 'mattegrey',
        image_url: '/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/mattegrey/static.webp',
        is_360: true,
        path_360: '/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/mattegrey/360',
    },
    {
        name: 'Ice Fluo Vermillion',
        slug: 'gray',
        image_url: '/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/gray/static.webp',
        is_360: false,
    },
    {
        name: 'Cyber Green',
        slug: 'green1',
        image_url: '/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/green1/static.webp',
        is_360: false,
    },
    {
        name: 'Matte Black',
        slug: 'black',
        image_url: '/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/black/static.webp',
        is_360: false,
    },
];

async function main() {
    console.log(`Linking assets for ${MODEL_NAME}...`);

    // 1. Fetch the PRODUCT item (Hardcoded ID from ingestion log)
    const familyId = '44b1597b-c7c4-45aa-9af1-7404c8f132b2';
    console.log(`Using Hardcoded Product ID: ${familyId}`);

    const { data: family, error: familyError } = await supabase
        .from('cat_items')
        .select('id, name')
        .eq('id', familyId)
        .single();

    if (familyError || !family) {
        console.error(`Product item ID '${familyId}' not found!`, familyError);
        return;
    }
    console.log(`Found Product ID: ${family.id}`);

    // 2. Ensure Variant "Standard" exists
    const variantSlug = `${MODEL_NAME.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-standard`;
    const { data: existingVariant } = await supabase.from('cat_items').select('id').eq('slug', variantSlug).single();

    let variantId = existingVariant?.id;
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const systemUserId = users?.users?.[0]?.id || '00000000-0000-0000-0000-000000000000';

    if (!existingVariant) {
        console.log(`Creating Variant: Standard`);
        const { data: newVariant, error: variantError } = await supabase
            .from('cat_items')
            .insert({
                name: 'Standard',
                slug: variantSlug,
                type: 'VARIANT',
                parent_id: family.id,
                brand_id: YAMAHA_BRAND_ID,
                template_id: VEHICLE_TEMPLATE_ID,
                status: 'ACTIVE',
                created_by: systemUserId,
                tenant_id: AUMS_TENANT_ID,
            })
            .select()
            .single();

        if (variantError) {
            console.error('Failed to create Variant:', variantError);
            return;
        }
        variantId = newVariant.id;
    }
    console.log(`Variant ID: ${variantId}`);

    // 3. Process each color
    for (const color of COLORS) {
        // Construct 360 URLs if applicable
        let urls360: string[] = [];
        if (color.is_360 && color.path_360) {
            for (let i = 1; i <= 40; i++) {
                urls360.push(`${color.path_360}/${i}.webp`);
            }
        }

        // a. Ensure UNIT exists
        const colorSlug = `${variantSlug}-${color.slug}`;
        const { data: existingColorDef } = await supabase.from('cat_items').select('id').eq('slug', colorSlug).single();

        let colorDefId = existingColorDef?.id;
        if (!existingColorDef) {
            console.log(`Creating UNIT: ${color.name}`);
            const { data: newColorDef, error: colorDefError } = await supabase
                .from('cat_items')
                .insert({
                    name: color.name,
                    slug: colorSlug,
                    type: 'UNIT',
                    parent_id: variantId,
                    brand_id: YAMAHA_BRAND_ID,
                    template_id: VEHICLE_TEMPLATE_ID,
                    status: 'ACTIVE',
                    created_by: systemUserId,
                    image_url: color.image_url,
                    specs: {
                        hex:
                            color.slug === 'mattegrey'
                                ? '#6B6B6B'
                                : color.slug === 'black'
                                  ? '#000000'
                                  : color.slug === 'green1'
                                    ? '#00FF00'
                                    : '#FF0000',
                    },
                    tenant_id: AUMS_TENANT_ID,
                })
                .select()
                .single();

            if (colorDefError) {
                console.error(`Failed to create UNIT ${colorSlug}:`, colorDefError);
                continue;
            }
            colorDefId = newColorDef.id;
        }

        // b. Ensure SKU exists under UNIT
        const familySlug = MODEL_NAME.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const skuSlug = `${familySlug}-${color.slug}`;

        const { data: existingSku } = await supabase.from('cat_items').select('id').eq('slug', skuSlug).single();

        let skuId = existingSku?.id;

        if (existingSku) {
            console.log(`Updating SKU: ${skuSlug}`);
            await supabase
                .from('cat_items')
                .update({
                    name: `${MODEL_NAME} - ${color.name}`,
                    parent_id: colorDefId,
                    image_url: color.image_url,
                    type: 'SKU',
                    tenant_id: AUMS_TENANT_ID,
                    brand_id: YAMAHA_BRAND_ID,
                    template_id: VEHICLE_TEMPLATE_ID,
                })
                .eq('id', existingSku.id);
        } else {
            console.log(`Creating SKU: ${skuSlug}`);
            const { data: newSku, error: createError } = await supabase
                .from('cat_items')
                .insert({
                    name: `${MODEL_NAME} - ${color.name}`,
                    slug: skuSlug,
                    type: 'SKU',
                    parent_id: colorDefId,
                    brand_id: YAMAHA_BRAND_ID,
                    template_id: VEHICLE_TEMPLATE_ID,
                    image_url: color.image_url,
                    status: 'ACTIVE',
                    created_by: systemUserId,
                    tenant_id: AUMS_TENANT_ID,
                })
                .select()
                .single();

            if (createError) {
                console.error(`Failed to create SKU ${skuSlug}:`, createError);
                continue;
            }
            skuId = newSku.id;
        }

        // 4. Link 360 Assets (cat_assets)
        if (urls360.length > 0 && skuId) {
            console.log(`Linking ${urls360.length} 360 asset records to SKU: ${skuId}`);
            await supabase.from('cat_assets').delete().eq('item_id', skuId).eq('type', '360');

            const assetRows = urls360.map((url, index) => ({
                item_id: skuId,
                type: '360',
                url: url,
                position: index + 1,
                is_primary: index === 0,
            }));

            const { error: assetError } = await supabase.from('cat_assets').insert(assetRows);
            if (assetError) console.error('Error linking assets:', assetError);

            // Also link to UNIT so Studio shows it?
            if (colorDefId) {
                await supabase.from('cat_assets').delete().eq('item_id', colorDefId).eq('type', '360');
                const assetRowsColor = urls360.map((url, index) => ({
                    item_id: colorDefId,
                    type: '360',
                    url: url,
                    position: index + 1,
                    is_primary: index === 0,
                }));
                await supabase.from('cat_assets').insert(assetRowsColor);
            }
        }
    }
    console.log('Done linking assets.');
}

main();
