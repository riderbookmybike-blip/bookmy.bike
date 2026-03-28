create table if not exists public.vahan_two_wheeler_daily_snapshots (
  id bigserial primary key,
  state_code text not null,
  state_name text,
  rto_code text not null,
  rto_name text,
  year integer not null,
  month_no integer not null,
  month_label text,
  maker text not null,
  brand_name text,
  units bigint not null,
  snapshot_date date not null,
  source_file_name text,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_code, rto_code, year, month_no, maker, snapshot_date)
);

create index if not exists idx_vahan_2w_daily_snapshot_date
  on public.vahan_two_wheeler_daily_snapshots(snapshot_date);

create index if not exists idx_vahan_2w_daily_rto_snapshot
  on public.vahan_two_wheeler_daily_snapshots(rto_code, snapshot_date);

create index if not exists idx_vahan_2w_daily_state_year_month
  on public.vahan_two_wheeler_daily_snapshots(state_code, year, month_no);

create or replace function public.set_updated_at_vahan_2w_daily()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_vahan_2w_daily on public.vahan_two_wheeler_daily_snapshots;
create trigger trg_set_updated_at_vahan_2w_daily
before update on public.vahan_two_wheeler_daily_snapshots
for each row
execute function public.set_updated_at_vahan_2w_daily();
