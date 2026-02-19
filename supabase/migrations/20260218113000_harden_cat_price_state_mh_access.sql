-- P0 hardening: protect canonical pricing table from client-side mutation.
-- Goal:
-- 1) Keep public/authenticated read access for catalog + PDP.
-- 2) Remove all direct write access from anon/authenticated/public.
-- 3) Enable RLS so writes require explicit policy (none provided for client roles).

DO $$
BEGIN
  IF to_regclass('public.cat_price_state_mh') IS NULL THEN
    RAISE NOTICE 'public.cat_price_state_mh not found; skipping hardening.';
    RETURN;
  END IF;

  ALTER TABLE public.cat_price_state_mh ENABLE ROW LEVEL SECURITY;

  REVOKE ALL PRIVILEGES ON TABLE public.cat_price_state_mh FROM PUBLIC;
  REVOKE ALL PRIVILEGES ON TABLE public.cat_price_state_mh FROM anon;
  REVOKE ALL PRIVILEGES ON TABLE public.cat_price_state_mh FROM authenticated;

  GRANT SELECT ON TABLE public.cat_price_state_mh TO anon;
  GRANT SELECT ON TABLE public.cat_price_state_mh TO authenticated;
  GRANT ALL PRIVILEGES ON TABLE public.cat_price_state_mh TO service_role;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dashboard_user') THEN
    GRANT SELECT ON TABLE public.cat_price_state_mh TO dashboard_user;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cat_price_state_mh'
      AND policyname = 'Public read cat_price_state_mh'
  ) THEN
    CREATE POLICY "Public read cat_price_state_mh"
      ON public.cat_price_state_mh
      FOR SELECT
      USING (true);
  END IF;
END $$;
