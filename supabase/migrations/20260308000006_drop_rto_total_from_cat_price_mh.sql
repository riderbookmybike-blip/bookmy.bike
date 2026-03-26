BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.cat_price_mh DROP COLUMN IF EXISTS rto_total;
    EXCEPTION
      WHEN dependent_objects_still_exist THEN
        RAISE NOTICE 'Skipping drop of cat_price_mh.rto_total due to dependent objects';
    END;
  END IF;
END $$;

COMMIT;
