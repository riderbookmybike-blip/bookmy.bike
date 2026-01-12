
import React from 'react';
import { Metadata } from 'next';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { slugify } from '@/utils/slugs';
import { resolveLocation } from '@/utils/locationResolver';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { createClient } from '@/lib/supabase/server';
import ProductClient from './ProductClient';
import { redirect } from 'next/navigation';

type Props = {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
    searchParams: Promise<{
        color?: string; // Still readable for SEO/Metadata
        pincode?: string;
    }>;
};

// Product lookup moved to DB fetch inside Page

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const { make, model, variant } = resolvedParams;
    const title = `${make} ${model} ${variant} On-Road Price - BookMyBike`;
    return { title };
}

export default async function Page({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const supabase = await createClient();

    // 1. Resolve Location & State Context
    const location = await resolveLocation(resolvedSearchParams.pincode || '');
    const stateCode = location?.state === 'Maharashtra' ? 'MH' : 'MH'; // Default to MH for MVP

    // 2. Fetch Variant & Pricing from DB
    const { data: variantData, error } = await supabase
        .from('vehicle_variants')
        .select(`
            *,
            vehicle_models (
                *,
                brands (*)
            ),
            vehicle_colors (*)
        `)
        .eq('slug', resolvedParams.variant)
        .eq('vehicle_models.slug', resolvedParams.model)
        .single();

    if (!variantData || error) {
        console.error('Variant Fetch Error:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-20 text-center">
                <div>
                    <h1 className="text-4xl font-black italic">MACHINE NOT FOUND</h1>
                    <p className="text-slate-500 mt-4 uppercase tracking-widest font-black">Variant or Model slug mismatch in database</p>
                </div>
            </div>
        );
    }

    // 3. Resolve Pricing & Rules
    // Get ex-showroom for the specific state
    const firstColorId = variantData.vehicle_colors?.[0]?.id;
    const { data: priceData } = await supabase
        .from('vehicle_prices')
        .select('*')
        .eq('vehicle_color_id', firstColorId)
        .eq('state_code', stateCode)
        .single();

    const { data: ruleData } = await supabase
        .from('registration_rules')
        .select('*')
        .eq('state_code', stateCode)
        .eq('status', 'ACTIVE')
        .single();

    // 4. Calculate On-Road
    const baseExShowroom = priceData?.ex_showroom_price || variantData.base_price_ex_showroom || 0;
    const engineCc = variantData.vehicle_models.displacement_cc || 110;

    // Default Rule if none found in DB
    const effectiveRule = ruleData || {
        state_tenure: 15,
        bh_tenure: 2,
        company_multiplier: 2,
        components: [
            { id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true }
        ]
    };

    // Calculate
    const onRoadBreakdown = calculateOnRoad(
        Number(baseExShowroom),
        engineCc,
        {
            stateTenure: effectiveRule.state_tenure,
            bhTenure: effectiveRule.bh_tenure,
            companyMultiplier: effectiveRule.company_multiplier,
            components: effectiveRule.components
        } as any
    );

    // Map DB Variant to Product Object
    const product = {
        id: variantData.id,
        make: variantData.vehicle_models.brands.name,
        model: variantData.vehicle_models.name,
        variant: variantData.name,
        basePrice: Number(baseExShowroom),
        colors: variantData.vehicle_colors.map((c: any) => ({
            name: c.name,
            hex: c.hex_code,
            image: c.image_url
        }))
    };

    return (
        <ProductClient
            product={product as any}
            makeParam={resolvedParams.make}
            modelParam={resolvedParams.model}
            variantParam={resolvedParams.variant}
            initialLocation={location}
            initialPrice={{
                exShowroom: onRoadBreakdown.exShowroom,
                rto: onRoadBreakdown.rtoState.total,
                insurance: onRoadBreakdown.insuranceComp.total,
                otherCharges: 1500,
                onRoad: onRoadBreakdown.onRoadTotal,
                region: stateCode
            }}
        />
    );
}
