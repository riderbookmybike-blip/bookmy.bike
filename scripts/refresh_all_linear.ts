import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { adminClient } from '../src/lib/supabase/admin';
import crypto from 'crypto';

async function refreshAll() {
    console.log('🚀 Full Refresh: cat_items -> cat_skus_linear (all brands)');

    // 1. Fetch all brands
    const { data: brands, error: brandError } = await adminClient.from('cat_brands').select('*');
    if (brandError) {
        console.error('Brand fetch error:', brandError);
        return;
    }

    // 2. Fetch all items
    const { data: allItems, error: itemsError } = await adminClient.from('cat_items').select('*');
    if (itemsError) {
        console.error('Items fetch error:', itemsError);
        return;
    }

    // 3. Fetch all active prices
    const { data: prices, error: pricesError } = await adminClient
        .from('cat_price_state')
        .select('*')
        .eq('is_active', true);
    if (pricesError) throw pricesError;

    // 4. Leaf nodes = SKU + UNIT
    const leafNodes = allItems.filter(i => i.type === 'SKU' || i.type === 'UNIT');

    // 5. Fetch all assets for leaf nodes
    const { data: assets, error: assetsError } = await adminClient
        .from('cat_assets')
        .select('*')
        .in(
            'item_id',
            leafNodes.map(l => l.id)
        );
    if (assetsError) throw assetsError;

    const itemsMap = new Map(allItems.map(i => [i.id, i]));
    const brandsMap = new Map(brands.map(b => [b.id, b]));
    const pricesMap = new Map<string, any[]>();
    prices.forEach(p => {
        if (!pricesMap.has(p.vehicle_color_id)) pricesMap.set(p.vehicle_color_id, []);
        pricesMap.get(p.vehicle_color_id)!.push(p);
    });
    const assetsMap = new Map<string, any[]>();
    assets.forEach(a => {
        if (!assetsMap.has(a.item_id)) assetsMap.set(a.item_id, []);
        assetsMap.get(a.item_id)!.push(a);
    });

    console.log(`📦 Processing ${leafNodes.length} leaf nodes across ${brands.length} brands`);

    const linearRows: any[] = [];

    for (const leaf of leafNodes) {
        let unit = leaf.type === 'UNIT' ? leaf : null;
        let variant: any = null;
        let product: any = null;

        let pId = leaf.parent_id;
        while (pId) {
            const parent = itemsMap.get(pId);
            if (!parent) break;
            if (parent.type === 'UNIT') unit = parent;
            else if (parent.type === 'VARIANT') variant = parent;
            else if (parent.type === 'PRODUCT') product = parent;
            pId = parent.parent_id;
        }

        if (!product) continue;

        const brand = brandsMap.get(leaf.brand_id);
        if (!brand) continue;

        const effectiveVariant = variant || product;
        const effectiveUnit = { ...(unit || leaf) };

        const unitPrices = pricesMap.get(leaf.id) || [];
        (effectiveUnit as any).prices = unitPrices;

        const allRegionalPrices = unitPrices
            .map((p: any) => parseFloat(p.ex_showroom_price))
            .filter((p: number) => p > 0);
        const basePrice = allRegionalPrices.length > 0 ? Math.min(...allRegionalPrices) : leaf.price_base || 0;

        const row = {
            sku_code:
                leaf.sku_code ||
                (leaf.type === 'SKU' ? `SKU-${leaf.id.substring(0, 8)}` : `UNIT-${leaf.id.substring(0, 8)}`),
            brand_id: brand.id,
            brand_name: brand.name,
            type_name: (product as any).category || 'VEHICLE',
            product_name: product.name,
            variant_name: effectiveVariant.name,
            unit_name: effectiveUnit.name,
            price_base: basePrice,
            status: leaf.status === 'DRAFT' ? 'INACTIVE' : (leaf.status as any),
            image_url: leaf.image_url || unit?.image_url || variant?.image_url || product.image_url,
            gallery_urls: (
                leaf.gallery_urls ||
                unit?.gallery_urls ||
                variant?.gallery_urls ||
                product.gallery_urls ||
                []
            ).slice(0, 20),
            assets_json: assetsMap.get(leaf.id) || [],
            brand_json: brand,
            product_json: product,
            variant_json: effectiveVariant,
            unit_json: effectiveUnit,
            specs: leaf.specs || unit?.specs || variant?.specs || product.specs || {},
            checksum_md5: '',
        };

        const canonicalState = JSON.stringify({
            brand: row.brand_json,
            product: row.product_json,
            variant: row.variant_json,
            unit: row.unit_json,
            price: row.price_base,
            assets: row.assets_json,
        });
        row.checksum_md5 = crypto.createHash('md5').update(canonicalState).digest('hex');

        linearRows.push(row);
    }

    console.log(`📝 Prepared ${linearRows.length} rows for upsert.`);

    // Upsert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < linearRows.length; i += BATCH_SIZE) {
        const batch = linearRows.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await adminClient
            .from('cat_skus_linear')
            .upsert(batch, { onConflict: 'sku_code' });

        if (insertError) {
            console.error(`❌ Batch ${i / BATCH_SIZE + 1} Error:`, insertError);
        }
    }

    console.log('✅ Full Refresh Complete!');
}

refreshAll();
