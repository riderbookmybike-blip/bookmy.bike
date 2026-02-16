import { adminClient } from '../src/lib/supabase/admin';
import crypto from 'crypto';

async function backfill() {
    console.log('🚀 Starting Backfill: cat_items -> cat_skus_linear');

    // 1. Fetch all SKUs
    const { data: skus, error: skuError } = await adminClient.from('cat_items').select('*').eq('type', 'SKU');

    if (skuError) {
        console.error('Error fetching SKUs:', skuError);
        return;
    }

    console.log(`📦 Found ${skus.length} SKUs to process.`);

    // 2. Fetch All Items for lookup (to avoid N+1)
    const { data: allItems, error: itemsError } = await adminClient.from('cat_items').select('*');

    if (itemsError) {
        console.error('Error fetching all items:', itemsError);
        return;
    }

    // 3. Fetch Brands for lookup
    const { data: brands, error: brandError } = await adminClient.from('cat_brands').select('*');

    if (brandError) {
        console.error('Error fetching brands:', brandError);
        return;
    }

    // 3. Fetch all active prices
    const { data: prices, error: pricesError } = await (adminClient as any)
        .from('cat_price_state')
        .select('*')
        .eq('is_active', true);
    if (pricesError) throw pricesError;

    // 4. Fetch all assets
    const { data: assets, error: assetsError } = await adminClient.from('cat_assets').select('*');
    if (assetsError) throw assetsError;

    const itemsMap = new Map(allItems.map(i => [i.id, i]));
    const brandsMap = new Map(brands.map(b => [b.id, b]));
    const pricesMap = new Map();
    (prices || []).forEach((p: any) => {
        if (!pricesMap.has(p.vehicle_color_id)) pricesMap.set(p.vehicle_color_id, []);
        pricesMap.get(p.vehicle_color_id).push(p);
    });

    const assetsMap = new Map();
    assets.forEach(a => {
        if (!assetsMap.has(a.item_id)) assetsMap.set(a.item_id, []);
        assetsMap.get(a.item_id).push(a);
    });

    const linearRows = [];

    for (const sku of skus) {
        let brand = brandsMap.get(sku.brand_id);
        let current = sku;
        let unit = null;
        let variant = null;
        let product = null;

        // Traverse upwards to find parents
        let pId = current.parent_id;
        while (pId) {
            const parent = itemsMap.get(pId);
            if (!parent) break;

            if (parent.type === 'UNIT') unit = parent;
            else if (parent.type === 'VARIANT') variant = parent;
            else if (parent.type === 'PRODUCT') product = parent;

            pId = parent.parent_id;
        }

        if (!brand || !product) {
            console.warn(
                `⚠️ Incomplete hierarchy for SKU ${sku.sku_code || sku.id} (Name: ${sku.name}). Brand: ${!!brand}, Product: ${!!product}. Skipping.`
            );
            continue;
        }

        // Fallbacks for missing levels
        const effectiveVariant = variant || product; // If no variant, use product info? Or just name it?
        const effectiveUnit = { ...(unit || effectiveVariant) };

        // Attach prices to the unit JSON for parity
        const unitPrices = pricesMap.get(sku.id) || [];
        (effectiveUnit as any).prices = unitPrices;

        // Calculate the "Canonical Price" (minimum of all regional prices or base)
        const allRegionalPrices = unitPrices
            .map((p: any) => parseFloat(p.ex_showroom_price))
            .filter((p: number) => p > 0);
        const basePrice = allRegionalPrices.length > 0 ? Math.min(...allRegionalPrices) : sku.price_base || 0;

        const row = {
            sku_code: sku.sku_code || `SKU-${sku.id.substring(0, 8)}`,
            brand_id: sku.brand_id,
            brand_name: brand.name,
            type_name: (product as any).category || 'VEHICLE',
            product_name: product.name,
            variant_name: effectiveVariant.name,
            unit_name: effectiveUnit.name,
            price_base: basePrice,
            status: sku.status === 'DRAFT' ? 'INACTIVE' : (sku.status as any),
            image_url: sku.image_url || (unit as any)?.image_url || (variant as any)?.image_url || product.image_url,
            gallery_urls: (
                sku.gallery_urls ||
                (unit as any)?.gallery_urls ||
                (variant as any)?.gallery_urls ||
                product.gallery_urls ||
                []
            ).slice(0, 20),
            assets_json: assetsMap.get(sku.id) || [],
            brand_json: brand,
            product_json: product,
            variant_json: effectiveVariant,
            unit_json: effectiveUnit,
            checksum_md5: '',
        };

        // Calculate Checksum for drift detection
        const canonicalState = JSON.stringify({
            brand: row.brand_json,
            product: row.product_json,
            variant: row.variant_json,
            unit: row.unit_json,
            price: row.price_base,
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
            console.log('✅ Backfill Completed Successfully!');
        }
    }
}

backfill();
