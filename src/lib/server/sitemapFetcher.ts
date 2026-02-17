import { adminClient } from '../supabase/admin';

export async function getSitemapData() {
    const supabase = adminClient;

    // 1. Fetch Brands
    const { data: brands } = await supabase.from('cat_brands').select('name');

    // 2. Fetch active models from canonical V2 catalog table
    const { data } = await (supabase as any)
        .from('cat_models')
        .select(
            `
            name,
            slug,
            brand:cat_brands!brand_id(name),
            variants:cat_variants_vehicle(
                name,
                slug
            )
        `
        )
        .eq('status', 'ACTIVE');
    const families = data || [];

    return {
        brands: brands || [],
        families,
    };
}
