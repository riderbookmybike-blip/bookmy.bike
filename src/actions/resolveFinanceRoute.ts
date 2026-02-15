'use server';

import { adminClient } from '@/lib/supabase/admin';
import { RoutingStrategy, BankScheme } from '@/types/bankPartner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface ResolvedRoute {
    strategy: RoutingStrategy;
    partnerId: string | null;
    partnerName: string | null;
    scheme: BankScheme | null;
    allSchemes: BankScheme[];
    reason: string;
}

/**
 * Resolves the best finance partner + scheme for a dealer quote.
 *
 * Strategy:
 *   MANUAL             → day-wise P1 → P2 → P3 cascade
 *   CHEAPEST_FOR_CUSTOMER → lowest interestRate across all active partners
 *   MOST_PROFITABLE    → highest payout across all active partners
 */
export async function resolveFinanceRoute(dealerTenantId: string): Promise<ResolvedRoute> {
    try {
        // 1) Fetch dealer's routing config
        const { data: dealer, error: dErr } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', dealerTenantId)
            .single();

        if (dErr) throw dErr;

        const config = (dealer.config as any) || {};
        const strategy: RoutingStrategy = config.routingStrategy || 'MANUAL';
        const routing = config.financeRouting;

        // 2) Fetch all active bank partners with their schemes
        const { data: banks, error: bErr } = await adminClient
            .from('id_tenants')
            .select('id, name, config')
            .eq('type', 'BANK')
            .eq('status', 'ACTIVE');

        if (bErr) throw bErr;

        const bankMap = new Map<string, { id: string; name: string; schemes: BankScheme[] }>();
        const allSchemes: { partnerId: string; partnerName: string; scheme: BankScheme }[] = [];

        for (const b of banks || []) {
            const schemes: BankScheme[] = ((b.config as any)?.schemes || []).filter((s: BankScheme) => s.isActive);
            bankMap.set(b.id, { id: b.id, name: b.name, schemes });
            for (const s of schemes) {
                allSchemes.push({ partnerId: b.id, partnerName: b.name, scheme: s });
            }
        }

        // ─── MANUAL Strategy ────────────────────────────────────────────
        if (strategy === 'MANUAL') {
            const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon, etc.
            const todayName = DAYS[todayIndex];
            const dayConfig = routing?.[todayName];

            if (!dayConfig) {
                return {
                    strategy,
                    partnerId: null,
                    partnerName: null,
                    scheme: null,
                    allSchemes: allSchemes.map(s => s.scheme),
                    reason: `No routing configured for ${todayName}`,
                };
            }

            // Try P1 → P2 → P3
            for (const priority of ['p1', 'p2', 'p3'] as const) {
                const pid = dayConfig[priority];
                if (!pid || pid === 'ANY') continue;

                const bank = bankMap.get(pid);
                if (bank && bank.schemes.length > 0) {
                    const primary = bank.schemes.find(s => s.isPrimary) || bank.schemes[0];
                    return {
                        strategy,
                        partnerId: bank.id,
                        partnerName: bank.name,
                        scheme: primary,
                        allSchemes: bank.schemes,
                        reason: `${todayName} ${priority.toUpperCase()}: ${bank.name}`,
                    };
                }
            }

            // All set to ANY — return all schemes
            return {
                strategy,
                partnerId: null,
                partnerName: null,
                scheme: allSchemes[0]?.scheme || null,
                allSchemes: allSchemes.map(s => s.scheme),
                reason: `${todayName}: Open to all partners`,
            };
        }

        // ─── CHEAPEST_FOR_CUSTOMER Strategy ─────────────────────────────
        if (strategy === 'CHEAPEST_FOR_CUSTOMER') {
            if (allSchemes.length === 0) {
                return {
                    strategy,
                    partnerId: null,
                    partnerName: null,
                    scheme: null,
                    allSchemes: [],
                    reason: 'No active schemes available',
                };
            }

            // Sort by interest rate ascending (cheapest first)
            const sorted = [...allSchemes].sort((a, b) => a.scheme.interestRate - b.scheme.interestRate);
            const best = sorted[0];

            return {
                strategy,
                partnerId: best.partnerId,
                partnerName: best.partnerName,
                scheme: best.scheme,
                allSchemes: sorted.map(s => s.scheme),
                reason: `Cheapest: ${best.partnerName} @ ${best.scheme.interestRate}%`,
            };
        }

        // ─── MOST_PROFITABLE Strategy ───────────────────────────────────
        if (strategy === 'MOST_PROFITABLE') {
            if (allSchemes.length === 0) {
                return {
                    strategy,
                    partnerId: null,
                    partnerName: null,
                    scheme: null,
                    allSchemes: [],
                    reason: 'No active schemes available',
                };
            }

            // Sort by payout descending (most profitable first)
            const sorted = [...allSchemes].sort((a, b) => b.scheme.payout - a.scheme.payout);
            const best = sorted[0];

            return {
                strategy,
                partnerId: best.partnerId,
                partnerName: best.partnerName,
                scheme: best.scheme,
                allSchemes: sorted.map(s => s.scheme),
                reason: `Profitable: ${best.partnerName} — ${best.scheme.payout}% payout`,
            };
        }

        // Fallback
        return {
            strategy,
            partnerId: null,
            partnerName: null,
            scheme: null,
            allSchemes: allSchemes.map(s => s.scheme),
            reason: 'Unknown strategy',
        };
    } catch (error: any) {
        console.error('[resolveFinanceRoute] Error:', error.message);
        return {
            strategy: 'MANUAL',
            partnerId: null,
            partnerName: null,
            scheme: null,
            allSchemes: [],
            reason: `Error: ${error.message}`,
        };
    }
}
