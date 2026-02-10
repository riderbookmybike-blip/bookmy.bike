'use server';

import { createClient } from '@/lib/supabase/server';
import { ProductVariant } from '@/types/productMaster';
import { mapCatalogItems, CatalogItemDB } from '@/utils/catalogMapper';

/**
 * Fetch a single product variant by its URL slugs (make/model/variant).
 * Returns the fully mapped ProductVariant with pricing, colors, and specifications.
 */
export async function getProductBySlug(
    makeSlug: string,
    modelSlug: string,
    variantSlug: string
): Promise<ProductVariant | null> {
    const supabase = await createClient();

    // Decode URL slugs
    const decodedMake = decodeURIComponent(makeSlug);
    const decodedModel = decodeURIComponent(modelSlug);
    const decodedVariant = decodeURIComponent(variantSlug);

    // Construct the expected variant slug pattern
    // URL structure: /store/{make}/{model}/{variant}
    // Database slug could be: {make}-{model}-{variant} or just {variant}
    const possibleVariantSlugs = [
        decodedVariant,
        `${decodedMake}-${decodedModel}-${decodedVariant}`,
        `${decodedModel}-${decodedVariant}`,
    ];

    // First, find the family (model) by brand and model slug
    const { data: familyData, error: familyError } = await supabase
        .from('cat_items')
        .select(
            `
            id, type, name, slug, specs, price_base, brand_id, category,
            brand:cat_brands(name, logo_svg),
            children:cat_items!parent_id(
                id,
                type,
                name,
                slug,
                specs,
                price_base,
                category,
                parent:cat_items!parent_id(name, slug),
                position,
                skus:cat_items!parent_id(
                    id,
                    type,
                    status,
                    price_base,
                    category,
                    specs,
                    is_primary,
                    image_url,
                    gallery_urls,
                    video_url,
                    zoom_factor,
                    is_flipped,
                    offset_x,
                    assets:cat_assets!item_id(id, type, url, is_primary, zoom_factor, is_flipped, offset_x, offset_y, position),
                    prices:cat_price_state!vehicle_color_id(ex_showroom_price, state_code, district, latitude, longitude, is_active)
                )
            )
        `
        )
        .eq('type', 'PRODUCT')
        .eq('status', 'ACTIVE')
        .eq('slug', decodedModel)
        .eq('category', 'VEHICLE')
        .single();

    if (familyError || !familyData) {
        console.error('[getProductBySlug] Family not found:', familyError);
        return null;
    }

    // Find the specific variant within the family
    const variants = (familyData.children || []).filter((c: any) => c.type === 'VARIANT');
    const matchedVariant = variants.find(
        (v: any) =>
            possibleVariantSlugs.includes(v.slug) ||
            v.slug === decodedVariant ||
            v.name?.toLowerCase().replace(/\s+/g, '-') === decodedVariant
    );

    if (!matchedVariant) {
        console.error('[getProductBySlug] Variant not found:', decodedVariant);
        // Fall back to first variant if available
        if (variants.length > 0) {
            console.log('[getProductBySlug] Falling back to first variant');
        } else {
            return null;
        }
    }

    // Get user location from cookies/localStorage (server-side approximation)
    const stateCode = 'MH'; // Default to Maharashtra
    const userDistrict: string | null = null;

    // Fetch registration rules
    const { data: ruleData } = await supabase
        .from('cat_reg_rules')
        .select('*')
        .eq('state_code', stateCode)
        .eq('status', 'ACTIVE');

    // Fetch insurance rules
    const { data: insuranceRuleData } = await supabase
        .from('cat_ins_rules')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('vehicle_type', 'TWO_WHEELER')
        .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
        .order('state_code', { ascending: false })
        .limit(1);

    // Fetch market best offers
    const { data: offerData } = await supabase.rpc('get_market_best_offers', {
        p_district_name: userDistrict || '',
        p_state_code: stateCode,
    });

    // Create a modified family structure with only the matched variant
    const filteredFamily: CatalogItemDB = {
        ...familyData,
        brand: familyData.brand as any,
        children: matchedVariant ? [matchedVariant] : variants.length > 0 ? [variants[0]] : [],
    };

    // Use the existing mapper to transform the data
    const mappedItems = mapCatalogItems([filteredFamily], ruleData || [], insuranceRuleData || [], {
        stateCode,
        userLat: null,
        userLng: null,
        userDistrict,
        offers: offerData || [],
    });

    if (mappedItems.length === 0) {
        console.error('[getProductBySlug] Mapping returned no items');
        return null;
    }

    return mappedItems[0];
}
