-- Create a security definer function to check memberships without RLS recursion
-- This allows the server component to reliably fetch membership info for the logged-in user

-- Purana version delete karne ke liye
DROP FUNCTION IF EXISTS public.get_user_memberships(uuid);

-- More resilient version returning all memberships for the user
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
            t.type::TEXT as tenant_type
        FROM 
            public.memberships m
        LEFT JOIN 
            public.tenants t ON m.tenant_id = t.id
        WHERE 
            m.user_id = p_user_id
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_memberships(UUID) TO service_role;
