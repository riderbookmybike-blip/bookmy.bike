# INV-005: Codex Task — Phase C Purchase Order + GRN + Stock Posting

## Objective
Implement the purchase-to-stock pipeline: create POs from selected procurement
quotes, record goods receipt (GRN with vehicle-level details), and post accepted
units into `inv_stock`. This completes the inward supply chain.

---

## Pre-Conditions
- **INV-004 (Phase B)** complete: requisitions, procurement quotes, shortage gate.
- All `inv_*` tables exist from Phase A (`inv_purchase_orders`, `inv_grn`, etc.).
- `inv_purchase_orders.status` uses `po_status` enum (USER-DEFINED type).
- Supabase project ref: `aytdeqjxxjxbgiyslubx`.

---

## Schema Reference (Already Live)

### inv_purchase_orders
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `order_number` | text | NOT NULL |
| `status` | `po_status` enum | Default `DRAFT` |
| `requisition_id` | uuid | FK to `inv_requisitions` |
| `vendor_name` | text | |
| `delivery_branch_id` | uuid | |
| `transporter_name` / `docket_number` | text | Logistics |
| `expected_date` | date | |

### inv_purchase_order_items
| Column | Type | Notes |
|---|---|---|
| `po_id` | uuid | NOT NULL FK |
| `purchase_order_id` | uuid | FK (legacy dup — use `po_id`) |
| `sku_id` | uuid | NOT NULL |
| `ordered_qty` | integer | NOT NULL |
| `received_qty` | integer | Default 0 |
| `unit_cost` | numeric | |
| `requisition_item_id` | uuid | Back-link |
| `status` | text | Default `ORDERED` |

### inv_grn
| Column | Type | Notes |
|---|---|---|
| `purchase_order_id` | uuid | |
| `delivery_challan_id` | uuid | |
| `request_branch_id` / `delivery_branch_id` | uuid | |
| `status` | text | Default `DRAFT` |

### inv_grn_items
| Column | Type | Notes |
|---|---|---|
| `grn_id` | uuid | |
| `purchase_order_item_id` | uuid | |
| `sku_id` | uuid | |
| `received` / `accepted` / `rejected` | integer | All default 0 |

### inv_grn_vehicle_details
| Column | Type | Notes |
|---|---|---|
| `grn_item_id` | uuid | |
| `chassis_number` / `engine_number` / `key_number` | text | |
| `manufacturing_date` | date | |
| `battery_brand` / `battery_number` / `tyre_make` | text | |
| `photos` | jsonb | |

### inv_stock_ledger
| Column | Type | Notes |
|---|---|---|
| `sku_id` / `branch_id` | uuid | NOT NULL |
| `qty_delta` | integer | NOT NULL (+/-) |
| `balance_after` | integer | NOT NULL |
| `reason_code` / `ref_type` / `ref_id` | text/uuid | Audit trail |

---

## Task 1: PO Server Actions

### File: `src/actions/inventory.ts` [MODIFY — append]

#### `createPurchaseOrder()`
1. Accept: `requisition_id`, `vendor_name`, `transporter_name`, `docket_number`, `expected_date`, `delivery_branch_id`, items array.
2. Generate `order_number`: `PO-{YYYY}-{4-digit random}`.
3. Insert `inv_purchase_orders` → status `SENT`.
4. Insert `inv_purchase_order_items` with `po_id`, `sku_id`, `ordered_qty`, `unit_cost` (from selected procurement quote's `landed_cost`), `requisition_item_id`.
5. Update `inv_requisitions.status` → `IN_PROCUREMENT`.
6. Return PO with items.

#### `getPurchaseOrders(tenantId)`
Join items, return list sorted by `created_at DESC`.

#### `getPurchaseOrderById(poId)`
Join items + GRN data, return single PO.

---

## Task 2: GRN Server Actions

### File: `src/actions/inventory.ts` [MODIFY — append]

#### `createGRN()`
1. Accept: `purchase_order_id`, `delivery_challan_id?`, `branch_id`, items array.
2. Insert `inv_grn` → status `DRAFT`.
3. Insert `inv_grn_items` per item with `received`, `accepted`, `rejected` counts.
4. For each accepted vehicle: insert `inv_grn_vehicle_details` (chassis, engine, key, manufacturing_date, battery, tyre).
5. Return GRN with items.

#### `confirmGRN(grnId)`
1. Set `inv_grn.status` → `CONFIRMED`.
2. For each `inv_grn_items`: update `inv_purchase_order_items.received_qty += accepted`.
3. Post stock (Task 3).
4. If all PO items fully received → `inv_purchase_orders.status` → `RECEIVED`.
5. Update linked `inv_requisitions.status` → `FULFILLED` (if all items done).

---

## Task 3: Stock Posting

### Triggered by `confirmGRN()`

For each accepted unit in confirmed GRN:
1. **Vehicle**: insert into `inv_stock` with `chassis_number`, `engine_number`, `status = 'AVAILABLE'`, `current_owner_id = tenant_id`.
2. **Ledger**: insert `inv_stock_ledger` with `qty_delta = +1`, `reason_code = 'GRN_INWARD'`, `ref_type = 'GRN'`, `ref_id = grn_id`.

---

## Task 4: Fix Orders List Page

### File: `src/app/dashboard/inventory/orders/page.tsx` [MODIFY]
- Remove broken `vehicle_colors→vehicle_variants→vehicle_models→brands` join.
- Use `cat_skus.sku_code` for SKU display (same fix as requisitions page).
- Add row click → PO detail page.

### File: `src/app/dashboard/inventory/orders/components/CreatePOModal.tsx` [MODIFY]
- Fix same broken `vehicle_colors` join in `fetchPendingRequisitions`.
- Wire to server action instead of client-side insert.
- Pre-populate `unit_cost` from selected procurement quote.

---

## Task 5: PO Detail Page

### File: `src/app/dashboard/inventory/orders/[id]/page.tsx` [NEW]

Shows:
1. PO header (order_number, vendor, status, transporter, expected date).
2. Items table (SKU, ordered qty, received qty, status).
3. Linked requisition link.
4. GRN section — list existing GRNs or "Create GRN" button.
5. Status transition buttons.

---

## Task 6: GRN Entry Page

### File: `src/app/dashboard/inventory/orders/[id]/grn/page.tsx` [NEW]

Vehicle-level goods receipt:
1. For each PO item, show ordered vs received.
2. Per-unit input: chassis_number, engine_number, key_number, manufacturing_date.
3. Accept/reject toggle per unit.
4. "Confirm GRN" → calls `confirmGRN()` → posts stock.

---

## Status Flows

```
PO:   DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED
                                         → CANCELLED

GRN:  DRAFT → CONFIRMED

Requisition (Phase B→C): SUBMITTED → IN_PROCUREMENT → FULFILLED
```

---

## Verification

1. Create a PO from the orders page → appears in list with `SENT` status.
2. Open PO detail → click "Create GRN" → enter vehicle details → confirm.
3. Confirm GRN → `inv_stock` rows created with chassis/engine numbers.
4. `inv_stock_ledger` entry exists with `reason_code = 'GRN_INWARD'`.
5. PO status updates to `RECEIVED` when fully received.
6. Linked requisition status → `FULFILLED`.
7. `npm run build` passes with zero errors.

---

## Out of Scope (DO NOT touch)

- Stock transfers between branches → Phase D.
- Branch-level stock filtering → Phase D.
- RLS policies → Phase E.
- Accessory-specific GRN details (`inv_grn_accessory_details`) → deferred.
