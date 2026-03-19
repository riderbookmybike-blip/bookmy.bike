# Unused Index Drop Review

**Created**: 2026-03-19  
**Review due**: ~2026-04-16 (4 weeks)  
**Baseline commit**: `c35597a3`  
**Advisor**: `unused_index` (performance INFO)

---

## Context

83 indexes currently show `idx_scan = 0` in `pg_stat_user_indexes`.  
Many were added this sprint as FK indexes (they are new and have not had query traffic yet).  
Others may be genuinely stale from schema evolution.

> **Do not drop blindly.** `pg_stat_user_indexes` resets on Postgres restart and cold-start periods inflate the zero-scan count. Observe for 2–4 weeks of normal traffic before dropping.

---

## Review checklist (run ~2026-04-16)

```sql
-- Re-run this query on review date
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indexrelid = pg_stat_user_indexes.indexrelid AND i.indisprimary)
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indexrelid = pg_stat_user_indexes.indexrelid AND i.indisunique)
ORDER BY pg_relation_size(indexrelid) DESC;
```

Compare against this baseline list. Any index still at `idx_scan = 0` after 4 weeks of traffic is a drop candidate.

---

## Baseline snapshot (2026-03-19) — 83 unused indexes

### Large (≥ 192 kB) — highest storage cost, prioritise review

| Table | Approx size |
|-------|-------------|
| `id_members` (×2) | 688 kB + 672 kB |
| `analytics_events` | 424 kB |
| `recompute_queue` | 192 kB |

### Medium (16 kB each) — bulk of the list

`crm_leads` ×2, `fin_marketplace_schemes` ×2, `inv_quote_line_items`, `id_member_assets` ×3, `cat_brands`, `crm_allotments` ×2, `cat_item_ingestion_sources` ×2, `sku_accessory_matrix` ×3, `i18n_sync_runs`, `cat_reg_rules`, `id_locations` ×2, `id_team`, `sys_role_templates`, `id_member_spins`, `crm_payments`, `crm_quote_finance_attempts` ×2, `crm_tasks` ×3, `crm_quotes`, `inv_purchase_orders` ×6, `oclub_referrals`, `inv_stock` ×2, `inv_requests` ×2, `inv_dealer_quotes`, `inv_stock_ledger`, `cat_service_scope` ×2, `cat_service_entries`, `recompute_queue`, `crm_bookings` ×8, `id_primary_dealer_districts`

### Small (8 kB each) — newly added FK indexes, expect scan count to grow

`shadow_compare_log` ×2, `crm_dealer_shares` ×5, `oclub_sponsor_agents`, `oclub_sponsor_allocations`, `oclub_redemption_requests` ×2, `crm_finance_events`, `oclub_booking_coin_applies`, `crm_share_audit_log` ×2, `inv_stock`, `market_winner_finance`, `market_winner_price` ×2, `crm_media`, `crm_finance`, `inv_po_payments`, `price_snapshot_sku`

> 🟡 The 8 kB group includes FK indexes added `2026-03-19` — give these the full 4-week window before evaluating.

---

## Drop process (when ready)

For each confirmed unused index:
```sql
DROP INDEX CONCURRENTLY IF EXISTS public.<index_name>;
```

Group into one migration per table cluster. Test on staging first.
