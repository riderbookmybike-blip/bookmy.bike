/**
 * One-time seed: Add all 9 insurance addons to the insurance rule in cat_ins_rules.
 * Uses actual Indian 2-wheeler insurance market rates.
 *
 * Usage: npx tsx scripts/seed-insurance-addons.ts
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

const RULE_ID = '121b3bcb-80a5-4121-9a29-3cb88b221346';

// ── Industry-standard 2-wheeler insurance addon definitions ──
// Each addon uses FormulaComponent shape: { id, type, label, percentage?, amount?, basis?, roundingMode? }
//
// Pricing rationale (India 2W market, IRDAI reference rates 2024-25):
// - Zero Depreciation: ~15% of OD premium (PERCENTAGE of IDV proxy)
// - PA Cover: ₹750/year (IRDAI mandated for owner-driver)
// - Return to Invoice: ~3% of IDV
// - Engine Protector: ₹500-1000 fixed (segment-based)
// - Consumables Cover: ₹500 fixed
// - Roadside Assistance: ₹500-1000 fixed
// - Key Protect: ₹500 fixed
// - Tyre Protect: ₹500 fixed
// - Pillion Cover: ₹500 fixed (unnamed PA for pillion)

const CANONICAL_ADDONS = [
    {
        id: 'addon_zero_depreciation',
        type: 'PERCENTAGE' as const,
        label: 'Zero Depreciation',
        percentage: 15, // 15% of IDV
        basis: 'IDV' as const,
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_personal_accident_cover',
        type: 'FIXED' as const,
        label: 'Personal Accident Cover',
        amount: 750, // ₹750/year (IRDAI mandated)
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_return_to_invoice',
        type: 'PERCENTAGE' as const,
        label: 'Return to Invoice (RTI)',
        percentage: 3, // 3% of IDV
        basis: 'IDV' as const,
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_engine_protector',
        type: 'FIXED' as const,
        label: 'Engine Protector',
        amount: 1000, // ₹1000 fixed
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_consumables_cover',
        type: 'FIXED' as const,
        label: 'Consumables Cover',
        amount: 500, // ₹500 fixed
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_roadside_assistance',
        type: 'FIXED' as const,
        label: 'Roadside Assistance (RSA)',
        amount: 1000, // ₹1000 fixed
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_key_protect',
        type: 'FIXED' as const,
        label: 'Key Protect',
        amount: 500, // ₹500 fixed
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_tyre_protect',
        type: 'FIXED' as const,
        label: 'Tyre Protect',
        amount: 500, // ₹500 fixed
        roundingMode: 'CEIL' as const,
    },
    {
        id: 'addon_pillion_cover',
        type: 'FIXED' as const,
        label: 'Pillion Cover',
        amount: 500, // ₹500 fixed (unnamed PA for pillion rider)
        roundingMode: 'CEIL' as const,
    },
];

async function main() {
    console.log('Fetching insurance rule:', RULE_ID);

    const { data: rule, error } = await admin
        .from('cat_ins_rules')
        .select('id, rule_name, addons')
        .eq('id', RULE_ID)
        .maybeSingle();

    if (error || !rule) {
        console.error('Rule not found:', error?.message || 'No data');
        process.exit(1);
    }

    console.log(`Rule: ${rule.rule_name}`);
    const existingAddons = (rule.addons || []) as any[];
    console.log(
        `Existing addons (${existingAddons.length}):`,
        existingAddons.map((a: any) => a.label)
    );

    // Build merged list: keep existing, add missing
    const existingIds = new Set(existingAddons.map((a: any) => a.id));
    const mergedAddons = [...existingAddons];
    let addedCount = 0;

    for (const addon of CANONICAL_ADDONS) {
        if (existingIds.has(addon.id)) {
            console.log(`  ✓ Already exists: ${addon.label}`);
            continue;
        }
        mergedAddons.push(addon);
        addedCount++;
        const detail =
            addon.type === 'PERCENTAGE' ? `${addon.percentage}% of ${addon.basis}` : `₹${addon.amount} fixed`;
        console.log(`  + Adding: ${addon.label} → ${detail}`);
    }

    if (addedCount === 0) {
        console.log('\n✅ All addons already exist. Nothing to do.');
        return;
    }

    // Update the rule
    const { error: updateError } = await admin
        .from('cat_ins_rules')
        .update({
            addons: mergedAddons,
            updated_at: new Date().toISOString(),
        })
        .eq('id', RULE_ID);

    if (updateError) {
        console.error('Update failed:', updateError.message);
        process.exit(1);
    }

    console.log(`\n✅ Added ${addedCount} addons to insurance rule.`);
    console.log(`\nTotal addons now: ${mergedAddons.length}`);
    console.log('\n📋 Full addon list:');
    console.log('─'.repeat(65));
    for (const a of mergedAddons) {
        const detail = a.type === 'PERCENTAGE' ? `${a.percentage}% of ${a.basis || 'IDV'}` : `₹${a.amount} fixed`;
        console.log(`  ${(a.label || a.id).padEnd(35)} ${detail}`);
    }
    console.log('─'.repeat(65));
    console.log(
        '\n⚠️  Next step: Go to AUMS → Insurance Rule → Save & re-publish to update cat_price_state_mh with calculated values.'
    );
}

main().catch(console.error);
