'use server';

import { adminClient } from '@/lib/supabase/admin';
import { RoutingStrategy, BankScheme } from '@/types/bankPartner';
import { getErrorMessage } from '@/lib/utils/errorMessage';

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

        // 2) Fetch all active bank partners
        const { data: banks, error: bErr } = await adminClient
            .from('id_tenants')
            .select('id, name')
            .eq('type', 'BANK')
            .eq('status', 'ACTIVE');

        if (bErr) throw bErr;

        // 3) Fetch all active schemes from normalized table
        const bankIds = (banks || []).map(b => b.id);
        const { data: schemes, error: sErr } = await adminClient
            .from('fin_marketplace_schemes')
            .select('*')
            .in('lender_tenant_id', bankIds)
            .eq('is_marketplace_active', true)
            .eq('status', 'ACTIVE');

        if (sErr) throw sErr;

        const bankMap = new Map<string, { id: string; name: string; schemes: BankScheme[] }>();
        const allSchemes: { partnerId: string; partnerName: string; scheme: BankScheme }[] = [];

        // Group schemes by bank
        for (const b of banks || []) {
            bankMap.set(b.id, { id: b.id, name: b.name, schemes: [] });
        }

        for (const s of schemes || []) {
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
                charges: s.charges_jsonb || [],
                applicability: { brands: 'ALL', models: 'ALL', dealerships: 'ALL' },
            } as any;

            const bank = bankMap.get(s.lender_tenant_id);
            if (bank) {
                bank.schemes.push(mapped);
                allSchemes.push({ partnerId: bank.id, partnerName: bank.name, scheme: mapped });
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

            // Sort by total cost of credit (APR proxy) — accounts for FLAT vs REDUCING + charges
            const computeCost = (scheme: any): number => {
                const refLoan = 100000;
                const refTenure = 36;
                const roi = scheme.interestRate ?? 0;
                const iType = scheme.interestType || 'REDUCING';
                let emi: number;
                if (iType === 'FLAT') {
                    emi = (refLoan + refLoan * (roi / 100) * (refTenure / 12)) / refTenure;
                } else {
                    const mr = roi / 100 / 12;
                    emi = mr === 0 ? refLoan / refTenure : refLoan * (mr / (1 - Math.pow(1 + mr, -refTenure)));
                }
                let upfront = 0;
                for (const c of scheme.charges || []) {
                    if (c.impact === 'UPFRONT') {
                        upfront += c.type === 'PERCENTAGE' ? refLoan * ((c.value || 0) / 100) : c.value || 0;
                    }
                }
                return emi * refTenure + upfront;
            };
            const sorted = [...allSchemes].sort((a, b) => computeCost(a.scheme) - computeCost(b.scheme));
            const best = sorted[0];

            return {
                strategy,
                partnerId: best.partnerId,
                partnerName: best.partnerName,
                scheme: best.scheme,
                allSchemes: sorted.map(s => s.scheme),
                reason: `Cheapest (Total Cost): ${best.partnerName} @ ${best.scheme.interestRate}% ${best.scheme.interestType || 'REDUCING'}`,
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
    } catch (error: unknown) {
        console.error('[resolveFinanceRoute] Error:', getErrorMessage(error));
        return {
            strategy: 'MANUAL',
            partnerId: null,
            partnerName: null,
            scheme: null,
            allSchemes: [],
            reason: `Error: ${getErrorMessage(error)}`,
        };
    }
}
