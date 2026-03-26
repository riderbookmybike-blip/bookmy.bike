-- Enable RLS on tenants (legacy table)
DO $$
BEGIN
    IF to_regclass('public.tenants') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Add RLS policy for tenants (authenticated users can view)
DO $$
BEGIN
    IF to_regclass('public.tenants') IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'tenants'
              AND policyname = 'Allow authenticated view tenants'
        ) THEN
            EXECUTE '
                CREATE POLICY "Allow authenticated view tenants" ON public.tenants
                FOR SELECT
                TO authenticated
                USING (true)
            ';
        END IF;
    END IF;
END $$;

-- Add missing foreign key indexes only when tables exist
DO $$
BEGIN
    IF to_regclass('public.bank_applications') IS NOT NULL THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bank_applications_lead_id ON public.bank_applications(lead_id)';
    END IF;

    IF to_regclass('public.lead_dealer_shares') IS NOT NULL THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lead_dealer_shares_shared_by ON public.lead_dealer_shares(shared_by)';
    END IF;

    IF to_regclass('public.lead_events') IS NOT NULL THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lead_events_actor_user_id ON public.lead_events(actor_user_id)';
    END IF;
END $$;
