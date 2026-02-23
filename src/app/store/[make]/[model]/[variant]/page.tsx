import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveLocationByDistrict } from '@/utils/locationResolver';
import { adminClient } from '@/lib/supabase/admin';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';
import { isMobileDevice } from '@/lib/utils/device';
import { cookies } from 'next/headers';
import { resolveFinanceScheme, ViewerContext } from '@/utils/financeResolver';
import { BankScheme } from '@/types/bankPartner';
import { getSitemapData } from '@/lib/server/sitemapFetcher';
import { isAccessoryCompatible } from '@/lib/catalog/accessoryCompatibility';
import {
    isStoreSotV2Enabled,
    resolveStoreContext,
    resolveModel,
    fetchModelSkus,
    fetchVehicleVariants,
    matchVariant,
    resolveActiveSkus,
    fetchPublishedPricing,
    getDealerDelta,
    SKU_SELECT,
    getPdpSnapshot,
    flattenVariantSpecs,
} from '@/lib/server/storeSot';

type Props = {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
    searchParams: Promise<{
        color?: string;
        district?: string;
        state?: string;
        dealer?: string;
        studio?: string;
        leadId?: string;
        quoteId?: string;
    }>;
};

// Types for New Schema
interface CatalogItem {
    id: string;
    name: string;
    slug: string;
    price_base: number;
    specs: any;
    brand: { name: string; slug?: string };
    parent: { name: string; slug: string }; // The Model
}

const normalizeSuitabilityTag = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const COLOR_WORDS = new Set([
    'black',
    'white',
    'silver',
    'grey',
    'gray',
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'gold',
    'brown',
    'maroon',
    'navy',
    'beige',
    'cream',
    'copper',
    'bronze',
    'teal',
    'purple',
    'pink',
]);

const COLOR_MODIFIERS = new Set([
    'matte',
    'gloss',
    'glossy',
    'metallic',
    'pearl',
    'satin',
    'chrome',
    'carbon',
    'gunmetal',
    'midnight',
]);

const extractColorFromName = (name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return { baseName: name, color: '' };

    const parts = trimmed.split(/\s+/);
    if (parts.length === 0) return { baseName: name, color: '' };

    const last = parts[parts.length - 1];
    const lastNorm = normalizeSuitabilityTag(last);
    const second = parts.length > 1 ? parts[parts.length - 2] : '';
    const secondNorm = normalizeSuitabilityTag(second);

    if (COLOR_WORDS.has(lastNorm)) {
        if (second && COLOR_MODIFIERS.has(secondNorm)) {
            return {
                baseName: parts.slice(0, -2).join(' ').trim(),
                color: `${second} ${last}`,
            };
        }
        return {
            baseName: parts.slice(0, -1).join(' ').trim(),
            color: last,
        };
    }

    return { baseName: name, color: '' };
};

const stripColorFromName = (name: string, color: string) => {
    if (!name || !color) return name;
    const colorNorm = normalizeSuitabilityTag(color);
    if (!colorNorm) return name;

    const suffixPattern = new RegExp(`\\s*${escapeRegExp(color)}\\s*$`, 'i');
    if (suffixPattern.test(name)) {
        return name.replace(suffixPattern, '').trim();
    }

    return name;
};

export async function generateStaticParams() {
    try {
        const { families } = await getSitemapData();
        const params: any[] = [];

        families?.forEach((family: any) => {
            const make = (family.brand as any)?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
            const model = family.slug || family.name.toLowerCase().replace(/\s+/g, '-');

            (family.variants as any)?.forEach((variant: any) => {
                const variantSlug = variant.slug || variant.name.toLowerCase().replace(/\s+/g, '-');
                params.push({
                    make,
                    model,
                    variant: variantSlug,
                });
            });
        });

        // Limit to top 50 for build speed, others will be ISR-ed on demand
        return params.slice(0, 50);
    } catch (e) {
        console.error('Error generating static params:', e);
        return [];
    }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { make, model, variant } = await params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { color, district, dealer, state, studio } = await searchParams;

    // Canonical is always the clean variant path
    const canonical = `/store/${make}/${model}/${variant}`;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmy.bike';

    const toTitleCase = (str: string) =>
        str
            .split(/[\s-]+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');

    const title = `${toTitleCase(make)} ${toTitleCase(model)} ${toTitleCase(variant)} - BookMyBike`;
    const description = `Get the best on-road price for ${toTitleCase(make)} ${toTitleCase(model)} ${toTitleCase(variant)}. Compare dealers, check EMI options, and book your bike online at BookMyBike.`;

    // Dynamic OG Image (using variant slug for OG image generation)
    const ogImageUrl = `${baseUrl}/api/og?make=${make}&model=${model}&variant=${variant}`;

    return {
        title,
        description,
        alternates: {
            canonical: canonical,
        },
        robots: {
            index: !district && !dealer && !state && !studio && !color, // Noindex if contextual (location/dealer/color)
            follow: true,
        },
        openGraph: {
            title,
            description,
            url: `${baseUrl}${canonical}`,
            siteName: 'BookMyBike',
            type: 'website',
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${toTitleCase(make)} ${toTitleCase(model)} ${toTitleCase(variant)}`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

export default async function Page({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const supabase = adminClient;
    const cookieStore = await cookies(); // Access cookies
    const isMobile = await isMobileDevice(); // resolve device on server

    // 0. Redirect if pincode is present (Standardizing on district parameter)
    if ((resolvedSearchParams as any).pincode) {
        const newParams = new URLSearchParams();
        Object.entries(resolvedSearchParams).forEach(([key, val]) => {
            if (key === 'pincode') {
                newParams.set('district', val as string);
            } else {
                newParams.set(key, val as string);
            }
        });
        redirect(`?${newParams.toString()}`);
    }

    // 1. Resolve Pricing Context (Primary Dealer Only)
    const pricingContext = await resolveStoreContext({
        leadId: resolvedSearchParams.leadId,
        dealerId: resolvedSearchParams.dealer,
        district: resolvedSearchParams.district,
        state: resolvedSearchParams.state,
        studio: resolvedSearchParams.studio,
    });

    const stateCode = pricingContext.stateCode || 'MH';
    const resolvedDistrict = pricingContext.district || '';
    let location = null;
    if (resolvedDistrict) {
        location = await resolveLocationByDistrict(resolvedDistrict, stateCode);
    }

    // ── SOT V2 Feature Flag ──────────────────────────────────
    const SOT_V2 = isStoreSotV2Enabled();

    // 2. Fetch Variant + SKUs from V2 catalog tables (via shared SOT layer)
    let modelRow = await resolveModel(resolvedParams.make, resolvedParams.model);
    const modelError = modelRow ? null : { message: 'Model not found' };

    const { skus: modelSkusList, error: skuError } = modelRow?.id
        ? await fetchModelSkus(modelRow.id)
        : { skus: [], error: modelError };

    const possibleVariantSlugs = new Set([
        resolvedParams.variant,
        `${resolvedParams.model}-${resolvedParams.variant}`,
        `${resolvedParams.make}-${resolvedParams.model}-${resolvedParams.variant}`,
    ]);

    const normalizedSkus = modelSkusList;

    const vehicleVariants = modelRow?.id ? await fetchVehicleVariants(modelRow.id) : [];

    const matchedVariantRow = matchVariant(vehicleVariants, possibleVariantSlugs, resolvedParams.variant);

    // Resolve active SKUs via shared SOT multi-tier fallback
    let activeVariantSkus = await resolveActiveSkus(
        normalizedSkus,
        matchedVariantRow,
        possibleVariantSlugs,
        resolvedParams.variant
    );

    if (activeVariantSkus.length === 0 && matchedVariantRow?.id) {
        const { data: variantScopedSkus } = await (supabase as any)
            .from('cat_skus')
            .select(SKU_SELECT)
            .eq('vehicle_variant_id', matchedVariantRow.id)
            .eq('status', 'ACTIVE');

        activeVariantSkus = (variantScopedSkus || []).map((sku: any) => {
            const variant = sku.vehicle_variant;
            return {
                ...sku,
                variant,
                variant_slug: variant?.slug,
                variant_name: variant?.name,
                variant_id: variant?.id,
            };
        });
    }

    if (activeVariantSkus.length === 0 && normalizedSkus.length > 0) {
        activeVariantSkus = normalizedSkus.filter((sku: any) => {
            const variantSlug = String(sku?.variant_slug || '');
            return (
                variantSlug === resolvedParams.variant ||
                variantSlug.endsWith(`-${resolvedParams.variant}`) ||
                slugify(String(sku?.variant_name || '')) === resolvedParams.variant
            );
        });
    }
    const variantSeed = activeVariantSkus[0] || null;

    let resolvedVariant =
        variantSeed || matchedVariantRow
            ? ({
                  id: variantSeed?.variant_id || matchedVariantRow?.id,
                  name: variantSeed?.variant_name || matchedVariantRow?.name,
                  slug:
                      variantSeed?.variant_slug ||
                      matchedVariantRow?.slug ||
                      slugify(String(matchedVariantRow?.name || '')),
                  price_base: Number(variantSeed?.price_base || 0),
                  specs: {
                      fuel_type: modelRow?.fuel_type,
                      // NOTE: engine_cc removed — displacement from cat_variants_vehicle is the SOT
                      // Flatten variant-level spec columns for TechSpecsSection
                      ...(variantSeed?.vehicle_variant ? flattenVariantSpecs(variantSeed.vehicle_variant) : {}),
                  },
                  brand: {
                      name: modelRow?.brand?.name || resolvedParams.make,
                      slug: modelRow?.brand?.slug || slugify(resolvedParams.make),
                  },
                  parent: {
                      name: modelRow?.name || resolvedParams.model,
                      slug: modelRow?.slug || resolvedParams.model,
                  },
              } as CatalogItem)
            : null;

    let fetchError: any = skuError || modelError;
    if (!resolvedVariant) fetchError = fetchError || { message: 'No matching variant in catalog' };

    let sotPricingSnapshot: any = null;

    // SOT V2 primary path with safe fallback to inline path.
    if (SOT_V2) {
        try {
            const sotSnap = await getPdpSnapshot({
                make: resolvedParams.make,
                model: resolvedParams.model,
                variant: resolvedParams.variant,
                stateCode,
            });

            if (sotSnap?.resolvedVariant) {
                modelRow = sotSnap.model || modelRow;
                if (Array.isArray(sotSnap.skus) && sotSnap.skus.length > 0) {
                    activeVariantSkus = sotSnap.skus as any[];
                }
                resolvedVariant = sotSnap.resolvedVariant as CatalogItem;
                sotPricingSnapshot = sotSnap.pricing;
                fetchError = null;
            } else {
                console.warn('[SOT_V2] Primary snapshot unavailable; using inline PDP fetch path.');
            }
        } catch (err) {
            console.error('[SOT_V2] Primary snapshot failed; using inline PDP fetch path.', err);
        }
    }

    if (!resolvedVariant) {
        console.error('PDP Fetch Error:', fetchError);
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative z-10 border border-slate-200 bg-white p-12 rounded-[3rem] shadow-sm max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 text-red-500">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-slate-900">
                        PRODUCT <span className="text-red-500">NOT FOUND</span>
                    </h1>
                    <p className="text-slate-500 uppercase tracking-widest font-bold text-xs leading-relaxed">
                        {fetchError
                            ? fetchError.message
                            : 'The requested configuration is currently unavailable in our catalog.'}
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <a
                            href="/store"
                            className="px-8 py-4 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
                        >
                            Return to Store
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const item = resolvedVariant as CatalogItem;
    const parentSpecs: Record<string, any> = {
        fuel_type: modelRow?.fuel_type,
        // NOTE: engine_cc removed — displacement from cat_variants_vehicle is the SOT
    };

    const makeSlug = (item.brand as any)?.slug || slugify(item.brand?.name || resolvedParams.make || '');
    const rawModelSlug = item.parent?.slug || slugify(item.parent?.name || resolvedParams.model || '');
    const modelSlug = rawModelSlug.startsWith(`${makeSlug}-`) ? rawModelSlug.slice(makeSlug.length + 1) : rawModelSlug;
    const rawVariantSlug = item.slug || slugify(item.name || resolvedParams.variant || '');
    // Strip model prefix from variant slug to get just the variant portion
    // e.g., "fascino-125-fi-hybrid-disc" → "disc"
    const cleanVariantSlug = rawVariantSlug.startsWith(`${rawModelSlug}-`)
        ? rawVariantSlug.slice(rawModelSlug.length + 1)
        : rawVariantSlug.startsWith(`${modelSlug}-`)
          ? rawVariantSlug.slice(modelSlug.length + 1)
          : rawVariantSlug;

    const canonicalPath = `/store/${makeSlug}/${modelSlug}/${cleanVariantSlug}`;
    const currentPath = `/store/${resolvedParams.make}/${resolvedParams.model}/${resolvedParams.variant}`;

    if (canonicalPath.toLowerCase() !== currentPath.toLowerCase()) {
        const query = new URLSearchParams();
        Object.entries(resolvedSearchParams || {}).forEach(([key, value]) => {
            if (value) query.set(key, String(value));
        });
        const queryString = query.toString();
        redirect(queryString ? `${canonicalPath}?${queryString}` : canonicalPath);
    }

    // 2.5 Fetch SKUs EARLY (Needed for Market Offer Filtering)
    const colorSkus: any[] = activeVariantSkus.map((sku: any) => {
        // Build assets array from gallery_img_* columns (same SOT as Catalog)
        const galleryUrls = [
            sku.primary_image,
            sku.gallery_img_1,
            sku.gallery_img_2,
            sku.gallery_img_3,
            sku.gallery_img_4,
            sku.gallery_img_5,
            sku.gallery_img_6,
        ].filter(Boolean);
        const assets = galleryUrls.map((url: string, i: number) => ({
            id: `${sku.id}-img-${i}`,
            type: 'IMAGE',
            url,
            is_primary: i === 0,
            position: i,
        }));

        return {
            id: sku.id,
            name: sku.name,
            slug: sku.slug,
            price_base: Number(sku.price_base || 0),
            is_primary: Boolean(sku.is_primary),
            image_url: sku.primary_image || null,
            assets,
            parent_id: sku.id,
            specs: {
                Color: sku.colour?.name ?? sku.color_name ?? sku.name,
                color: sku.colour?.name ?? sku.color_name ?? sku.name,
                hex_primary: sku.colour?.hex_primary ?? sku.hex_primary,
                hex_secondary: sku.colour?.hex_secondary ?? sku.hex_secondary,
                finish: sku.colour?.finish ?? sku.finish,
            },
        };
    });

    const skus = colorSkus;
    const colorDefs = colorSkus.map((sku: any) => ({
        id: sku.parent_id,
        name: sku.specs?.color || sku.name,
        slug: slugify(sku.specs?.color || sku.name || sku.id),
        specs: {
            color: sku.specs?.color || sku.name,
            hex_primary: sku.specs?.hex_primary,
            hex_secondary: sku.specs?.hex_secondary,
        },
        position: 0,
        image_url: sku.image_url,
        is_primary: sku.is_primary,
    }));

    const allSkus = [...(skus || []), ...colorSkus];

    // 2.6 Fetch Prices from canonical state pricing table (via shared SOT layer)
    const skuIds = allSkus.map((s: any) => s.id);
    const { snapshot: inlineSnapshot } = await fetchPublishedPricing(skuIds, stateCode);
    const publishedPriceData: any = sotPricingSnapshot || inlineSnapshot;

    // SOT V2 shadow comparison (inline vs shared snapshot) for rollout safety.
    if (SOT_V2 && sotPricingSnapshot && inlineSnapshot) {
        const sotEx = Number(sotPricingSnapshot?.ex_showroom_price ?? 0);
        const inlineEx = Number(inlineSnapshot?.ex_showroom_price ?? 0);
        if (sotEx > 0 && inlineEx > 0 && Math.abs(sotEx - inlineEx) > 1) {
            console.warn('[SOT_V2 MISMATCH] ex_showroom', {
                sotEx,
                inlineEx,
                make: resolvedParams.make,
                model: resolvedParams.model,
                variant: resolvedParams.variant,
            });
        }
    }

    // 3. Fetch RTO/Insurance Rules
    const { data: ruleData } = await supabase
        .from('cat_reg_rules')
        .select('*')
        .eq('state_code', stateCode)
        .eq('status', 'ACTIVE');

    const { data: insuranceRuleData } = await supabase
        .from('cat_ins_rules')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('vehicle_type', 'TWO_WHEELER')
        .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
        .order('state_code', { ascending: false }) // Prioritize specific state over ALL
        .limit(1);

    // Fetch accessories from canonical V2 tables
    const { data: accessorySkus } = await (supabase as any)
        .from('cat_skus')
        .select(
            `
            id, name, price_base, primary_image, color_name, finish, status, sku_type,
            brand:cat_brands!brand_id(name),
            model:cat_models!model_id(id, name),
            accessory_variant:cat_variants_accessory!accessory_variant_id(id, name, slug, status)
            `
        )
        .eq('sku_type', 'ACCESSORY')
        .eq('status', 'ACTIVE');

    const accessoryIds = (accessorySkus || []).map((a: any) => a.id).filter(Boolean);
    const accessoryVariantIds = (accessorySkus || []).map((a: any) => a.accessory_variant?.id).filter(Boolean);

    // Fetch compatibility from SOT (cat_accessory_suitable_for, variant-level) AND pricing in parallel
    const [compatResult, accPricingResult] = await Promise.all([
        accessoryVariantIds.length > 0
            ? (supabase as any)
                  .from('cat_accessory_suitable_for')
                  .select('variant_id, is_universal, target_brand_id, target_model_id, target_variant_id')
                  .in('variant_id', accessoryVariantIds)
            : Promise.resolve({ data: [] }),
        accessoryIds.length > 0
            ? (supabase as any)
                  .from('cat_price_state_mh')
                  .select('sku_id, ex_showroom')
                  .in('sku_id', accessoryIds)
                  .eq('state_code', stateCode)
                  .eq('publish_stage', 'PUBLISHED')
            : Promise.resolve({ data: [] }),
    ]);
    const compatRows = compatResult.data || [];
    const accPricingRows = accPricingResult.data || [];

    // Build variant→compat map, then fan out to SKU-level for the compatibility checker
    const variantCompatMap = new Map<string, any[]>();
    compatRows.forEach((row: any) => {
        if (!variantCompatMap.has(row.variant_id)) variantCompatMap.set(row.variant_id, []);
        variantCompatMap.get(row.variant_id)!.push({
            target_brand_id: row.target_brand_id,
            target_model_id: row.target_model_id,
            target_variant_id: row.target_variant_id,
            is_universal: row.is_universal,
        });
    });

    // Map compatibility from variant to each SKU under that variant
    const suitableForMap = new Map<string, any[]>();
    (accessorySkus || []).forEach((a: any) => {
        const variantId = a.accessory_variant?.id;
        if (variantId && variantCompatMap.has(variantId)) {
            suitableForMap.set(a.id, variantCompatMap.get(variantId)!);
        }
    });

    // Build MRP lookup from cat_price_state_mh (SOT for accessory pricing too)
    const accMrpMap = new Map<string, number>();
    (accPricingRows || []).forEach((row: any) => {
        if (row.sku_id && Number(row.ex_showroom) > 0) {
            accMrpMap.set(row.sku_id, Number(row.ex_showroom));
        }
    });

    const accessoriesData = (accessorySkus || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        price_base: accMrpMap.get(a.id) || a.price_base,
        image_url: a.primary_image,
        category: 'ACCESSORY',
        brand: a.brand,
        parent_id: a.accessory_variant?.id || null,
        inclusion_type: 'OPTIONAL',
        specs: {
            suitable_for: '',
            color: a.color_name || '',
            finish: a.finish || '',
            max_qty: 1,
        },
        __compat: suitableForMap.get(a.id) || [],
        __variant_name: a.accessory_variant?.name || '',
        __product_name: a.model?.name || '',
    }));

    let accVariantMap = new Map<string, any>();
    let accProductMap = new Map<string, any>();
    (accessorySkus || []).forEach((a: any) => {
        if (a.accessory_variant?.id) {
            accVariantMap.set(a.accessory_variant.id, {
                id: a.accessory_variant.id,
                name: a.accessory_variant.name || '',
                parent_id: a.model?.id || null,
                image_url: a.primary_image || null,
            });
        }
        if (a.model?.id) {
            accProductMap.set(a.model.id, {
                id: a.model.id,
                name: a.model.name || '',
                image_url: null,
            });
        }
    });

    const { data: servicesData } = await supabase.from('cat_services').select('*').eq('status', 'ACTIVE');

    // Fallback/Mock Rule if missing
    const effectiveRule: any = ruleData?.[0] || {
        id: 'default',
        stateCode: 'MH',
        components: [{ id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true }],
    };

    const insuranceRule: any = insuranceRuleData?.[0];

    // 4. Resolve Server Pricing (SSPP)
    const firstSkuId = skuIds[0];
    // Vehicle base price MUST come from published state pricing only.
    const baseExShowroom = Number(publishedPriceData?.ex_showroom_price || 0);
    let serverPricing: any = null;

    if (firstSkuId && publishedPriceData && Number(publishedPriceData.ex_showroom_price || 0) > 0) {
        const rec = publishedPriceData;

        // SOT Phase 3: Use new JSON columns if available, fallback to legacy
        const rtoJsonData = rec.rto && typeof rec.rto === 'object' && rec.rto.STATE !== undefined ? rec.rto : null;
        const insJsonData =
            rec.insurance && typeof rec.insurance === 'object' && rec.insurance.base_total !== undefined
                ? rec.insurance
                : null;

        const asNumber = (value: any) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : 0;
        };

        const readTotal = (value: any) => (typeof value === 'object' ? asNumber(value?.total) : asNumber(value));

        const resolveRtoTotal = (value: any) => {
            const type = String(value?.default || 'STATE').toUpperCase();
            const selected = value?.[type];
            const fallback = value?.STATE;
            return readTotal(selected) || readTotal(fallback);
        };

        const resolvedRtoTotal = rtoJsonData ? resolveRtoTotal(rtoJsonData) : asNumber(rec.rto_total);
        const resolvedInsuranceTotal = insJsonData ? asNumber(insJsonData.base_total) : asNumber(rec.insurance_total);

        // Build RTO breakdown from JSON or legacy
        const rtoData = rtoJsonData
            ? (() => {
                  const selectedType = String(rtoJsonData.default || 'STATE').toUpperCase();
                  const selectedRto = rtoJsonData[selectedType] || rtoJsonData.STATE || {};
                  const fees = selectedRto?.fees || {};
                  const tax = selectedRto?.tax || {};
                  const dynamicBreakdown = [
                      ...Object.entries(fees).map(([key, amount]) => ({
                          label: key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, s => s.toUpperCase())
                              .trim(),
                          amount: asNumber(amount),
                      })),
                      ...Object.entries(tax).map(([key, amount]) => ({
                          label: key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, s => s.toUpperCase())
                              .trim(),
                          amount: asNumber(amount),
                      })),
                  ].filter(entry => entry.amount > 0);

                  if (dynamicBreakdown.length > 0) return dynamicBreakdown;

                  return [
                      { label: 'Road Tax', amount: asNumber(selectedRto?.roadTax) },
                      { label: 'Reg. Charges', amount: asNumber(selectedRto?.registrationCharges) },
                      { label: 'Smart Card', amount: asNumber(selectedRto?.smartCardCharges) },
                      { label: 'Hypothecation', amount: asNumber(selectedRto?.hypothecationCharges) },
                      { label: 'Postal Charges', amount: asNumber(selectedRto?.postalCharges) },
                      { label: 'Cess', amount: asNumber(selectedRto?.cessAmount) },
                  ].filter(entry => entry.amount > 0);
              })()
            : typeof rec.rto_breakdown === 'object' && rec.rto_breakdown
              ? Object.entries(rec.rto_breakdown).map(([label, amount]) => ({ label, amount: Number(amount) }))
              : [];

        // Build Insurance breakdown from JSON or legacy
        const insData = insJsonData
            ? [
                  { label: 'OD Premium', amount: readTotal(insJsonData.od), componentId: 'od' },
                  { label: 'TP Premium', amount: readTotal(insJsonData.tp), componentId: 'tp' },
                  {
                      label: 'GST',
                      amount: Math.round(
                          asNumber(insJsonData.base_total || 0) - readTotal(insJsonData.od) - readTotal(insJsonData.tp)
                      ),
                      componentId: 'gst',
                  },
              ].filter(i => i.amount > 0)
            : typeof rec.insurance_breakdown === 'object' && rec.insurance_breakdown
              ? [
                    {
                        label: 'OD Premium',
                        amount: Number((rec.insurance_breakdown as any).odPremium || 0),
                        componentId: 'od',
                    },
                    {
                        label: 'TP Premium',
                        amount: Number((rec.insurance_breakdown as any).tpPremium || 0),
                        componentId: 'tp',
                    },
                    {
                        label: 'Zero Depreciation',
                        amount: Number(
                            (rec.insurance_breakdown as any).addons?.zeroDep ||
                                (rec.insurance_breakdown as any).zeroDep ||
                                0
                        ),
                        componentId: 'zeroDep',
                    },
                    { label: 'GST', amount: Number((rec.insurance_breakdown as any).gst || 0), componentId: 'gst' },
                ].filter(i => i.amount > 0)
              : [];

        serverPricing = {
            success: true,
            ex_showroom: asNumber(rec.ex_showroom_price),
            // SOT Phase 3: Include full rto JSON for client hooks
            rto: rtoJsonData || {
                STATE: { total: asNumber(rec.rto_total) },
                BH: null,
                COMPANY: null,
                default: 'STATE',
            },
            // SOT Phase 3: Include full insurance JSON for client hooks
            insurance: insJsonData || {
                od: { total: Number((rec.insurance_breakdown as any)?.odPremium || 0) },
                tp: { total: Number((rec.insurance_breakdown as any)?.tpPremium || 0) },
                gst_rate: 18,
                base_total: asNumber(rec.insurance_total),
                addons: [],
            },
            // Legacy fields for backward compat
            rto_breakdown: rtoData,
            insurance_breakdown: insData,
            final_on_road:
                asNumber(rec.on_road_price) ||
                asNumber(rec.ex_showroom_price) + resolvedRtoTotal + resolvedInsuranceTotal,
            location: {
                district: rec.district,
                state_code: rec.state_code,
            },
            meta: {
                vehicle_color_id: rec.vehicle_color_id || rec.sku_id || firstSkuId,
                engine_cc: Number(modelRow?.engine_cc || 0),
                idv: Math.round(asNumber(rec.ex_showroom_price) * 0.95),
                calculated_at: new Date().toISOString(),
            },
            source: 'PUBLISHED_CAT_PRICES',
        };
    }
    const getRtoFromServerPricing = (pricing: any) => {
        const rto = pricing?.rto;
        if (!rto || typeof rto !== 'object') return 0;
        const selectedType = String(rto.default || 'STATE').toUpperCase();
        const selected = rto[selectedType] ?? rto.STATE;
        return typeof selected === 'object' ? Number(selected?.total || 0) : Number(selected || 0);
    };

    const getInsuranceFromServerPricing = (pricing: any) => {
        return Number(pricing?.insurance?.base_total || 0);
    };

    let initialPricingSnapshot = serverPricing
        ? {
              exShowroom: serverPricing.ex_showroom ?? baseExShowroom,
              rto: getRtoFromServerPricing(serverPricing),
              insurance: getInsuranceFromServerPricing(serverPricing),
              total: serverPricing?.final_on_road ?? baseExShowroom,
              breakdown: serverPricing,
          }
        : {
              exShowroom: baseExShowroom,
              rto: 0,
              insurance: 0,
              total: baseExShowroom,
              breakdown: null,
          };

    // 4.5 Resolve Dealer Offers (Primary Dealer Only)
    let marketOffers: Record<string, number> = {};
    let winningDealerId: string | null = pricingContext.dealerId || null;
    let bundleIdsForDealer: Set<string> = new Set();
    const leadId = resolvedSearchParams.leadId;
    let accessoryRules: Map<string, { offer: number; inclusion: string; isActive: boolean }> = new Map();

    // Resolve dealer delta from shared SOT layer (vehicle offers + bundles + accessories)
    const currentSkuIds = allSkus.map((s: any) => s.id);
    if (winningDealerId) {
        const dealerDelta = await getDealerDelta({
            dealerId: winningDealerId,
            stateCode,
            skuIds: currentSkuIds,
            accessoryIds,
        });
        marketOffers = dealerDelta.vehicleOffers;
        bundleIdsForDealer = new Set(dealerDelta.bundleSkuIds);
        accessoryRules = new Map(
            Object.entries(dealerDelta.accessoryRules).map(([skuId, rule]) => [
                skuId,
                {
                    offer: Number(rule.offer || 0),
                    inclusion: rule.inclusion || 'OPTIONAL',
                    isActive: Boolean(rule.isActive),
                },
            ])
        );
    }

    // 4.6 Enrich Server Pricing with Winning Dealer Info
    if (winningDealerId && serverPricing) {
        // Fetch Dealer Info for Metadata (Safe Multi-fetch)
        const [tenantRes, locationRes] = await Promise.all([
            supabase.from('id_tenants').select('name, studio_id').eq('id', winningDealerId).single(),
            supabase.from('id_locations').select('district').eq('tenant_id', winningDealerId).limit(1).maybeSingle(),
        ]);

        const dealerName = tenantRes.data?.name || 'Assigned Dealer';
        const dealerStudioId = (tenantRes.data as any)?.studio_id || null;
        const dealerDistrict = locationRes.data?.district;

        const winningOffer = Number(marketOffers[firstSkuId] || 0);

        serverPricing.dealer = {
            id: winningDealerId,
            name: dealerName,
            studio_id: dealerStudioId,
            offer: winningOffer,
            is_serviceable: true,
        };

        // If a specific dealer is resolved, we enrich the location context with the dealer's physical district
        // to show accurate "Studio Location" labels in the UI.
        if (dealerDistrict) {
            serverPricing.location = {
                ...serverPricing.location,
                district: dealerDistrict,
            };
        }

        // Sync snapshot top-level totals
        initialPricingSnapshot.total = serverPricing.final_on_road + winningOffer;
    }

    // 5. Map to Product Object
    // Note: unified schema stores colors as SKUs (children of Variant) or inside specs?
    // Current Studio implementation: Variant -> SKUs (each SKU is a Color).
    // Let's fetch child SKUs to get colors.
    // 6. Map to Product Object
    // We already fetched SKUs earlier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colorSkuMap = new Map<string, any[]>();
    colorSkus.forEach((sku: any) => {
        if (!colorSkuMap.has(sku.parent_id)) colorSkuMap.set(sku.parent_id, []);
        colorSkuMap.get(sku.parent_id)!.push(sku);
    });

    const pickImageFromAssets = (assets?: any[]) => {
        if (!Array.isArray(assets)) return null;
        const primary = assets.find(a => a.type === 'IMAGE' && a.is_primary);
        const first = assets.find(a => a.type === 'IMAGE');
        return primary?.url || first?.url || null;
    };

    const colors =
        colorDefs && colorDefs.length > 0
            ? colorDefs
                  .map((color: any) => {
                      const linkedSkus = colorSkuMap.get(color.id) || [];
                      const sku = linkedSkus[0] || null;
                      const assetImage = pickImageFromAssets(sku?.assets);
                      let cleanName = color.specs?.color || color.name;
                      if (!color.specs?.color) {
                          const brandName = item.brand?.name || '';
                          const modelName = item.parent?.name || '';
                          const variantName = item.name || '';

                          const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const regex = new RegExp(
                              `^\\s*(${[brandName, modelName, variantName]
                                  .filter(Boolean)
                                  .map(escapeRegExp)
                                  .join('|')})\\s+`,
                              'gi'
                          );

                          cleanName = color.name.replace(regex, '').trim();
                      }
                      const cleanId = slugify(cleanName);
                      const rawOffer = sku?.id ? marketOffers[sku.id] || 0 : 0;

                      return {
                          id: cleanId,
                          skuId: sku?.id,
                          name: cleanName,
                          hex:
                              color.specs?.hex_primary ||
                              color.specs?.hex_code ||
                              sku?.specs?.hex_primary ||
                              sku?.specs?.hex_code ||
                              '#000000',
                          image:
                              assetImage ||
                              sku?.image_url ||
                              sku?.specs?.primary_image ||
                              sku?.specs?.gallery?.[0] ||
                              color?.image_url ||
                              color?.specs?.image_url ||
                              null,
                          assets: sku?.assets || [], // PASS ASSETS FOR GALLERY
                          video: sku?.video_url || sku?.specs?.video_urls?.[0] || sku?.specs?.video_url || null,
                          pricingOverride: undefined,
                          dealerOffer: rawOffer,
                          isPrimary: Boolean(sku?.is_primary || color?.is_primary),
                      };
                  })
                  .sort((a: any, b: any) => Number(b.isPrimary) - Number(a.isPrimary))
            : (skus || [])
                  .map((sku: any) => {
                      let cleanName = sku.specs?.color || sku.name;
                      if (!sku.specs?.color) {
                          const brandName = item.brand?.name || '';
                          const modelName = item.parent?.name || '';
                          const variantName = item.name || '';

                          const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const regex = new RegExp(
                              `^\\s*(${[brandName, modelName, variantName]
                                  .filter(Boolean)
                                  .map(escapeRegExp)
                                  .join('|')})\\s+`,
                              'gi'
                          );

                          cleanName = sku.name.replace(regex, '').trim();
                      }

                      const cleanId = slugify(cleanName);
                      const rawOffer = marketOffers[sku.id] || 0;
                      const assetImage = pickImageFromAssets(sku?.assets);

                      return {
                          id: cleanId,
                          skuId: sku.id,
                          name: cleanName,
                          hex: sku.specs?.hex_primary || sku.specs?.hex_code || '#000000',
                          image:
                              assetImage ||
                              sku.image_url ||
                              sku.specs?.primary_image ||
                              sku.specs?.gallery?.[0] ||
                              null,
                          assets: sku.assets || [], // PASS ASSETS FOR GALLERY
                          video: sku.video_url || sku.specs?.video_urls?.[0] || sku.specs?.video_url || null,
                          pricingOverride: undefined,
                          dealerOffer: rawOffer,
                          isPrimary: Boolean(sku?.is_primary),
                      };
                  })
                  .sort((a: any, b: any) => Number(b.isPrimary) - Number(a.isPrimary));

    // SOT Rule §4.3: Do NOT fabricate id:'default'/skuId:'default' for active variant flow.
    // If no SKUs exist, colors stays empty — SystemPDPLogic will show unavailable state.
    // (Previously this pushed a synthetic default that leaked ₹0 pricing)

    const product = {
        id: item.id,
        make: item.brand?.name || resolvedParams.make,
        model: item.parent?.name || resolvedParams.model,
        variant: item.name,
        basePrice: Number(baseExShowroom),
        colors: colors,
        specs: {
            ...parentSpecs,
            ...item.specs,
            // Also pull variant specs from active SKU if not already present via SOT
            ...(variantSeed?.vehicle_variant ? flattenVariantSpecs(variantSeed.vehicle_variant) : {}),
        },
        tenant_id: winningDealerId, // Dealer tenant for quote creation
    };

    // 6. Accessories & Services
    const productMake = product.make;
    const productModel = product.model;
    const productVariant = product.variant;
    const currentBrandId = modelRow?.brand_id || null;
    const currentModelId = modelRow?.id || null;
    const currentVariantId = item.id || null;
    const currentCompatibilityVariantIds = [currentVariantId, ...allSkus.map((s: any) => s.id)].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessories = (accessoriesData || [])
        .filter((a: any) => {
            const rows = Array.isArray(a.__compat) ? a.__compat : [];
            const compatible = isAccessoryCompatible({
                compatibilityRows: rows,
                suitableFor: a.specs?.suitable_for,
                brand: productMake,
                model: productModel,
                variant: productVariant,
                brandId: currentBrandId,
                modelId: currentModelId,
                variantIds: currentCompatibilityVariantIds,
            });
            if (!compatible) return false;

            const rule = accessoryRules.get(a.id);
            if (rule && rule.isActive === false) return false;
            return true;
        })
        .map((a: any) => {
            const rule = accessoryRules.get(a.id);
            const offer = rule ? rule.offer : 0;
            const basePrice = Number(a.price_base) || 0;

            // Pricing logic for accessories:
            // offer_amount is a DELTA/adjustment to the MRP (price_base):
            //   - offer < 0: discount (e.g., MRP 850 + offer -551 = sell price 299)
            //   - offer > 0: surge/markup
            //   - offer = 0 or no rule: sell at MRP (no discount)
            // price_base > 0: this is the MRP (for strikethrough display)
            let mrp = basePrice;
            let sellPrice = basePrice; // default: sell = MRP (no discount)
            if (offer !== 0) {
                sellPrice = basePrice + offer; // delta applied to MRP
                if (sellPrice < 0) sellPrice = 0; // safety clamp
            }
            // If MRP not set, use sell price as MRP (no strikethrough)
            if (mrp === 0) mrp = sellPrice;
            // price = MRP (for strikethrough display), discountPrice = actual selling price

            const inclusionType =
                rule?.inclusion ||
                (bundleIdsForDealer.has(a.id) ? 'BUNDLE' : undefined) ||
                a.inclusion_type ||
                'OPTIONAL';
            const isMandatory = inclusionType === 'MANDATORY';

            let colorLabel = a.specs?.color || a.specs?.colour || a.specs?.finish || a.specs?.shade || '';
            let nameBase = a.name;

            if (!colorLabel) {
                const inferred = extractColorFromName(a.name);
                colorLabel = inferred.color;
                nameBase = inferred.baseName || a.name;
            } else {
                nameBase = stripColorFromName(a.name, colorLabel);
            }

            // Title Case for clean display (DB stores uppercase like "CRASH GUARD")
            const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

            const accessoryName = toTitle(nameBase || a.name);
            const displayName = [a.brand?.name, toTitle(a.name)].filter(Boolean).join(' ');
            const descriptionLabel = [accessoryName, colorLabel].filter(Boolean).join(' ');

            // Resolve product group from parent chain
            const parentVariant = accVariantMap.get(a.parent_id);
            const parentProduct = parentVariant ? accProductMap.get(parentVariant.parent_id) : null;
            const productGroupName = toTitle(parentProduct?.name || parentVariant?.name || accessoryName);
            const productGroupImage = parentProduct?.image_url || parentVariant?.image_url || null;
            const skuImage =
                a.image_url ||
                a.specs?.primary_image ||
                a.specs?.gallery?.[0] ||
                parentVariant?.image_url ||
                productGroupImage ||
                null;

            return {
                id: a.id,
                name: a.name,
                displayName: displayName,
                description: descriptionLabel,
                suitableFor: a.specs?.suitable_for || '',
                price: mrp,
                discountPrice: sellPrice,
                maxQty: a.specs?.max_qty || 1,
                isMandatory: isMandatory,
                inclusionType: inclusionType,
                category: a.category || 'OTHERS',
                brand: a.brand?.name || null,
                subCategory: null,
                productGroup: productGroupName,
                variantName: parentVariant?.name || '',
                unit: a.specs?.Unit || '',
                productGroupImage: productGroupImage,
                image: skuImage,
            };
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = (servicesData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        discountPrice: Number(s.discount_price),
        maxQty: s.max_qty,
        isMandatory: s.is_mandatory,
        durationMonths: s.duration_months,
    }));

    // 7. Resolve Finance Scheme (Persona-Based)
    let viewerContext: ViewerContext | undefined;
    const dealerSessionCookie = cookieStore.get('bmb_dealer_session')?.value;
    if (dealerSessionCookie) {
        try {
            const sessionData = JSON.parse(decodeURIComponent(dealerSessionCookie));
            if (sessionData?.mode === 'TEAM' && sessionData?.activeTenantId) {
                // Check if the session tenant is a BANK or DEALER
                const { data: sessionTenant } = await supabase
                    .from('id_tenants')
                    .select('type')
                    .eq('id', sessionData.activeTenantId)
                    .single();

                if (sessionTenant?.type === 'BANK') {
                    viewerContext = { persona: 'BANKER', tenantId: sessionData.activeTenantId };
                } else if (sessionTenant?.type === 'DEALER') {
                    viewerContext = { persona: 'DEALER' };
                }
            }
        } catch {
            // ignore parse errors
        }
    }
    const resolvedFinance = await resolveFinanceScheme(product.make, product.model, leadId, viewerContext);

    const jsonLd: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${product.make} ${product.model} ${product.variant}`.trim(),
        brand: product.make ? { '@type': 'Brand', name: product.make } : undefined,
        model: product.model || undefined,
        color: (product.colors as any)?.[0]?.name || undefined,
    };

    if (publishedPriceData?.ex_showroom_price) {
        jsonLd.offers = {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: Number(publishedPriceData.ex_showroom_price),
            availability: 'https://schema.org/InStock',
            url: canonicalPath,
        };
    }

    return (
        <>
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductClient
                product={product}
                makeParam={resolvedParams.make}
                modelParam={product.model}
                variantParam={product.variant}
                initialLocation={location}
                initialPrice={initialPricingSnapshot}
                insuranceRule={insuranceRule}
                registrationRule={effectiveRule} // Passing registration rule for client side calc
                initialAccessories={accessories}
                initialServices={services}
                initialFinance={
                    resolvedFinance
                        ? {
                              bank: {
                                  id: resolvedFinance.bank.id,
                                  name: resolvedFinance.bank.name,
                                  identity: resolvedFinance.bank.config?.identity,
                                  overview: resolvedFinance.bank.config?.overview,
                              },
                              scheme: resolvedFinance.scheme,
                              logic: resolvedFinance.logic, // Trace logic
                          }
                        : undefined
                }
                initialDealerId={winningDealerId}
                initialDevice={isMobile ? 'phone' : 'desktop'}
            />
        </>
    );
}
