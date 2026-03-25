-- ==========================================================================
-- Migration: One-time Reconciliation for Historical Delivered Bookings
-- Purpose: Unlock O-Club referrals for bookings that were delivered before 
--          the fallback trigger was implemented.
-- Date: 2026-03-24
-- ==========================================================================

DO $$
DECLARE
    r RECORD;
    has_operational_stage BOOLEAN;
    has_status BOOLEAN;
    has_registration_number BOOLEAN;
    sql_query TEXT;
BEGIN
    IF to_regclass('public.crm_bookings') IS NULL
       OR to_regclass('public.crm_quotes') IS NULL
       OR to_regclass('public.oclub_referrals') IS NULL
       OR to_regclass('public.oclub_orphan_referrals') IS NULL THEN
        RAISE NOTICE 'Skipping historical referral unlock: required tables not found';
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'crm_bookings'
          AND column_name = 'operational_stage'
    ) INTO has_operational_stage;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'crm_bookings'
          AND column_name = 'status'
    ) INTO has_status;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'crm_bookings'
          AND column_name = 'registration_number'
    ) INTO has_registration_number;

    IF NOT has_registration_number OR (NOT has_operational_stage AND NOT has_status) THEN
        RAISE NOTICE 'Skipping historical referral unlock: required booking columns not found';
        RETURN;
    END IF;

    IF to_regprocedure('public.oclub_unlock_referral(uuid)') IS NULL
       OR to_regprocedure('public.oclub_unlock_orphan_referral(uuid)') IS NULL THEN
        RAISE NOTICE 'Skipping historical referral unlock: required functions not found';
        RETURN;
    END IF;

    sql_query := 'SELECT DISTINCT q.lead_id
                  FROM public.crm_bookings b
                  JOIN public.crm_quotes q ON q.id = b.quote_id
                  WHERE ';

    IF has_operational_stage AND has_status THEN
        sql_query := sql_query || '(b.operational_stage::text = ''DELIVERED'' OR b.status = ''DELIVERED'')';
    ELSIF has_operational_stage THEN
        sql_query := sql_query || 'b.operational_stage::text = ''DELIVERED''';
    ELSE
        sql_query := sql_query || 'b.status = ''DELIVERED''';
    END IF;

    sql_query := sql_query || ' AND b.registration_number IS NOT NULL
                                AND q.lead_id IS NOT NULL';

    FOR r IN EXECUTE sql_query LOOP
        IF EXISTS (
            SELECT 1
            FROM public.oclub_referrals
            WHERE lead_id = r.lead_id
              AND status = 'LOCKED'
        ) THEN
            PERFORM public.oclub_unlock_referral(
                (
                    SELECT id
                    FROM public.oclub_referrals
                    WHERE lead_id = r.lead_id
                      AND status = 'LOCKED'
                    LIMIT 1
                )
            );
        ELSIF EXISTS (
            SELECT 1
            FROM public.oclub_orphan_referrals
            WHERE lead_id = r.lead_id
              AND status = 'LOCKED'
        ) THEN
            PERFORM public.oclub_unlock_orphan_referral(r.lead_id);
        END IF;
    END LOOP;
END $$;
