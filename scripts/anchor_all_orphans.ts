import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function anchorOrphans() {
    console.log('--- ANCHORING ORPHANED PRODUCTS ---');

    // 1. Get all orphans (PRODUCT type)
    const { data: orphans, error: fetchError } = await supabase
        .from('cat_items')
        .select(
            `
            id, name, type, category, brand_id,
            cat_brands(name)
        `
        )
        .eq('type', 'PRODUCT'); // We focus on PRODUCTS first as they are the primary orphans

    if (fetchError || !orphans) {
        console.error('Error fetching orphans:', fetchError);
        return;
    }

    for (const prod of orphans) {
        // Skip if already linked in hierarchy
        const { count } = await supabase
            .from('cat_item_hierarchy')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', prod.id);

        if (count && count > 0) {
            console.log(`Skipping ${prod.name} (already linked)`);
            continue;
        }

        const brandName = (prod.cat_brands as any)?.name?.toUpperCase() || 'UNKNOWN';
        const categoryName = prod.category || 'GENERAL';
        const brandSlug = `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-brand`;
        const typeSlug = `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-type`;

        console.log(`\nProcessing Product: ${prod.name} | Brand: ${brandName} | Category: ${categoryName}`);

        // 2. Ensure BRAND item exists
        let { data: brandItem } = await supabase
            .from('cat_items')
            .select('id')
            .eq('type', 'BRAND')
            .eq('slug', brandSlug)
            .maybeSingle();

        if (!brandItem) {
            console.log(`  Creating BRAND: ${brandName}`);
            const { data: newBrand, error: bError } = await supabase
                .from('cat_items')
                .insert({
                    name: brandName,
                    type: 'BRAND',
                    brand_id: prod.brand_id,
                    category: categoryName,
                    status: 'ACTIVE',
                    slug: brandSlug,
                })
                .select()
                .single();

            if (bError) {
                console.error(`  Error creating Brand item: ${bError.message}`);
                continue;
            }
            brandItem = newBrand;
        }
        if (!brandItem) continue;

        // 3. Ensure TYPE item exists under BRAND
        let { data: typeItem } = await supabase
            .from('cat_items')
            .select('id')
            .eq('type', 'TYPE')
            .eq('slug', typeSlug)
            .maybeSingle();

        if (!typeItem) {
            console.log(`  Creating TYPE: ${categoryName} under ${brandName}`);
            const { data: newType, error: tError } = await supabase
                .from('cat_items')
                .insert({
                    name: categoryName,
                    type: 'TYPE',
                    parent_id: brandItem.id,
                    brand_id: prod.brand_id,
                    category: categoryName,
                    status: 'ACTIVE',
                    slug: typeSlug,
                })
                .select()
                .single();

            if (tError) {
                console.error(`  Error creating Type item: ${tError.message}`);
                continue;
            }
            typeItem = newType;

            // Link Brand -> Type in hierarchy
            if (!typeItem) continue;
            await supabase.from('cat_item_hierarchy').upsert({
                parent_id: brandItem.id,
                child_id: typeItem.id,
            });
        }
        if (!typeItem) continue;

        // 4. Link TYPE -> PRODUCT in hierarchy
        console.log(`  Linking Product ${prod.id} -> Type ${typeItem.id}`);
        await supabase.from('cat_items').update({ parent_id: typeItem.id }).eq('id', prod.id);

        await supabase.from('cat_item_hierarchy').upsert({
            parent_id: typeItem.id,
            child_id: prod.id,
        });
    }

    console.log('\nOrphan anchoring complete!');
}

anchorOrphans().catch(console.error);
