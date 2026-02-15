-- Dealer-level control over finance schemes
create table if not exists public.dealer_finance_schemes (
    id uuid primary key default gen_random_uuid(),
    dealer_tenant_id uuid not null references public.id_tenants(id) on delete cascade,
    finance_tenant_id uuid not null references public.id_tenants(id) on delete cascade,
    -- scheme_id: finance scheme identifier (no FK enforced here because finance_schemes table may be external/not present)
    scheme_id uuid not null,
    is_active boolean default true,
    target jsonb default '{}'::jsonb,
    incentive jsonb default '{}'::jsonb,
    payout jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (dealer_tenant_id, scheme_id)
);
create index if not exists idx_dfs_dealer on public.dealer_finance_schemes(dealer_tenant_id);
create index if not exists idx_dfs_finance on public.dealer_finance_schemes(finance_tenant_id);
