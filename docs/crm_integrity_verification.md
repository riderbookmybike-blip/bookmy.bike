# CRM Integrity Verification Checklist

Run after CRM migrations or incidents. Execute in Supabase SQL editor as `service_role`.

## 1. Audit Log Entries

```sql
SELECT entity_type, action, changed_fields, performed_at
FROM public.crm_audit_log
WHERE entity_type IN ('LEAD','QUOTE','BOOKING','PAYMENT','FINANCE_ATTEMPT')
ORDER BY performed_at DESC
LIMIT 10;
```

✅ Recent rows with `action` = `INSERT` / `UPDATE` / `DELETE`, `old_data` + `new_data` populated on updates.

## 2. Soft-Delete Columns

```sql
SELECT table_name, column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('crm_leads','crm_quotes','crm_bookings','crm_payments','crm_quote_finance_attempts')
  AND column_name IN ('is_deleted','deleted_at','deleted_by')
ORDER BY table_name, column_name;
```

✅ `is_deleted` → default `false`, NOT NULL. `deleted_at` / `deleted_by` → nullable.

## 3. FK RESTRICT Constraints (9 total)

```sql
SELECT conname, conrelid::regclass AS on_table, confdeltype
FROM pg_constraint
WHERE conname IN (
  'fk_quotes_variant_protect',
  'fk_quotes_color_protect',
  'fk_quotes_lead_protect',
  'fk_quotes_tenant_protect',
  'fk_quotes_studio_protect',
  'fk_bookings_quote_protect',
  'fk_finance_quote_protect',
  'fk_leads_customer_protect',
  'fk_leads_tenant_protect'
)
ORDER BY conname;
```

✅ All 9 rows present, `confdeltype = 'r'` (RESTRICT).

## 4. RESTRICT Behavior (Destructive — use test data only)

```sql
-- Should FAIL with constraint violation
DELETE FROM public.cat_items WHERE id = '<variant_id_referenced_by_a_quote>';
```

✅ Error: `update or delete violates foreign key constraint`.

## 5. Snapshot Redundancy

```sql
SELECT id, snap_brand, snap_model, snap_variant, snap_color, snap_dealer_name
FROM public.crm_quotes
ORDER BY created_at DESC LIMIT 10;
```

✅ `snap_*` fields populated for all recent quotes.

## 6. Audit Triggers (5 CRM + 2 pre-existing)

```sql
SELECT DISTINCT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_audit%'
ORDER BY event_object_table;
```

✅ **This migration creates 5**: `crm_bookings`, `crm_leads`, `crm_payments`, `crm_quote_finance_attempts`, `crm_quotes`.
✅ **Pre-existing (other migrations)**: `cat_items`, `cat_price_state`.

## 7. Transactional Booking RPC

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'create_booking_from_quote';
```

✅ Routine exists.

## 8. RLS on Audit Log

```sql
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'crm_audit_log';
```

✅ `service_role` → full access. `authenticated` → SELECT only.

## 9. Application-Level Spot Checks

- Create a quote → confirm it appears in CRM UI **and** `crm_audit_log`
- Convert quote to booking → `crm_bookings` row created, quote status = `BOOKED`
- Set `is_deleted = true` on a quote → disappears from UI lists
- Attempt to delete a `cat_items` record referenced by a quote → blocked by DB
