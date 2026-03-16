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
| Remove legacy `/d2`–`/d8` routes | _(pending commit)_ | Legacy design variants removed from app router |
| Agent-lock guard disabled | `ff61543a` | pre-commit → lint-staged only |
| Docs: agent-lock note | `17986f4a` | CONTRIBUTING.md updated |
| Release tag | `v0.9.0-stable` | Rollback anchor at `17986f4a` |
