# Parallel Migration Split (Codex + Antigravity)

## Hard Rules (Locked)
1. No new DB columns.
2. No new tables.
3. No `cat_skus_linear` reintroduction anywhere.
4. No destructive DB changes in this phase (`DROP`/rename core runtime tables).
5. Every PR/change must pass `npm run -s typecheck`.
6. If a new column is ever deemed mandatory, stop and take explicit approval first with full details.

## Schema Change Approval Gate (Mandatory)
If anyone believes a new column is required, they must provide approval note before implementation:
1. Why existing columns cannot solve it.
2. Exact table + column name.
3. Data type + nullability + default.
4. Backfill plan.
5. Read/write touchpoints impacted.
6. Rollback plan.
7. Explicit user approval recorded.

Without this approval, no schema change is allowed.

## Goal of This Split
1. Catalog live and stable.
2. Quote creation flow stable.
3. Canonical pricing source remains `cat_price_state_mh`.
4. Safe phased migration without schema churn.

## Canonical V2 Tables (Source of Truth)

| Domain | SOT Tables | Replaces |
|---|---|---|
| Brands | `cat_brands` | `cat_items` (type=FAMILY) |
| Models | `cat_models` | `cat_items` (type=PRODUCT) |
| Vehicle Variants | `cat_variants_vehicle` | `cat_items` (type=VARIANT) |
| Accessory Variants | `cat_variants_accessory` | `cat_items` (type=VARIANT, category=ACCESSORY) |
| Service Variants | `cat_variants_service` | `cat_items` (type=VARIANT, category=SERVICE) |
| SKUs/Colors | `cat_skus` | `cat_items` (type=SKU/UNIT) |
| Colours | `cat_colours` | `cat_items` specs.hex |
| Assets | `cat_assets` | `cat_items.image_url` + assets JSON |
| Pricing (MH) | `cat_price_state_mh` | `cat_price_mh` / `cat_skus_linear.price_mh` |
| Compatibility | `cat_suitable_for` | `cat_items.specs.suitable_for` text |

## Remaining `cat_skus_linear` References

| File | Usage | Lane |
|---|---|---|
| `src/types/supabase.ts` | Generated type metadata for legacy table | Codex |

> [!NOTE]
> Runtime/server query references are removed. Remaining entry is generated type metadata only.

## Completed Migrations

| File | What Changed | Status |
|---|---|---|
| `src/app/store/[make]/[model]/[variant]/page.tsx` | `cat_items` → `cat_models` + `cat_skus` + `cat_variants_*` | ✅ Done |
| `src/app/store/[make]/[model]/[variant]/page.tsx` | Pricing: `cat_skus_linear` fallback removed, `cat_price_state_mh` only | ✅ Done |
| `src/app/store/[make]/[model]/[variant]/page.tsx` | Accessories: `cat_items` → `cat_skus` + `cat_suitable_for` | ✅ Done |
| `src/utils/catalogMapper.ts` | Comment cleanup, removed `cat_skus_linear` references | ✅ Done |
| `src/components/dashboard/dealers/DealerPricelist.tsx` | `cat_items` self-join → `cat_skus` + V2 variant/model/brand joins | ✅ Done (Antigravity) |
| `src/components/modules/products/PricingLedgerTable.tsx` | Stale `cat_items` comment → `cat_skus` | ✅ Done (Antigravity) |
| `src/actions/products.ts` | Pricing ledger fetch/status: `cat_items` → `cat_skus` | ✅ Done |
| `src/actions/crm.ts` | Quote URL + marketplace + identity/spec/accessory lookups moved off `cat_items` | ✅ Done |

## Ownership Split

Owner override rule:
1. Final owner decision is with you.
2. You can reassign any Codex task to Antigravity at any time.
3. Reassignment must be logged in "File Lock Board" before implementation.
4. Once reassigned, only one lane edits that file until handoff is complete.

### Lane A: Antigravity (UI + Catalog Surface)
Files:
1. `src/components/store/*`
2. `src/app/store/[make]/[model]/[variant]/page.tsx` (UI-only follow-ups, no schema logic change)
3. `src/hooks/SystemCatalogLogic.ts` (UI mapping cleanup only)

Responsibilities:
1. Preserve UI output shape.
2. No backend contract changes.
3. No DB schema assumptions beyond existing fields.

Out of scope:
1. `src/actions/crm.ts`
2. `src/actions/catalog/syncAction.ts`
3. `src/actions/savePrices.ts`
4. Any migration SQL.

### Lane B: Codex (Server + Actions + Data Flow)
Files:
1. `src/actions/crm.ts`
2. `src/actions/products.ts`
3. `src/actions/savePrices.ts`
4. `src/actions/catalog/syncAction.ts`
5. `src/actions/publishPrices.ts` (if needed for compatibility cleanup)
6. `src/lib/aums/insuranceEngine.ts` (remove `cat_skus_linear` dependency)
7. `src/lib/aums/registrationEngine.ts` (remove `cat_skus_linear` dependency)
8. `src/lib/server/catalogFetcherV2.ts` (remove `cat_skus_linear` dependency)
9. `src/actions/catalog/catalogUtils.ts` (remove `cat_skus_linear` dependency)

Responsibilities:
1. Remove remaining `cat_skus_linear` runtime dependencies (6 files above).
2. Keep quote pipeline stable.
3. Keep canonical source usage consistent (`cat_skus`, `cat_models`, `cat_variants_*`, `cat_price_state_mh`).

Out of scope:
1. Visual redesign.
2. Any new schema creation.

## Safety Protocol (Strict)
1. Never edit same file in both lanes simultaneously.
2. Before starting a file, mark ownership in this doc.
3. Before merge:
    1. `rg -n "cat_skus_linear|price_mh|NEXT_PUBLIC_USE_LINEAR_CATALOG" src`
    2. `npm run -s typecheck`
4. If any behavior uncertainty appears, stop and log blocker instead of guessing.
5. Keep changes small and reversible.

## File Lock Board

### Completed (Unlocked)
1. `src/app/store/[make]/[model]/[variant]/page.tsx` — ✅ V2 migration done
2. `src/utils/catalogMapper.ts` — ✅ Comments cleaned
3. `src/lib/aums/insuranceEngine.ts` — ✅ Legacy `cat_skus_linear` wording removed
4. `src/lib/aums/registrationEngine.ts` — ✅ Legacy `cat_skus_linear` wording removed
5. `src/lib/server/catalogFetcherV2.ts` — ✅ Legacy wording removed
6. `src/actions/catalog/catalogUtils.ts` — ✅ Legacy wording removed
7. `src/actions/publishPrices.ts` — ✅ Legacy wording removed
8. `src/scripts/debug-rto.ts` — ✅ Debug query moved to `cat_price_state_mh`

### Locked by Antigravity
_No active locks — all assigned files completed._

### Locked by Codex
_No active locks — all assigned files completed._

## Handoff Template (Mandatory)
1. Files changed.
2. Behavior changed.
3. Risk notes.
4. Validation done (`typecheck`, targeted flow).
5. Any known TODOs.

## Go-Live Gate (This Phase)
1. Catalog listing works.
2. PDP opens and pricing renders.
3. Quote creation works end-to-end.
4. No runtime query path depends on `cat_skus_linear`.
5. No schema changes introduced in this phase.

## Remaining `cat_items` References

Within active migration scope (`src/actions src/lib src/app/store src/components/store src/hooks`):
1. `cat_items` query references: **0**

## Progress Tracker

| Gate | Status |
|---|---|
| PDP renders with V2 tables | ✅ Done (page.tsx migrated) |
| Catalog listing works | ✅ Done (catalogFetcherV2 canonical V2 flow) |
| Quote creation stable | ✅ Done (crm.ts + actions fully migrated, typecheck clean) |
| `cat_skus_linear` runtime references = 0 | ✅ Done |
| `cat_items` references in `/components` = 0 | ✅ Done (Antigravity batch) |
| `cat_items` references in `/store` = 0 | ✅ Done |
| `cat_items` references in active migration scope | ✅ Done (0 refs) |
| Typecheck passes | ✅ Done (exit 0) |

## Location Gate Update (Implementation Plan Alignment)

Implemented from `implementation_plan.md.resolved` (Phase 1 criticals):
1. Added server action `src/actions/resolveIpLocation.ts` for IP-based state resolution via request headers.
2. Updated `src/components/store/DesktopCatalog.tsx` geolocation failure paths:
   1. Try IP fallback before marking location as `unset`.
   2. If IP fallback fails, enforce hard location gate (`serviceability.status === 'unset'`) and open `LocationPicker`.
3. Removed silent "default MH" fallback in no-geolocation path for this flow.

Current status:
1. `no location => no catalog grid` enforced in `DesktopCatalog`.
2. `ip success => state-level serviceability` now unblocks catalog.
3. Typecheck clean after changes.
