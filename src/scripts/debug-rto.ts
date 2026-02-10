import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Searching for 'Jupiter' family...");
    const { data: families } = await supabase
        .from('cat_items')
        .select('id, name, slug, type')
        .ilike('slug', '%jupiter%')
        .eq('type', 'PRODUCT');

    console.log('Families found:', families);

    const familyId = families?.[0]?.id;
    if (!familyId) return;

    console.log('Searching for children of family:', familyId);
    const { data: children } = await supabase
        .from('cat_items')
        .select('id, name, slug, type, specs, price_base')
        .eq('parent_id', familyId);

    // console.log("Children of Jupiter:", children?.map(c => ({ name: c.name, slug: c.slug, type: c.type })));

    // Try to find Drum variant
    const variant = children?.find(c => c.slug === 'tvs-jupiter-drum');

    if (!variant) {
        console.log("Variant 'tvs-jupiter-drum' not found");
        return;
    }
    console.log('\nTarget Variant:', variant.name, variant.id, 'Slug:', variant.slug);

    // 2. Find SKU
    const { data: skus, error: sError } = await supabase
        .from('cat_items')
        .select('id, name, slug, specs, price_base')
        .eq('parent_id', variant.id);

    if (sError) {
        console.error(sError);
        return;
    }

    // Exact match for the user's requested slug part
    const targetSku = skus?.find(s => s.slug === 'tvs-jupiter-drum-titanium-grey-matte');

    if (!targetSku) {
        console.log(
            "Specific SKU 'tvs-jupiter-drum-titanium-grey-matte' not found. Available SKUs:",
            skus?.map(s => s.slug)
        );
        return;
    }

    console.log('Target SKU:', targetSku.slug, targetSku.id);
    const engineCC = targetSku.specs?.engine_cc || variant.specs?.engine_cc || 109.7;
    console.log('Engine CC:', engineCC);

    // 3. Find Price
    const { data: price, error: pError } = await supabase
        .from('cat_price_state')
        .select('*')
        .eq('vehicle_color_id', targetSku.id)
        .eq('state_code', 'MH')
        .single();

    console.log('\n--- PRICE HIERARCHY ---');
    console.log(`SKU price_base: ${targetSku.price_base}`);
    console.log(`Variant price_base: ${variant.price_base}`);
    // We already fetched family items at start
    const family = families?.find(f => f.id === familyId);
    // Fetch family price_base if not in initial select
    const { data: familyData } = await supabase.from('cat_items').select('price_base').eq('id', familyId).single();
    console.log(`Family price_base: ${familyData?.price_base}`);
    console.log(`Current State Price (cat_price_state): ${price?.ex_showroom_price}`);
    console.log('-----------------------\n');

    if (pError) console.log('Price fetch error (might not exist):', pError.message);
    else console.log('Existing Price:', JSON.stringify(price, null, 2));

    // 4. Find Rules
    const { data: rules, error: rError } = await supabase
        .from('cat_reg_rules')
        .select('*')
        .eq('state_code', 'MH')
        .eq('status', 'ACTIVE');

    if (rError) console.error(rError);
    console.log('Rules:', JSON.stringify(rules, null, 2));
}

run();
