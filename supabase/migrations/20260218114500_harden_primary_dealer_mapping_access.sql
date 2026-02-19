-- P0/P1 hardening for primary dealer district mapping.
-- Goals:
-- 1) Keep public/authenticated read access for routing.
-- 2) Remove broad authenticated write access on table.
-- 3) Restrict primary-mapping writes to owner/super-admin via RPC.
-- 4) Harden RPC with explicit auth checks and fixed search_path.

DO $$
BEGIN
  IF to_regclass('public.id_primary_dealer_districts') IS NULL THEN
    RAISE NOTICE 'public.id_primary_dealer_districts not found; skipping hardening.';
    RETURN;
  END IF;

  ALTER TABLE public.id_primary_dealer_districts ENABLE ROW LEVEL SECURITY;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'id_primary_dealer_districts'
      AND policyname = 'Primary dealer mapping is writable by authenticated'
  ) THEN
    DROP POLICY "Primary dealer mapping is writable by authenticated"
      ON public.id_primary_dealer_districts;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'id_primary_dealer_districts'
      AND policyname = 'Primary dealer mapping write by owner or super admin'
  ) THEN
    CREATE POLICY "Primary dealer mapping write by owner or super admin"
      ON public.id_primary_dealer_districts
      FOR ALL
      TO authenticated
      USING (
        check_is_super_admin(auth.uid())
        OR check_is_tenant_owner(auth.uid(), tenant_id)
      )
      WITH CHECK (
        check_is_super_admin(auth.uid())
        OR check_is_tenant_owner(auth.uid(), tenant_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'id_primary_dealer_districts'
      AND policyname = 'Primary dealer mapping is readable'
  ) THEN
    CREATE POLICY "Primary dealer mapping is readable"
      ON public.id_primary_dealer_districts
      FOR SELECT
      USING (true);
  END IF;

  REVOKE ALL PRIVILEGES ON TABLE public.id_primary_dealer_districts FROM PUBLIC;
  REVOKE ALL PRIVILEGES ON TABLE public.id_primary_dealer_districts FROM anon;
  REVOKE ALL PRIVILEGES ON TABLE public.id_primary_dealer_districts FROM authenticated;

  GRANT SELECT ON TABLE public.id_primary_dealer_districts TO anon;
  GRANT SELECT ON TABLE public.id_primary_dealer_districts TO authenticated;
  GRANT ALL PRIVILEGES ON TABLE public.id_primary_dealer_districts TO service_role;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dashboard_user') THEN
    GRANT SELECT ON TABLE public.id_primary_dealer_districts TO dashboard_user;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_primary_dealer_for_district(
  p_tenant_id uuid,
  p_district text,
  p_state_code text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_district text := btrim(coalesce(p_district, ''));
  v_state_code text := upper(btrim(coalesce(p_state_code, '')));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;

  IF v_district = '' THEN
    RAISE EXCEPTION 'district is required';
  END IF;

  IF v_state_code = '' THEN
    RAISE EXCEPTION 'state_code is required';
  END IF;

  IF NOT (
    check_is_super_admin(v_user_id)
    OR check_is_tenant_owner(v_user_id, p_tenant_id)
  ) THEN
    RAISE EXCEPTION 'Insufficient permission to set primary dealer mapping';
  END IF;

  UPDATE public.id_primary_dealer_districts
  SET is_active = false
  WHERE state_code = v_state_code
    AND lower(district) = lower(v_district)
    AND is_active = true;

  INSERT INTO public.id_primary_dealer_districts (tenant_id, district, state_code, is_active)
  VALUES (p_tenant_id, v_district, v_state_code, true)
  ON CONFLICT (state_code, district)
  DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        is_active = true,
        updated_at = now();
END;
$function$;

REVOKE ALL ON FUNCTION public.set_primary_dealer_for_district(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_primary_dealer_for_district(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_primary_dealer_for_district(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_dealer_for_district(uuid, text, text) TO service_role;
