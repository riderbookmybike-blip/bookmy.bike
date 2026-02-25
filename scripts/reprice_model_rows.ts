/**
 * Compute-only price engine runner for existing cat_price_state_mh rows.
 *
 * - Recalculates RTO + Insurance using shared engines
 * - Persists results back to cat_price_state_mh
 * - Does NOT publish, notify dealers, or change publish workflow
 *
 * Usage:
 *   npx tsx scripts/reprice_model_rows.ts --model=Ronin --state=MH --apply
 *   npx tsx scripts/reprice_model_rows.ts --model=Ronin --state=MH          (dry-run)
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculateRegistrationCharges } from '../src/lib/aums/registrationEngine';
import { calculateInsurance as engineCalculateInsurance } from '../src/lib/aums/insuranceEngine';
import type { Database } from '../src/types/supabase';
import type { RegistrationRule, CalculationContext, RegistrationType } from '../src/types/registration';
import type { InsuranceRule, InsuranceCalculationContext } from '../src/types/insurance';

dotenv.config({ path: '.env.local' });

const stateArg =
    process.argv
        .find(arg => arg.startsWith('--state='))
        ?.split('=')[1]
        ?.toUpperCase() || 'MH';
const modelArg = process.argv
    .find(arg => arg.startsWith('--model='))
    ?.split('=')[1]
    ?.trim();
const apply = process.argv.includes('--apply');

if (!modelArg) {
    console.error('Missing --model argument. Example: --model=Ronin');
    process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
});

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const toNum = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

type ModelRow = {
    id: string;
    name: string;
    brand_id: string;
    engine_cc: number | null;
    fuel_type: string | null;
    item_tax_rate: number | null;
    hsn_code: string | null;
};

type SkuRow = {
    id: string;
    model_id: string | null;
};

type PriceRow = {
    id: string;
    sku_id: string;
    state_code: string;
    ex_showroom: number | null;
    publish_stage: string | null;
    is_popular: boolean | null;
    gst_rate: number | null;
    hsn_code: string | null;
};

type RegRuleRow = {
    id: string;
    rule_name: string | null;
    state_code: string;
    vehicle_type: string | null;
    effective_from: string | null;
    status: string | null;
    state_tenure: number | null;
    bh_tenure: number | null;
    company_multiplier: number | null;
    components: any;
    version: number | null;
    updated_at: string | null;
};

type InsRuleRow = {
    id: string;
    display_id: string | null;
    rule_name: string | null;
    state_code: string;
    insurer_name: string | null;
    vehicle_type: string | null;
    effective_from: string | null;
    status: string | null;
    idv_percentage: number | null;
    gst_percentage: number | null;
    version: number | null;
    updated_at: string | null;
    created_at: string | null;
    od_components: any;
    tp_components: any;
    addons: any;
};

interface RTOTypeBreakdown {
    total: number;
    roadTax: number;
    registrationCharges: number;
    smartCardCharges: number;
    postalCharges: number;
    cessAmount?: number;
    cessRate?: number;
}

interface RTOJSON {
    STATE: RTOTypeBreakdown;
    BH: RTOTypeBreakdown;
    COMPANY: RTOTypeBreakdown;
    default: 'STATE';
}

const mapRegRule = (dbRule: RegRuleRow | null): RegistrationRule | null => {
    if (!dbRule) return null;
    return {
        id: dbRule.id,
        ruleName: dbRule.rule_name || 'Default Rule',
        stateCode: dbRule.state_code,
        vehicleType: dbRule.vehicle_type || '2W',
        effectiveFrom: dbRule.effective_from || new Date().toISOString(),
        status: dbRule.status || 'ACTIVE',
        stateTenure: dbRule.state_tenure || 15,
        bhTenure: dbRule.bh_tenure || 2,
        companyMultiplier: dbRule.company_multiplier || 2,
        components: Array.isArray(dbRule.components) ? dbRule.components : [],
        version: dbRule.version || 1,
        lastUpdated: dbRule.updated_at || new Date().toISOString(),
    };
};

const mapInsRule = (dbRule: InsRuleRow): InsuranceRule => ({
    id: dbRule.id,
    displayId: dbRule.display_id || dbRule.id.slice(0, 8).toUpperCase(),
    ruleName: dbRule.rule_name || `${dbRule.state_code} Rule`,
    stateCode: dbRule.state_code,
    insurerName: dbRule.insurer_name || 'Default Insurer',
    vehicleType: (dbRule.vehicle_type || 'TWO_WHEELER') as InsuranceRule['vehicleType'],
    effectiveFrom: dbRule.effective_from || dbRule.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: (dbRule.status || 'ACTIVE') as InsuranceRule['status'],
    idvPercentage: Number(dbRule.idv_percentage) || 95,
    gstPercentage: Number(dbRule.gst_percentage) || 18,
    version: dbRule.version || 1,
    lastUpdated: dbRule.updated_at || new Date().toISOString(),
    odComponents: Array.isArray(dbRule.od_components) ? dbRule.od_components : [],
    tpComponents: Array.isArray(dbRule.tp_components) ? dbRule.tp_components : [],
    addons: Array.isArray(dbRule.addons) ? dbRule.addons : [],
});

const calcRtoJson = (
    exShowroom: number,
    rule: RegistrationRule | null,
    engineCC: number,
    fuelType: string
): RTOJSON => {
    const calculate = (regType: RegistrationType): RTOTypeBreakdown => {
        if (!rule) {
            const fallbackRate = regType === 'STATE_INDIVIDUAL' ? 0.11 : regType === 'BH_SERIES' ? 0.08 : 0.22;
            const roadTax = Math.round(exShowroom * fallbackRate);
            return {
                total: roadTax + 300 + 200 + 70,
                roadTax,
                registrationCharges: 300,
                smartCardCharges: 200,
                postalCharges: 70,
            };
        }

        const context: CalculationContext = {
            exShowroom,
            engineCc: engineCC,
            fuelType,
            regType,
            variantConfig: {
                stateTenure: rule.stateTenure,
                bhTenure: rule.bhTenure,
                companyMultiplier: rule.companyMultiplier,
            },
        };

        const result = calculateRegistrationCharges(rule, context);

        let roadTax = 0;
        let cessAmount = 0;
        let cessRate = 0;
        let registrationCharges = 300;
        let smartCardCharges = 200;
        let postalCharges = 70;

        for (const item of result.breakdown) {
            const label = String(item.label || '').toLowerCase();
            if (label.includes('tax') && !label.includes('cess')) {
                roadTax += item.amount;
            } else if (label.includes('cess')) {
                cessAmount += item.amount;
                const meta = String(item.meta || '');
                const match = meta.match(/([0-9]+(?:\.[0-9]+)?)%\s*Surcharge/i);
                if (match) cessRate = Number(match[1]);
            } else if (label.includes('registration')) {
                registrationCharges = item.amount;
            } else if (label.includes('smart')) {
                smartCardCharges = item.amount;
            } else if (label.includes('postal')) {
                postalCharges = item.amount;
            }
        }

        if (!cessRate && roadTax > 0 && cessAmount > 0) {
            cessRate = (cessAmount * 100) / roadTax;
        }

        return {
            total: result.totalAmount,
            roadTax: roadTax + cessAmount,
            registrationCharges,
            smartCardCharges,
            postalCharges,
            cessAmount,
            cessRate,
        };
    };

    return {
        STATE: calculate('STATE_INDIVIDUAL'),
        BH: calculate('BH_SERIES'),
        COMPANY: calculate('COMPANY'),
        default: 'STATE',
    };
};

async function main() {
    console.log(`[reprice_model_rows] mode=${apply ? 'APPLY' : 'DRY-RUN'} model=${modelArg} state=${stateArg}`);

    const { data: modelRows, error: modelErr } = await admin
        .from('cat_models')
        .select('id, name, brand_id, engine_cc, fuel_type, item_tax_rate, hsn_code')
        .ilike('name', modelArg!);
    if (modelErr) throw new Error(`Model lookup failed: ${modelErr.message}`);

    const models = (modelRows || []) as ModelRow[];
    if (models.length === 0) {
        console.log('[reprice_model_rows] No matching model found.');
        return;
    }
    const modelById = new Map(models.map(m => [m.id, m]));

    const { data: skuRows, error: skuErr } = await admin
        .from('cat_skus')
        .select('id, model_id')
        .in(
            'model_id',
            models.map(m => m.id)
        );
    if (skuErr) throw new Error(`SKU lookup failed: ${skuErr.message}`);
    const skus = (skuRows || []) as SkuRow[];
    if (skus.length === 0) {
        console.log('[reprice_model_rows] No SKUs found for model.');
        return;
    }
    const skuModelMap = new Map(skus.map(s => [s.id, String(s.model_id || '')]));

    const { data: priceRows, error: priceErr } = await admin
        .from('cat_price_state_mh')
        .select('id, sku_id, state_code, ex_showroom, publish_stage, is_popular, gst_rate, hsn_code')
        .in(
            'sku_id',
            skus.map(s => s.id)
        )
        .eq('state_code', stateArg);
    if (priceErr) throw new Error(`Price rows lookup failed: ${priceErr.message}`);

    const rows = (priceRows || []) as PriceRow[];
    if (rows.length === 0) {
        console.log('[reprice_model_rows] No pricing rows found for selected model/state.');
        return;
    }

    const { data: regRuleRows } = await admin
        .from('cat_reg_rules')
        .select(
            'id, rule_name, state_code, vehicle_type, effective_from, status, state_tenure, bh_tenure, company_multiplier, components, version, updated_at'
        )
        .eq('status', 'ACTIVE')
        .eq('state_code', stateArg)
        .limit(1);

    const regRule = mapRegRule(((regRuleRows || [])[0] as RegRuleRow) || null);

    const { data: insRuleRows, error: insErr } = await admin
        .from('cat_ins_rules')
        .select(
            'id, display_id, rule_name, state_code, insurer_name, vehicle_type, effective_from, status, idv_percentage, gst_percentage, version, updated_at, created_at, od_components, tp_components, addons'
        )
        .or(`state_code.eq.${stateArg},state_code.eq.ALL`)
        .eq('status', 'ACTIVE')
        .order('state_code', { ascending: false })
        .limit(1);
    if (insErr) throw new Error(`Insurance rule lookup failed: ${insErr.message}`);
    if (!insRuleRows || insRuleRows.length === 0) {
        throw new Error(`No active insurance rule found for state ${stateArg} or ALL`);
    }
    const insRule = mapInsRule(insRuleRows[0] as InsRuleRow);

    const ADDON_COLUMN_MAP: Record<string, string> = {
        personal_accident_cover: 'personal_accident_cover',
        personal_accident_pa_cover: 'personal_accident_cover',
        'personal_accident_(pa)_cover': 'personal_accident_cover',
        pa_cover: 'personal_accident_cover',
        pa: 'personal_accident_cover',
        zero_depreciation: 'zero_depreciation',
        return_to_invoice_rti: 'return_to_invoice',
        'return_to_invoice_(rti)': 'return_to_invoice',
        return_to_invoice: 'return_to_invoice',
        rti: 'return_to_invoice',
        consumables_cover: 'consumables_cover',
        consumables: 'consumables_cover',
        engine_protection: 'engine_protector',
        engine_protector: 'engine_protector',
        roadside_assistance_rsa: 'roadside_assistance',
        'roadside_assistance_(rsa)': 'roadside_assistance',
        roadside_assistance: 'roadside_assistance',
        rsa: 'roadside_assistance',
        key_protect: 'key_protect',
        tyre_protect: 'tyre_protect',
        pillion_cover: 'pillion_cover',
    };

    let scanned = 0;
    let changed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        scanned += 1;
        const exShowroom = toNum(row.ex_showroom);
        if (exShowroom <= 0) {
            skipped += 1;
            continue;
        }

        const modelId = skuModelMap.get(row.sku_id);
        const model = modelId ? modelById.get(modelId) : undefined;
        if (!model) {
            skipped += 1;
            continue;
        }

        const engineCC = toNum(model.engine_cc || 110);
        const fuelType = String(model.fuel_type || 'PETROL');
        const modelGstRate = toNum(model.item_tax_rate);
        const gstRatePercent =
            Number.isFinite(modelGstRate) && modelGstRate > 0
                ? modelGstRate
                : toNum(row.gst_rate || (engineCC > 350 ? 40 : 18));

        const rtoJson = calcRtoJson(exShowroom, regRule, engineCC, fuelType);

        const insCtx: InsuranceCalculationContext = {
            exShowroom,
            engineCc: engineCC,
            fuelType,
            isNewVehicle: true,
            odTenure: 1,
            tpTenure: 5,
        };
        const ins = engineCalculateInsurance(insRule, insCtx);

        const odBase = round2(toNum(ins.odTotal));
        const tpBase = round2(toNum(ins.tpTotal));
        const odGst = round2(odBase * (toNum(insRule.gstPercentage) / 100));
        const tpGst = round2(tpBase * (toNum(insRule.gstPercentage) / 100));
        const odTotal = round2(odBase + odGst);
        const tpTotal = round2(tpBase + tpGst);
        const mandatoryBase = round2(odBase + tpBase);
        const mandatoryGst = round2(odGst + tpGst);
        const grossInsurance = round2(mandatoryBase + mandatoryGst);
        const onRoad = round2(exShowroom + toNum(rtoJson.STATE.total) + grossInsurance);

        const stateCess = toNum(rtoJson.STATE.cessAmount || 0);
        const bhCess = toNum(rtoJson.BH.cessAmount || 0);
        const companyCess = toNum(rtoJson.COMPANY.cessAmount || 0);
        const stateTax = Math.max(0, toNum(rtoJson.STATE.roadTax) - stateCess);
        const bhTax = Math.max(0, toNum(rtoJson.BH.roadTax) - bhCess);
        const companyTax = Math.max(0, toNum(rtoJson.COMPANY.roadTax) - companyCess);
        const taxRate = (taxAmount: number) => (exShowroom > 0 ? round2((taxAmount * 100) / exShowroom) : 0);

        const exShowroomBasic = round2(exShowroom / (1 + gstRatePercent / 100));
        const exShowroomGstAmount = round2(exShowroom - exShowroomBasic);

        const addonCols: Record<string, unknown> = {};
        for (const addon of ins.addonBreakdown || []) {
            const rawKey = String(addon.label || addon.componentId || '')
                .toLowerCase()
                .replace(/[^a-z0-9_]+/g, '_')
                .replace(/^_|_$/g, '');
            const isUuidLike = /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/.test(rawKey);
            if (isUuidLike) continue;
            const colKey = ADDON_COLUMN_MAP[rawKey] || null;
            if (!colKey) continue;

            const base = round2(toNum(addon.amount));
            const gst = round2(base * (toNum(insRule.gstPercentage) / 100));
            const total = round2(base + gst);

            addonCols[`addon_${colKey}_amount`] = base;
            addonCols[`addon_${colKey}_gst_amount`] = gst;
            addonCols[`addon_${colKey}_total_amount`] = total;
            addonCols[`addon_${colKey}_default`] = false;
        }

        const payload = {
            ex_showroom: exShowroom,
            ex_factory: exShowroomBasic,
            ex_factory_gst_amount: exShowroomGstAmount,
            logistics_charges: 0,
            logistics_charges_gst_amount: 0,
            gst_rate: gstRatePercent,
            hsn_code: String(model.hsn_code || row.hsn_code || '').trim() || null,
            on_road_price: onRoad,
            rto_default_type: rtoJson.default,
            rto_smartcard_charges_state: toNum(rtoJson.STATE.smartCardCharges || 0),
            rto_smartcard_charges_bh: toNum(rtoJson.BH.smartCardCharges || 0),
            rto_smartcard_charges_company: toNum(rtoJson.COMPANY.smartCardCharges || 0),
            rto_postal_charges_state: toNum(rtoJson.STATE.postalCharges || 0),
            rto_postal_charges_bh: toNum(rtoJson.BH.postalCharges || 0),
            rto_postal_charges_company: toNum(rtoJson.COMPANY.postalCharges || 0),
            rto_registration_fee_state: toNum(rtoJson.STATE.registrationCharges || 0),
            rto_registration_fee_bh: toNum(rtoJson.BH.registrationCharges || 0),
            rto_registration_fee_company: toNum(rtoJson.COMPANY.registrationCharges || 0),
            rto_roadtax_rate_state: taxRate(stateTax),
            rto_roadtax_rate_bh: taxRate(bhTax),
            rto_roadtax_rate_company: taxRate(companyTax),
            rto_roadtax_amount_state: stateTax,
            rto_roadtax_amount_bh: bhTax,
            rto_roadtax_amount_company: companyTax,
            rto_roadtax_cess_rate_state: toNum(rtoJson.STATE.cessRate || 0),
            rto_roadtax_cess_rate_bh: toNum(rtoJson.BH.cessRate || 0),
            rto_roadtax_cess_rate_company: toNum(rtoJson.COMPANY.cessRate || 0),
            rto_roadtax_cess_amount_state: stateCess,
            rto_roadtax_cess_amount_bh: bhCess,
            rto_roadtax_cess_amount_company: companyCess,
            rto_total_state: toNum(rtoJson.STATE.total || 0),
            rto_total_bh: toNum(rtoJson.BH.total || 0),
            rto_total_company: toNum(rtoJson.COMPANY.total || 0),
            ins_own_damage_premium_amount: odBase,
            ins_own_damage_gst_amount: odGst,
            ins_own_damage_total_amount: odTotal,
            ins_liability_only_premium_amount: tpBase,
            ins_liability_only_gst_amount: tpGst,
            ins_liability_only_total_amount: tpTotal,
            ins_sum_mandatory_insurance: mandatoryBase,
            ins_sum_mandatory_insurance_gst_amount: mandatoryGst,
            ins_gross_premium: grossInsurance,
            ins_gst_rate: toNum(insRule.gstPercentage || 18),
            is_popular: row.is_popular ?? false,
            updated_at: new Date().toISOString(),
            ...addonCols,
        };

        changed += 1;

        if (!apply) continue;

        const { error: upsertErr } = await admin
            .from('cat_price_state_mh')
            .update(payload)
            .eq('id', row.id)
            .eq('sku_id', row.sku_id)
            .eq('state_code', row.state_code);
        if (upsertErr) {
            failed += 1;
            console.error(`[reprice_model_rows] update failed sku=${row.sku_id}: ${upsertErr.message}`);
            continue;
        }
        updated += 1;
    }

    console.log(
        `[reprice_model_rows] scanned=${scanned} changed=${changed} updated=${updated} skipped=${skipped} failed=${failed}`
    );
    if (!apply) {
        console.log('[reprice_model_rows] Dry-run complete. Add --apply to persist.');
    }
}

main().catch(err => {
    console.error('[reprice_model_rows] fatal:', err);
    process.exit(1);
});
