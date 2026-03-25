-- Persistent visitor intent temperature tracking.
-- This migration is idempotent and safe to re-run.

alter table public.id_members
    add column if not exists visitor_temperature text;

alter table public.analytics_sessions
    add column if not exists visitor_temperature text;

create index if not exists idx_id_members_visitor_temperature
    on public.id_members (visitor_temperature)
    where visitor_temperature is not null;

create index if not exists idx_analytics_sessions_visitor_temperature
    on public.analytics_sessions (visitor_temperature)
    where visitor_temperature is not null;

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
    v_current text;
    v_new_rank int;
    v_curr_rank int;
    v_temp text := upper(coalesce(p_temp, ''));
begin
    v_new_rank := case v_temp when 'HOT' then 3 when 'WARM' then 2 when 'COLD' then 1 else 0 end;
    if v_new_rank = 0 then
        return;
    end if;

    if p_member_id is not null then
        select visitor_temperature into v_current
        from public.id_members
        where id = p_member_id;

        v_curr_rank := case coalesce(v_current, '') when 'HOT' then 3 when 'WARM' then 2 when 'COLD' then 1 else 0 end;

        if v_new_rank > v_curr_rank then
            update public.id_members
            set visitor_temperature = v_temp
            where id = p_member_id;
        end if;
    end if;

    -- analytics_sessions.id is UUID, while tracking payload session_id is text.
    -- Guard cast by regex so member escalation does not fail on non-UUID session IDs.
    if p_session_id is not null and p_session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        select visitor_temperature into v_current
        from public.analytics_sessions
        where id = p_session_id::uuid;

        v_curr_rank := case coalesce(v_current, '') when 'HOT' then 3 when 'WARM' then 2 when 'COLD' then 1 else 0 end;

        if v_new_rank > v_curr_rank then
            update public.analytics_sessions
            set visitor_temperature = v_temp
            where id = p_session_id::uuid;
        end if;
    end if;
end;
$$;

create or replace function public.get_platform_temperature_counts()
returns jsonb
language sql
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'HOT', (select count(*) from public.id_members where visitor_temperature = 'HOT'),
        'WARM', (select count(*) from public.id_members where visitor_temperature = 'WARM'),
        'COLD', (select count(*) from public.id_members where visitor_temperature = 'COLD')
    );
$$;
