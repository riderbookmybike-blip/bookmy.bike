-- Add explicit MH base ex-showroom column (numeric) to prevent accidental JSON-only loss.
alter table public.cat_skus_linear
add column if not exists ex_showroom_mh numeric(12,2);

-- Backfill column from existing price_mh JSON where numeric ex_showroom is present.
update public.cat_skus_linear
set ex_showroom_mh = (price_mh->>'ex_showroom')::numeric
where ex_showroom_mh is null
  and coalesce(price_mh->>'ex_showroom', '') ~ '^-?[0-9]+(\\.[0-9]+)?$';

-- Keep ex_showroom_mh and price_mh.ex_showroom synchronized in both directions.
create or replace function public.sync_linear_ex_showroom_mh()
returns trigger
language plpgsql
as $$
begin
  if new.price_mh is null then
    new.price_mh := '{}'::jsonb;
  end if;

  -- If explicit column is missing but JSON has numeric value, pull from JSON.
  if new.ex_showroom_mh is null
     and coalesce(new.price_mh->>'ex_showroom', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' then
    new.ex_showroom_mh := (new.price_mh->>'ex_showroom')::numeric;
  end if;

  -- If explicit column exists, enforce JSON mirror for existing consumers.
  if new.ex_showroom_mh is not null then
    new.price_mh := jsonb_set(
      coalesce(new.price_mh, '{}'::jsonb),
      '{ex_showroom}',
      to_jsonb(new.ex_showroom_mh),
      true
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_linear_ex_showroom_mh on public.cat_skus_linear;
create trigger trg_sync_linear_ex_showroom_mh
before insert or update on public.cat_skus_linear
for each row
execute function public.sync_linear_ex_showroom_mh();
