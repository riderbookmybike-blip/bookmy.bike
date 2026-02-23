-- ==========================================================================
-- Migration: O' Circle Core Ledger + Referral + Sponsor Structures
-- Date: 2026-02-13
-- ==========================================================================

-- 1) Wallets
CREATE TABLE IF NOT EXISTS public.oclub_wallets (
    member_id UUID PRIMARY KEY REFERENCES public.id_members(id),
    available_system INTEGER NOT NULL DEFAULT 0,
    available_referral INTEGER NOT NULL DEFAULT 0,
    available_sponsored INTEGER NOT NULL DEFAULT 0,
    locked_referral INTEGER NOT NULL DEFAULT 0,
    pending_sponsored INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Ledger (append-only)
CREATE TABLE IF NOT EXISTS public.oclub_coin_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.id_members(id),
    coin_type TEXT NOT NULL CHECK (coin_type IN ('SYSTEM','REFERRAL','SPONSORED')),
    delta INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('AVAILABLE','LOCKED','PENDING_BACKED','UNLOCKED','REDEEM_HOLD','REDEEM_RELEASE','REDEEM_REVERT')),
    source_type TEXT NOT NULL,
    source_id UUID,
    sponsor_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oclub_ledger_member_time ON public.oclub_coin_ledger(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oclub_ledger_source ON public.oclub_coin_ledger(source_type, source_id);

-- 3) Referrals (one lead -> one referral)
CREATE TABLE IF NOT EXISTS public.oclub_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL UNIQUE REFERENCES public.crm_leads(id),
    referrer_member_id UUID NOT NULL REFERENCES public.id_members(id),
    referred_member_id UUID REFERENCES public.id_members(id),
    reward_coins INTEGER NOT NULL DEFAULT 13,
    status TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED','UNLOCKED','CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oclub_referrals_referrer ON public.oclub_referrals(referrer_member_id, created_at DESC);

-- 4) Sponsor structures (foundation)
CREATE TABLE IF NOT EXISTS public.oclub_sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
    name TEXT NOT NULL,
    billing_contact JSONB,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oclub_sponsor_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.oclub_sponsors(id),
    agent_id UUID NOT NULL REFERENCES public.id_members(id),
    is_primary BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_oclub_sponsor_agents_primary ON public.oclub_sponsor_agents(agent_id) WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS public.oclub_sponsor_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.oclub_sponsors(id),
    agent_id UUID NOT NULL REFERENCES public.id_members(id),
    coins INTEGER NOT NULL,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oclub_redemption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.crm_bookings(id),
    agent_id UUID NOT NULL REFERENCES public.id_members(id),
    sponsor_id UUID REFERENCES public.oclub_sponsors(id),
    coin_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
        CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED','PAID','EXPIRED')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejected_by UUID,
    rejected_at TIMESTAMPTZ,
    payment_ref TEXT,
    payment_confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.oclub_booking_coin_applies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.crm_bookings(id),
    coin_amount INTEGER NOT NULL,
    coin_type TEXT NOT NULL CHECK (coin_type IN ('SYSTEM','REFERRAL','SPONSORED')),
    sponsor_id UUID,
    status TEXT NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD','SETTLED','REVERTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) RLS
ALTER TABLE public.oclub_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_sponsor_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_sponsor_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oclub_booking_coin_applies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access oclub_wallets' AND tablename = 'oclub_wallets') THEN
    CREATE POLICY "Service role full access oclub_wallets" ON public.oclub_wallets FOR ALL
      USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Member read own wallet' AND tablename = 'oclub_wallets') THEN
    CREATE POLICY "Member read own wallet" ON public.oclub_wallets FOR SELECT TO authenticated
      USING (member_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access oclub_ledger' AND tablename = 'oclub_coin_ledger') THEN
    CREATE POLICY "Service role full access oclub_ledger" ON public.oclub_coin_ledger FOR ALL
      USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Member read own ledger' AND tablename = 'oclub_coin_ledger') THEN
    CREATE POLICY "Member read own ledger" ON public.oclub_coin_ledger FOR SELECT TO authenticated
      USING (member_id = auth.uid());
  END IF;
END $$;

-- 6) Helpers
CREATE OR REPLACE FUNCTION public.oclub_ensure_wallet(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.oclub_wallets(member_id)
    VALUES (p_member_id)
    ON CONFLICT (member_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.oclub_add_ledger(
    p_member_id uuid,
    p_coin_type text,
    p_delta integer,
    p_status text,
    p_source_type text,
    p_source_id uuid,
    p_sponsor_id uuid,
    p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    PERFORM public.oclub_ensure_wallet(p_member_id);

    INSERT INTO public.oclub_coin_ledger(
        member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
    ) VALUES (
        p_member_id, p_coin_type, p_delta, p_status, p_source_type, p_source_id, p_sponsor_id, p_metadata
    ) RETURNING id INTO v_id;

    IF p_coin_type = 'SYSTEM' AND p_status = 'AVAILABLE' THEN
        UPDATE public.oclub_wallets
        SET available_system = available_system + p_delta,
            lifetime_earned = lifetime_earned + GREATEST(p_delta, 0),
            updated_at = now()
        WHERE member_id = p_member_id;
    ELSIF p_coin_type = 'REFERRAL' AND p_status = 'LOCKED' THEN
        UPDATE public.oclub_wallets
        SET locked_referral = locked_referral + p_delta,
            lifetime_earned = lifetime_earned + GREATEST(p_delta, 0),
            updated_at = now()
        WHERE member_id = p_member_id;
    ELSIF p_coin_type = 'REFERRAL' AND p_status = 'AVAILABLE' THEN
        UPDATE public.oclub_wallets
        SET available_referral = available_referral + p_delta,
            lifetime_earned = lifetime_earned + GREATEST(p_delta, 0),
            updated_at = now()
        WHERE member_id = p_member_id;
    ELSIF p_coin_type = 'SPONSORED' AND p_status = 'PENDING_BACKED' THEN
        UPDATE public.oclub_wallets
        SET pending_sponsored = pending_sponsored + p_delta,
            lifetime_earned = lifetime_earned + GREATEST(p_delta, 0),
            updated_at = now()
        WHERE member_id = p_member_id;
    END IF;

    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.oclub_credit_signup(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.oclub_coin_ledger
        WHERE member_id = p_member_id AND source_type = 'SIGNUP'
    ) INTO v_exists;

    IF v_exists THEN
        RETURN;
    END IF;

    PERFORM public.oclub_add_ledger(
        p_member_id,
        'SYSTEM',
        13,
        'AVAILABLE',
        'SIGNUP',
        NULL,
        NULL,
        jsonb_build_object('reason','signup_bonus')
    );
END;
$$;

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
    SELECT EXISTS(
        SELECT 1 FROM public.oclub_referrals WHERE lead_id = p_lead_id
    ) INTO v_exists;

    IF v_exists THEN
        RETURN;
    END IF;

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

CREATE OR REPLACE FUNCTION public.oclub_unlock_referral(
    p_referral_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer uuid;
    v_coins integer;
BEGIN
    SELECT referrer_member_id, reward_coins
    INTO v_referrer, v_coins
    FROM public.oclub_referrals
    WHERE id = p_referral_id AND status = 'LOCKED'
    LIMIT 1;

    IF v_referrer IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.oclub_referrals
    SET status = 'UNLOCKED', unlocked_at = now()
    WHERE id = p_referral_id;

    UPDATE public.oclub_wallets
    SET locked_referral = GREATEST(locked_referral - v_coins, 0),
        available_referral = available_referral + v_coins,
        updated_at = now()
    WHERE member_id = v_referrer;

    INSERT INTO public.oclub_coin_ledger(
        member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
    ) VALUES (
        v_referrer, 'REFERRAL', 0, 'UNLOCKED', 'REFERRAL_UNLOCK', p_referral_id, NULL,
        jsonb_build_object('referral_id', p_referral_id)
    );
END;
$$;

-- 7) Unlock trigger on booking update (registration assigned + delivered)
CREATE OR REPLACE FUNCTION public.oclub_unlock_referral_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead_id uuid;
    v_referral_id uuid;
BEGIN
    IF NEW.registration_number IS NOT NULL
       AND (NEW.delivery_status = 'DELIVERED' OR NEW.status = 'DELIVERED') THEN
        -- Only fire when condition transitions to true
        IF (OLD.registration_number IS NULL OR (OLD.delivery_status IS DISTINCT FROM 'DELIVERED' AND OLD.status IS DISTINCT FROM 'DELIVERED')) THEN
            SELECT q.lead_id INTO v_lead_id
            FROM public.crm_quotes q
            WHERE q.id = NEW.quote_id
            LIMIT 1;

            IF v_lead_id IS NOT NULL THEN
                SELECT r.id INTO v_referral_id
                FROM public.oclub_referrals r
                WHERE r.lead_id = v_lead_id AND r.status = 'LOCKED'
                LIMIT 1;

                IF v_referral_id IS NOT NULL THEN
                    PERFORM public.oclub_unlock_referral(v_referral_id);
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_oclub_unlock_referral ON public.crm_bookings;
CREATE TRIGGER trg_oclub_unlock_referral
AFTER UPDATE OF registration_number, delivery_status, status ON public.crm_bookings
FOR EACH ROW EXECUTE FUNCTION public.oclub_unlock_referral_on_booking();
