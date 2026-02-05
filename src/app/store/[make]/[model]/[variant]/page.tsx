import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveLocation, resolveLocationByDistrict } from '@/utils/locationResolver';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';
import { cookies } from 'next/headers';
import { resolveFinanceScheme } from '@/utils/financeResolver';
import { BankPartner, BankScheme } from '@/types/bankPartner';
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

        families?.forEach(family => {
            const make = (family.brand as any)?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
            const model = family.slug || family.name.toLowerCase().replace(/\s+/g, '-');

            (family.variants as any[])?.forEach(variant => {
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
            index: !district && !dealer && !state && !studio, // Location/Dealer context is noindex
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
    const supabase = await createClient();
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

    // 2. Fetch Variant from Unified Catalog
    // We fetch by slug and ensure it's a VARIANT type
    // Construct potential slugs to search for
    const possibleSlugs = [
        resolvedParams.variant, // "drum"
        `${resolvedParams.model}-${resolvedParams.variant}`, // "jupiter-drum"
        `${resolvedParams.make}-${resolvedParams.model}-${resolvedParams.variant}`, // "tvs-jupiter-drum"
        `${resolvedParams.make}-${resolvedParams.model}-${resolvedParams.variant}`.toLowerCase(), // Ensure lower case
    ];

    const { data: variantItem, error } = await supabase
        .from('cat_items')
        .select(
            `
            id, name, slug, price_base, specs,
            brand:cat_brands(name, slug),
            parent:cat_items!parent_id(name, slug)
        `
        )
        .in('slug', possibleSlugs)
        .eq('type', 'VARIANT')
        .maybeSingle();

    if (!variantItem || error) {
        console.error('PDP Fetch Error:', error);
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
                        {error ? error.message : 'The requested configuration is currently unavailable in our catalog.'}
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

    const item = variantItem as unknown as CatalogItem;

    const makeSlug = (item.brand as any)?.slug || slugify(item.brand?.name || resolvedParams.make || '');
    const modelSlug = item.parent?.slug || slugify(item.parent?.name || resolvedParams.model || '');
    const rawVariantSlug = item.slug || slugify(item.name || resolvedParams.variant || '');
    let cleanVariantSlug = rawVariantSlug;

    if (rawVariantSlug?.startsWith(`${makeSlug}-${modelSlug}-`)) {
        cleanVariantSlug = rawVariantSlug.replace(`${makeSlug}-${modelSlug}-`, '');
    } else if (rawVariantSlug?.startsWith(`${modelSlug}-`)) {
        cleanVariantSlug = rawVariantSlug.replace(`${modelSlug}-`, '');
    } else if (rawVariantSlug?.startsWith(`${makeSlug}-`)) {
        cleanVariantSlug = rawVariantSlug.replace(`${makeSlug}-`, '');
    }

    if (!cleanVariantSlug) cleanVariantSlug = rawVariantSlug;

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
    // We need to know the SKU IDs of this variant to check if a dealer has an offer for THIS bike.
    const { data: skus } = await supabase
        .from('cat_items')
        .select('id, name, slug, specs, price_base')
        .eq('parent_id', item.id)
        .eq('type', 'SKU');

    // 2.6 Fetch Prices from cat_price_state (Authoritative Source)
    const skuIds = (skus || []).map((s: any) => s.id);
    let publishedPriceData: any = null;

    if (skuIds.length > 0) {
        const { data: priceRecords } = await supabase
            .from('cat_price_state')
            .select(
                `
                vehicle_color_id, 
                ex_showroom_price, 
                rto_total, 
                insurance_total, 
                on_road_price, 
                rto,
                insurance,
                rto_breakdown, 
                insurance_breakdown,
                state_code, 
                district,
                published_at
            `
            )
            .in('vehicle_color_id', skuIds)
            .eq('state_code', stateCode)
            .eq('district', 'ALL')
            .eq('is_active', true)
            .order('district', { ascending: false }); // State-level SOT (district = ALL)

        if (priceRecords && priceRecords.length > 0) {
            // Find the first valid published record
            publishedPriceData = priceRecords.find((p: any) => p.rto_total > 0) || priceRecords[0];
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

    // Fetch Accessories & Services
    // Only fetch SKU-type items (final products), not FAMILY/VARIANT hierarchy items
    const { data: accessoriesData } = await supabase
        .from('cat_items')
        .select('*, brand:cat_brands(name), template:cat_templates!inner(category, name)')
        .eq('template.category', 'ACCESSORY')
        .eq('type', 'SKU') // Only final SKUs, not FAMILY or VARIANT
        .eq('status', 'ACTIVE');

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
    const currentSkuIds = (skus || []).map((s: any) => s.id);
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
    const accessoryIds = (accessoriesData || []).map((a: any) => a.id);

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
    const colors = (skus || []).map((sku: any) => {
        // Derive clean color name
        // 1. Try specs.color
        // 2. Try stripping Variant Name from SKU Name
        let cleanName = sku.specs?.color || sku.name;
        if (!sku.specs?.color && sku.name.includes(item.name)) {
            // Remove common prefixes/suffixes to get just the color name
            cleanName = sku.name
                .replace(item.name, '')
                .replace(item.brand?.name || '', '')
                .replace(item.parent?.name || '', '')
                .trim();
        }

        // Derive clean ID (slug) for URL
        const cleanId = sku.specs?.color_slug || slugify(cleanName);

        // Dealer Offer Delta (positive = surge, negative = discount)
        // We use the filtered marketOffers map populated earlier
        const rawOffer = marketOffers[sku.id] || 0;

        return {
            id: cleanId, // Use clean slug as stable ID
            skuId: sku.id,
            name: cleanName,
            hex: sku.specs?.hex_primary || sku.specs?.hex_code || '#000000',
            image: sku.specs?.primary_image || sku.specs?.gallery?.[0] || null,
            video: sku.video_url || sku.specs?.video_urls?.[0] || sku.specs?.video_url || null,
            priceOverride: sku.price_base, // SKU might override price
            dealerOffer: rawOffer, // Inject Dealer Offer Delta
        };
    });

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
        });
    }

    const product = {
        id: item.id,
        make: item.brand?.name || resolvedParams.make,
        model: item.parent?.name || resolvedParams.model,
        variant: item.name,
        basePrice: Number(baseExShowroom),
        colors: colors,
        specs: item.specs,
    };

    // 6. Accessories & Services
    const productMake = product.make;
    const productModel = product.model;
    const productVariant = product.variant;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessories = (accessoriesData || [])
        .filter((a: any) => {
            const dealerRule = accessoryRules.get(a.id);

            // HYBRID LOGIC:
            // 1. If dealer has an ACTIVE rule for this accessory -> INCLUDE
            // 2. Otherwise, fall back to suitable_for compatibility check
            const hasDealerRule = dealerRule && dealerRule.isActive !== false;
            const matchesSuitability = matchesAccessoryCompatibility(
                a.specs?.suitable_for,
                productMake,
                productModel,
                productVariant
            );

            return hasDealerRule || matchesSuitability;
        })
        .map((a: any) => {
            const rule = accessoryRules.get(a.id);
            const offer = rule ? rule.offer : 0; // Negative for discount
            const basePrice = Number(a.price_base);
            // Effective price is Base + Offer (e.g. 2500 + (-2500) = 0)
            // Ensure strictly non-negative
            const discountPrice = Math.max(0, basePrice + offer);

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
            const displayName = [a.brand?.name, a.template?.name].filter(Boolean).join(' ');
            const descriptionLabel = [accessoryName, colorLabel].filter(Boolean).join(' ');

            return {
                id: a.id,
                name: a.name,
                displayName: displayName,
                description: descriptionLabel,
                suitableFor: a.specs?.suitable_for || '',
                price: basePrice,
                discountPrice: discountPrice,
                maxQty: 1,
                isMandatory: isMandatory,
                inclusionType: inclusionType,
                category: a.template?.category || 'OTHERS',
                brand: a.brand?.name || null,
                subCategory: a.template?.name || null,
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

    // 7. Resolve Finance Scheme
    const resolvedFinance = await resolveFinanceScheme(product.make, product.model, leadId);

    return (
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
    );
}
