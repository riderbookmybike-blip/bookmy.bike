-- Fix Infinite Recursion in RLS policies by introducing a trusted lookup function

-- 1. Create the helper function with SECURITY DEFINER to bypass RLS
create or replace function public.get_my_role(lookup_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select role
  from memberships
  where user_id = auth.uid()
    and tenant_id = lookup_tenant_id
  limit 1
$$;

-- 2. Secure the function
revoke all on function public.get_my_role(uuid) from public;
grant execute on function public.get_my_role(uuid) to authenticated;

-- 3. Update 'memberships' policy to break recursion
drop policy if exists "Owners can view all memberships" on memberships;

create policy "Owners can view all memberships"
on memberships
for select
using (
  get_my_role(tenant_id) in ('OWNER','SUPER_ADMIN')
  or user_id = auth.uid()
);

-- Note: The 'brands' policy also queries memberships, but now that memberships RLS 
-- is non-recursive (via this function for the Owner check, and direct uid check for others), 
-- the 'brands' query should succeed without stack overflow.
