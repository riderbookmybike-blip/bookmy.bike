-- Phase 2: split persistent intent into current vs max with decay support.
-- Backward compatible with existing visitor_temperature readers.

alter table public.id_members
    add column if not exists current_temperature text,
    add column if not exists max_temperature text,
    add column if not exists last_pdp_at timestamptz,
    add column if not exists last_catalog_at timestamptz,
    add column if not exists last_landing_at timestamptz,
    add column if not exists last_temperature_change_at timestamptz;

alter table public.analytics_sessions
    add column if not exists current_temperature text,
    add column if not exists max_temperature text,
    add column if not exists last_pdp_at timestamptz,
    add column if not exists last_catalog_at timestamptz,
    add column if not exists last_landing_at timestamptz,
    add column if not exists last_temperature_change_at timestamptz;

update public.id_members
set
    current_temperature = coalesce(current_temperature, visitor_temperature),
    max_temperature = coalesce(max_temperature, visitor_temperature)
where current_temperature is null
   or max_temperature is null;

update public.analytics_sessions
set
    current_temperature = coalesce(current_temperature, visitor_temperature),
    max_temperature = coalesce(max_temperature, visitor_temperature)
where current_temperature is null
   or max_temperature is null;

create index if not exists idx_id_members_current_temperature
    on public.id_members(current_temperature)
    where current_temperature is not null;

create index if not exists idx_id_members_max_temperature
    on public.id_members(max_temperature)
    where max_temperature is not null;

create index if not exists idx_id_members_last_pdp_at
    on public.id_members(last_pdp_at desc nulls last)
    where last_pdp_at is not null;

create index if not exists idx_id_members_last_catalog_at
    on public.id_members(last_catalog_at desc nulls last)
    where last_catalog_at is not null;

create or replace function public.intent_rank(p_temp text)
returns int
language sql
immutable
as $$
    select case upper(coalesce(p_temp, ''))
        when 'HOT' then 3
        when 'WARM' then 2
        when 'COLD' then 1
        else 0
    end;
$$;

create or replace function public.escalate_visitor_temperature(
    p_member_id uuid,
    p_session_id text,
    p_temp text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_temp text := upper(coalesce(p_temp, ''));
    v_now timestamptz := now();
    v_session_uuid uuid;
begin
    if public.intent_rank(v_temp) = 0 then
        return;
    end if;

    if p_member_id is not null then
        update public.id_members
        set
            current_temperature = case
                when public.intent_rank(v_temp) > public.intent_rank(current_temperature) then v_temp
                else current_temperature
            end,
            max_temperature = case
                when public.intent_rank(v_temp) > public.intent_rank(max_temperature) then v_temp
                else max_temperature
            end,
            visitor_temperature = case
                when public.intent_rank(v_temp) > public.intent_rank(coalesce(current_temperature, visitor_temperature)) then v_temp
                else coalesce(current_temperature, visitor_temperature)
            end,
            last_temperature_change_at = case
                when public.intent_rank(v_temp) > public.intent_rank(current_temperature) then v_now
                else last_temperature_change_at
            end,
            last_landing_at = coalesce(last_landing_at, v_now),
            last_catalog_at = case
                when v_temp in ('WARM', 'COLD') then v_now
                else last_catalog_at
            end,
            last_pdp_at = case
                when v_temp = 'HOT' then v_now
                else last_pdp_at
            end,
            last_visit_at = v_now
        where id = p_member_id;
    end if;

    if p_session_id is not null
       and p_session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then
        v_session_uuid := p_session_id::uuid;
        update public.analytics_sessions
        set
            current_temperature = case
                when public.intent_rank(v_temp) > public.intent_rank(current_temperature) then v_temp
                else current_temperature
            end,
            max_temperature = case
                when public.intent_rank(v_temp) > public.intent_rank(max_temperature) then v_temp
                else max_temperature
            end,
            visitor_temperature = case
                when public.intent_rank(v_temp) > public.intent_rank(coalesce(current_temperature, visitor_temperature)) then v_temp
                else coalesce(current_temperature, visitor_temperature)
            end,
            last_temperature_change_at = case
                when public.intent_rank(v_temp) > public.intent_rank(current_temperature) then v_now
                else last_temperature_change_at
            end,
            last_landing_at = coalesce(last_landing_at, v_now),
            last_catalog_at = case
                when v_temp in ('WARM', 'COLD') then v_now
                else last_catalog_at
            end,
            last_pdp_at = case
                when v_temp = 'HOT' then v_now
                else last_pdp_at
            end
        where id = v_session_uuid;
    end if;
end;
$$;

create or replace function public.apply_visitor_temperature_decay(
    p_hot_to_warm_hours int default 6,
    p_warm_to_cold_hours int default 72
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_hot_to_warm int := 0;
    v_warm_to_cold int := 0;
begin
    with hot_demote as (
        update public.id_members m
        set
            current_temperature = 'WARM',
            visitor_temperature = 'WARM',
            last_temperature_change_at = now()
        where m.current_temperature = 'HOT'
          and coalesce(m.last_pdp_at, m.last_visit_at, m.created_at) < now() - make_interval(hours => greatest(1, p_hot_to_warm_hours))
        returning 1
    )
    select count(*) into v_hot_to_warm from hot_demote;

    with warm_demote as (
        update public.id_members m
        set
            current_temperature = 'COLD',
            visitor_temperature = 'COLD',
            last_temperature_change_at = now()
        where m.current_temperature = 'WARM'
          and coalesce(m.last_catalog_at, m.last_visit_at, m.created_at) < now() - make_interval(hours => greatest(1, p_warm_to_cold_hours))
        returning 1
    )
    select count(*) into v_warm_to_cold from warm_demote;

    update public.analytics_sessions s
    set
        current_temperature = 'WARM',
        visitor_temperature = 'WARM',
        last_temperature_change_at = now()
    where s.current_temperature = 'HOT'
      and coalesce(s.last_pdp_at, s.last_active_at, s.created_at) < now() - make_interval(hours => greatest(1, p_hot_to_warm_hours));

    update public.analytics_sessions s
    set
        current_temperature = 'COLD',
        visitor_temperature = 'COLD',
        last_temperature_change_at = now()
    where s.current_temperature = 'WARM'
      and coalesce(s.last_catalog_at, s.last_active_at, s.created_at) < now() - make_interval(hours => greatest(1, p_warm_to_cold_hours));

    return jsonb_build_object(
        'hot_to_warm', v_hot_to_warm,
        'warm_to_cold', v_warm_to_cold
    );
end;
$$;

create or replace function public.get_platform_temperature_counts()
returns jsonb
language sql
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'HOT', (select count(*) from public.id_members where current_temperature = 'HOT'),
        'WARM', (select count(*) from public.id_members where current_temperature = 'WARM'),
        'COLD', (select count(*) from public.id_members where current_temperature = 'COLD'),
        'MAX_HOT', (select count(*) from public.id_members where max_temperature = 'HOT'),
        'MAX_WARM', (select count(*) from public.id_members where max_temperature = 'WARM'),
        'MAX_COLD', (select count(*) from public.id_members where max_temperature = 'COLD')
    );
$$;
