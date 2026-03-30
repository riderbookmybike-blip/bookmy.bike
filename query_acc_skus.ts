import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // 1. Get models that are ACCESSORY or SERVICE
    const { data: models, error: e1 } = await supabase
        .from('cat_models')
        .select('id, name, product_type')
        .in('product_type', ['ACCESSORY', 'SERVICE', 'SKU_ACCESSORY']);

    if (e1) {
        console.error('Error fetching models:', e1);
        return;
    }

    const modelIds = models.map((m: any) => m.id);

    // 2. Get SKUs for these models
    const { data: skus, error: e2 } = await supabase
        .from('cat_skus')
        .select('id, name, model_id, sku_code, price_base')
        .in('model_id', modelIds);

    if (e2) {
        console.error('Error fetching skus:', e2);
        return;
    }

    // 3. Get basic MH pricing if present
    const skuIds = skus.map((s: any) => s.id);
    const { data: prices, error: e3 } = await supabase
        .from('cat_price_state_mh')
        .select('sku_id, ex_showroom')
        .in('sku_id', skuIds);

    const priceMap = new Map();
    if (prices) {
        prices.forEach((p: any) => priceMap.set(p.sku_id, p.ex_showroom));
    }

    // Output all SKUs
    console.log('=== ACCESSORY & SERVICE SKUS ===');
    let index = 1;
    for (const model of models) {
        const modelSkus = skus.filter((s: any) => s.model_id === model.id);
        for (const sku of modelSkus) {
            const dbPrice = sku.price;
            const mhPrice = priceMap.get(sku.id);
            const displayPrice = mhPrice !== undefined ? mhPrice : dbPrice || 'N/A';
            console.log(
                `${index++}. [${model.product_type} - ${model.name}] SKU Key: ${sku.sku} | Name: ${sku.name} | MRP: ${displayPrice}`
            );
        }
    }
}
main();
