// Script to fix Splendor+ engine_cc in database
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSplendorEngineCc() {
    console.log('🔧 Fixing Splendor+ engine_cc...\n');

    // Find all Splendor+ items
    const { data: splendorItems, error: fetchError } = await supabase
        .from('cat_items')
        .select('id, name, type, specs, parent_id')
        .ilike('name', '%splendor%');

    if (fetchError) {
        console.error('Error fetching items:', fetchError);
        return;
    }

    console.log(`Found ${splendorItems?.length || 0} items with 'splendor' in name`);

    // Get family IDs
    const familyIds = splendorItems?.filter(i => i.type === 'PRODUCT').map(i => i.id) || [];
    console.log(`Family IDs:`, familyIds);

    // Get variant IDs under these families
    const { data: variants } = await supabase
        .from('cat_items')
        .select('id, name, type, specs, parent_id')
        .in('parent_id', familyIds)
        .eq('type', 'VARIANT');

    console.log(`Found ${variants?.length || 0} variants under Splendor+ families`);
    const variantIds = variants?.map(v => v.id) || [];

    // Get SKUs under these variants
    const { data: skus } = await supabase
        .from('cat_items')
        .select('id, name, type, specs, parent_id')
        .in('parent_id', variantIds)
        .eq('type', 'SKU');

    console.log(`Found ${skus?.length || 0} SKUs under Splendor+ variants`);

    // Combine all items to update
    const allItems = [...(splendorItems || []), ...(variants || []), ...(skus || [])];
    const itemsNeedingUpdate = allItems.filter(item => {
        const engineCc = item.specs?.engine_cc;
        return !engineCc || engineCc === '' || engineCc === '0' || engineCc === 0;
    });

    console.log(`\n📝 Items needing engine_cc update: ${itemsNeedingUpdate.length}`);

    for (const item of itemsNeedingUpdate) {
        console.log(`  - [${item.type}] ${item.name}: current engine_cc = ${item.specs?.engine_cc || 'MISSING'}`);
    }

    if (itemsNeedingUpdate.length === 0) {
        console.log('\n✅ All items already have engine_cc set!');
        return;
    }

    // Update each item
    console.log('\n🔄 Updating items...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const item of itemsNeedingUpdate) {
        const newSpecs = {
            ...item.specs,
            engine_cc: 97, // Splendor+ is 97.2cc
        };

        const { error: updateError } = await supabase.from('cat_items').update({ specs: newSpecs }).eq('id', item.id);

        if (updateError) {
            console.log(`  ❌ Failed to update [${item.type}] ${item.name}: ${updateError.message}`);
            errorCount++;
        } else {
            console.log(`  ✅ Updated [${item.type}] ${item.name}: engine_cc = 97`);
            successCount++;
        }
    }

    console.log(`\n📊 Summary: ${successCount} updated, ${errorCount} failed`);
}

fixSplendorEngineCc().catch(console.error);
