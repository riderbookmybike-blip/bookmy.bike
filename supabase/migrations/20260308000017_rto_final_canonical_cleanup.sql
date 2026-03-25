BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='cat_price_mh' AND c.relkind='r'
  ) THEN
    -- Compatibility path: keep schema as-is, only ensure ordered view exists.
    DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;
    CREATE VIEW public.v_cat_price_mh_ordered AS
    SELECT *
    FROM public.cat_price_mh;
  ELSE
    RAISE NOTICE 'Skipping final RTO canonical cleanup: public.cat_price_mh is missing or not a table';
  END IF;
END $$;

COMMIT;
