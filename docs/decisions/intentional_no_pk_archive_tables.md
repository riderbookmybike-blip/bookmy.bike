# Intentional No-PK Tables — Archive Schema

**Date noted**: 2026-03-19  
**Advisor**: `no_primary_key` (performance INFO)  
**Decision**: Suppress / intentional — no action required

---

## `sys_archived` schema (16 tables)

All tables in this schema are **point-in-time backup snapshots**, created 2026-02-21 via a timestamped backup script. They are:

- Read-only reference copies (never mutated post-creation)
- Named with `_bkp_YYYYMMDD_HHMMSS` suffix pattern
- Not exposed to PostgREST (separate schema, no grants)
- No joins or FK relationships to public schema

**No PK required.** Adding a surrogate PK would waste storage and provide no query benefit since these tables are never updated or joined.

| Table | Columns |
|-------|---------|
| `crm_audit_log_bkp_20260221_202023` | 11 |
| `crm_bookings_bkp_20260221_202023` | 44 |
| `crm_leads_bkp_20260221_202023` | 35 |
| `crm_quotes_bkp_20260221_202023` | 43 |
| `crm_receipts_bkp_20260221_202023` | 20 |
| `id_documents_bkp_20260221_202023` | 13 |
| `id_member_addresses_bkp_20260221_202023` | 12 |
| `id_member_assets_bkp_20260221_202023` | 10 |
| `id_member_contacts_bkp_20260221_202023` | 8 |
| `id_member_events_bkp_20260221_202023` | 7 |
| `id_member_spins_bkp_20260221_202023` | 15 |
| `id_member_tenants_bkp_20260221_202023` | 7 |
| `id_members_bkp_20260221_202023` | 62 |
| `oclub_coin_ledger_bkp_20260221_202023` | 10 |
| `oclub_referrals_bkp_20260221_202023` | 8 |
| `oclub_wallets_bkp_20260221_202023` | 9 |

---

## `public.cat_item_hierarchy_archive` (2 columns)

**Assessment**: 2-column table, likely a migration artifact or append-only log.  
**Decision**: If actively queried or joined, add a surrogate `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`. If read-only archive with no joins, treat same as `sys_archived` — intentional.

**Action**: Verify in next schema audit whether it is actively queried. If yes, add PK via migration. If no, document as intentional and suppress.

---

## Suppression Rationale

The `no_primary_key` advisor lint is a best-practice warning, not a security or correctness issue. For backup/snapshot tables that are:
- Never mutated post-creation
- Never joined or FK-referenced
- Not exposed to client queries

…the overhead of a PK outweighs any benefit. This is a documented intentional exception.
