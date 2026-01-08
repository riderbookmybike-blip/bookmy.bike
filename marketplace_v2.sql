-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type tenant_type as enum ('MARKETPLACE', 'DEALER', 'BANK');
create type app_role as enum ('SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALER_ADMIN', 'BANK_ADMIN', 'STAFF');
create type lead_status as enum ('NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'DELIVERED', 'CLOSED', 'LOST');
create type bank_app_status as enum ('REQUESTED', 'DOCS_PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED');

-- 3. TENANTS (Updated)
create table if not exists tenants (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    type tenant_type not null default 'DEALER',
    phone text,
    pincode text,
    created_at timestamptz default now()
);

-- 4. PROFILES (Updated link to Auth)
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    tenant_id uuid references tenants(id),
    role app_role not null default 'STAFF',
    phone text, -- Login Identifier
    full_name text,
    created_at timestamptz default now()
);

-- 5. APP SETTINGS (Global Config)
create table if not exists app_settings (
    id uuid primary key default uuid_generate_v4(),
    default_owner_tenant_id uuid references tenants(id),
    updated_at timestamptz default now()
);

-- 6. LEADS (Central Table)
create table if not exists leads (
    id uuid primary key default uuid_generate_v4(),
    owner_tenant_id uuid references tenants(id) not null, -- The "Real" Owner
    selected_dealer_tenant_id uuid references tenants(id), -- The "Preferred" Dealer (if any)
    
    -- Customer Info
    name text not null,
    phone text not null,
    email text,
    city text,
    pincode text,
    
    -- Product Interest
    interest_model text,
    interest_variant text,
    interest_color text,
    
    -- Metadata
    status lead_status default 'NEW',
    price_snapshot numeric,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. SHARING: DEALERS (Forever Sharing)
create table if not exists lead_dealer_shares (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id) on delete cascade,
    dealer_tenant_id uuid references tenants(id) on delete cascade,
    shared_by uuid references auth.users(id),
    shared_at timestamptz default now(),
    is_primary boolean default false,
    unique(lead_id, dealer_tenant_id)
);

-- 8. SHARING: BANKS + APPLICATIONS
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

-- 9. AUDIT LOGS
create table if not exists lead_events (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id) on delete cascade,
    actor_user_id uuid references auth.users(id),
    actor_tenant_id uuid references tenants(id),
    event_type text not null,
    payload jsonb,
    created_at timestamptz default now()
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

alter table items enable row level security; -- (If exists, otherwise ignore)
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table lead_dealer_shares enable row level security;
alter table bank_applications enable row level security;

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


-- POLICIES

-- TENANTS: Read all (for reference)
create policy "Tenants visible to authenticated" on tenants for select to authenticated using (true);

-- PROFILES: Read self and coworkers
create policy "Read self and coworkers" on profiles for select to authenticated 
using (
    tenant_id = get_my_tenant_id() 
    or is_marketplace_admin()
);

-- LEADS VISIBILITY
-- 1. Marketplace sees ALL
create policy "Marketplace sees all leads" on leads for select to authenticated
using ( is_marketplace_admin() );

-- 2. Tenants see leads they OWN
create policy "Tenants see own leads" on leads for select to authenticated
using ( owner_tenant_id = get_my_tenant_id() );

-- 3. Tenants see leads Shared with them (Dealer Shares)
create policy "Dealers see shared leads" on leads for select to authenticated
using (
    exists (
        select 1 from lead_dealer_shares
        where lead_id = leads.id
        and dealer_tenant_id = get_my_tenant_id()
    )
);

-- 4. Banks see leads they have applications for
create policy "Banks see applicant leads" on leads for select to authenticated
using (
    exists (
        select 1 from bank_applications
        where lead_id = leads.id
        and bank_tenant_id = get_my_tenant_id()
    )
);

-- SHARING Tables Visibility
create policy "Marketplace sees all shares" on lead_dealer_shares for select to authenticated using ( is_marketplace_admin() );
create policy "Dealers see their shares" on lead_dealer_shares for select to authenticated using ( dealer_tenant_id = get_my_tenant_id() );

create policy "Marketplace sees all bank apps" on bank_applications for select to authenticated using ( is_marketplace_admin() );
create policy "Banks see their apps" on bank_applications for select to authenticated using ( bank_tenant_id = get_my_tenant_id() );

-- WRITES: Only Server Actions (Service Role) typically handle heavy logic, 
-- but if we allow client writes:
create policy "Marketplace can update leads" on leads for update to authenticated
using ( is_marketplace_admin() );

-- Everyone can insert via Server Action (which bypasses RLS), but if directly:
-- create policy "Staff can insert" on leads for insert to authenticated with check (true);
