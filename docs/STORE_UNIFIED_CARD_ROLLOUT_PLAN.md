# Store Unified Card Rollout Plan

## Goal
Use one visual card resource across catalog, favorites, and compare journeys while keeping behavior mode-specific and low-risk.

## Architecture
- Single card resource: `ProductCard`
- Adapter layer: `src/components/store/cards/VehicleCardAdapters.tsx`
- Mode adapters:
1. `CatalogCardAdapter`
2. `FavoritesCardAdapter`
3. `CompareCardAdapter`
4. `VariantCompareCardAdapter`

## Implemented in this rollout
1. `DesktopCatalog` now uses `CatalogCardAdapter`.
2. `WishlistClient` now uses `FavoritesCardAdapter`.
3. `DesktopCompare` grid cards now use compare adapters (`Compare`/`VariantCompare`).
4. `MobileCompare` now uses `VariantCompareCardAdapter`.
5. User-facing label adjustments:
- "Wishlist" -> "Favorites" in key UI text while preserving route compatibility (`tab=wishlist`).
6. Central mode config introduced:
- `src/components/store/cards/vehicleModeConfig.ts`
- Adapter view safety via `getSafeViewMode(...)`
- Shared compare cap + compare limit message consumed by desktop/mobile catalog
7. Compare routing normalized:
- Canonical compare tab is now `favorites` (legacy `wishlist` still resolves)
- `SystemCompareRouter` tab resolution is now config-driven
8. SEO/shareable URL migration:
- Canonical paths:
  - `/store/compare/favorites`
  - `/store/compare/variants`
  - `/store/compare/studio`
- Root `/store/compare` now redirects query-style URLs to canonical path URLs.

## Risk Controls
1. No business logic moved out of existing flows; adapters only map props.
2. Existing compare limits and routing behavior unchanged.
3. Existing `ProductCard` behavior remains source of truth.
4. Backward-compatible URLs retained.

## Next Iteration (optional hardening)
1. Add `modeConfig` constants and consume in adapters for stricter UI contracts.
2. Add visual regression snapshots for catalog/favorites/compare (grid + list).
3. Add telemetry attribute for mode-level click tracking.
4. Add mobile parity tests for `Favorites` and compare flows.

## Acceptance Checklist
1. Catalog grid/list cards render and behave as before.
2. Favorites page card behavior matches catalog card styling.
3. Compare grid cards still support remove/toggle flows.
4. Mobile compare cards render pricing mode toggle correctly.
5. Favorites label visible in mobile bottom nav and empty states.
