/**
 * CLEANUP Script: Remove Key Protect, Tyre Protect, and Pillion Cover from insurance rules.
 *
 * Usage: npx tsx scripts/cleanup-insurance-addons.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

const REMOVE_IDS = ['addon_key_protect', 'addon_tyre_protect', 'addon_pillion_cover'];

async function main() {
    console.log('Fetching all insurance rules...');

    const { data: rules, error } = await admin.from('cat_ins_rules').select('id, rule_name, addons');

    if (error || !rules) {
        console.error('Fetch error:', error?.message || 'No rules found');
        process.exit(1);
    }

    console.log(`Found ${rules.length} rules.`);

    for (const rule of rules) {
        const existingAddons = (rule.addons || []) as any[];
        const filteredAddons = existingAddons.filter(a => !REMOVE_IDS.includes(a.id));

        if (existingAddons.length === filteredAddons.length) {
            console.log(`  ✓ Rule "${rule.rule_name}" is already clean.`);
            continue;
        }

        console.log(
            `  - Cleaning Rule "${rule.rule_name}": Removing ${existingAddons.length - filteredAddons.length} addons...`
        );

        const { error: updateError } = await admin
            .from('cat_ins_rules')
            .update({
                addons: filteredAddons,
                updated_at: new Date().toISOString(),
            })
            .eq('id', rule.id);

        if (updateError) {
            console.error(`    ❌ Update failed for ${rule.rule_name}:`, updateError.message);
        } else {
            console.log(`    ✅ Cleaned successfully.`);
        }
    }

    console.log('\nFinal Step: Please go to AUMS Dashboard and RE-PUBLISH your prices to update the state table.');
}

main().catch(console.error);
