# Pending Tasks — Non-Code Cleanup

_Last updated: 2026-03-16 | Base commit: `17986f4a` | Tag: `v0.9.0-stable`_

---

## Open Items

### 1. `.next` Build Cache Stale Artifacts
**Priority:** Low  
**Type:** Infra / Non-code  
**Description:**  
`npx tsc --noEmit` reports 2 errors in `.next/types/validator.ts`:
```
.next/types/validator.ts(53,39):   TS2307 Cannot find module '../../src/app/1/page.js'
.next/types/validator.ts(1151,39): TS2307 Cannot find module '../../src/app/store/catalog-tv/page.js'
```
These are **stale build cache artifacts** — the pages were removed/renamed but `.next/` was not rebuilt.

**Fix:**
```bash
rm -rf .next && npm run build
```
Or just run `next build` once before the next deploy; CI will catch it.

---

### 2. Route Audit: `/d2` – `/d8` Dynamic Segments
**Priority:** Low  
**Type:** QA / Smoke  
**Description:**  
The `/d2` through `/d8` routes were only quick-sanity tested during Track 1 QA. A full smoke pass (mobile + desktop) covering:
- Page load without crash
- No missing chunk/import errors
- Core interactions (filter, compare) functional

has not been done post-Batch B3 TS changes.

**Action:** Run a QA pass on `/d2`–`/d8` on next staging deploy, or add to playwright smoke suite.

---

## Completed ✅

| Item | Commit | Notes |
|------|--------|-------|
| Jest CI gate on PRs | `.github/workflows/ci.yml` | Push + pull_request triggers |
| Analytics label migration | `1edc8dda` | DesktopCatalog → UniversalCatalog |
| TS Batch A (59→52 errors) | `02bdab78` | Low-risk type-only fixes |
| TS Batch B (52→37 errors) | `b2aa35f1` | Schema/type drift |
| TS Batch B2 (37→27 errors) | `54af8686` | Easy-win narrowing fixes |
| TS Batch B3 (27→0 errors) | `783b7e95` | Supabase regen + schema drift |
| Agent-lock guard disabled | `ff61543a` | pre-commit → lint-staged only |
| Docs: agent-lock note | `17986f4a` | CONTRIBUTING.md updated |
| Release tag | `v0.9.0-stable` | Rollback anchor at `17986f4a` |
