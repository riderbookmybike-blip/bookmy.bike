import { adminClient } from '../supabase/admin';

export async function getSitemapData() {
    const supabase = adminClient;

    // 1. Fetch Brands
    const { data: brands } = await supabase.from('cat_brands').select('name');

    // 2. Fetch Active Families (Models)
    const useLinear = process.env.NEXT_PUBLIC_USE_LINEAR_CATALOG === 'true';
    let families: any[] = [];

    if (useLinear) {
        const { data } = await supabase
            .from('cat_skus_linear')
            .select('product_name, variant_name, product_json, variant_json')
            .eq('status', 'ACTIVE');

        // Group by product to match expected structure
        const groups = new Map<string, any>();
        (data || []).forEach(row => {
            const p = row.product_json as any;
            if (!groups.has(p.id)) {
                groups.set(p.id, { name: row.product_name, slug: p.slug, variants: [] });
            }
            const group = groups.get(p.id);
            if (!group.variants.some((v: any) => v.slug === (row.variant_json as any).slug)) {
                group.variants.push({ name: row.variant_name, slug: (row.variant_json as any).slug });
            }
        });
        families = Array.from(groups.values());
    } else {
        const { data } = await supabase
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
            .eq('type', 'PRODUCT')
            .eq('status', 'ACTIVE');
        families = data || [];
    }

    return {
        brands: brands || [],
        families,
    };
}
