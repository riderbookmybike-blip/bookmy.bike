create table if not exists public.vahan_two_wheeler_monthly_fuel_uploads (
    id bigserial primary key,
    state_code text not null,
    state_name text not null,
    rto_code text not null,
    rto_name text not null,
    year int not null,
    month_no int not null check (month_no between 1 and 12),
    month_label text not null,
    maker text not null,
    brand_name text not null,
    fuel_bucket text not null,
    units int not null check (units >= 0),
    source_file_name text not null,
    uploaded_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint vahan_2w_monthly_fuel_uq unique (state_code, rto_code, year, month_no, maker, fuel_bucket)
);

create index if not exists idx_vahan_2w_monthly_fuel_state_year_month
  on public.vahan_two_wheeler_monthly_fuel_uploads (state_code, year, month_no);

create index if not exists idx_vahan_2w_monthly_fuel_bucket
  on public.vahan_two_wheeler_monthly_fuel_uploads (fuel_bucket, state_code, year, month_no);

create index if not exists idx_vahan_2w_monthly_fuel_rto
  on public.vahan_two_wheeler_monthly_fuel_uploads (rto_code, fuel_bucket, year, month_no);

create table if not exists public.vahan_two_wheeler_fuel_daily_snapshots (
    id bigserial primary key,
    snapshot_date date not null,
    state_code text not null,
    state_name text not null,
    rto_code text not null,
    rto_name text not null,
    year int not null,
    month_no int not null check (month_no between 1 and 12),
    month_label text not null,
    maker text not null,
    brand_name text not null,
    fuel_bucket text not null,
    units int not null check (units >= 0),
    source_file_name text not null,
    uploaded_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint vahan_2w_daily_fuel_uq unique (snapshot_date, state_code, rto_code, year, month_no, maker, fuel_bucket)
);

create index if not exists idx_vahan_2w_daily_fuel_snapshot
  on public.vahan_two_wheeler_fuel_daily_snapshots (snapshot_date, fuel_bucket, state_code);

create index if not exists idx_vahan_2w_daily_fuel_rto
  on public.vahan_two_wheeler_fuel_daily_snapshots (rto_code, snapshot_date, fuel_bucket);

create or replace function public.set_updated_at_vahan_2w_monthly_fuel()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_vahan_2w_monthly_fuel on public.vahan_two_wheeler_monthly_fuel_uploads;
create trigger trg_set_updated_at_vahan_2w_monthly_fuel
before update on public.vahan_two_wheeler_monthly_fuel_uploads
for each row execute function public.set_updated_at_vahan_2w_monthly_fuel();

create or replace function public.set_updated_at_vahan_2w_daily_fuel()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_vahan_2w_daily_fuel on public.vahan_two_wheeler_fuel_daily_snapshots;
create trigger trg_set_updated_at_vahan_2w_daily_fuel
before update on public.vahan_two_wheeler_fuel_daily_snapshots
for each row execute function public.set_updated_at_vahan_2w_daily_fuel();

alter table public.vahan_two_wheeler_monthly_fuel_uploads enable row level security;
alter table public.vahan_two_wheeler_fuel_daily_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vahan_two_wheeler_monthly_fuel_uploads'
      and policyname = 'vahan_2w_monthly_fuel_select_authenticated'
  ) then
    create policy "vahan_2w_monthly_fuel_select_authenticated"
    on public.vahan_two_wheeler_monthly_fuel_uploads
    for select
    to authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vahan_two_wheeler_monthly_fuel_uploads'
      and policyname = 'vahan_2w_monthly_fuel_write_service'
  ) then
    create policy "vahan_2w_monthly_fuel_write_service"
    on public.vahan_two_wheeler_monthly_fuel_uploads
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vahan_two_wheeler_fuel_daily_snapshots'
      and policyname = 'vahan_2w_daily_fuel_select_authenticated'
  ) then
    create policy "vahan_2w_daily_fuel_select_authenticated"
    on public.vahan_two_wheeler_fuel_daily_snapshots
    for select
    to authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vahan_two_wheeler_fuel_daily_snapshots'
      and policyname = 'vahan_2w_daily_fuel_write_service'
  ) then
    create policy "vahan_2w_daily_fuel_write_service"
    on public.vahan_two_wheeler_fuel_daily_snapshots
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end $$;

