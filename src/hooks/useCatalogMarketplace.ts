'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type CandidateOffer, type ScoredOffer, rankCandidates, type OfferMode } from '@/lib/marketplace/winnerEngine';

/**
 * Hook to fetch and hydrate marketplace offers for the entire catalog batched by location.
 * Avoids per-card RPC calls by fetching all candidate offers for a district at once.
 */
export function useCatalogMarketplace(
    district: string | null | undefined,
    stateCode: string | null | undefined,
    mode: OfferMode = 'BEST_OFFER'
) {
    const [winnersMap, setWinnersMap] = useState<Record<string, ScoredOffer>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Simple in-memory cache to avoid redundant RPC calls within the same session
    // Key: district|stateCode
    // Note: mode is applied on the client to re-rank cached candidates
    const candidatesCache = useRef<Record<string, CandidateOffer[]>>({});

    useEffect(() => {
        if (!district || !stateCode) return;

        const cacheKey = `${district}|${stateCode}`;

        async function fetchMarketplaceData() {
            // Check cache first
            if (candidatesCache.current[cacheKey]) {
                const candidates = candidatesCache.current[cacheKey];
                processCandidates(candidates);
                return;
            }

            setIsLoading(true);
            try {
                const supabase = createClient();
                // Fetch all candidate offers for the district/state
                const { data, error } = await supabase.rpc('get_market_candidate_offers', {
                    p_district_name: district as string,
                    p_state_code: stateCode as string,
                });

                if (error) {
                    console.error('[useCatalogMarketplace] RPC Error:', error);
                    return;
                }

                if (data) {
                    candidatesCache.current[cacheKey] = data;
                    processCandidates(data);

                    // Phase 6D: async shadow logging — fire-and-forget, never blocks UI
                    // Logs top winner per SKU to shadow_compare_log for 48h production gate.
                    // Only runs when legacy RPC path is active (NEXT_PUBLIC_USE_CANDIDATE_RPC=false).
                    if (process.env.NEXT_PUBLIC_USE_CANDIDATE_RPC !== 'true') {
                        const logShadow = async () => {
                            try {
                                // Group by SKU and find legacy winner (offer_amount ASC)
                                const bySkuId: Record<string, (typeof data)[0]> = {};
                                data.forEach((row: any) => {
                                    if (!row.vehicle_color_id) return;
                                    const cur = bySkuId[row.vehicle_color_id];
                                    if (!cur || Number(row.offer_amount) < Number(cur.offer_amount)) {
                                        bySkuId[row.vehicle_color_id] = row;
                                    }
                                });
                                // Log top 5 SKUs to avoid thundering herd
                                const sample = Object.values(bySkuId).slice(0, 5);
                                await Promise.allSettled(
                                    sample.map((winner: any) =>
                                        // @ts-ignore — log_winner_read not yet in generated types (Phase 6D M22)
                                        supabase.rpc('log_winner_read', {
                                            p_sku_id: winner.vehicle_color_id,
                                            p_state_code: stateCode as string,
                                            p_district: district as string,
                                            p_legacy_dealer_id: winner.dealer_id,
                                            p_legacy_offer: Number(winner.offer_amount),
                                            p_legacy_tat: Number(winner.tat_effective_hours ?? 0),
                                        })
                                    )
                                );
                            } catch {
                                // Shadow logging is non-blocking — errors silently discarded
                            }
                        };
                        void logShadow();
                    }
                }
            } catch (err) {
                console.error('[useCatalogMarketplace] Fetch failed:', err);
            } finally {
                setIsLoading(false);
            }
        }

        function processCandidates(candidates: CandidateOffer[]) {
            // 1. Group by SKU
            const groupedBySku: Record<string, CandidateOffer[]> = {};
            candidates.forEach(off => {
                if (off.vehicle_color_id) {
                    if (!groupedBySku[off.vehicle_color_id]) {
                        groupedBySku[off.vehicle_color_id] = [];
                    }
                    groupedBySku[off.vehicle_color_id].push(off);
                }
            });

            // 2. Rank each SKU and identify winner
            // Note: delivery charge logic is simplified here as we don't have km details for all
            // but we use the shared winnerEngine contract.
            const newWinners: Record<string, ScoredOffer> = {};

            // Dummy delivery charge fn for catalog ranking (mostly based on offer delta + distance in RPC)
            const getDeliveryCharge = (km?: number | null) => {
                const distance = km || 0;
                if (distance <= 10) return 0;
                return Math.ceil(distance * 10); // Standardized catalog mock
            };

            Object.entries(groupedBySku).forEach(([skuId, offers]) => {
                // basePayable = 0 is safe for ranking as it's constant for all dealers of same SKU
                const ranked = rankCandidates(offers, mode, 0, getDeliveryCharge);
                if (ranked[0]) {
                    newWinners[skuId] = ranked[0];
                }
            });

            setWinnersMap(newWinners);
        }

        fetchMarketplaceData();
    }, [district, stateCode, mode]); // Re-run when location or mode changes

    return {
        winnersMap,
        isLoading,
    };
}
