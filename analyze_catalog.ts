import { adminClient } from './src/lib/supabase/admin';

async function analyzeCatalog() {
    console.log('--- CATALOG HIERARCHY ANALYSIS ---');

    // 1. Get Distinct Types
    const { data: types, error: typeError } = await adminClient
        .from('cat_items')
        .select('type')
        .then(res => ({
            data: [...new Set(res.data?.map(i => i.type))],
            error: res.error,
        }));

    if (typeError) console.error('Error fetching types:', typeError);
    else console.log('Current DISTINCT types in cat_items:', types);

    // 2. Get hierarchy sample
    const { data: sample, error: sampleError } = await adminClient
        .from('cat_items')
        .select('id, name, type, parent_id, brand_id')
        .limit(20);

    if (sampleError) console.error('Error fetching sample:', sampleError);
    else {
        console.log('Hierarchy Sample:');
        sample?.forEach(item => {
            console.log(`[${item.type}] ${item.name} (Parent: ${item.parent_id})`);
        });
    }

    // 3. Count levels
    const { count: familyCount } = await adminClient
        .from('cat_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'FAMILY');
    const { count: variantCount } = await adminClient
        .from('cat_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'VARIANT');
    const { count: skuCount } = await adminClient
        .from('cat_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'SKU');
    const { count: colorCount } = await adminClient
        .from('cat_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'COLOR_DEF');

    console.log(
        `Counts -> FAMILY: ${familyCount}, VARIANT: ${variantCount}, SKU: ${skuCount}, COLOR_DEF: ${colorCount}`
    );
}

analyzeCatalog();
