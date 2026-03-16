import {
    rankCandidates,
    selectWinner,
    computeWinnerScore,
    CandidateOffer,
    OfferMode,
} from '../marketplace/winnerEngine';

const getDeliveryChargeByDistance = (km?: number | null) => (km ? km * 10 : 500); // simple mock

const baseOffer: CandidateOffer = {
    vehicle_color_id: 'test-sku',
    offer_amount: 0,
    dealer_id: 'd1',
    dealer_name: 'D1',
    is_serviceable: true,
    tat_effective_hours: 48,
    delivery_tat_days: 2,
    updated_at: new Date('2026-03-01').toISOString(),
    distance_km: 10,
};

describe('winnerEngine', () => {
    describe('rankCandidates — BEST_OFFER mode', () => {
        it('sorts by winner_score ASC (lower score wins over TAT)', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -1000, delivery_tat_days: 5 },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -500, delivery_tat_days: 1 },
            ];
            const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d1');
        });

        it('tie-breaks on delivery_tat_days ASC when scores are equal', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -500, delivery_tat_days: 5 },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -500, delivery_tat_days: 1 },
            ];
            const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d2');
        });

        it('tie-breaks on distance ASC when score and tat are equal', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -500, delivery_tat_days: 2, distance_km: 20 },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -500, delivery_tat_days: 2, distance_km: 10 },
            ];
            const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d2');
        });

        it('tie-breaks on updated_at DESC (latest wins)', () => {
            const offers: CandidateOffer[] = [
                {
                    ...baseOffer,
                    dealer_id: 'd1',
                    offer_amount: -500,
                    delivery_tat_days: 2,
                    distance_km: 10,
                    updated_at: new Date('2026-03-01').toISOString(),
                },
                {
                    ...baseOffer,
                    dealer_id: 'd2',
                    offer_amount: -500,
                    delivery_tat_days: 2,
                    distance_km: 10,
                    updated_at: new Date('2026-03-02').toISOString(),
                },
            ];
            const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d2');
        });
    });

    describe('rankCandidates — FAST_DELIVERY mode', () => {
        it('sorts by delivery_tat_days ASC (lower TAT wins over score)', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -1000, delivery_tat_days: 5 },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -500, delivery_tat_days: 1 },
            ];
            const ranked = rankCandidates(offers, 'FAST_DELIVERY', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d2');
        });

        it('tie-breaks on winner_score ASC when tat is equal', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -1000, delivery_tat_days: 2 },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -500, delivery_tat_days: 2 },
            ];
            const ranked = rankCandidates(offers, 'FAST_DELIVERY', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d1');
        });

        it('pushes NULL delivery_tat_days to end', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -500, delivery_tat_days: null },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -400, delivery_tat_days: 2 },
            ];
            const ranked = rankCandidates(offers, 'FAST_DELIVERY', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d2');
        });
    });

    describe('NULL delivery_tat_days in BEST_OFFER mode', () => {
        it('score still wins even if TAT is null (when score is strictly better)', () => {
            const offers: CandidateOffer[] = [
                { ...baseOffer, dealer_id: 'd1', offer_amount: -500, delivery_tat_days: null },
                { ...baseOffer, dealer_id: 'd2', offer_amount: -400, delivery_tat_days: 2 },
            ];
            const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
            expect(ranked[0].dealer_id).toBe('d1');
        });
    });

    describe('computeWinnerScore', () => {
        it('adds basePayable + discount + delivery charge', () => {
            const score = computeWinnerScore({ ...baseOffer, offer_amount: -1500, delivery_charge: 500 }, 100000);
            expect(score).toBe(99000);
        });
    });
});
