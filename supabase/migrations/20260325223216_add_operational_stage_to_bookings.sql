-- Migration: Add operational_stage to crm_bookings & harden crm_quotes RLS

-- 1. Add missing column to crm_bookings
DO $$
BEGIN
    IF to_regclass('public.crm_bookings') IS NOT NULL THEN
        -- Safely attempt to add the column. The enum crm_operational_stage was created in Phase 2
        BEGIN
            ALTER TABLE public.crm_bookings 
            ADD COLUMN IF NOT EXISTS operational_stage public.crm_operational_stage;
        EXCEPTION WHEN undefined_object THEN
            -- Fallback to text if enum doesn't exist (though it should)
            ALTER TABLE public.crm_bookings 
            ADD COLUMN IF NOT EXISTS operational_stage TEXT;
        END;
    END IF;
END $$;

-- 2. Harden crm_quotes RLS (Restrictive Policy for UPDATE)
-- Block anon entirely from updating quotes
DROP POLICY IF EXISTS "Block Anon Quotes Update" ON public.crm_quotes;
CREATE POLICY "Block Anon Quotes Update" ON public.crm_quotes
AS RESTRICTIVE FOR UPDATE
TO anon
USING (false);

-- Enforce strict dealership check on updates for authenticated users
BEGIN;
    DROP POLICY IF EXISTS "Enforce Dealership Quotes Update" ON public.crm_quotes;
    
    CREATE POLICY "Enforce Dealership Quotes Update" ON public.crm_quotes
    AS RESTRICTIVE FOR UPDATE
    TO authenticated
    USING (
        public.check_is_super_admin(auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.tenant_id IN (
                crm_quotes.tenant_id, 
                crm_quotes.assigned_tenant_id
            )
        )
    )
    WITH CHECK (true);
COMMIT;
