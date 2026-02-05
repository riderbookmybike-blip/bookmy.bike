-- Primary dealer mapping per district/state
create table if not exists public.id_primary_dealer_districts (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.id_tenants(id) on delete cascade,
    district text not null,
    state_code text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Ensure only one primary dealer per district/state
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'id_primary_dealer_districts_state_district_key'
    ) then
        alter table public.id_primary_dealer_districts
            add constraint id_primary_dealer_districts_state_district_key
            unique (state_code, district);
    end if;
end;
$$;

-- Keep updated_at fresh
create or replace function public.set_updated_at_primary_dealer_districts()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_primary_dealer_districts on public.id_primary_dealer_districts;
create trigger trg_set_updated_at_primary_dealer_districts
before update on public.id_primary_dealer_districts
for each row execute function public.set_updated_at_primary_dealer_districts();

-- RLS
alter table public.id_primary_dealer_districts enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'id_primary_dealer_districts'
          and policyname = 'Primary dealer mapping is readable'
    ) then
        create policy "Primary dealer mapping is readable"
        on public.id_primary_dealer_districts
        for select
        using (true);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'id_primary_dealer_districts'
          and policyname = 'Primary dealer mapping is writable by authenticated'
    ) then
        create policy "Primary dealer mapping is writable by authenticated"
        on public.id_primary_dealer_districts
        for all
        using (auth.role() = 'authenticated')
        with check (auth.role() = 'authenticated');
    end if;
end;
$$;

-- RPC: Set primary dealer for a district (atomic)
create or replace function public.set_primary_dealer_for_district(
    p_tenant_id uuid,
    p_district text,
    p_state_code text
) returns void
language plpgsql
security definer
as $$
begin
    -- Deactivate existing primary for this district/state
    update public.id_primary_dealer_districts
    set is_active = false
    where state_code = p_state_code
      and lower(district) = lower(p_district)
      and is_active = true;

    -- Upsert new primary mapping
    insert into public.id_primary_dealer_districts (tenant_id, district, state_code, is_active)
    values (p_tenant_id, p_district, p_state_code, true)
    on conflict (state_code, district)
    do update set tenant_id = excluded.tenant_id,
                  is_active = true,
                  updated_at = now();
end;
$$;
