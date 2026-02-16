import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const VARIANTS = {
    DISC: '9d2116a9-6ab9-41db-afc0-b1a98b9cf08d',
    DRUM: 'b091d78d-e130-48f0-a066-b6b9cf2be318',
    DISC_TFT: 'ee836ec1-c2c3-4396-94c5-03fb6d6046d8',
};

const COLOR_MAP: Record<string, string> = {
    'Matte Black Special': '#000000',
    'Cyan Blue': '#00FFFF',
    'Vivid Red': '#FF0000',
    Silver: '#C0C0C0',
    'Cool Blue Metallic': '#1a2b4b',
    'Dark Matte Blue': '#000080',
    'Metallic White': '#FFFFFF',
    'Matte Copper': '#B87333',
    'Metallic Black': '#000000',
    'Matte Grey Special': '#808080',
    'Metallic Light Green': '#90EE90',
};

async function fixVariant(variantId: string, variantName: string) {
    console.log(`\n--- Fixing Variant: ${variantName} (${variantId}) ---`);

    const { data: skus } = await supabase.from('cat_items').select('*').eq('parent_id', variantId).eq('type', 'SKU');

    if (!skus || skus.length === 0) {
        console.log(`No direct SKUs found for ${variantName}.`);
        return;
    }

    for (const sku of skus) {
        const parts = sku.name.split(' - ');
        const colorName = parts.length > 1 ? parts[parts.length - 1] : sku.name;
        const hex = COLOR_MAP[colorName] || '#FFFFFF';

        console.log(`Processing SKU: ${sku.name} | Color: ${colorName} | Hex: ${hex}`);

        let { data: unit } = await supabase
            .from('cat_items')
            .select('id')
            .eq('parent_id', variantId)
            .eq('type', 'UNIT')
            .eq('name', colorName)
            .maybeSingle();

        if (!unit) {
            console.log(`  Creating UNIT: ${colorName}`);
            const { data: newUnit, error: unitError } = await supabase
                .from('cat_items')
                .insert({
                    name: colorName,
                    type: 'UNIT',
                    category: 'VEHICLE',
                    parent_id: variantId,
                    status: 'ACTIVE',
                    price_base: sku.price_base,
                    aums_tenant_id: sku.aums_tenant_id,
                    brand_id: sku.brand_id,
                    specs: { hex_primary: hex },
                })
                .select()
                .single();

            if (unitError) {
                console.error(`  Error creating unit: ${unitError.message}`);
                continue;
            }
            unit = newUnit;
        }

        console.log(`  Relinking SKU ${sku.id} -> Unit ${unit!.id}`);
        await supabase.from('cat_items').update({ parent_id: unit!.id }).eq('id', sku.id);
    }
}

async function main() {
    await fixVariant(VARIANTS.DISC, 'Disc');
    await fixVariant(VARIANTS.DRUM, 'Drum');
    await fixVariant(VARIANTS.DISC_TFT, 'Disc Tft');

    console.log('\nHierarchy fix complete!');
}

main().catch(console.error);
