import React from 'react';
import { Metadata } from 'next';
import { resolveLocation } from '@/utils/locationResolver';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';
import { cookies } from 'next/headers';
import { resolveFinanceScheme } from '@/utils/financeResolver';
import { BankPartner, BankScheme } from '@/types/bankPartner';

type Props = {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
    searchParams: Promise<{
        color?: string;
        pincode?: string;
        dealer?: string;
        leadId?: string;
    }>;
};

// Types for New Schema
interface CatalogItem {
    id: string;
    name: string;
    slug: string;
    price_base: number;
    specs: any;
    brand: { name: string };
    parent: { name: string; slug: string }; // The Model
}

const normalizeSuitabilityTag = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const COLOR_WORDS = new Set([
    'black', 'white', 'silver', 'grey', 'gray', 'red', 'blue', 'green', 'yellow',
    'orange', 'gold', 'brown', 'maroon', 'navy', 'beige', 'cream', 'copper',
    'bronze', 'teal', 'purple', 'pink'
]);

const COLOR_MODIFIERS = new Set([
    'matte', 'gloss', 'glossy', 'metallic', 'pearl', 'satin', 'chrome', 'carbon',
    'gunmetal', 'midnight'
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
                color: `${second} ${last}`
            };
        }
        return {
            baseName: parts.slice(0, -1).join(' ').trim(),
            color: last
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
    if (!suitableFor) return false;

    const tags = suitableFor.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) return false;

    const brandNorm = normalizeSuitabilityTag(brand || '');
    const modelNorm = normalizeSuitabilityTag(model || '');
    const variantNorm = normalizeSuitabilityTag(variant || '');
    const brandModel = `${brandNorm} ${modelNorm}`.trim();
    const brandModelVariant = `${brandModel} ${variantNorm}`.trim();

    return tags.some((tag) => {
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

        if (brandNorm && normalized === brandNorm) return true;
        if (brandNorm && normalized.startsWith(brandNorm) && normalized.includes('all models')) return true;
        if (brandModel && normalized === brandModel) return true;
        if (brandModelVariant && normalized === brandModelVariant) return true;

        return false;
    });
};


export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { make, model, variant } = await params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { color, pincode, dealer } = await searchParams;

    // Canonical is always the clean variant path
    const canonical = `/store/${make}/${model}/${variant}`;

    const toTitleCase = (str: string) => str.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    return {
        title: `${toTitleCase(make)} ${toTitleCase(model)} ${toTitleCase(variant)} - BookMyBike`,
        alternates: {
            canonical: canonical,
        },
        robots: {
            index: !pincode && !dealer, // Location/Dealer context is noindex
            follow: true,
        }
    };
}

export default async function Page({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const supabase = await createClient();
    const cookieStore = await cookies(); // Access cookies
    console.log('PDP Debug: Page Load Start', { params: resolvedParams, search: resolvedSearchParams });

    // 1. Resolve Location
    // Priority: query param > cookie > default
    const pincodeFromCookie = cookieStore.get('bkmb_user_pincode')?.value || '';
    const pincodeToResolve = resolvedSearchParams.pincode || pincodeFromCookie || '';

    const location = await resolveLocation(pincodeToResolve);
    console.log('PDP Debug: Location Resolved:', { pincode: pincodeToResolve, location });
    const stateCode = location?.state === 'Maharashtra' ? 'MH' : 'MH';

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
        .select(`
            id, name, slug, price_base, specs,
            brand:cat_brands(name),
            parent:cat_items!parent_id(name, slug)
        `)
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
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-white">
                        PRODUCT <span className="text-red-500">NOT FOUND</span>
                    </h1>
                    <p className="text-slate-400 uppercase tracking-widest font-bold text-xs leading-relaxed">
                        {error ? error.message : 'The requested configuration is currently unavailable in our catalog.'}
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <a href="/store" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95">
                            Return to Store
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const item = variantItem as unknown as CatalogItem;

    // 2.5 Fetch SKUs EARLY (Needed for Market Offer Filtering)
    // We need to know the SKU IDs of this variant to check if a dealer has an offer for THIS bike.
    const { data: skus } = await supabase
        .from('cat_items')
        .select('id, name, slug, specs, price_base')
        .eq('parent_id', item.id)
        .eq('type', 'SKU');

    // 2.6 Fetch Prices from cat_prices (Authoritative Source)
    const skuIds = (skus || []).map((s: any) => s.id);
    let vehiclePrices: Record<string, number> = {};
    if (skuIds.length > 0) {
        const { data: priceRecords } = await supabase
            .from('cat_prices')
            .select('vehicle_color_id, ex_showroom_price, state_code, district')
            .in('vehicle_color_id', skuIds)
            .eq('state_code', stateCode)
            .eq('is_active', true);

        if (priceRecords) {
            priceRecords.forEach((p: any) => {
                const price = parseFloat(p.ex_showroom_price);
                vehiclePrices[p.vehicle_color_id] = price;
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

    // Fetch Accessories & Services
    const { data: accessoriesData } = await supabase
        .from('cat_items')
        .select('*, brand:cat_brands(name), template:cat_templates!inner(category, name)')
        .eq('template.category', 'ACCESSORY')
        .eq('status', 'ACTIVE');

    const { data: servicesData } = await supabase
        .from('cat_services')
        .select('*')
        .eq('status', 'ACTIVE');


    // Fallback/Mock Rule if missing
    const effectiveRule: any = ruleData?.[0] || {
        id: 'default',
        stateCode: 'MH',
        components: [{ id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true }]
    };

    const insuranceRule: any = insuranceRuleData?.[0];

    // 4. Resolve Server Pricing (SSPP)
    // Use cat_prices as fallback for ex-showroom if RPC is unavailable
    const firstSkuId = skuIds[0];
    const baseExShowroom = vehiclePrices[firstSkuId] || item.price_base || 0;
    let serverPricing: any = null;

    if (firstSkuId) {
        const { data: pricingData, error: pricingError } = await supabase.rpc('get_variant_on_road_price_v1', {
            p_vehicle_color_id: firstSkuId,
            p_district_name: location?.district || null,
            p_state_code: stateCode,
            p_registration_type: 'STATE'
        });

        if (pricingError) {
            console.error('SSPP RPC Error (PDP server):', pricingError);
        }

        serverPricing = pricingData && (pricingData.success === undefined || pricingData.success) ? pricingData : null;
    }
    const initialPricingSnapshot = serverPricing ? {
        exShowroom: serverPricing.ex_showroom ?? baseExShowroom,
        rto: serverPricing?.rto?.total ?? 0,
        insurance: serverPricing?.insurance?.total ?? 0,
        total: serverPricing?.final_on_road ?? baseExShowroom,
        breakdown: serverPricing
    } : {
        exShowroom: baseExShowroom,
        rto: 0,
        insurance: 0,
        total: baseExShowroom,
        breakdown: null
    };

    // 4.5 Fetch Market Offers (Dealer Pricing)
    // 4.5 Fetch Market Offers (Dealer Pricing)
    // We fetch this EARLIER now to determine the "winning" dealer for accessories
    // CRITICAL FIX: We must only consider offers for the CURRENT VEHICLE SKUs
    let marketOffers: Record<string, number> = {};
    let winningDealerId: string | null = resolvedSearchParams.dealer || null;
    let bundleIdsForDealer: Set<string> = new Set();
    const leadId = resolvedSearchParams.leadId;

    // Resolve Dealer from Lead if present
    if (leadId) {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select('owner_tenant_id, customer_pincode')
            .eq('id', leadId)
            .single();

        if (lead) {
            winningDealerId = lead.owner_tenant_id;
            console.log('PDP Debug: Lead context found. Dealer:', winningDealerId);
        }
    }

    if (location?.district || winningDealerId) {
        if (!winningDealerId && location?.district) {
            const { data: offers } = await supabase.rpc('get_market_best_offers', {
                p_district_name: location.district,
                p_state_code: stateCode
            });
            if (offers && offers.length > 0) {
                // Filter offers to only include those matching our current vehicle SKUs
                const currentSkuIds = (skus || []).map((s: any) => s.id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const relevantOffers = offers.filter((o: any) => currentSkuIds.includes(o.vehicle_color_id));

                if (relevantOffers.length > 0) {
                    // Pick the dealer with the BEST offer on ANY of the current vehicle's SKUs
                    // Since get_market_best_offers is already sorted? Does it sort by best offer? 
                    // The RPC usually returns best offer per color.
                    // We take the dealer from the first relevant offer as the "Winning Dealer" for consistency.
                    winningDealerId = relevantOffers[0].dealer_id;
                    bundleIdsForDealer = new Set(relevantOffers[0].bundle_ids || []);
                    console.log('PDP Debug: Market Winner:', winningDealerId, 'Offers:', relevantOffers.map((o: any) => ({ dealer: o.dealer_id, price: o.best_offer, bundle: o.bundle_value })));

                    // Populate marketOffers only with offers from this Winning Dealer for this vehicle
                    // This ensures we don't mix and match prices if multiple dealers have offers
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    relevantOffers.forEach((o: any) => {
                        if (o.dealer_id === winningDealerId) {
                            marketOffers[o.vehicle_color_id] = Number(o.best_offer);
                        }
                    });
                }
            }
        }

        // Fallback: If NO winning dealer found (e.g. no one has a discount rule), 
        // find ANY serviceable dealer in the district so we can at least show their bundles.
        if (!winningDealerId && location?.district) {
            // 1. Check Explicit Service Areas
            const { data: serviceAreaDealer } = await supabase
                .from('id_dealer_service_areas')
                .select('tenant_id')
                .ilike('district', location.district)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (serviceAreaDealer) {
                winningDealerId = serviceAreaDealer.tenant_id;
            } else {
                // 2. Check Physical Location (Implicit Coverage)
                const { data: locationDealer } = await supabase
                    .from('id_locations')
                    .select('tenant_id')
                    .ilike('district', location.district)
                    .eq('is_active', true)
                    .limit(1)
                    .maybeSingle();

                if (locationDealer) {
                    winningDealerId = locationDealer.tenant_id;
                }
            }
        }
    }

    // 3.4 Ensure Market Offers are Populated for the Winning Dealer
    // If dealer was pre-selected (URL) or found via Fallback, marketOffers might be empty.
    // We must fetch their specific vehicle pricing rules to show the discount.
    const currentSkuIds = (skus || []).map((s: any) => s.id);
    if (winningDealerId && currentSkuIds.length > 0) {
        // Only fetch if we haven't already populated marketOffers for these SKUs
        // (Optimization: Check if marketOffers has keys? Or just re-fetch to be safe/consistent)
        const hasOffers = Object.keys(marketOffers).length > 0;

        if (!hasOffers) {
            const { data: vehicleRules } = await supabase
                .from('id_dealer_pricing_rules')
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
    }

    // If bundle IDs not resolved from RPC, fall back to dealer pricing rules (bundle inclusion)
    if (winningDealerId && bundleIdsForDealer.size === 0) {
        const { data: bundleRules } = await supabase
            .from('id_dealer_pricing_rules')
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
    let accessoryRules: Map<string, { offer: number, inclusion: string }> = new Map();
    const accessoryIds = (accessoriesData || []).map((a: any) => a.id);

    if (accessoryIds.length > 0 && winningDealerId) {
        const { data: rules } = await supabase
            .from('id_dealer_pricing_rules')
            .select('vehicle_color_id, offer_amount, inclusion_type')
            .in('vehicle_color_id', accessoryIds)
            .eq('tenant_id', winningDealerId) // STRICT DEALER MATCH
            .eq('state_code', stateCode);

        rules?.forEach((r: any) => {
            accessoryRules.set(r.vehicle_color_id, {
                offer: Number(r.offer_amount),
                inclusion: r.inclusion_type
            });
        });
        console.log('PDP Debug: Accessory Rules loaded:', accessoryRules.size, 'for dealer:', winningDealerId);
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

        // Calculate Dealer Offer (Invert negative value for usePDPData subtraction)
        // We use the filtered marketOffers map populated earlier
        const rawOffer = marketOffers[sku.id] || 0;
        const dealerOfferValue = rawOffer < 0 ? Math.abs(rawOffer) : -rawOffer; // If offer is -2000 (discount), we send 2000

        return {
            id: cleanId, // Use clean slug as stable ID
            skuId: sku.id,
            name: cleanName,
            hex: sku.specs?.hex_primary || sku.specs?.hex_code || '#000000',
            image: sku.specs?.primary_image || sku.specs?.gallery?.[0] || null,
            video: sku.video_url || sku.specs?.video_urls?.[0] || sku.specs?.video_url || null,
            priceOverride: sku.price_base, // SKU might override price
            dealerOffer: dealerOfferValue // Inject Dealer Offer
        };
    });

    // If no SKUs, make a default One
    if (colors.length === 0) {
        colors.push({ id: 'default', skuId: 'default', name: 'Standard', hex: '#000000', image: null, video: null, priceOverride: null, dealerOffer: 0 });
    }

    const product = {
        id: item.id,
        make: item.brand?.name || resolvedParams.make,
        model: item.parent?.name || resolvedParams.model,
        variant: item.name,
        basePrice: Number(baseExShowroom),
        colors: colors,
        specs: item.specs
    };

    // 6. Accessories & Services
    const productMake = product.make;
    const productModel = product.model;
    const productVariant = product.variant;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessories = (accessoriesData || [])
        .filter((a: any) =>
            matchesAccessoryCompatibility(a.specs?.suitable_for, productMake, productModel, productVariant)
        )
        .map((a: any) => {
            const rule = accessoryRules.get(a.id);
            const offer = rule ? rule.offer : 0; // Negative for discount
            const basePrice = Number(a.price_base);
            // Effective price is Base + Offer (e.g. 2500 + (-2500) = 0)
            // Ensure strictly non-negative
            const discountPrice = Math.max(0, basePrice + offer);

            const inclusionType = rule?.inclusion
                || (bundleIdsForDealer.has(a.id) ? 'BUNDLE' : undefined)
                || a.inclusion_type
                || 'OPTIONAL';
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
            const displayName = [
                a.brand?.name,
                a.template?.name
            ].filter(Boolean).join(' ');
            const descriptionLabel = [
                accessoryName,
                colorLabel
            ].filter(Boolean).join(' ');

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
                subCategory: a.template?.name || null
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
        durationMonths: s.duration_months
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
            initialFinance={resolvedFinance ? {
                bank: {
                    id: resolvedFinance.bank.id,
                    name: resolvedFinance.bank.name,
                    identity: resolvedFinance.bank.config?.identity,
                    overview: resolvedFinance.bank.config?.overview
                },
                scheme: resolvedFinance.scheme,
                logic: resolvedFinance.logic // Trace logic
            } : undefined}
        />
    );
}
