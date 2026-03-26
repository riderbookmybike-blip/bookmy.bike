BEGIN;

DO $$
BEGIN
  IF to_regclass('public.cat_price_mh') IS NOT NULL THEN
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS hsn_insurance text,
      ADD COLUMN IF NOT EXISTS gst_rate_insurance numeric(5,2);

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_price'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon1_amount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon1_price TO addon1_amount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_price'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cat_price_mh' AND column_name='addon2_amount'
    ) THEN
      ALTER TABLE public.cat_price_mh RENAME COLUMN addon2_price TO addon2_amount;
    END IF;

    DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;
    CREATE VIEW public.v_cat_price_mh_ordered AS
    SELECT *
    FROM public.cat_price_mh;
  ELSE
    RAISE NOTICE 'Skipping insurance/addon rename: public.cat_price_mh not found';
  END IF;
END $$;

COMMIT;
