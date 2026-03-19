# PDP Soft Lock Smoke Report

**Date**: 2026-03-19  
**Engineer**: Antigravity  
**Baseline**: `v0.3.19-ci-green` @ `d4f5b425`

---

## Executive Summary

> [!IMPORTANT]
> **Finding: The PDP does not have a consumer-facing auth/login soft lock for pricing cards.** The P2 sprint item was based on an earlier specification. The actual gate implemented is a **location gate** (pincode required before pricing unlocks), not an auth wall. This report documents what IS implemented and validates it works correctly.

---

## Gate Architecture (Code-Verified)

### Gate 1: Location Gate — Consumer-facing
**Source**: `ProductClient.tsx` L470, L551

```typescript
const pdpGateEnabled = process.env.NEXT_PUBLIC_PDP_GATE_ENABLED === 'true';
const isDealerFetchDisabled = pdpGateEnabled ? !hasResolvedLocation : false;
```

**Status**: `NEXT_PUBLIC_PDP_GATE_ENABLED` is **not set** in `.env.local` or production — gate is **OFF** in current deployment. Pricing loads unconditionally for all consumers.

**Verdict**: ✅ Intentional — pincode-first model per KI. Full pricing visible; dealer fetch provides personalisation.

---

### Gate 2: Team Member SAVE QUOTE Mode — Internal-facing
**Source**: `ProductClient.tsx` L182

```typescript
const isGated = isTeamMember && !leadIdFromUrl;
```

**Behaviour when `isGated = true`**:
- Command bar CTA changes to `SAVE QUOTE` instead of `REQUEST BOOKING`
- `isShareMode = isGated` — PricingCard enters share mode
- No cards are hidden, blurred, or removed
- Applies only to: dealer team members + `@bookmy.bike` email users browsing without a `?lead=` URL param

**Verdict**: ✅ Correct — team members researching without a lead get a save-quote flow instead of booking.

---

## Smoke Checklist Results

### A. Unauthenticated Consumer (baseline case)

| Check | Method | Result |
|-------|--------|--------|
| PDP loads without login | Code audit (`hasResolvedLocation` init from `localStorage`) | ✅ Public access, no login wall |
| Pricing card visible | `PricingCard` renders unconditionally | ✅ |
| Finance card visible | `FinanceCard` renders unconditionally | ✅ |
| Finance Summary visible | `FinanceSummaryPanel` renders unconditionally | ✅ |
| Amortization visible | `AmortizationPanel` renders unconditionally | ✅ |
| Config cards visible | `configCards` (Accessories/Insurance/Registration/Services/Warranty) render unconditionally | ✅ |
| Gallery card visible | `heroCards[GALLERY]` renders unconditionally | ✅ |
| Spec card visible | `TechSpecsSection` renders unconditionally | ✅ |
| CTA says `REQUEST BOOKING` | `isGated = false` for non-team-members | ✅ |

### B. Team Member Without Lead (gated case)

| Check | Method | Result |
|-------|--------|--------|
| Auth check runs | `checkTeamMembership()` via Supabase auth + memberships check | ✅ |
| `isGated` set to `true` | `isTeamMember && !leadIdFromUrl` | ✅ |
| CTA changes to `SAVE QUOTE` | `isShareMode = isGated` → command bar reads this | ✅ |
| No cards hidden | `isGated` does NOT toggle visibility of pricing/finance/config | ✅ |

### C. Location Gate (when enabled)

| Check | Method | Result |
|-------|--------|--------|
| `NEXT_PUBLIC_PDP_GATE_ENABLED` env var | grep `.env*` | ⚠️ NOT SET — gate disabled |
| `PincodeGateModal` present | `ProductClient.tsx` L8 import | ✅ Component exists and is imported |
| Location resolved from cache | `readLocationResolvedFromCache()` reads `localStorage.bkmb_user_pincode` | ✅ |
| PDP route guard redirect | L527–L544: redirects to catalog if no location + not already redirected | ✅ |

### D. SOT Parity Gate (CI)

| Check | Result |
|-------|--------|
| `store-sot-parity.spec.ts` passing | ✅ `success @ d4f5b425` (confirmed CI) |
| Parity snapshot markers present | Hidden `<PdpPricingSection layout="desktop">` mounts in DOM | ✅ |

---

## Gaps Found vs. Sprint Plan

| Sprint Item | Status | Action |
|------------|--------|--------|
| "Hide commercial cards for unauthenticated users" | ⚠️ **Not implemented** — cards are public | Needs explicit product decision: add auth gate or keep location-only gate? |
| "Show login prompt behind Pricing/Finance/Summary/Amortization/Config cards" | ⚠️ **Not implemented** — `isGated` only changes CTA | Confirm spec with product before coding |
| "Gallery + Spec cards always public" | ✅ Correct as-is — no gate on these | No action |
| SOT parity gate passing | ✅ Green in CI | No action |

---

## Recommendation

The P2 sprint item as described (login wall for commercial cards) is **not yet built**. Before implementing it:

1. **Confirm product decision**: Should pricing be hidden for unauthenticated consumers, or is the current location-gate-only model intentional?
2. If auth gate is wanted: set `NEXT_PUBLIC_PDP_GATE_ENABLED=true` in production and implement a `LoginPromptOverlay` component gating Pricing/Finance/Summary/Amortization/Config panels.
3. Gallery and Spec cards are already ungated — no changes needed there.

---

## P2 Outcome

**AMBER** — No regressions. Existing gate logic is correct and CI-passing. The originally described auth soft lock (login wall for pricing) has not been implemented. Requires product confirmation before building.
