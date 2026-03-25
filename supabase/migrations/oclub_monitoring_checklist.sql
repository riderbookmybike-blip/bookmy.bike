-- ==========================================================================
-- Operations: O-Club Verification & Diagnostics Checklist
-- Date: 2026-03-24
-- ==========================================================================

/* 
======================================================
✅ CHECK 1: Function Behavior Smoke Test
======================================================
Run 1 end-to-end referral flow practically via the UI:
1. Open Incognito window. Fill out a public marketplace lead with a referrer code.
2. Sign up with that newly generated lead cell number.
3. Validate: Wait 5 seconds, query `oclub_coin_ledger` via Dashboard:
   - Does User B have `SIGNUP` (13 coins, SYSTEM/AVAILABLE, 3 day expiry)?
   - Does User A have `REFERRAL_LEAD` (13 coins, REFERRAL/LOCKED, no expiry)?
4. Final validation: Push quote -> Create booking -> Set Operational Stage to DELIVERED with Registration Number.
   - Run: SELECT id, status FROM oclub_referrals WHERE referrer_member_id = [User A UUID];
   - Verify: Status should shift to `UNLOCKED`.


======================================================
✅ CHECK 2: Observability Guard (Supabase Alert Pipeline)
======================================================
Since we removed the `audit_log` insert on exception (as it gets rolled back), 
the fail-fast `RAISE EXCEPTION` natively emits a PostgreSQL error log.

Go to Supabase Dashboard -> Logs -> Logs Explorer, and save this query:

SELECT
  timestamp,
  event_message
FROM postgres_logs
WHERE error_severity = 'ERROR' 
  AND event_message ILIKE '%Cannot credit referral: Lead ID%'
ORDER BY timestamp DESC
LIMIT 50;

**Action Required**: Save this as an Alert in Supabase Log Alerts:
- Condition: count > 0 in the last 15 minutes.
- Notification: Send to your team's Slack/Discord or email webhook to instantly detect orphan risks.


======================================================
✅ CHECK 3: Data Hygiene Diagnostic (Daily Cron Query)
======================================================
Use this SQL as a daily reconciliation sanity-check or in an internal admin view:
*/

WITH ledger_locked AS (
    SELECT count(*) as total FROM public.oclub_coin_ledger 
    WHERE source_type = 'REFERRAL_LEAD' AND coin_type = 'REFERRAL' AND status = 'LOCKED'
),
referral_primary AS (
    SELECT count(*) as total FROM public.oclub_referrals WHERE status = 'LOCKED'
),
referral_orphan AS (
    SELECT count(*) as total FROM public.oclub_orphan_referrals WHERE status = 'LOCKED'
)
SELECT 
    l.total as ledger_locked_count,
    (p.total + o.total) as combined_referrals_locked,
    l.total - (p.total + o.total) as strict_mismatch_deficit
FROM ledger_locked l
CROSS JOIN referral_primary p
CROSS JOIN referral_orphan o;

-- Daily trend report for active orphaned referral accumulation
SELECT 
    date_trunc('day', created_at) as tracking_date,
    count(*) as new_orphans_parked
FROM public.oclub_orphan_referrals
WHERE status = 'LOCKED'
GROUP BY 1
ORDER BY 1 DESC;

-- Integrity check: orphan rows marked UNLOCKED should always have a matching REFERRAL_UNLOCK ledger journal.
SELECT
    o.id AS orphan_referral_id,
    o.lead_id,
    o.referrer_member_id,
    o.unlocked_at
FROM public.oclub_orphan_referrals o
LEFT JOIN public.oclub_coin_ledger l
  ON l.source_type = 'REFERRAL_UNLOCK'
 AND l.coin_type = 'REFERRAL'
 AND l.status = 'UNLOCKED'
 AND l.source_id = o.id
WHERE o.status = 'UNLOCKED'
  AND l.id IS NULL
ORDER BY o.unlocked_at DESC NULLS LAST;

/*
======================================================
✅ CHECK 4: Daily KPI Dashboard Tile Query
======================================================
Returns a single row with all critical O-Club health metrics for easy dashboarding.
*/
SELECT 
    (SELECT count(*) FROM public.oclub_orphan_referrals) AS total_parked_orphans,
    (SELECT count(*) FROM public.oclub_orphan_referrals WHERE status = 'LOCKED') AS active_locked_orphans,
    (SELECT count(*) FROM public.oclub_orphan_referrals WHERE status = 'UNLOCKED') AS successfully_unlocked_orphans,
    (SELECT count(*) FROM public.oclub_referrals WHERE status = 'LOCKED') AS active_locked_primary_referrals,
    (SELECT count(*) FROM public.oclub_referrals WHERE status = 'UNLOCKED') AS successfully_unlocked_primary,
    (
        SELECT count(*) 
        FROM public.oclub_orphan_referrals o
        LEFT JOIN public.oclub_coin_ledger l 
          ON l.source_id = o.id 
         AND l.source_type = 'REFERRAL_UNLOCK' 
         AND l.coin_type = 'REFERRAL' 
         AND l.status = 'UNLOCKED'
        WHERE o.status = 'UNLOCKED' 
          AND l.id IS NULL
    ) AS missing_journal_integrity_errors;
