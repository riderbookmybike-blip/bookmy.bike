import { adminClient } from '../supabase/admin';

export async function getSitemapData() {
    const supabase = adminClient;

    // 1. Fetch Brands
    const { data: brands } = await supabase.from('cat_brands').select('name');

    // 2. Fetch Active Families (Models)
    const { data: families } = await supabase
        .from('cat_items')
        .select(
            `
            name,
            slug,
            brand:cat_brands(name),
            variants:cat_items!parent_id(
                name,
                slug
            )
        `
        )
        .eq('type', 'FAMILY')
        .eq('status', 'ACTIVE');

    return {
        brands: brands || [],
        families: families || [],
    };
}
