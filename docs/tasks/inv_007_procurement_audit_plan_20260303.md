# INV-007 Procurement Audit Plan (As-Is + Gap + Execution)

Date: March 3, 2026
Owner: Inventory / Procurement stream
Purpose: Create an audit-first, no-duplication execution plan for requisition -> procurement quote -> PO -> delivery note -> receipt -> invoice -> payment flow.

---

## 1) Executive Summary

Current system already implements a large portion of procurement lifecycle using strict `inv_*` schema, but not the full ERP-style inward compliance chain.

### Already implemented (do not rebuild)
1. Requisition creation (manual + booking shortage gate)
2. Dealer quote capture, compare, select
3. PO creation from selected quote
4. PO lifecycle status updates (`DRAFT -> SENT -> SHIPPED -> RECEIVED`)
5. PO payment recording (`UNPAID/PARTIAL/FULLY_PAID`)
6. Stock receipt and ledger posting via GRN-style receive screen (direct to `inv_stock`)

### Missing (implement next)
1. Delivery Note / Challan document model and workflow
2. Vendor Invoice model and workflow
3. Three-way match (PO vs receipt vs invoice)
4. Payment hold/unhold based on match result

---

## 2) As-Is Status (Audit Baseline)

## 2.1 Database status

### Active schema pattern (current code path)
Primary migration baseline:
- `supabase/migrations/20260222_inv_001_strict_inventory_schema.sql`

Core active tables observed in code:
1. `inv_requests`
2. `inv_request_items`
3. `inv_dealer_quotes`
4. `inv_purchase_orders`
5. `inv_po_payments`
6. `inv_stock`
7. `inv_stock_ledger`
8. `inv_quote_line_items` (from `20260225013000_inv_007_quote_breakdown_terms.sql`)
9. `inv_quote_terms` (from `20260225013000_inv_007_quote_breakdown_terms.sql`)

### Legacy objects found only in old migrations
1. `purchase_requisitions`
2. `purchase_requisition_items`
3. `purchase_orders`
4. `vehicle_inventory`
5. `inv_requisitions`, `inv_grn`, `inv_delivery_challans` dropped/replaced in strict reset migration

Audit conclusion:
- Production code is aligned to `inv_requests`-based strict schema.
- Avoid any new work on legacy `purchase_*` or `vehicle_inventory` paths.

## 2.2 Server actions status

Main implementation file:
- `src/actions/inventory.ts`

Implemented actions:
1. `createRequest`
2. `addDealerQuote`
3. `updateDealerQuote`
4. `selectQuote`
5. `createPurchaseOrderFromQuote`
6. `updatePurchaseOrder`
7. `recordPoPayment`
8. `receiveStock`
9. `getRequests`, `getRequestById`, `getStockById`
10. `checkStockAvailability`, `bookingShortageCheck`
11. `cancelRequest`

Audit conclusion:
- Existing actions already own core pipeline. Extend with additive compliance actions; do not fork/duplicate this file logic.

## 2.3 UI/UX status

Implemented pages (base routes):
1. `src/app/dashboard/inventory/requisitions/page.tsx`
2. `src/app/dashboard/inventory/requisitions/[id]/page.tsx`
3. `src/app/dashboard/inventory/requisitions/[id]/components/QuotePanel.tsx`
4. `src/app/dashboard/inventory/orders/page.tsx`
5. `src/app/dashboard/inventory/orders/[id]/page.tsx`
6. `src/app/dashboard/inventory/orders/[id]/grn/page.tsx`
7. `src/app/dashboard/inventory/orders/components/CreatePOModal.tsx`

Tenant slug wrappers re-export base pages:
1. `src/app/app/[slug]/dashboard/inventory/requisitions/page.tsx`
2. `src/app/app/[slug]/dashboard/inventory/requisitions/[id]/page.tsx`
3. `src/app/app/[slug]/dashboard/inventory/orders/page.tsx`
4. `src/app/app/[slug]/dashboard/inventory/stock/page.tsx`

Audit conclusion:
- No parallel duplicate UI stack detected; slug routes are wrappers.
- New workflows should be added as new modules, not duplicate requisition/PO screens.

---

## 3) Scope Clarification Against Target Procurement Flow

Target requested flow:
1. Requisition
2. Procurement quote
3. Purchase order
4. Delivery note
5. Receipt
6. Payment

Current mapping:
1. Requisition: implemented
2. Procurement quote: implemented
3. PO: implemented
4. Delivery note: missing
5. Receipt: implemented (direct stock receipt model)
6. Payment: implemented for PO, but without invoice + 3-way governance

Gap summary:
1. Compliance documents (delivery note, vendor invoice) missing
2. Match control (PO/receipt/invoice) missing
3. Payment controls tied to match status missing

---

## 4) No-Duplication Principles (Mandatory)

1. Keep `inv_requests` model as system of record for requisition.
2. Keep existing PO generation flow (`selectQuote` / `createPurchaseOrderFromQuote`).
3. Keep existing receive-to-stock operation (`receiveStock`) and extend around it.
4. Do not reintroduce `inv_requisitions`, `inv_grn`, `purchase_orders`, `purchase_requisitions`, `vehicle_inventory`.
5. Introduce additive compliance tables and link via foreign keys to existing PO/request objects.

---

## 5) Proposed Additive Data Model (Phase INV-007)

## 5.1 Delivery Note

### `inv_delivery_notes`
1. `id uuid pk`
2. `po_id uuid not null references inv_purchase_orders(id)`
3. `note_number text not null`
4. `note_date date not null`
5. `transporter_name text null`
6. `vehicle_number text null`
7. `docket_number text null`
8. `status text not null default 'RECEIVED'` (`RECEIVED/VERIFIED/DISCREPANCY/CLOSED`)
9. `created_by uuid null`
10. `created_at timestamptz default now()`
11. unique `(po_id, note_number)`

### `inv_delivery_note_items`
1. `id uuid pk`
2. `delivery_note_id uuid not null references inv_delivery_notes(id) on delete cascade`
3. `sku_id uuid not null references cat_skus(id)`
4. `qty_sent numeric(12,2) not null`
5. `qty_received numeric(12,2) not null default 0`
6. `qty_rejected numeric(12,2) not null default 0`
7. `remarks text null`

## 5.2 Vendor Invoice

### `inv_vendor_invoices`
1. `id uuid pk`
2. `po_id uuid not null references inv_purchase_orders(id)`
3. `invoice_number text not null`
4. `invoice_date date not null`
5. `taxable_amount numeric(14,2) not null`
6. `tax_amount numeric(14,2) not null default 0`
7. `total_amount numeric(14,2) not null`
8. `status text not null default 'PENDING_MATCH'` (`PENDING_MATCH/MATCHED/HOLD/APPROVED_FOR_PAYMENT/PAID`)
9. `created_by uuid null`
10. `created_at timestamptz default now()`
11. unique `(po_id, invoice_number)`

### `inv_vendor_invoice_items`
1. `id uuid pk`
2. `invoice_id uuid not null references inv_vendor_invoices(id) on delete cascade`
3. `request_item_id uuid null references inv_request_items(id)`
4. `cost_type inv_cost_type null`
5. `amount numeric(14,2) not null`
6. `notes text null`

## 5.3 Match/Audit

### `inv_three_way_matches`
1. `id uuid pk`
2. `po_id uuid not null references inv_purchase_orders(id)`
3. `invoice_id uuid not null references inv_vendor_invoices(id)`
4. `match_status text not null` (`MATCHED/MISMATCH/HOLD`)
5. `qty_variance numeric(14,2) null`
6. `value_variance numeric(14,2) null`
7. `tolerance_used jsonb null`
8. `notes text null`
9. `checked_by uuid null`
10. `checked_at timestamptz default now()`

---

## 6) API / Action Design (Additive)

Create new action file:
- `src/actions/procurementCompliance.ts`

Actions:
1. `createDeliveryNote(input)`
2. `updateDeliveryNoteStatus(noteId, status)`
3. `createVendorInvoice(input)`
4. `runThreeWayMatch({ poId, invoiceId })`
5. `approveInvoiceForPayment(invoiceId)`
6. `setInvoiceHold(invoiceId, reason)`
7. `releaseInvoiceHold(invoiceId)`

Integration change to existing action:
1. Update `recordPoPayment` in `src/actions/inventory.ts`
- Add guard: payment allowed only when at least one related invoice has status `APPROVED_FOR_PAYMENT`.
- Optional admin override flag later.

---

## 7) UI Plan (Additive, no replacement)

New pages:
1. `src/app/dashboard/inventory/delivery-notes/page.tsx`
2. `src/app/dashboard/inventory/delivery-notes/[id]/page.tsx`
3. `src/app/dashboard/inventory/invoices/page.tsx`
4. `src/app/dashboard/inventory/invoices/[id]/page.tsx`

Minimal integrations:
1. In PO detail page add section cards:
- linked delivery notes
- linked vendor invoices
- latest match status badge
2. In payment block show:
- `Blocked` if not approved for payment
- reason/hold note

Route registry additions:
- `src/modules/registry/routeRegistry.ts`
1. `inventory-delivery-notes`
2. `inventory-vendor-invoices`

---

## 8) Phase Plan with Audit Gates

## Phase A: Audit Freeze and Baseline (0.5 day)
1. Confirm there is zero runtime dependency on legacy tables.
2. Capture screenshots of existing requisition, quote, PO, GRN pages.
3. Capture SQL inventory of existing `inv_*` tables in current environment.

Exit gate:
1. Signed baseline approved by product + engineering.

## Phase B: Schema Additions (1 day)
1. Add migration for delivery note + invoice + match tables.
2. Add indexes + RLS placeholders.
3. Add display ID triggers only if needed.

Exit gate:
1. Migration applies cleanly.
2. Existing inventory pages still load.

## Phase C: Actions and Rules (1.5 days)
1. Implement `procurementCompliance.ts` actions.
2. Implement 3-way match calculation.
3. Add payment guard in `recordPoPayment`.

Exit gate:
1. Unit tests for match pass/fail/hold states.
2. Regression smoke for existing PO payment path.

## Phase D: UI Modules (2 days)
1. Delivery note list + detail + create.
2. Vendor invoice list + detail + create.
3. PO detail integration badges and links.

Exit gate:
1. End-to-end user can create note/invoice and run match from UI.

## Phase E: UAT + Hardening (1 day)
1. Scenario testing (full and mismatch).
2. Permission/role checks.
3. Dashboard KPIs update for compliance statuses.

Exit gate:
1. UAT checklist signed.

Estimated total: 6 working days (single engineer + QA support).

---

## 9) Audit Checklist (for your review)

## 9.1 Duplication checks
1. No new references added to `purchase_orders`, `purchase_requisitions`, `vehicle_inventory`.
2. No new `inv_requisitions`/`inv_grn` table dependency added.
3. Existing pages are extended, not cloned.

## 9.2 Functional checks
1. Requisition to PO flow unchanged.
2. Stock receive flow unchanged.
3. Delivery note can be attached to PO.
4. Invoice can be attached to PO.
5. Match run produces deterministic status.
6. Payment blocked on hold/mismatch.

## 9.3 Data integrity checks
1. Unique invoice number per PO.
2. Unique delivery note number per PO.
3. Match records traceable with actor/time.
4. Audit trail retained for hold/release actions.

---

## 10) Risks and Mitigations

1. Risk: current receipt is direct-to-stock, not formal GRN table.
- Mitigation: treat current stock receipt as receipt source in 3-way match; defer full GRN normalization.

2. Risk: payment guard may break existing operations.
- Mitigation: rollout behind soft enforcement flag (warn mode -> block mode).

3. Risk: enum/status drift across UI and DB.
- Mitigation: centralize status types in `src/types/inventory.ts` and new compliance types.

---

## 11) Immediate Next Implementation Order

1. Migration file: add delivery note + invoice + match tables.
2. New actions file `procurementCompliance.ts`.
3. PO detail page: add compliance summary panel.
4. New delivery note pages.
5. New invoice pages.
6. Add payment guard.
7. UAT and report.

---

## 12) Decision Required Before Build

Please confirm:
1. Should payment block be hard from day one, or start with warning-only mode?
2. Should one PO allow multiple vendor invoices (default recommended: yes)?
3. Should invoice approval require finance role now, or phase later?

