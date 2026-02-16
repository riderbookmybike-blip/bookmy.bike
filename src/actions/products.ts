'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Pricing Ledger Server Actions
 *
 * Reconstructed from patterns found in:
 * - SystemCatalogLogic.ts (client hook, working for Product Catalog)
 * - publishPrices.ts (previewPrices function)
 * - catalog_pricing_architecture.md (KI documentation)
 *
 * The key insight: The Pricing Ledger needs SKU-level data (type='SKU')
 * joined with cat_skus_linear via unit_json->>id, not via parent joins.
 */

export async function getPricingLedger(tenantId: string) {
    const supabase = await createClient();

    // STATE CODE - Default to MH for now (proper logic would use tenant settings)
    const stateCode = 'MH';

    // 1. Fetch SKUs with their hierarchy (Parent=UNIT, Grandparent=VARIANT, Great-grandparent=PRODUCT)
    const { data: skus, error } = await supabase
        .from('cat_items')
        .select(
            `
            id,
            name,
            type,
            status,
            specs,
            price_base,
            parent:parent_id (
                id,
                name,
                type,
                specs,
                position,
                    parent:parent_id (
                    id,
                    name,
                    type,
                    specs,
                    brand_id,
                    brand:cat_brands (id, name),
                    category,
                    parent:parent_id (
                        id,
                        name,
                        type,
                        specs,
                        brand_id,
                        brand:cat_brands (id, name),
                        category
                    )
                )
            )
        `
        )
        .eq('type', 'SKU')
        .eq('status', 'ACTIVE')
        .order('name');

    if (error) {
        console.error('getPricingLedger - SKUs fetch error:', JSON.stringify(error, null, 2));
        return { skus: [], activeRule: { stateCode } };
    }

    if (!skus || skus.length === 0) {
        console.warn('getPricingLedger - No SKUs returned from query');
        return { skus: [], activeRule: { stateCode } };
    }

    // 2. Get SKU IDs for batch price fetch
    const skuIds = skus.map((s: any) => s.id);

    // 3. Fetch prices for all these SKUs from cat_skus_linear (SOT)
    const priceColumn = `price_${stateCode.toLowerCase()}`;
    const { data: linearData, error: linearError } = await supabase
        .from('cat_skus_linear')
        .select(`unit_json, ${priceColumn}`)
        .eq('status', 'ACTIVE');

    if (linearError) {
        console.error('getPricingLedger - Linear prices fetch error:', JSON.stringify(linearError, null, 2));
    }

    // 4. Create price lookup map from cat_skus_linear JSONB
    const priceMap = new Map<string, any>();
    (linearData || []).forEach((row: any) => {
        const priceMh = row[priceColumn];
        const unitId = row.unit_json?.id;
        if (unitId && priceMh) {
            priceMap.set(unitId, {
                ex_showroom_price: Number(priceMh.ex_showroom) || 0,
                rto_total: Number(priceMh.rto_total) || 0,
                insurance_total: Number(priceMh.insurance_total) || 0,
                on_road_price: Number(priceMh.on_road_price) || 0,
                published_at: priceMh.published_at,
                state_code: stateCode,
            });
        }
    });

    // 5. Fetch dealer rules if tenantId provided
    let dealerRulesMap = new Map<string, any>();
    if (tenantId) {
        const { data: rulesData, error: rulesError } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id, offer_amount, is_active, inclusion_type')
            .eq('tenant_id', tenantId)
            .in('vehicle_color_id', skuIds);

        if (rulesError) {
            console.error('getPricingLedger - Dealer rules fetch error:', rulesError);
        } else {
            (rulesData || []).forEach((r: any) => {
                dealerRulesMap.set(r.vehicle_color_id, r);
            });
        }
    }

    // 6. Map to VariantSku interface expected by frontend
    const mappedSkus = skus.map((sku: any) => {
        const variant = sku.parent || {};
        // In 4-level hierarchy: SKU → UNIT → VARIANT → PRODUCT
        // variant.parent could be VARIANT (if 3-level) or VARIANT (if 4-level)
        const grandparent = variant.parent || {};
        const greatGrandparent = grandparent.parent || {};
        // Family = PRODUCT level (prefer great-grandparent if available)
        const family = greatGrandparent?.id ? greatGrandparent : grandparent;
        const brand = family.brand || grandparent.brand || {};
        const price = priceMap.get(sku.id);
        const rule = dealerRulesMap.get(sku.id);

        // Category normalization: DB 'VEHICLE' -> UI 'vehicles'
        let category = (family.category || grandparent.category || 'VEHICLE').toLowerCase();
        // Pluralize for UI filter compatibility
        if (category === 'vehicle') category = 'vehicles';
        else if (category === 'accessory') category = 'accessories';
        else if (category === 'service') category = 'services';

        // Get engine_cc: walk full hierarchy SKU → UNIT → VARIANT → PRODUCT
        const engineCc =
            sku.specs?.engine_cc ||
            variant.specs?.engine_cc ||
            grandparent.specs?.engine_cc ||
            greatGrandparent?.specs?.engine_cc ||
            110; // Default

        return {
            id: sku.id,
            variantName: variant.name || sku.name,
            modelName: family.name || '',
            makeName: brand.name || '',
            colorName: sku.name,
            exShowroom: price?.ex_showroom_price || sku.price_base || 0,
            offerAmount: rule?.offer_amount || 0,
            basePrice: sku.price_base || 0,
            gstRate: 0.28,
            status: sku.status || 'ACTIVE',
            category: category,
            inclusionType: rule?.inclusion_type || 'OPTIONAL',
            localIsActive: rule?.is_active ?? true,
            rto: price?.rto_total || 0,
            insurance: price?.insurance_total || 0,
            engineCc: engineCc,
            publishedAt: price?.published_at,
        };
    });

    console.log(`getPricingLedger - Returning ${mappedSkus.length} SKUs`);

    return {
        skus: mappedSkus,
        activeRule: { stateCode },
    };
}

export async function updatePricingLedgerOffer(id: string, amount: number, tenantId?: string) {
    const supabase = await createClient();

    // For proper implementation, we need tenantId
    // Using a simplified upsert for now
    const { error } = await supabase.from('cat_price_dealer' as any).upsert(
        {
            vehicle_color_id: id,
            offer_amount: amount,
            updated_at: new Date().toISOString(),
            // tenant_id should be passed or derived
        },
        { onConflict: 'vehicle_color_id,tenant_id' }
    );

    if (error) {
        console.error('updatePricingLedgerOffer error:', JSON.stringify(error, null, 2));
        throw error;
    }

    revalidatePath('/app/[slug]/dashboard/catalog/pricing');
}

export async function updatePricingLedgerStatus(id: string, status: string) {
    const supabase = await createClient();

    // Update the SKU status in cat_items
    const { error } = await supabase
        .from('cat_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('updatePricingLedgerStatus error:', JSON.stringify(error, null, 2));
        throw error;
    }

    revalidatePath('/app/[slug]/dashboard/catalog/pricing');
}

export async function updatePricingLedgerInclusion(id: string, type: string, tenantId?: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('cat_price_dealer' as any).upsert(
        {
            vehicle_color_id: id,
            inclusion_type: type,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'vehicle_color_id,tenant_id' }
    );

    if (error) {
        console.error('updatePricingLedgerInclusion error:', JSON.stringify(error, null, 2));
        throw error;
    }

    revalidatePath('/app/[slug]/dashboard/catalog/pricing');
}

export async function updatePricingLedgerLocalStatus(id: string, isActive: boolean, tenantId?: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('cat_price_dealer' as any).upsert(
        {
            vehicle_color_id: id,
            is_active: isActive,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'vehicle_color_id,tenant_id' }
    );

    if (error) {
        console.error('updatePricingLedgerLocalStatus error:', JSON.stringify(error, null, 2));
        throw error;
    }

    revalidatePath('/app/[slug]/dashboard/catalog/pricing');
}
