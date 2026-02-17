# Runbook: `cat_price_state_mh` Migration and Cutover

## Goal
Move MH pricing to canonical `cat_price_state_mh` with zero functional break.

## Strategy
1. Create new table.
2. Backfill with explicit old->new mapping.
3. Dual-read/write short phase.
4. Validate.
5. Cutover.
6. Rollback ready.

## Dynamic Table Naming Decision
Current dynamic pattern in code: `cat_price_${stateCode.toLowerCase()}`.

Decision:
1. Keep `cat_price_mh` compatibility for existing dynamic callers during transition.
2. Add explicit resolver in code:
- `MH -> cat_price_state_mh`
- fallback for others: `cat_price_${state}`

## Phase 1: Create
1. Create `cat_price_state_mh` with frozen schema.
2. Add constraints/indexes.
3. Keep `cat_price_mh` untouched.

## Phase 2: Backfill (Old -> New Mapping)
| Old (`cat_price_mh`) | New (`cat_price_state_mh`) |
|---|---|
| `ex_showroom_basic` | `ex_factory` |
| `ex_showroom_gst_amount` | `ex_factory_gst_amount` |
| `ex_showroom_total` or `ex_showroom` | `ex_showroom` |
| `rto_roadtaxcess_rate_*` | `rto_roadtax_cess_rate_*` |
| `rto_roadtaxcessamount_*` | `rto_roadtax_cess_amount_*` |
| `ins_od_base` | `ins_own_damage_premium_amount` |
| `ins_od_gst` | `ins_own_damage_gst_amount` |
| `ins_od_total` | `ins_own_damage_total_amount` |
| `ins_tp_base` | `ins_liability_only_premium_amount` |
| `ins_tp_gst` | `ins_liability_only_gst_amount` |
| `ins_tp_total` | `ins_liability_only_total_amount` |
| `ins_base_total` | `ins_base_total` |
| `ins_gst_total` | `ins_gst_total` |
| `ins_net_premium` | `ins_net_premium` |
| `ins_total` | `ins_total` |
| `ins_pa` | `ins_pa` (temporary compatibility) |
| `addon_zerodepreciation_*` | `addon_zero_depreciation_*` |
| `addon_pa_*` | `addon_personal_accident_cover_*` |
| `hsn_insurance` | `ins_hsn_code` |
| `gst_rate_insurance` | `ins_gst_rate` |

Notes:
1. `logistics_charges` and `logistics_charges_gst_amount` default `0`.
2. Use upsert on `(sku_id, state_code)` so migration is rerunnable.
3. Publisher must later populate logistics fields from source input; do not keep them permanently zero.
4. Unchanged mappings (copy as-is): `rto_registration_fee_*`, `rto_smartcard_charges_*`, `rto_postal_charges_*`, `rto_roadtax_rate_*`, `rto_roadtax_amount_*`, `rto_total_*`, `rto_default_type`, `on_road_price`, `publish_stage`, `published_at`, `published_by`, `is_popular`.

## Phase 3: Validation
1. Row counts match.
2. Key anti-join returns 0 missing rows.
3. Aggregate sums near-match (ex-showroom/on-road/rto/insurance).
4. Formula checks:
- `on_road_price` arithmetic
- non-negative money fields
- valid `rto_default_type`

## Phase 4: Code Touchpoints (Must Update, in order)
1. Types first: `src/types/supabase.ts` regeneration.
2. Write paths:
- `src/actions/publishPrices.ts`
- `src/actions/savePrices.ts`
- `src/actions/pricingLedger.ts`
3. Read paths:
- `src/actions/catalog/catalogV2Actions.ts`
- `src/lib/server/catalogFetcherV2.ts`
- `src/app/store/[make]/[model]/[variant]/page.tsx`
- `src/app/app/[slug]/dashboard/catalog/pricing/page.tsx`
4. DDL helper touchpoint:
- `src/app/app/[slug]/dashboard/catalog/insurance/[id]/page.tsx`
5. Views:
- Any view based on `cat_price_mh` (e.g. `v_cat_price_mh_ordered`)

## Phase 5: Dual Phase
1. Writes to both tables for short window.
2. Reads gradually move to new table.
3. Compare sampled records in app.

## Phase 6: Cutover
1. Switch all reads/writes to `cat_price_state_mh`.
2. Stop dual write.
3. Monitor errors/logs.
4. Archive legacy table only after stable window.

## Rollback
1. Point reads/writes back to `cat_price_mh`.
2. Keep new table for diff/debug.
3. Fix mapping and re-run backfill.

## Definition of Done
1. No runtime query depends on old-only columns.
2. App flows (PDP, catalog, pricing dashboard, dealer flows) pass.
3. Validation queries pass.
4. Team signs off on frozen schema.
