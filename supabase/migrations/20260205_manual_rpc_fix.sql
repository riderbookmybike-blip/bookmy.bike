-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR TO UPDATE THE ACCESS RPC
-- This aligns the RPC with the new 'id_team' and 'id_tenants' tables.

CREATE OR REPLACE FUNCTION public.get_user_memberships(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(sub) INTO result
    FROM (
        SELECT 
            m.id,
            m.role::TEXT,
            m.status::TEXT,
            m.tenant_id,
            m.user_id,
            t.name::TEXT as tenant_name,
            t.slug::TEXT as tenant_slug,
            t.type::TEXT as tenant_type,
            t.config as tenant_config
        FROM 
            public.id_team m
        LEFT JOIN 
            public.id_tenants t ON m.tenant_id = t.id
        WHERE 
            m.user_id = p_user_id
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_memberships(UUID) TO service_role;
