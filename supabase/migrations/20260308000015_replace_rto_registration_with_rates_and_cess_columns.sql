BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='cat_price_mh' AND c.relkind='r'
  ) THEN
    ALTER TABLE public.cat_price_mh
      ADD COLUMN IF NOT EXISTS rto_registration_fee_state numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_registration_fee_bh numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_registration_fee_company numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_cess_rate_state numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_cess_rate_bh numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_cess_rate_company numeric(5,2),
      ADD COLUMN IF NOT EXISTS rto_cess_amount_state numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_cess_amount_bh numeric(12,2),
      ADD COLUMN IF NOT EXISTS rto_cess_amount_company numeric(12,2);

    DROP VIEW IF EXISTS public.v_cat_price_mh_ordered;
    CREATE VIEW public.v_cat_price_mh_ordered AS
    SELECT *
    FROM public.cat_price_mh;

    ALTER TABLE public.cat_price_mh
      DROP COLUMN IF EXISTS rto_registration;
  ELSE
    RAISE NOTICE 'Skipping rto_registration replacement: public.cat_price_mh is missing or not a table';
  END IF;
END $$;

COMMIT;
