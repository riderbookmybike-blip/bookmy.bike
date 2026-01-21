
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

async function normalizeCatalog() {
    console.log('Starting catalog normalization...');

    // 1. Fetch all catalog items
    const { data: items, error } = await supabase
        .from('catalog_items')
        .select('id, name, specs')
        .eq('status', 'ACTIVE'); // Safer to only touch active, or all? Let's do all.

    if (error) {
        console.error('Error fetching items:', error);
        return;
    }

    console.log(`Found ${items?.length || 0} items. Processing...`);

    let updatedCount = 0;

    for (const item of items || []) {
        const newName = toTitleCase(item.name);

        let needsUpdate = false;
        let updates: any = {};

        // Check Name
        if (newName !== item.name) {
            updates.name = newName;
            needsUpdate = true;
        }

        // Check Specs (Brand, Make, etc)
        if (item.specs) {
            const newSpecs = { ...item.specs };
            let specsChanged = false;

            if (newSpecs.brand && newSpecs.brand !== toTitleCase(newSpecs.brand)) {
                newSpecs.brand = toTitleCase(newSpecs.brand);
                specsChanged = true;
            }
            if (newSpecs.make && newSpecs.make !== toTitleCase(newSpecs.make)) {
                newSpecs.make = toTitleCase(newSpecs.make);
                specsChanged = true;
            }
            if (newSpecs.body_type && newSpecs.body_type !== newSpecs.body_type.toUpperCase()) {
                // Keep body type UPPERCASE usually? Or Title? 
                // DB usually uses UPPERCASE ENUMS. Let's leave body_type alone if it looks like an enum.
                // But for display names, let's stick to title case.
                // Assuming 'brand' and 'make' are the main user visible text fields in specs.
            }

            if (specsChanged) {
                updates.specs = newSpecs;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('catalog_items')
                .update(updates)
                .eq('id', item.id);

            if (updateError) {
                console.error(`Failed to update item ${item.id}:`, updateError);
            } else {
                updatedCount++;
                // process.stdout.write('.');
            }
        }
    }

    console.log(`\nNormalization complete. Updated ${updatedCount} items.`);
}

normalizeCatalog();
