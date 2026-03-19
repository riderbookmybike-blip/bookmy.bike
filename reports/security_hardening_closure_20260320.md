# Security Hardening Closure Report

**Date**: 2026-03-19  
**Sprint**: Advisor Security Backlog — E1, E2, W1, W2  
**Baseline tag**: `v0.3.19-ci-green`  
**Final commit**: `d14f96c5`

---

## Advisor Scorecard

| Severity | Before | After |
|----------|--------|-------|
| 🔴 ERROR | 2 | **0** |
| 🟡 WARN | ~29 | **5** |
| 🔵 INFO | 10 | 16 |

---

## Changes Applied

### E1 — `v_share_actors` SECURITY DEFINER → SECURITY INVOKER
- **Migration**: `20260320200000_fix_v_share_actors_security_invoker.sql`
- **Impact**: View now enforces RLS of the querying user, not the view owner (`postgres`). GRANTs to `authenticated` + `service_role` preserved.

### E2 — RLS enabled on 11 public tables
- **Migration**: `20260320201000_e2_rls_enable_11_public_tables.sql`
- **Group A** (authenticated SELECT): `market_winner_price`, `market_winner_finance`, `sku_accessory_matrix`, `cat_service_packages`, `cat_service_scope`, `cat_service_entries`
- **Group B** (service_role bypass only): `recompute_queue`, `price_snapshot_sku`, `shadow_compare_log`, `shadow_metrics_hourly`, `winner_cache_invalidation_log`

### W1 — `search_path` pinned on 20 functions (22 signatures)
- **Migration**: `20260320202000_w1_pin_search_path_on_functions.sql`
- All flagged functions now have `SET search_path = public, pg_catalog`
- 13 of 22 signatures were `SECURITY DEFINER` — critical fix for those

### W2 — Always-true write policies replaced with tenant-scoped checks
- **Migration**: `20260320203000_w2_tighten_always_true_write_policies.sql`
- **Pattern**: `EXISTS (SELECT 1 FROM id_team WHERE tenant_id = <row>.tenant_id AND user_id = auth.uid() AND status = 'ACTIVE')`
- FK columns verified via `information_schema.columns` before applying each policy
- 21 DROP + CREATE operations across 17 tables

---

## Intentional Residual WARNs (4 + 1)

| Table | Policy | Why kept |
|-------|--------|---------|
| `analytics_events` | INSERT `WITH CHECK (true)` — PUBLIC | Telemetry. Intentional open insert. |
| `analytics_sessions` | INSERT `WITH CHECK (true)` — PUBLIC | Telemetry. Intentional open insert. |
| `crm_member_documents` | INSERT/DELETE `USING (true)` | No `tenant_id` or owner column. Protected by Storage bucket policies + app layer. |
| Auth — leaked password protection | N/A | Free plan feature. Toggle hidden on dashboard. Skip. |

---

## ⚠️ Follow-up: Performance Advisor "Auth RLS Initialization Plan" Warnings

After W2, the **Performance Advisor** now flags all 15 tables with new membership-check policies for an `auth.uid()` initialization cost. This is a known Supabase optimization pattern:

**Problem**: `auth.uid()` in `USING`/`WITH CHECK` clauses is evaluated per-row.  
**Fix**: Replace `auth.uid()` with `(SELECT auth.uid())` — forces single evaluation per query.

This is **non-breaking** and purely a performance improvement. Tracked as follow-up **P-PERF-01** below.

---

## Follow-up Items

| ID | Item | Priority | Effort |
|----|------|----------|--------|
| P-PERF-01 | Replace `auth.uid()` → `(SELECT auth.uid())` in all W2 policies | Medium | 30 min — one migration |
| P-SCHEMA-01 | Add `tenant_id` column to `crm_member_documents` to eliminate last 2 WARNs | Low | 1 hr — schema migration + backfill |
| P-AUTH-01 | Enable leaked password protection when/if plan upgrades to Pro | Low | 5 min |
