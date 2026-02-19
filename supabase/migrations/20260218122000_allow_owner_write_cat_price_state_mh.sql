-- Compatibility hotfix:
-- allow ACTIVE OWNER users to update canonical state pricing
-- while keeping anon/public writes blocked.
--
-- NOTE: This is intentionally broader than super-admin-only.
-- Next hardening step should move writes behind a dedicated RPC with
-- tenant-scoped authorization rules.

DO $$
BEGIN
  IF to_regclass('public.cat_price_state_mh') IS NULL THEN
    RAISE NOTICE 'public.cat_price_state_mh not found; skipping OWNER write compatibility policy.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Owner insert cat_price_state_mh'
  ) THEN
    CREATE POLICY "Owner insert cat_price_state_mh"
      ON public.cat_price_state_mh
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.id_team t
          WHERE t.user_id = auth.uid()
            AND t.status = 'ACTIVE'
            AND t.role = 'OWNER'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Owner update cat_price_state_mh'
  ) THEN
    CREATE POLICY "Owner update cat_price_state_mh"
      ON public.cat_price_state_mh
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.id_team t
          WHERE t.user_id = auth.uid()
            AND t.status = 'ACTIVE'
            AND t.role = 'OWNER'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.id_team t
          WHERE t.user_id = auth.uid()
            AND t.status = 'ACTIVE'
            AND t.role = 'OWNER'
        )
      );
  END IF;
END $$;
