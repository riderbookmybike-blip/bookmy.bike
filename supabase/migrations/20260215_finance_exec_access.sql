-- Dealer-controlled finance executive CRM access with branch-level primary
create table if not exists public.dealer_finance_user_access (
    id uuid primary key default gen_random_uuid(),
    dealer_tenant_id uuid not null references public.id_tenants(id) on delete cascade,
    branch_id uuid null, -- optional branch (null = default branch)
    finance_tenant_id uuid not null references public.id_tenants(id) on delete cascade,
    finance_exec_id uuid not null references auth.users(id) on delete cascade,
    crm_access boolean default false,
    is_primary boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (dealer_tenant_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'), finance_exec_id)
);
create index if not exists idx_dfua_dealer_branch on public.dealer_finance_user_access(dealer_tenant_id, branch_id);
create index if not exists idx_dfua_exec on public.dealer_finance_user_access(finance_exec_id);
create index if not exists idx_dfua_finance on public.dealer_finance_user_access(finance_tenant_id);
