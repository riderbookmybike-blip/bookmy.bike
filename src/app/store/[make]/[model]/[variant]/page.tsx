import React from 'react';
import { Metadata } from 'next';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { slugify } from '@/utils/slugs';
import { resolveLocation } from '@/utils/locationResolver';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { createClient } from '@/lib/supabase/server';
import ProductClient from './ProductClient';
import { redirect } from 'next/navigation';
import type { FormulaComponent, RegistrationRule } from '@/types/registration';

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

type RegistrationRuleRow = Partial<RegistrationRule> & {
    display_id?: string | null;
    rule_name?: string | null;
    state_code?: string | null;
    vehicle_type?: RegistrationRule['vehicleType'] | null;
    effective_from?: string | null;
    state_tenure?: number | null;
    bh_tenure?: number | null;
    company_multiplier?: number | null;
    last_updated?: string | null;
};

type VehicleColorRow = {
    name: string;
    hex_code: string;
    image_url?: string | null;
    gallery_urls?: string[] | null;
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
        .select(
            `
            *,
            vehicle_models (
                *,
                brands (*)
            ),
            vehicle_colors (*)
        `
        )
        .eq('slug', resolvedParams.variant)
        .eq('vehicle_models.slug', resolvedParams.model)
        .single();

    if (!variantData || error) {
        console.error('Variant Fetch Error:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-20 text-center">
                <div>
                    <h1 className="text-4xl font-black italic">MACHINE NOT FOUND</h1>
                    <p className="text-slate-500 mt-4 uppercase tracking-widest font-black">
                        Variant or Model slug mismatch in database
                    </p>
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

    const fallbackComponents: FormulaComponent[] = [
        { id: 'tax', type: 'PERCENTAGE', label: 'Road Tax', percentage: 10, isRoadTax: true },
    ];
    const ruleRow = ruleData as RegistrationRuleRow | null;
    const nowIso = new Date().toISOString();
    const normalizedStatus: RegistrationRule['status'] = ruleRow?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const components =
        Array.isArray(ruleRow?.components) && ruleRow.components.length > 0 ? ruleRow.components : fallbackComponents;

    const effectiveRule: RegistrationRule = ruleRow
        ? {
              id: ruleRow.id ?? `rule-${stateCode}`,
              displayId: ruleRow.displayId ?? ruleRow.display_id ?? undefined,
              ruleName: ruleRow.ruleName ?? ruleRow.rule_name ?? `${stateCode} RTO Rule`,
              stateCode: ruleRow.stateCode ?? ruleRow.state_code ?? stateCode,
              vehicleType: (ruleRow.vehicleType ??
                  ruleRow.vehicle_type ??
                  'TWO_WHEELER') as RegistrationRule['vehicleType'],
              effectiveFrom: ruleRow.effectiveFrom ?? ruleRow.effective_from ?? nowIso,
              status: normalizedStatus,
              stateTenure: ruleRow.stateTenure ?? ruleRow.state_tenure ?? 15,
              bhTenure: ruleRow.bhTenure ?? ruleRow.bh_tenure ?? 2,
              companyMultiplier: ruleRow.companyMultiplier ?? ruleRow.company_multiplier ?? 2,
              components,
              version: ruleRow.version ?? 1,
              lastUpdated: ruleRow.lastUpdated ?? ruleRow.last_updated ?? nowIso,
          }
        : {
              id: `rule-${stateCode}`,
              ruleName: `${stateCode} RTO Rule`,
              stateCode,
              vehicleType: 'TWO_WHEELER',
              effectiveFrom: nowIso,
              status: 'ACTIVE',
              stateTenure: 15,
              bhTenure: 2,
              companyMultiplier: 2,
              components,
              version: 1,
              lastUpdated: nowIso,
          };

    // Calculate
    const onRoadBreakdown = calculateOnRoad(Number(baseExShowroom), engineCc, effectiveRule);

    // Map DB Variant to Product Object
    const colors = (variantData.vehicle_colors || []) as VehicleColorRow[];
    const product = {
        id: variantData.id,
        make: variantData.vehicle_models.brands.name,
        model: variantData.vehicle_models.name,
        variant: variantData.name,
        basePrice: Number(baseExShowroom),
        colors: colors.map(color => ({
            name: color.name,
            hex: color.hex_code,
            image: color.image_url || (Array.isArray(color.gallery_urls) && color.gallery_urls[0]) || null,
        })),
    };

    return (
        <ProductClient
            product={product}
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
                region: stateCode,
            }}
        />
    );
}
