import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';

dotenv.config({ path: '.env.local' });

type DistrictTarget = { district: string; state: string };

type PriceMapEntry = {
    price: number;
    district?: string | null;
};

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_DISTRICTS: DistrictTarget[] = [
    { district: 'Palghar', state: 'MH' },
    { district: 'Pune', state: 'MH' },
    { district: 'Delhi', state: 'DL' }
];

const MAX_SKUS = Number(process.env.PRICING_PARITY_LIMIT || 5);
const THRESHOLD = Number(process.env.PRICING_PARITY_THRESHOLD || 250);

const districtPriority = (targetDistrict: string, districtValue: string | null | undefined) => {
    const normalizedTarget = targetDistrict.toString().toUpperCase();
    const normalized = (districtValue || '').toString().toUpperCase();
    if (normalized === normalizedTarget) return 2;
    if (normalized === 'ALL' || normalized === '') return 1;
    return 0;
};

const safeNumber = (value: any, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

async function fetchSkuSample() {
    const { data, error } = await supabase
        .from('cat_items')
        .select('id, name, specs, price_base')
        .eq('type', 'SKU')
        .eq('status', 'ACTIVE')
        .limit(MAX_SKUS);

    if (error) throw error;
    return data || [];
}

async function fetchPricingMap(skuIds: string[], stateCode: string, district: string) {
    if (skuIds.length === 0) return new Map<string, PriceMapEntry>();

    const { data, error } = await supabase
        .from('cat_prices')
        .select('vehicle_color_id, ex_showroom_price, district')
        .eq('state_code', stateCode)
        .eq('is_active', true)
        .in('vehicle_color_id', skuIds);

    if (error) throw error;

    const map = new Map<string, PriceMapEntry>();
    (data || []).forEach((row: any) => {
        const next = { price: safeNumber(row.ex_showroom_price), district: row.district };
        const existing = map.get(row.vehicle_color_id);
        if (!existing || districtPriority(district, next.district) > districtPriority(district, existing.district)) {
            map.set(row.vehicle_color_id, next);
        }
    });

    return map;
}

async function fetchRegRule(stateCode: string) {
    const { data, error } = await supabase
        .from('cat_reg_rules')
        .select('*')
        .eq('state_code', stateCode)
        .eq('status', 'ACTIVE')
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchInsuranceRule(stateCode: string) {
    const { data, error } = await supabase
        .from('cat_ins_rules')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('vehicle_type', 'TWO_WHEELER')
        .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
        .order('state_code', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchServerPricing(vehicleColorId: string, district: string, stateCode: string) {
    const { data, error } = await supabase.rpc('get_variant_on_road_price_v1', {
        p_vehicle_color_id: vehicleColorId,
        p_district_name: district,
        p_state_code: stateCode,
        p_registration_type: 'STATE'
    });

    if (error) throw error;
    if (!data) return null;
    if (data.success === false) return null;
    return data;
}

async function run() {
    const skuData = await fetchSkuSample();
    const skuIds = skuData.map((s: any) => s.id);

    if (skuIds.length === 0) {
        console.log('No SKUs found for parity check.');
        return;
    }

    const districts = DEFAULT_DISTRICTS;
    let mismatchCount = 0;

    for (const target of districts) {
        const pricingMap = await fetchPricingMap(skuIds, target.state, target.district);
        const regRule = await fetchRegRule(target.state);
        const insRule = await fetchInsuranceRule(target.state);

        console.log(`\n=== Parity Check: ${target.district}, ${target.state} ===`);
        if (!regRule) {
            console.log('Missing registration rule; skipping local calc for this state.');
        }

        for (const sku of skuData) {
            const priceEntry = pricingMap.get(sku.id);
            const basePrice = priceEntry?.price ?? safeNumber(sku.price_base, 0);
            const engineCc = safeNumber(sku.specs?.engine_cc || sku.specs?.['Engine CC'] || 110, 110);

            let legacyTotal: number | null = null;
            if (regRule) {
                const legacy = calculateOnRoad(basePrice, engineCc, regRule as any, insRule as any);
                legacyTotal = legacy?.onRoadTotal ?? null;
            }

            const serverPricing = await fetchServerPricing(sku.id, target.district, target.state);
            const serverTotal = serverPricing?.final_on_road ?? null;

            const delta = legacyTotal !== null && serverTotal !== null
                ? Math.round(serverTotal - legacyTotal)
                : null;

            const label = `${sku.name || sku.id}`.slice(0, 40);
            const legacyLabel = legacyTotal !== null ? legacyTotal.toLocaleString('en-IN') : '--';
            const serverLabel = serverTotal !== null ? serverTotal.toLocaleString('en-IN') : '--';
            const deltaLabel = delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toLocaleString('en-IN')}` : '--';

            const isMismatch = delta !== null && Math.abs(delta) > THRESHOLD;
            if (isMismatch) mismatchCount += 1;

            console.log(`- ${label} | legacy INR ${legacyLabel} | server INR ${serverLabel} | diff ${deltaLabel}${isMismatch ? ' !' : ''}`);
        }
    }

    if (mismatchCount > 0) {
        console.log(`\nFound ${mismatchCount} mismatches above INR ${THRESHOLD}.`);
        process.exitCode = 1;
    } else {
        console.log('\nParity check passed within threshold.');
    }
}

run().catch((error) => {
    console.error('Parity script failed:', error);
    process.exit(1);
});
