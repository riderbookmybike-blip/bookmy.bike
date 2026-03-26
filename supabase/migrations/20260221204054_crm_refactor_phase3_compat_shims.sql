-- Temporary compatibility shim to keep server actions stable during phased refactor.
-- Uses JSON (not JSONB) columns to preserve zero-JSONB policy while supporting legacy payload shapes.

alter table public.crm_leads
    add column if not exists utm_data json,
    add column if not exists referral_data json,
    add column if not exists events_log json,
    add column if not exists price_snapshot json;

alter table public.crm_quotes
    add column if not exists commercials json;

alter table public.crm_bookings
    add column if not exists vehicle_details json,
    add column if not exists customer_details json,
    add column if not exists sales_order_snapshot json,
    add column if not exists lead_id uuid references public.crm_leads(id);

update public.crm_bookings b
set lead_id = q.lead_id
from public.crm_quotes q
where b.quote_id = q.id
  and b.lead_id is null
  and q.lead_id is not null;

create index if not exists idx_crm_bookings_lead_id
    on public.crm_bookings (lead_id)
    where lead_id is not null;

do $$
declare
  v_relkind "char";
begin
  select c.relkind
  into v_relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'crm_receipts';

  if v_relkind is null then
    execute 'create view public.crm_receipts as select * from public.crm_payments';
  elsif v_relkind = 'v' then
    execute 'create or replace view public.crm_receipts as select * from public.crm_payments';
  else
    raise notice 'Skipping crm_receipts view shim: relation exists as non-view (relkind=%)', v_relkind;
  end if;
end
$$;
