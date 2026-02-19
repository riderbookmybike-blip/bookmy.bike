-- Finalize cat_price_state_mh hardening after MatrixStep server-action migration.
-- Goal: block all direct authenticated writes; keep reads public.

DO $$
BEGIN
  IF to_regclass('public.cat_price_state_mh') IS NULL THEN
    RAISE NOTICE 'public.cat_price_state_mh not found; skipping relock.';
    RETURN;
  END IF;

  -- Remove temporary compatibility write policies.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Owner insert cat_price_state_mh'
  ) THEN
    DROP POLICY "Owner insert cat_price_state_mh" ON public.cat_price_state_mh;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Owner update cat_price_state_mh'
  ) THEN
    DROP POLICY "Owner update cat_price_state_mh" ON public.cat_price_state_mh;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Admin insert cat_price_state_mh'
  ) THEN
    DROP POLICY "Admin insert cat_price_state_mh" ON public.cat_price_state_mh;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Admin update cat_price_state_mh'
  ) THEN
    DROP POLICY "Admin update cat_price_state_mh" ON public.cat_price_state_mh;
  END IF;

  -- Keep reads open; block direct client writes.
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cat_price_state_mh FROM anon;
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cat_price_state_mh FROM authenticated;
  GRANT SELECT ON TABLE public.cat_price_state_mh TO anon;
  GRANT SELECT ON TABLE public.cat_price_state_mh TO authenticated;
  GRANT ALL PRIVILEGES ON TABLE public.cat_price_state_mh TO service_role;
END $$;
