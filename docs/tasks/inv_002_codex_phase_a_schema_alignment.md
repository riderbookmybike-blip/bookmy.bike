# INV-002: Codex Task — Phase A Schema & Naming Alignment

## Objective
Align all inventory-related database tables and application code to the canonical
`inv_*` naming convention defined in `docs/tasks/inv_001_inventory_flow_goal_challenges_plan.md`
Section 2.6 (Inventory Tables Registry). Create missing tables. Remove legacy
table name references from application code.

---

## Pre-Conditions
- Read `docs/tasks/inv_001_inventory_flow_goal_challenges_plan.md` fully before starting.
- All DB operations use the Supabase MCP server (project ref: `aytdeqjxxjxbgiyslubx`).
- Run `npm run build` after all code changes to verify zero regressions.
- **Dependency**: `crm_bookings` must have `sku_id`, `qty`, `delivery_branch_id` columns for the Phase B shortage gate to work. See `docs/tasks/inv_003_booking_enrichment_migration.md`. Execute INV-003 before or alongside Phase A.

---

## Naming Convention Lock

> **CRITICAL**: The business entity is called **"Booking"** everywhere.
> The DB table is `crm_bookings`. There is NO `crm_sales_orders` table.
> Do NOT create or reference `crm_sales_orders`.

---

## Task 1: Audit Existing Tables

Run SQL to list all inventory-related tables currently in the database:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'inv_%'
ORDER BY table_name;
```

Also check for legacy names that should NOT exist after this task:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('vehicle_inventory', 'purchase_orders', 'purchase_requisitions')
ORDER BY table_name;
```

Document findings before proceeding.

---

## Task 2: Create / Rename Tables to Canonical Names

The canonical registry (from INV-001 Section 2.6):

| Entity | Table | Status Enum |
|---|---|---|
| Requisition | `inv_requisitions` | `DRAFT`, `SUBMITTED`, `IN_PROCUREMENT`, `FULFILLED`, `CANCELLED` |
| Requisition Items | `inv_requisition_items` | `OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED` |
| Procurement Quotes | `inv_procurement_quotes` | `DRAFT`, `SUBMITTED`, `SELECTED`, `REJECTED`, `EXPIRED` |
| Purchase Order | `inv_purchase_orders` | `DRAFT`, `APPROVED`, `SENT`, `DC_RECEIVED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED` |
| PO Items | `inv_purchase_order_items` | `ORDERED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `SHORT_CLOSED` |
| Delivery Challan | `inv_delivery_challans` | `RECEIVED`, `VERIFIED`, `DISCREPANCY` |
| DC Items | `inv_delivery_challan_items` | — |
| GRN | `inv_grn` | `DRAFT`, `POSTED`, `CANCELLED` |
| GRN Items | `inv_grn_items` | — |
| GRN Vehicle Details | `inv_grn_vehicle_details` | — |
| GRN Accessory Details | `inv_grn_accessory_details` | — |
| Stock | `inv_stock` | `AVAILABLE`, `RESERVED`, `SOLD`, `DAMAGED`, `IN_TRANSIT` |
| Stock Transfers | `inv_stock_transfers` | `REQUESTED`, `APPROVED`, `POSTED`, `CANCELLED` |
| Stock Ledger | `inv_stock_ledger` | — (append-only) |

### Rules:
1. If a table already exists with the correct `inv_*` name, verify its columns match the spec. Add missing columns via `ALTER TABLE`.
2. If a table exists with a legacy name (e.g., `purchase_orders`), rename it: `ALTER TABLE purchase_orders RENAME TO inv_purchase_orders;`
3. If a table does not exist at all, create it.
4. Every mutable table MUST have: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`, `tenant_id uuid NOT NULL`, `created_by uuid`, `updated_by uuid`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. The append-only ledger (`inv_stock_ledger`) keeps `created_by` + `created_at` only.

### Branch/Warehouse columns (add to requisition/PO/GRN tables):
```sql
request_branch_id uuid,
request_warehouse_id uuid,
delivery_branch_id uuid,
delivery_warehouse_id uuid
```

Tables that need these columns: `inv_requisitions`, `inv_purchase_orders`, `inv_grn`.

Stock transfers already carry `source_*` and `destination_*` columns; do NOT add request/delivery columns there.

---

## Task 3: Create `inv_procurement_quotes`

Schema from INV-001 Section 4.2:

```sql
CREATE TABLE IF NOT EXISTS inv_procurement_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  requisition_item_id uuid REFERENCES inv_requisition_items(id),
  supplier_id uuid REFERENCES id_tenants(id),  -- supplier is another tenant/dealership
  unit_cost numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  freight_amount numeric NOT NULL DEFAULT 0,
  landed_cost numeric GENERATED ALWAYS AS (unit_cost + tax_amount + freight_amount) STORED,
  lead_time_days integer,
  valid_till date,
  quoted_by_user_id uuid,
  quoted_at timestamptz DEFAULT now(),
  selection_reason text,
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'SELECTED', 'REJECTED', 'EXPIRED')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Task 3b: Create `inv_delivery_challans` + `inv_delivery_challan_items`

```sql
CREATE TABLE IF NOT EXISTS inv_delivery_challans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  purchase_order_id uuid REFERENCES inv_purchase_orders(id),
  supplier_tenant_id uuid REFERENCES id_tenants(id),
  dc_number text NOT NULL,
  dc_date date NOT NULL,
  transporter_name text,
  lr_number text,
  vehicle_number text,
  expected_delivery_date date,
  status text NOT NULL DEFAULT 'RECEIVED'
    CHECK (status IN ('RECEIVED', 'VERIFIED', 'DISCREPANCY')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inv_delivery_challan_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  delivery_challan_id uuid REFERENCES inv_delivery_challans(id),
  sku_id uuid NOT NULL,
  dc_qty integer NOT NULL CHECK (dc_qty > 0),
  remarks text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Task 4: Create `inv_stock_ledger`

Schema from INV-001 Section 4.5:

```sql
CREATE TABLE IF NOT EXISTS inv_stock_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  sku_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  warehouse_id uuid,
  qty_delta integer NOT NULL,
  balance_after integer NOT NULL,
  reason_code text NOT NULL
    CHECK (reason_code IN (
      'GRN_ACCEPT', 'GRN_REJECT',
      'BOOKING_RESERVE', 'BOOKING_RELEASE',
      'SALE_DISPATCH',
      'TRANSFER_OUT', 'TRANSFER_IN',
      'ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE',
      'DAMAGE'
    )),
  ref_type text NOT NULL,
  ref_id uuid NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Index for reconciliation queries
CREATE INDEX idx_inv_stock_ledger_sku_branch
  ON inv_stock_ledger(sku_id, branch_id);
```

---

## Task 5: Create `inv_stock_transfers`

```sql
CREATE TABLE IF NOT EXISTS inv_stock_transfers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  sku_id uuid NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  source_branch_id uuid NOT NULL,
  source_warehouse_id uuid,
  destination_branch_id uuid NOT NULL,
  destination_warehouse_id uuid,
  status text NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'APPROVED', 'POSTED', 'CANCELLED')),
  requested_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  posted_at timestamptz,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Task 6: Add `booking_id` + `source_type` to `inv_requisitions`

```sql
ALTER TABLE inv_requisitions
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'DIRECT'
    CHECK (source_type IN ('DIRECT', 'BOOKING')),
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES crm_bookings(id);
```

---

## Task 7: Migrate App Code from Legacy Table Names

### Files using legacy names (MUST update):

| File | Legacy Reference | Replace With |
|---|---|---|
| `src/app/dashboard/inventory/stock/page.tsx` | `vehicle_inventory` | `inv_stock` |
| `src/app/dashboard/inventory/orders/page.tsx` | `purchase_orders` | `inv_purchase_orders` |
| `src/app/dashboard/inventory/orders/components/CreatePOModal.tsx` | `purchase_orders` | `inv_purchase_orders` |
| `src/app/dashboard/inventory/stock/components/InwardStockModal.tsx` | `vehicle_inventory` | `inv_stock` |
| `src/app/dashboard/inventory/requisitions/page.tsx` | `purchase_requisitions` | `inv_requisitions` |

### Files using new names (verify only):

| File | Current Reference | Action |
|---|---|---|
| `src/app/dashboard/inventory/requisitions/components/NewRequisitionModal.tsx` | `inv_requisitions` | Verify OK ✅ |

### Legacy component files (review and update if referencing old tables):

| File | Action |
|---|---|
| `src/components/dashboard/InventoryTable.tsx` | Update table refs |
| `src/components/inventory/InventoryDetail.tsx` | Update table refs |
| `src/components/inventory/InventoryList.tsx` | Update table refs |
| `src/components/modules/inventory/InventoryTabs.tsx` | Update table refs |
| `src/types/inventory.ts` | Align interfaces with new `inv_stock` schema |

### Search pattern for any remaining legacy references:
```bash
grep -rn "vehicle_inventory\|purchase_orders\|purchase_requisitions" src/ --include="*.ts" --include="*.tsx"
```

After edits, this grep MUST return zero results.

---

## Task 8: Regenerate TypeScript Types

```bash
npx supabase gen types typescript --project-id aytdeqjxxjxbgiyslubx > src/types/supabase.ts
```

---

## Task 9: Build Verification

```bash
npm run build
```

Must exit with zero errors. If there are type errors from the new schema, fix
the referencing files — do NOT suppress errors.

---

## Acceptance Criteria

1. All `inv_*` tables exist per the registry above (including `inv_delivery_challans` + `inv_delivery_challan_items`).
2. `inv_procurement_quotes` has `supplier_id` FK → `id_tenants(id)`.
3. `inv_stock_ledger`, `inv_stock_transfers` are created with correct schemas.
4. `inv_requisitions` has `source_type` and `booking_id` columns.
5. Zero references to `vehicle_inventory`, `purchase_orders`, `purchase_requisitions` in `src/`.
6. `src/types/supabase.ts` regenerated and includes all new tables.
7. `npm run build` passes with zero errors.

---

## Out of Scope (DO NOT touch)

- `crm_bookings` table — do NOT rename, do NOT create `crm_sales_orders`.
  Column additions (`sku_id`, `qty`, `delivery_branch_id`) are handled by INV-003.
- RLS policies — will be handled in Phase E.
- UI functionality changes — this task is schema + naming alignment only.
- Inventory business logic (requisition creation, stock posting, etc.) — Phase B–D.

## Forward Reference (for Phase D visibility work)

`in_transit` metric = DC items posted (`inv_delivery_challan_items.dc_qty`) minus
GRN items posted (`inv_grn_items.accepted`). This is not implemented in Phase A
but table structures created here must support this calculation.
