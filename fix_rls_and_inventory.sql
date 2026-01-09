-- FIX: RLS Recursion on Profiles
drop policy if exists "Read self and coworkers" on profiles;

create policy "Read own profile" on profiles for select to authenticated
using ( id = auth.uid() );

create policy "Read coworkers" on profiles for select to authenticated
using (
    tenant_id = get_my_tenant_id()
    or is_marketplace_admin()
);

-- FEATURE: Dealer Inventory
create table if not exists marketplace_inventory (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid references tenants(id) on delete cascade,
    item_id uuid references items(id) on delete cascade,
    local_price numeric,
    stock_status text default 'IN_STOCK',
    created_at timestamptz default now(),
    unique(tenant_id, item_id)
);

alter table marketplace_inventory enable row level security;

create policy "Dealers manage own inventory" on marketplace_inventory
    for all to authenticated
    using ( tenant_id = get_my_tenant_id() )
    with check ( tenant_id = get_my_tenant_id() );

create policy "Marketplace sees all inventory" on marketplace_inventory
    for select to authenticated
    using ( is_marketplace_admin() );
