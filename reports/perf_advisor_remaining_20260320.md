# Performance Advisor — Remaining WARNs

**Date**: 2026-03-19  
**Type**: `multiple_permissive_policies` (lint 0017)  
**Total remaining**: 40 WARNs across 17 tables  
**Baseline commit**: `a80c605f`

> These are the warnings left after this session's batch consolidation (92→40).
> Parked for next sprint. Split into two batches below by risk level.

---

## Batch 1 — Low-risk: Catalog + Public-read tables (Recommended first)

These tables serve public/anonymous reads. Consolidating their SELECT overlap is low risk.

| Table | WARNs | Actions affected | Notes |
|-------|-------|-----------------|-------|
| `cat_assets` | 1 | `SELECT` (authenticated) | Write-only policy was added; SELECT still has 2 permissive paths |
| `cat_brands` | 5 | `SELECT` (anon, authenticated, authenticator, cli_login_postgres, dashboard_user) | `Admin write cat brands` ALL still overlaps SELECT for some system roles |
| `cat_hsn_codes` | 5 | `SELECT` (same 5 system roles) | Same pattern as cat_brands — ALL overlaps system-role SELECT |
| `cat_price_dealer` | 1 | `SELECT` (authenticated) | `Tenant owner write cat price dealer` ALL still creates SELECT overlap |
| `cat_raw_items` | 1 | `SELECT` (authenticated) | Needs audit — likely has a public SELECT + admin ALL |
| `loc_pincodes` | 5 | `SELECT` (same 5 system roles) | `Marketplace admin write pincodes` ALL overlaps system-role SELECT |
| `id_primary_dealer_districts` | 5 | `SELECT` (same 5 system roles) | `Primary dealer mapping write by owner or super admin` ALL overlaps |
| `sys_dashboard_templates` | 1 | `SELECT` (authenticated) | Admin ALL + public SELECT overlap |
| `sys_role_templates` | 1 | `SELECT` (authenticated) | Same pattern |

**Subtotal**: 25 WARNs across 9 tables

**Root cause**: When an `ALL` policy is added alongside a `SELECT` policy for the same table,
every Postgres role (anon, authenticated, authenticator, dashboard_user, cli_login_postgres)
that matches both policies triggers a new warning. The fix is to ensure `ALL` policies
are **not** evaluated for reads (restrict to FOR INSERT/UPDATE/DELETE).

---

## Batch 2 — Higher-risk: CRM + Tenant-sensitive tables (Smoke test after each)

These tables hold CRM and identity data. Policy consolidation requires verification.

| Table | WARNs | Actions affected | Notes |
|-------|-------|-----------------|-------|
| `crm_lead_events` | 6 | `SELECT` (5 system roles) + `INSERT` (authenticated) | `Marketplace admin full access` ALL overlaps SELECT + INSERT |
| `crm_member_documents` | 3 | INSERT, DELETE, SELECT (authenticated) | Added broad INSERT/DELETE + existing SELECT policy = 3 overlaps |
| `dealer_brands` | 1 | `SELECT` (authenticated) | Admin ALL + public SELECT overlap |
| `id_dealer_service_areas` | 1 | `SELECT` (authenticated) | Write-by-owner ALL + public read |
| `id_locations` | 1 | `SELECT` (authenticated) | Same pattern |
| `id_operating_hours` | 1 | `SELECT` (authenticated) | Same pattern |
| `id_team` | 1 | `SELECT` (authenticated) | Subset policy drop didn't fully resolve — may still have 2 SELECT policies |
| `id_tenants` | 1 | `SELECT` (authenticated) | Admin ALL + tenant SELECT overlap |

**Subtotal**: 15 WARNs across 8 tables

---

## Pattern Analysis

**Root cause of 90%+ of remaining warnings**:

Any table with **`FOR ALL` + `FOR SELECT`** creates overlap for every Postgres system role
(`anon`, `authenticated`, `authenticator`, `dashboard_user`, `cli_login_postgres`).

**Scalable fix for Batch 1** (safe, mechanical):
- Replace `FOR ALL` admin policies with explicit `FOR INSERT`, `FOR UPDATE`, `FOR DELETE` commands
- This stops the ALL policy from being evaluated during SELECT queries
- Public `FOR SELECT USING (true)` policies can remain as a single rule

**Recommended next sprint order**:
1. Batch 1 — Replace all `FOR ALL` on public/catalog tables with explicit write commands
2. Smoke: run advisor, expect ~25 WARNs cleared
3. Batch 2 — CRM/identity tables with same pattern + SELECT-only merged policies
4. Smoke: full CRM read regression check

---

## Appendix: Remaining 40 Warn Detail (raw)

```
cat_assets          × 1  SELECT[authenticated]
cat_brands          × 5  SELECT[anon,authenticated,authenticator,cli_login_postgres,dashboard_user]
cat_hsn_codes       × 5  SELECT[anon,authenticated,authenticator,cli_login_postgres,dashboard_user]
cat_price_dealer    × 1  SELECT[authenticated]
cat_raw_items       × 1  SELECT[authenticated]
crm_lead_events     × 6  SELECT[anon,authenticated,authenticator,cli_login_postgres,dashboard_user] + INSERT[authenticated]
crm_member_documents× 3  INSERT[authenticated] + DELETE[authenticated] + SELECT[authenticated]
dealer_brands       × 1  SELECT[authenticated]
id_dealer_service_areas × 1  SELECT[authenticated]
id_locations        × 1  SELECT[authenticated]
id_operating_hours  × 1  SELECT[authenticated]
id_primary_dealer_districts × 5  SELECT[anon,authenticated,authenticator,cli_login_postgres,dashboard_user]
id_team             × 1  SELECT[authenticated]
id_tenants          × 1  SELECT[authenticated]
loc_pincodes        × 5  SELECT[anon,authenticated,authenticator,cli_login_postgres,dashboard_user]
sys_dashboard_templates × 1  SELECT[authenticated]
sys_role_templates  × 1  SELECT[authenticated]
```
