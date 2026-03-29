create or replace view public.vahan_two_wheeler_monthly_fuel_qa_issues as
with total_norm as (
    select
        state_code,
        state_name,
        rto_code,
        rto_name,
        year,
        month_no,
        month_label,
        upper(
            regexp_replace(
                regexp_replace(coalesce(maker, ''), '\(IMPORTER:[^)]+\)', '', 'gi'),
                '\s+',
                ' ',
                'g'
            )
        ) as maker_key,
        sum(units)::bigint as total_units
    from public.vahan_two_wheeler_monthly_uploads
    group by state_code, state_name, rto_code, rto_name, year, month_no, month_label, maker_key
),
ev_norm as (
    select
        state_code,
        rto_code,
        year,
        month_no,
        upper(
            regexp_replace(
                regexp_replace(coalesce(maker, ''), '\(IMPORTER:[^)]+\)', '', 'gi'),
                '\s+',
                ' ',
                'g'
            )
        ) as maker_key,
        sum(units)::bigint as ev_units
    from public.vahan_two_wheeler_monthly_fuel_uploads
    where upper(fuel_bucket) = 'EV'
    group by state_code, rto_code, year, month_no, maker_key
)
select
    coalesce(e.state_code, t.state_code) as state_code,
    t.state_name,
    coalesce(e.rto_code, t.rto_code) as rto_code,
    t.rto_name,
    coalesce(e.year, t.year) as year,
    coalesce(e.month_no, t.month_no) as month_no,
    t.month_label,
    coalesce(e.maker_key, t.maker_key) as maker_key,
    t.total_units,
    e.ev_units,
    case
        when t.total_units is null then 'EV_WITHOUT_TOTAL'
        when e.ev_units is null then 'NO_EV_ROW'
        when e.ev_units > t.total_units then 'EV_GT_TOTAL'
        else 'OK'
    end as issue_type
from ev_norm e
full outer join total_norm t
  on t.state_code = e.state_code
 and t.rto_code = e.rto_code
 and t.year = e.year
 and t.month_no = e.month_no
 and t.maker_key = e.maker_key
where
    t.total_units is null
    or e.ev_units is null
    or e.ev_units > t.total_units;

create or replace view public.vahan_two_wheeler_monthly_ice_ev_split_validated as
with total_norm as (
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
        upper(
            regexp_replace(
                regexp_replace(coalesce(maker, ''), '\(IMPORTER:[^)]+\)', '', 'gi'),
                '\s+',
                ' ',
                'g'
            )
        ) as maker_key,
        sum(units)::bigint as total_units
    from public.vahan_two_wheeler_monthly_uploads
    group by state_code, state_name, rto_code, rto_name, year, month_no, month_label, maker, brand_name, maker_key
),
ev_norm as (
    select
        state_code,
        rto_code,
        year,
        month_no,
        upper(
            regexp_replace(
                regexp_replace(coalesce(maker, ''), '\(IMPORTER:[^)]+\)', '', 'gi'),
                '\s+',
                ' ',
                'g'
            )
        ) as maker_key,
        sum(units)::bigint as ev_units
    from public.vahan_two_wheeler_monthly_fuel_uploads
    where upper(fuel_bucket) = 'EV'
    group by state_code, rto_code, year, month_no, maker_key
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
    coalesce(e.ev_units, 0)::bigint as ev_units_raw,
    case
        when e.ev_units is null then 0::bigint
        when e.ev_units > t.total_units then 0::bigint
        else e.ev_units::bigint
    end as ev_units,
    greatest(
        t.total_units - (
            case
                when e.ev_units is null then 0::bigint
                when e.ev_units > t.total_units then 0::bigint
                else e.ev_units::bigint
            end
        ),
        0
    )::bigint as ice_units,
    case
        when e.ev_units is null then true
        when e.ev_units > t.total_units then false
        else true
    end as ev_row_valid,
    case
        when e.ev_units is null then 'NO_EV_ROW'
        when e.ev_units > t.total_units then 'EV_GT_TOTAL'
        else 'OK'
    end as ev_quality_status
from total_norm t
left join ev_norm e
  on e.state_code = t.state_code
 and e.rto_code = t.rto_code
 and e.year = t.year
 and e.month_no = t.month_no
 and e.maker_key = t.maker_key;
