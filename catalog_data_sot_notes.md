# Catalog Data SOT Notes

## Source of Truth
- `Desktop Catalog` (`src/components/store/DesktopCatalog.tsx` + `src/components/store/desktop/ProductCard.tsx`) is the data SOT.
- `TV` is a visual mode of desktop (`isTv`) and should follow the same data contract.
- `Mobile` (`src/components/store/mobile/MobileCatalog.tsx` + `CompactProductCard.tsx`) should be aligned to desktop data outputs unless explicitly product-decided.

## Data-Level Parity Status (Current)

1. CTA Routing Contract
- Desktop/TV: supports model-level behavior with `variantCount`.
  - `variantCount > 1` -> variants listing (`buildVariantExplorerUrl`)
  - else -> variant offer page (`buildProductUrl`)
- Mobile: aligned. `MobileCatalog` passes `variantCount` to `CompactProductCard` and card uses the same route contract.

2. Pre-PDP Price Contract (Hard Rule)
- Scope: all non-PDP pages (`home`, `catalog`, `compare`, `wishlist`, and any other pre-PDP surface).
- Show only flat `cat-price-state` on-road price as SOT price.
- No winner dealer calculation, no offer delta (`bestOffer/offer_amount/best_offer/...`), no save/surge logic.
- No B-coin balance based adjustment in displayed price.
- B-coin equivalent display is allowed as equivalence-only value derived from SOT on-road price (not as a price adjustment).

3. O'Circle / B-coin Display
- Desktop/TV: O'Circle equivalent now always visible on card.
- Mobile: coin-equivalent UX is present; structure can differ for compact UX, but value source should match SOT price.

4. Price Breakdown Depth
- Desktop/TV: detailed on-road breakup tooltip (ex-showroom, registration, insurance) and finance/cash flip states.
- Mobile: condensed card with limited breakdown depth.

5. Variant Context Visibility
- Desktop/TV: model grouping + `variantCount` based behavior in catalog list.
- Mobile: flat `finalResults` rendering; no explicit model group `variantCount` UX.

## Alignment Rule (Going Forward)
- Any new catalog data field should first be implemented in desktop SOT contract.
- TV must inherit desktop data behavior (only visual differences allowed).
- Mobile can keep compact UI, but data semantics (routing decision, pre-PDP flat on-road price rule, O'Circle equivalence visibility rule) should not diverge without explicit product decision.
- Exception: PDP can have its own pricing logic and deeper calculations; pre-PDP surfaces cannot.

## Parity Checklist (Desktop/TV vs Mobile Cards)

- [x] `variantCount` based CTA route parity (`buildVariantExplorerUrl` vs `buildProductUrl`)
- [x] Active-color-first price source parity (`availableColors[].price` before base variant price)
- [x] Offer mode TAT label source parity (`delivery_tat_days`)
- [x] O'Circle equivalent computed from displayed SOT price, not as mandatory displayed-price adjustment
- [ ] Price source location label parity (if shown in card metadata)
- [ ] Any newly added desktop card field must be explicitly mapped or intentionally omitted in mobile with product sign-off

## Scheduled Task (Deferred)
- Status: `SCHEDULED` (do later)
- Decision: `Wait + start after antigravity commit`
- Objective: catalog ko lightweight rakhna and pre-PDP pricing ko strict `cat_price_state` SOT par lock karna
- Scope:
  - Catalog: fetch/display from state SOT only (`cat_price_state` path), no extra offer/dealer math
  - Compare/Favorites/Wishlist: only required filtering and presentation logic; redundant pricing transforms remove
  - Remove dead/legacy code paths identified in audit (only safe, non-regressive cleanup)
- Start Gate (required before execution):
  - Branch name
  - Latest commit hash (`git rev-parse --short HEAD`)
  - `git status --short` snapshot
- Execution Mode:
  - Phase 1: no-behavior-change cleanup
  - Phase 2: state-only pricing simplification across catalog + compare surfaces
