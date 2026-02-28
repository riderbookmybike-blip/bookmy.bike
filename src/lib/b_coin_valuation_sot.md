# B-Coin Valuation — Source of Truth (SOT)

## Core Conversion Rate

```
13 B-Coins = ₹1,000 INR
1 B-Coin   = ₹76.92 INR  (1000 / 13)
```

---

## Rule 1 — Alternative Currency Display

Whenever an INR price is shown on a card (On-Road, Downpayment, EMI etc.),
show its **B-Coin equivalent** as an alternative currency label.

```
Coins = Math.round(INR_amount / 1000 * 13)
```

**Example:**
- On-Road ₹88,138 → ₿ 1,146 coins  ✅

---

## Rule 2 — O'Circle Privileged Discount

The O'Circle discount is **NOT** a fixed amount.
It equals the user's **actual available B-Coin balance** converted to INR.

```
discount_inr = Math.floor(available_coins / 13) * 1000
```

**Example:**
- Available balance = 26 coins
- discount_inr = floor(26 / 13) × 1000 = **₹2,000**  ✅
- (NOT ₹1,000 — that was the bug!)

---

## Key Distinctions

| Display | Source | Formula |
|---|---|---|
| ₿ on price label (alternative currency) | Price value | `round(price / 1000 * 13)` |
| O'Circle Privileged discount | User wallet balance | `floor(balance / 13) * 1000` |

These are **two completely different values** — do NOT confuse them.

---

## Code Reference

```ts
// Rate constant
export const BCOIN_PER_1000_INR = 13;

// Convert INR → Coins (for price display label)
export function coinsNeededForPrice(inrAmount: number): number {
  return Math.round((inrAmount / 1000) * BCOIN_PER_1000_INR);
}

// Convert Coin balance → INR discount (for O'Circle benefit)
export function ocircleDiscountFromBalance(availableCoins: number): number {
  return Math.floor(availableCoins / BCOIN_PER_1000_INR) * 1000;
}
```
