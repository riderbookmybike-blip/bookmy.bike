-- ==========================================================================
-- Migration: O' Circle Redemption Flow (Sponsored + System/Referral)
-- Date: 2026-02-13
-- ==========================================================================

-- Apply O' Circle coins to a booking (system/referral settle immediately, sponsored held)
CREATE OR REPLACE FUNCTION public.oclub_apply_booking_coins(
    p_booking_id uuid,
    p_member_id uuid,
    p_system_coins integer,
    p_referral_coins integer,
    p_sponsored_coins integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet public.oclub_wallets%rowtype;
    v_sponsor_id uuid;
    v_request_id uuid;
BEGIN
    PERFORM public.oclub_ensure_wallet(p_member_id);

    SELECT * INTO v_wallet
    FROM public.oclub_wallets
    WHERE member_id = p_member_id
    FOR UPDATE;

    IF p_system_coins < 0 OR p_referral_coins < 0 OR p_sponsored_coins < 0 THEN
        RAISE EXCEPTION 'coin amounts must be non-negative';
    END IF;

    IF p_system_coins > v_wallet.available_system THEN
        RAISE EXCEPTION 'insufficient system coins';
    END IF;

    IF p_referral_coins > v_wallet.available_referral THEN
        RAISE EXCEPTION 'insufficient referral coins';
    END IF;

    IF p_sponsored_coins > v_wallet.pending_sponsored THEN
        RAISE EXCEPTION 'insufficient sponsored coins';
    END IF;

    -- System coins: settle immediately
    IF p_system_coins > 0 THEN
        INSERT INTO public.oclub_booking_coin_applies(booking_id, coin_amount, coin_type, status)
        VALUES (p_booking_id, p_system_coins, 'SYSTEM', 'SETTLED');

        INSERT INTO public.oclub_coin_ledger(
            member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
        ) VALUES (
            p_member_id, 'SYSTEM', -p_system_coins, 'REDEEM_RELEASE', 'BOOKING', p_booking_id, NULL,
            jsonb_build_object('booking_id', p_booking_id)
        );

        UPDATE public.oclub_wallets
        SET available_system = available_system - p_system_coins,
            lifetime_redeemed = lifetime_redeemed + p_system_coins,
            updated_at = now()
        WHERE member_id = p_member_id;
    END IF;

    -- Referral coins: settle immediately
    IF p_referral_coins > 0 THEN
        INSERT INTO public.oclub_booking_coin_applies(booking_id, coin_amount, coin_type, status)
        VALUES (p_booking_id, p_referral_coins, 'REFERRAL', 'SETTLED');

        INSERT INTO public.oclub_coin_ledger(
            member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
        ) VALUES (
            p_member_id, 'REFERRAL', -p_referral_coins, 'REDEEM_RELEASE', 'BOOKING', p_booking_id, NULL,
            jsonb_build_object('booking_id', p_booking_id)
        );

        UPDATE public.oclub_wallets
        SET available_referral = available_referral - p_referral_coins,
            lifetime_redeemed = lifetime_redeemed + p_referral_coins,
            updated_at = now()
        WHERE member_id = p_member_id;
    END IF;

    -- Sponsored coins: hold + create redemption request
    IF p_sponsored_coins > 0 THEN
        SELECT sponsor_id
        INTO v_sponsor_id
        FROM public.oclub_sponsor_agents
        WHERE agent_id = p_member_id AND is_primary = true AND status = 'ACTIVE'
        LIMIT 1;

        IF v_sponsor_id IS NULL THEN
            RAISE EXCEPTION 'no active sponsor for agent';
        END IF;

        INSERT INTO public.oclub_booking_coin_applies(booking_id, coin_amount, coin_type, sponsor_id, status)
        VALUES (p_booking_id, p_sponsored_coins, 'SPONSORED', v_sponsor_id, 'HELD');

        INSERT INTO public.oclub_coin_ledger(
            member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
        ) VALUES (
            p_member_id, 'SPONSORED', -p_sponsored_coins, 'REDEEM_HOLD', 'BOOKING', p_booking_id, v_sponsor_id,
            jsonb_build_object('booking_id', p_booking_id)
        );

        UPDATE public.oclub_wallets
        SET pending_sponsored = pending_sponsored - p_sponsored_coins,
            updated_at = now()
        WHERE member_id = p_member_id;

        INSERT INTO public.oclub_redemption_requests(booking_id, agent_id, sponsor_id, coin_amount, status)
        VALUES (p_booking_id, p_member_id, v_sponsor_id, p_sponsored_coins, 'PENDING_APPROVAL')
        RETURNING id INTO v_request_id;

        UPDATE public.crm_bookings
        SET status = 'PENDING_CORPORATE',
            payment_status = 'PENDING_CORPORATE',
            updated_at = now()
        WHERE id = p_booking_id;
    END IF;

    RETURN v_request_id;
END;
$$;

-- Approve sponsored redemption (status only)
CREATE OR REPLACE FUNCTION public.oclub_approve_redemption(
    p_request_id uuid,
    p_approved_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id uuid;
BEGIN
    SELECT booking_id INTO v_booking_id
    FROM public.oclub_redemption_requests
    WHERE id = p_request_id
    FOR UPDATE;

    UPDATE public.oclub_redemption_requests
    SET status = 'APPROVED',
        approved_by = p_approved_by,
        approved_at = now()
    WHERE id = p_request_id;

    IF v_booking_id IS NOT NULL THEN
        UPDATE public.crm_bookings
        SET payment_status = 'PENDING_CORPORATE_PAYMENT',
            updated_at = now()
        WHERE id = v_booking_id;
    END IF;
END;
$$;

-- Reject sponsored redemption (revert coins + booking)
CREATE OR REPLACE FUNCTION public.oclub_reject_redemption(
    p_request_id uuid,
    p_rejected_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id uuid;
    v_agent_id uuid;
    v_sponsor_id uuid;
    v_coins integer;
BEGIN
    SELECT booking_id, agent_id, sponsor_id, coin_amount
    INTO v_booking_id, v_agent_id, v_sponsor_id, v_coins
    FROM public.oclub_redemption_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_booking_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.oclub_redemption_requests
    SET status = 'REJECTED',
        rejected_by = p_rejected_by,
        rejected_at = now()
    WHERE id = p_request_id;

    UPDATE public.oclub_booking_coin_applies
    SET status = 'REVERTED'
    WHERE booking_id = v_booking_id
      AND coin_type = 'SPONSORED'
      AND status = 'HELD';

    UPDATE public.oclub_wallets
    SET pending_sponsored = pending_sponsored + v_coins,
        updated_at = now()
    WHERE member_id = v_agent_id;

    INSERT INTO public.oclub_coin_ledger(
        member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
    ) VALUES (
        v_agent_id, 'SPONSORED', v_coins, 'REDEEM_REVERT', 'REDEMPTION_REJECT', p_request_id, v_sponsor_id,
        jsonb_build_object('booking_id', v_booking_id)
    );

    UPDATE public.crm_bookings
    SET status = 'BOOKED',
        payment_status = 'REVERTED',
        updated_at = now()
    WHERE id = v_booking_id;
END;
$$;

-- Confirm sponsored redemption payment (settle + booking)
CREATE OR REPLACE FUNCTION public.oclub_confirm_redemption_paid(
    p_request_id uuid,
    p_payment_ref text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id uuid;
    v_agent_id uuid;
    v_sponsor_id uuid;
    v_coins integer;
BEGIN
    SELECT booking_id, agent_id, sponsor_id, coin_amount
    INTO v_booking_id, v_agent_id, v_sponsor_id, v_coins
    FROM public.oclub_redemption_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_booking_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.oclub_redemption_requests
    SET status = 'PAID',
        payment_ref = p_payment_ref,
        payment_confirmed_at = now()
    WHERE id = p_request_id;

    UPDATE public.oclub_booking_coin_applies
    SET status = 'SETTLED'
    WHERE booking_id = v_booking_id
      AND coin_type = 'SPONSORED'
      AND status = 'HELD';

    UPDATE public.oclub_wallets
    SET lifetime_redeemed = lifetime_redeemed + v_coins,
        updated_at = now()
    WHERE member_id = v_agent_id;

    INSERT INTO public.oclub_coin_ledger(
        member_id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata
    ) VALUES (
        v_agent_id, 'SPONSORED', 0, 'REDEEM_RELEASE', 'REDEMPTION_PAID', p_request_id, v_sponsor_id,
        jsonb_build_object('booking_id', v_booking_id)
    );

    UPDATE public.crm_bookings
    SET status = 'BOOKED',
        payment_status = 'SPONSORED_PAID',
        updated_at = now()
    WHERE id = v_booking_id;
END;
$$;
