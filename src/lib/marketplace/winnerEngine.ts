export type OfferMode = 'BEST_OFFER' | 'FAST_DELIVERY';

export type CandidateOffer = {
    vehicle_color_id: string | null;
    offer_amount: number;
    dealer_id: string;
    dealer_name: string;
    studio_id?: string | null;
    district?: string | null;
    is_serviceable: boolean;
    tat_effective_hours: number | null;
    delivery_tat_days: number | null;
    updated_at: string | null;
    distance_km?: number | null;
};

export type ScoredOffer = CandidateOffer & {
    delivery_charge: number;
    winner_score: number;
};

/**
 * Computes the locked winner score for Phase 2:
 * winner_score = effective_payable - freebie_benefit
 * where effective_payable = basePayable + offer_amount + delivery_charge
 * and freebie_benefit = 0 (Phase 3 will inject actual freebie valuation).
 */
export function computeWinnerScore(
    offer: CandidateOffer & { delivery_charge: number },
    basePayable: number,
    freeBenefitFn?: () => number
): number {
    const delivery = Number(offer.delivery_charge || 0);
    const offerAmt = Number(offer.offer_amount || 0); // negative for discount
    const effectivePayable = basePayable + offerAmt + delivery;
    const freebieBenefit = freeBenefitFn ? freeBenefitFn() : 0;

    return effectivePayable - freebieBenefit;
}

/**
 * Ranks candidates deterministically based on Phase 2 specifications.
 * BEST_OFFER: winner_score ASC -> tat ASC -> distance ASC -> updated DESC
 * FAST_DELIVERY: tat ASC -> winner_score ASC -> distance ASC -> updated DESC
 */
export function rankCandidates(
    offers: CandidateOffer[],
    mode: OfferMode,
    basePayable: number,
    getDeliveryChargeFn: (km?: number | null) => number
): ScoredOffer[] {
    const scoredOffers: ScoredOffer[] = offers.map(offer => {
        const deliveryCharge = getDeliveryChargeFn(offer.distance_km);
        const winnerScore = computeWinnerScore({ ...offer, delivery_charge: deliveryCharge }, basePayable);
        return {
            ...offer,
            delivery_charge: deliveryCharge,
            winner_score: winnerScore,
        };
    });

    return scoredOffers.sort((a, b) => {
        const aTat =
            a.delivery_tat_days !== null && a.delivery_tat_days !== undefined
                ? Number(a.delivery_tat_days)
                : Number.MAX_SAFE_INTEGER;
        const bTat =
            b.delivery_tat_days !== null && b.delivery_tat_days !== undefined
                ? Number(b.delivery_tat_days)
                : Number.MAX_SAFE_INTEGER;

        const aScore = a.winner_score;
        const bScore = b.winner_score;

        const aDist =
            a.distance_km !== null && a.distance_km !== undefined ? Number(a.distance_km) : Number.MAX_SAFE_INTEGER;
        const bDist =
            b.distance_km !== null && b.distance_km !== undefined ? Number(b.distance_km) : Number.MAX_SAFE_INTEGER;

        const aUpdated = a.updated_at ? Date.parse(a.updated_at) : 0;
        const bUpdated = b.updated_at ? Date.parse(b.updated_at) : 0;

        if (mode === 'FAST_DELIVERY') {
            if (aTat !== bTat) return aTat - bTat;
            if (aScore !== bScore) return aScore - bScore;
        } else {
            // BEST_OFFER (default)
            if (aScore !== bScore) return aScore - bScore;
            if (aTat !== bTat) return aTat - bTat;
        }

        // Shared tie-breaks
        if (aDist !== bDist) return aDist - bDist;
        return bUpdated - aUpdated; // latest first
    });
}

/**
 * Deterministically selects the winning offer.
 */
export function selectWinner(rankedOffers: ScoredOffer[]): ScoredOffer | undefined {
    return rankedOffers[0];
}
