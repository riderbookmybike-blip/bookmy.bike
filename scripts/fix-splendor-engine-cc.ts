// Script to fix Splendor+ engine_cc in database
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSplendorEngineCc() {
    console.log('🔧 Fixing Splendor engine_cc in cat_models...\n');

    // Find Splendor models
    const { data: splendorModels, error: fetchError } = await supabase
        .from('cat_models')
        .select('id, name, engine_cc')
        .ilike('name', '%splendor%');

    if (fetchError) {
        console.error('Error fetching models:', fetchError);
        return;
    }

    console.log(`Found ${splendorModels?.length || 0} models with 'splendor' in name`);

    const modelsNeedingUpdate =
        splendorModels?.filter(model => model.engine_cc === null || model.engine_cc === 0) || [];

    console.log(`\n📝 Models needing engine_cc update: ${modelsNeedingUpdate.length}`);

    for (const model of modelsNeedingUpdate) {
        console.log(`  - ${model.name}: current engine_cc = ${model.engine_cc || 'MISSING'}`);
    }

    if (modelsNeedingUpdate.length === 0) {
        console.log('\n✅ All models already have engine_cc set!');
        return;
    }

    console.log('\n🔄 Updating models...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const model of modelsNeedingUpdate) {
        const { error: updateError } = await supabase.from('cat_models').update({ engine_cc: 97 }).eq('id', model.id);

        if (updateError) {
            console.log(`  ❌ Failed to update ${model.name}: ${updateError.message}`);
            errorCount++;
        } else {
            console.log(`  ✅ Updated ${model.name}: engine_cc = 97`);
            successCount++;
        }
    }

    console.log(`\n📊 Summary: ${successCount} updated, ${errorCount} failed`);
}

fixSplendorEngineCc().catch(console.error);
