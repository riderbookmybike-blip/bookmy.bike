# Task Next Steps (2026-03-06)

## Current Status
Work paused by request. Below is the exact resume checklist.

## Completed in this session
- Mobile/store performance audit report created.
- P0 UX/performance fixes applied:
  - Tap feedback + pending states in store interactions.
  - Mobile motion reduction in wishlist flow.
  - Catalog client fetch warm-cache (sessionStorage TTL) added.
  - Store catalog API cache headers tuned for general vs personalized requests.
  - HTML cache header policy softened in `next.config.ts`.
- Refactor commits (incremental):
  - `14a3e21` refactor(store): reusable UI primitives for wishlist/compare
  - `a7ab955` refactor(store): reuse search primitive in discovery and catalog
- Runtime/HMR hotfix commit:
  - `766e7d1` fix(studio-v2): removed server-action imports from client page

## Pending Tasks (Priority)

### P0 - Marketplace supplier pricing engine (deferred)
1. Implement buyer-specific supplier SKU delta override model.
   - Supplier network rule change:
     - Do not use manual `supplier_dealer_map` onboarding.
     - In AUMS, treat all dealerships as potential suppliers to each other by default.
     - Supplier eligibility must be derived dynamically from mutual serviceable-area compatibility.
     - Remove supplier-add UI/flow from AUMS.
   - Need behavior:
     - Same supplier can keep different SKU delta for different buyer dealerships.
     - Precedence: `supplier_buyer_sku_delta` overrides `supplier_default_sku_delta`.
     - Dealer self delta is applied after winner supplier price is computed.
   - Calculation target:
     - `final_price = base_onroad + effective_supplier_delta + dealer_self_delta`
   - Availability target:
     - If dealer has local live stock for SKU (`inv_stock` available), show `IN_STOCK` (override supplier ETA).
     - Else show winner supplier ETA (`available_in_days`).

### P0 - Validate stability
1. Restart dev server and verify Studio V2 HMR error is gone.
   - Page: `/app/[slug]/dashboard/catalog/products/studio-v2`
   - If error persists, capture fresh stack trace and module path.

2. Re-test mobile catalog/wishlist interaction feel on real phone.
   - Confirm: tap feedback visible, no dead-tap perception.
   - Confirm: compare/explore actions show pending state consistently.

### P1 - Refactor continuation (design-systemization)
3. Continue shared store UI adoption in `DesktopCatalog`.
   - Replace repeated action/chip/button blocks with primitives:
     - `StoreButton`
     - `FilterChip`
     - `StoreSearchBar` (partially done)

4. Add a shared `CatalogShell` abstraction for:
   - catalog
   - wishlist
   - compare
   - variants mode

### P1 - CSS reduction pass
5. Run before/after CSS delta after current refactors.
   - Command: `npm run build > build-output.txt 2>&1`
   - Track:
     - total CSS bytes
     - largest CSS chunk
     - repeated arbitrary utility hotspots

6. Reduce arbitrary class usage in top heavy files:
   - `src/components/store/desktop/ProductCard.tsx`
   - `src/components/store/DesktopCatalog.tsx`
   - `src/app/store/ocircle/OCircleClient.tsx`

### P2 - Caching architecture cleanup
7. Re-evaluate full ISR applicability for store pages.
   - Current blocker: headers/cookies usage in request path.
   - Keep practical cache stack (CDN + API + client warm cache) unless path becomes static-safe.

## Notes / Risks
- One earlier commit (`14a3e21`) also includes pre-staged unrelated file:
  - `src/app/dashboard/finance-partners/tabs/utils/aprCalculator.ts`
  - Left as-is intentionally to avoid history rewrite.
- Build script requires env values loaded in shell (`set -a; source .env.local; set +a`) because `check-env.js` runs before Next build.

## Resume Command Snippets
```bash
# Ensure env in shell
set -a; source .env.local; set +a

# Start dev
npm run dev

# Build metrics
npm run build > build-output.txt 2>&1

# Quick staged-file guard before commit
git status --short
git diff --cached --name-only
```
