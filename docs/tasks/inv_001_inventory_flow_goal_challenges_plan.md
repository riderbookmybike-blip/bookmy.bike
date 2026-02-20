# INV-001: Inventory Flow (Goal, Challenges, Plan)

## 1) Goal
Design and implement a complete inventory lifecycle for both `VEHICLE` and `ACCESSORY` SKUs:

1. Requisition
2. Procurement (multi-tenant supplier offers)
3. Purchase Order
4. Delivery Challan (DC) — supplier dispatch document
5. Receiving (GRN) — our receipt against DC
6. Stock posting (branch/warehouse scoped)
7. Catalog + CRM stock visibility

Target outcome:

1. Operational teams can run procurement and receiving without spreadsheets.
2. Stock is reliable at branch/warehouse level.
3. Store catalog reflects real stock status.

---

## 2) Scope Clarifications (Confirmed)

### 2.1 Branch + Warehouse at every stage
At each stage we keep both request origin and delivery destination context:

1. `request_branch_id`: requisition kis branch se raise hui.
2. `request_warehouse_id` (optional): agar request specific warehouse context se hai.
3. `delivery_branch_id`: stock kahan deliver karna hai.
4. `delivery_warehouse_id` (optional/required by setup): delivery branch ke andar kaunsa warehouse.

Notes:

1. Multi-branch dealership supported.
2. Branch without warehouses supported (delivery branch only).
3. Branch + multiple warehouses supported (branch + warehouse both capture).

### 2.2 Booking -> Requisition auto-create condition
`source_type=BOOKING` requisition only when requested SKU has insufficient stock.

Rule:

1. If `available_qty >= required_qty`, no procurement requisition needed.
2. If `available_qty < required_qty`, create requisition for shortage quantity only.

`source_type=DIRECT` remains manual flow.

### 2.3 Stock Transfers (In Scope — Stock Level)
Inter-branch and inter-warehouse stock transfers are **in scope** at the stock
level (Phase D). Transfers operate on posted `inv_stock` records only — they do
not affect the procurement pipeline.

Flow:
1. **Transfer Request**: source branch/warehouse, destination branch/warehouse, SKU, qty.
2. **Approval** (optional, configurable per tenant): manager signs off.
3. **Posting**: debit source location, credit destination, with paired ledger
   entries (`TRANSFER_OUT` + `TRANSFER_IN`).

Constraints:
- Cannot transfer more than `available_qty` at source.
- Transfer does not create new stock — it relocates existing stock.
- Both legs of the ledger entry reference the same `inv_stock_transfers.id`.

### 2.4 Booking as Commercial Trigger
Procurement is only meaningful downstream of a confirmed booking.

> **Naming Convention**: The DB table is `crm_bookings`. This document uses
> **"Booking"** consistently. There is no separate `crm_sales_orders` table.
> The `crm_bookings.sales_order_snapshot` column holds the locked commercial
> snapshot — that is the "sales order" data, not a separate entity.

The existing commercial lifecycle is:
```
Lead → Quote → LOCKED Quote → Booking (crm_bookings)
```

The inventory trigger chain is:
```
Booking (crm_bookings) → Stock Check → Shortage? → Requisition → Procurement → PO → GRN → Stock
```

- `source_type=BOOKING` requisitions are triggered by a **confirmed booking**
  (`crm_bookings` record), not by a quote or lead.
- The `booking_id` field on the requisition links back to `crm_bookings.id`.
- `source_type=DIRECT` requisitions remain independent of the commercial funnel
  (e.g., dealer replenishment, seasonal pre-stocking).

> **Prerequisite**: `crm_bookings` needs `sku_id`, `qty`, `delivery_branch_id`
> columns for the stock check to work in a single hop. See **INV-003** for the
> migration spec and backfill steps.

---

## 2.5 Supplier = Tenant
Suppliers are other dealerships (tenants) within the BookMyBike ecosystem.
There is **no separate supplier table**. All `supplier_id` fields are
FK → `id_tenants.id`.

---

## 2.6 Inventory Tables Registry

Canonical table names locked before any migration begins. All app queries must
reference these names exclusively.

| Entity | Table | Primary Key | Status Enum |
|---|---|---|---|
| Requisition | `inv_requisitions` | `id` (uuid) | `DRAFT`, `SUBMITTED`, `IN_PROCUREMENT`, `FULFILLED`, `CANCELLED` |
| Requisition Items | `inv_requisition_items` | `id` (uuid) | `OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED` |
| Procurement Quotes | `inv_procurement_quotes` | `id` (uuid) | `DRAFT`, `SUBMITTED`, `SELECTED`, `REJECTED`, `EXPIRED` |
| Purchase Order | `inv_purchase_orders` | `id` (uuid) | `DRAFT`, `APPROVED`, `SENT`, `DC_RECEIVED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED` |
| PO Items | `inv_purchase_order_items` | `id` (uuid) | `ORDERED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `SHORT_CLOSED` |
| Delivery Challan | `inv_delivery_challans` | `id` (uuid) | `RECEIVED`, `VERIFIED`, `DISCREPANCY` |
| DC Items | `inv_delivery_challan_items` | `id` (uuid) | — (qty fields: `dc_qty`, `remarks`) |
| GRN (Goods Receipt) | `inv_grn` | `id` (uuid) | `DRAFT`, `POSTED`, `CANCELLED` |
| GRN Items | `inv_grn_items` | `id` (uuid) | — (qty fields: `received`, `accepted`, `rejected`) |
| GRN Vehicle Details | `inv_grn_vehicle_details` | `id` (uuid) | — (per-unit capture) |
| GRN Accessory Details | `inv_grn_accessory_details` | `id` (uuid) | — (batch/lot capture) |
| Stock | `inv_stock` | `id` (uuid) | `AVAILABLE`, `RESERVED`, `SOLD`, `DAMAGED`, `IN_TRANSIT` |
| Stock Transfers | `inv_stock_transfers` | `id` (uuid) | `REQUESTED`, `APPROVED`, `POSTED`, `CANCELLED` |
| Stock Ledger | `inv_stock_ledger` | `id` (uuid) | — (append-only, no status) |

All mutable tables include: `tenant_id`, `created_by`, `updated_by`, `created_at`, `updated_at`.
Append-only ledger (`inv_stock_ledger`): `tenant_id`, `created_by`, `created_at` only.

---

## 3) Current Challenges (as of 2026-02-20)

1. Naming drift between app and DB:
   App pages still use legacy tables (`vehicle_inventory`, `purchase_orders`, `purchase_requisitions`) while DB currently has `inv_stock`, `inv_purchase_orders`, `inv_requisitions`.
2. Catalog stock is not wired:
   Store catalog fetch path does not merge inventory counts into product cards.
3. Vehicle-first assumptions in some flows:
   Receiving data capture is strongly vehicle-oriented and needs accessory-parity structures.
4. No unified shortage gate for booking flow:
   Booking-to-requisition trigger logic needs explicit, centralized stock check.
5. Limited branch/warehouse semantics:
   Flow needs strict origin/destination behavior across requisition -> PO -> receiving -> stock.

---

## 4) Functional Plan (Detailed)

## 4.1 Requisition
Entry paths:

1. Direct requisition (`source_type=DIRECT`)
2. Booking shortage requisition (`source_type=BOOKING`)

Required fields:

1. `sku_id`, `qty`, `priority`
2. `requested_by_user_id`, `assigned_to_user_id`
3. `request_branch_id` (+ optional request warehouse)
4. `delivery_branch_id` (+ optional delivery warehouse)
5. `source_type` (`DIRECT` | `BOOKING`)
6. `booking_id` (FK → `crm_bookings.id`, required when `source_type=BOOKING`)

Behavior:

1. Priority enforced (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
2. Booking flow auto-fills booking context and shortage quantity.
3. Requisition items become procurement demand lines.

## 4.2 Procurement (Supplier Offers)
Table: **`inv_procurement_quotes`**

For each requisition line, capture multiple supplier (tenant) quotes with audit:

1. `requisition_item_id` (FK → `inv_requisition_items`)
2. `supplier_id` (FK → `id_tenants.id`) — **supplier is another dealership/tenant**
3. `unit_cost`, `tax_amount`, `freight_amount`, `landed_cost` (computed)
4. `lead_time_days`, `valid_till`
5. `quoted_by_user_id`, `quoted_at`
6. `selection_reason` (nullable, required when manually overriding)
7. `status` (`DRAFT`, `SUBMITTED`, `SELECTED`, `REJECTED`, `EXPIRED`)

Behavior:

1. Comparison matrix (landed cost + lead time).
2. One quote marked `SELECTED` (or manually overridden with `selection_reason`).
3. Selected quote is carry-forward source for PO.

## 4.3 Purchase Order
PO creation from selected procurement quote:

1. Selected quote snapshot carried into PO items.
2. Delivery destination preserved (`delivery_branch_id`, `delivery_warehouse_id`).
3. Partial PO supported if requisition split required.
4. PO sent to supplier tenant.

## 4.4 Delivery Challan (DC)
Table: **`inv_delivery_challans`** + **`inv_delivery_challan_items`**

The DC is the **supplier's dispatch document**. When the supplier ships against
a PO, they issue a Delivery Challan. This is captured in our system as proof of
dispatch before physical receipt.

Fields:
1. `purchase_order_id` (FK → `inv_purchase_orders`)
2. `supplier_tenant_id` (FK → `id_tenants`) — the dispatching tenant
3. `dc_number` — supplier's challan reference number
4. `dc_date` — date on supplier's challan
5. `transporter_name`, `lr_number`, `vehicle_number`
6. `expected_delivery_date`
7. `status` (`RECEIVED`, `VERIFIED`, `DISCREPANCY`)

DC Items:
1. `sku_id`, `dc_qty` — what supplier claims to have dispatched
2. `remarks` (optional)

Behavior:
1. DC receipt updates PO status to `DC_RECEIVED`.
2. DC serves as the reference for GRN — receiver matches DC qty vs actual received.
3. Discrepancy between DC and GRN is flagged automatically.

## 4.5 Receiving (GRN)
Table: **`inv_grn`**

When shipment physically arrives, receipt is recorded **against the DC**:

1. Select DC (which auto-links to PO).
2. Capture per-item received/accepted/rejected quantities.
3. Compare against DC quantities — flag discrepancies.

Vehicle-specific capture (per unit):

1. `chassis_number`
2. `engine_number`
3. `key_number`
4. `manufacturing_date`
5. `battery_brand`, `battery_number`
6. `tyre_make`
7. Photos: chassis, engine, sticker, other (multiple uploads supported)

Accessory-specific capture:

1. Batch/lot details
2. Optional serial number (if serial-tracked accessory)
3. Qty at batch level
4. Product images/doc uploads (multiple)

## 4.6 Stock Posting
After successful GRN:

1. Post inventory into destination branch/warehouse.
2. Vehicle stock: unit-level records.
3. Accessory stock: quantity/lot-level records (with optional serial granularity).
4. Add inventory ledger entries for every state movement.

### Stock Ledger (`inv_stock_ledger`)
Append-only. Every stock mutation produces one ledger row.

| Field | Type | Description |
|---|---|---|
| `sku_id` | uuid | FK → `cat_skus` |
| `branch_id` | uuid | Branch where qty changed |
| `warehouse_id` | uuid (nullable) | Warehouse (if applicable) |
| `qty_delta` | integer | +N for inbound, −N for outbound |
| `balance_after` | integer | Running balance snapshot |
| `reason_code` | enum | See reason codes below |
| `ref_type` | text | Source entity type |
| `ref_id` | uuid | Source entity ID |
| `created_by` | uuid | User who triggered |
| `created_at` | timestamptz | Immutable |

Reason codes:
- `GRN_ACCEPT` — stock posted from accepted GRN
- `GRN_REJECT` — rejected qty logged for audit
- `BOOKING_RESERVE` — stock reserved against booking
- `BOOKING_RELEASE` — reservation released (cancellation)
- `SALE_DISPATCH` — stock dispatched on sale
- `TRANSFER_OUT` — stock debited from source location
- `TRANSFER_IN` — stock credited to destination location
- `ADJUSTMENT_POSITIVE` — manual count correction (surplus)
- `ADJUSTMENT_NEGATIVE` — manual count correction (shortage)
- `DAMAGE` — stock marked damaged

## 4.7 Stock Visibility (Marketplace + CRM)
Expose real stock data across both Marketplace catalog and CRM workspace.

### Marketplace (public catalog + PDP):
1. Aggregate available stock per SKU for active sales scope.
2. Show stock badge on product cards: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`.
3. Booking guardrail: if out of stock, route into requisition/procurement path.

### CRM (dealer dashboard):
1. Per-SKU stock breakdown: `available`, `reserved`, `in_transit`, `damaged`.
2. `in_transit` = sum of DC'd items not yet GRN posted.
3. Real-time view alongside quote/booking context.
4. Stock column visible in product/SKU listings in CRM workspace.

---

## 5) Data and Audit Plan

Every business action should capture:

1. `created_by`, `updated_by`
2. `created_at`, `updated_at`
3. explicit `status`
4. optional `reason/notes` for manual overrides

Mandatory audit points:

1. Quote creation/update/selection
2. PO approval/change
3. GRN posting and quantity adjustments
4. Stock status/owner/location movements

---

## 6) Proposed Execution Phases

## Phase A: Schema & Naming Alignment *(assigned to Codex — INV-002)*
1. Lock table names per Section 2.6 registry.
2. Create/rename tables to `inv_*` canonical names.
3. Add branch/warehouse columns across requisition/PO/GRN tables.
4. Create `inv_procurement_quotes`, `inv_delivery_challans`, `inv_delivery_challan_items`.
5. Create `inv_stock_ledger` table (Section 4.6 schema).
6. Migrate all app queries from legacy names to `inv_*`.

## Phase B: Requisition + Shortage Gate + Procurement *(assigned to Codex — INV-004)*
1. Requisition UI/API (direct + booking).
2. Booking shortage check service: centralized stock check returning `available_qty` vs `required_qty`, auto-creating `source_type=BOOKING` requisition for shortage delta.
3. Priority, assignee, branch/delivery semantics.
4. Supplier (tenant) quote capture and selection (`inv_procurement_quotes`).

## Phase C: PO + DC + Receiving
1. PO creation from selected quote.
2. DC capture: supplier's delivery challan with qty and transport metadata.
3. GRN against DC: vehicle + accessory detail capture, DC vs actual discrepancy check.
4. Multiple attachments upload and linking.

## Phase D: Stock + Transfers + Visibility
1. Stock posting with ledger entries (every GRN post → `inv_stock_ledger` row).
2. `in_transit` tracking: DC received but not yet GRN posted.
3. Stock transfer flow: request → approval → posting with paired ledger entries.
4. SKU stock aggregate service.
5. Marketplace stock badges + CRM per-SKU stock breakdown.

## Phase E: Hardening
1. RLS validation by tenant/branch scope.
2. Negative stock prevention (CHECK constraint + ledger balance verification).
3. Ledger reconciliation reports (sum of deltas = current stock).
4. DC-vs-GRN discrepancy reports.
5. Reports and reconciliation checks.

---

## 7) Acceptance Criteria

1. All `inv_*` tables exist per Section 2.6 registry; no legacy table names in app code.
2. `supplier_id` fields reference `id_tenants.id` — no separate supplier table.
3. Requisition can be created from direct input and from booking shortage (`crm_bookings` linked).
4. Booking shortage gate correctly computes delta and auto-creates requisition tied to `booking_id`.
5. Procurement supports multiple tenant supplier offers in `inv_procurement_quotes`.
6. PO can be generated from selected quote and preserves destination branch/warehouse.
7. DC captures supplier dispatch details; GRN is recorded against DC.
8. DC-vs-GRN quantity discrepancies are flagged automatically.
9. Receiving captures full vehicle/accessory details and media attachments.
10. Every stock mutation produces an `inv_stock_ledger` entry with correct reason code.
11. Stock transfers produce paired `TRANSFER_OUT` + `TRANSFER_IN` ledger entries.
12. Ledger sum-of-deltas equals current stock balance (reconciliation invariant).
13. Marketplace shows stock badges; CRM shows per-SKU stock breakdown with `in_transit`.
14. Tenant isolation and audit traceability are preserved end-to-end.

---

## 8) Open Items for Final Confirmation

1. Accessory serial tracking mandatory or optional by category.
2. Whether exact stock quantity should be shown in public catalog or only stock status labels.
3. Whether QA hold step is required between receiving and stock availability.
4. ~~Stock transfers deferred~~ — now in scope at stock level (see Section 2.3).
