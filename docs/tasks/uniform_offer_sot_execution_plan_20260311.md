# Uniform Offer SOT Execution Plan

Date: 2026-03-11  
Owner: Ajit + Codex Monitor  
Execution Mode: Antigravity Phase-Controlled

## 1. Objective

Marketplace ko enterprise-grade pricing architecture par shift karna:

1. Non-PDP surfaces (`catalog`, `favorites`, `compare`, listing cards) par price source strictly `cat_price_state_*` hoga.
2. Non-PDP default display `state on_road_price` hoga; `ex_showroom` optional secondary display ho sakta hai.
3. Dealer delta / finance personalization non-PDP par disabled hoga.
4. PDP par hi real-time personalized quote fetch hoga (dealer + financer inputs).
5. PDP pricing unlock ke liye login + location (GPS or pincode) mandatory hoga.

## 2. Scope Lock (Uniform Offer SOT)

### Included

1. Catalog API contract simplification.
2. UI rendering updates for non-PDP state-price label and value.
3. PDP gating and real-time quote orchestration.
4. AUMS-driven manual cache invalidation flow for state-price updates.
5. Observability + fallback behavior.
6. Rollout feature flags + parity checks.

### Excluded (separate track)

1. CRM quote workflow redesign.
2. Finance marketplace ranking formula rewrite.
3. Dealer ops panel UX changes.

## 3. Current-State Summary (validated)

1. Base catalog mapping currently `cat_price_state_mh` driven hai.
2. Catalog API route context resolve karke dealer delta overlay karta hai (remove karna hai).
3. Desktop/mobile product cards mostly `offerPrice/onRoad` prefer karte hain (state-only normalize karna hai).
4. Compare flows `onRoad` metrics/labels pe depend karte hain.
5. Location gate catalog par abhi enforced hai.

## 4. Target Architecture

### Discovery Layer (Public / Cacheable / State SOT)

1. Data source: `cat_price_state_mh`.
2. Output price: `on_road_price` (state-level) as primary, optional `ex_showroom` as secondary.
3. Dealer/finance personalization: none.
4. Caching: aggressive per state with manual invalidation trigger from AUMS.

### Manual Cache Invalidation (AUMS Trigger)

1. State price rarely changes; cache refresh event-driven/manual रहेगा.
2. Whenever AUMS updates `ex_showroom` or state price inputs, manual invalidation trigger fire hoga.
3. Trigger must purge catalog tags (`catalog`, `catalog:global`) so non-PDP instantly fresh ho.
4. Trigger endpoint: `POST /api/aums/state-price/revalidate` (Bearer secret).

### Decision Layer (PDP / Personalized)

1. Prerequisites: authenticated user + resolved location.
2. Quote inputs: `sku`, `state`, `district|pincode|geo`, user context.
3. Quote outputs: ex-showroom, on-road breakup, dealer delta, finance options, timestamp.
4. TTL: short (2-5 mins) with quote snapshot id.

## 5. Phased Execution

## Phase 0: Contract Freeze (No code)

1. Finalize SOT rules and acceptance criteria.
2. Confirm fallback UX and mandatory gate behavior.
3. Lock metrics dashboard for conversion impact.

Exit Criteria:
1. Written spec approved.
2. `GO GREEN` from Codex monitor.

## Phase 1: API and Data Contract

1. Remove dealer delta hydration from `/api/store/catalog`.
2. Ensure all generic catalog responses expose state `on_road_price` semantics.
3. Add/lock manual cache invalidation trigger contract from AUMS.
4. Keep backward-compatible fields temporarily but stop personalization.

Exit Criteria:
1. No catalog response varies by dealer (without PDP flow).
2. State on-road values stable across non-PDP surfaces.
3. Manual invalidation endpoint/action tested from AUMS flow.

## Phase 2: Non-PDP UI Normalization (State On-road)

1. Desktop card, mobile card, favorites, compare labels to `State On-road`.
2. Replace personalized/on-road mix calculations with pure state table values.
3. Remove/soften catalog location-gate for browsing.

Exit Criteria:
1. No non-PDP surface shows personalized dealer/finance offer.
2. UX copy aligned (`State On-road`, `Final offer on PDP after login + location`).

## Phase 3: PDP Gate and Real-Time Offer Layer

1. PDP price CTA introduces mandatory login + location.
2. Real-time quote fetch from dealer + finance sources.
3. Add provider timeout/circuit-breaker and partial response handling.

Exit Criteria:
1. Unauthorized/no-location user cannot fetch personalized quote.
2. PDP still loads base product experience safely.

### Phase 3 Planning Slice (Pre-Implementation Lock)

#### A. Gate Contract (Mandatory)

1. Personalized PDP quote fetch allowed only when:
   - `isLoggedIn === true`
   - location resolved: `(district || pincode)` available.
2. If gate fails:
   - PDP base state SOT price remains visible (`ex_showroom`, `state on_road`).
   - Dealer-personalized panel shows prompt, not blank/error.
3. Suggested prompt copy:
   - Not logged in: `Login to see dealer price + finance offer`
   - Logged in, no location: `Add location to unlock best price`

#### B. File Map (Planned touchpoints)

1. `src/hooks/useSystemDealerContext.ts`
   - Add auth + location precondition before market/dealer RPC.
   - Reuse existing `disabled` branch as primary gate rail.
2. `src/app/store/[make]/[model]/[variant]/ProductClient.tsx`
   - Wire `disabled` as: `!isLoggedIn || !hasResolvedLocation`.
   - Keep PDP base rendering unaffected.
3. `src/app/store/[make]/[model]/[variant]/page.tsx`
   - Server baseline remains state SOT only (already done), no new dealer lock.
4. UI trigger points:
   - PDP CTA section + lead/quote actions.
   - Location capture/modal path (GPS/pincode) to unlock personalized fetch.

#### C. Circuit-Breaker Spec

1. Dealer/market quote fetch timeout: `3000ms` via `Promise.race`.
2. On timeout/failure:
   - Return fallback mode: state SOT only.
   - Message: `Dealer price unavailable. Try again.`
3. Retry policy:
   - Manual retry CTA (`Try again`) first.
   - No aggressive auto-retry loop.

#### D. Rollout Guard

1. Feature flag: `NEXT_PUBLIC_PDP_GATE_ENABLED` (default `false` for safe rollout).
2. Guard behavior:
   - `true`: enforce login + location gate + timeout fallback.
   - `false`: current behavior (backward-compatible).
3. Rollback:
   - Single env var flip (`NEXT_PUBLIC_PDP_GATE_ENABLED=false`) + redeploy.

## Phase 4: Verification, Rollout, and Monitoring

1. Add integration tests for catalog/static vs PDP/personalized split.
2. Rollout with feature flag in canary stages.
3. Track conversion + latency + quote success SLIs.

Exit Criteria:
1. P95 latency and error budget within target.
2. No major conversion regression beyond allowed threshold.

## 6. Technical Change List (Initial)

1. `src/app/api/store/catalog/route.ts`
2. `src/components/store/desktop/ProductCard.tsx`
3. `src/components/store/mobile/CompactProductCard.tsx`
4. `src/app/store/compare/ComparePageClient.tsx`
5. `src/components/store/DesktopCatalog.tsx`
6. `src/hooks/SystemCatalogLogic.ts`
7. PDP flow files (`src/app/store/[make]/[model]/[variant]/page.tsx`, related sections)

## 7. Guardrails

1. No destructive migration in this task without explicit approval.
2. No silent behavior changes outside scope surfaces.
3. Non-PDP personalization (dealer/finance) strictly disallowed.
4. Every phase must include test evidence and rollback note.
5. `GO GREEN` mandatory before next phase.

## 8. Review Protocol

1. Antigravity submits per phase in fixed format: plan, files, tests, risks.
2. Codex monitor audits and marks `GO GREEN` or `REWORK`.
3. Rework stays in same phase until passed.

## 9. Success Metrics

1. Catalog response cache hit rate increase.
2. Non-PDP page speed improvement.
3. PDP quote freshness and latency stability.
4. Quote completion and lead conversion net effect.

## 10. Kickoff Request Template

Use this exact handoff to Antigravity:

`@antigravity Start Uniform Offer SOT Phase 0 using docs/tasks/uniform_offer_sot_execution_plan_20260311.md and TASK_UNIFORM_OFFER_SOT_PHASE_CONTROL.md. Submit in unified response format with exact files touched, tests run, risks, and completion claim.`
