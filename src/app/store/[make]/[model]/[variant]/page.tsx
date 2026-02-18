import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveLocation, resolveLocationByDistrict } from '@/utils/locationResolver';
import { adminClient } from '@/lib/supabase/admin';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';
import { cookies } from 'next/headers';
import { resolveFinanceScheme, ViewerContext } from '@/utils/financeResolver';
import { BankScheme } from '@/types/bankPartner';
import { resolvePricingContext } from '@/lib/server/pricingContext';
import { getSitemapData } from '@/lib/server/sitemapFetcher';

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

const matchesAccessoryCompatibility = (
    suitableFor: string | null | undefined,
    brand: string,
    model: string,
    variant: string
) => {
    // STRICT: Accessories MUST have explicit suitability tags.
    // If no suitability is defined, accessory is NOT shown.
    // Only accessories tagged with Universal/All OR matching brand/model/variant are shown.
    const suitabilityRaw = Array.isArray(suitableFor) ? suitableFor.join(',') : suitableFor;
    if (!suitabilityRaw || suitabilityRaw.trim() === '') return false;

    const tags = suitabilityRaw
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    if (tags.length === 0) return false; // No valid tags = excluded

    const brandNorm = normalizeSuitabilityTag(brand || '');
    const modelNorm = normalizeSuitabilityTag(model || '');
    const variantNorm = normalizeSuitabilityTag(variant || '');

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
        const normalized = normalizeSuitabilityTag(tag);
        if (!normalized) return false;

        if (normalized.includes('universal') || normalized === 'all') {
            return true;
        }

        if (normalized.includes('all models')) {
            return Boolean(brandNorm && normalized.includes(brandNorm));
        }

        if (normalized.includes('all variants')) {
            return Boolean(brandNorm && modelNorm && normalized.includes(brandNorm) && normalized.includes(modelNorm));
        }

        if (brandNorm && normalized.startsWith(brandNorm) && normalized.includes('all models')) return true;
        if (matchKeys.has(normalized)) return true;

        return false;
    });
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
    const pricingContext = await resolvePricingContext({
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

    console.log('PDP Debug: Pricing Context:', pricingContext);

    // 2. Fetch Variant + SKUs from V2 catalog tables
    const { data: modelRows, error: modelError } = await (supabase as any)
        .from('cat_models')
        .select('id, brand_id, name, slug, brand:cat_brands!brand_id(name, slug), fuel_type, engine_cc, status')
        .eq('status', 'ACTIVE');

    const modelCandidates = (modelRows || []).filter((m: any) => {
        const modelSlug = String(m.slug || '');
        const modelNameSlug = slugify(String(m.name || ''));
        const brandSlug = String(m.brand?.slug || '');
        const brandNameSlug = slugify(String(m.brand?.name || ''));
        const modelMatch =
            modelSlug === resolvedParams.model ||
            modelNameSlug === resolvedParams.model ||
            modelSlug.endsWith(`-${resolvedParams.model}`);
        const brandMatch =
            brandSlug === resolvedParams.make || brandNameSlug === resolvedParams.make || resolvedParams.make === '';
        return modelMatch && brandMatch;
    });

    const modelRow = modelCandidates[0] || null;

    const { data: modelSkus, error: skuError } = modelRow?.id
        ? await (supabase as any)
              .from('cat_skus')
              .select(
                  `
                id,
                name,
                slug,
                sku_type,
                price_base,
                is_primary,
                primary_image,
                color_name,
                hex_primary,
                hex_secondary,
                finish,
                colour_id,
                vehicle_variant_id,
                accessory_variant_id,
                service_variant_id,
                vehicle_variant:cat_variants_vehicle!vehicle_variant_id(id, name, slug, status),
                accessory_variant:cat_variants_accessory!accessory_variant_id(id, name, slug, status),
                service_variant:cat_variants_service!service_variant_id(id, name, slug, status),
                assets:cat_assets!item_id(id, type, url, is_primary, position)
            `
              )
              .eq('model_id', modelRow.id)
              .eq('status', 'ACTIVE')
        : ({ data: null, error: modelError } as any);

    const possibleVariantSlugs = new Set([
        resolvedParams.variant,
        `${resolvedParams.model}-${resolvedParams.variant}`,
        `${resolvedParams.make}-${resolvedParams.model}-${resolvedParams.variant}`,
    ]);

    const normalizedSkus = (modelSkus || []).map((sku: any) => {
        const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant;
        return {
            ...sku,
            variant,
            variant_slug: variant?.slug,
            variant_name: variant?.name,
            variant_id: variant?.id,
        };
    });

    const variantSkus = normalizedSkus.filter((sku: any) => {
        const slug = String(sku.variant_slug || '');
        if (!slug) return false;
        return (
            possibleVariantSlugs.has(slug) ||
            slug.endsWith(`-${resolvedParams.variant}`) ||
            slugify(String(sku.variant_name || '')) === resolvedParams.variant
        );
    });

    const { data: vehicleVariants } = modelRow?.id
        ? await (supabase as any)
              .from('cat_variants_vehicle')
              .select('id, name, slug, status')
              .eq('model_id', modelRow.id)
              .eq('status', 'ACTIVE')
        : ({ data: [] } as any);

    const matchedVariantRow =
        (vehicleVariants || []).find((v: any) => {
            const slug = String(v.slug || '');
            const nameSlug = slugify(String(v.name || ''));
            return (
                possibleVariantSlugs.has(slug) ||
                slug.endsWith(`-${resolvedParams.variant}`) ||
                nameSlug === resolvedParams.variant
            );
        }) || null;

    let activeVariantSkus =
        variantSkus.length > 0
            ? variantSkus
            : matchedVariantRow
              ? normalizedSkus.filter(
                    (sku: any) => String(sku.vehicle_variant_id || '') === String(matchedVariantRow.id)
                )
              : normalizedSkus;

    if (activeVariantSkus.length === 0 && matchedVariantRow?.id) {
        const { data: variantScopedSkus } = await (supabase as any)
            .from('cat_skus')
            .select(
                `
                id,
                name,
                slug,
                sku_type,
                price_base,
                is_primary,
                primary_image,
                color_name,
                hex_primary,
                hex_secondary,
                finish,
                colour_id,
                vehicle_variant_id,
                accessory_variant_id,
                service_variant_id,
                vehicle_variant:cat_variants_vehicle!vehicle_variant_id(id, name, slug, status),
                accessory_variant:cat_variants_accessory!accessory_variant_id(id, name, slug, status),
                service_variant:cat_variants_service!service_variant_id(id, name, slug, status),
                assets:cat_assets!item_id(id, type, url, is_primary, position)
            `
            )
            .eq('vehicle_variant_id', matchedVariantRow.id)
            .eq('status', 'ACTIVE');

        activeVariantSkus = (variantScopedSkus || []).map((sku: any) => {
            const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant;
            return {
                ...sku,
                variant,
                variant_slug: variant?.slug,
                variant_name: variant?.name,
                variant_id: variant?.id,
            };
        });
    }
    const variantSeed = activeVariantSkus[0] || null;

    const resolvedVariant =
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
                      engine_cc: modelRow?.engine_cc,
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

    if (!resolvedVariant) {
        console.error('PDP Fetch Error:', fetchError);
        return (
            <div className="min-h-screen flex items-center justify-center bg-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black text-white p-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="relative z-10 glass-panel border border-white/10 p-12 rounded-[3rem] shadow-2xl max-w-lg mx-auto backdrop-blur-xl">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
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
                    <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-white">
                        PRODUCT <span className="text-red-500">NOT FOUND</span>
                    </h1>
                    <p className="text-slate-400 uppercase tracking-widest font-bold text-xs leading-relaxed">
                        {fetchError
                            ? fetchError.message
                            : 'The requested configuration is currently unavailable in our catalog.'}
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <a
                            href="/store"
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
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
        engine_cc: modelRow?.engine_cc,
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
    const colorSkus: any[] = activeVariantSkus.map((sku: any) => ({
        id: sku.id,
        name: sku.name,
        slug: sku.slug,
        price_base: Number(sku.price_base || 0),
        is_primary: Boolean(sku.is_primary),
        image_url: sku.primary_image || null,
        assets: sku.assets || [],
        parent_id: sku.id,
        specs: {
            Color: sku.color_name || sku.name,
            color: sku.color_name || sku.name,
            hex_primary: sku.hex_primary,
            hex_secondary: sku.hex_secondary,
            finish: sku.finish,
        },
    }));

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

    // 2.6 Fetch Prices from canonical state pricing table
    const skuIds = allSkus.map((s: any) => s.id);
    let publishedPriceData: any = null;
    if (skuIds.length > 0) {
        // Authoritative SOT for MH: dedicated state table with columns
        const { data: mhRows } = await (supabase as any)
            .from('cat_price_state_mh')
            .select(
                `
                    sku_id, state_code,
                    ex_showroom, ex_showroom_basic:ex_factory, ex_showroom_gst_amount:ex_factory_gst_amount, ex_showroom_total:ex_showroom, gst_rate, hsn_code,
                    on_road_price,
                    rto_default_type,
                    rto_registration_fee_state, rto_registration_fee_bh, rto_registration_fee_company,
                    rto_smartcard_charges_state, rto_smartcard_charges_bh, rto_smartcard_charges_company,
                    rto_postal_charges_state, rto_postal_charges_bh, rto_postal_charges_company,
                    rto_roadtax_rate_state, rto_roadtax_rate_bh, rto_roadtax_rate_company,
                    rto_roadtax_amount_state, rto_roadtax_amount_bh, rto_roadtax_amount_company,
                    rto_roadtaxcess_rate_state:rto_roadtax_cess_rate_state, rto_roadtaxcess_rate_bh:rto_roadtax_cess_rate_bh, rto_roadtaxcess_rate_company:rto_roadtax_cess_rate_company,
                    rto_roadtaxcessamount_state:rto_roadtax_cess_amount_state, rto_roadtaxcessamount_bh:rto_roadtax_cess_amount_bh, rto_roadtaxcessamount_company:rto_roadtax_cess_amount_company,
                    rto_total_state, rto_total_bh, rto_total_company,
                    ins_od_base:ins_own_damage_premium_amount, ins_od_total:ins_own_damage_total_amount, ins_tp_base:ins_liability_only_premium_amount, ins_tp_total:ins_liability_only_total_amount,
                    ins_sum_mandatory_insurance, ins_sum_mandatory_insurance_gst_amount, ins_total:ins_gross_premium, ins_gst_rate,
                    addon_pa_amount:addon_personal_accident_cover_amount, addon_pa_gstamount:addon_personal_accident_cover_gst_amount, addon_pa_total:addon_personal_accident_cover_total_amount,
                    published_at, updated_at
                `
            )
            .in('sku_id', skuIds)
            .eq('state_code', stateCode)
            .order('updated_at', { ascending: false });

        const matchingRow = (mhRows || []).find((row: any) => Number(row.rto_total_state) > 0);
        const priceRow = matchingRow || (mhRows || [])[0];

        if (priceRow) {
            publishedPriceData = {
                vehicle_color_id: priceRow.sku_id,
                ex_showroom_price: Number(priceRow.ex_showroom) || 0,
                rto_total: Number(priceRow.rto_total_state) || 0,
                insurance_total: Number(priceRow.ins_total) || 0,
                on_road_price: Number(priceRow.on_road_price) || 0,
                rto: {
                    STATE: { total: Number(priceRow.rto_total_state) },
                    BH: { total: Number(priceRow.rto_total_bh) },
                    COMPANY: { total: Number(priceRow.rto_total_company) },
                    default: priceRow.rto_default_type || 'STATE',
                },
                insurance: {
                    base_total:
                        Number(priceRow.ins_total || 0) ||
                        Number(priceRow.ins_sum_mandatory_insurance || 0) +
                            Number(priceRow.ins_sum_mandatory_insurance_gst_amount || 0),
                    od: { total: Number(priceRow.ins_od_total) },
                    tp: { total: Number(priceRow.ins_tp_total) },
                    pa: Number(priceRow.addon_pa_total ?? 0),
                },
                state_code: stateCode,
                district: 'ALL',
                published_at: priceRow.published_at,
            };
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
    const { data: suitableForRows } =
        accessoryIds.length > 0
            ? await (supabase as any)
                  .from('cat_suitable_for')
                  .select('sku_id, target_brand_id, target_model_id, target_variant_id')
                  .in('sku_id', accessoryIds)
            : ({ data: [] } as any);

    const suitableForMap = new Map<string, any[]>();
    (suitableForRows || []).forEach((row: any) => {
        if (!suitableForMap.has(row.sku_id)) suitableForMap.set(row.sku_id, []);
        suitableForMap.get(row.sku_id)!.push(row);
    });

    const accessoriesData = (accessorySkus || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        price_base: a.price_base,
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
    const baseExShowroom = publishedPriceData?.ex_showroom_price || item.price_base || 0;
    let serverPricing: any = null;

    if (firstSkuId && publishedPriceData && publishedPriceData.rto_total > 0) {
        const rec = publishedPriceData;

        // SOT Phase 3: Use new JSON columns if available, fallback to legacy
        const rtoJsonData = rec.rto && typeof rec.rto === 'object' && rec.rto.STATE !== undefined ? rec.rto : null;
        const insJsonData =
            rec.insurance && typeof rec.insurance === 'object' && rec.insurance.base_total !== undefined
                ? rec.insurance
                : null;

        // Build RTO breakdown from JSON or legacy
        const rtoData = rtoJsonData
            ? [{ label: 'RTO Total', amount: Number(rtoJsonData.STATE || 0) }]
            : typeof rec.rto_breakdown === 'object' && rec.rto_breakdown
              ? Object.entries(rec.rto_breakdown).map(([label, amount]) => ({ label, amount: Number(amount) }))
              : [];

        // Build Insurance breakdown from JSON or legacy
        const insData = insJsonData
            ? [
                  { label: 'OD Premium', amount: Number(insJsonData.od || 0), componentId: 'od' },
                  { label: 'TP Premium', amount: Number(insJsonData.tp || 0), componentId: 'tp' },
                  {
                      label: 'GST',
                      amount: Math.round(
                          Number(insJsonData.base_total || 0) -
                              Number(insJsonData.od || 0) -
                              Number(insJsonData.tp || 0)
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
            ex_showroom: parseFloat(rec.ex_showroom_price),
            // SOT Phase 3: Include full rto JSON for client hooks
            rto: rtoJsonData || {
                STATE: parseFloat(rec.rto_total),
                BH: null,
                COMPANY: null,
                default: 'STATE',
                total: parseFloat(rec.rto_total),
                type: 'STATE',
                breakdown: rtoData,
            },
            // SOT Phase 3: Include full insurance JSON for client hooks
            insurance: insJsonData || {
                od: Number((rec.insurance_breakdown as any)?.odPremium || 0),
                tp: Number((rec.insurance_breakdown as any)?.tpPremium || 0),
                gst_rate: 18,
                base_total: parseFloat(rec.insurance_total),
                addons: [],
                total: parseFloat(rec.insurance_total),
                breakdown: insData,
            },
            // Legacy fields for backward compat
            rto_breakdown: rtoData,
            insurance_breakdown: insData,
            final_on_road: parseFloat(rec.on_road_price),
            location: {
                district: rec.district,
                state_code: rec.state_code,
            },
            source: 'PUBLISHED_CAT_PRICES',
        };
    }
    let initialPricingSnapshot = serverPricing
        ? {
              exShowroom: serverPricing.ex_showroom ?? baseExShowroom,
              rto: serverPricing?.rto?.total ?? 0,
              insurance: serverPricing?.insurance?.total ?? 0,
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

    // Fetch dealer pricing rules for vehicle SKUs
    const currentSkuIds = allSkus.map((s: any) => s.id);
    if (winningDealerId && currentSkuIds.length > 0) {
        const { data: vehicleRules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id, offer_amount')
            .in('vehicle_color_id', currentSkuIds)
            .eq('tenant_id', winningDealerId)
            .eq('state_code', stateCode)
            .eq('is_active', true);

        if (vehicleRules) {
            vehicleRules.forEach((r: any) => {
                marketOffers[r.vehicle_color_id] = Number(r.offer_amount);
            });
        }
    }

    // Bundle inclusion from dealer rules
    if (winningDealerId) {
        const { data: bundleRules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id')
            .eq('tenant_id', winningDealerId)
            .eq('state_code', stateCode)
            .eq('inclusion_type', 'BUNDLE');

        bundleRules?.forEach((r: any) => {
            if (r.vehicle_color_id) bundleIdsForDealer.add(r.vehicle_color_id);
        });
    }
    // 3.5 Fetch Accessory Rules (Dealer Pricing)
    // NOW VALID: We use the winningDealerId to fetch specific rules
    let accessoryRules: Map<string, { offer: number; inclusion: string; isActive: boolean }> = new Map();

    if (accessoryIds.length > 0 && winningDealerId) {
        const { data: rules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
            .in('vehicle_color_id', accessoryIds)
            .eq('tenant_id', winningDealerId) // STRICT DEALER MATCH
            .eq('state_code', stateCode);

        rules?.forEach((r: any) => {
            accessoryRules.set(r.vehicle_color_id, {
                offer: Number(r.offer_amount),
                inclusion: r.inclusion_type,
                isActive: r.is_active,
            });
        });
        console.log('PDP Debug: Accessory Rules loaded:', accessoryRules.size, 'for dealer:', winningDealerId);
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
                          video: sku?.video_url || sku?.specs?.video_urls?.[0] || sku?.specs?.video_url || null,
                          priceOverride: sku?.price_base,
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
                          video: sku.video_url || sku.specs?.video_urls?.[0] || sku.specs?.video_url || null,
                          priceOverride: sku.price_base,
                          dealerOffer: rawOffer,
                          isPrimary: Boolean(sku?.is_primary),
                      };
                  })
                  .sort((a: any, b: any) => Number(b.isPrimary) - Number(a.isPrimary));

    // If no SKUs, make a default One
    if (colors.length === 0) {
        colors.push({
            id: 'default',
            skuId: 'default',
            name: 'Standard',
            hex: '#000000',
            image: null,
            video: null,
            priceOverride: null,
            dealerOffer: 0,
            isPrimary: true,
        });
    }

    const product = {
        id: item.id,
        make: item.brand?.name || resolvedParams.make,
        model: item.parent?.name || resolvedParams.model,
        variant: item.name,
        basePrice: Number(baseExShowroom),
        colors: colors,
        specs: { ...parentSpecs, ...item.specs },
        tenant_id: winningDealerId, // Dealer tenant for quote creation
    };

    // 6. Accessories & Services
    const productMake = product.make;
    const productModel = product.model;
    const productVariant = product.variant;
    const currentBrandId = modelRow?.brand_id || null;
    const currentModelId = modelRow?.id || null;
    const currentVariantId = item.id || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessories = (accessoriesData || [])
        .filter((a: any) => {
            // Canonical suitability from cat_suitable_for; fallback to legacy text suitability matcher.
            const rows = Array.isArray(a.__compat) ? a.__compat : [];
            if (rows.length > 0) {
                return rows.some((r: any) => {
                    const brandOk = !r.target_brand_id || r.target_brand_id === currentBrandId;
                    const modelOk = !r.target_model_id || r.target_model_id === currentModelId;
                    const variantOk = !r.target_variant_id || r.target_variant_id === currentVariantId;
                    return brandOk && modelOk && variantOk;
                });
            }
            return matchesAccessoryCompatibility(a.specs?.suitable_for, productMake, productModel, productVariant);
        })
        .map((a: any) => {
            const rule = accessoryRules.get(a.id);
            const offer = rule ? rule.offer : 0;
            const basePrice = Number(a.price_base) || 0;

            // Pricing logic for accessories:
            // - offer < 0: abs(offer) IS the sell price (dealer commercial stores sell price as negative)
            // - offer > 0: offer IS the sell price (e.g. helmets at ₹499)
            // - offer = 0: no dealer pricing, fall back to price_base
            // - price_base > 0: this is the MRP (for strikethrough display)
            let mrp = basePrice;
            let sellPrice = basePrice; // default: sell = MRP (no discount)
            if (offer < 0) {
                sellPrice = Math.abs(offer);
            } else if (offer > 0) {
                sellPrice = offer;
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

            const accessoryName = nameBase || a.name;
            const displayName = [a.brand?.name, a.name].filter(Boolean).join(' ');
            const descriptionLabel = [accessoryName, colorLabel].filter(Boolean).join(' ');

            // Resolve product group from parent chain
            const parentVariant = accVariantMap.get(a.parent_id);
            const parentProduct = parentVariant ? accProductMap.get(parentVariant.parent_id) : null;
            const productGroupName = parentProduct?.name || parentVariant?.name || accessoryName;
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
            />
        </>
    );
}
