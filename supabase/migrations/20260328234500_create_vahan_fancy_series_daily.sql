create table if not exists public.vahan_fancy_series_daily (
    id bigserial primary key,
    snapshot_date date not null default current_date,
    state_code text not null,
    rto_code text not null,
    rto_name text not null,
    series_name text not null,
    series_type text not null,
    series_status text not null,
    is_active boolean not null default false,
    start_range integer not null default 1,
    end_range integer not null default 9999,
    first_open_number integer,
    filled_till integer,
    running_open_count integer not null default 0,
    available_count integer not null default 0,
    scraped_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint vahan_fancy_series_daily_uq unique (snapshot_date, state_code, rto_code, series_name)
);

create index if not exists idx_vahan_fancy_series_daily_state_rto_date
    on public.vahan_fancy_series_daily (state_code, rto_code, snapshot_date desc);

create index if not exists idx_vahan_fancy_series_daily_active
    on public.vahan_fancy_series_daily (snapshot_date desc, is_active, series_type);

alter table public.vahan_fancy_series_daily enable row level security;

create policy if not exists "vahan_fancy_series_daily_select_authenticated"
on public.vahan_fancy_series_daily
for select
to authenticated
using (true);

create policy if not exists "vahan_fancy_series_daily_write_service"
on public.vahan_fancy_series_daily
for all
to service_role
using (true)
with check (true);

create or replace function public.set_vahan_fancy_series_daily_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vahan_fancy_series_daily_updated_at on public.vahan_fancy_series_daily;
create trigger trg_vahan_fancy_series_daily_updated_at
before update on public.vahan_fancy_series_daily
for each row
execute function public.set_vahan_fancy_series_daily_updated_at();
