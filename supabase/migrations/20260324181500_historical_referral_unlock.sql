-- ==========================================================================
-- Migration: One-time Reconciliation for Historical Delivered Bookings
-- Purpose: Unlock O-Club referrals for bookings that were delivered before 
--          the fallback trigger was implemented.
-- Date: 2026-03-24
-- ==========================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT
            q.lead_id
        FROM public.crm_bookings b
        JOIN public.crm_quotes q ON q.id = b.quote_id
        -- Ensure we only match delivered bookings
        WHERE (b.operational_stage::text = 'DELIVERED' OR b.status = 'DELIVERED')
          AND b.registration_number IS NOT NULL
          AND q.lead_id IS NOT NULL
    LOOP
        -- 1. Try standard referral unlock
        IF EXISTS (
            SELECT 1 FROM public.oclub_referrals 
            WHERE lead_id = r.lead_id AND status = 'LOCKED'
        ) THEN
            PERFORM public.oclub_unlock_referral(
                (SELECT id FROM public.oclub_referrals WHERE lead_id = r.lead_id AND status = 'LOCKED' LIMIT 1)
            );
            
        -- 2. Fallback to orphan unlock
        ELSIF EXISTS (
            SELECT 1 FROM public.oclub_orphan_referrals 
            WHERE lead_id = r.lead_id AND status = 'LOCKED'
        ) THEN
            PERFORM public.oclub_unlock_orphan_referral(r.lead_id);
            
        END IF;
    END LOOP;
END $$;
