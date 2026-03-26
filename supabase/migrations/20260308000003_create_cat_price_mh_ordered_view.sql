BEGIN;

-- Canonical ordered projection for pricing consumers.
-- Keeps physical table untouched and works with legacy schema variants.
DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NULL THEN
    RAISE NOTICE 'Skipping v_cat_price_mh_ordered view creation: cat_price_mh missing';
    RETURN;
  END IF;

  EXECUTE 'CREATE OR REPLACE VIEW public.v_cat_price_mh_ordered AS SELECT * FROM public.cat_price_mh';
END
$$;

COMMIT;
