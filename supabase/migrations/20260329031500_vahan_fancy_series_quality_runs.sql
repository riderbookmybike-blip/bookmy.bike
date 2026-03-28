create extension if not exists pgcrypto;

alter table public.vahan_fancy_series_daily
  add column if not exists run_id uuid,
  add column if not exists published boolean not null default false;

create index if not exists idx_vahan_fancy_series_daily_run_id
  on public.vahan_fancy_series_daily (run_id);

create index if not exists idx_vahan_fancy_series_daily_published
  on public.vahan_fancy_series_daily (state_code, published, snapshot_date desc);

create table if not exists public.vahan_fancy_series_runs (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null default current_date,
  state_code text not null,
  status text not null default 'running',
  expected_rto_count integer not null default 0,
  processed_rto_count integer not null default 0,
  active_rto_count integer not null default 0,
  anomaly_count integer not null default 0,
  notes text,
  published boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vahan_fancy_series_runs_state_date
  on public.vahan_fancy_series_runs (state_code, snapshot_date desc, started_at desc);

create unique index if not exists uq_vahan_fancy_series_runs_one_published_per_day
  on public.vahan_fancy_series_runs (state_code, snapshot_date)
  where published = true;

alter table public.vahan_fancy_series_runs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vahan_fancy_series_runs'
      and policyname = 'vahan_fancy_series_runs_select_authenticated'
  ) then
    create policy "vahan_fancy_series_runs_select_authenticated"
    on public.vahan_fancy_series_runs
    for select
    to authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vahan_fancy_series_runs'
      and policyname = 'vahan_fancy_series_runs_write_service'
  ) then
    create policy "vahan_fancy_series_runs_write_service"
    on public.vahan_fancy_series_runs
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end $$;

create or replace function public.set_vahan_fancy_series_runs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vahan_fancy_series_runs_updated_at on public.vahan_fancy_series_runs;
create trigger trg_vahan_fancy_series_runs_updated_at
before update on public.vahan_fancy_series_runs
for each row
execute function public.set_vahan_fancy_series_runs_updated_at();
