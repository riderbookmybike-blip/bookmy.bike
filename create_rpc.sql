-- FIX: Missing RPC Function for Authentication
-- This function is required by the TenantContext middleware to load user profile securely.

create or replace function get_session_profile()
returns jsonb
language plpgsql
security definer -- Bypass RLS to avoid recursion
as $$
declare
    result jsonb;
begin
    select 
        jsonb_build_object(
            'id', p.id,
            'role', p.role,
            'created_at', p.created_at,
            'tenants', case when t.id is not null then jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'type', t.type
            ) else null end
        )
    into result
    from profiles p
    left join tenants t on t.id = p.tenant_id
    where p.id = auth.uid();

    return result;
end;
$$;

-- Grant access to authenticated users
grant execute on function get_session_profile() to authenticated;
