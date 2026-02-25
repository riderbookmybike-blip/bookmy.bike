'use server';

import { adminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/auth/resolver';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { calculatePricingBySkuIds } from '@/actions/pricingLedger';

type MatrixStatePriceInput = {
    state_code: string;
    ex_showroom: number;
};

type MatrixCompatibilityInput = {
    is_universal?: boolean;
    target_brand_id?: string | null;
    target_model_id?: string | null;
    target_variant_id?: string | null;
};

type SaveMatrixSkuInput = {
    sku_id: string;
    specs: Record<string, any>;
    price_base: number;
    inclusion_type: string;
    state_prices: MatrixStatePriceInput[];
    compatibility: MatrixCompatibilityInput[];
};

type SaveMatrixSkuResult =
    | {
          success: true;
          sku: Record<string, any>;
      }
    | {
          success: false;
          error: string;
      };

const toPositiveNumber = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
};

export async function saveMatrixSkuEditor(input: SaveMatrixSkuInput): Promise<SaveMatrixSkuResult> {
    try {
        const user = await getAuthUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const skuId = (input?.sku_id || '').trim();
        if (!skuId) {
            return { success: false, error: 'Missing SKU id' };
        }

        const basePrice = toPositiveNumber(input?.price_base);
        const inclusionType = (input?.inclusion_type || 'OPTIONAL').toString().toUpperCase();

        const { data: updatedSku, error: skuError } = await adminClient
            .from('cat_skus')
            .update({
                specs: input?.specs || {},
                price_base: basePrice,
                inclusion_type: inclusionType,
                updated_at: new Date().toISOString(),
            })
            .eq('id', skuId)
            .select()
            .single();

        if (skuError) {
            return { success: false, error: skuError.message };
        }

        const statePriceMap = new Map<string, number>();
        for (const row of input?.state_prices || []) {
            const code = (row?.state_code || '').toString().trim().toUpperCase();
            const exShowroom = toPositiveNumber(row?.ex_showroom);
            if (!code || exShowroom <= 0) continue;
            statePriceMap.set(code, exShowroom);
        }

        if (statePriceMap.size > 0) {
            const rows = Array.from(statePriceMap.entries()).map(([stateCode, exShowroom]) => ({
                id: crypto.randomUUID(),
                sku_id: skuId,
                state_code: stateCode,
                ex_factory: exShowroom,
                ex_factory_gst_amount: 0,
                logistics_charges: 0,
                logistics_charges_gst_amount: 0,
                ex_showroom: exShowroom,
                publish_stage: 'DRAFT',
            }));

            const { error: pricingError } = await adminClient
                .from('cat_price_state_mh')
                .upsert(rows, { onConflict: 'sku_id,state_code' });

            if (pricingError) {
                return { success: false, error: pricingError.message };
            }

            // SOT: whenever ex-showroom is seeded/updated, run price engine to persist RTO/insurance accurately.
            for (const [stateCode, exShowroom] of statePriceMap.entries()) {
                const calcResult = await calculatePricingBySkuIds([{ skuId, exShowroom }], stateCode);
                if (!calcResult.success) {
                    return {
                        success: false,
                        error: `Price engine calculation failed for ${stateCode}: ${calcResult.errors.join(', ')}`,
                    };
                }
            }
        }

        const { error: deleteCompatibilityError } = await adminClient
            .from('cat_accessory_suitable_for')
            .delete()
            .eq('variant_id', skuId);
        if (deleteCompatibilityError) {
            return { success: false, error: deleteCompatibilityError.message };
        }

        const compatRows = (input?.compatibility || [])
            .map(entry => ({
                variant_id: skuId,
                is_universal: Boolean(entry?.is_universal),
                target_brand_id: entry?.is_universal ? null : (entry?.target_brand_id ?? null),
                target_model_id: entry?.is_universal ? null : (entry?.target_model_id ?? null),
                target_variant_id: entry?.is_universal ? null : (entry?.target_variant_id ?? null),
            }))
            .filter(
                row =>
                    row.is_universal ||
                    row.target_brand_id !== null ||
                    row.target_model_id !== null ||
                    row.target_variant_id !== null
            );

        if (compatRows.length > 0) {
            const { error: insertCompatibilityError } = await adminClient
                .from('cat_accessory_suitable_for')
                .insert(compatRows);
            if (insertCompatibilityError) {
                return { success: false, error: insertCompatibilityError.message };
            }
        }

        return { success: true, sku: updatedSku as Record<string, any> };
    } catch (err: unknown) {
        return { success: false, error: getErrorMessage(err) || 'Failed to save SKU editor state' };
    }
}
