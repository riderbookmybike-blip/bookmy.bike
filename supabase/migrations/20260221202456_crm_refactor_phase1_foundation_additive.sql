-- Phase 1 foundation (additive only, no destructive drops)

create table if not exists public.crm_quote_events (
    id uuid primary key default gen_random_uuid(),
    quote_id uuid not null references public.crm_quotes(id) on delete cascade,
    event_type text not null,
    actor_tenant_id uuid references public.id_tenants(id),
    actor_user_id uuid references public.id_members(id),
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_crm_quote_events_quote_created
    on public.crm_quote_events (quote_id, created_at desc);

create table if not exists public.crm_finance_events (
    id uuid primary key default gen_random_uuid(),
    finance_id uuid not null references public.crm_finance(id) on delete cascade,
    event_type text not null,
    milestone text,
    actor_tenant_id uuid references public.id_tenants(id),
    actor_user_id uuid references public.id_members(id),
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_crm_finance_events_finance_created
    on public.crm_finance_events (finance_id, created_at desc);

create table if not exists public.crm_feedback (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.crm_bookings(id) on delete cascade,
    member_id uuid references public.id_members(id),
    tenant_id uuid references public.id_tenants(id),
    nps_score int check (nps_score between 1 and 10),
    delivery_rating int check (delivery_rating between 1 and 5),
    staff_rating int check (staff_rating between 1 and 5),
    review_text text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_crm_feedback_booking
    on public.crm_feedback (booking_id);

create table if not exists public.crm_media (
    id uuid primary key default gen_random_uuid(),
    entity_type text not null,
    entity_id uuid not null,
    file_type text,
    url text not null,
    uploaded_by uuid references public.id_members(id),
    metadata text,
    created_at timestamptz not null default now()
);

create index if not exists idx_crm_media_entity
    on public.crm_media (entity_type, entity_id, created_at desc);

do $$
begin
  if to_regclass('public.crm_allotments') is null then
    raise notice 'Skipping crm_allotments patch: table not found';
  else
    if to_regclass('public.inv_stock') is not null then
      execute 'alter table public.crm_allotments add column if not exists inv_stock_id uuid references public.inv_stock(id)';
    else
      execute 'alter table public.crm_allotments add column if not exists inv_stock_id uuid';
    end if;

    execute 'create index if not exists idx_crm_allotments_inv_stock on public.crm_allotments (inv_stock_id) where inv_stock_id is not null';
  end if;
end
$$;

alter table public.crm_finance
    add column if not exists lead_id uuid references public.crm_leads(id),
    add column if not exists bank_partner_id uuid references public.id_tenants(id),
    add column if not exists booking_id uuid references public.crm_bookings(id),
    add column if not exists status text,
    add column if not exists external_app_ref text,
    add column if not exists loan_account_number text,
    add column if not exists applied_at timestamptz,
    add column if not exists document_verified_at timestamptz,
    add column if not exists approved_at timestamptz,
    add column if not exists sanctioned_at timestamptz,
    add column if not exists rejected_at timestamptz;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_finance' and column_name = 'booking_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_finance' and column_name = 'status'
  ) then
    execute 'create index if not exists idx_crm_finance_booking_status on public.crm_finance (booking_id, status)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_finance' and column_name = 'lead_id'
  ) then
    execute 'create index if not exists idx_crm_finance_lead on public.crm_finance (lead_id) where lead_id is not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads' and column_name = 'tenant_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads' and column_name = 'status'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads' and column_name = 'created_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads' and column_name = 'is_deleted'
  ) then
    execute 'create index if not exists idx_crm_leads_active_tenant on public.crm_leads (tenant_id, status, created_at desc) where is_deleted = false';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_bookings' and column_name = 'tenant_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_bookings' and column_name = 'operational_stage'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_bookings' and column_name = 'created_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_bookings' and column_name = 'is_deleted'
  ) then
    execute 'create index if not exists idx_crm_bookings_active_tenant_stage on public.crm_bookings (tenant_id, operational_stage, created_at desc) where is_deleted = false';
  end if;
end
$$;
