-- Migration: 20260205_allow_owners_update_tenant.sql
-- Description: Allow Tenant Owners to update their own tenant record (e.g. logo, phone, address)

-- Create Policy for Owners to UPDATE their own tenant
DROP POLICY IF EXISTS "Owners can update own tenant" ON public.id_tenants;

DO $$
BEGIN
  IF to_regclass('public.id_tenants') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'check_is_tenant_owner'
      AND pg_get_function_identity_arguments(p.oid) = 'uuid, uuid'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Owners can update own tenant" ON public.id_tenants
      FOR UPDATE
      TO authenticated
      USING (public.check_is_tenant_owner(auth.uid(), id))
      WITH CHECK (public.check_is_tenant_owner(auth.uid(), id))
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "Owners can update own tenant" ON public.id_tenants
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.id_team it
          WHERE it.user_id = auth.uid()
            AND it.tenant_id = id_tenants.id
            AND it.role = 'OWNER'
            AND it.status = 'ACTIVE'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.id_team it
          WHERE it.user_id = auth.uid()
            AND it.tenant_id = id_tenants.id
            AND it.role = 'OWNER'
            AND it.status = 'ACTIVE'
        )
      )
    $sql$;
  END IF;
END $$;

-- Note: We generally don't want Owners to DELETE their tenant or INSERT new tenants (only Super Admin does that)
-- So we restrict this to UPDATE only.
