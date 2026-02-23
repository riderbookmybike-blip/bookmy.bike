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
 * Pricing Ledger uses SKU-level data (type='SKU') and canonical state pricing
 * from cat_price_state_mh.
 */

export async function getPricingLedger(tenantId: string) {
    const supabase = await createClient();

    // STATE CODE - Default to MH for now (proper logic would use tenant settings)
    const stateCode = 'MH';

    // 1. Fetch SKUs with canonical V2 joins
    const { data: skus, error } = await supabase
        .from('cat_skus')
        .select(
            `
            id,
            name,
            status,
            price_base,
            color_name,
            sku_type,
            model:cat_models!model_id(id, name, product_type, engine_cc, brand:cat_brands!brand_id(id, name)),
            vehicle_variant:cat_variants_vehicle!vehicle_variant_id(id, name),
            accessory_variant:cat_variants_accessory!accessory_variant_id(id, name),
            service_variant:cat_variants_service!service_variant_id(id, name)
        `
        )
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

    // 3. Fetch canonical state prices for all SKUs from cat_price_state_mh
    const { data: priceRows, error: priceError } = await supabase
        .from('cat_price_state_mh')
        .select(
            'sku_id, ex_showroom, on_road_price, rto_total_state, ins_gross_premium, published_at, state_code, publish_stage'
        )
        .eq('state_code', stateCode)
        .in('sku_id', skuIds);

    if (priceError) {
        console.error('getPricingLedger - price fetch error:', JSON.stringify(priceError, null, 2));
    }

    // 4. Create lookup map from cat_price_state_mh rows
    const priceMap = new Map<string, any>();
    (priceRows || []).forEach((row: any) => {
        priceMap.set(row.sku_id, {
            ex_showroom_price: Number(row.ex_showroom) || 0,
            rto_total: Number(row.rto_total_state) || 0,
            insurance_total: Number(row.ins_gross_premium) || 0,
            on_road_price: Number(row.on_road_price) || 0,
            published_at: row.published_at,
            state_code: row.state_code || stateCode,
            publish_stage: row.publish_stage || 'DRAFT',
        });
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
        const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant || {};
        const model = sku.model || {};
        const brand = model.brand || {};
        const price = priceMap.get(sku.id);
        const rule = dealerRulesMap.get(sku.id);

        // Category normalization
        let category = String(model.product_type || sku.sku_type || 'VEHICLE').toLowerCase();
        // Pluralize for UI filter compatibility
        if (category === 'vehicle') category = 'vehicles';
        else if (category === 'accessory') category = 'accessories';
        else if (category === 'service') category = 'services';

        const engineCc = Number(model.engine_cc || 110);

        const skuType = String(sku.sku_type || '').toUpperCase();
        const isVehicleSku = skuType === 'VEHICLE';

        return {
            id: sku.id,
            variantName: variant.name || sku.name,
            modelName: model.name || '',
            makeName: brand.name || '',
            colorName: sku.color_name || sku.name,
            exShowroom: isVehicleSku ? price?.ex_showroom_price || 0 : price?.ex_showroom_price || sku.price_base || 0,
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

    // console.log(`getPricingLedger - Returning ${mappedSkus.length} SKUs`);

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

    // Update the SKU status in cat_skus
    const { error } = await supabase
        .from('cat_skus')
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
