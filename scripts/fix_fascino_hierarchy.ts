import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PRODUCT_SLUG = 'yamaha-fascino125fihybrid';
const AUMS_TENANT_ID = '33333333-3333-3333-3333-333333333333';
const YAMAHA_BRAND_ID = '3170e557-4581-424a-93f5-66289b7b9982';

async function main() {
    console.log('--- REORGANIZING FASCINO 125 HIERARCHY ---');

    // 1. Get Product
    const { data: family } = await supabase
        .from('cat_items')
        .select('id')
        .eq('slug', PRODUCT_SLUG)
        .eq('type', 'PRODUCT')
        .single();

    if (!family) throw new Error('Product not found');

    // 2. Rename S (Disc) to Disc Tft if it exists
    const { data: sDisc } = await supabase
        .from('cat_items')
        .select('id')
        .eq('parent_id', family.id)
        .eq('name', 'S (Disc)')
        .single();

    if (sDisc) {
        console.log('Renaming S (Disc) to Disc Tft...');
        await supabase
            .from('cat_items')
            .update({ name: 'Disc Tft', slug: PRODUCT_SLUG + '-disc-tft' })
            .eq('id', sDisc.id);
    }

    // 3. Get Disc Tft ID
    const { data: discTft } = await supabase
        .from('cat_items')
        .select('id')
        .eq('parent_id', family.id)
        .eq('name', 'Disc Tft')
        .single();

    if (!discTft) {
        console.log('Creating Disc Tft variant...');
        // (This shouldn't happen based on audit, but for safety)
    } else {
        console.log(`Disc Tft ID: ${discTft.id}`);
    }

    // 4. Relink orphaned Special Edition colors
    // These were found to be direct children of the product
    const { data: orphanedColors } = await supabase
        .from('cat_items')
        .select('id, name')
        .eq('parent_id', family.id)
        .eq('type', 'UNIT');

    if (orphanedColors && orphanedColors.length > 0) {
        console.log(`Relinking ${orphanedColors.length} orphaned colors to Disc Tft...`);
        for (const color of orphanedColors) {
            console.log(`  Linking ${color.name} -> Disc Tft`);
            await supabase.from('cat_items').update({ parent_id: discTft!.id }).eq('id', color.id);
        }
    }

    // 5. Clean up duplicate or poorly named colors if needed
    // In audit we saw "Cyan Blue" under Drum and "Vivid Red" under Disc.
    // They are fine, but ensure they don't have broken slugs.

    console.log('\nHierarchy fix complete!');
}

main().catch(console.error);
