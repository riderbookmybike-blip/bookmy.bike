create or replace view public.vahan_two_wheeler_monthly_ice_ev_split as
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
    total_units,
    ev_units,
    ice_units
from public.vahan_two_wheeler_monthly_ice_ev_split_validated;
