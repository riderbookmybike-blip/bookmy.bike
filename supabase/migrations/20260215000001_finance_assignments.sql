-- Track which finance exec is assigned to each entity
create table if not exists public.crm_finance_assignments (
    entity_type text not null check (entity_type in ('LEAD','QUOTE','BOOKING')),
    entity_id uuid not null,
    finance_tenant_id uuid not null references public.id_tenants(id) on delete cascade,
    finance_exec_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key (entity_type, entity_id)
);
create index if not exists idx_cfa_exec on public.crm_finance_assignments(finance_exec_id);
create index if not exists idx_cfa_tenant on public.crm_finance_assignments(finance_tenant_id);
