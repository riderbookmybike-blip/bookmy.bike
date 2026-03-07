# Mobile Marketplace Performance Audit
Date: 2026-03-06
Scope: Source-level audit for store/marketplace mobile slowness and missing tap feedback perception.

## Executive Summary
Mobile slow feel ka major reason single issue nahi hai; multiple layers add ho rahe hain:
1. Aggressive no-cache strategy (HTML + client fetch no-store) har visit/par reload cost badha rahi hai.
2. Store UI heavy client-side work + large animated cards (Framer Motion + per-card springs + effects) low-end phones pe main-thread block karta hai.
3. Click/tap actions me pending state or immediate visual acknowledgment missing hai, isliye user ko lagta hai click hua hi nahi.
4. Data path me API request + dynamic pricing/context resolution chain har load par run hoti hai.

## Findings (High -> Medium)

### H1: HTML always no-store in production
Evidence:
- `next.config.ts:83` sets `Cache-Control: no-cache, no-store, must-revalidate` for HTML (`/:path*` with `accept: text/html`).

Impact:
- Repeat navigation/back-forward on mobile me fresh HTML fetch hota hai.
- High RTT networks (4G/weak coverage) par TTFB + perceived lag increase.

Recommendation:
- HTML ke liye short revalidation strategy use karo (e.g. `max-age=0, s-maxage=30, stale-while-revalidate=120`) where safe.
- Truly real-time pages ke liye hi strict no-store rakho.

### H1: Catalog fetch forced to no-store from client hook
Evidence:
- `src/hooks/SystemCatalogLogic.ts:96` uses `fetch(..., { cache: 'no-store' })`.

Impact:
- Every mount/location update pe full network roundtrip mandatory.
- Mobile scroll/nav cycles me repeated waits.

Recommendation:
- Catalog response caching strategy define karo: per district/state short TTL.
- SWR/react-query style stale-while-revalidate with optimistic first paint.

### H1: Product card rendering path is animation-heavy for mobile
Evidence:
- `src/components/store/desktop/ProductCard.tsx:4` imports motion hooks.
- `src/components/store/desktop/ProductCard.tsx:167-180` per-card motion values/springs/transforms.
- `src/components/store/WishlistClient.tsx:376-390` list-level + item-level motion wrappers.

Impact:
- Large product grids me hydration and interaction delay.
- Low-end Android devices pe input latency aur jank.

Recommendation:
- Mobile breakpoints pe heavy motion disable/reduce.
- `prefers-reduced-motion` + device capability gating add karo.
- Card effects ko CSS-only lightweight transitions tak limit karo on touch devices.

### H1: Tap feedback missing on navigation actions
Evidence:
- `src/components/store/WishlistClient.tsx:401-404` and `:281-283` actions trigger navigation directly.
- `src/components/store/desktop/ProductCard.tsx:437-447` card click directly `router.push` without pending state.

Impact:
- User ko lagta hai tap register nahi hua (exactly reported symptom).

Recommendation:
- `useTransition`/`isNavigating` state add karo.
- Tap par immediate feedback: button disabled + spinner/text (`Opening...`) + pressed state hold.

### M1: Wishlist lookup algorithm is O(favorites * catalog)
Evidence:
- `src/components/store/WishlistClient.tsx:101-103` each favorite does `catalogItems.find(...)`.

Impact:
- Catalog/favorites bade hone par CPU spikes during render/filter.

Recommendation:
- `Map` index (`id -> item`) memoize करके O(n) mapping use karo.

### M1: Unused state and extra rerender triggers
Evidence:
- `clearFavorites`, `sortBy`, `explodedVariant`, `activeFilterCount` present but not effectively wired in UX flow.

Impact:
- Complexity badhta hai, maintainability down, accidental rerenders ka risk up.

Recommendation:
- Dead/unused state cleanup and split component.

### M2: Large monolithic files increase hydration/maintenance risk
Evidence:
- `src/components/store/desktop/ProductCard.tsx` ~1473 LOC.
- `src/components/store/DesktopCatalog.tsx` ~1831 LOC.
- Several very large UI modules exist repo-wide.

Impact:
- Bundle/hydration pressure and regression risk.

Recommendation:
- Component slicing + lazy loading non-critical UI segments.

## Why mobile feels "click hua ya nahi"
Primary combo:
1. Main thread busy (heavy card rendering/animations)
2. Network-dependent no-store navigation/data fetch
3. No immediate interaction acknowledgement on tap

Ye combination user ko dead-tap jaisa feel deta hai.

## Priority Action Plan

### P0 (Same day)
- Add tap feedback on all nav CTAs/cards (`isPending`, disable, visual state).
- Reduce mobile motion intensity (especially per-card springs/tilt).

### P1 (1-2 days)
- Replace `cache: 'no-store'` in catalog fetch with TTL/stale-while-revalidate.
- Revisit production HTML cache headers to avoid full no-store everywhere.

### P2 (3-5 days)
- Optimize Wishlist mapping with dictionary/map.
- Split `ProductCard`/catalog components and lazy-load advanced interactions.

## Audit Constraints
- Production build size report generate nahi hua because required env vars missing during `npm run build`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

