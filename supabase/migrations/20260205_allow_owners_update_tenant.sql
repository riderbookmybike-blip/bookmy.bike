-- Migration: 20260205_allow_owners_update_tenant.sql
-- Description: Allow Tenant Owners to update their own tenant record (e.g. logo, phone, address)

-- Create Policy for Owners to UPDATE their own tenant
DROP POLICY IF EXISTS "Owners can update own tenant" ON public.id_tenants;
CREATE POLICY "Owners can update own tenant" ON public.id_tenants
FOR UPDATE
TO authenticated
USING (public.check_is_tenant_owner(auth.uid(), id))
WITH CHECK (public.check_is_tenant_owner(auth.uid(), id));

-- Note: We generally don't want Owners to DELETE their tenant or INSERT new tenants (only Super Admin does that)
-- So we restrict this to UPDATE only.
