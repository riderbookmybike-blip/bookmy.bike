export interface AccessoryCompatibilityRow {
    target_brand_id?: string | null;
    target_model_id?: string | null;
    target_variant_id?: string | null;
    is_universal?: boolean;
}

export interface AccessoryCompatibilityInput {
    compatibilityRows?: AccessoryCompatibilityRow[] | null;
    suitableFor?: string | null;
    brand?: string;
    model?: string;
    variant?: string;
    brandId?: string | null;
    modelId?: string | null;
    variantIds?: Array<string | null | undefined>;
}

const normalizeToken = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const normalizeId = (value?: string | null) => String(value || '').trim();

export function matchesLegacyAccessoryCompatibility(
    suitableFor: string | null | undefined,
    brand: string,
    model: string,
    variant: string
) {
    const suitabilityRaw = Array.isArray(suitableFor) ? suitableFor.join(',') : suitableFor;
    if (!suitabilityRaw || suitabilityRaw.trim() === '') return false;

    const tags = suitabilityRaw
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    if (tags.length === 0) return false;

    const brandNorm = normalizeToken(brand || '');
    const modelNorm = normalizeToken(model || '');
    const variantNorm = normalizeToken(variant || '');

    const buildKey = (...parts: string[]) => parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    const variantHasModel = Boolean(modelNorm && variantNorm.includes(modelNorm));
    const variantHasBrand = Boolean(brandNorm && variantNorm.includes(brandNorm));

    const brandModel = buildKey(brandNorm, modelNorm);
    const brandVariant = buildKey(variantHasBrand ? '' : brandNorm, variantNorm);
    const modelVariant = buildKey(variantHasModel ? '' : modelNorm, variantNorm);
    const brandModelVariant = buildKey(variantHasBrand ? '' : brandNorm, variantHasModel ? '' : modelNorm, variantNorm);

    const matchKeys = new Set(
        [brandNorm, modelNorm, variantNorm, brandModel, brandVariant, modelVariant, brandModelVariant].filter(Boolean)
    );

    return tags.some(tag => {
        const normalized = normalizeToken(tag);
        if (!normalized) return false;

        if (normalized.includes('universal') || normalized === 'all') return true;
        if (normalized.includes('all models')) return Boolean(brandNorm && normalized.includes(brandNorm));

        if (normalized.includes('all variants')) {
            return Boolean(brandNorm && modelNorm && normalized.includes(brandNorm) && normalized.includes(modelNorm));
        }

        if (brandNorm && normalized.startsWith(brandNorm) && normalized.includes('all models')) return true;
        return matchKeys.has(normalized);
    });
}

export function matchesScopedAccessoryCompatibility(
    rows: AccessoryCompatibilityRow[] | null | undefined,
    context: {
        brandId?: string | null;
        modelId?: string | null;
        variantIds?: Array<string | null | undefined>;
    }
) {
    const allRows = Array.isArray(rows) ? rows : [];
    if (allRows.length === 0) return false;

    const scopedRows = allRows.filter(r => {
        return Boolean(
            normalizeId(r?.target_brand_id) || normalizeId(r?.target_model_id) || normalizeId(r?.target_variant_id)
        );
    });

    // If ANY row has explicit is_universal flag OR all target fields NULL → compatible with everything.
    const hasUniversalRow = allRows.some(
        r =>
            r.is_universal === true ||
            (!normalizeId(r?.target_brand_id) && !normalizeId(r?.target_model_id) && !normalizeId(r?.target_variant_id))
    );
    if (hasUniversalRow) return true;

    // No universal and no scoped rows → no compatibility data → reject.
    if (scopedRows.length === 0) return false;

    const brandId = normalizeId(context.brandId);
    const modelId = normalizeId(context.modelId);
    const variantIdSet = new Set((context.variantIds || []).map(normalizeId).filter(Boolean));

    return scopedRows.some(row => {
        const targetBrand = normalizeId(row.target_brand_id);
        const targetModel = normalizeId(row.target_model_id);
        const targetVariant = normalizeId(row.target_variant_id);

        if (targetBrand && (!brandId || targetBrand !== brandId)) return false;
        if (targetModel && (!modelId || targetModel !== modelId)) return false;
        if (targetVariant && !variantIdSet.has(targetVariant)) return false;
        return true;
    });
}

export function isAccessoryCompatible(input: AccessoryCompatibilityInput) {
    const scopedMatches = matchesScopedAccessoryCompatibility(input.compatibilityRows, {
        brandId: input.brandId,
        modelId: input.modelId,
        variantIds: input.variantIds,
    });

    if (Array.isArray(input.compatibilityRows) && input.compatibilityRows.length > 0) {
        return scopedMatches;
    }

    return matchesLegacyAccessoryCompatibility(
        input.suitableFor,
        input.brand || '',
        input.model || '',
        input.variant || ''
    );
}
