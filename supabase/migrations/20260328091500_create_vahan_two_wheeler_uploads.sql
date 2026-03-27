create table if not exists public.vahan_two_wheeler_uploads (
    id bigserial primary key,
    state_code text not null default 'MH',
    state_name text not null default 'Maharashtra',
    year integer not null check (year >= 2000 and year <= 2100),
    axis text not null check (axis in ('RTO', 'MAKER')),
    row_label text not null,
    m_cycle_scooter bigint not null default 0,
    moped bigint not null default 0,
    motorised_cycle_gt_25cc bigint not null default 0,
    two_wheeler_total bigint not null default 0,
    source_file_name text,
    uploaded_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint vahan_two_wheeler_uploads_uq unique (state_code, year, axis, row_label)
);

create index if not exists idx_vahan_two_wheeler_uploads_state_year_axis
    on public.vahan_two_wheeler_uploads (state_code, year, axis);

create index if not exists idx_vahan_two_wheeler_uploads_axis_total
    on public.vahan_two_wheeler_uploads (axis, two_wheeler_total desc);

alter table public.vahan_two_wheeler_uploads enable row level security;

create policy if not exists "vahan_two_wheeler_uploads_select_authenticated"
on public.vahan_two_wheeler_uploads
for select
to authenticated
using (true);

create policy if not exists "vahan_two_wheeler_uploads_write_service"
on public.vahan_two_wheeler_uploads
for all
to service_role
using (true)
with check (true);

create or replace function public.set_vahan_two_wheeler_uploads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vahan_two_wheeler_uploads_updated_at on public.vahan_two_wheeler_uploads;
create trigger trg_vahan_two_wheeler_uploads_updated_at
before update on public.vahan_two_wheeler_uploads
for each row
execute function public.set_vahan_two_wheeler_uploads_updated_at();
