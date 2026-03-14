# Catalog Data SOT Notes

## Source of Truth
- `Desktop Catalog` (`src/components/store/DesktopCatalog.tsx` + `src/components/store/desktop/ProductCard.tsx`) is the data SOT.
- `TV` is a visual mode of desktop (`isTv`) and should follow the same data contract.
- `Mobile` (`src/components/store/mobile/MobileCatalog.tsx` + `CompactProductCard.tsx`) should be aligned to desktop data outputs unless explicitly product-decided.

## Data-Level Differences Observed

1. CTA Routing Contract
- Desktop/TV: supports model-level behavior with `variantCount` and `onExplore`.
  - `variantCount > 1` -> variants listing (`buildVariantExplorerUrl`)
  - else -> variant offer page (`buildProductUrl`)
- Mobile: currently always uses variant-level `buildProductUrl` in `CompactProductCard`; no `variantCount` contract.

2. Pre-PDP Price Contract (Hard Rule)
- Scope: all non-PDP pages (`home`, `catalog`, `compare`, `wishlist`, and any other pre-PDP surface).
- Show only flat `cat-price-state` on-road price as SOT price.
- No winner dealer calculation, no offer delta (`bestOffer/offer_amount/best_offer/...`), no save/surge logic.
- No B-coin balance based adjustment in displayed price.
- B-coin equivalent display is allowed as equivalence-only value derived from SOT on-road price (not as a price adjustment).

3. O'Circle / B-coin Display
- Desktop/TV: O'Circle equivalent now always visible on card.
- Mobile: coin-equivalent UX is present but structurally lighter (not full desktop flip-card parity).

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
