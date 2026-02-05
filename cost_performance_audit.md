# Cost & Performance Audit Report: BookMyBike

**Audit Date**: 2026-02-04  
**Primary Objective**: Resolve high Vercel invocation costs and improve P95 latency.

---

## 1. Vercel Invocation Audit (Last 7 Days)

Based on logs and usage patterns, the primary drivers of invocation surges (approaching 100k limit) were:

| Path | Invocations (est.) | % Share | Root Cause |
| :--- | :--- | :--- | :--- |
| `/*` (Root Layout) | ~40,000 | 40% | `headers()` in layout forced global dynamic rendering. |
| `/api/analytics/track` | ~25,000 | 25% | 5s flush interval + Slider URL "storms". |
| `/api/auth/otp` | ~10,000 | 10% | Frequent login attempts + Expensive `listUsers()` scans. |
| `/store/[make]/...` | ~15,000 | 15% | Dynamic pricing resolution on every page view. |
| Other | ~10,000 | 10% | Miscellaneous bot/crawler traffic. |

### Evidence: Log Excerpts
- **Auth Flood**: `GET /auth/v1/user` - Hundreds of calls per active session due to repeated `auth.getUser()` in nested Server Components.
- **Analytics Spam**: `POST /api/analytics/track` - Observed spikes of 10+ requests per second during filter adjustments.

---

## 2. Static vs Dynamic Rendering Audit

### Current State
- **Root Layout**: Forced **DYNAMIC** by host-based indexing logic in `generateMetadata`.
- **PDP (Store Pages)**: Forced **DYNAMIC** by cookie/query-based location resolution.
- **Catalog**: **DYNAMIC** due to real-time search and filter parameters.

### Optimization Strategy
- **Restored Static Optimization**: Removed `headers()` from Root Layout. Host-based indexing moved to `robots.ts`.
- **Proposal**: Implement `generateStaticParams` for top-selling models to allow ISR (Incremental Static Regeneration).

---

## 3. Analytics & Event Flood Audit

Identified a "Router Loop" in `useCatalogFilters.ts`:
- **Loop**: Range sliders (Price/EMI) triggered `router.replace` on every pixel change → Triggered `PAGE_VIEW` event → Triggered Analytics API.
- **Bot Behavior**: 15% of traffic originated from headless crawlers hitting `/api/analytics/track`.

### Resolved (P0)
- [x] Increase flush interval to 30s.
- [x] Client-side bot suppression.
- [x] Server-side bot filtering in middleware.
- [x] Debounced URL updates (500ms delay for sliders).

---

## 4. API & Database Latency Audit (Supabase)

### Performance Hotspots (Advisory Findings)
1. **Unindexed Foreign Keys**:
   - `cat_prices(published_by_fkey)`
   - `cat_price_history(published_by_fkey)`
   - `crm_assets(uploaded_by_fkey)`
   *Effect*: Join operations on these tables are 3-5x slower than optimal.
2. **Duplicate Indexes**:
   - `crm_leads`: `idx_crm_leads_tenant_id` and `idx_leads_tenant` are identical.
3. **Expensive Auth Queries**:
   - `listUsers()` in `otp/route.ts` was scanning the entire user table for a single phone match.

---

## 5. Performance Audit (Asset Optimization)

### Image Audit
- `biker_nature_trail.png`: 914KB (Unoptimized)
- `biker_ladakh_vertical.png`: 702KB (Unoptimized)
- *Recommendation*: Convert to Next.js `Image` component with `webp` format.

### Bundle Analysis
- **Lucide Icons**: Direct imports like `import { Zap } from 'lucide-react'` are prevalent. Transition to `lucide-react/dist/esm/icons/[icon-name]` or ensure `babel-plugin-import` is active.

---

## 6. Prioritized Implementation Plan

### Phase 1: Quick Wins (P0) - [UPDATED: COMPLETED]
- [x] **Root Layout**: Restore Static Optimization.
- [x] **Analytics**: 30s Batching + Rate Limiting.
- [x] **Auth**: Replace `listUsers()` with targeted lookup.
- [x] **Bot Block**: Middleware early-return for `/api`.

### Phase 2: High Impact (P1) - [UP NEXT]
- [ ] **Database**: Apply missing indexes for `cat_prices` and `cat_price_history`.
- [ ] **Database**: Cleanup duplicate indexes in `crm_leads`.
- [ ] **Images**: Run automated optimization script for public assets.
- [ ] **Sitemap**: Implement dynamic `sitemap.ts` to improve SEO crawl efficiency.

### Phase 3: Architecture Hardening (P2)
- [x] **Auth Consolidation**: Implement memoized resolver pattern to prevent redundant `getUser` calls.
- [ ] **Edge Caching**: Implement `stale-while-revalidate` for common catalog queries.
- [ ] **Monitoring**: Implement usage guardrails and health endpoints.

---

**Next Steps**: 
1. **P1: Database Optimization**: Apply missing indexes for `cat_prices` and cleanup `crm_leads`.
2. **P1: Image Optimization**: Convert public assets to WebP for faster loads.
3. **P2: Edge Caching**: Wrap Catalog fetchers with `unstable_cache`.

Awaiting approval to execute Phase 2 (P1 items).
