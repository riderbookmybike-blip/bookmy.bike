-- Migration: 20260205_fix_id_tenants_rls.sql
-- Description: Allow Super Admins to manage the dealership network

-- 1. id_tenants POLICIES
DROP POLICY IF EXISTS "Admins can manage id_tenants" ON public.id_tenants;
CREATE POLICY "Admins can manage id_tenants" ON public.id_tenants
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.id_team 
        WHERE user_id = auth.uid() 
        AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN')
        AND status = 'ACTIVE'
    )
);

-- 2. id_team POLICIES
-- Allow Super Admins to manage all team links
-- Allow Owners/Admins to manage their own tenant's team links
ALTER TABLE public.id_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can manage all team links" ON public.id_team;
CREATE POLICY "Super Admins can manage all team links" ON public.id_team
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.id_team 
        WHERE user_id = auth.uid() 
        AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN')
        AND status = 'ACTIVE'
    )
);

DROP POLICY IF EXISTS "Owners can manage their tenant team" ON public.id_team;
CREATE POLICY "Owners can manage their tenant team" ON public.id_team
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.id_team 
        WHERE user_id = auth.uid() 
        AND tenant_id = id_team.tenant_id
        AND role = 'OWNER'
        AND status = 'ACTIVE'
    )
);

-- Allow users to see their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON public.id_team;
CREATE POLICY "Users can view own memberships" ON public.id_team
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
