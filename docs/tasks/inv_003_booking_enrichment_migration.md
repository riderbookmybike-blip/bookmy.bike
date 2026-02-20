# INV-003: Booking Table Enrichment for Inventory Triggers

## Objective
Add `sku_id`, `qty`, and `delivery_branch_id` to `crm_bookings` so the
inventory shortage gate can resolve stock in a single hop without JSON extraction.

---

## Context
The inventory trigger chain requires:
```
Booking (crm_bookings) → Stock Check → Shortage? → Requisition
```

Currently `crm_bookings` has `variant_id` + `color_id` (legacy Firebase IDs) but
no `sku_id`, no `qty`, and no branch context. The stock check service needs all
three to resolve `available_qty` at a specific branch for a specific SKU.

---

## Migration SQL

### Step 1: Add columns

```sql
ALTER TABLE crm_bookings
  ADD COLUMN IF NOT EXISTS sku_id uuid,
  ADD COLUMN IF NOT EXISTS qty integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS delivery_branch_id uuid;

COMMENT ON COLUMN crm_bookings.sku_id IS 'FK to cat_skus. Resolved from quote at booking creation.';
COMMENT ON COLUMN crm_bookings.qty IS 'Quantity ordered. Default 1 for vehicles, explicit for accessories.';
COMMENT ON COLUMN crm_bookings.delivery_branch_id IS 'Branch where stock should be checked/reserved. Resolved from tenant context.';
```

### Step 2: Backfill `sku_id` via `crm_quotes.vehicle_sku_id`

> **Note**: `crm_bookings.variant_id` and `color_id` are legacy Firebase IDs that
> do NOT join to `cat_skus`. The correct path is via the linked quote.

```sql
UPDATE crm_bookings b
SET sku_id = q.vehicle_sku_id::uuid
FROM crm_quotes q
WHERE b.quote_id = q.id
  AND q.vehicle_sku_id IS NOT NULL
  AND q.vehicle_sku_id != ''
  AND b.sku_id IS NULL;
```

### Step 3: Backfill `delivery_branch_id` from tenant default branch

```sql
-- Only if a branches table exists. Otherwise, set to NULL and let the
-- application resolve at runtime from tenant context.
-- This is a placeholder for when branch infrastructure is confirmed.
```

### Step 4: Add index for shortage check queries

```sql
CREATE INDEX IF NOT EXISTS idx_crm_bookings_sku_branch
  ON crm_bookings(sku_id, delivery_branch_id)
  WHERE sku_id IS NOT NULL;
```

---

## Application Change

In the booking creation flow (the action that converts a LOCKED quote to a
`crm_bookings` record), populate these new fields:

```typescript
// In createBookingAction or equivalent:
{
  sku_id: quote.vehicle_sku_id,       // from crm_quotes
  qty: 1,                              // default for vehicles
  delivery_branch_id: tenantBranchId,  // from active tenant context
}
```

---

## Verification

1. Run backfill SQL and confirm row count matches bookings with linked quotes.
2. Check for orphans: `SELECT count(*) FROM crm_bookings WHERE sku_id IS NULL AND quote_id IS NOT NULL;` — should be 0 after backfill.
3. Create a new test booking and verify `sku_id`, `qty`, `delivery_branch_id` are populated.
4. Regenerate types: `npx supabase gen types typescript --project-id aytdeqjxxjxbgiyslubx > src/types/supabase.ts`
5. `npm run build` passes.

---

## Constraints

- `sku_id` is nullable (bookings without a linked quote stay NULL).
- `qty` defaults to 1 — sufficient for vehicle bookings. Accessories will set explicit qty.
- `delivery_branch_id` is nullable until branch infrastructure is confirmed.
- Do NOT make `sku_id` NOT NULL — would break existing records without quotes.

