import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateParity, logCatalogDrift } from '../src/lib/utils/driftLogger';
// Note: We'll need to replicate the mapping logic here since we can't easily import from src/actions inside a plain script without setup
// Or we just test the raw counts and some fields.

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyParity() {
    console.log('🚀 Starting Parity Verification...');

    // 1. Legacy Fetch (Replicating action logic)
    const { data: legacyRaw, error: legacyError } = await supabase
        .from('cat_items')
        .select(
            `
            id, type, name, slug, specs, price_base, brand_id, category,
            brand:cat_brands(name),
            children:cat_items!parent_id(
                id, type, name, slug, specs, price_base, position,
                skus:cat_items!parent_id(
                    id, type, price_base, is_primary, image_url, specs,
                    prices:cat_price_state!vehicle_color_id(ex_showroom_price, state_code, district, is_active)
                )
            )
        `
        )
        .eq('type', 'PRODUCT')
        .eq('status', 'ACTIVE');

    if (legacyError) throw legacyError;

    // 2. Linear Fetch
    const { data: skus, error: linearError } = await supabase
        .from('cat_skus_linear')
        .select('*')
        .eq('status', 'ACTIVE');

    if (linearError) throw linearError;

    console.log(`📊 Data Stats:
   - Legacy Products: ${legacyRaw.length}
   - Linear SKUs: ${skus.length}`);

    // Reconstruct ProductVariants from Legacy (accurately matching product.ts)
    const legacyProducts = legacyRaw.flatMap((family: any) => {
        const familyChildren = family.children || [];
        const variants = familyChildren.filter((c: any) => c.type === 'VARIANT');
        const displayNodes = variants.length > 0 ? variants : familyChildren.length > 0 ? familyChildren : [family];

        return displayNodes.map((node: any) => {
            const isFamilyNode = node.id === family.id;
            const nodeSkus = node.skus || [];

            // Replicate price logic from product.ts
            const prices = nodeSkus
                .flatMap((s: any) => s.prices?.map((p: any) => p.ex_showroom_price) || [s.price_base])
                .filter((p: any) => parseFloat(p) > 0);
            const basePrice =
                prices.length > 0
                    ? Math.min(...prices.map((p: any) => parseFloat(p)))
                    : node.price_base || family.price_base || 0;

            if (node.id === '8a8ada7e-13eb-4a85-af61-792fc2707d3e') {
                console.log(
                    `DEBUG [Legacy Helmet]: nodeSkus.length=${nodeSkus.length}, prices=${JSON.stringify(prices)}, basePrice=${basePrice}`
                );
            }

            const makeName = family.brand?.name || 'Unknown';
            const modelName = family.name;
            const variantName = isFamilyNode ? family.name : node.name;

            return {
                id: node.id,
                displayName: `${makeName} ${modelName} ${variantName !== modelName ? variantName : ''}`.trim(),
                sku: `SKU-${node.slug || family.slug || 'unknown'}`.toUpperCase(),
                price: {
                    exShowroom: basePrice,
                },
            };
        });
    });

    // Reconstruct ProductVariants from Linear (simplified)
    const groups = new Map<string, any[]>();
    for (const sku of skus) {
        const key = `${sku.brand_id}-${sku.product_name}-${sku.variant_name}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(sku);
    }
    const linearProducts = Array.from(groups.values()).map(groupSkus => {
        const first = groupSkus[0];
        const prices = groupSkus.map(s => s.price_base).filter(p => p > 0);
        return {
            id: first.variant_json.id,
            displayName:
                `${first.brand_name} ${first.product_name} ${first.variant_name !== first.product_name ? first.variant_name : ''}`.trim(),
            sku: `SKU-${first.variant_json.slug || first.product_json.slug || 'unknown'}`.toUpperCase(),
            price: {
                exShowroom: prices.length > 0 ? Math.min(...prices) : first.price_base,
            },
        };
    });

    const report = calculateParity(legacyProducts, linearProducts);
    logCatalogDrift(report);

    if (report.parityPercentage === 100) {
        console.log('✅ PASS: Catalog Parity Verified.');
    } else {
        console.error('❌ FAIL: Catalog Drift Detected.');
        process.exit(1);
    }
}

verifyParity().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
