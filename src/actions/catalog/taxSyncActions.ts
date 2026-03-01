'use server';

import { adminClient } from '@/lib/supabase/admin';
import { resolveVehicleTax } from '@/lib/aums/hsn_engine';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';

/**
 * Scans all models and identifies those whose HSN/GST does not match the 22nd Sept 2025 SOT.
 */
export async function auditCatalogTaxes() {
    const { data: models, error } = await adminClient
        .from('cat_models')
        .select('id, name, fuel_type, engine_cc, hsn_code, item_tax_rate')
        .eq('status', 'ACTIVE');

    if (error) return { success: false, error: error.message };

    const discrepancies = [];

    for (const model of models || []) {
        const expected = resolveVehicleTax(model.fuel_type || 'PETROL', Number(model.engine_cc) || 0);

        const hsnMatch = model.hsn_code === expected.hsnCode;
        const taxMatch = Number(model.item_tax_rate) === expected.gstRate + expected.cessRate;

        if (!hsnMatch || !taxMatch) {
            discrepancies.push({
                id: model.id,
                name: model.name,
                currentHsn: model.hsn_code,
                expectedHsn: expected.hsnCode,
                currentTax: model.item_tax_rate,
                expectedTax: expected.gstRate + expected.cessRate,
                reason: expected.description,
            });
        }
    }

    return { success: true, count: discrepancies.length, discrepancies };
}

/**
 * Applies the Sept 2025 Tax SOT to all models.
 */
export async function syncCatalogTaxes() {
    const { data: models, error } = await adminClient.from('cat_models').select('id, fuel_type, engine_cc');

    if (error) return { success: false, error: error.message };

    let updatedCount = 0;
    for (const model of models || []) {
        const expected = resolveVehicleTax(model.fuel_type || 'PETROL', Number(model.engine_cc) || 0);

        const { error: updateError } = await adminClient
            .from('cat_models')
            .update({
                hsn_code: expected.hsnCode,
                item_tax_rate: expected.gstRate + expected.cessRate,
                updated_at: new Date().toISOString(),
            })
            .eq('id', model.id);

        if (!updateError) updatedCount++;
    }

    revalidateTag(CACHE_TAGS.catalog_global, 'max');
    return { success: true, updatedCount };
}
