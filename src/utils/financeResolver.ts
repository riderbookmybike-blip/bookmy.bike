import { adminClient } from '@/lib/supabase/admin';
import { BankScheme, FinanceRoutingTable, DayOfWeek } from '@/types/bankPartner';

export async function resolveFinanceScheme(make: string, model: string, leadId?: string) {
    const supabase = adminClient;
    const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[new Date().getDay()];

    // 0. Fetch all bank partners first (optimization: needed for both paths)
    const { data: allBanks } = await supabase
        .from('id_tenants')
        .select('id, name, config')
        .eq('type', 'BANK')
        .eq('status', 'ACTIVE');

    if (!allBanks) return null;

    // 0.5 Check for Lead Preferred Financier
    if (leadId) {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select('preferred_financier_id')
            .eq('id', leadId)
            .single();

        if (lead && lead.preferred_financier_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const preferredBank = allBanks.find((b: any) => b.id === lead.preferred_financier_id);
            if (preferredBank) {
                const scheme = findBestSchemeForBank(preferredBank, make, model);
                if (scheme) return { bank: preferredBank, scheme, logic: 'PREFERRED_FINANCIER' };
            }
        }
    }

    // 1. Fetch Routing Config (Standard Routing)
    // Dynamic Fetch by Type AUMS to avoid hardcoded ID mismatch
    const { data: aums } = await supabase
        .from('id_tenants')
        .select('config')
        .eq('type', 'AUMS')
        .eq('status', 'ACTIVE')
        .limit(1)
        .single();

    const routing: FinanceRoutingTable | undefined = aums?.config?.financeRouting;

    // Fallback: If no AUMS routing, use first active bank
    if (!routing || !routing[today]) {
        console.warn('[Finance Resolver] No AUMS routing found, using fallback: first active bank');
        const fallbackBank = allBanks.find((b: any) => (b.config?.schemes?.length || 0) > 0);
        if (fallbackBank) {
            const scheme = findBestSchemeForBank(fallbackBank, make, model);
            if (scheme) return { bank: fallbackBank, scheme, logic: 'FALLBACK_NO_ROUTING' };
        }
        return null;
    }

    const dayConfig = routing[today];
    const priorities = [dayConfig.p1, dayConfig.p2, dayConfig.p3].filter(p => p && p !== '');

    // 3. Resolution Logic
    for (const partnerId of priorities) {
        if (partnerId === 'ANY') {
            // Pick first available bank with at least one active scheme
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyBank = allBanks.find((b: any) => (b.config?.schemes?.length || 0) > 0);
            if (anyBank) {
                const scheme = findBestSchemeForBank(anyBank, make, model);
                if (scheme) return { bank: anyBank, scheme, logic: `DAY_ROUTING_${today.toUpperCase()}` };
            }
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bank = allBanks.find((b: any) => b.id === partnerId);
        if (!bank) continue;

        const scheme = findBestSchemeForBank(bank, make, model);
        if (scheme) return { bank: bank, scheme, logic: `DAY_ROUTING_${today.toUpperCase()}` };
    }

    return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBestSchemeForBank(bank: any, make: string, model: string) {
    const schemes: BankScheme[] = bank.config?.schemes || [];
    const activeSchemes = schemes.filter(s => s.isActive);

    // a. Try Targeted (Model exact match)
    const modelTargeted = activeSchemes.find(
        s =>
            Array.isArray(s.applicability?.models) &&
            s.applicability.models.some(m => m.toLowerCase() === model.toLowerCase())
    );
    if (modelTargeted) return modelTargeted;

    // b. Try Targeted (Brand exact match)
    const brandTargeted = activeSchemes.find(
        s =>
            Array.isArray(s.applicability?.brands) &&
            s.applicability.brands.some(b => b.toLowerCase() === make.toLowerCase())
    );
    if (brandTargeted) return brandTargeted;

    // c. Fallback to Primary
    const primary = activeSchemes.find(s => s.isPrimary);
    if (primary) return primary;

    // d. Final fallback: First active scheme
    return activeSchemes[0] || null;
}
