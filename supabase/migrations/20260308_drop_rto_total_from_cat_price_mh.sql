BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    ALTER TABLE public.cat_price_mh DROP COLUMN IF EXISTS rto_total;
  END IF;
END $$;

COMMIT;
