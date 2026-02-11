import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const SAMPLE = Number(process.env.REPORT_SAMPLE || 5);

const toNumber = (val: any, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
};

const ensureQty = (items: any[] = []) => items.map(it => ({ ...it, qty: toNumber(it.qty, 1) || 1 }));

const buildRequiredInsurance = (snap: any) => {
    const gstRate = toNumber(snap?.insurance_gst_rate, 18);
    const tp = toNumber(snap?.insurance_tp, 0);
    const od = toNumber(snap?.insurance_od, 0);
    const items: any[] = [];
    if (tp > 0) {
        items.push({
            id: 'insurance-tp',
            name: 'Liability Only (5 Years Cover)',
            price: tp,
            breakdown: [
                { label: 'Base Premium', amount: tp },
                { label: `GST (${gstRate}%)`, amount: 0 },
            ],
        });
    }
    if (od > 0) {
        items.push({
            id: 'insurance-od',
            name: 'Comprehensive (1 Year Cover)',
            price: od,
            breakdown: [
                { label: 'Base Premium', amount: od },
                { label: `GST (${gstRate}%)`, amount: 0 },
            ],
        });
    }
    return items;
};

const mergeFinance = (commercials: any, snap: any, attempt: any | null) => {
    const finance = { ...(commercials.finance || {}) };
    if (attempt) {
        finance.bank_id = finance.bank_id || attempt.bank_id || null;
        finance.bank_name = finance.bank_name || attempt.bank_name || null;
        finance.scheme_id = finance.scheme_id || attempt.scheme_id || null;
        finance.scheme_code = finance.scheme_code || attempt.scheme_code || null;
        finance.roi = finance.roi ?? attempt.roi ?? null;
        finance.tenure_months = finance.tenure_months ?? attempt.tenure_months ?? null;
        finance.down_payment = finance.down_payment ?? attempt.down_payment ?? null;
        finance.loan_amount = finance.loan_amount ?? attempt.loan_amount ?? null;
        finance.loan_addons = finance.loan_addons ?? attempt.loan_addons ?? null;
        finance.processing_fee = finance.processing_fee ?? attempt.processing_fee ?? null;
        finance.charges_breakup = finance.charges_breakup || attempt.charges_breakup || [];
        finance.emi = finance.emi ?? attempt.emi ?? null;
        finance.status = finance.status || attempt.status || 'IN_PROCESS';
    }
    if (!finance.bank_id && snap?.finance_bank_id) finance.bank_id = snap.finance_bank_id;
    if (!finance.bank_name && snap?.finance_bank_name) finance.bank_name = snap.finance_bank_name;
    if (!finance.scheme_id && snap?.finance_scheme_id) finance.scheme_id = snap.finance_scheme_id;
    if (!finance.scheme_code && snap?.finance_scheme_name) finance.scheme_code = snap.finance_scheme_name;
    if (finance.loan_amount != null && finance.loan_addons != null && finance.gross_loan_amount == null) {
        finance.gross_loan_amount = toNumber(finance.loan_amount) + toNumber(finance.loan_addons);
    }
    return finance;
};

const mergeSnapshot = (commercials: any, finance: any) => {
    const snap = { ...(commercials.pricing_snapshot || {}) };
    snap.accessory_items = ensureQty(snap.accessory_items || snap.accessories || []);
    snap.service_items = ensureQty(snap.service_items || snap.services || []);
    if (!snap.insurance_required_items || snap.insurance_required_items.length === 0) {
        const required = buildRequiredInsurance(snap);
        if (required.length > 0) snap.insurance_required_items = required;
    }
    if (!snap.offers_items) snap.offers_items = [];
    if (!snap.warranty_items) snap.warranty_items = [];
    if (!snap.rto_options) snap.rto_options = [];
    if (snap.referral_applied === undefined) snap.referral_applied = false;
    if (snap.referral_bonus === undefined) snap.referral_bonus = 0;
    if (finance?.bank_id && !snap.finance_bank_id) snap.finance_bank_id = finance.bank_id;
    if (finance?.bank_name && !snap.finance_bank_name) snap.finance_bank_name = finance.bank_name;
    if (finance?.scheme_id && !snap.finance_scheme_id) snap.finance_scheme_id = finance.scheme_id;
    if (finance?.scheme_name && !snap.finance_scheme_name) snap.finance_scheme_name = finance.scheme_name;
    if (finance?.scheme_interest_type && !snap.finance_interest_type)
        snap.finance_interest_type = finance.scheme_interest_type;
    if (finance?.roi != null && snap.finance_roi == null) snap.finance_roi = finance.roi;
    if (finance?.loan_amount != null && snap.finance_loan_amount == null)
        snap.finance_loan_amount = finance.loan_amount;
    if (finance?.gross_loan_amount != null && snap.finance_gross_loan_amount == null)
        snap.finance_gross_loan_amount = finance.gross_loan_amount;
    if (finance?.loan_addons != null && snap.finance_funded_addons == null)
        snap.finance_funded_addons = finance.loan_addons;
    if (finance?.processing_fee != null && snap.finance_upfront_charges == null)
        snap.finance_upfront_charges = finance.processing_fee;
    if (finance?.charges_breakup && !snap.finance_charges_breakup)
        snap.finance_charges_breakup = finance.charges_breakup;
    return snap;
};

const mergeDelivery = (commercials: any, snap: any) => {
    if (commercials.delivery) return commercials.delivery;
    const loc = snap?.location || {};
    if (!loc.district && !loc.pincode) return null;
    return {
        serviceable: null,
        pincode: loc.pincode || null,
        taluka: loc.taluka || null,
        district: loc.district || null,
        stateCode: loc.stateCode || loc.state_code || null,
        delivery_tat_days: 7,
        checked_at: new Date().toISOString(),
    };
};

const pick = (obj: any, paths: string[]) => {
    const out: any = {};
    for (const p of paths) {
        const keys = p.split('.');
        let cur: any = obj;
        for (const k of keys) {
            cur = cur?.[k];
        }
        out[p] = cur;
    }
    return out;
};

(async () => {
    const { data: quotes } = await adminClient
        .from('crm_quotes')
        .select('id, display_id, commercials, active_finance_id')
        .order('created_at', { ascending: false })
        .limit(SAMPLE);

    const activeIds = (quotes || []).map(q => q.active_finance_id).filter(Boolean) as string[];
    const attemptsMap = new Map<string, any>();
    if (activeIds.length > 0) {
        const { data: attempts } = await adminClient.from('crm_quote_finance_attempts').select('*').in('id', activeIds);
        (attempts || []).forEach(a => attemptsMap.set(a.id, a));
    }

    for (const q of quotes || []) {
        const commercials = (q.commercials || {}) as any;
        const snap = commercials.pricing_snapshot || {};
        const attempt = q.active_finance_id ? attemptsMap.get(q.active_finance_id) : null;

        const finance = mergeFinance(commercials, snap, attempt);
        const pricing_snapshot = mergeSnapshot(commercials, finance);
        const delivery = mergeDelivery(commercials, pricing_snapshot);

        const nextCommercials = { ...commercials, finance, pricing_snapshot, ...(delivery ? { delivery } : {}) };

        const fields = [
            'delivery',
            'pricing_snapshot.rto_options',
            'pricing_snapshot.insurance_required_items',
            'pricing_snapshot.offers_items',
            'pricing_snapshot.warranty_items',
            'pricing_snapshot.referral_applied',
            'pricing_snapshot.referral_bonus',
            'pricing_snapshot.finance_bank_id',
            'pricing_snapshot.finance_bank_name',
            'pricing_snapshot.finance_scheme_id',
            'pricing_snapshot.finance_scheme_name',
            'pricing_snapshot.finance_interest_type',
            'pricing_snapshot.finance_roi',
            'pricing_snapshot.finance_loan_amount',
            'pricing_snapshot.finance_gross_loan_amount',
            'pricing_snapshot.finance_funded_addons',
            'pricing_snapshot.finance_upfront_charges',
            'pricing_snapshot.finance_charges_breakup',
        ];

        const before = pick(commercials, fields);
        const after = pick(nextCommercials, fields);

        console.log(`\nQuote ${q.display_id || q.id}`);
        console.log('Before:', JSON.stringify(before, null, 2));
        console.log('After :', JSON.stringify(after, null, 2));
    }
})();
