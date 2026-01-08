-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SAFE ENUM CREATION
do $$ begin
    create type tenant_type as enum ('MARKETPLACE', 'DEALER', 'BANK');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type app_role as enum ('SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALER_ADMIN', 'BANK_ADMIN', 'STAFF');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type lead_status as enum ('NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'DELIVERED', 'CLOSED', 'LOST');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type bank_app_status as enum ('REQUESTED', 'DOCS_PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED');
exception
    when duplicate_object then null;
end $$;


-- 2. CREATE TABLES (Idempotent)
create table if not exists tenants (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    created_at timestamptz default now()
);

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now()
);

create table if not exists leads (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    phone text not null,
    email text,
    city text,
    pincode text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. MIGRATE COLUMNS (Safely Add Missing Columns)
do $$ 
begin
    -- Tenants
    if not exists (select 1 from information_schema.columns where table_name='tenants' and column_name='type') then
        alter table tenants add column type tenant_type default 'DEALER';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='tenants' and column_name='phone') then
        alter table tenants add column phone text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='tenants' and column_name='pincode') then
        alter table tenants add column pincode text;
    end if;

    -- Profiles
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='tenant_id') then
        alter table profiles add column tenant_id uuid references tenants(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='role') then
        alter table profiles add column role app_role default 'STAFF';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='phone') then
        alter table profiles add column phone text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='full_name') then
        alter table profiles add column full_name text;
    end if;

    -- Leads
    if not exists (select 1 from information_schema.columns where table_name='leads' and column_name='owner_tenant_id') then
        alter table leads add column owner_tenant_id uuid references tenants(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name='leads' and column_name='selected_dealer_tenant_id') then
        alter table leads add column selected_dealer_tenant_id uuid references tenants(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name='leads' and column_name='status') then
        alter table leads add column status lead_status default 'NEW';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='leads' and column_name='interest_model') then
        alter table leads add column interest_model text;
        alter table leads add column interest_variant text;
        alter table leads add column interest_color text;
        alter table leads add column price_snapshot numeric;
        alter table leads add column utm_source text;
        alter table leads add column utm_medium text;
        alter table leads add column utm_campaign text;
    end if;
end $$;


-- 4. NEW TABLES (Sharing & Settings)
create table if not exists app_settings (
    id uuid primary key default uuid_generate_v4(),
    default_owner_tenant_id uuid references tenants(id),
    updated_at timestamptz default now()
);

create table if not exists lead_dealer_shares (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id) on delete cascade,
    dealer_tenant_id uuid references tenants(id) on delete cascade,
    shared_by uuid references auth.users(id),
    shared_at timestamptz default now(),
    is_primary boolean default false,
    unique(lead_id, dealer_tenant_id)
);

create table if not exists bank_applications (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id) on delete cascade,
    bank_tenant_id uuid references tenants(id) on delete cascade,
    status bank_app_status default 'REQUESTED',
    roi numeric,
    funding_amount numeric,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists lead_events (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id) on delete cascade,
    actor_user_id uuid references auth.users(id),
    actor_tenant_id uuid references tenants(id),
    event_type text not null,
    payload jsonb,
    created_at timestamptz default now()
);


-- 5. RLS (Robust Drop & Recreate)
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table lead_dealer_shares enable row level security;
alter table bank_applications enable row level security;
-- alter table lead_events enable row level security;

-- DROP OLD POLICIES to avoid recursion/errors
drop policy if exists "Tenants visible to authenticated" on tenants;
drop policy if exists "Read self and coworkers" on profiles;
drop policy if exists "Marketplace sees all leads" on leads;
drop policy if exists "Tenants see own leads" on leads;
drop policy if exists "Dealers see shared leads" on leads;
drop policy if exists "Banks see applicant leads" on leads;
drop policy if exists "Marketplace sees all shares" on lead_dealer_shares;
drop policy if exists "Dealers see their shares" on lead_dealer_shares;
drop policy if exists "Marketplace sees all bank apps" on bank_applications;
drop policy if exists "Banks see their apps" on bank_applications;
drop policy if exists "Marketplace can update leads" on leads;

-- HELPER FUNCTIONS
create or replace function get_my_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid();
$$ language sql security definer;

create or replace function is_marketplace_admin()
returns boolean as $$
  select exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role in ('SUPER_ADMIN', 'MARKETPLACE_ADMIN')
  );
$$ language sql security definer;

-- RECREATE POLICIES

-- Tenants
create policy "Tenants visible to authenticated" on tenants for select to authenticated using (true);

-- Profiles
create policy "Read self and coworkers" on profiles for select to authenticated 
using (
    tenant_id = get_my_tenant_id() 
    or is_marketplace_admin()
);

-- Leads
create policy "Marketplace sees all leads" on leads for select to authenticated
using ( is_marketplace_admin() );

create policy "Tenants see own leads" on leads for select to authenticated
using ( owner_tenant_id = get_my_tenant_id() );

create policy "Dealers see shared leads" on leads for select to authenticated
using (
    exists (
        select 1 from lead_dealer_shares
        where lead_id = leads.id
        and dealer_tenant_id = get_my_tenant_id()
    )
);

create policy "Banks see applicant leads" on leads for select to authenticated
using (
    exists (
        select 1 from bank_applications
        where lead_id = leads.id
        and bank_tenant_id = get_my_tenant_id()
    )
);

-- Shares
create policy "Marketplace sees all shares" on lead_dealer_shares for select to authenticated using ( is_marketplace_admin() );
create policy "Dealers see their shares" on lead_dealer_shares for select to authenticated using ( dealer_tenant_id = get_my_tenant_id() );

-- Apps
create policy "Marketplace sees all bank apps" on bank_applications for select to authenticated using ( is_marketplace_admin() );
create policy "Banks see their apps" on bank_applications for select to authenticated using ( bank_tenant_id = get_my_tenant_id() );

-- Updates
create policy "Marketplace can update leads" on leads for update to authenticated
using ( is_marketplace_admin() );

