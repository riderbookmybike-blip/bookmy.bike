import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { adminClient } from '../src/lib/supabase/admin';
import crypto from 'crypto';

async function refreshYamaha() {
    const brandId = 'e0d5b210-2d89-4a81-b369-bc7d3f11265f'; // Yamaha
    console.log('🚀 Refreshing Yamaha Catalog: cat_items -> cat_skus_linear');

    // 1. Fetch all SKUs for Yamaha
    const { data: skus, error: skuError } = await adminClient
        .from('cat_items')
        .select('*')
        .eq('brand_id', brandId)
        .eq('type', 'SKU');

    if (skuError) {
        console.error('Error fetching SKUs:', skuError);
        return;
    }

    // 2. Fetch all UNITs for Yamaha (some units might be the leaf if a variant has no SKU) - actually type=UNIT and type=SKU should both be in cat_skus_linear
    const { data: units, error: unitError } = await adminClient
        .from('cat_items')
        .select('*')
        .eq('brand_id', brandId)
        .eq('type', 'UNIT');

    if (unitError) {
        console.error('Error fetching units:', unitError);
        return;
    }

    const leafNodes = [...skus, ...units];
    console.log(`📦 Found ${leafNodes.length} leaf nodes to process.`);

    // 3. Fetch All Items for lookup
    const { data: allItems, error: itemsError } = await adminClient
        .from('cat_items')
        .select('*')
        .eq('brand_id', brandId);

    if (itemsError) {
        console.error('Error fetching all items:', itemsError);
        return;
    }

    // 4. Fetch Brand
    const { data: brand, error: brandError } = await adminClient
        .from('cat_brands')
        .select('*')
        .eq('id', brandId)
        .single();

    if (brandError) {
        console.error('Error fetching brand:', brandError);
        return;
    }

    // 5. Fetch all active prices for these units
    const { data: prices, error: pricesError } = await adminClient
        .from('cat_price_state')
        .select('*')
        .eq('is_active', true);
    if (pricesError) throw pricesError;

    // 6. Fetch all assets for these units
    const { data: assets, error: assetsError } = await adminClient
        .from('cat_assets')
        .select('*')
        .in(
            'item_id',
            leafNodes.map(l => l.id)
        );
    if (assetsError) throw assetsError;

    const itemsMap = new Map(allItems.map(i => [i.id, i]));
    const pricesMap = new Map();
    prices.forEach(p => {
        if (!pricesMap.has(p.vehicle_color_id)) pricesMap.set(p.vehicle_color_id, []);
        pricesMap.get(p.vehicle_color_id).push(p);
    });

    const assetsMap = new Map();
    assets.forEach(a => {
        if (!assetsMap.has(a.item_id)) assetsMap.set(a.item_id, []);
        assetsMap.get(a.item_id).push(a);
    });

    const linearRows = [];

    for (const leaf of leafNodes) {
        let current = leaf;
        let unit = leaf.type === 'UNIT' ? leaf : null;
        let variant = null;
        let product = null;

        // Traverse upwards to find parents
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

        const effectiveVariant = variant || product;
        const effectiveUnit = { ...(unit || leaf) };

        // Attach prices
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
            brand_id: brandId,
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

    console.log(`📝 Prepared ${linearRows.length} rows for insertion.`);

    if (linearRows.length > 0) {
        const { error: insertError } = await adminClient
            .from('cat_skus_linear')
            .upsert(linearRows, { onConflict: 'sku_code' });

        if (insertError) {
            console.error('❌ Insert Error:', insertError);
        } else {
            console.log('✅ Yamaha Refresh Completed!');
        }
    }
}

refreshYamaha();
