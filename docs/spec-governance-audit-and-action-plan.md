# Specification Governance Audit & Action Plan

Date: 8 March 2026  
Scope: Store PDP + Compare specification handling for vehicle variants

## 1) Objective

Specification table ko `single source of truth` banana hai jahan:
- Har variant me canonical spec keys consistent rahein.
- Duplicate labels/duplicate rows/different-value conflicts (example: `Displacement` 2 rows) eliminate ho.
- New model/variant add karte waqt sirf values fill ho, key identity change na ho.
- New key directly production me insert na ho; approval workflow se aaye.
- Brand-specific features (example: ride modes) controlled tareeke se add hon aur missing variants me fallback (`-` / `Not Available`) mile.

## 2) Current Handling (Code Audit Findings)

## 2.1 Rendering layer dedupe is weak in Compare flow
- Compare rows `flattenObject + normalizeFlatSpecs + labelFromKey` se ban rahe hain.
- File: `src/hooks/compareUtils.ts`
- Problem:
  - Dedupe key-level par ho raha hai, label-level par नहीं.
  - Different keys same label map kar sakte hain (e.g. `displacement`, `engine.displacement`, `engine_cc`) and all can render as separate rows.
  - `SPEC_SYNONYMS` me bahut limited mapping hai (`dimensions.curbWeight -> dimensions.kerbWeight` only), isliye collisions survive kar jati hain.

## 2.2 PDP layer me dedupe exists, but "first value wins"
- `TechSpecsSection` label-based dedupe karta hai.
- File: `src/components/store/Personalize/TechSpecsSection.tsx`
- Problem:
  - Agar same label ke 2 keys present hain with different values, first encountered key retain hota hai.
  - No confidence scoring / source priority / conflict resolution.
  - Isliye incorrect value silently survive kar sakti hai.

## 2.3 Source model mixed hai (normalized columns + free-form specs)
- Store SOT variant columns ko flatten karta hai (`flattenVariantSpecs`) and `product.specs` banata hai.
- File: `src/lib/server/storeSot.ts`
- Parallel me historical/free-form `specs` JSON patterns bhi present hain (legacy + matrix overrides).
- Result: same business attribute multiple paths se aa sakta hai.

## 2.4 Spec master table available hai, but hard enforcement missing
- `cat_specifications` exists and listing action bhi hai (`listSpecifications`).
- File: `src/actions/catalog/catalogV2Actions.ts`
- But:
  - Runtime write-path par strict check visible nahi ki unknown key reject ho.
  - Auto backfill for newly approved key across all variants visible nahi.
  - "permission required for new key" workflow formalized nahi.

## 2.5 Studio V2 me predefined vehicle fields hain (good baseline)
- File: `src/app/app/[slug]/dashboard/catalog/products/studio-v2/steps/VariantStepV2.tsx`
- Good:
  - Vehicle specs ke liye fixed field groups (`VEHICLE_SPEC_GROUPS`) defined hain.
- Gap:
  - End-to-end DB enforcement + ingestion enforcement + approval queue missing.

## 3) Root Causes

- Canonical spec dictionary exists, but ingestion + write-time governance not fully enforced.
- Synonym registry incomplete hai.
- Conflict resolution deterministic nahi (source priority absent).
- UI dedupe and data integrity alag-alag layers me fragmented hai.
- New-key lifecycle (propose -> review -> approve -> backfill -> rollout) absent hai.

## 4) What "100% reliable" target state should be

Har spec attribute ke liye:
- 1 canonical key (stable identity)
- N alias/synonyms allowed
- 1 resolved value per variant (with provenance + confidence)
- Unknown keys blocked from direct publish
- New key only approval queue se promote ho

## 5) Action Plan (Phased)

## Phase A: Data Contract Lock (must-do first)
1. `spec_key_registry` (or extend `cat_specifications`) ko authoritative banao:
   - `canonical_key`, `label`, `category`, `value_type`, `unit`, `status`, `requires_approval`
2. `spec_key_aliases` table add karo:
   - `alias_key -> canonical_key`, `normalizer`, `priority`
3. Write-time guardrail:
   - Variant/spec write API me unknown key reject ho (`PENDING_APPROVAL` bucket me divert).

## Phase B: Ingestion Governance (Antigravity)
1. Antigravity se आने wale fields par pre-processor lagao:
   - `incoming_key -> alias lookup -> canonical_key`
   - Label overwrite forbidden (identity immutable).
2. Same canonical key par multiple values aaye to `resolver` run ho:
   - source trust score
   - numeric-range sanity
   - unit check
   - historical consistency
3. Resolver output:
   - `accepted_value`
   - `rejected_values[]`
   - `reason`
   - `review_required` flag (if confidence low)

## Phase C: Approval Workflow (your requirement)
1. `spec_key_proposals` table create:
   - `incoming_key`, `suggested_canonical_key`, `sample_values`, `seen_on_models`, `status`
2. Admin queue UI:
   - `Approve as new key`
   - `Map to existing key`
   - `Reject`
3. Restriction:
   - Without your approval, no new key goes live in main spec table.

## Phase D: Backfill & Uniformization
1. Approved new key par global backfill job run:
   - all brands/models/variants me missing values -> `-` or `Not Available`
2. Synonym cleanup migration:
   - e.g. `CBS`, `SBT`, `Combi Brake` -> canonical enum `COMBI_BRAKE`
3. Duplicate labels eliminate by canonical-key merge, not UI-only hiding.

## Phase E: Compare/PDP Rendering Hardening
1. Compare row generation (`computeSpecRows`) update:
   - label नहीं, canonical key आधारित rendering.
   - same canonical key = single row.
2. PDP `TechSpecsSection` update:
   - "first key wins" remove.
   - canonical source + resolver output use karo.
3. Missing value standardize:
   - always `-` (single token policy).

## Phase F: Quality Gates & Monitoring
1. Pre-publish data quality checks:
   - duplicate canonical key per variant
   - invalid unit
   - impossible ranges
   - conflicting values
2. Daily anomaly report:
   - unknown keys
   - high-conflict specs
   - low-confidence auto-resolutions
3. Block publish if critical DQ failures.

## 6) Example: Ride Modes / Displacement Scenario

- Incoming: `ride_modes = "Sport, Urban, Rain"` for Apache RTR 160 4V.
- If canonical key `ride_modes` exists:
  - value update only.
  - other variants where missing => `-`.
- If incoming key `ride_mood` arrives:
  - direct insert blocked.
  - proposal queue me जायेगा.
  - on approval: alias map (`ride_mood -> ride_modes`) or new canonical key.

Displacement conflict case:
- Incoming values: `159.7 cc` and `160 cc`.
- Resolver:
  - normalize units and numeric values.
  - official trusted source preference.
  - accepted one retained; rejected one logged for audit.

## 7) Immediate Implementation Priorities (recommended order)

1. Unknown-key write block + proposal queue (`P0`)  
2. Alias mapping + canonical resolver (`P0`)  
3. Compare/PDP canonical-row rendering (`P1`)  
4. Backfill worker for approved keys (`P1`)  
5. Publish-time DQ gate + dashboards (`P2`)

## 8) Current Risk Summary (if unchanged)

- Same label with different values user ko दिखाई देती रहेगी.
- Brand-to-brand comparability unreliable rahegi.
- Antigravity imports se key drift continue hoga.
- Manual correction effort exponentially badhega.

## 9) Definition of Done

System done tab maana jayega jab:
- Production write path unknown key ko live spec me accept na kare.
- Every rendered spec row traceable ho canonical key + provenance se.
- Duplicate label collisions = zero.
- Approved new key global backfill ke saath available ho.
- Publish gate without DQ pass deploy ना होने दे.

