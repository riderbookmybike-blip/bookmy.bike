import { adminClient } from './src/lib/supabase/admin';

async function analyzeCatalog() {
    console.log('--- CATALOG V2 ANALYSIS ---');

    // 1. Count canonical V2 levels
    const { count: modelCount, error: modelCountError } = await adminClient
        .from('cat_models')
        .select('*', { count: 'exact', head: true });
    const { count: variantCount, error: variantCountError } = await adminClient
        .from('cat_variants_vehicle')
        .select('*', { count: 'exact', head: true });
    const { count: skuCount, error: skuCountError } = await adminClient
        .from('cat_skus')
        .select('*', { count: 'exact', head: true });

    if (modelCountError || variantCountError || skuCountError) {
        console.error('Error fetching V2 counts:', modelCountError || variantCountError || skuCountError);
        return;
    }

    console.log(`Counts -> MODELS: ${modelCount}, VEHICLE_VARIANTS: ${variantCount}, SKUS: ${skuCount}`);

    // 2. Get SKU sample
    const { data: sample, error: sampleError } = await adminClient
        .from('cat_skus')
        .select('id, sku_code, model_id, variant_id')
        .limit(20);

    if (sampleError) console.error('Error fetching sample:', sampleError);
    else {
        console.log('SKU Sample:');
        sample?.forEach(item => {
            console.log(`[SKU] ${item.sku_code} (Model: ${item.model_id}, Variant: ${item.variant_id})`);
        });
    }
}

analyzeCatalog();
