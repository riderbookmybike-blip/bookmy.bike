import { withCache, generateFilterKey } from '../cache/cache';
import { CACHE_TAGS, districtTag, tenantTag } from '../cache/tags';
import { adminClient } from '../supabase/admin';
import { cookies } from 'next/headers';
import { mapCatalogItems } from '@/utils/catalogMapper';
import { ProductVariant } from '@/types/productMaster';
import { resolvePricingContext } from '@/lib/server/pricingContext';

/**
 * FETCHERS
 */

// SOT Phase 3: Rule fetches deprecated - pricing comes from JSON columns in cat_skus_linear
// Keeping functions for potential fallback/debugging but not called in catalog path
// async function getRawRules(stateCode: string) { ... }
// async function getRawInsuranceRules(stateCode: string) { ... }

async function getRawDealerOffers(dealerId: string, stateCode: string) {
    // Use adminClient (no cookies) for cached operations
    const { data } = await adminClient.rpc('get_dealer_offers', {
        p_tenant_id: dealerId,
        p_state_code: stateCode,
    });
    return data || [];
}

async function getRawCatalog() {
    // Use adminClient (no cookies) for cached operations
    const { data, error } = await adminClient
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
                colors:cat_items!parent_id(
                    id,
                    type,
                    name,
                    slug,
                    specs,
                    position,
                    skus:cat_items!parent_id(
                        id,
                        type,
                        status,
                        price_base,
                        category,
                        is_primary,
                        image_url,
                        gallery_urls,
                        video_url,
                        zoom_factor,
                        is_flipped,
                        offset_x,
                        offset_y,
                        specs
                    )
                ),
                skus:cat_items!parent_id(
                    id,
                    type,
                    status,
                    price_base,
                    category,
                    is_primary,
                    image_url,
                    gallery_urls,
                    video_url,
                    zoom_factor,
                    is_flipped,
                    offset_x,
                    offset_y,
                    specs
                )
            )
        `
        )
        .eq('type', 'PRODUCT')
        .eq('status', 'ACTIVE')
        .eq('category', 'VEHICLE');

    if (error) {
        console.error('[CatalogCache] Fetch Error:', error.message);
        return null;
    }
    return data;
}

async function getRawCatalogFromLinear() {
    const { data, error } = await adminClient
        .from('cat_skus_linear')
        .select('*')
        .eq('status', 'ACTIVE')
        .not('type_name', 'in', '(ACCESSORY,SERVICE)');

    if (error) {
        console.error('[CatalogLinearFetch] Error:', error.message);
        return null;
    }
    console.debug('[CatalogLinearFetch] rows:', data?.length ?? 0);
    return data;
}

function reconstructHierarchy(rows: any[], stateCode: string = 'MH'): any[] {
    const productGroups = new Map<string, any>();

    if (!rows || rows.length === 0) {
        console.warn('[CatalogLinearFetch] reconstructHierarchy received 0 rows');
        return [];
    }

    const stateKey = `price_${stateCode.toLowerCase()}`;

    for (const row of rows) {
        if (!productGroups.has(row.product_json.id)) {
            productGroups.set(row.product_json.id, {
                ...row.product_json,
                brand: row.brand_json,
                children: [],
            });
        }

        const product = productGroups.get(row.product_json.id);

        // Find or create variant
        let variant = product.children.find((c: any) => c.id === row.variant_json.id);
        if (!variant) {
            variant = {
                ...row.variant_json,
                skus: [],
                colors: [],
            };
            product.children.push(variant);
        }

        // Reconstruct SKU/UNIT structure
        // Prefer price_XX (cached state pricing) over unit_json.prices
        const statePrice = row[stateKey] || row.price_mh; // Fallback to MH if specific state missing
        const prices = statePrice
            ? [
                  {
                      ex_showroom_price: Number(statePrice.ex_showroom) || 0,
                      rto_total: Number(statePrice.rto_total) || 0,
                      insurance_total: Number(statePrice.insurance_total) || 0,
                      rto: statePrice.rto || null,
                      insurance: statePrice.insurance || null,
                      on_road_price: Number(statePrice.on_road_price) || 0,
                      state_code: stateCode,
                      district: 'ALL',
                      is_active: true,
                      published_at: null,
                      latitude: null,
                      longitude: null,
                  },
              ]
            : row.unit_json.prices || [];
        // CRITICAL: Extract the actual color/sku ID from the price entries if available
        // The linear table often embeds the Variant ID as unit_json.id, leading to price mismatches
        const effectiveUnitId = prices[0]?.vehicle_color_id || row.unit_json.id || row.id;

        const skuData = {
            ...row.unit_json,
            id: effectiveUnitId,
            prices: prices,
            image_url: row.image_url,
            gallery_urls: row.gallery_urls || [],
            assets: row.assets_json || [],
        };

        // Determine if it should go into colors or skus based on existing pattern
        if (
            row.unit_json.type === 'COLOR_DEF' ||
            (row.unit_json.specs &&
                (row.unit_json.specs.hex_primary || row.unit_json.specs.hex_code || row.unit_json.specs.Color))
        ) {
            // In the hierarchical catalog, colors often have skus as children.
            // Here we simplify by treating the unit as the sku container if it has color specs.
            variant.colors.push({
                ...skuData,
                skus: [skuData],
            });
        } else {
            variant.skus.push(skuData);
        }
    }

    return Array.from(productGroups.values());
}

export async function fetchCatalogServerSide(leadId?: string): Promise<ProductVariant[]> {
    const cookieStore = await cookies();

    // 1. Resolve pricing context (Primary dealer only)
    const pricingContext = await resolvePricingContext({ leadId });
    const dealerId = pricingContext.dealerId;
    const userDistrict = pricingContext.district;
    const stateCode = pricingContext.stateCode;

    // 2. Parallel Fetch - SOT Phase 3: Rules removed, pricing from JSON
    const useLinear = true;

    const [rawCatalog, offerData] = await Promise.all([
        withCache(
            () => (useLinear ? getRawCatalogFromLinear() : getRawCatalog()) as any,
            [useLinear ? 'raw-catalog-linear' : 'raw-catalog'],
            {
                revalidate: 3600,
                tags: [CACHE_TAGS.catalog, CACHE_TAGS.catalog_global],
            }
        ),
        dealerId
            ? withCache(() => getRawDealerOffers(dealerId, stateCode), ['dealer-offers', dealerId, stateCode], {
                  revalidate: 3600,
                  tags: [
                      CACHE_TAGS.catalog,
                      CACHE_TAGS.offers,
                      tenantTag(dealerId),
                      districtTag(userDistrict || 'ALL'),
                  ],
              })
            : Promise.resolve([]),
    ]);

    if (!rawCatalog) return [];

    // 3. Reconstruct if using linear
    const rawData = (useLinear ? reconstructHierarchy(rawCatalog as any[], stateCode) : rawCatalog) as any[];

    // Location coordinates for distance calc (optional)
    let userLat: number | null = null;
    let userLng: number | null = null;
    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    if (locationCookie) {
        try {
            const data = JSON.parse(locationCookie);
            if (data.lat && data.lng) {
                userLat = data.lat;
                userLng = data.lng;
            }
        } catch (e) {
            if (/^\d{6}$/.test(locationCookie)) {
                // legacy cookie format: pincode only (no coords)
            } else {
                console.error('Error parsing location cookie:', e);
            }
        }
    }

    // 3. Map Items
    let filteredData = rawData as any[];

    // 3.1 Dealer-only filter
    const activeOffers = offerData || [];
    const activeVehicleColorIds = new Set(activeOffers.map((offer: any) => offer.vehicle_color_id));
    const hasEligibility = Boolean(dealerId) && activeVehicleColorIds.size > 0;

    const collectVariantSkus = (variant: any) => {
        const directSkus = Array.isArray(variant?.skus) ? variant.skus : [];
        const colorSkus = Array.isArray(variant?.colors)
            ? variant.colors.flatMap((c: any) => (Array.isArray(c?.skus) ? c.skus : []))
            : [];
        return [...directSkus, ...colorSkus];
    };

    if (hasEligibility) {
        filteredData = filteredData
            .map(family => ({
                ...family,
                children: (family.children || [])
                    .map((variant: any) => {
                        const eligibleSkus = collectVariantSkus(variant).filter((sku: any) =>
                            activeVehicleColorIds.has(sku.id)
                        );

                        const filteredColors = Array.isArray(variant?.colors)
                            ? variant.colors
                                  .map((c: any) => ({
                                      ...c,
                                      skus: Array.isArray(c?.skus)
                                          ? c.skus.filter((sku: any) => activeVehicleColorIds.has(sku.id))
                                          : [],
                                  }))
                                  .filter((c: any) => c.skus && c.skus.length > 0)
                            : [];

                        return {
                            ...variant,
                            skus: Array.isArray(variant?.skus)
                                ? variant.skus.filter((sku: any) => activeVehicleColorIds.has(sku.id))
                                : [],
                            colors: filteredColors,
                            _eligibleSkuCount: eligibleSkus.length,
                        };
                    })
                    .filter((variant: any) => variant._eligibleSkuCount > 0),
            }))
            .filter(family => family.children && family.children.length > 0);
    }

    // SOT Phase 3: Pass empty arrays for rules - pricing comes from JSON columns
    const mappedCatalog = mapCatalogItems(
        filteredData,
        [], // ruleData deprecated
        [], // insuranceRuleData deprecated
        { stateCode, userLat, userLng, userDistrict, offers: offerData || [], requireEligibility: hasEligibility }
    );

    // Runtime pricing provenance debug (helps trace which table fed the catalog)
    try {
        const firstFamily = mappedCatalog?.[0] as any;
        const firstVariant = firstFamily?.children?.[0];
        const firstSku = firstVariant?.skus?.[0] || firstVariant?.colors?.[0]?.skus?.[0];
        const firstPrice = firstSku?.prices?.[0];
        console.info('[CatalogPricingDebug]', {
            useLinear,
            priceSource: useLinear ? 'cat_skus_linear.price_mh|unit_json.prices' : 'cat_items.price_base',
            dealerId: dealerId || 'NONE',
            stateCode,
            district: userDistrict || 'ALL',
            sampleSkuId: firstSku?.id || 'NONE',
            samplePrice: firstPrice || null,
        });
    } catch (err) {
        console.warn('[CatalogPricingDebug] logging failed', err);
    }

    return mappedCatalog;
}
