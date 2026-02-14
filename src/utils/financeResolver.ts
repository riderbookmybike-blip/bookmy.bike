import { adminClient } from '@/lib/supabase/admin';
import { BankScheme } from '@/types/bankPartner';

export type ViewerPersona = 'CUSTOMER' | 'DEALER' | 'BANKER';

export interface ViewerContext {
    persona: ViewerPersona;
    tenantId?: string; // Bank tenant ID for BANKER persona
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
    const { data: allBanks } = await supabase
        .from('id_tenants')
        .select('id, name, config')
        .eq('type', 'BANK')
        .eq('status', 'ACTIVE');

    if (!allBanks || allBanks.length === 0) return null;

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
            return resolveForDealer(allBanks, make, model);

        case 'CUSTOMER':
        default:
            return resolveForCustomer(allBanks, make, model);
    }
}

/**
 * CUSTOMER: Pick the scheme with the lowest interest rate across ALL banks.
 * This gives the customer the best possible EMI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveForCustomer(allBanks: any[], make: string, model: string) {
    let bestResult: { bank: any; scheme: BankScheme; rate: number } | null = null;

    for (const bank of allBanks) {
        const eligible = getEligibleSchemes(bank, make, model);
        for (const scheme of eligible) {
            const effectiveRate = scheme.interestRate ?? Infinity;
            if (!bestResult || effectiveRate < bestResult.rate) {
                bestResult = { bank, scheme, rate: effectiveRate };
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
 * Payout can be FIXED (₹) or PERCENTAGE (%). We normalize to compare.
 * Since we don't have the exact loan amount here, for PERCENTAGE payouts we use
 * a normalized score (percentage * 1000) to compare against fixed amounts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveForDealer(allBanks: any[], make: string, model: string) {
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

    if (bestResult) {
        return { bank: bestResult.bank, scheme: bestResult.scheme, logic: 'DEALER_BEST_PAYOUT' as FinanceLogic };
    }

    // Fallback: any active scheme
    return fallbackFirstScheme(allBanks, make, model);
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
    const schemes: BankScheme[] = bank.config?.schemes || [];
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
    const schemes: BankScheme[] = bank.config?.schemes || [];
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
