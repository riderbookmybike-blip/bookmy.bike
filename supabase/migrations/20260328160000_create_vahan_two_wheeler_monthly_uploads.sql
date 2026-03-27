create table if not exists public.vahan_two_wheeler_monthly_uploads (
    id bigserial primary key,
    state_code text not null default 'MH',
    state_name text not null default 'Maharashtra',
    year integer not null check (year >= 2000 and year <= 2100),
    month_no integer not null check (month_no between 1 and 12),
    month_label text not null,
    maker text not null,
    units bigint not null default 0,
    source_file_name text,
    uploaded_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint vahan_two_wheeler_monthly_uploads_uq unique (state_code, year, month_no, maker)
);

create index if not exists idx_vahan_two_wheeler_monthly_uploads_state_year_month
    on public.vahan_two_wheeler_monthly_uploads (state_code, year, month_no);

create index if not exists idx_vahan_two_wheeler_monthly_uploads_maker
    on public.vahan_two_wheeler_monthly_uploads (maker);

alter table public.vahan_two_wheeler_monthly_uploads enable row level security;

create policy if not exists "vahan_two_wheeler_monthly_uploads_select_authenticated"
on public.vahan_two_wheeler_monthly_uploads
for select
to authenticated
using (true);

create policy if not exists "vahan_two_wheeler_monthly_uploads_write_service"
on public.vahan_two_wheeler_monthly_uploads
for all
to service_role
using (true)
with check (true);

create or replace function public.set_vahan_two_wheeler_monthly_uploads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vahan_two_wheeler_monthly_uploads_updated_at on public.vahan_two_wheeler_monthly_uploads;
create trigger trg_vahan_two_wheeler_monthly_uploads_updated_at
before update on public.vahan_two_wheeler_monthly_uploads
for each row
execute function public.set_vahan_two_wheeler_monthly_uploads_updated_at();
