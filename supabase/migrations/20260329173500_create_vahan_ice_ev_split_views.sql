create or replace view public.vahan_two_wheeler_monthly_ice_ev_split as
with total as (
    select
        state_code,
        state_name,
        rto_code,
        rto_name,
        year,
        month_no,
        month_label,
        maker,
        brand_name,
        sum(units)::bigint as total_units
    from public.vahan_two_wheeler_monthly_uploads
    group by state_code, state_name, rto_code, rto_name, year, month_no, month_label, maker, brand_name
),
ev as (
    select
        state_code,
        rto_code,
        year,
        month_no,
        maker,
        sum(units)::bigint as ev_units
    from public.vahan_two_wheeler_monthly_fuel_uploads
    where upper(fuel_bucket) = 'EV'
    group by state_code, rto_code, year, month_no, maker
)
select
    t.state_code,
    t.state_name,
    t.rto_code,
    t.rto_name,
    t.year,
    t.month_no,
    t.month_label,
    t.maker,
    t.brand_name,
    t.total_units,
    coalesce(e.ev_units, 0)::bigint as ev_units,
    greatest(t.total_units - coalesce(e.ev_units, 0), 0)::bigint as ice_units
from total t
left join ev e
  on e.state_code = t.state_code
 and e.rto_code = t.rto_code
 and e.year = t.year
 and e.month_no = t.month_no
 and e.maker = t.maker;

create or replace view public.vahan_two_wheeler_daily_ice_ev_split as
with total as (
    select
        snapshot_date,
        state_code,
        state_name,
        rto_code,
        rto_name,
        year,
        month_no,
        month_label,
        maker,
        brand_name,
        sum(units)::bigint as total_units
    from public.vahan_two_wheeler_daily_snapshots
    group by snapshot_date, state_code, state_name, rto_code, rto_name, year, month_no, month_label, maker, brand_name
),
ev as (
    select
        snapshot_date,
        state_code,
        rto_code,
        year,
        month_no,
        maker,
        sum(units)::bigint as ev_units
    from public.vahan_two_wheeler_fuel_daily_snapshots
    where upper(fuel_bucket) = 'EV'
    group by snapshot_date, state_code, rto_code, year, month_no, maker
)
select
    t.snapshot_date,
    t.state_code,
    t.state_name,
    t.rto_code,
    t.rto_name,
    t.year,
    t.month_no,
    t.month_label,
    t.maker,
    t.brand_name,
    t.total_units,
    coalesce(e.ev_units, 0)::bigint as ev_units,
    greatest(t.total_units - coalesce(e.ev_units, 0), 0)::bigint as ice_units
from total t
left join ev e
  on e.snapshot_date = t.snapshot_date
 and e.state_code = t.state_code
 and e.rto_code = t.rto_code
 and e.year = t.year
 and e.month_no = t.month_no
 and e.maker = t.maker;

