import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveLocation } from '@/utils/locationResolver';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';
import { isMobileDevice } from '@/lib/utils/device';
import { cookies } from 'next/headers';
import { resolveFinanceScheme, ViewerContext } from '@/utils/financeResolver';
import { BankScheme } from '@/types/bankPartner';
import { getSitemapData } from '@/lib/server/sitemapFetcher';
import { isAccessoryCompatible } from '@/lib/catalog/accessoryCompatibility';
import { IDV_DEPRECIATION_RATE } from '@/lib/constants/pricingConstants';
import {
    resolveStoreContext,
    resolveModel,
    fetchModelSkus,
    fetchVehicleVariants,
    matchVariant,
    resolveActiveSkus,
    getDealerDelta,
    getPdpSnapshot,
    flattenVariantSpecs,
    buildGalleryAssets,
} from '@/lib/server/storeSot';
import { buildCanonicalLeadQuery } from '@/lib/marketplace/leadUrl';

type Props = {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
    searchParams: Promise<{
        color?: string;
        state?: string;
        pincode?: string;
        dealer?: string;
        studio?: string;
        leadId?: string;
        lead?: string;
        dealerSlug?: string;
        financeSlug?: string;
        quoteId?: string;
    }>;
};

type LeadContextMeta = {
    id: string;
    displayId: string | null;
    customerName: string | null;
    selectedDealerTenantId: string | null;
    preferredFinancierId: string | null;
    ownerTenantId: string | null;
};

async function resolveLeadReference(leadRef?: string | null): Promise<LeadContextMeta | null> {
    const candidate = String(leadRef || '').trim();
    if (!candidate) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);
    const query = adminClient
        .from('crm_leads')
        .select('id, display_id, customer_name, selected_dealer_tenant_id, owner_tenant_id')
        .limit(1);
    const { data } = isUuid
        ? await query.eq('id', candidate).maybeSingle()
        : await query.eq('display_id', candidate).maybeSingle();

    if (!data) return null;
    return {
        id: data.id,
        displayId: data.display_id || null,
        customerName: data.customer_name || null,
        selectedDealerTenantId: data.selected_dealer_tenant_id || null,
        preferredFinancierId: (data as any).preferred_financier_id || null,
        ownerTenantId: data.owner_tenant_id || null,
    };
}

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

const resolvePreferredSkuIdFromQuery = (queryColor: string | undefined, skus: any[]): string | null => {
    const q = String(queryColor || '')
        .trim()
        .toLowerCase();
    if (!q) return null;

    const exactId = skus.find(s => String(s?.id || '').toLowerCase() === q);
    if (exactId?.id) return String(exactId.id);

    const exactByFields = skus.find(s => {
        const candidates = [s?.slug, s?.name, s?.color_name, s?.colour?.name, s?.specs?.Color, s?.specs?.color]
            .filter(Boolean)
            .map((v: any) => String(v).trim().toLowerCase());
        return candidates.includes(q);
    });
    if (exactByFields?.id) return String(exactByFields.id);

    const qSlug = slugify(q);
    const bySlug = skus.find(s => {
        const candidates = [s?.slug, s?.name, s?.color_name, s?.colour?.name, s?.specs?.Color, s?.specs?.color]
            .filter(Boolean)
            .map((v: any) => slugify(String(v)));
        return candidates.includes(qSlug);
    });

    return bySlug?.id ? String(bySlug.id) : null;
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
    const { color, dealer, state, studio } = await searchParams;

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
            index: !dealer && !state && !studio && !color, // Noindex if contextual (location/dealer/color)
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

    // Soft Gate: PDP is public. Commercial actions are gated client-side via isAuthenticated prop.
    // Server resolves user only to pass auth state — no redirect for unauthenticated users.
    const authClient = await createClient();
    const {
        data: { user },
    } = await authClient.auth.getUser();
    const isAuthenticated = !!user;

    const supabase = adminClient;
    const cookieStore = await cookies(); // Access cookies
    const isMobile = await isMobileDevice(); // resolve device on server

    const leadRef = resolvedSearchParams.lead || resolvedSearchParams.leadId || null;
    const leadMeta = await resolveLeadReference(leadRef);
    const resolvedLeadId = leadMeta?.id || null;

    // 1. Resolve Pricing Context (Primary Dealer Only)
    const pricingContext = await resolveStoreContext({
        leadId: resolvedLeadId,
        dealerId: resolvedSearchParams.dealer,
        state: resolvedSearchParams.state,
        studio: resolvedSearchParams.studio,
    });

    const stateCode = pricingContext.stateCode || 'MH';
    let location: any = {
        state: resolvedSearchParams.state || 'MAHARASHTRA',
        stateCode,
    };
    const pincodeFromQuery = resolvedSearchParams.pincode;
    const locationCookie = cookieStore.get('bkmb_user_pincode')?.value;
    let pincodeForLookup = String(pincodeFromQuery || '').trim();
    if (!pincodeForLookup && locationCookie) {
        try {
            const parsed = JSON.parse(locationCookie);
            pincodeForLookup = String(parsed?.pincode || '').trim();
            if (!location?.state && parsed?.state) {
                location.state = String(parsed.state);
            }
            if (!location?.stateCode && parsed?.stateCode) {
                location.stateCode = String(parsed.stateCode);
            }
        } catch {
            // ignore malformed cookie
        }
    }
    if (/^\d{6}$/.test(pincodeForLookup)) {
        const resolvedByPincode = await resolveLocation(pincodeForLookup);
        if (resolvedByPincode) {
            location = resolvedByPincode;
        } else {
            location = {
                ...location,
                pincode: pincodeForLookup,
            };
        }
    }

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

    // Normalize Supabase errors: an empty `{}` object is truthy but has no message.
    // Only treat as a real error when the error has an actual message string.
    const normalizedSkuError = skuError && typeof skuError.message === 'string' && skuError.message ? skuError : null;
    let fetchError: any = normalizedSkuError || modelError;
    if (!resolvedVariant) fetchError = fetchError || { message: 'No matching variant in catalog' };

    let sotPricingSnapshot: any = null;
    const preferredSkuId = resolvePreferredSkuIdFromQuery(resolvedSearchParams.color, activeVariantSkus);

    try {
        const sotSnap = await getPdpSnapshot({
            make: resolvedParams.make,
            model: resolvedParams.model,
            variant: resolvedParams.variant,
            stateCode,
            preferredSkuId,
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
            fetchError = fetchError || { message: 'PDP SOT snapshot unavailable' };
        }
    } catch (err) {
        console.error('[PDP_SOT] snapshot fetch failed', err);
        fetchError = fetchError || { message: 'Failed to load PDP snapshot' };
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
        const modelColorFallback =
            normalizedSkus.find((candidate: any) => {
                const sameColor =
                    String(candidate?.colour?.name || candidate?.color_name || '')
                        .trim()
                        .toUpperCase() ===
                    String(sku?.colour?.name || sku?.color_name || '')
                        .trim()
                        .toUpperCase();
                if (!sameColor) return false;
                return Boolean(candidate?.primary_image || candidate?.gallery_img_1);
            }) || null;

        // Build assets via SOT hierarchy: SKU → Colour → Variant → Model (if media_shared)
        const skuWithModel = { ...sku, model: modelRow };
        const assets = buildGalleryAssets(skuWithModel);

        // Resolve primary image through inheritance chain
        const resolvedImage =
            sku.primary_image ||
            sku.gallery_img_1 ||
            modelColorFallback?.primary_image ||
            modelColorFallback?.gallery_img_1 ||
            (sku.colour?.primary_image && sku.colour?.media_shared !== false ? sku.colour.primary_image : null) ||
            (sku.vehicle_variant?.primary_image && sku.vehicle_variant?.media_shared !== false
                ? sku.vehicle_variant.primary_image
                : null) ||
            (modelRow?.primary_image && modelRow?.media_shared !== false ? modelRow.primary_image : null) ||
            null;

        return {
            id: sku.id,
            name: sku.name,
            slug: sku.slug,
            price_base: Number(sku.price_base || 0),
            is_primary: Boolean(sku.is_primary),
            image_url: resolvedImage,
            assets,
            parent_id: sku.id,
            zoom_factor: sku.zoom_factor ?? null,
            is_flipped: sku.is_flipped ?? false,
            offset_x: sku.offset_x ?? 0,
            offset_y: sku.offset_y ?? 0,
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

    // 2.6 Pricing snapshot comes from canonical PDP SOT
    const skuIds = allSkus.map((s: any) => s.id);
    const publishedPriceData: any = sotPricingSnapshot;

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

    const { data: servicesData } = await (supabase as any).from('cat_services').select('*').eq('status', 'ACTIVE');

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
                state_code: rec.state_code,
            },
            meta: {
                vehicle_color_id: rec.vehicle_color_id || rec.sku_id || firstSkuId,
                engine_cc: Number(modelRow?.engine_cc || 0),
                idv: Math.round(asNumber(rec.ex_showroom_price) * IDV_DEPRECIATION_RATE),
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

    // Dealer resolution is NEVER done server-side.
    // Client-side useSystemDealerContext RPC picks best offer within 200km radius.
    let winningDealerId: string | null = null;
    const leadId = resolvedLeadId;
    let accessoryRules: Map<string, { offer: number; inclusion: string; isActive: boolean }> = new Map();
    let marketOffers: Record<string, number> = {};
    let bundleIdsForDealer: Set<string> = new Set();

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
        // Fetch Dealer Info for Metadata
        const tenantRes = await supabase
            .from('id_tenants')
            .select('name, studio_id')
            .eq('id', winningDealerId)
            .single();

        const dealerName = tenantRes.data?.name || 'Assigned Dealer';
        const dealerStudioId = (tenantRes.data as any)?.studio_id || null;

        const winningOffer = Number(marketOffers[firstSkuId] || 0);

        serverPricing.dealer = {
            id: winningDealerId,
            name: dealerName,
            studio_id: dealerStudioId,
            offer: winningOffer,
            is_serviceable: true,
        };

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

    const HONDA_ACTIVA_VIDEO_URLS = [
        'https://www.youtube.com/watch?v=RZcki0JVASQ',
        'https://www.youtube.com/watch?v=4TFu_oDpTNI',
        'https://www.youtube.com/watch?v=FGyvYjxWFtQ',
    ];
    const makeName = String(item.brand?.name || resolvedParams.make || '').toLowerCase();
    const modelName = String(item.parent?.name || resolvedParams.model || '').toLowerCase();
    const isHondaActiva = makeName.includes('honda') && modelName.includes('activa');
    const normalizeVideoUrls = (values: any[]): string[] =>
        Array.from(new Set(values.map(v => String(v || '').trim()).filter(v => v.length > 0)));
    const collectVideoUrls = (node: any): string[] => {
        if (!node || typeof node !== 'object') return [];
        return normalizeVideoUrls([
            node.video_url_1,
            node.video_url_2,
            node.video_url,
            ...(Array.isArray(node.video_urls) ? node.video_urls : []),
            ...(Array.isArray(node.specs?.video_urls) ? node.specs.video_urls : []),
            node.specs?.video_url,
        ]);
    };
    const modelLevelVideoUrls = collectVideoUrls(modelRow);
    const resolveVideoUrls = (sku: any): string[] => {
        const modelUrls = normalizeVideoUrls([
            ...(modelRow?.media_shared === false ? [] : modelLevelVideoUrls),
            ...(isHondaActiva ? HONDA_ACTIVA_VIDEO_URLS : []),
        ]);
        const variantUrls = sku?.vehicle_variant?.media_shared === false ? [] : collectVideoUrls(sku?.vehicle_variant);
        const colourUrls = sku?.colour?.media_shared === false ? [] : collectVideoUrls(sku?.colour);
        const skuUrls = collectVideoUrls(sku);
        return normalizeVideoUrls([...modelUrls, ...variantUrls, ...colourUrls, ...skuUrls]);
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

                      const videoUrls = resolveVideoUrls(sku);

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
                          video: videoUrls[0] || null,
                          videoUrls,
                          pricingOverride: undefined,
                          dealerOffer: rawOffer,
                          isPrimary: Boolean(sku?.is_primary || color?.is_primary),
                          zoomFactor: sku?.zoom_factor ?? null,
                          isFlipped: sku?.is_flipped ?? false,
                          offsetX: sku?.offset_x ?? 0,
                          offsetY: sku?.offset_y ?? 0,
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

                      const videoUrls = resolveVideoUrls(sku);

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
                          video: videoUrls[0] || null,
                          videoUrls,
                          pricingOverride: undefined,
                          dealerOffer: rawOffer,
                          isPrimary: Boolean(sku?.is_primary),
                          zoomFactor: sku?.zoom_factor ?? null,
                          isFlipped: sku?.is_flipped ?? false,
                          offsetX: sku?.offset_x ?? 0,
                          offsetY: sku?.offset_y ?? 0,
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

            // Simplified inclusion rule:
            // - Final sell price == 0 => inclusive
            // - Final sell price  > 0 => exclusive
            const isInclusive = sellPrice === 0;
            const inclusionType = isInclusive ? 'INCLUSIVE' : 'EXCLUSIVE';
            const isMandatory = isInclusive;

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
    if (!leadId && resolvedSearchParams.financeSlug) {
        const { data: bankBySlug } = await supabase
            .from('id_tenants')
            .select('id')
            .eq('type', 'BANK')
            .ilike('slug', String(resolvedSearchParams.financeSlug))
            .maybeSingle();
        if (bankBySlug?.id) {
            viewerContext = { persona: 'BANKER', tenantId: String(bankBySlug.id) };
        }
    }
    // Marketplace always uses CUSTOMER persona. DEALER/BANKER context only applies in CRM app.
    const resolvedFinance = await resolveFinanceScheme(product.make, product.model, leadId ?? undefined, viewerContext);

    const tenantIdsForMeta = Array.from(
        new Set(
            [
                winningDealerId || null,
                resolvedFinance?.bank?.id || null,
                leadMeta?.ownerTenantId || null,
                leadMeta?.selectedDealerTenantId || null,
                leadMeta?.preferredFinancierId || null,
            ].filter(Boolean)
        )
    ) as string[];
    const tenantMetaMap = new Map<string, { name: string; slug: string | null; type: string | null }>();
    if (tenantIdsForMeta.length > 0) {
        const { data: tenantRows } = await supabase
            .from('id_tenants')
            .select('id, name, slug, type')
            .in('id', tenantIdsForMeta);
        (tenantRows || []).forEach((row: any) => {
            tenantMetaMap.set(String(row.id), {
                name: String(row.name || ''),
                slug: row.slug ? String(row.slug) : null,
                type: row.type ? String(row.type) : null,
            });
        });
    }

    if (leadMeta) {
        const canonicalLead = leadMeta.displayId || leadMeta.id;
        const canonicalDealerSlug = winningDealerId ? tenantMetaMap.get(winningDealerId)?.slug || null : null;
        const canonicalFinanceSlug = resolvedFinance?.bank?.id
            ? tenantMetaMap.get(resolvedFinance.bank.id)?.slug || null
            : null;
        const currentLead = resolvedSearchParams.lead || null;
        const currentDealerSlug = resolvedSearchParams.dealerSlug || null;
        const currentFinanceSlug = resolvedSearchParams.financeSlug || null;

        const normalized = buildCanonicalLeadQuery({
            current: resolvedSearchParams as Record<string, string | undefined>,
            canonicalLead,
            canonicalDealerSlug,
            canonicalFinanceSlug,
        });
        if (normalized.changed) redirect(`?${normalized.params.toString()}`);
    }

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
                isAuthenticated={isAuthenticated}
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
                leadMeta={
                    leadMeta
                        ? {
                              id: leadMeta.id,
                              displayId: leadMeta.displayId,
                              customerName: leadMeta.customerName,
                              ownerTenantName: leadMeta.ownerTenantId
                                  ? tenantMetaMap.get(leadMeta.ownerTenantId)?.name || null
                                  : null,
                              leadDealerId: leadMeta.selectedDealerTenantId,
                              leadDealerName: leadMeta.selectedDealerTenantId
                                  ? tenantMetaMap.get(leadMeta.selectedDealerTenantId)?.name || null
                                  : null,
                              leadFinancerId: leadMeta.preferredFinancierId,
                              leadFinancerName: leadMeta.preferredFinancierId
                                  ? tenantMetaMap.get(leadMeta.preferredFinancierId)?.name || null
                                  : null,
                          }
                        : undefined
                }
                initialDevice={isMobile ? 'phone' : 'desktop'}
            />
        </>
    );
}
