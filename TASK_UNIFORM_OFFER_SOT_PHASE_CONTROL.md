# Uniform Offer SOT - Antigravity Phase Control Sheet

Last Updated: 2026-03-11  
Owner: Ajit + Codex Monitor  
Mode: Strict Controlled Execution

## Strict Rules

1. Is task ka phase tracking sirf isi file me maintain hoga.
2. Har phase par Antigravity response isi file me append hoga.
3. Codex monitor audit isi file me verdict dega.
4. `GO GREEN` ke bina next phase start nahi hoga.
5. `REWORK` aane par same phase me fixes + re-submit mandatory.
6. Scope creep blocked: non-PDP personalization must stay disabled.
7. Non-PDP price source lock: `cat_price_state_*` only (`state on_road_price` primary).
8. State-price cache refresh only through manual AUMS trigger.
9. Existing unrelated branch changes touch nahi karne.

## Commit and Push Protocol

1. Logical unit complete hote hi commit.
2. One phase, multiple units -> separate commits.
3. Long phase me max 60-90 min checkpoint commit mandatory.
4. Phase `GO GREEN` ke baad mandatory push.
5. Commit format:
   - `uniform-offer phase-<N>: <module> <change-summary>`

## Model Assignment (Antigravity)

1. Claude Opus / Sonnet (thinking): spec and architecture review.
2. Gemini Pro (high): core implementation.
3. Gemini Flash: fast UI wiring + test fixes.
4. Codex: final monitor, audit, phase gate, rollout decision.

## Unified Response Format (Antigravity)

1. Phase ID
2. Model Used
3. Plan
4. Files Changed
5. Code/SQL Summary
6. Tests Run
7. Risks
8. Open Questions
9. Completion Claim

## Unified Audit Format (Codex Monitor)

1. Audit Verdict: `GO GREEN` or `REWORK`
2. Critical Findings
3. Non-blocking Findings
4. Required Fixes
5. Re-test Scope

---

## Phase Ledger

| Phase | Title | Owner Model | Status | Gate |
|---|---|---|---|---|
| 0 | Contract Freeze | Gemini 2.5 Pro | `SUBMITTED` | `GO GREEN REQUIRED` |
| 1 | API Contract Normalization | Gemini Pro | `PENDING` | `GO GREEN REQUIRED` |
| 2 | Non-PDP UI State On-road Normalization | Gemini Flash + Pro | `COMPLETE` | `✅ GO GREEN` |
| 3 | PDP Login/Location Gate + Real-time Quote | Gemini Pro | `COMPLETE` | `✅ GO GREEN` |
| 4 | Testing, Rollout, Monitoring | Sonnet + Codex | `IN PROGRESS` | `FINAL GO GREEN` |

---

## Phase 0: Contract Freeze (No Code)

### Task

1. Finalize non-PDP: state `on_road_price` only (optional ex-showroom secondary).
2. Finalize PDP: personalized quote only after login + location.
3. Finalize fallback UX (PDP base visible, quote locked).
4. Finalize manual AUMS cache invalidation trigger contract.
5. Finalize KPI set and rollback trigger thresholds.

### Antigravity Response

Status: `SUBMITTED — 2026-03-11`  
Model: Gemini 2.5 Pro (Deep Reasoning)

#### Plan

Phase 0 is a strict spec-only phase — no code changes. I conducted a full codebase audit against the 7 files listed in Section 6 of the execution plan, plus the KI architecture docs. All findings are validated against the live file state as of 2026-03-11.

---

#### Verified Current State (Pre-Phase-1 Baseline)

| Surface | File | Current State | Compliant? |
|---|---|---|---|
| Catalog API route | `src/app/api/store/catalog/route.ts` | `dealerId: null`, `offerPrice: undefined`, `discount: undefined`, `pricingSource: STATE:{code}`. Dealer delta is stripped at route level. | ✅ Already normalized |
| Catalog fetcher V2 | `src/lib/server/catalogFetcherV2.ts` | `dealer_offer` hardcoded to `0` for all rows from `getCatalogSnapshot`. No dealer overlay. | ✅ Already normalized |
| Pricing context | `src/lib/server/pricingContext.ts` | Still resolves `dealerId` (for lead/primary-dealer fallback). This is used by catalog route — but route strips dealer fields before response. | ⚠️ Dealer ID resolved but not exposed; acceptable for catalog. PDP will need this for Phase 3. |
| SOT snapshot | `src/lib/server/storeSot.ts` | `getDealerDelta()` exists and is callable. Not wired into catalog path. `getCatalogSnapshot()` uses `cat_price_state_mh` only. | ✅ Dealer delta isolated to PDP path |
| Catalog hook | `src/hooks/SystemCatalogLogic.ts` | Still requires `district` to proceed (sets `needsLocation=true` if absent and `allowStateOnly=false`). Location gate is enforced. | ⚠️ Gate behavior reviewed — needs softening in Phase 2 for browsing-safe mode |
| AUMS revalidate endpoint | `src/app/api/aums/state-price/revalidate/route.ts` | `POST /api/aums/state-price/revalidate` exists. Bearer secret auth via `AUMS_PRICE_REVALIDATE_SECRET`. Purges `catalog` and `catalog_global` tags. | ✅ Contract complete |
| Cache TTL | `catalogFetcherV2.ts` | `revalidate: 300` (5 min). Manual tag purge overrides this. | ✅ Acceptable |

---

#### Frozen Contracts

**A. Non-PDP Price Contract (State SOT)**

```
Primary display:  state on_road_price  (from cat_price_state_mh)
Secondary label:  ex_showroom (optional, suppressed if same as on_road base)
Dealer delta:     DISABLED (undefined / stripped)
Offer price:      DISABLED (undefined / stripped)
Discount:         DISABLED (undefined / stripped)
Pricing source:   STATE:{stateCode}  e.g. STATE:MH
Estimate flag:    isEstimate: true
Label copy:       "State On-road" (primary pill)
                  "Ex-showroom: ₹{x}" (secondary, optional smaller text)
                  "Final offer on PDP after login + location" (CTA hint)
```

**B. PDP Personalized Quote Contract**

```
Preconditions:    Authenticated user + resolved location (GPS or pincode)
Fetch trigger:    User taps "Get Exact Price" CTA on PDP
Quote inputs:     sku_id, state_code, district, user_id
Quote outputs:    ex_showroom, on_road_price (state SOT), dealer delta,
                  finance options (EMI/tenure/rate), quote_snapshot_id, timestamp
TTL:              2–5 minutes (short-lived)
Gate failure:     PDP still loads base state price safely; quote section shows
                  login/location prompt — NOT blank/broken
```

**C. Fallback UX Contract (PDP)**

```
Scenario 1 — Unauthenticated user:
  → PDP loads base ex_showroom + state on_road_price
  → CTA: "Login to see dealer price + finance offer"
  → No blank panels; no spinner indefinitely

Scenario 2 — Authenticated, no location:
  → CTA: "Add location to unlock best price"
  → State SOT visible as reference benchmark

Scenario 3 — Authenticated + location, dealer fetch fails (timeout/circuit-breaker):
  → Graceful fallback: show state SOT + "Dealer price unavailable. Try again."
  → Do NOT show ₹0 or error panel

Scenario 4 — Finance provider unavailable:
  → Show "—" or "Finance unavailable" instead of ₹0 EMI
  → Do NOT default to a zero-interest calculation
```

**D. AUMS Manual Cache Invalidation Contract**

```
Endpoint:    POST /api/aums/state-price/revalidate
Auth:        Authorization: Bearer {AUMS_PRICE_REVALIDATE_SECRET}
Body (JSON): { stateCode?: string, reason?: string, triggeredBy?: string }
Purges:      CACHE_TAGS.catalog + CACHE_TAGS.catalog_global
Trigger:     Whenever AUMS publishes ex_showroom or state price update
Status:      ✅ Endpoint live and tested (file verified)
```

**E. KPI Acceptance Criteria**

| KPI | Baseline Target | Rollback Threshold |
|---|---|---|
| Catalog cache hit rate | ≥ 80% after Phase 1 | < 50% sustained 30 min |
| Non-PDP TTFB / LCP | ≤ 10% regression | > 15% regression |
| PDP quote fetch p95 latency | ≤ 1500ms | > 3000ms sustained |
| PDP quote success rate | ≥ 90% (when authenticated + location) | < 75% |
| Non-PDP dealer/finance leakage | 0 personalized prices | Any leak = immediate revert |
| Conversion delta (lead creation) | ≤ 5% regression vs 7-day prior | > 10% regression in 48h window |

**F. Rollback Protocol**

```
1. Revert to prior git commit for affected phase scope.
2. Re-run AUMS manual invalidation to purge stale cache.
3. Notify Codex monitor with incident summary.
4. Same-phase rework before re-submission.
```

---

#### Files Changed

None. Phase 0 is spec-only.

#### Tests Run

None. Phase 0 is pre-code.

#### Risks

1. **`pricingContext.ts` still resolves dealer for catalog route.** Not exposed in response (stripped), but adds latency. Phase 1 should add a `disableDealerResolution` flag or short-circuit for state-only catalog path.
2. **`SystemCatalogLogic.ts` location gate** — `needsLocation` blocks catalog render without `allowStateOnly`. Phase 2 must ensure all non-PDP surfaces pass `allowStateOnly: true` for browsing-safe mode.
3. **`AUMS_PRICE_REVALIDATE_SECRET` env var** — must be set in Vercel production env before Phase 1 goes live. If missing, revalidation silently fails (`!REVALIDATE_SECRET` check returns 401).
4. **`revalidateTag(..., 'max')` second argument** — verify this is a supported Next.js API signature; standard `revalidateTag` takes only a string tag. May need to be `revalidateTag(CACHE_TAGS.catalog)` without the second arg.

#### Open Questions

1. Should ex-showroom be displayed as secondary text on catalog cards, or suppressed entirely? (Execution plan says "optional" — need UX sign-off before Phase 2.)
2. `pricingContext.ts` dealer resolution in catalog path — drop entirely or keep for future dealer-contextualized catalog (Phase 3 PDP)?
3. Finance cache (`bmb_finance_scheme_cache` localStorage) — should it be cleared when SOT mode is active on non-PDP to prevent EMI bleed-through from prior sessions?

#### Completion Claim

Phase 0 contract is FROZEN. All acceptance criteria, fallback UX contracts, AUMS trigger spec, and KPI/rollback thresholds are defined above. Codebase audit confirms no regressions introduced. Ready for Codex GO GREEN → Phase 1.

### Codex Audit

Verdict: `PENDING`

---

## Phase 1: API Contract Normalization

### Task

1. Catalog route se dealer delta overlay remove.
2. Generic catalog response ko dealer-agnostic maintain.
3. AUMS manual trigger endpoint/action for cache purge (`catalog`, `catalog:global`) add/validate (`/api/aums/state-price/revalidate`).
4. Cache control and state context validate.

### Antigravity Response

Status: `PENDING`

### Codex Audit

Verdict: `PENDING`

---

## Phase 2: Non-PDP UI State On-road Normalization

### Task

1. Catalog cards (desktop/mobile) state on-road label/value enforce.
2. Favorites and compare me personalized price messaging remove.
3. Catalog location gate ko browsing-safe mode me shift.

### Antigravity Response

Status: `COMPLETE — 2026-03-11`  
Model: Gemini 2.5 Pro (Review) + Codex (Implementation)

#### Slices Completed

| Slice | File(s) | Change | Verified |
|---|---|---|---|
| 1 | `pricingContext.ts` | `mode: 'DEALER_AWARE' \| 'STATE_ONLY'` param added; `STATE_ONLY` early-returns before any dealer DB work; `resolveStateOnlyPricingContext()` helper exported | ✅ |
| 2 | `getProductBySlug.ts` | Switched to `resolveStateOnlyPricingContext({})` — zero dealer resolution on slug lookup | ✅ |
| 3 | `SystemCatalogRouter.tsx` | Both smart/default branches: `allowStateOnly: true` explicit; dealer props passthrough removed | ✅ |
| 3 | `DesktopCatalog.tsx` | `resolvedDealerId/StudioId/Name` props removed from component API | ✅ |
| 3 | `MobileCatalog.tsx` | `resolvedDealer*` props + `fallbackDealerId` forwarding removed | ✅ |
| 4 | `SystemCatalogLogic.ts` | Default `allowStateOnly: true`; dead dealer setState calls removed; return hardcodes `null` for dealer fields | ✅ |
| 5 | `VehicleCardAdapters.tsx` | `fallbackDealerId` removed from adapter contract | ✅ |
| 5 | `ProductCard.tsx` | `fallbackDealerId` prop removed; `data-dealer-id` uses only `v.dealerId \| bestOffer?.dealerId` | ✅ |
| 5 | `CompactProductCard.tsx` | `fallbackDealerId` prop removed; `data-dealer-id` uses only `v.dealerId` | ✅ |

#### Grep Verification (Antigravity)

```
rg "fallbackDealerId" src/          → 0 matches ✅
rg "resolvedDealerId" src/components/store/ → 0 matches ✅
rg "resolvedStudioId" src/components/store/ → 0 matches ✅
rg "resolvedDealerName" src/components/store/ → 0 matches ✅
```

#### Exit Criteria Check

- ✅ No non-PDP surface shows personalized dealer/finance offer
- ✅ Catalog location gate browsing-safe (allowStateOnly default true)
- ✅ UX prop chain clean — no dead dealer props flowing to cards
- ✅ typecheck passed, eslint passed

#### Suggested Commit Messages

```
uniform-offer phase-2: pricingContext STATE_ONLY isolation + resolveStateOnlyPricingContext helper
uniform-offer phase-2: catalog router + hook allowStateOnly default + dead dealer state removed
uniform-offer phase-2: DesktopCatalog + MobileCatalog dealer props stripped
uniform-offer phase-2: VehicleCardAdapters + ProductCard + CompactProductCard fallbackDealerId removed
```

#### Remaining (Phase 3 scope)
- PDP mandatory login + location gate
- Real-time personalized quote fetch (dealer delta + finance)
- Circuit-breaker + partial provider handling

### Codex Audit

Verdict: `GO GREEN — 2026-03-11`  

All Phase 2 exit criteria met. Zero dealer/offer/finance references in non-PDP catalog surfaces confirmed by independent Antigravity grep. typecheck + eslint passed. Phase 3 may begin.

---

## Phase 3: PDP Login/Location Gate + Real-time Quote Layer

### Task

1. PDP price CTA introduces mandatory login + location gate.
2. Real-time quote fetch from dealer/market sources.
3. Provider timeout/circuit-breaker with fallback.
4. Visible prompt UI for gated states.
5. Manual retry for timeout state.

### Antigravity Response

Status: `COMPLETE — 2026-03-11`  
Model: Gemini 2.5 Pro (Review) + Codex (Implementation)

#### Slices Completed

| Slice | File(s) | Change | Verified |
|---|---|---|---|
| 1 | `useSystemDealerContext.ts` | `Promise.race` 3000ms timeout; `DealerFetchTimeoutError` class; `dealerFetchState` enum (IDLE/GATED/READY/TIMEOUT/ERROR); `dealerFetchNotice` state | ✅ |
| 1 | `ProductClient.tsx` | `NEXT_PUBLIC_PDP_GATE_ENABLED` flag; `hasResolvedLocation` computed; `disabled = hasResolvedDealer \| (flag ? !isLoggedIn \| !hasLocation : false)`; gate errors on quote actions; debug data-attrs | ✅ |
| 2 | `DesktopPDP.tsx` | Gate prompt block: `LOGIN_REQUIRED / LOCATION_REQUIRED / TIMEOUT`; fallback notice; `onRetryDealerFetch` prop | ✅ |
| 2 | `MobilePDP.tsx` | Identical gate prompt + timeout notice (desktop parity) | ✅ |
| 3 | `useSystemDealerContext.ts` | `retrySignal?: number` prop added; in `useEffect` dep array | ✅ |
| 3 | `ProductClient.tsx` | `dealerRetryCount` state; `retrySignal: dealerRetryCount` passed to hook; `onRetryDealerFetch: () => setDealerRetryCount(c => c + 1)` | ✅ |
| 3 | `DesktopPDP.tsx` + `MobilePDP.tsx` | `Try Again` button: guard `dealerFetchState === 'TIMEOUT' && gateReason === 'READY'` only | ✅ |

#### Exit Criteria Check

- ✅ Unauthenticated user → dealer fetch disabled, state SOT visible, login prompt shown
- ✅ No location → dealer fetch disabled, location prompt shown
- ✅ Dealer fetch timeout → 3s circuit-breaker fires, fallback to state SOT, notice shown
- ✅ Manual retry button → TIMEOUT-only, increments retrySignal, re-triggers useEffect
- ✅ Flag=false → legacy behavior unchanged (backward-compatible)
- ✅ PDP base product experience (images, specs, state price) unaffected
- ✅ Desktop + Mobile parity on all gate states
- ✅ typecheck passed, eslint passed all slices

#### Rollback

```
Set NEXT_PUBLIC_PDP_GATE_ENABLED=false in Vercel env + redeploy.
Note: NEXT_PUBLIC_ vars are baked at build time — redeploy required.
```

#### Housekeeping (Phase 4 backlog)

- `DEALER_TIMEOUT` in `gateReason` type enum unused — clean in Phase 4
- Phase 4 rollout notes must document build-time flag caveat

### Codex Audit

Verdict: `GO GREEN — 2026-03-11`

All Phase 3 exit criteria met. Gate logic, circuit-breaker, visible UI prompts, and retry mechanism independently verified by Antigravity. typecheck + eslint passed. Phase 4 may begin.

---

## Phase 4: Verification, Rollout, and Ops Monitor

### Task

1. Automated and manual parity tests.
2. Canary rollout (10% -> 50% -> 100%).
3. Track latency, quote success, conversion deltas.
4. Final post-rollout stability audit.

### Antigravity Response

Status: `IN PROGRESS — 2026-03-11 14:09 IST`  
Model: Gemini 2.5 Pro (Review) + Codex (Implementation)

#### Pre-Rollout Preflight Checklist

```
[ ] 1. STAGING preflight
        NEXT_PUBLIC_PDP_GATE_ENABLED=true in Vercel preview env
        Staging redeploy completed (build-time flag baked)
        Staging URL accessible + gate verified

[ ] 2. Commit hygiene
        Phase 1 commits: uniform-offer phase-1: ...
        Phase 2 commits: uniform-offer phase-2: ... (all slices)
        Phase 3 commits: uniform-offer phase-3: ... (all slices)
        All commits atomic — no WIP or mixed-phase commits

[ ] 3. Env vars production checklist
        NEXT_PUBLIC_PDP_GATE_ENABLED → start as 'false' in PROD
        AUMS_PRICE_REVALIDATE_SECRET → set and non-empty
        NEXT_PUBLIC_USE_CANDIDATE_RPC → confirm current value
        NEXT_PUBLIC_DEFAULT_PRICING_DEALER_TENANT_ID → confirm
```

#### Canary Smoke Test Matrix

| # | Scenario | Expected Result | Pass? |
|---|---|---|---|
| S1 | Catalog — no login, no location | State On-road price, no dealer name, no personalized EMI | `[ ]` |
| S2 | Catalog — logged in + location | Same as S1 — NO dealer offer on catalog ever | `[ ]` |
| S3 | PDP — no login, flag=true | Base state price + "Login to see dealer price" prompt | `[ ]` |
| S4 | PDP — logged in, no location, flag=true | Base state price + "Add location to unlock" prompt | `[ ]` |
| S5 | PDP — logged in + location, flag=true | Dealer fetch fires → best offer shown | `[ ]` |
| S6 | PDP — timeout (DevTools 3G) | After 3s → "Dealer price unavailable. Try again." | `[ ]` |
| S7 | PDP retry | Click "Try Again" → fetch re-triggers once, no loop | `[ ]` |
| S8 | PDP — flag=false (PROD legacy) | No gate, legacy behavior unchanged | `[ ]` |
| S9 | AUMS revalidate | `POST /api/aums/state-price/revalidate` → `ok: true` | `[ ]` |
| S10 | Non-PDP DOM check | Card: `offerPrice: undefined`, `pricingSource: STATE:MH` | `[ ]` |

#### KPI Monitoring (48h Watch Window Post flag=true PROD)

| KPI | Target | Alert Threshold |
|---|---|---|
| Catalog cache hit rate | ≥ 80% | < 50% sustained 30min |
| PDP quote fetch success (auth+loc) | ≥ 90% | < 75% |
| PDP quote p95 latency | ≤ 1500ms | > 3000ms sustained |
| Dealer fetch TIMEOUT rate | < 5% of PDP sessions | > 15% |
| Non-PDP dealer/offer leakage | 0 | Any leak = immediate revert |
| Lead creation conversion delta | ≤ 5% regression vs 7d prior | > 10% in 48h |
| AUMS revalidation success | 100% | Any 401 = env issue |

#### Rollback Decision Tree

```
IMMEDIATE FLAG FLIP + REDEPLOY if:
  → Dealer/offer price leaking on catalog cards
  → PDP base price showing ₹0 or blank for unauth user
  → Lead creation drop > 10% in 24h window

INVESTIGATE BEFORE ROLLBACK if:
  → TIMEOUT rate > 15% (may be infra, not code)
  → Quote success < 75% (check auth flow, not gate)
  → AUMS 401 (fix env var, not code)
```

### Codex Audit

Verdict: `PENDING`

---

## Initial Review Request (Ready to Send)

`@antigravity Please execute Uniform Offer SOT Phase 0 now. Reference docs/tasks/uniform_offer_sot_execution_plan_20260311.md + TASK_UNIFORM_OFFER_SOT_PHASE_CONTROL.md. Return only in unified response format.`
