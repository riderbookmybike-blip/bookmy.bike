# INV-004: Codex Task — Phase B Requisition + Shortage Gate + Procurement

## Objective
Implement the requisition creation flow (direct + booking-triggered), the
centralized shortage check service, and the supplier quote capture/selection
UI. This is the first operational phase — it turns schema into working features.

---

## Pre-Conditions
- **INV-002 (Phase A)** must be complete: all `inv_*` tables exist, app code uses canonical names.
- **INV-003** must be complete: `crm_bookings` has `sku_id`, `qty`, `delivery_branch_id`.
- All DB operations use the Supabase MCP server (project ref: `aytdeqjxxjxbgiyslubx`).
- Run `npm run build` after all code changes to verify zero regressions.

---

## Task 1: Shortage Check Service

Create a server action that checks stock availability for a booking:

### File: `src/app/actions/inventory/checkStockAction.ts` [NEW]

```typescript
interface StockCheckInput {
  sku_id: string;
  required_qty: number;
  branch_id: string;       // delivery_branch_id from booking
  warehouse_id?: string;
}

interface StockCheckResult {
  sku_id: string;
  available_qty: number;
  required_qty: number;
  shortage_qty: number;      // max(0, required_qty - available_qty)
  has_shortage: boolean;
}
```

### Logic:
1. Query `inv_stock` for `sku_id` + `branch_id` where `status = 'AVAILABLE'`.
2. For vehicle SKUs: count distinct units (each `inv_stock` row = 1 unit).
3. For accessory SKUs: sum quantity field.
4. Return `available_qty`, `shortage_qty = max(0, required_qty - available_qty)`.

---

## Task 2: Direct Requisition Creation

### File: `src/app/actions/inventory/createRequisitionAction.ts` [MODIFY]

Server action for manual requisition creation:

```typescript
interface CreateRequisitionInput {
  tenant_id: string;
  items: Array<{
    sku_id: string;
    qty: number;
    notes?: string;
  }>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  request_branch_id: string;
  request_warehouse_id?: string;
  delivery_branch_id: string;
  delivery_warehouse_id?: string;
  requested_by_user_id: string;
  assigned_to_user_id?: string;
}
```

### Steps:
1. Insert into `inv_requisitions` with `source_type = 'DIRECT'`.
2. Insert each item into `inv_requisition_items` with `status = 'OPEN'`.
3. Set requisition `status = 'SUBMITTED'`.
4. Return created requisition with items.

---

## Task 3: Booking Shortage Requisition (Auto-Create)

### File: `src/app/actions/inventory/bookingShortageAction.ts` [NEW]

Triggered when a booking is created or confirmed:

### Steps:
1. Call `checkStockAction` with `booking.sku_id`, `booking.qty`, `booking.delivery_branch_id`.
2. If `has_shortage === false`: update `crm_bookings.inventory_status = 'AVAILABLE'`, return.
3. If `has_shortage === true`:
   a. Create requisition with `source_type = 'BOOKING'`, `booking_id = booking.id`.
   b. Single item: `sku_id = booking.sku_id`, `qty = shortage_qty`.
   c. Set `crm_bookings.inventory_status = 'SOFT_LOCKED'` (pending procurement).
   d. Return requisition ID for tracking.

### Guard: Do NOT create duplicate requisitions for the same booking.
```sql
SELECT id FROM inv_requisitions
WHERE booking_id = $1 AND status NOT IN ('CANCELLED', 'FULFILLED')
LIMIT 1;
```

---

## Task 4: Requisition List UI

### File: `src/app/dashboard/inventory/requisitions/page.tsx` [MODIFY]

Table columns:
| Column | Source |
|---|---|
| Display ID | `inv_requisitions.display_id` |
| Source | Badge: `DIRECT` / `BOOKING` |
| Status | Status chip with color |
| Priority | Badge: LOW/MED/HIGH/URGENT |
| Items | Count of `inv_requisition_items` |
| Request Branch | `request_branch_id` → location name |
| Delivery Branch | `delivery_branch_id` → location name |
| Created | `created_at` |
| Requested By | user name from `requested_by_user_id` |

### Filters:
- Status (multi-select)
- Source type (DIRECT / BOOKING)
- Priority
- Date range

### Actions:
- "New Requisition" button → opens `NewRequisitionModal`
- Row click → detail view with items

---

## Task 5: Requisition Detail View

### File: `src/app/dashboard/inventory/requisitions/[id]/page.tsx` [NEW]

Shows:
1. Requisition header (status, priority, source, branches, timestamps).
2. Items table (SKU name, qty, status per item).
3. If `source_type = 'BOOKING'`: link to booking detail.
4. Related procurement quotes (from Task 6).
5. Status transition buttons (based on current status).

---

## Task 6: Procurement Quote Capture

### File: `src/app/dashboard/inventory/requisitions/[id]/components/QuotePanel.tsx` [NEW]

For each requisition item, capture supplier quotes:

### UI:
1. Per-item expandable section showing:
   - Supplier (dropdown from `id_tenants` where `type = 'dealer'`)
   - Unit cost, tax, freight → auto-computed `landed_cost`
   - Lead time (days), valid until (date)
   - Status badge
2. "Add Quote" button per item.
3. Comparison view: table of all quotes per item sorted by `landed_cost`.
4. "Select" button on best quote → sets `status = 'SELECTED'`.
5. Manual override: if not selecting cheapest, require `selection_reason`.

### Server Action: `src/app/actions/inventory/procurementQuoteAction.ts` [NEW]

```typescript
interface CreateQuoteInput {
  requisition_item_id: string;
  supplier_id: string;          // FK → id_tenants.id
  unit_cost: number;
  tax_amount: number;
  freight_amount: number;
  lead_time_days?: number;
  valid_till?: string;
}
```

---

## Task 7: Requisition Status Transitions

Valid transitions:
```
DRAFT → SUBMITTED → IN_PROCUREMENT → FULFILLED
                                    → CANCELLED
```

- `DRAFT → SUBMITTED`: all items have qty > 0 and sku_id.
- `SUBMITTED → IN_PROCUREMENT`: at least one quote `SELECTED` per item.
- `IN_PROCUREMENT → FULFILLED`: all items have `status = 'FULFILLED'` (set by PO/GRN in Phase C).
- Any → `CANCELLED`: with reason, releases any held booking status.

---

## REST Route Sketch (for API-first consumers)

> Merged from Codex draft (`inv_004_phase_b_requisition_and_shortage_gate.md`).

- `POST /api/inventory/requisitions` — body: `source_type`, `booking_id?`, `request_branch_id`, `delivery_branch_id`, `priority`, `items[{sku_id, qty}]`. If `source_type=BOOKING`, calls shortage gate first; if sufficient, 200 no-op; else persists requisition.
- `GET /api/inventory/requisitions?status=&branch=` — list with filters.
- `POST /api/inventory/requisitions/:id/assign` — set `assigned_to_user_id`.
- `PATCH /api/inventory/requisitions/:id/status` — status transition.
- `POST /api/inventory/requisitions/:itemId/quotes` — create `inv_procurement_quotes`.
- `PATCH /api/inventory/quotes/:id/select` — sets `status='SELECTED'`, writes `selection_reason` if overriding lowest landed cost.

---

## Open Decisions

1. **Reservation model**: whether to mark stock `RESERVED` on booking or only after PO/GRN. Currently aligned to INV-001 reason codes (reserve on booking).
2. **Warehouse-level stock check**: extend gate input with `delivery_warehouse_id` when warehouses go live.

---

## Verification

1. Create a direct requisition → appears in list with correct status/priority.
2. Create a booking with insufficient stock → auto-creates `BOOKING` requisition.
3. Create a booking with sufficient stock → no requisition created, `inventory_status = 'AVAILABLE'`.
4. Add multiple quotes for a requisition item → comparison sorts by landed cost.
5. Select a quote → status updates to `SELECTED`.
6. Cancel a booking-linked requisition → booking `inventory_status` releases.
7. `npm run build` passes with zero errors.
8. No console errors in the UI during operations.

---

## Out of Scope (DO NOT touch)

- PO creation from selected quote → Phase C.
- DC/GRN processing → Phase C.
- Stock posting → Phase D.
- RLS policies → Phase E.
- `crm_bookings` columns (already added by INV-003).
