# TAT Review Plan (Second Opinion Before Fix)

## Goal
Get one strict external review to validate root cause of `Delivery TAT = ETA UPDATING` before applying more code changes.

## Reviewer
- Primary: Claude Sonnet (review-only)
- Optional cross-check: Claude Opus (only if Sonnet output is inconclusive)

## Rules for Reviewer
- Do **not** modify code.
- Do **not** suggest broad refactors.
- Provide only evidence-backed findings with `file:line`.
- For each checkpoint, output: `CONFIRMED` / `NOT CONFIRMED` / `UNCLEAR`.

## What to Ask (Prompt to Send)
Use this exact prompt with the reviewer:

"Audit why PDP/Catalog are showing `Delivery TAT: ETA UPDATING`.

Scope:
0. Confirm market RPC used by PDP/Catalog winner path actually returns `tat_effective_hours` and `delivery_tat_days` in its result shape.
1. Verify whether PDP market RPC response includes `tat_effective_hours` and `delivery_tat_days` for the winner path.
2. Verify whether PDP mapping preserves TAT fields into `bestOffer` and `data` used by pricing sections.
3. Verify whether Desktop Catalog card receives `bestOffer` from `winnersMap`.
4. Verify whether Desktop ProductCard logic hides TAT outside PDP (`if (!isPdp) return null`).
5. Verify identifier mapping: `winnersMap` key (`vehicle_color_id`) vs catalog card key (`v.id`) alignment.
6. Verify Mobile Catalog `CompactProductCard` receives and renders TAT from catalog `bestOffer`.

Output format (strict):
- Checkpoint N: CONFIRMED/NOT CONFIRMED/UNCLEAR
- Evidence: <absolute/path/file.tsx:line>
- Impact: one sentence
- Minimal fix: one sentence

Do not implement. Only audit with evidence."

## Local Files Reviewer Must Inspect
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/hooks/useSystemDealerContext.ts`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/app/store/[make]/[model]/[variant]/ProductClient.tsx`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/components/store/sections/PdpPricingSection.tsx`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/hooks/useCatalogMarketplace.ts`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/components/store/DesktopCatalog.tsx`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/components/store/mobile/MobileCatalog.tsx`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/components/store/desktop/ProductCard.tsx`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/components/store/mobile/CompactProductCard.tsx`
- `/Users/rathoreajitmsingh/Project/bookmy.bike/src/lib/server/catalogFetcherV2.ts`

## Decision Gate After Review
- If >= 3 core checkpoints are `CONFIRMED`, proceed with patch immediately.
- If any checkpoint is `UNCLEAR`, run one targeted local trace (RPC payload logging) before patch.
- If Sonnet and Opus disagree, prefer evidence with stronger `file:line` support.
- Bound the loop: after one targeted trace iteration, if still `UNCLEAR`, treat the least-evidenced checkpoint as the active root cause and apply a defensive patch.

## Patch Execution Order (After Review)
1. Ensure winner payload carries TAT fields in PDP path.
2. Ensure PDP `bestOffer` + `data` mapping preserves TAT.
3. Pass catalog `bestOffer` consistently to desktop card.
4. Remove/adjust desktop non-PDP TAT suppression only if product intent confirms catalog must show TAT.
5. Verify identifier parity for `winnersMap[v.id]`.
6. Smoke test PDP + Desktop Catalog + Mobile Catalog.

## Done Criteria
- PDP no longer shows `ETA UPDATING` when TAT exists in winner payload.
- Desktop and Mobile Catalog both show delivery line from hydrated winner data.
- No regression in offer ranking and dealer selection.
