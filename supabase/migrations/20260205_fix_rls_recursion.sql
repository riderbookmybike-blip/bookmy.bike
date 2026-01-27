-- Migration: 20260205_fix_rls_recursion.sql
-- Description: Break infinite recursion in RLS policies by using Security Definer functions

-- 1. Helper Functions (Security Definer)
-- These bypass RLS checks on the tables they query

CREATE OR REPLACE FUNCTION public.check_is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.id_team 
        WHERE user_id = p_user_id 
        AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN')
        AND status = 'ACTIVE'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_tenant_owner(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.id_team 
        WHERE user_id = p_user_id 
        AND tenant_id = p_tenant_id
        AND role = 'OWNER'
        AND status = 'ACTIVE'
    );
END;
$$;

-- 2. Update id_team POLICIES
DROP POLICY IF EXISTS "Super Admins can manage all team links" ON public.id_team;
CREATE POLICY "Super Admins can manage all team links" ON public.id_team
FOR ALL
TO authenticated
USING (public.check_is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can manage their tenant team" ON public.id_team;
CREATE POLICY "Owners can manage their tenant team" ON public.id_team
FOR ALL
TO authenticated
USING (public.check_is_tenant_owner(auth.uid(), tenant_id));

-- 3. Update id_tenants POLICIES
DROP POLICY IF EXISTS "Admins can manage id_tenants" ON public.id_tenants;
CREATE POLICY "Admins can manage id_tenants" ON public.id_tenants
FOR ALL
TO authenticated
USING (public.check_is_super_admin(auth.uid()));

-- 4. Grant Execute Permissions
GRANT EXECUTE ON FUNCTION public.check_is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_tenant_owner(UUID, UUID) TO authenticated;
