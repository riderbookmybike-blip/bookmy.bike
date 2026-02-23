create or replace function public.transition_booking_stage(
    p_booking_id uuid,
    p_to_stage public.crm_operational_stage,
    p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor_id uuid := auth.uid();
    v_booking crm_bookings%rowtype;
    v_current_stage public.crm_operational_stage;
    v_prev_stage public.crm_operational_stage;
    v_allowed_forward public.crm_operational_stage[];
    v_is_backward boolean := false;
    v_paid_total numeric := 0;
begin
    if v_actor_id is null then
        return jsonb_build_object('success', false, 'message', 'Authentication required');
    end if;

    select *
    into v_booking
    from public.crm_bookings
    where id = p_booking_id
      and is_deleted = false
    for update;

    if not found then
        return jsonb_build_object('success', false, 'message', 'Booking not found');
    end if;

    if not exists (
        select 1
        from public.id_team t
        where t.user_id = v_actor_id
          and t.tenant_id = v_booking.tenant_id
          and coalesce(t.status, 'ACTIVE') <> 'INACTIVE'
    ) then
        return jsonb_build_object('success', false, 'message', 'You do not have access to this booking');
    end if;

    v_current_stage := v_booking.operational_stage;

    if v_current_stage is null then
        return jsonb_build_object('success', false, 'message', 'Booking has no operational_stage');
    end if;

    if v_current_stage = p_to_stage then
        return jsonb_build_object('success', true, 'message', 'Stage unchanged', 'from_stage', v_current_stage, 'to_stage', p_to_stage);
    end if;

    v_allowed_forward := case v_current_stage
        when 'QUOTE' then array['BOOKING']::public.crm_operational_stage[]
        when 'BOOKING' then array['PAYMENT']::public.crm_operational_stage[]
        when 'PAYMENT' then array['FINANCE','ALLOTMENT']::public.crm_operational_stage[]
        when 'FINANCE' then array['ALLOTMENT']::public.crm_operational_stage[]
        when 'ALLOTMENT' then array['PDI']::public.crm_operational_stage[]
        when 'PDI' then array['INSURANCE','COMPLIANCE']::public.crm_operational_stage[]
        when 'INSURANCE' then array['REGISTRATION','COMPLIANCE']::public.crm_operational_stage[]
        when 'REGISTRATION' then array['COMPLIANCE']::public.crm_operational_stage[]
        when 'COMPLIANCE' then array['DELIVERY']::public.crm_operational_stage[]
        when 'DELIVERY' then array['DELIVERED']::public.crm_operational_stage[]
        when 'DELIVERED' then array['FEEDBACK']::public.crm_operational_stage[]
        else array[]::public.crm_operational_stage[]
    end;

    v_prev_stage := case v_current_stage
        when 'BOOKING' then 'QUOTE'::public.crm_operational_stage
        when 'PAYMENT' then 'BOOKING'::public.crm_operational_stage
        when 'FINANCE' then 'PAYMENT'::public.crm_operational_stage
        when 'ALLOTMENT' then 'FINANCE'::public.crm_operational_stage
        when 'PDI' then 'ALLOTMENT'::public.crm_operational_stage
        when 'INSURANCE' then 'PDI'::public.crm_operational_stage
        when 'REGISTRATION' then 'INSURANCE'::public.crm_operational_stage
        when 'COMPLIANCE' then 'REGISTRATION'::public.crm_operational_stage
        when 'DELIVERY' then 'COMPLIANCE'::public.crm_operational_stage
        when 'DELIVERED' then 'DELIVERY'::public.crm_operational_stage
        when 'FEEDBACK' then 'DELIVERED'::public.crm_operational_stage
        else null
    end;

    v_is_backward := (v_prev_stage is not null and p_to_stage = v_prev_stage);

    if not (p_to_stage = any(v_allowed_forward) or v_is_backward) then
        return jsonb_build_object(
            'success', false,
            'message', format('Cannot transition from %s to %s', v_current_stage, p_to_stage),
            'from_stage', v_current_stage,
            'to_stage', p_to_stage
        );
    end if;

    if not v_is_backward then
        case p_to_stage
            when 'PAYMENT' then
                if coalesce(v_booking.status, '') not in ('BOOKED', 'CONFIRMED') then
                    return jsonb_build_object('success', false, 'message', 'BOOKING must be BOOKED/CONFIRMED before PAYMENT');
                end if;

            when 'FINANCE' then
                if not exists (select 1 from public.crm_finance f where f.booking_id = p_booking_id) then
                    return jsonb_build_object('success', false, 'message', 'Finance application is required before FINANCE stage');
                end if;

            when 'ALLOTMENT' then
                if not exists (
                    select 1
                    from public.crm_allotments a
                    where a.booking_id = p_booking_id
                      and a.inv_stock_id is not null
                ) then
                    return jsonb_build_object('success', false, 'message', 'Allotment with inv_stock_id is required before ALLOTMENT stage');
                end if;

            when 'PDI' then
                if not exists (
                    select 1
                    from public.crm_allotments a
                    where a.booking_id = p_booking_id
                      and a.status = 'HARD_LOCK'
                ) then
                    return jsonb_build_object('success', false, 'message', 'HARD_LOCK allotment is required before PDI stage');
                end if;

            when 'INSURANCE' then
                if not exists (
                    select 1
                    from public.crm_pdi p
                    where p.booking_id = p_booking_id
                      and p.status = 'PASSED'
                ) then
                    return jsonb_build_object('success', false, 'message', 'PASSED PDI is required before INSURANCE stage');
                end if;

            when 'REGISTRATION' then
                if not exists (
                    select 1
                    from public.crm_insurance i
                    where i.booking_id = p_booking_id
                      and i.status = 'ACTIVE'
                ) then
                    return jsonb_build_object('success', false, 'message', 'ACTIVE insurance is required before REGISTRATION stage');
                end if;

            when 'COMPLIANCE' then
                if not exists (
                    select 1
                    from public.crm_registration r
                    where r.booking_id = p_booking_id
                      and r.status = 'COMPLETED'
                ) then
                    return jsonb_build_object('success', false, 'message', 'COMPLETED registration is required before COMPLIANCE stage');
                end if;

            when 'DELIVERY' then
                if v_current_stage <> 'COMPLIANCE' then
                    return jsonb_build_object('success', false, 'message', 'Booking must be in COMPLIANCE before DELIVERY');
                end if;

            when 'DELIVERED' then
                select coalesce(sum(p.amount), 0)
                into v_paid_total
                from public.crm_payments p
                where p.booking_id = p_booking_id
                  and coalesce(p.is_deleted, false) = false
                  and coalesce(p.status, '') in ('SUCCESS', 'CONFIRMED', 'PAID', 'RECEIVED');

                if coalesce(v_booking.grand_total, 0) > 0 and v_paid_total < v_booking.grand_total then
                    return jsonb_build_object('success', false, 'message', 'Full payment is required before DELIVERED stage');
                end if;

                if v_booking.delivery_date is null and coalesce(p_reason, '') !~* 'handover' then
                    return jsonb_build_object('success', false, 'message', 'Delivery handover confirmation is required before DELIVERED stage');
                end if;

            when 'FEEDBACK' then
                if not exists (
                    select 1
                    from public.crm_feedback f
                    where f.booking_id = p_booking_id
                ) then
                    return jsonb_build_object('success', false, 'message', 'Feedback row is required before FEEDBACK stage');
                end if;
        end case;
    end if;

    update public.crm_bookings
    set operational_stage = p_to_stage,
        stage_updated_at = now(),
        stage_updated_by = v_actor_id,
        updated_at = now(),
        status = case when p_to_stage = 'DELIVERED' then 'DELIVERED' else status end
    where id = p_booking_id
      and operational_stage = v_current_stage;

    if not found then
        return jsonb_build_object('success', false, 'message', 'Stage was modified by another user. Please refresh and retry.');
    end if;

    insert into public.crm_booking_stage_events (
        booking_id,
        from_stage,
        to_stage,
        reason,
        changed_by,
        changed_at
    )
    values (
        p_booking_id,
        v_current_stage,
        p_to_stage,
        nullif(trim(coalesce(p_reason, '')), ''),
        v_actor_id,
        now()
    );

    return jsonb_build_object(
        'success', true,
        'message', 'Stage updated',
        'from_stage', v_current_stage,
        'to_stage', p_to_stage
    );
end;
$$;

revoke all on function public.transition_booking_stage(uuid, public.crm_operational_stage, text) from public;
grant execute on function public.transition_booking_stage(uuid, public.crm_operational_stage, text) to authenticated;
grant execute on function public.transition_booking_stage(uuid, public.crm_operational_stage, text) to service_role;
