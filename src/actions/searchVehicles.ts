'use server';

import { adminClient } from '@/lib/supabase/admin';
import { slugify } from '@/utils/slugs';

export interface SearchResult {
    id: string;
    label: string; // e.g. "Honda Activa 6G STD"
    make: string;
    model: string;
    variant: string;
    modelSlug: string;
    brandSlug: string;
    variantSlug: string;
    bodyType: string | null;
    imageUrl: string | null;
    href: string; // ready-to-use link
}

/**
 * Server action: search vehicles by query string.
 * Searches across brand name, model name, and variant name.
 * Returns up to 8 results for autocomplete.
 */
export async function searchVehicles(query: string): Promise<SearchResult[]> {
    const q = (query || '').trim();
    if (q.length < 1) return [];

    // Fetch all active models with their brand and variants
    const { data: skuRows, error } = await (adminClient as any)
        .from('cat_skus')
        .select(
            `
            id,
            name,
            slug,
            status,
            is_primary,
            primary_image,
            model:cat_models!model_id (
                id, name, slug, body_type, status, primary_image, media_shared,
                brand:cat_brands!brand_id ( id, name, slug )
            ),
            vehicle_variant:cat_variants_vehicle!vehicle_variant_id (
                id, name, slug, status, primary_image, media_shared
            )
        `
        )
        .eq('status', 'ACTIVE')
        .eq('sku_type', 'VEHICLE');

    if (error || !skuRows) return [];

    // Deduplicate by variant (model_id + variant_id)
    const seen = new Set<string>();
    const variants: Array<{
        brand: string;
        brandSlug: string;
        model: string;
        modelSlug: string;
        variant: string;
        variantSlug: string;
        bodyType: string | null;
        imageUrl: string | null;
        id: string;
    }> = [];

    for (const sku of skuRows) {
        const model = sku.model;
        const variant = sku.vehicle_variant;
        if (!model || model.status !== 'ACTIVE') continue;
        if (!variant || variant.status !== 'ACTIVE') continue;

        const dedupeKey = `${model.id}|${variant.id}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const brand = model.brand;

        // Resolve image: variant → model
        let img = variant.primary_image;
        if (!img && variant.media_shared !== false && model.primary_image) {
            img = model.primary_image;
        }
        if (!img && sku.primary_image) {
            img = sku.primary_image;
        }

        variants.push({
            id: variant.id,
            brand: brand?.name || '',
            brandSlug: brand?.slug || slugify(brand?.name || ''),
            model: model.name || '',
            modelSlug: model.slug || slugify(model.name || ''),
            variant: variant.name || '',
            variantSlug: variant.slug || slugify(variant.name || ''),
            bodyType: model.body_type || null,
            imageUrl: img || null,
        });
    }

    // Filter by query — case-insensitive match on brand + model + variant
    const words = q.toLowerCase().split(/\s+/);
    const matches = variants.filter(v => {
        const haystack = `${v.brand} ${v.model} ${v.variant}`.toLowerCase();
        return words.every(w => haystack.includes(w));
    });

    // Sort: exact prefix matches first, then alphabetically
    const lowerQ = q.toLowerCase();
    matches.sort((a, b) => {
        const aFull = `${a.brand} ${a.model} ${a.variant}`.toLowerCase();
        const bFull = `${b.brand} ${b.model} ${b.variant}`.toLowerCase();
        const aPrefix = aFull.startsWith(lowerQ) ? 0 : 1;
        const bPrefix = bFull.startsWith(lowerQ) ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
        return aFull.localeCompare(bFull);
    });

    return matches.slice(0, 8).map(v => ({
        id: v.id,
        label: `${v.brand} ${v.model} ${v.variant}`.trim(),
        make: v.brand,
        model: v.model,
        variant: v.variant,
        modelSlug: v.modelSlug,
        brandSlug: v.brandSlug,
        variantSlug: v.variantSlug,
        bodyType: v.bodyType,
        imageUrl: v.imageUrl,
        href: `/store/${v.brandSlug}/${v.modelSlug}/${v.variantSlug}`,
    }));
}
