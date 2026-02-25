# PA-COVER-REGRESSION-v1

Status: Completed  
Owner: Codex  
Last updated: 2026-02-25

## Incident Summary
PA Cover values were inconsistent across AUM rule editor, published pricing table, and PDP rendering.

Observed mismatch example:
- AUM panel showed PA `375` (or PETROL matrix `378`)
- `cat_price_state_mh` had legacy/stale PA base `885`
- PDP showed PA total from published table, not latest rule

## Root Cause
1. Rule updates in `cat_ins_rules` were not automatically propagated to already published rows in `cat_price_state_mh`.
2. Publisher PA mapping had semantic ambiguity (`pa` interpreted inconsistently as base vs total).
3. AUM preview was using a different engine import than publisher, creating simulator/publish drift.
4. Existing published rows already had stale PA values from older runs.

## Insurance Data Flow (Current)
1. AUM Insurance Rule Save:
- Table: `public.cat_ins_rules`
- Stores OD/TP/addon formulas as JSON (`od_components`, `tp_components`, `addons`)

2. Publish/Reprice:
- Action path: `calculatePricingBySkuIds` -> `publishPrices`
- Table updated: `public.cat_price_state_mh`
- Stores denormalized insurance snapshot columns (OD, TP, PA, totals, GST)

3. PDP Fetch:
- Source: `fetchPublishedPricing` in `src/lib/server/storeSot.ts`
- Reads insurance from `cat_price_state_mh` and builds `snapshot.insurance`
- PDP does not recalculate insurance engine client-side; it renders published snapshot

## Why 375 vs 378 Happened
In active rule JSON, PA has:
- `amount = 375`
- `fuelMatrix.PETROL = 378`

Shared insurance engine applies fuel matrix override for PETROL, so computed PA base is `378`.  
If business wants `375`, PETROL matrix value must be set to `375` (or removed).

## Tables Related To Insurance
1. `public.cat_ins_rules`
- Role: Rule source of truth
- Updated by: AUM Insurance save (upsert)
- Authenticity: Authoritative for formulas only, not final customer-facing prices

2. `public.cat_price_state_mh`
- Role: Published pricing snapshot used by PDP and downstream pricing consumers
- Updated by:
  - `publishPrices`
  - Auto-reprice triggered after insurance rule save
  - One-time backfill script for legacy rows
- Authenticity: Authoritative for published UI/quote pricing

3. `public.cat_price_dealer`
- Role: Dealer offers adjusted on publish delta
- Insurance impact: indirect (on-road delta side effect)

4. `public.crm_quotes` (`insurance_amount`)
- Role: CRM quote persistence
- Source: derived from published price snapshot, not raw rule formula

## Implemented Fixes
1. Publisher PA mapping fix:
- File: `src/actions/publishPrices.ts`
- PA base/gst/total now derived from addon object (`price/gst/total`) with safe fallback

2. Auto-reprice after rule save:
- File: `src/app/app/[slug]/dashboard/catalog/insurance/[id]/page.tsx`
- After `cat_ins_rules` upsert, published SKUs are repriced in batches

3. Engine parity fix in AUM preview:
- File: `src/components/catalog/insurance/InsurancePreview.tsx`
- Switched to shared AUM engine import (`@/lib/aums/insuranceEngine`)

4. Legacy data repair script:
- File: `scripts/reprice_published_insurance.ts`
- Recomputes insurance columns for published rows from active rules

## Verification Snapshot
DB checks after fix:
- `cat_ins_rules` active addon shows `amount=375`, `fuelMatrix.PETROL=378`
- `cat_price_state_mh` published MH rows now:
  - PA base `378.00`
  - PA GST `68.04`
  - PA total `446.04`
- stale PA base `885` rows: `0`
- published MH rows validated: `291`

## Update Propagation Answer
Question: "Insurance engine me update karne par table update ho raha hai ya nahi?"

Answer:
- AUM save flow: Yes, now it triggers auto-reprice and updates `cat_price_state_mh`.
- Direct manual DB edit in `cat_ins_rules` via Supabase table editor: No automatic publish pipeline is triggered unless reprice/publish action is run.

## Current Residual Risk
- No full audit trail entries were found for these table changes in `catalog_audit_log`.
- `updated_at` on `cat_price_state_mh` should not be treated as sole source of truth for publish time; use `published_at` + actor/publish job context.
