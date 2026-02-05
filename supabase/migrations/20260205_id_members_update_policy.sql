-- Allow authenticated members to update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'id_members'
          AND policyname = 'Members update own profile'
    ) THEN
        CREATE POLICY "Members update own profile" ON public.id_members
            FOR UPDATE TO authenticated
            USING (id = auth.uid())
            WITH CHECK (id = auth.uid());
    END IF;
END $$;
