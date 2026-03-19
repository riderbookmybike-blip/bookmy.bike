# Dealer Enrichment + Studio Code Normalization Plan (Antigravity Execution)

Date: 2026-03-19  
Owner: Codex (planning/audit)  
Executor: Antigravity (implementation)

## Goal
Enrich dealership master data from internet + authoritative sources, let business choose primary branch per dealership, then generate and apply revised studio codes.

Target studio format (without `MH` literal):

`BRAND3-RTO2AREA1-DEALER3`

Example:

`HON-05K-AHE`

## Confirmed Business Rules
1. Do not include `MH` in the visible code.
2. `RTO2` must come from authoritative area-to-RTO mapping (`loc_pincodes.rto_code`), not pincode-last-two heuristic.
3. Business will choose one primary branch when multiple branches/contacts exist.
4. Non-primary branches must remain as branch records.

## Why Arni became `48N`
Current derivation:
1. Active branch pincode maps to `rto_code = MH48`.
2. Area token currently resolved as `N` (Nalasopara).
3. Hence `TVS-48N-ARN`.

If you choose a different primary branch/area for Arni, the area letter can change.

## Phase Plan

## Phase 0: Data Model Audit (No destructive writes)
1. Verify existing tables and fields:
   - `id_tenants`
   - `id_locations`
   - `dealer_brands`
   - `loc_pincodes`
2. Decide branch model:
   - Reuse `id_locations` as branch table.
   - Add/confirm `is_primary` semantics for one primary location per tenant.
3. Prepare migration draft only after business sign-off.

Deliverable:
- Schema decision note + migration SQL draft.

## Phase 1: Internet Enrichment Harvest
Source priority (high to low):
1. Official OEM dealer pages (Honda/TVS/Yamaha/Hero/Suzuki/Bajaj official dealer pages).
2. Official dealership websites.
3. Google Maps profiles.
4. Trusted aggregators (Justdial, ZigWheels, BikeWale) as fallback only.

Collect per dealership:
1. Dealer legal/display name
2. Brand(s)
3. Showroom addresses (all found)
4. Service center addresses (all found)
5. Contact numbers (all found)
6. Emails
7. Working hours
8. Map links / coordinates if available
9. Source URL + fetched date

Deliverable:
- `reports/dealer_enrichment_snapshot_20260319.csv`
- `reports/dealer_enrichment_sources_20260319.md`

## Phase 2: Normalize + Confidence Score
1. Normalize phones to E.164 where possible.
2. Deduplicate near-identical addresses.
3. Score each branch/contact:
   - `HIGH`: official OEM/dealership + matching pincode
   - `MEDIUM`: map profile + matching locality
   - `LOW`: aggregator only
4. Flag conflicts for business review.

Deliverable:
- `reports/dealer_enrichment_review_pack_20260319.md`

## Phase 3: Business Selection Pack
For each dealership, produce options:
1. Candidate Primary Branch
2. Candidate Contacts
3. Alternate Branches
4. Expected studio code under each primary option

Deliverable:
- `reports/dealer_primary_selection_sheet_20260319.md`

## Phase 4: Apply DB Updates (Post sign-off only)
1. Upsert/insert branch rows in `id_locations`.
2. Mark exactly one `is_primary = true` per dealership.
3. Update contact metadata fields (or side-table if chosen in Phase 0).
4. Compute and update `id_tenants.studio_id` from finalized rule:
   - `BRAND3` from `dealer_brands` primary brand
   - `RTO2` from primary branch pincode -> `loc_pincodes.rto_code`
   - `AREA1` from selected primary branch city/taluka/district
   - `DEALER3` from dealership canonical name

Deliverable:
- Migration + data patch SQL
- Post-update verification report

## Phase 5: UI and Contract Verification
1. Ensure PDP/CRM/Profiles display updated code.
2. Ensure only studio ID appears where requested.
3. Run smoke tests on:
   - PDP pricing source
   - Dealer session context
   - Lead/quote views

Deliverable:
- Verification checklist with pass/fail.

## Guardrails
1. No production overwrite without review pack approval.
2. Keep old studio codes in rollback map:
   - `reports/dealer_studio_code_rollback_map_20260319.csv`
3. Every imported internet value must keep source URL.
4. Prefer additive updates; avoid deleting legacy branch data.

## Antigravity Execution Prompt
`@antigravity Execute docs/tasks/dealer_enrichment_antigravity_plan_20260319.md end-to-end in phases. Start with Phase 0 and Phase 1 only, then stop for business review with artifacts. Return unified response: files changed, SQL executed, reports generated, unresolved conflicts, and recommended primary branch per dealership with confidence score.`

