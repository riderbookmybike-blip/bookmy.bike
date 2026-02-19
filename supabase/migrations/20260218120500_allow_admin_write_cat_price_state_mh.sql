-- Restore controlled admin write access for dashboard pricing flows.
-- Keeps anonymous/public writes blocked while allowing authenticated
-- marketplace/super-admin users (via check_is_super_admin) to insert/update.

DO $$
BEGIN
  IF to_regclass('public.cat_price_state_mh') IS NULL THEN
    RAISE NOTICE 'public.cat_price_state_mh not found; skipping admin write policy migration.';
    RETURN;
  END IF;

  -- Privileges: allow only authenticated role to attempt writes.
  -- RLS policies below decide who can actually write.
  GRANT INSERT, UPDATE ON TABLE public.cat_price_state_mh TO authenticated;
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cat_price_state_mh FROM anon;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Admin insert cat_price_state_mh'
  ) THEN
    CREATE POLICY "Admin insert cat_price_state_mh"
      ON public.cat_price_state_mh
      FOR INSERT
      TO authenticated
      WITH CHECK (check_is_super_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Admin update cat_price_state_mh'
  ) THEN
    CREATE POLICY "Admin update cat_price_state_mh"
      ON public.cat_price_state_mh
      FOR UPDATE
      TO authenticated
      USING (check_is_super_admin(auth.uid()))
      WITH CHECK (check_is_super_admin(auth.uid()));
  END IF;
END $$;
