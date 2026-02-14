export const OCLUB_SIGNUP_BONUS = 13;
export const OCLUB_REFERRAL_BONUS = 13;
export const OCLUB_COIN_VALUE = 1000 / 13;

export function coinsNeededForPrice(price: number): number {
    if (!Number.isFinite(price) || price <= 0) return 0;
    return Math.ceil(price / OCLUB_COIN_VALUE);
}

export function discountForCoins(coins: number): number {
    if (!Number.isFinite(coins) || coins <= 0) return 0;
    return Math.round(coins * OCLUB_COIN_VALUE);
}

export function computeOClubPricing(price: number, walletCoins: number) {
    const coinsNeeded = coinsNeededForPrice(price);
    const coinsUsed = Math.min(Math.max(walletCoins, 0), coinsNeeded);
    const discount = discountForCoins(coinsUsed);
    const effectivePrice = Math.max(0, Math.round(price - discount));
    return { coinsNeeded, coinsUsed, discount, effectivePrice };
}
