import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { calculateInsurance } from '../src/lib/aums/insuranceEngine';
import type { Database } from '../src/types/supabase';
import type { InsuranceCalculationContext, InsuranceRule } from '../src/types/insurance';

type RuleRow = {
    id: string;
    display_id: string | null;
    rule_name: string;
    state_code: string;
    insurer_name: string;
    vehicle_type: string;
    status: string | null;
    idv_percentage: number | null;
    gst_percentage: number | null;
    version: number | null;
    updated_at: string | null;
    created_at: string | null;
    effective_from: string | null;
    od_components: any;
    tp_components: any;
    addons: any;
};

type PriceRow = {
    sku_id: string;
    state_code: string;
    ex_showroom: number | null;
    rto_total_state: number | null;
    on_road_price: number | null;
    ins_own_damage_premium_amount: number | null;
    ins_own_damage_gst_amount: number | null;
    ins_own_damage_total_amount: number | null;
    ins_liability_only_premium_amount: number | null;
    ins_liability_only_gst_amount: number | null;
    ins_liability_only_total_amount: number | null;
    ins_sum_mandatory_insurance: number | null;
    ins_sum_mandatory_insurance_gst_amount: number | null;
    ins_gross_premium: number | null;
    ins_gst_rate: number | null;
    addon_personal_accident_cover_amount: number | null;
    addon_personal_accident_cover_gst_amount: number | null;
    addon_personal_accident_cover_total_amount: number | null;
};

type SkuModelRow = {
    id: string;
    model: {
        engine_cc: number | null;
        fuel_type: string | null;
    } | null;
};

const apply = process.argv.includes('--apply');
const stateArg = process.argv
    .find(arg => arg.startsWith('--state='))
    ?.split('=')[1]
    ?.toUpperCase();
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
});

const round2 = (value: number) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapRuleRowToEngineRule = (row: RuleRow): InsuranceRule => ({
    id: row.id,
    displayId: row.display_id || row.id.slice(0, 8).toUpperCase(),
    ruleName: row.rule_name,
    stateCode: row.state_code,
    insurerName: row.insurer_name,
    vehicleType: (row.vehicle_type || 'TWO_WHEELER') as InsuranceRule['vehicleType'],
    effectiveFrom: row.effective_from || row.created_at || new Date().toISOString().split('T')[0],
    status: (row.status || 'ACTIVE') as InsuranceRule['status'],
    idvPercentage: toNumber(row.idv_percentage || 95),
    gstPercentage: toNumber(row.gst_percentage || 18),
    version: row.version || 1,
    lastUpdated: row.updated_at || new Date().toISOString(),
    odComponents: Array.isArray(row.od_components) ? row.od_components : [],
    tpComponents: Array.isArray(row.tp_components) ? row.tp_components : [],
    addons: Array.isArray(row.addons) ? row.addons : [],
});

const pickPaBaseFromResult = (result: ReturnType<typeof calculateInsurance>): number => {
    const paItem = (result.addonBreakdown || []).find(item => {
        const id = String(item.componentId || '').toLowerCase();
        const label = String(item.label || '').toLowerCase();
        return id.includes('pa') || label.includes('personal accident');
    });
    return round2(toNumber(paItem?.amount || 0));
};

const hasNumericDiff = (current: unknown, next: number, tolerance = 0.01) => {
    return Math.abs(toNumber(current) - next) > tolerance;
};

async function main() {
    console.log(`[reprice_published_insurance] mode=${apply ? 'APPLY' : 'DRY-RUN'} state=${stateArg || 'ALL'}`);

    const rulesQuery = supabase
        .from('cat_ins_rules')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('vehicle_type', 'TWO_WHEELER');
    const { data: ruleRows, error: rulesError } = await rulesQuery;

    if (rulesError) {
        throw new Error(`Failed to fetch active insurance rules: ${rulesError.message}`);
    }

    const ruleByState = new Map<string, InsuranceRule>();
    for (const row of (ruleRows || []) as RuleRow[]) {
        ruleByState.set(String(row.state_code || '').toUpperCase(), mapRuleRowToEngineRule(row));
    }

    const fallbackRule = ruleByState.get('ALL');
    if (!fallbackRule && ruleByState.size === 0) {
        throw new Error('No active insurance rules found.');
    }

    let pricingQuery = supabase
        .from('cat_price_state_mh')
        .select(
            [
                'sku_id',
                'state_code',
                'ex_showroom',
                'rto_total_state',
                'on_road_price',
                'ins_own_damage_premium_amount',
                'ins_own_damage_gst_amount',
                'ins_own_damage_total_amount',
                'ins_liability_only_premium_amount',
                'ins_liability_only_gst_amount',
                'ins_liability_only_total_amount',
                'ins_sum_mandatory_insurance',
                'ins_sum_mandatory_insurance_gst_amount',
                'ins_gross_premium',
                'ins_gst_rate',
                'addon_personal_accident_cover_amount',
                'addon_personal_accident_cover_gst_amount',
                'addon_personal_accident_cover_total_amount',
            ].join(', ')
        )
        .eq('publish_stage', 'PUBLISHED');

    if (stateArg) {
        pricingQuery = pricingQuery.eq('state_code', stateArg);
    }

    const { data: priceRows, error: pricingError } = await pricingQuery;
    if (pricingError) {
        throw new Error(`Failed to fetch published pricing rows: ${pricingError.message}`);
    }

    const rows = (priceRows || []) as unknown as PriceRow[];
    if (rows.length === 0) {
        console.log('[reprice_published_insurance] No published rows found.');
        return;
    }

    const skuIds = Array.from(new Set(rows.map(row => String(row.sku_id || '')).filter(Boolean)));
    const { data: skuRows, error: skuError } = await supabase
        .from('cat_skus')
        .select('id, model:cat_models!model_id(engine_cc, fuel_type)')
        .in('id', skuIds);

    if (skuError) {
        throw new Error(`Failed to fetch SKU/model data: ${skuError.message}`);
    }

    const skuMap = new Map<string, SkuModelRow>(
        (skuRows || []).map(row => [String((row as any).id), row as SkuModelRow])
    );

    let scanned = 0;
    let changed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        scanned += 1;
        const stateCode = String(row.state_code || 'ALL').toUpperCase();
        const rule = ruleByState.get(stateCode) || fallbackRule;
        const sku = skuMap.get(String(row.sku_id));

        if (!rule || !sku) {
            skipped += 1;
            continue;
        }

        const exShowroom = toNumber(row.ex_showroom);
        if (exShowroom <= 0) {
            skipped += 1;
            continue;
        }

        const engineCc = toNumber(sku.model?.engine_cc || 110);
        const fuelType = String(sku.model?.fuel_type || 'PETROL');
        const ctx: InsuranceCalculationContext = {
            exShowroom,
            engineCc,
            fuelType,
            isNewVehicle: true,
            odTenure: 1,
            tpTenure: 5,
        };

        const result = calculateInsurance(rule, ctx);
        const gstRate = toNumber(rule.gstPercentage || row.ins_gst_rate || 18);
        const odBase = round2(toNumber(result.odTotal));
        const tpBase = round2(toNumber(result.tpTotal));
        const odGst = round2(Math.round(odBase * (gstRate / 100)));
        const tpGst = round2(Math.round(tpBase * (gstRate / 100)));
        const odTotal = round2(odBase + odGst);
        const tpTotal = round2(tpBase + tpGst);
        const mandatoryBase = round2(odBase + tpBase);
        const mandatoryGst = round2(odGst + tpGst);
        const grossInsurance = round2(mandatoryBase + mandatoryGst);
        const paBase = pickPaBaseFromResult(result);
        const paGst = round2(paBase * (gstRate / 100));
        const paTotal = round2(paBase + paGst);
        const onRoad = round2(exShowroom + toNumber(row.rto_total_state) + grossInsurance);

        const rowChanged =
            hasNumericDiff(row.ins_own_damage_premium_amount, odBase) ||
            hasNumericDiff(row.ins_own_damage_gst_amount, odGst) ||
            hasNumericDiff(row.ins_own_damage_total_amount, odTotal) ||
            hasNumericDiff(row.ins_liability_only_premium_amount, tpBase) ||
            hasNumericDiff(row.ins_liability_only_gst_amount, tpGst) ||
            hasNumericDiff(row.ins_liability_only_total_amount, tpTotal) ||
            hasNumericDiff(row.ins_sum_mandatory_insurance, mandatoryBase) ||
            hasNumericDiff(row.ins_sum_mandatory_insurance_gst_amount, mandatoryGst) ||
            hasNumericDiff(row.ins_gross_premium, grossInsurance) ||
            hasNumericDiff(row.addon_personal_accident_cover_amount, paBase) ||
            hasNumericDiff(row.addon_personal_accident_cover_gst_amount, paGst) ||
            hasNumericDiff(row.addon_personal_accident_cover_total_amount, paTotal) ||
            hasNumericDiff(row.on_road_price, onRoad);

        if (!rowChanged) continue;
        changed += 1;

        if (!apply) continue;

        const { error: updateError } = await supabase
            .from('cat_price_state_mh')
            .update({
                ins_own_damage_premium_amount: odBase,
                ins_own_damage_gst_amount: odGst,
                ins_own_damage_total_amount: odTotal,
                ins_liability_only_premium_amount: tpBase,
                ins_liability_only_gst_amount: tpGst,
                ins_liability_only_total_amount: tpTotal,
                ins_sum_mandatory_insurance: mandatoryBase,
                ins_sum_mandatory_insurance_gst_amount: mandatoryGst,
                ins_gross_premium: grossInsurance,
                ins_gst_rate: gstRate,
                addon_personal_accident_cover_amount: paBase,
                addon_personal_accident_cover_gst_amount: paGst,
                addon_personal_accident_cover_total_amount: paTotal,
                on_road_price: onRoad,
                updated_at: new Date().toISOString(),
            })
            .eq('sku_id', row.sku_id)
            .eq('state_code', row.state_code);

        if (updateError) {
            failed += 1;
            console.error(
                `[reprice_published_insurance] update failed sku=${row.sku_id} state=${row.state_code}: ${updateError.message}`
            );
            continue;
        }

        updated += 1;
    }

    console.log(
        `[reprice_published_insurance] scanned=${scanned} changed=${changed} updated=${updated} skipped=${skipped} failed=${failed}`
    );
    if (!apply) {
        console.log('[reprice_published_insurance] Dry-run complete. Re-run with --apply to persist changes.');
    }
}

main().catch(error => {
    console.error('[reprice_published_insurance] fatal:', error);
    process.exit(1);
});
