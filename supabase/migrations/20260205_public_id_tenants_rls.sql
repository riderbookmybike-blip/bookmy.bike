-- Migration: 20260205_public_id_tenants_rls.sql
-- Description: Allow unauthenticated users to view tenant branding (slug, name, config)

DROP POLICY IF EXISTS "Public Read id_tenants" ON public.id_tenants;
CREATE POLICY "Public Read id_tenants" ON public.id_tenants
FOR SELECT
USING (true);

-- Ensure RLS is enabled just in case
ALTER TABLE public.id_tenants ENABLE ROW LEVEL SECURITY;
