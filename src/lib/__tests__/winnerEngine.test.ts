import {
    rankCandidates,
    selectWinner,
    computeWinnerScore,
    CandidateOffer,
    OfferMode,
} from '../marketplace/winnerEngine';

function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${msg}`);
        process.exit(1);
    }
    console.log(`✅ PASS: ${msg}`);
}

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

// Test 1: BEST_OFFER sorts by winner_score ASC first
{
    const offers: CandidateOffer[] = [
        { ...baseOffer, dealer_id: 'd1', offer_amount: -1000, tat_effective_hours: 72 }, // better score, worse TAT
        { ...baseOffer, dealer_id: 'd2', offer_amount: -500, tat_effective_hours: 24 }, // worse score, better TAT
    ];
    const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd1', 'BEST_OFFER: lower winner_score wins over TAT');
}

// Test 2: FAST_DELIVERY sorts by tat ASC first
{
    const offers: CandidateOffer[] = [
        { ...baseOffer, dealer_id: 'd1', offer_amount: -1000, tat_effective_hours: 72 }, // better score, worse TAT
        { ...baseOffer, dealer_id: 'd2', offer_amount: -500, tat_effective_hours: 24 }, // worse score, better TAT
    ];
    const ranked = rankCandidates(offers, 'FAST_DELIVERY', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd2', 'FAST_DELIVERY: lower TAT wins over winner_score');
}

// Test 3: BEST_OFFER tie-break: equal score -> tat ASC
{
    const offers: CandidateOffer[] = [
        { ...baseOffer, dealer_id: 'd1', offer_amount: -500, tat_effective_hours: 72 },
        { ...baseOffer, dealer_id: 'd2', offer_amount: -500, tat_effective_hours: 24 },
    ];
    const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd2', 'BEST_OFFER tie: lower TAT wins');
}

// Test 4: FAST_DELIVERY tie-break: equal tat -> score ASC
{
    const offers: CandidateOffer[] = [
        { ...baseOffer, dealer_id: 'd1', offer_amount: -1000, tat_effective_hours: 48 },
        { ...baseOffer, dealer_id: 'd2', offer_amount: -500, tat_effective_hours: 48 },
    ];
    const ranked = rankCandidates(offers, 'FAST_DELIVERY', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd1', 'FAST_DELIVERY tie: lower winner_score wins');
}

// Test 5: Tie-break distance ASC
{
    const offers: CandidateOffer[] = [
        { ...baseOffer, dealer_id: 'd1', offer_amount: -500, tat_effective_hours: 48, distance_km: 20 },
        { ...baseOffer, dealer_id: 'd2', offer_amount: -500, tat_effective_hours: 48, distance_km: 10 },
    ];
    const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd2', 'Tie-break: distance ASC wins');
}

// Test 6: Tie-break updated_at DESC
{
    const offers: CandidateOffer[] = [
        {
            ...baseOffer,
            dealer_id: 'd1',
            offer_amount: -500,
            tat_effective_hours: 48,
            distance_km: 10,
            updated_at: new Date('2026-03-01').toISOString(),
        },
        {
            ...baseOffer,
            dealer_id: 'd2',
            offer_amount: -500,
            tat_effective_hours: 48,
            distance_km: 10,
            updated_at: new Date('2026-03-02').toISOString(),
        },
    ];
    const ranked = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd2', 'Tie-break: updated_at DESC wins (latest)');
}

// Test 7: NULL TAT pushed to end
{
    const offers: CandidateOffer[] = [
        { ...baseOffer, dealer_id: 'd1', offer_amount: -500, tat_effective_hours: null },
        { ...baseOffer, dealer_id: 'd2', offer_amount: -400, tat_effective_hours: 48 },
    ];
    const ranked = rankCandidates(offers, 'FAST_DELIVERY', 100000, getDeliveryChargeByDistance);
    assert(ranked[0].dealer_id === 'd2', 'FAST_DELIVERY: NULL TAT pushed to end');

    const rankedBest = rankCandidates(offers, 'BEST_OFFER', 100000, getDeliveryChargeByDistance);
    assert(
        rankedBest[0].dealer_id === 'd1',
        'BEST_OFFER: Score still wins even if TAT is null (if score is strictly better)'
    );
}

// Test 8: computeWinnerScore
{
    const score = computeWinnerScore({ ...baseOffer, offer_amount: -1500, delivery_charge: 500 }, 100000);
    assert(score === 99000, 'computeWinnerScore adds basePayable (100k) + discount (-1500) + delivery (500) = 99000');
}

console.log('\n🎉 All winnerEngine tests passed.');
