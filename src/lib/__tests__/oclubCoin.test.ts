import { coinsNeededForPrice, computeOClubPricing, discountForCoins } from '@/lib/oclub/coin';

describe('OClub coin conversion SOT', () => {
    it('converts wallet coins to INR discount in 13-coin blocks only', () => {
        expect(discountForCoins(0)).toBe(0);
        expect(discountForCoins(12)).toBe(0);
        expect(discountForCoins(13)).toBe(1000);
        expect(discountForCoins(20)).toBe(1000);
        expect(discountForCoins(26)).toBe(2000);
    });

    it('computes pricing using redeemable blocks and caps coin usage by required coins', () => {
        const pricing = computeOClubPricing(100000, 20);
        expect(pricing.coinsUsed).toBe(13);
        expect(pricing.discount).toBe(1000);
        expect(pricing.effectivePrice).toBe(99000);
    });

    it('uses INR->coin display conversion with 13 coins per ₹1000', () => {
        expect(coinsNeededForPrice(1000)).toBe(13);
        expect(coinsNeededForPrice(88138)).toBe(1146);
    });
});
