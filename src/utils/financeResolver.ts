import { adminClient } from '@/lib/supabase/admin';
import { BankScheme } from '@/types/bankPartner';

export type ViewerPersona = 'CUSTOMER' | 'DEALER' | 'BANKER';

export interface ViewerContext {
    persona: ViewerPersona;
    tenantId?: string; // Bank tenant ID for BANKER persona
    activeFinancerId?: string | null; // Explicit finance context chosen by dealer team
}

export type FinanceLogic =
    | 'PREFERRED_FINANCIER'
    | 'CUSTOMER_BEST_EMI'
    | 'DEALER_BEST_PAYOUT'
    | 'BANKER_PRIMARY'
    | 'FALLBACK';

export async function resolveFinanceScheme(
    make: string,
    model: string,
    leadId?: string,
    viewerContext?: ViewerContext
) {
    const supabase = adminClient;
    const persona = viewerContext?.persona || 'CUSTOMER';

    // 0. Fetch all active bank partners
    const { data: rawBanks } = await supabase
        .from('id_tenants')
        .select('id, name')
        .eq('type', 'BANK')
        .eq('status', 'ACTIVE');

    if (!rawBanks || rawBanks.length === 0) return null;

    // Fetch schemes from normalized table and attach to bank objects
    const bankIds = rawBanks.map(b => b.id);
    const { data: schemeRows } = await supabase
        .from('fin_marketplace_schemes')
        .select('*')
        .in('lender_tenant_id', bankIds)
        .eq('is_marketplace_active', true)
        .eq('status', 'ACTIVE');

    const schemesByBank = new Map<string, BankScheme[]>();
    for (const s of schemeRows || []) {
        const mapped: BankScheme = {
            id: s.scheme_code,
            name: s.scheme_code,
            interestRate: Number(s.roi),
            interestType: (s as any).interest_type || 'REDUCING',
            maxLTV: Number(s.ltv),
            payout: Number(s.processing_fee),
            payoutType: s.processing_fee_type as any,
            minLoanAmount: Number(s.min_loan_amount),
            maxLoanAmount: Number(s.max_loan_amount),
            minTenure: s.min_tenure,
            maxTenure: s.max_tenure,
            allowedTenures: s.allowed_tenures || [],
            isActive: true,
            isPrimary: false,
            validFrom: s.valid_from,
            validTo: s.valid_until,
            charges: (s as any).charges_jsonb || [],
            applicability: { brands: 'ALL', models: 'ALL', dealerships: 'ALL' },
        } as any;
        const tid = s.lender_tenant_id;
        if (tid) {
            if (!schemesByBank.has(tid)) schemesByBank.set(tid, []);
            schemesByBank.get(tid)!.push(mapped);
        }
    }

    const allBanks = rawBanks.map(b => ({ ...b, schemes: schemesByBank.get(b.id) || [] }));

    // P0: Lead's Preferred Financier (highest priority, regardless of persona)
    if (leadId) {
        const { data: lead } = await (supabase as any)
            .from('crm_leads')
            .select('preferred_financier_id')
            .eq('id', leadId)
            .single();

        if (lead?.preferred_financier_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const preferredBank = allBanks.find((b: any) => b.id === lead.preferred_financier_id);
            if (preferredBank) {
                const scheme = findBestSchemeForBank(preferredBank, make, model);
                if (scheme) return { bank: preferredBank, scheme, logic: 'PREFERRED_FINANCIER' as FinanceLogic };
            }
        }
    }

    // P1: Persona-Based Resolution
    switch (persona) {
        case 'BANKER':
            return resolveForBanker(allBanks, make, model, viewerContext?.tenantId);

        case 'DEALER':
            return resolveForDealer(allBanks, make, model, viewerContext?.activeFinancerId || null);

        case 'CUSTOMER':
        default:
            return resolveForCustomer(allBanks, make, model);
    }
}

/**
 * Compute normalized total cost of credit for a scheme.
 * Uses a standard ₹1,00,000 loan at 36 months as reference.
 * Total cost = (EMI × tenure) + upfront charges.
 * This is equivalent to APR-based ranking for same-tenure comparisons.
 */
function computeNormalizedCost(scheme: BankScheme): number {
    const refLoan = 100000;
    const refTenure = 36;
    const roi = scheme.interestRate ?? 0;
    const interestType = (scheme as any).interestType || 'REDUCING';

    // EMI calculation based on interest type
    let emi: number;
    if (interestType === 'FLAT') {
        // FLAT: EMI = (P + P × ROI × years) / months
        emi = (refLoan + refLoan * (roi / 100) * (refTenure / 12)) / refTenure;
    } else {
        // REDUCING: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
        const monthlyRate = roi / 100 / 12;
        if (monthlyRate === 0) {
            emi = refLoan / refTenure;
        } else {
            emi = refLoan * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -refTenure)));
        }
    }

    // Sum upfront charges
    let upfrontCharges = 0;
    const charges = scheme.charges || [];
    for (const c of charges) {
        if ((c as any).impact === 'UPFRONT') {
            if ((c as any).type === 'PERCENTAGE') {
                upfrontCharges += refLoan * (((c as any).value || 0) / 100);
            } else {
                upfrontCharges += (c as any).value || 0;
            }
        }
    }

    return emi * refTenure + upfrontCharges;
}

/**
 * CUSTOMER: Pick the scheme with the lowest Total Cost of Credit across ALL banks.
 * This accounts for interest type (FLAT vs REDUCING), charges, and gives the true cheapest loan.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveForCustomer(allBanks: any[], make: string, model: string) {
    let bestResult: { bank: any; scheme: BankScheme; cost: number } | null = null;

    for (const bank of allBanks) {
        const eligible = getEligibleSchemes(bank, make, model);
        for (const scheme of eligible) {
            const totalCost = computeNormalizedCost(scheme);
            if (!bestResult || totalCost < bestResult.cost) {
                bestResult = { bank, scheme, cost: totalCost };
            }
        }
    }

    if (bestResult) {
        return { bank: bestResult.bank, scheme: bestResult.scheme, logic: 'CUSTOMER_BEST_EMI' as FinanceLogic };
    }

    // Fallback: any active scheme
    return fallbackFirstScheme(allBanks, make, model);
}

/**
 * DEALER: Pick the scheme with the highest payout (dealer commission) across ALL banks.
 * If no payout data exists (all payouts = 0), fall back to cheapest-for-customer ranking.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveForDealer(allBanks: any[], make: string, model: string, forcedBankId?: string | null) {
    if (forcedBankId) {
        const forcedBank = allBanks.find((b: any) => b.id === forcedBankId);
        if (forcedBank) {
            const eligible = getEligibleSchemes(forcedBank, make, model);
            if (eligible.length > 0) {
                const primary = eligible.find(s => s.isPrimary);
                return {
                    bank: forcedBank,
                    scheme: primary || eligible[0],
                    logic: 'DEALER_BEST_PAYOUT' as FinanceLogic,
                };
            }
        }
    }

    let bestResult: { bank: any; scheme: BankScheme; payoutScore: number } | null = null;

    for (const bank of allBanks) {
        const eligible = getEligibleSchemes(bank, make, model);
        for (const scheme of eligible) {
            const payoutScore = normalizePayoutScore(scheme);
            if (!bestResult || payoutScore > bestResult.payoutScore) {
                bestResult = { bank, scheme, payoutScore };
            }
        }
    }

    // If best payout is 0 (no commission data), fall back to cheapest-for-customer
    if (!bestResult || bestResult.payoutScore === 0) {
        return resolveForCustomer(allBanks, make, model);
    }

    return { bank: bestResult.bank, scheme: bestResult.scheme, logic: 'DEALER_BEST_PAYOUT' as FinanceLogic };
}

/**
 * BANKER: Only show schemes from the banker's own bank.
 * Priority: isPrimary > first active scheme.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveForBanker(allBanks: any[], make: string, model: string, bankTenantId?: string) {
    if (!bankTenantId) {
        // No bank ID — fall back to customer logic
        return resolveForCustomer(allBanks, make, model);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bank = allBanks.find((b: any) => b.id === bankTenantId);
    if (!bank) {
        return resolveForCustomer(allBanks, make, model);
    }

    const eligible = getEligibleSchemes(bank, make, model);
    if (eligible.length === 0) {
        // Bank has no eligible schemes for this product — fall back to customer
        return resolveForCustomer(allBanks, make, model);
    }

    // Prefer isPrimary, then first eligible
    const primary = eligible.find(s => s.isPrimary);
    const scheme = primary || eligible[0];

    return { bank, scheme, logic: 'BANKER_PRIMARY' as FinanceLogic };
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Get all eligible (active + applicable) schemes for a bank given make/model.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEligibleSchemes(bank: any, make: string, model: string): BankScheme[] {
    const schemes: BankScheme[] = bank.schemes || [];
    return schemes.filter(s => {
        if (!s.isActive) return false;
        return isApplicable(s, make, model);
    });
}

/**
 * Check if a scheme applies to this make/model.
 * A scheme applies if:
 * - applicability.models includes the model (exact match)
 * - applicability.brands includes the make (exact match)
 * - applicability is 'ALL' or not set (universal)
 */
function isApplicable(scheme: BankScheme, make: string, model: string): boolean {
    const app = scheme.applicability;
    if (!app) return true; // No restrictions = universal

    // Check model-level restriction
    if (Array.isArray(app.models) && app.models.length > 0) {
        const modelMatch = app.models.some(m => m.toLowerCase() === model.toLowerCase());
        if (modelMatch) return true;
        // If explicit model list exists but doesn't match, check brand
    }

    // Check brand-level restriction
    if (Array.isArray(app.brands) && app.brands.length > 0) {
        const brandMatch = app.brands.some(b => b.toLowerCase() === make.toLowerCase());
        if (brandMatch) return true;
        // If explicit brand list but no match, this scheme doesn't apply
        return false;
    }

    // If brands/models are 'ALL' or not arrays, it's universal
    return true;
}

/**
 * Normalize payout to a comparable score.
 * PERCENTAGE payouts are multiplied by 1000 (assumes ~₹1L loan as baseline).
 * FIXED payouts are taken as-is.
 */
function normalizePayoutScore(scheme: BankScheme): number {
    const payout = scheme.payout || 0;
    if (scheme.payoutType === 'PERCENTAGE') {
        return payout * 1000; // 2% = 2000 score (equivalent to ₹2000 on ₹1L)
    }
    return payout; // Fixed ₹ amount
}

/**
 * Last resort fallback: pick the first active scheme from any bank.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fallbackFirstScheme(allBanks: any[], make: string, model: string) {
    for (const bank of allBanks) {
        const scheme = findBestSchemeForBank(bank, make, model);
        if (scheme) return { bank, scheme, logic: 'FALLBACK' as FinanceLogic };
    }
    return null;
}

/**
 * Legacy helper: find any applicable scheme for a bank (model > brand > primary > first).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBestSchemeForBank(bank: any, make: string, model: string) {
    const schemes: BankScheme[] = bank.schemes || [];
    const activeSchemes = schemes.filter(s => s.isActive);

    // a. Model-targeted
    const modelTargeted = activeSchemes.find(
        s =>
            Array.isArray(s.applicability?.models) &&
            s.applicability.models.some(m => m.toLowerCase() === model.toLowerCase())
    );
    if (modelTargeted) return modelTargeted;

    // b. Brand-targeted
    const brandTargeted = activeSchemes.find(
        s =>
            Array.isArray(s.applicability?.brands) &&
            s.applicability.brands.some(b => b.toLowerCase() === make.toLowerCase())
    );
    if (brandTargeted) return brandTargeted;

    // c. Primary
    const primary = activeSchemes.find(s => s.isPrimary);
    if (primary) return primary;

    // d. First active
    return activeSchemes[0] || null;
}
