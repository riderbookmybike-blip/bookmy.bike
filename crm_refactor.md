# CRM Refactor Plan (v3 — Corrected + Approved)

## Decision Summary
1. Preserve identity data only: `id_members` and related identity tables.
2. Treat current CRM data as non-critical (optional audit export only).
3. Rebuild CRM with strict lifecycle controls and event audit from day 1.
4. **Zero JSONB** in all CRM tables. Only exception: `id_members.preferences`.
5. External API responses: store as `TEXT`, not JSONB.

## Stage Flow (Actual Enum — `crm_operational_stage`)

```
QUOTE(1) → BOOKING(2) → PAYMENT(2.5) → FINANCE(2.75) → ALLOTMENT(3) → PDI(4) → INSURANCE(4.5) → REGISTRATION(4.75) → COMPLIANCE(5) → DELIVERY(5.5) → DELIVERED(6) → FEEDBACK(7)
```

Cash path skips FINANCE: `BOOKING → PAYMENT → ALLOTMENT → ...`
Loan path: `BOOKING → PAYMENT → FINANCE → ALLOTMENT → ...`

## Table Decisions (22 → 20)

| Action | Count | Tables |
|--------|-------|--------|
| **ALTER** | 10 | leads, quotes, bookings, allotments, pdi, insurance, registration, finance→finance_apps, payments, lead_events |
| **KEEP** | 6 | booking_stage_events, tasks, member_documents, dealer_shares, finance_assignments, quote_finance_attempts |
| **DROP** | 5 | receipts (after merge), bank_apps, assets, lead_assets, booking_assets |
| **ARCHIVE→DROP** | 1 | audit_log |
| **NEW** | 4 | quote_events, finance_events, feedback, media |

## Event Table Columns (Actual Schema)

**`crm_booking_stage_events`:** `id`, `booking_id`, `from_stage`, `to_stage`, `changed_by`, `changed_at`, `reason`
**`crm_lead_events`:** `id`, `lead_id`, `event_type`, `actor_tenant_id`, `actor_user_id`, `payload` (JSONB → ALTER to `notes TEXT` + `changed_value TEXT`)

**New `crm_quote_events`:** `id`, `quote_id`, `event_type`, `actor_tenant_id`, `actor_user_id`, `notes`, `created_at`
**New `crm_finance_events`:** `id`, `finance_app_id`, `event_type`, `actor_tenant_id`, `actor_user_id`, `notes`, `milestone`, `created_at`

## Receipts → Payments Cutover Sequence

```
Step 1: Backfill — INSERT INTO crm_payments SELECT * FROM crm_receipts (identical 20-col schema)
Step 2: Verify — SELECT COUNT(*) match
Step 3: Dual-read view — CREATE VIEW crm_receipts_v AS SELECT * FROM crm_payments
Step 4: Code switch — All actions read/write crm_payments only
Step 5: DROP crm_receipts
```

## Work Split

| Owner | Phase | Days |
|-------|-------|------|
| 🤖 Antigravity | 0: Backup + 1: Schema + 2: Guardrails | 3 |
| 🧠 Codex | 3: Server Actions + 4: UI | 3.5 |
| 🤖+🧠 Both | 5: Smoke | 1 |
| **Total** | | **~7 days** |

## Guardrail Rules

| To Stage | Required Proof |
|----------|---------------|
| PAYMENT | Booking exists, status = BOOKED |
| FINANCE | `crm_finance_apps` row exists |
| ALLOTMENT | `crm_allotments` with `inv_stock_id` |
| PDI | `crm_allotments` with HARD_LOCK |
| INSURANCE | `crm_pdi` with PASSED |
| REGISTRATION | `crm_insurance` with ACTIVE |
| COMPLIANCE | `crm_registration` with COMPLETED |
| DELIVERY | Full payment in `crm_payments` |
| DELIVERED | Handover confirmed |
| FEEDBACK | `crm_feedback` row exists |

## Measurable Benchmarks

| Metric | Before | Target | SQL |
|--------|--------|--------|-----|
| JSONB cols in CRM | 22 | **0** | `SELECT COUNT(*) FROM information_schema.columns WHERE data_type='jsonb' AND table_name LIKE 'crm_%'` |
| Booking cols | 44 | **≤28** | `SELECT COUNT(*) ... WHERE table_name='crm_bookings'` |
| Stage events after smoke | ~1 | **≥12** | `SELECT COUNT(*) FROM crm_booking_stage_events` |
| Pipeline query (10 rows) | baseline | **<15ms** | `EXPLAIN ANALYZE` |
| Invalid jump blocked | 0 | **100%** | Try BOOKING→DELIVERED — must fail |

## Rollback Plan

| Trigger | Action |
|---------|--------|
| Migration fails | Restore from Phase 0 JSON backup + schema snapshot |
| Build fails | `git checkout` to pre-migration branch |
| Data lost | Restore from crm_receipts JSON backup |
| Full rollback | Reverse migration SQL (generated Phase 0) |
