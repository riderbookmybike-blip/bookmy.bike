import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const BATCH_SIZE = Number(process.env.BACKFILL_BATCH_SIZE || 200);
const DRY_RUN = process.env.BACKFILL_DRY_RUN === '1';

const chunk = <T>(arr: T[], size: number) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const toNumber = (val: any, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
};

const ensureQty = (items: any[] = []) =>
    items.map(it => ({
        ...it,
        qty: toNumber(it.qty, 1) || 1,
    }));

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
            description: 'Mandatory',
            isMandatory: true,
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
            description: 'Mandatory',
            isMandatory: true,
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

async function main() {
    let from = 0;
    let totalUpdated = 0;
    let totalScanned = 0;

    while (true) {
        const { data: quotes, error } = await adminClient
            .from('crm_quotes')
            .select('id, commercials, active_finance_id')
            .order('created_at', { ascending: true })
            .range(from, from + BATCH_SIZE - 1);

        if (error) throw error;
        if (!quotes || quotes.length === 0) break;

        totalScanned += quotes.length;
        const activeIds = quotes.map(q => q.active_finance_id).filter(Boolean) as string[];

        const attemptsMap = new Map<string, any>();
        if (activeIds.length > 0) {
            for (const batch of chunk(activeIds, 200)) {
                const { data: attempts, error: aErr } = await adminClient
                    .from('crm_quote_finance_attempts')
                    .select('*')
                    .in('id', batch);
                if (aErr) throw aErr;
                (attempts || []).forEach(a => attemptsMap.set(a.id, a));
            }
        }

        for (const q of quotes) {
            const commercials = (q.commercials || {}) as any;
            const snap = commercials.pricing_snapshot || {};
            const attempt = q.active_finance_id ? attemptsMap.get(q.active_finance_id) : null;

            const finance = mergeFinance(commercials, snap, attempt);
            const pricing_snapshot = mergeSnapshot(commercials, finance);
            const delivery = mergeDelivery(commercials, pricing_snapshot);

            const nextCommercials = {
                ...commercials,
                finance,
                pricing_snapshot,
                ...(delivery ? { delivery } : {}),
            };

            const changed = JSON.stringify(nextCommercials) !== JSON.stringify(commercials);
            if (!changed) continue;

            if (!DRY_RUN) {
                const { error: upErr } = await adminClient
                    .from('crm_quotes')
                    .update({ commercials: nextCommercials })
                    .eq('id', q.id);
                if (upErr) throw upErr;
            }

            totalUpdated += 1;
        }

        from += BATCH_SIZE;
    }

    console.log(`Backfill done. scanned=${totalScanned} updated=${totalUpdated} dry_run=${DRY_RUN}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
