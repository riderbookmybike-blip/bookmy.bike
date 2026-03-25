-- ==========================================================================
-- Migration: Clean up test phase orphans and add fail-fast guardrail for Referrals
-- Purpose: Since O-Circle is in testing, we purge orphaned testing data 
--          and ensure future production leads won't orphan. Hard deletes on leads
--          (which cause orphans) only happen via manual DB wipe in staging.
-- Date: 2026-03-24
-- ==========================================================================

-- 1) Deduct the artificially inflated locked balances & lifetime earnings from wallets
UPDATE public.oclub_wallets w
SET locked_referral = GREATEST(w.locked_referral - o.sum_delta, 0),
    lifetime_earned = GREATEST(w.lifetime_earned - o.sum_delta, 0),
    updated_at = now()
FROM (
    SELECT member_id, SUM(delta) as sum_delta
    FROM public.oclub_coin_ledger
    WHERE source_type = 'REFERRAL_LEAD' 
      AND coin_type = 'REFERRAL'
      AND status = 'LOCKED'
      AND NOT EXISTS (
          SELECT 1 FROM public.oclub_referrals r WHERE r.lead_id = public.oclub_coin_ledger.source_id
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.crm_leads c WHERE c.id = public.oclub_coin_ledger.source_id
      )
    GROUP BY member_id
) o
WHERE w.member_id = o.member_id;

-- 2) Clean up the 32 test phase orphans from oclub_coin_ledger
DELETE FROM public.oclub_coin_ledger
WHERE source_type = 'REFERRAL_LEAD' 
  AND coin_type = 'REFERRAL'
  AND status = 'LOCKED'
  AND NOT EXISTS (
      SELECT 1 FROM public.oclub_referrals r WHERE r.lead_id = public.oclub_coin_ledger.source_id
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.crm_leads c WHERE c.id = public.oclub_coin_ledger.source_id
  );

-- 3) Strict System Guardrail (Fail Fast on new entries without valid leads)
-- This guarantees future leads (which use soft-delete `is_deleted = true` in Prod)
-- will NEVER arrive here without a valid row in `crm_leads`.
CREATE OR REPLACE FUNCTION public.oclub_credit_referral(
    p_referrer_id uuid,
    p_lead_id uuid,
    p_referred_member_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exists boolean;
BEGIN
    -- 🛡️ Fail Fast Validation to prevent future Orphans entirely!
    IF NOT EXISTS(SELECT 1 FROM public.crm_leads WHERE id = p_lead_id) THEN
        
        -- NOTE: logging row inserts are rolled back on exception in the same tx,
        -- so we raise a strict exception here for fail-fast behavior.
        RAISE EXCEPTION 'Cannot credit referral: Lead ID % does not exist in crm_leads. Halting transaction.', p_lead_id;
    END IF;

    -- Proceed matching exact core baseline
    SELECT EXISTS(
        SELECT 1 FROM public.oclub_referrals WHERE lead_id = p_lead_id
    ) INTO v_exists;

    IF v_exists THEN
        RETURN;
    END IF;

    -- Store standard linkage perfectly aligned with integrity mapping
    INSERT INTO public.oclub_referrals(lead_id, referrer_member_id, referred_member_id, reward_coins, status)
    VALUES (p_lead_id, p_referrer_id, p_referred_member_id, 13, 'LOCKED');

    PERFORM public.oclub_add_ledger(
        p_referrer_id,
        'REFERRAL',
        13,
        'LOCKED',
        'REFERRAL_LEAD',
        p_lead_id,
        NULL,
        jsonb_build_object('referral_lead', p_lead_id)
    );
END;
$$;
