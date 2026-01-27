import React from 'react';
import { Metadata } from 'next';
import { resolveLocation } from '@/utils/locationResolver';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';
import { cookies } from 'next/headers';

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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { make, model, variant } = await params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { color, pincode, dealer } = await searchParams;

    // Canonical is always the clean variant path
    const canonical = `/store/${make}/${model}/${variant}`;

    return {
        title: `${make.toUpperCase()} ${model.toUpperCase()} ${variant.toUpperCase()} - BookMyBike`,
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

    // 1. Resolve Location
    // Priority: query param > cookie > default
    const pincodeFromCookie = cookieStore.get('bkmb_user_pincode')?.value || '';
    const pincodeToResolve = resolvedSearchParams.pincode || pincodeFromCookie || '';

    const location = await resolveLocation(pincodeToResolve);
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
        .select('*, template:cat_templates!inner(category)')
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

    // 4. Calculate On-Road
    const baseExShowroom = item.price_base || 0;
    const engineCc = item.specs?.engine_cc || 110;

    const onRoadBreakdown = calculateOnRoad(Number(baseExShowroom), engineCc, effectiveRule, insuranceRule);

    // 4.5 Fetch Market Offers (Dealer Pricing)
    let marketOffers: Record<string, number> = {};
    if (location?.district) {
        const { data: offers } = await supabase.rpc('get_market_best_offers', {
            p_district_name: location.district,
            p_state_code: stateCode
        });

        if (offers) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            offers.forEach((o: any) => {
                // Store the raw offer amount (usually negative for discount)
                marketOffers[o.vehicle_color_id] = Number(o.best_offer);
            });
        }
    }

    // 5. Map to Product Object
    // Note: unified schema stores colors as SKUs (children of Variant) or inside specs?
    // Current Studio implementation: Variant -> SKUs (each SKU is a Color).
    // Let's fetch child SKUs to get colors.
    const { data: skus } = await supabase
        .from('cat_items')
        .select('id, name, slug, specs, price_base')
        .eq('parent_id', item.id)
        .eq('type', 'SKU');

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
        const rawOffer = marketOffers[sku.id] || 0;
        const dealerOfferValue = rawOffer < 0 ? Math.abs(rawOffer) : -rawOffer; // If offer is -2000 (discount), we send 2000

        return {
            id: cleanId, // Use clean slug as stable ID
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
        colors.push({ id: 'default', name: 'Standard', hex: '#000000', image: null, video: null, priceOverride: null, dealerOffer: 0 });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessories = (accessoriesData || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.specs?.description || a.name,
        price: Number(a.price_base),
        discountPrice: Number(a.price_base), // Assuming discount_price might not exist in cat_items
        maxQty: 1,
        isMandatory: false,
        category: 'OTHERS'
    }));

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

    return (
        <ProductClient
            product={product}
            makeParam={resolvedParams.make}
            modelParam={product.model}
            variantParam={product.variant}
            initialLocation={location}
            initialPrice={{
                exShowroom: onRoadBreakdown.exShowroom,
                rto: onRoadBreakdown.rtoState.total,
                insurance: onRoadBreakdown.insuranceComp.total,
                total: onRoadBreakdown.onRoadTotal,
                breakdown: onRoadBreakdown
            }}
            insuranceRule={insuranceRule}
            registrationRule={effectiveRule} // Passing registration rule for client side calc
            initialAccessories={accessories}
            initialServices={services}
        />
    );
}
