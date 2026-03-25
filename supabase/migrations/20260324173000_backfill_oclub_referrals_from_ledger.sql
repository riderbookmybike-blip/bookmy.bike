-- Backfill missing oclub_referrals rows from existing referral ledger entries.
-- Safe + idempotent: inserts only missing lead_id rows, never mutates existing referrals.

WITH referral_ledger AS (
    SELECT DISTINCT ON (l.source_id)
        l.source_id AS lead_id,
        l.member_id AS referrer_member_id,
        cl.customer_id AS referred_member_id,
        GREATEST(l.delta, 0) AS reward_coins,
        CASE WHEN l.status = 'UNLOCKED' THEN 'UNLOCKED' ELSE 'LOCKED' END AS status,
        l.created_at
    FROM public.oclub_coin_ledger l
    JOIN public.crm_leads cl
      ON cl.id = l.source_id
    WHERE l.source_type = 'REFERRAL_LEAD'
      AND l.coin_type = 'REFERRAL'
      AND l.source_id IS NOT NULL
      AND COALESCE(l.delta, 0) > 0
    ORDER BY l.source_id, l.created_at ASC
),
missing_referrals AS (
    SELECT rl.*
    FROM referral_ledger rl
    LEFT JOIN public.oclub_referrals r
      ON r.lead_id = rl.lead_id
    WHERE r.id IS NULL
),
inserted AS (
    INSERT INTO public.oclub_referrals (
        lead_id,
        referrer_member_id,
        referred_member_id,
        reward_coins,
        status,
        created_at
    )
    SELECT
        lead_id,
        referrer_member_id,
        referred_member_id,
        reward_coins,
        status,
        created_at
    FROM missing_referrals
    RETURNING id, lead_id
)
SELECT COUNT(*) AS inserted_referrals FROM inserted;
