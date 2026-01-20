import React from 'react';
import { Metadata } from 'next';
import { resolveLocation } from '@/utils/locationResolver';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/utils/slugs';
import ProductClient from './ProductClient';

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

    // 1. Resolve Location (Keep existing logic)
    const location = await resolveLocation(resolvedSearchParams.pincode || '');
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
        .from('catalog_items')
        .select(`
            id, name, slug, price_base, specs,
            brand:brands(name),
            parent:catalog_items!parent_id(name, slug)
        `)
        .in('slug', possibleSlugs)
        .eq('type', 'VARIANT')
        .maybeSingle();

    if (!variantItem || error) {
        console.error('PDP Fetch Error:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-20 text-center">
                <div>
                    <h1 className="text-4xl font-black italic">PRODUCT NOT FOUND</h1>
                    <p className="text-slate-500 mt-4 uppercase tracking-widest font-black">
                        {error ? error.message : 'The requested product could not be found in our catalog.'}
                    </p>
                </div>
            </div>
        );
    }

    const item = variantItem as unknown as CatalogItem;

    // 3. Fetch RTO/Insurance Rules
    const { data: ruleData } = await supabase
        .from('registration_rules')
        .select('*')
        .eq('state_code', stateCode)
        .eq('status', 'ACTIVE');

    const { data: insuranceRuleData } = await supabase
        .from('insurance_rules')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('vehicle_type', 'TWO_WHEELER')
        .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
        .order('state_code', { ascending: false }) // Prioritize specific state over ALL
        .limit(1);

    // Fetch Accessories & Services
    const { data: accessoriesData } = await supabase
        .from('accessories')
        .select('*')
        .eq('status', 'ACTIVE');

    const { data: servicesData } = await supabase
        .from('services')
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

    // 5. Map to Product Object
    // Note: unified schema stores colors as SKUs (children of Variant) or inside specs?
    // Current Studio implementation: Variant -> SKUs (each SKU is a Color).
    // Let's fetch child SKUs to get colors.
    const { data: skus } = await supabase
        .from('catalog_items')
        .select('id, name, slug, specs, price_base')
        .eq('parent_id', item.id)
        .eq('type', 'SKU');

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

        return {
            id: cleanId, // Use clean slug as stable ID
            name: cleanName,
            hex: sku.specs?.hex_primary || sku.specs?.hex_code || '#000000',
            image: sku.specs?.primary_image || sku.specs?.gallery?.[0] || null,
            video: sku.video_url || sku.specs?.video_urls?.[0] || sku.specs?.video_url || null,
            priceOverride: sku.price_base // SKU might override price
        };
    });

    // If no SKUs, make a default One
    if (colors.length === 0) {
        colors.push({ id: 'default', name: 'Standard', hex: '#000000', image: null, video: null, priceOverride: null });
    }

    const product = {
        id: item.id,
        make: item.brand?.name || resolvedParams.make,
        model: item.parent?.name || '',
        variant: item.name,
        basePrice: Number(baseExShowroom),
        colors: colors,
        specs: item.specs
    };

    // 6. Accessories & Services
    const accessories = (accessoriesData || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        price: Number(a.price),
        discountPrice: Number(a.discount_price),
        maxQty: a.max_qty,
        isMandatory: a.is_mandatory,
        category: a.category
    }));

    const services = (servicesData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        discountPrice: Number(s.discount_price),
        maxQty: s.max_qty,
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
