# Supabase Advisor Triage

**Date**: 2026-03-19  
**Project**: `aytdeqjxxjxbgiyslubx`  
**Baseline**: `v0.3.19-ci-green` + today's commits

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 ERROR | 2 | Schedule in next sprint |
| 🟡 WARN | 29 | Batch fix in one migration sprint |
| 🔵 INFO | 4 | Low priority, schedule later |

---

## 🔴 ERRORs — Fix Next Sprint

### E1: `v_share_actors` — Security Definer View
- **Risk**: View bypasses RLS of the querying user; uses view-creator's permissions instead
- **Fix**: Recreate view with `SECURITY INVOKER` (default) instead of `SECURITY DEFINER`
- **Owner**: Backend / DB
- **Effort**: 15 min
- **Ref**: [Supabase lint 0010](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

### E2: 6 tables — RLS disabled in public schema
Tables exposed to PostgREST with **no RLS** at all:

| Table | Risk |
|-------|------|
| `recompute_queue` | Internal queue — anon/authenticated users could read/mutate |
| `price_snapshot_sku` | Pricing data — full read by anon undesirable |
| `market_winner_price` | Pricing winner data |
| `market_winner_finance` | Finance winner data |
| `shadow_compare_log` | Shadow metrics |
| `winner_cache_invalidation_log` | Operational log |
| `sku_accessory_matrix` | Accessory pricing matrix |
| `shadow_metrics_hourly` | Analytics |
| `cat_service_packages` | Catalog service data |
| `cat_service_scope` | Catalog service data |
| `cat_service_entries` | Catalog service data |

- **Fix**: Enable RLS + add `USING (true)` public SELECT policy for read-only tables; add `service_role` bypass for queue/log tables
- **Owner**: Backend / DB
- **Effort**: 30 min migration
- **Ref**: [Supabase lint 0013](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

---

## 🟡 WARNs — Batch Fix (one migration sprint)

### W1: 20 functions — Mutable `search_path`
Functions without `SET search_path = public` — risk of search_path injection if schema is altered.

**Affected functions:**
`set_member_codes`, `crm_leads_set_updated_at`, `gen_sku_code_9`, `fn_leads_default_attribution`, `auto_generate_sku_code`, `fn_cpt_enqueue_price_snapshot`, `fn_cpd_enqueue_winner_price`, `fn_share_transition_guard`, `fn_fms_enqueue_winner_finance`, `fn_csk_enqueue_accessory_matrix`, `get_market_best_offers` (×2), `enqueue_recompute`, `fn_inv_stock_tat_sync`, `fn_inv_enqueue_winner_price`, `fn_audit_immutable`, `fn_share_status_audit`, `fn_cpd_enqueue_accessory_matrix_on_price_change`, `calc_emi`, `get_market_candidate_offers` (×2), `get_fin_winner`

- **Fix**: Add `SET search_path = public, pg_catalog;` to each `CREATE OR REPLACE FUNCTION` header
- **Owner**: Backend / DB
- **Effort**: 45 min (scripted ALTER FUNCTION)
- **Ref**: [Supabase lint 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

### W2: ~18 tables — Always-true RLS policies for write operations
Tables allowing unrestricted INSERT/UPDATE/DELETE via `WITH CHECK (true)` for `authenticated` role.

**High-risk tables (CRM/Finance data):**
- `crm_leads` — any authenticated user can insert leads to any tenant
- `crm_finance_assignments`, `crm_finance_events`, `crm_media`, `crm_member_documents`
- `dealer_finance_access`, `dealer_finance_schemes`, `dealer_finance_user_access`
- `inv_purchase_orders`, `inv_dealer_quotes`, `inv_po_payments`, `inv_request_items`, `inv_stock_ledger`
- `cat_ins_rules`, `cat_reg_rules`, `cat_regional_configs`, `cat_accessory_suitable_for`

**Safe / intentional always-true (keep as-is):**
- `analytics_events` + `analytics_sessions` INSERT — public telemetry, intended

- **Fix**: Narrow each policy to `auth.uid() IN (SELECT user_id FROM id_team WHERE tenant_id = <row>.tenant_id AND status = 'ACTIVE')` or equivalent membership check
- **Owner**: Backend / DB
- **Effort**: 1–2 hours (high-risk tables first)
- **Ref**: [Supabase lint 0024](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)

### W3: Auth — Leaked password protection disabled
- **Fix**: Enable in Supabase Dashboard → Auth → Settings → Leaked password protection
- **Owner**: Platform admin (5 min, no code change)
- **Ref**: [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## 🔵 INFOs — Low priority

### I1: 4 i18n / oclub tables — RLS enabled but no policies

| Table |
|-------|
| `i18n_languages` |
| `i18n_source_strings` |
| `i18n_sync_runs` |
| `i18n_translations` |
| `oclub_booking_coin_applies` |
| `oclub_redemption_requests` |
| `oclub_referrals` |
| `oclub_sponsor_agents` |
| `oclub_sponsor_allocations` |
| `oclub_sponsors` |

- **Status**: RLS enabled with no policy = table effectively inaccessible from client. Correct for internal-only tables accessed via `service_role` only.
- **Fix**: Add comment documenting intentional service_role-only access; OR add explicit public SELECT policy if needed
- **Owner**: Backend / DB
- **Priority**: Low

---

## Recommended Action Order

1. **W3** (Leaked password protection) — 5 min, dashboard click, do now
2. **E1** (`v_share_actors` SECURITY DEFINER) — 15 min, one migration
3. **E2** (RLS disabled tables) — 30 min migration
4. **W1** (mutable search_path functions) — 45 min scripted migration
5. **W2** (always-true RLS on CRM/Finance tables) — 1–2 hour sprint
6. **I1** (i18n/oclub no-policy tables) — document intent or add explicit policies
