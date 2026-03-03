# INV-007 Tight Audit Pack (Complete Plan + Questionnaire)

Date: March 3, 2026
Use case: Deep pre-implementation audit before approving procurement compliance build.

---

## 1) Audit Objective

Validate that proposed INV-007 work:
1. Does not duplicate existing requisition/PO/receipt implementation.
2. Preserves current behavior in production paths.
3. Adds only missing compliance layers (delivery note, vendor invoice, 3-way match, payment control).

---

## 2) Scope Under Audit

In scope:
1. Current system behavior (DB, actions, UI)
2. Proposed additive schema
3. Proposed server actions
4. Proposed UI additions
5. Regression and rollout controls

Out of scope:
1. Rebuilding requisition flow
2. Replacing existing PO creation flow
3. Full accounting engine redesign

---

## 3) Current-State Evidence Matrix (As-Is)

## 3.1 DB Evidence

Primary baseline migration:
1. `supabase/migrations/20260222_inv_001_strict_inventory_schema.sql`

Current active objects:
1. `inv_requests`
2. `inv_request_items`
3. `inv_dealer_quotes`
4. `inv_purchase_orders`
5. `inv_po_payments`
6. `inv_stock`
7. `inv_stock_ledger`
8. `inv_quote_line_items`
9. `inv_quote_terms`

Legacy-only (must stay untouched):
1. `purchase_orders`
2. `purchase_requisitions`
3. `purchase_requisition_items`
4. `vehicle_inventory`

## 3.2 Action Evidence

File:
1. `src/actions/inventory.ts`

Current implemented pipeline:
1. `createRequest`
2. `addDealerQuote`
3. `updateDealerQuote`
4. `selectQuote`
5. `createPurchaseOrderFromQuote`
6. `updatePurchaseOrder`
7. `recordPoPayment`
8. `receiveStock`
9. `bookingShortageCheck`

## 3.3 UI Evidence

Operational pages:
1. `src/app/dashboard/inventory/requisitions/page.tsx`
2. `src/app/dashboard/inventory/requisitions/[id]/page.tsx`
3. `src/app/dashboard/inventory/orders/page.tsx`
4. `src/app/dashboard/inventory/orders/[id]/page.tsx`
5. `src/app/dashboard/inventory/orders/[id]/grn/page.tsx`

Wrapper routes (no duplicate logic expected):
1. `src/app/app/[slug]/dashboard/inventory/requisitions/page.tsx`
2. `src/app/app/[slug]/dashboard/inventory/orders/page.tsx`
3. `src/app/app/[slug]/dashboard/inventory/stock/page.tsx`

---

## 4) Gap Validation (What is Missing)

Required and missing:
1. Delivery note/challan capture per PO
2. Vendor invoice capture per PO
3. 3-way matching result records
4. Payment gating based on match/approval status

Present but partial:
1. Receipt exists via `receiveStock`, but no separate delivery note/invoice compliance trail.

---

## 5) Proposed Build (For Approval)

## 5.1 Additive tables
1. `inv_delivery_notes`
2. `inv_delivery_note_items`
3. `inv_vendor_invoices`
4. `inv_vendor_invoice_items`
5. `inv_three_way_matches`

## 5.2 Additive action file
1. `src/actions/procurementCompliance.ts`

## 5.3 Additive pages
1. `/dashboard/inventory/delivery-notes`
2. `/dashboard/inventory/delivery-notes/[id]`
3. `/dashboard/inventory/invoices`
4. `/dashboard/inventory/invoices/[id]`

## 5.4 Existing code touch (minimal)
1. `recordPoPayment` guard only (status-based payment check)
2. PO detail page compliance summary card

---

## 6) Tight Audit Procedure (Step-by-Step)

## Step A: No-Duplication code scan
Pass criteria:
1. No new use of `purchase_*` or `vehicle_inventory`.
2. No new `inv_requisitions`/`inv_grn` dependencies.
3. New files are additive, not clones.

Suggested checks:
1. `rg -n "purchase_orders|purchase_requisitions|vehicle_inventory|inv_requisitions|inv_grn" src supabase/migrations`

## Step B: Behavioral baseline capture
Pass criteria:
1. Existing requisition create/edit works.
2. Quote add/select works.
3. PO create/status update works.
4. Stock receive works.
5. PO payment works pre-guard.

Evidence:
1. screenshots
2. test run logs
3. SQL snapshots

## Step C: Migration safety review
Pass criteria:
1. Migration is additive only.
2. No drop/alter on active core tables.
3. FKs/indexes/uniques defined.
4. RLS policy stubs present.

## Step D: Action contract review
Pass criteria:
1. Inputs validated strictly.
2. Status transitions deterministic.
3. Match logic deterministic and idempotent.
4. Payment guard returns clear errors.

## Step E: UI usability review
Pass criteria:
1. Delivery note create/list/detail complete.
2. Invoice create/list/detail complete.
3. Match result visible in PO and invoice detail.
4. Hold reason visible where payment blocked.

## Step F: Data integrity review
Pass criteria:
1. Unique `(po_id, note_number)`
2. Unique `(po_id, invoice_number)`
3. Match records immutable audit trail.
4. Actor/time fields populated.

## Step G: Regression review
Pass criteria:
1. Existing inventory pages unaffected.
2. Old routes still resolve.
3. No TS errors in touched modules.

---

## 7) Audit Questionnaire (Fill and send back)

Use this exact template in your reply.

## Section A: Scope approval
1. Do you approve additive-only architecture (no rewrite)?
- Answer: Yes/No
- Notes:

2. Should existing direct-to-stock receipt remain as-is in this phase?
- Answer: Yes/No
- Notes:

## Section B: Payment controls
1. Payment block mode at go-live:
- Answer: Warning-only / Hard-block
- Notes:

2. Override permission for blocked payment:
- Answer: Disallow / Finance Admin only / Super Admin only
- Notes:

## Section C: Invoice policy
1. Multiple invoices per PO:
- Answer: Yes/No
- Notes:

2. Partial invoice support:
- Answer: Yes/No
- Notes:

## Section D: Match policy
1. Quantity tolerance:
- Answer: Exact / configurable
- Value:

2. Value tolerance:
- Answer: Exact / percentage / fixed INR / hybrid
- Value:

3. Match failure behavior:
- Answer: Auto-HOLD / Warn-only
- Notes:

## Section E: Roles and approvals
1. Who can create delivery note?
- Answer:

2. Who can create invoice?
- Answer:

3. Who can approve invoice for payment?
- Answer:

4. Who can release HOLD?
- Answer:

## Section F: UAT gates
1. Mandatory test scenarios count to sign-off:
- Answer:

2. Need pilot tenant rollout before full rollout?
- Answer: Yes/No
- Tenant slug:

## Section G: Reporting
1. Which dashboards are mandatory in phase-1?
- Answer:

2. Need overdue invoice alerts now?
- Answer: Yes/No

---

## 8) Approval States

Use one state while responding:
1. `APPROVED_AS_IS`
2. `APPROVED_WITH_CHANGES`
3. `HOLD_NEEDS_REWORK`

---

## 9) Build Start Trigger

Build starts only when:
1. Questionnaire answered
2. Approval state shared
3. Any mandatory changes listed with priority (P0/P1/P2)

