export type SkuDisplayCard = {
    brand: string;
    model: string;
    variant: string;
    colour: string;
    fullLabel: string;
    image: string | null;
    colorHex: string | null;
};

function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export async function fetchSkuDisplayMap(supabase: any, skuIds: string[]): Promise<Record<string, SkuDisplayCard>> {
    const uniqueSkuIds = Array.from(new Set(skuIds.filter(Boolean)));
    if (uniqueSkuIds.length === 0) return {};

    const { data: skuRows, error: skuErr } = await supabase
        .from('cat_skus')
        .select('id, name, primary_image, hex_primary, color_name, model_id, vehicle_variant_id, colour_id')
        .in('id', uniqueSkuIds);
    if (skuErr || !Array.isArray(skuRows)) return {};

    const typedSkuRows = skuRows as Array<{
        id: string;
        name: string | null;
        primary_image: string | null;
        hex_primary: string | null;
        color_name: string | null;
        model_id: string | null;
        vehicle_variant_id: string | null;
        colour_id: string | null;
    }>;

    const modelIds = Array.from(new Set(typedSkuRows.map(s => s.model_id).filter(Boolean))) as string[];
    const variantIds = Array.from(new Set(typedSkuRows.map(s => s.vehicle_variant_id).filter(Boolean))) as string[];
    const colourIds = Array.from(new Set(typedSkuRows.map(s => s.colour_id).filter(Boolean))) as string[];

    const { data: modelsRows } =
        modelIds.length > 0
            ? await supabase.from('cat_models').select('id, name, brand_id').in('id', modelIds)
            : ({ data: [] } as any);
    const modelMap = new Map<string, { name: string | null; brand_id: string | null }>(
        ((modelsRows || []) as Array<{ id: string; name: string | null; brand_id: string | null }>).map(m => [
            m.id,
            { name: m.name, brand_id: m.brand_id },
        ])
    );

    const brandIds = Array.from(
        new Set(((modelsRows || []) as Array<{ brand_id: string | null }>).map(m => m.brand_id).filter(Boolean))
    ) as string[];
    const { data: brandsRows } =
        brandIds.length > 0
            ? await supabase.from('cat_brands').select('id, name').in('id', brandIds)
            : ({ data: [] } as any);
    const brandMap = new Map<string, string | null>(
        ((brandsRows || []) as Array<{ id: string; name: string | null }>).map(b => [b.id, b.name])
    );

    const { data: variantsRows } =
        variantIds.length > 0
            ? await supabase.from('cat_variants_vehicle').select('id, name').in('id', variantIds)
            : ({ data: [] } as any);
    const variantMap = new Map<string, string | null>(
        ((variantsRows || []) as Array<{ id: string; name: string | null }>).map(v => [v.id, v.name])
    );

    const { data: coloursRows } =
        colourIds.length > 0
            ? await supabase.from('cat_colours').select('id, name, hex_primary, primary_image').in('id', colourIds)
            : ({ data: [] } as any);
    const colourMap = new Map<string, { name: string; hex: string | null; image: string | null }>(
        (
            (coloursRows || []) as Array<{
                id: string;
                name: string | null;
                hex_primary: string | null;
                primary_image: string | null;
            }>
        ).map(c => [c.id, { name: c.name || 'NA', hex: c.hex_primary || null, image: c.primary_image || null }])
    );

    const nextSkuMap: Record<string, SkuDisplayCard> = {};
    for (const sku of typedSkuRows) {
        const modelInfo = sku.model_id ? modelMap.get(sku.model_id) : null;
        let brand = (modelInfo?.brand_id ? brandMap.get(modelInfo.brand_id) : null) || 'NA';
        let model = modelInfo?.name || 'NA';
        let variant = (sku.vehicle_variant_id ? variantMap.get(sku.vehicle_variant_id) : null) || 'NA';
        let colour = sku.color_name || (sku.colour_id ? colourMap.get(sku.colour_id)?.name : null) || 'NA';

        if ((brand === 'NA' || model === 'NA' || variant === 'NA' || colour === 'NA') && sku.name) {
            const parts = sku.name
                .split('-')
                .map(part => part.trim())
                .filter(Boolean);
            if (brand === 'NA' && parts[0]) brand = toTitleCase(parts[0]);
            if (model === 'NA' && parts[1]) model = toTitleCase(parts[1]);
            if (variant === 'NA' && parts[2]) variant = toTitleCase(parts[2]);
            if (colour === 'NA' && parts.length > 3) colour = toTitleCase(parts.slice(3).join(' - '));
        }

        if (brand === 'NA' && model === 'NA' && variant === 'NA' && colour === 'NA') {
            brand = `SKU ${sku.id.slice(0, 8)}`;
            model = 'Unmapped';
            variant = 'Catalog';
            colour = 'Pending';
        }

        const colourRef = sku.colour_id ? colourMap.get(sku.colour_id) : null;
        const colorHex = sku.hex_primary || colourRef?.hex || null;
        const image = colourRef?.image || sku.primary_image || null;
        nextSkuMap[sku.id] = {
            brand,
            model,
            variant,
            colour,
            fullLabel: [brand, model, variant, colour].join(' - '),
            image,
            colorHex,
        };
    }

    return nextSkuMap;
}
