BEGIN;

CREATE OR REPLACE FUNCTION public.sync_linear_ex_showroom_mh()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  -- Legacy compatibility function.
  -- ex_showroom_mh column was removed; keep trigger harmless.
  if new.price_mh is null then
    new.price_mh := '{}'::jsonb;
  end if;

  return new;
end;
$function$;

COMMIT;
