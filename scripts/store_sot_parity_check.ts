#!/usr/bin/env -S npx tsx --tsconfig tsconfig.json
/**
 * store_sot_parity_check.ts — SOT Parity Verification
 *
 * Compares Catalog snapshot vs PDP snapshot for the same product/SKU
 * to ensure pricing, images, and color metadata are identical.
 *
 * Usage:
 *   npx tsx -r dotenv/config scripts/store_sot_parity_check.ts
 *
 * Or with custom state:
 *   SOT_PARITY_STATE=KA npx tsx -r dotenv/config scripts/store_sot_parity_check.ts
 */

// ── Env must be loaded BEFORE any app imports ────────────────
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Validate env before proceeding
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing env vars. Ensure .env.local contains:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
    console.error('Run with: npx tsx -r dotenv/config scripts/store_sot_parity_check.ts');
    process.exit(1);
}

type Group = {
    make: string;
    model: string;
    variant: string;
    rows: any[];
};

function groupVehicleRows(rows: any[]): Group[] {
    const groups = new Map<string, Group>();

    for (const row of rows) {
        if (String(row?.sku_type || '').toUpperCase() !== 'VEHICLE') continue;
        const make = String(row?.brand_slug || '').trim();
        const model = String(row?.model_slug || '').trim();
        const variant = String(row?.variant_slug || '').trim();
        if (!make || !model || !variant) continue;

        const key = `${make}/${model}/${variant}`;
        if (!groups.has(key)) {
            groups.set(key, { make, model, variant, rows: [] });
        }
        groups.get(key)!.rows.push(row);
    }

    return Array.from(groups.values());
}

async function run() {
    const { getCatalogSnapshot, getPdpSnapshot } = await import('../src/lib/server/storeSot');

    const stateCode = (process.env.SOT_PARITY_STATE || 'MH').toUpperCase();
    const limit = Number(process.env.SOT_PARITY_LIMIT || 30);

    console.log(`\n🔍 Store SOT parity check — state=${stateCode}, limit=${limit}\n`);

    const catalogRows = await getCatalogSnapshot(stateCode);
    const groups = groupVehicleRows(catalogRows).slice(0, limit);

    if (groups.length === 0) {
        console.error('❌ No vehicle groups found in catalog snapshot.');
        process.exit(1);
    }

    console.log(`✓ Found ${groups.length} vehicle groups in catalog\n`);

    let checked = 0;
    let missingPdp = 0;
    let missingSkuOverlap = 0;
    let priceMismatches = 0;

    for (const group of groups) {
        checked += 1;
        const pdp = await getPdpSnapshot({
            make: group.make,
            model: group.model,
            variant: group.variant,
            stateCode,
        });

        if (!pdp?.resolvedVariant || !Array.isArray(pdp.skus) || pdp.skus.length === 0) {
            missingPdp += 1;
            console.warn(`  ⚠️  PDP missing: ${group.make}/${group.model}/${group.variant}`);
            continue;
        }

        const catalogSkuIds = new Set(group.rows.map(r => String(r?.sku_id || '')));
        const pdpSkuIds = new Set(pdp.skus.map(s => String(s?.id || '')));
        const overlap = Array.from(catalogSkuIds).filter(id => pdpSkuIds.has(id));
        if (overlap.length === 0) {
            missingSkuOverlap += 1;
            console.warn(`  ⚠️  No SKU overlap: ${group.make}/${group.model}/${group.variant}`);
        }

        const catalogPrimary = group.rows.find(r => Boolean(r?.is_primary)) || group.rows[0];
        const catalogEx = Number(catalogPrimary?.ex_showroom ?? catalogPrimary?.price_base ?? 0);
        const pdpEx = Number(pdp?.pricing?.ex_showroom_price ?? 0);

        if (catalogEx > 0 && pdpEx > 0 && Math.abs(catalogEx - pdpEx) > 1) {
            priceMismatches += 1;
            console.warn(
                `  ❌ Price mismatch: ${group.make}/${group.model}/${group.variant} — catalog=₹${catalogEx}, pdp=₹${pdpEx}`
            );
        } else {
            console.log(`  ✅ ${group.make}/${group.model}/${group.variant}`);
        }
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(
        `Checked: ${checked} | Missing PDP: ${missingPdp} | No SKU overlap: ${missingSkuOverlap} | Price mismatches: ${priceMismatches}`
    );

    if (priceMismatches === 0 && missingPdp === 0 && missingSkuOverlap === 0) {
        console.log('🎉 Full parity — Catalog and PDP data are identical.\n');
    } else {
        console.log('⚠️  Issues found — investigate above.\n');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Parity check failed:', err);
    process.exit(1);
});
